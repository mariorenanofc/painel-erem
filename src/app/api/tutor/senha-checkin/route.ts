import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedConfigs, setCachedConfigs } from "@/src/lib/cache";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET() {
  try {
    let configMap = getCachedConfigs() as Record<string, string> | null;
    if (!configMap) {
      console.log(`[Firestore Query] Senha-Checkin: Carregando configuracoes (sem cache)`);
      const configSnap = await dbAdmin.collection("configuracoes").get();
      const tempMap: Record<string, string> = {};
      configSnap.forEach((doc: QueryDocumentSnapshot) => {
        tempMap[doc.id] = String(doc.data().valor || "");
      });
      configMap = tempMap;
      setCachedConfigs(configMap);
    }
    const senha = configMap["SENHA_CHECKIN"] || "";
    return NextResponse.json({ status: "sucesso", senha });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao buscar senha no Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
