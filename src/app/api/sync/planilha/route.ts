import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

export async function GET() {
  if (!GOOGLE_API_URL || !TUTOR_TOKEN) {
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
    const alunos: any[] = [];
    alunosSnap.forEach((doc: any) => {
      alunos.push(doc.data());
    });

    // Entregas
    const entregasSnap = await dbAdmin.collection("entregas").where("timestamp", ">", lastSync).get();
    const entregas: any[] = [];
    entregasSnap.forEach((doc: any) => {
      entregas.push(doc.data());
    });

    // Frequência
    const freqSnap = await dbAdmin.collection("frequencia").where("timestamp", ">", lastSync).get();
    const frequencia: any[] = [];
    freqSnap.forEach((doc: any) => {
      frequencia.push(doc.data());
    });

    // Rifa
    const rifaSnap = await dbAdmin.collection("rifa_bilhetes").where("timestamp", ">", lastSync).get();
    const rifa_bilhetes: any[] = [];
    rifaSnap.forEach((doc: any) => {
      rifa_bilhetes.push(doc.data());
    });

    // Curtidas
    const curtidasSnap = await dbAdmin.collection("curtidas").where("timestamp", ">", lastSync).get();
    const curtidas: any[] = [];
    curtidasSnap.forEach((doc: any) => {
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
        token: TUTOR_TOKEN,
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

  } catch (error: any) {
    return NextResponse.json({ error: "Falha ao executar sincronização: " + error.message }, { status: 500 });
  }
}
