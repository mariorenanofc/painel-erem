export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getAlunosAtivosSnapshot } from "@/src/lib/cache";

interface TurmaEngajamento {
  turma: string;
  total: number;
  visualizados: number;
  percentual: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let versao = searchParams.get("versao");

    // Se não informou versão na URL, busca a versão oficial ativa no Firestore
    if (!versao) {
      const configDoc = await dbAdmin.collection("configuracoes").doc("VERSAO_NOVIDADES").get();
      if (configDoc.exists) {
        versao = String(configDoc.data()?.valor || "v2.2.1");
      } else {
        versao = "v2.2.1";
      }
    }

    // 1. Obter telemetria persistida (1 leitura no Firestore)
    const telemetriaDoc = await dbAdmin.collection("metadata").doc("telemetria_novidades").get();
    let visualizadosMatriculas: string[] = [];
    let ultimaLeitura: string | null = null;

    if (telemetriaDoc.exists) {
      const data = telemetriaDoc.data() as Record<string, { visualizados?: string[]; ultimaLeitura?: string }>;
      const versaoData = data?.[versao];
      if (versaoData && Array.isArray(versaoData.visualizados)) {
        visualizadosMatriculas = versaoData.visualizados;
        ultimaLeitura = versaoData.ultimaLeitura || null;
      }
    }

    const setVisualizados = new Set(visualizadosMatriculas.map((m) => String(m).trim()));

    // 2. Obter lista de alunos ativos através do snapshot otimizado em cache (0 leituras se em cache)
    const alunos = await getAlunosAtivosSnapshot(dbAdmin);
    const listaAlunos = Array.isArray(alunos) ? alunos : [];

    let totalGeral = 0;
    let totalVisualizados = 0;
    const mapaTurmas: Record<string, { total: number; visualizados: number }> = {};
    const pendentes: Array<{ matricula: string; nome: string; turma: string }> = [];

    listaAlunos.forEach((a) => {
      const matricula = String(a.matricula || a.id || "").trim();
      const nome = String(a.nome || "Estudante").trim();
      const turma = String(a.turma || "Sem Turma").trim();

      if (!matricula) return;

      totalGeral++;
      if (!mapaTurmas[turma]) {
        mapaTurmas[turma] = { total: 0, visualizados: 0 };
      }
      mapaTurmas[turma].total++;

      if (setVisualizados.has(matricula)) {
        totalVisualizados++;
        mapaTurmas[turma].visualizados++;
      } else {
        pendentes.push({ matricula, nome, turma });
      }
    });

    const percentualGeral = totalGeral > 0 ? Math.round((totalVisualizados / totalGeral) * 100) : 0;

    const porTurma: TurmaEngajamento[] = Object.entries(mapaTurmas).map(([turma, dados]) => ({
      turma,
      total: dados.total,
      visualizados: dados.visualizados,
      percentual: dados.total > 0 ? Math.round((dados.visualizados / dados.total) * 100) : 0
    })).sort((a, b) => b.percentual - a.percentual);

    return NextResponse.json({
      status: "sucesso",
      versao,
      ultimaLeitura,
      resumo: {
        totalAlunos: totalGeral,
        totalVisualizados,
        percentualGeral,
      },
      porTurma,
      pendentes: pendentes.slice(0, 50) // Limita amostra de pendentes para não onerar o payload
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[API Novidades Engajamento Error]:", err.message);
    return NextResponse.json(
      { status: "erro", mensagem: "Erro ao buscar telemetria de novidades." },
      { status: 500 }
    );
  }
}

