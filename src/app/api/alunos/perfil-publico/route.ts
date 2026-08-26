export const dynamic = "force-dynamic";
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

    // 2. Tentar buscar dados de interações na View Consolidada (O(1))
    const portalViewDoc = await dbAdmin.collection("portal_views").doc(matriculaAlvo).get();
    let checkinsAtuais: string[] = [];
    
    if (portalViewDoc.exists) {
      const pData = portalViewDoc.data()!;
      
      // Missões
      const entregasMap = pData.entregasMap || {};
      const missoesUnicas = new Set<string>();
      Object.keys(entregasMap).forEach(key => {
         const e = entregasMap[key];
         if (e && e.status !== "Pendente" && e.status !== "EXCLUIDA") {
            missoesUnicas.add(key);
         }
      });
      perfil.missoesConcluidas = missoesUnicas.size;
      
      // Badges
      perfil.badges = Array.isArray(pData.badges) ? pData.badges : [];
      
      // Pix
      if (Array.isArray(pData.extratoPix)) {
        pData.extratoPix.forEach((p: Record<string, unknown>) => {
          if (p.tipo === "RECEBEU") {
            perfil.pixRecebido += Number(p.xp) || 0;
          } else if (p.tipo === "ENVIOU") {
            perfil.pixEnviado += Math.abs(Number(p.xp) || 0);
          }
        });
      }
      
      // Frequência
      if (Array.isArray(pData.frequencias)) {
        checkinsAtuais = pData.frequencias;
      }
    }

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

    // 4. Calcular Streak do Aluno Alvo O(1) lendo do metadata unificado
    if (perfil.turma) {
      const diasComAulaSet = new Set<string>();
      const turmaDoAluno = perfil.turma;
      
      const metaDoc = await dbAdmin.collection("metadata").doc("dias_aula_turmas").get();
      if (metaDoc.exists) {
        const metaData = metaDoc.data() || {};
        const diasOficiais = metaData[turmaDoAluno] || [];
        diasOficiais.forEach((dia: string) => diasComAulaSet.add(dia));
      }

      const checkinsMap: Record<string, boolean> = {};
      
      // Adicionamos as presenças do aluno
      checkinsAtuais.forEach((dataFormatada: string) => {
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
