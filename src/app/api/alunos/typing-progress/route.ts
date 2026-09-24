import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matricula, idAtividade, state } = body;
    if (!matricula || !idAtividade || !state) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const docRef = dbAdmin.collection("typing_progress").doc(matricula);
    await docRef.set({ [idAtividade]: state }, { merge: true });
    
    return NextResponse.json({ status: "sucesso" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Erro ao salvar: " + err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matricula = searchParams.get("matricula");
  const idAtividade = searchParams.get("idAtividade");

  if (!matricula || !idAtividade) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const doc = await dbAdmin.collection("typing_progress").doc(matricula).get();
    if (doc.exists) {
      const data = doc.data();
      if (data && data[idAtividade]) {
        return NextResponse.json({ status: "sucesso", state: data[idAtividade] });
      }
    }
    return NextResponse.json({ status: "not_found" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Erro ao buscar: " + err.message }, { status: 500 });
  }
}
