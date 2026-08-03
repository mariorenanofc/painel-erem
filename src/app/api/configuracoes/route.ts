import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedConfigs, setCachedConfigs } from "@/src/lib/cache";
import { fetchSheetsQueued } from "@/src/lib/sheetsQueue";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function GET() {
  // 1. Verificar Cache
  const cached = getCachedConfigs();
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const snap = await dbAdmin.collection("configuracoes").get();
    const configs: Record<string, string> = {};
    snap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      configs[doc.id] = String(data.valor || "").trim();
    });

    const result = { status: "sucesso", configuracoes: configs };
    setCachedConfigs(result);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao carregar configurações do Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
