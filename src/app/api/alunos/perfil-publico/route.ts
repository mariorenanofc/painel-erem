import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matriculaAlvo = searchParams.get("matriculaAlvo")?.trim();
  const matriculaVisualizador = searchParams.get("matriculaVisualizador")?.trim();

  if (!matriculaAlvo || !matriculaVisualizador) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  try {
    // 1. Carregar perfil do Aluno Alvo
    const alunoDoc = await dbAdmin.collection("alunos").doc(matriculaAlvo).get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno alvo não encontrado." }, { status: 404 });
    }
    const val = alunoDoc.data()!;

    const perfil = {
      matricula: matriculaAlvo,
      nome: val.nome || "",
      turma: val.turma || val.turmaTrilha || "",
      xpTotal: val.xp || 0,
      nivel: val.nivel || "Hello World",
      avatar: val.avatarId || "avatar-padrao",
      totalCurtidas: val.likes || 0,
      jaCurtiuHoje: false,
      missoesConcluidas: 0,
      pixEnviado: 0,
      pixRecebido: 0,
      badges: [] as string[],
      ofensivaDias: 0
    };

    // 2. Calcular entregas, badges, Pix
    const entregasSnap = await dbAdmin.collection("entregas").where("matricula", "==", matriculaAlvo).get();
    const missoesUnicas = new Set<string>();

    entregasSnap.forEach((doc: QueryDocumentSnapshot) => {
      const idEntrega = doc.id;
      const v = doc.data();

      if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) {
        perfil.pixRecebido += Number(v.xpGanho) || 0;
      }
      if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
        perfil.pixEnviado += Math.abs(Number(v.xpGanho) || 0);
      }
      if (idEntrega.startsWith("BADGE-")) {
        const nomeBadge = String(v.resposta || "").replace("Desbloqueou: ", "").trim();
        perfil.badges.push(nomeBadge);
      }
      if (!idEntrega.startsWith("PIX") && !idEntrega.startsWith("BDAY") && !idEntrega.startsWith("BADGE") && !idEntrega.startsWith("BLOCK") && v.status !== "Pendente" && v.status !== "EXCLUIDA") {
        missoesUnicas.add(String(v.idAtividade));
      }
    });
    perfil.missoesConcluidas = missoesUnicas.size;

    // 3. Verificação de curtida (Like) de hoje
    if (matriculaVisualizador === matriculaAlvo) {
      perfil.jaCurtiuHoje = true;
    } else {
      const hj = new Date();
      const diaHoje = String(hj.getDate()).padStart(2, "0");
      const mesHoje = String(hj.getMonth() + 1).padStart(2, "0");
      const anoHoje = String(hj.getFullYear());
      const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;

      const likeSnap = await dbAdmin.collection("curtidas")
        .where("remetente", "==", matriculaVisualizador)
        .where("destinatario", "==", matriculaAlvo)
        .where("data", "==", dataHojeStr)
        .limit(1)
        .get();

      if (!likeSnap.empty) {
        perfil.jaCurtiuHoje = true;
      }
    }

    // 4. Calcular Streak do Aluno Alvo
    if (perfil.turma) {
      const diasComAulaSet = new Set<string>();
      const turmaDoAluno = perfil.turma;
      const turmaFreqSnap = await dbAdmin.collection("frequencia").where("turma", "==", turmaDoAluno).get();
      turmaFreqSnap.forEach((doc: QueryDocumentSnapshot) => {
        const f = doc.data();
        const idFreq = String(f.id || doc.id).trim();
        if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
        const dataFormatada = f.data || "";
        if (dataFormatada) diasComAulaSet.add(dataFormatada);
      });

      const checkinsMap: Record<string, boolean> = {};

      const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "==", matriculaAlvo).get();
      freqSnap.forEach((doc: QueryDocumentSnapshot) => {
        const f = doc.data();
        const idFreq = String(f.id || doc.id).trim();
        if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
        const dataFormatada = f.data || "";
        if (!dataFormatada) return;

        diasComAulaSet.add(dataFormatada);

        checkinsMap[dataFormatada] = true;
      });

      const diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
        const pA = a.split("/");
        const pB = b.split("/");
        return new Date(Number(pB[2]), Number(pB[1]) - 1, Number(pB[0])).getTime() - new Date(Number(pA[2]), Number(pA[1]) - 1, Number(pA[0])).getTime();
      });

      let streak = 0;
      const hj2 = new Date();
      const diaHoje2 = String(hj2.getDate()).padStart(2, "0");
      const mesHoje2 = String(hj2.getMonth() + 1).padStart(2, "0");
      const anoHoje2 = String(hj2.getFullYear());
      const dataHojeStr2 = `${diaHoje2}/${mesHoje2}/${anoHoje2}`;

      for (const dia of diasOrdenados) {
        if (dia === dataHojeStr2 && !checkinsMap[dia]) continue;
        if (checkinsMap[dia]) streak++;
        else break;
      }
      perfil.ofensivaDias = streak;
    }

    return NextResponse.json({ status: "sucesso", perfil });
  } catch (error: unknown) {
    const err = error as Error;
    // 🛡️ REGRAS DE FAILOVER PARA GOOGLE SHEETS
    console.warn(`[Failover] Erro ao buscar perfil público no Firestore: ${err.message}. Redirecionando para Google Sheets...`);

    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "buscar_perfil_publico",
            matriculaVisualizador,
            matriculaAlvo
          }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: unknown) {
        const sErr = sheetsErr as Error;
        return NextResponse.json({ error: "Erro crítico em ambos os bancos: " + sErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Erro ao buscar perfil público: " + err.message }, { status: 500 });
  }
}
