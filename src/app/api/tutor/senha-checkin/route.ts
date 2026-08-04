import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET() {
  try {
    const doc = await dbAdmin.collection("configuracoes").doc("SENHA_CHECKIN").get();
    const senha = doc.exists ? String(doc.data()?.valor || "").trim() : "";
    return NextResponse.json({ status: "sucesso", senha });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao buscar senha no Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
