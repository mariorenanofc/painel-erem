import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { loadFirestoreConfiguracoes } from "@/src/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configuracoes = await loadFirestoreConfiguracoes(dbAdmin);
    const senha = String(configuracoes["SENHA_CHECKIN"] || "");
    return NextResponse.json({ status: "sucesso", senha });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[API Error] Erro ao buscar senha no Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
