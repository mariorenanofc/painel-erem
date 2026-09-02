import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idDuelo, tempo, precisao, matricula } = body;

    if (!idDuelo || tempo === undefined || precisao === undefined || !matricula) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const dueloRef = dbAdmin.collection("duelos").doc(idDuelo);
    const dueloDoc = await dueloRef.get();

    if (!dueloDoc.exists) {
      return NextResponse.json({ error: "Duelo não encontrado." }, { status: 404 });
    }

    const d = dueloDoc.data();

    if (d?.desafiante.matricula !== matricula) {
      return NextResponse.json({ error: "Apenas o desafiante pode salvar esta etapa." }, { status: 403 });
    }

    if (d?.status !== "Iniciado_Desafiante") {
      return NextResponse.json({ error: "Duelo não está no status correto." }, { status: 400 });
    }

    await dueloRef.update({
      "desafiante.tempo": Number(tempo),
      "desafiante.precisao": Number(precisao),
      "desafiante.finalizado": true,
      status: "Aguardando Oponente",
      ultimaAtualizacao: Date.now()
    });

    return NextResponse.json({ status: "sucesso", mensagem: "Desafio enviado ao oponente!" });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Duelos Salvar Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
