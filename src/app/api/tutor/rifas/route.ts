import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await dbAdmin.collection("rifa_bilhetes").get();
    
    const bilhetes: Record<string, unknown>[] = [];
    let ativos = 0;
    let sorteados = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      bilhetes.push(data);
      if (data.status === "ATIVO") ativos++;
      if (data.status === "SORTEADO_GANHADOR") sorteados++;
    });

    // Ordenar do mais recente para o mais antigo
    bilhetes.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

    return NextResponse.json({
      status: "sucesso",
      estatisticas: {
        total: bilhetes.length,
        ativos,
        sorteados
      },
      bilhetes
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao listar rifas:", err);
    return NextResponse.json(
      { status: "erro", mensagem: "Falha ao carregar bilhetes: " + err.message },
      { status: 500 }
    );
  }
}
