import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

export async function GET() {
  try {
    const doc = await dbAdmin.collection("configuracoes").doc("SENHA_CHECKIN").get();
    const senha = doc.exists ? String(doc.data()?.valor || "").trim() : "";
    return NextResponse.json({ status: "sucesso", senha });
  } catch (error: unknown) {
    const err = error as Error;
    console.warn(`[Failover] Erro ao buscar senha no Firestore: ${err.message}. Redirecionando para Google Sheets...`);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "buscar_senha_checkin", token: TUTOR_TOKEN }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: unknown) {
        const sErr = sheetsErr as Error;
        return NextResponse.json({ status: "erro", error: "Erro em ambos os bancos: " + sErr.message }, { status: 500 });
      }
    }
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
