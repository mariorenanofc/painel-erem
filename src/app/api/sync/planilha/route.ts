import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { cookies } from "next/headers";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN_SECRET = process.env.TUTOR_TOKEN_SECRET
  ? process.env.TUTOR_TOKEN_SECRET.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tutor_session");
  if (!sessionCookie || sessionCookie.value !== "active") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (!GOOGLE_API_URL || !TUTOR_TOKEN_SECRET) {
    return NextResponse.json({ error: "Configurações de API ausentes no .env" }, { status: 500 });
  }

  try {
    // 1. Obter último timestamp de sincronização
    const syncDocRef = dbAdmin.collection("configuracoes").doc("LAST_SYNC_TIMESTAMP");
    const syncDoc = await syncDocRef.get();
    const lastSync = Number(syncDoc.data()?.valor || 0);

    const agora = Date.now();

    // 2. Buscar dados pendentes no Firestore
    
    // Alunos
    const alunosSnap = await dbAdmin.collection("alunos").where("lastUpdated", ">", lastSync).get();
    const alunos: Record<string, unknown>[] = [];
    alunosSnap.forEach((doc) => {
      alunos.push(doc.data());
    });

    // Entregas
    const entregasSnap = await dbAdmin.collection("entregas").where("timestamp", ">", lastSync).get();
    const entregas: Record<string, unknown>[] = [];
    entregasSnap.forEach((doc) => {
      entregas.push(doc.data());
    });

    // Frequência
    const freqSnap = await dbAdmin.collection("frequencia").where("timestamp", ">", lastSync).get();
    const frequencia: Record<string, unknown>[] = [];
    freqSnap.forEach((doc) => {
      frequencia.push(doc.data());
    });

    // Rifa
    const rifaSnap = await dbAdmin.collection("rifa_bilhetes").where("timestamp", ">", lastSync).get();
    const rifa_bilhetes: Record<string, unknown>[] = [];
    rifaSnap.forEach((doc) => {
      rifa_bilhetes.push(doc.data());
    });

    // Curtidas
    const curtidasSnap = await dbAdmin.collection("curtidas").where("timestamp", ">", lastSync).get();
    const curtidas: Record<string, unknown>[] = [];
    curtidasSnap.forEach((doc) => {
      curtidas.push(doc.data());
    });

    // Se nada mudou, retornar de imediato
    if (alunos.length === 0 && entregas.length === 0 && frequencia.length === 0 && rifa_bilhetes.length === 0 && curtidas.length === 0) {
      return NextResponse.json({ status: "sucesso", mensagem: "Nada pendente para sincronizar." });
    }

    // 3. Postar dados em lote para o Google Apps Script
    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "sincronizar_dados_portal",
        token: TUTOR_TOKEN_SECRET,
        alunos,
        entregas,
        frequencia,
        rifa_bilhetes,
        curtidas
      }),
    });

    const data = await response.json();
    if (data.status !== "sucesso") {
      return NextResponse.json({ error: data.mensagem || "Erro retornado pelo Apps Script ao sincronizar." }, { status: 500 });
    }

    // 4. Salvar novo timestamp
    await syncDocRef.set({ valor: agora });

    return NextResponse.json({
      status: "sucesso",
      mensagem: "Sincronização concluída com sucesso com o Google Sheets!",
      sincronizados: {
        alunos: alunos.length,
        entregas: entregas.length,
        frequencia: frequencia.length,
        rifa_bilhetes: rifa_bilhetes.length,
        curtidas: curtidas.length
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Falha ao executar sincronização: " + err.message }, { status: 500 });
  }
}
