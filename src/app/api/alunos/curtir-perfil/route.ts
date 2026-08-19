import { invalidatePortalCache,  } from "@/src/lib/cache";
import { NextResponse } from "next/server";
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function POST(request: Request) {
  let matriculaRemetente = "";
  let matriculaDestinatario = "";
  try {
    const body = await request.json();
    matriculaRemetente = String(body.matriculaRemetente || "").trim();
    matriculaDestinatario = String(body.matriculaDestinatario || "").trim();

    if (!matriculaRemetente || !matriculaDestinatario) {
      return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    if (matriculaRemetente === matriculaDestinatario) {
      return NextResponse.json({ status: "erro", mensagem: "Você não pode curtir o próprio perfil!" });
    }

    // 1. Obter data de hoje em São Paulo
    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const diaHoje = String(spDate.getDate()).padStart(2, "0");
    const mesHoje = String(spDate.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(spDate.getFullYear());
    const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;

    // 2. Verificar se já curtiu hoje
    const likeSnap = await dbAdmin.collection("curtidas")
      .where("remetente", "==", matriculaRemetente)
      .where("destinatario", "==", matriculaDestinatario)
      .where("data", "==", dataHojeStr)
      .limit(1)
      .get();

    if (!likeSnap.empty) {
      return NextResponse.json({ status: "erro", mensagem: "Você já curtiu o perfil desta Lenda hoje. Volte amanhã!" });
    }

    const destRef = dbAdmin.collection("alunos").doc(matriculaDestinatario);
    const destDoc = await destRef.get();
    if (!destDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Perfil do destinatário não encontrado." });
    }

    // 3. Registrar Like em Transação
    const timestamp = Date.now();
    const likeId = `LIKE-${timestamp}`;
    const likeRef = dbAdmin.collection("curtidas").doc(likeId);

    await dbAdmin.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      const freshDest = (await transaction.get(destRef)).data()!;
      const currentLikes = Number(freshDest.likes) || 0;

      // Inserir registro de curtida
      transaction.set(likeRef, {
        id: likeId,
        remetente: matriculaRemetente,
        destinatario: matriculaDestinatario,
        data: dataHojeStr,
        timestamp
      });

      // Incrementar curtida e marcar lastUpdated
      transaction.update(destRef, {
        likes: currentLikes + 1,
        lastUpdated: timestamp
      });
    });

    invalidatePortalCache(matriculaRemetente);
    invalidatePortalCache(matriculaDestinatario);

    return NextResponse.json({ status: "sucesso", mensagem: "Perfil curtido com sucesso!" });

  } catch (error: unknown) {
    console.warn("[Failover] Erro ao curtir perfil no Firestore:", (error as Error).message);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "curtir_perfil", matriculaRemetente, matriculaDestinatario }),
        });
        return NextResponse.json(await response.json());
      } catch (sheetsErr) {}
    }
    return NextResponse.json({ status: "erro", mensagem: "Erro ao curtir perfil: " + (error as Error).message }, { status: 500 });
  }
}
