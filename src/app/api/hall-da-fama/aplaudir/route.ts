import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { invalidatePortalCache } from "@/src/lib/cache";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let matriculaRemetente = "";
  let matriculaDestinatario = "";

  try {
    const body = await request.json();
    matriculaRemetente = String(body.matriculaRemetente || "").trim();
    matriculaDestinatario = String(body.matriculaDestinatario || "").trim();

    // 1. Validação de Conexão: Apenas usuários logados podem aplaudir
    if (!matriculaRemetente || matriculaRemetente === "00000" || matriculaRemetente === "visitante") {
      return NextResponse.json({
        status: "erro",
        requerLogin: true,
        mensagem: "Você precisa estar conectado ao portal com sua matrícula para aplaudir!"
      }, { status: 401 });
    }

    if (!matriculaDestinatario) {
      return NextResponse.json({
        status: "erro",
        mensagem: "Matrícula do formando destinatário não informada."
      }, { status: 400 });
    }

    // 2. Não é permitido aplaudir a si mesmo
    if (matriculaRemetente === matriculaDestinatario) {
      return NextResponse.json({
        status: "erro",
        mensagem: "Você não pode aplaudir seu próprio memorial!"
      }, { status: 400 });
    }

    // 3. Obter data de hoje no fuso horário de Brasília (São Paulo)
    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const diaHoje = String(spDate.getDate()).padStart(2, "0");
    const mesHoje = String(spDate.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(spDate.getFullYear());
    const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;

    // 4. Verificar se o usuário já aplaudiu este formando hoje
    const aplausoExistenteSnap = await dbAdmin.collection("aplausos_memorial")
      .where("remetente", "==", matriculaRemetente)
      .where("destinatario", "==", matriculaDestinatario)
      .where("data", "==", dataHojeStr)
      .limit(1)
      .get();

    if (!aplausoExistenteSnap.empty) {
      return NextResponse.json({
        status: "ja_aplaudiu",
        mensagem: "Você já aplaudiu esta Lenda hoje! O limite é de 1 aplauso por dia por formando. Volte amanhã!"
      });
    }

    // 5. Validar existência do formando
    const destRef = dbAdmin.collection("alunos").doc(matriculaDestinatario);
    const destDoc = await destRef.get();
    if (!destDoc.exists) {
      return NextResponse.json({
        status: "erro",
        mensagem: "Formando não encontrado na base de dados."
      }, { status: 404 });
    }

    const timestamp = Date.now();
    const aplausoId = `APLAUSO-${timestamp}-${matriculaRemetente}`;
    const aplausoRef = dbAdmin.collection("aplausos_memorial").doc(aplausoId);

    // 6. Transação Atômica: Gravar aplauso e incrementar contador
    let novoTotalAplausos = 1;

    await dbAdmin.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      const freshDestSnap = await transaction.get(destRef);
      const freshDestData = freshDestSnap.data() || {};
      const memorialExistente = (freshDestData.memorialFormatura || {}) as Record<string, unknown>;
      const totalAtual = Number(memorialExistente.totalAplausos) || 0;
      novoTotalAplausos = totalAtual + 1;

      // Gravar registro de auditoria do aplauso diário
      transaction.set(aplausoRef, {
        id: aplausoId,
        remetente: matriculaRemetente,
        destinatario: matriculaDestinatario,
        data: dataHojeStr,
        timestamp
      });

      // Incrementar contador no memorial do aluno
      transaction.set(destRef, {
        memorialFormatura: {
          totalAplausos: novoTotalAplausos
        },
        lastUpdated: timestamp
      }, { merge: true });

      // Notificar o formando no portal_views
      const portalViewRef = dbAdmin.collection("portal_views").doc(matriculaDestinatario);
      transaction.set(portalViewRef, {
        notificacoes: FieldValue.arrayUnion({
          id: aplausoId,
          mensagem: "Você recebeu aplausos calorosos no Hall da Fama! 👏",
          xp: 0,
          tempo: timestamp,
          tipo: "APLAUSO"
        })
      }, { merge: true });
    });

    invalidatePortalCache(matriculaDestinatario);

    return NextResponse.json({
      status: "sucesso",
      mensagem: "Aplauso computado com sucesso! 👏",
      totalAplausos: novoTotalAplausos
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Aplauso API] Erro ao registrar aplauso:", err.message);
    return NextResponse.json({
      status: "erro",
      mensagem: "Erro ao computar aplauso: " + err.message
    }, { status: 500 });
  }
}
