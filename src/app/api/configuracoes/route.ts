import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedConfigs, setCachedConfigs } from "@/src/lib/cache";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;

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
    console.warn(`[Failover] Erro ao carregar configurações do Firestore: ${err.message}. Redirecionando para Google Sheets...`);

    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "buscar_configuracoes" }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: unknown) {
        const sErr = sheetsErr as Error;
        return NextResponse.json({ error: "Erro crítico em ambos os bancos: " + sErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Erro ao carregar configurações: " + err.message }, { status: 500 });
  }
}
