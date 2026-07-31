import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get("since") || 0);

  try {
    // 1. Buscar Alunos atualizados
    const alunosSnap = await dbAdmin.collection("alunos")
      .where("lastUpdated", ">", since)
      .get();
    
    const alunos: any[] = [];
    alunosSnap.forEach((doc: any) => {
      alunos.push(doc.data());
    });

    // 2. Buscar Entregas novas
    const entregasSnap = await dbAdmin.collection("entregas")
      .where("timestamp", ">", since)
      .get();
    
    const entregas: any[] = [];
    entregasSnap.forEach((doc: any) => {
      entregas.push(doc.data());
    });

    // 3. Buscar Check-ins de Frequência novos
    const freqSnap = await dbAdmin.collection("frequencia")
      .where("timestamp", ">", since)
      .get();
    
    const frequencia: any[] = [];
    freqSnap.forEach((doc: any) => {
      frequencia.push(doc.data());
    });

    // 4. Buscar Bilhetes de Rifa novos
    const rifaSnap = await dbAdmin.collection("rifa_bilhetes")
      .where("timestamp", ">", since)
      .get();
    
    const rifa_bilhetes: any[] = [];
    rifaSnap.forEach((doc: any) => {
      rifa_bilhetes.push(doc.data());
    });

    // 5. Buscar Curtidas novas
    const curtidasSnap = await dbAdmin.collection("curtidas")
      .where("timestamp", ">", since)
      .get();
    
    const curtidas: any[] = [];
    curtidasSnap.forEach((doc: any) => {
      curtidas.push(doc.data());
    });

    return NextResponse.json({
      status: "sucesso",
      timestamp: Date.now(),
      alunos,
      entregas,
      frequencia,
      rifa_bilhetes,
      curtidas
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao obter atualizações pendentes: " + error.message }, { status: 500 });
  }
}
