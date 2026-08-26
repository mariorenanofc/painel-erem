export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedRanking, setCachedRanking, getCachedAtividades, setCachedAtividades, getCachedJustificativas, setCachedJustificativas } from "@/src/lib/cache";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN_SECRET = process.env.TUTOR_TOKEN_SECRET
  ? process.env.TUTOR_TOKEN_SECRET.replace(/^["']|["']$/g, "").trim()
  : undefined;
const CONTA_MESTRE = "1234567";

interface RankedAluno {
  matricula: string;
  nome: string;
  turma: string;
  nivel: string;
  avatar: string;
  xpCalculado: number;
  ultimoEnvio: number;
  xpAtrasadoAcumulado?: number;
  xp?: number;
  posicao?: number;
}

const normalizeToDateStr = (dateStr: string): string => {
  if (!dateStr) return "";
  let d = "", m = "", y = "";
  if (dateStr.includes("T")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      d = parts[2];
      m = parts[1];
      y = parts[0];
    }
  } else if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = parts[2];
        m = parts[1];
        y = parts[0];
      } else {
        d = parts[0];
        m = parts[1];
        y = parts[2];
      }
    }
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      d = parts[0];
      m = parts[1];
      y = parts[2];
    }
  }
  if (d && m && y) {
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return "";
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filtroTempo = String(searchParams.get("filtroTempo") || "geral").trim();
  const nocache = searchParams.get("nocache") === "true";

  // 1. Verificar Cache
  const cachedData = nocache ? null : getCachedRanking(filtroTempo);
  if (cachedData) {
    console.log(`[Cache Hit] Ranking: ${filtroTempo}`);
    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  }

  try {
    console.log(`[Firestore Query] Ranking: ${filtroTempo}`);

    // Carregar Alunos ativos
    const alunosSnap = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
    const alunosRankMap: Record<string, RankedAluno> = {};

    alunosSnap.forEach((doc: QueryDocumentSnapshot) => {
      const mat = doc.id;
      if (mat === CONTA_MESTRE) return;
      const data = doc.data();

      alunosRankMap[mat] = {
        matricula: mat,
        nome: data.nome || `Aluno ${mat}`,
        turma: data.turmaTrilha || data.turma || "",
        nivel: data.nivel || "Iniciante",
        avatar: data.avatarId || "avatar-padrao",
        xpCalculado: filtroTempo === "geral" ? (data.xp || 0) : 0,
        ultimoEnvio: data.lastUpdated || 9999999999999
      };
    });

    const dataAtual = new Date();
    let timeInicio = 0;
    const timeFim = dataAtual.getTime();

    if (filtroTempo === "semanal") {
      const diaSemana = dataAtual.getDay();
      const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
      const inicioSemana = new Date(dataAtual);
      inicioSemana.setDate(dataAtual.getDate() - diffParaSegunda);
      inicioSemana.setHours(0, 0, 0, 0);
      timeInicio = inicioSemana.getTime();
    } else if (filtroTempo === "mensal") {
      const inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
      inicioMes.setHours(0, 0, 0, 0);
      timeInicio = inicioMes.getTime();
    }

    // Processar Entregas (Apenas no filtro de tempo ativo)
    if (filtroTempo !== "geral") {
      const { getRankingKeys } = await import("@/src/lib/dateUtils");
      const { semanaKey, mesKey } = getRankingKeys(dataAtual);

      const targetKey = filtroTempo === "semanal" ? `ranking_semanal_${semanaKey}` : `ranking_mensal_${mesKey}`;
      const rankingRef = dbAdmin.collection("estatisticas").doc(targetKey);
      const rankingDoc = await rankingRef.get();

      if (rankingDoc.exists) {
        const rankingData = rankingDoc.data()?.alunos || {};
        
        for (const mat of Object.keys(alunosRankMap)) {
          if (rankingData[mat]) {
            const rData = rankingData[mat];
            const xpNormal = Number(rData.xpNormal) || 0;
            const xpAtrasado = Number(rData.xpAtrasado) || 0;
            const ultimoEnvio = Number(rData.ultimoEnvio) || alunosRankMap[mat].ultimoEnvio;

            alunosRankMap[mat].xpCalculado = xpNormal;
            alunosRankMap[mat].xpAtrasadoAcumulado = xpAtrasado;
            alunosRankMap[mat].ultimoEnvio = ultimoEnvio;
          }
        }
      }
    }

    // Ordenar e Formatar o Ranking
    let ranking = Object.values(alunosRankMap);

    // Aplicar o limite de XP de atraso (Cap) se não for o ranking geral
    if (filtroTempo !== "geral") {
      const limiteAtrasoCap = filtroTempo === "semanal" ? 50 : 150;
      ranking = ranking.map((aluno: RankedAluno) => {
        const xpAtrasado = aluno.xpAtrasadoAcumulado || 0;
        const xpAtrasadoCapped = Math.min(xpAtrasado, limiteAtrasoCap);
        aluno.xpCalculado += xpAtrasadoCapped;
        return aluno;
      });
    }

    ranking.sort((a: RankedAluno, b: RankedAluno) => {
      if (b.xpCalculado !== a.xpCalculado) {
        return b.xpCalculado - a.xpCalculado;
      }
      return a.ultimoEnvio - b.ultimoEnvio;
    });

    ranking = ranking.map((aluno: RankedAluno, index: number) => ({
      ...aluno,
      xp: aluno.xpCalculado,
      posicao: index + 1
    }));

    const finalResponse = { status: "sucesso", ranking };

    // Salvar no Cache
    setCachedRanking(filtroTempo, finalResponse);

    return NextResponse.json(finalResponse, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    // 🛡️ FAILOVER PARA GOOGLE SHEETS
    console.warn(`[Failover] Erro ao carregar ranking do Firestore: ${err.message}. Redirecionando para Google Sheets...`);

    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "buscar_ranking", filtroTempo, token: TUTOR_TOKEN_SECRET }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: unknown) {
        const sErr = sheetsErr as Error;
        return NextResponse.json({ error: "Erro crítico em ambos os bancos: " + sErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Erro ao carregar o ranking: " + err.message }, { status: 500 });
  }
}
