import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedConfigs, setCachedConfigs } from "@/src/lib/cache";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let cacheData = getCachedConfigs() as { status: string, configuracoes: Record<string, unknown> } | null;
    if (!cacheData || !cacheData.configuracoes) {
      console.log(`[Firestore Query] Senha-Checkin: Carregando configuracoes (sem cache)`);
      const configSnap = await dbAdmin.collection("configuracoes").get();
      const tempMap: Record<string, unknown> = {};
      configSnap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        tempMap[doc.id] = Array.isArray(data.valor) ? data.valor : String(data.valor || "").trim();
      });
      cacheData = { status: "sucesso", configuracoes: tempMap };
      setCachedConfigs(cacheData);
    }
    const senha = cacheData.configuracoes["SENHA_CHECKIN"] || "";
    return NextResponse.json({ status: "sucesso", senha });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao buscar senha no Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
