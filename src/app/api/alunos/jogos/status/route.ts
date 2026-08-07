import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matricula = String(searchParams.get("matricula") || "").trim();

    if (!matricula) {
      return NextResponse.json({ status: "erro", mensagem: "Matrícula não informada." }, { status: 400 });
    }

    // Obter início do dia no fuso horário de São Paulo
    const startOfDayTimestamp = new Date(
      new Date().toLocaleDateString("en-US", { timeZone: "America/Sao_Paulo" })
    ).getTime();

    const entregasSnap = await dbAdmin.collection("entregas")
      .where("matricula", "==", matricula)
      .get();

    let xpGanhoHoje = 0;
    entregasSnap.forEach(doc => {
      const data = doc.data();
      if (data.idAtividade === "JOGOS-EDUCATIVOS" && Number(data.timestamp || 0) >= startOfDayTimestamp) {
        xpGanhoHoje += Number(data.xpGanho) || 0;
      }
    });

    return NextResponse.json({
      status: "sucesso",
      xpGanhoHoje,
      limiteDiario: 25
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Get Jogos Status Error]", err);
    return NextResponse.json({ status: "erro", mensagem: "Erro ao obter status de jogos." }, { status: 500 });
  }
}
