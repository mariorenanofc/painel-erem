import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { fetchSheetsQueued } from "@/src/lib/sheetsQueue";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

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
