import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedRanking, setCachedRanking } from "@/src/lib/cache";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;
const CONTA_MESTRE = "1234567";

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
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    });
  }

  try {
    console.log(`[Firestore Query] Ranking: ${filtroTempo}`);

    // Carregar Alunos ativos
    const alunosSnap = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
    const alunosRankMap: Record<string, any> = {};

    alunosSnap.forEach((doc: any) => {
      const mat = doc.id;
      if (mat === CONTA_MESTRE) return;
      const data = doc.data();

      alunosRankMap[mat] = {
        matricula: mat,
        nome: data.nome || `Aluno ${mat}`,
        turma: data.turma || data.turmaTrilha || "",
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
      const entregasSnap = await dbAdmin.collection("entregas")
        .where("status", "==", "Avaliado")
        .where("timestamp", ">=", timeInicio)
        .get();

      entregasSnap.forEach((doc: any) => {
        const val = doc.data();
        const mat = val.matricula;
        const xp = val.xpGanho || 0;
        const timestampEnvio = val.timestamp || 0;

        if (alunosRankMap[mat]) {
          if (timestampEnvio <= timeFim) {
            alunosRankMap[mat].xpCalculado += xp;
            if (timestampEnvio > 0 && timestampEnvio < alunosRankMap[mat].ultimoEnvio) {
              alunosRankMap[mat].ultimoEnvio = timestampEnvio;
            }
          }
        }
      });

      // Também filtrar presenças/frequência no período
      const freqSnap = await dbAdmin.collection("frequencia")
        .where("status", "==", "Presente")
        .where("timestamp", ">=", timeInicio)
        .get();

      freqSnap.forEach((doc: any) => {
        const f = doc.data();
        const mat = f.matricula;
        const xp = f.xpGanho || 10;
        const timestampFreq = f.timestamp || 0;

        if (alunosRankMap[mat] && timestampFreq <= timeFim) {
          alunosRankMap[mat].xpCalculado += xp;
        }
      });
    }

    // Ordenar e Formatar o Ranking
    let ranking = Object.values(alunosRankMap);
    ranking.sort((a: any, b: any) => {
      if (b.xpCalculado !== a.xpCalculado) {
        return b.xpCalculado - a.xpCalculado;
      }
      return a.ultimoEnvio - b.ultimoEnvio;
    });

    ranking = ranking.map((aluno: any, index: number) => ({
      ...aluno,
      xp: aluno.xpCalculado,
      posicao: index + 1
    }));

    const finalResponse = { status: "sucesso", ranking };

    // Salvar no Cache
    setCachedRanking(filtroTempo, finalResponse);

    return NextResponse.json(finalResponse, {
      headers: {
        "Cache-Control": nocache ? "no-store, max-age=0, must-revalidate" : "s-maxage=60, stale-while-revalidate=300"
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
          body: JSON.stringify({ action: "buscar_ranking", filtroTempo, token: TUTOR_TOKEN }),
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
