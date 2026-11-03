import { NextResponse } from "next/server";
import { executarFechamentoCiclo } from "@/src/lib/ciclosEngine";
import { loadRegrasCiclos } from "@/src/lib/cache";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Endpoint acionado por Cron ou disparado pelo painel para fechar ciclos automaticamente.
 * Suporta autenticação via Bearer token (CRON_SECRET) ou verificação de rotina interna.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.TUTOR_TOKEN_SECRET || "cron_secret_erem_2026";

    // Se houver header de autorização, verifica se bate
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ status: "erro", mensagem: "Não autorizado." }, { status: 401 });
    }

    const tipoParam = searchParams.get("tipo"); // "semanal" | "mensal" | "ambos"
    const chaveParam = searchParams.get("chave") || undefined;

    const regras = await loadRegrasCiclos(dbAdmin);
    const resultados: Record<string, unknown>[] = [];

    // 1. Fechamento Mensal
    if (tipoParam === "mensal" || tipoParam === "ambos" || !tipoParam) {
      if (regras.mensal.ativo && regras.mensal.modoExecucao === "automatico") {
        const resMensal = await executarFechamentoCiclo("mensal", chaveParam, "cron:automacao");
        resultados.push({ tipo: "mensal", resultado: resMensal });
      } else {
        resultados.push({ tipo: "mensal", status: "ignorado", motivo: "Modo manual ou inativo" });
      }
    }

    // 2. Fechamento Semanal
    if (tipoParam === "semanal" || tipoParam === "ambos" || !tipoParam) {
      if (regras.semanal.ativo && regras.semanal.modoExecucao === "automatico") {
        const resSemanal = await executarFechamentoCiclo("semanal", chaveParam, "cron:automacao");
        resultados.push({ tipo: "semanal", resultado: resSemanal });
      } else {
        resultados.push({ tipo: "semanal", status: "ignorado", motivo: "Modo manual ou inativo" });
      }
    }

    return NextResponse.json({
      status: "sucesso",
      timestamp: new Date().toISOString(),
      resultados
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[CRON Ciclos] Erro no processamento:", err);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}

