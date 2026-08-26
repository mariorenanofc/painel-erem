import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matricula = String(searchParams.get("matricula") || "").trim();

    if (!matricula) {
      return NextResponse.json({ status: "erro", mensagem: "Matrícula não informada." }, { status: 400 });
    }

    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const diaHoje = String(spDate.getDate()).padStart(2, "0");
    const mesHoje = String(spDate.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(spDate.getFullYear());
    const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;

    const portalViewRef = dbAdmin.collection("portal_views").doc(matricula);
    const portalViewDoc = await portalViewRef.get();
    
    let jogosStatus = {
      dataReferencia: "",
      xpGanhoHoje: 0,
      vidasGastasHoje: 0
    };
    
    if (portalViewDoc.exists) {
      jogosStatus = portalViewDoc.data()?.jogosStatus || jogosStatus;
    }

    if (jogosStatus.dataReferencia !== dataHojeStr) {
      jogosStatus = {
        dataReferencia: dataHojeStr,
        xpGanhoHoje: 0,
        vidasGastasHoje: 0
      };
    }

    let xpGanhoHoje = jogosStatus.xpGanhoHoje;
    let vidasGastasHoje = jogosStatus.vidasGastasHoje;

    const LIMITE_VIDAS_DIARIAS = 12;
    const vidasRestantes = Math.max(0, LIMITE_VIDAS_DIARIAS - vidasGastasHoje);

    return NextResponse.json({
      status: "sucesso",
      xpGanhoHoje,
      limiteDiario: 25,
      vidasRestantes,
      vidasGastasHoje
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Get Jogos Status Error]", err);
    return NextResponse.json({ status: "erro", mensagem: "Erro ao obter status de jogos." }, { status: 500 });
  }
}
