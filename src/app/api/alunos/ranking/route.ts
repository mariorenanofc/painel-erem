export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import {
  getCachedRanking,
  setCachedRanking,
  getCachedRankingAlunosAtivos,
  setCachedRankingAlunosAtivos,
} from "@/src/lib/cache";
import { getRankingKeys } from "@/src/lib/dateUtils";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filtroTempo = String(searchParams.get("filtroTempo") || "geral").trim();
  const nocache = searchParams.get("nocache") === "true";

  // 1. Verificar Cache da aba solicitada
  const cachedData = nocache ? null : getCachedRanking(filtroTempo);
  if (cachedData) {
    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  }

  try {
    // 2. Carregar Alunos ativos (compartilhando cache de 60s entre as abas Geral, Mensal e Semanal)
    let alunosAtivos = nocache ? null : getCachedRankingAlunosAtivos();
    if (!alunosAtivos) {
      const alunosSnap = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
      alunosAtivos = [];
      alunosSnap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        alunosAtivos!.push({
          matricula: doc.id,
          nome: data.nome || `Aluno ${doc.id}`,
          turma: data.turmaTrilha || data.turma || "",
          nivel: data.nivel || "Iniciante",
          avatarId: data.avatarId || "avatar-padrao",
          xp: Number(data.xp) || 0,
          lastUpdated: Number(data.lastUpdated) || 9999999999999
        });
      });
      setCachedRankingAlunosAtivos(alunosAtivos);
    }

    const alunosRankMap: Record<string, RankedAluno> = {};
    alunosAtivos.forEach((data) => {
      const mat = String(data.matricula);
      if (mat === CONTA_MESTRE) return;

      alunosRankMap[mat] = {
        matricula: mat,
        nome: String(data.nome || `Aluno ${mat}`),
        turma: String(data.turma || ""),
        nivel: String(data.nivel || "Iniciante"),
        avatar: String(data.avatarId || "avatar-padrao"),
        xpCalculado: filtroTempo === "geral" ? (Number(data.xp) || 0) : 0,
        ultimoEnvio: Number(data.lastUpdated) || 9999999999999
      };
    });

    const dataAtual = new Date();

    // Processar Entregas (Apenas no filtro de tempo ativo)
    if (filtroTempo !== "geral") {
      const { semanaKey, mesKey } = getRankingKeys(dataAtual);

      const targetKey = filtroTempo === "semanal" ? `ranking_semanal_${semanaKey}` : `ranking_mensal_${mesKey}`;
      const rankingRef = dbAdmin.collection("estatisticas").doc(targetKey);
      const rankingDoc = await rankingRef.get();

      if (rankingDoc.exists) {
        const rankingData = (rankingDoc.data()?.alunos as Record<string, { xpNormal?: number; xpAtrasado?: number; ultimoEnvio?: number }>) || {};
        
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
        "Cache-Control": "s-maxage=60, stale-while-revalidate"
      }
    });
  } catch (error: unknown) {
    const err = error as Error & { stack?: string };
    console.error("ERRO NO RANKING ROUTE:", err);
    return NextResponse.json({ status: "erro", mensagem: err.message, stack: err.stack });
  }
}
