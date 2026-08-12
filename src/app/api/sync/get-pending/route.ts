import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get("since") || 0);

  try {
    // 1. Buscar Alunos atualizados
    const alunosSnap = await dbAdmin.collection("alunos")
      .where("lastUpdated", ">", since)
      .get();
    
    const alunos: Record<string, unknown>[] = [];
    alunosSnap.forEach((doc: QueryDocumentSnapshot) => {
      alunos.push(doc.data());
    });

    // 2. Buscar Entregas novas
    const entregasSnap = await dbAdmin.collection("entregas")
      .where("timestamp", ">", since)
      .get();
    
    const entregas: Record<string, unknown>[] = [];
    entregasSnap.forEach((doc: QueryDocumentSnapshot) => {
      entregas.push(doc.data());
    });

    // 3. Buscar Check-ins de Frequência novos
    const freqSnap = await dbAdmin.collection("frequencia")
      .where("timestamp", ">", since)
      .get();
    
    const frequencia: Record<string, unknown>[] = [];
    freqSnap.forEach((doc: QueryDocumentSnapshot) => {
      frequencia.push(doc.data());
    });

    // 4. Buscar Bilhetes de Rifa novos
    const rifaSnap = await dbAdmin.collection("rifa_bilhetes")
      .where("timestamp", ">", since)
      .get();
    
    const rifa_bilhetes: Record<string, unknown>[] = [];
    rifaSnap.forEach((doc: QueryDocumentSnapshot) => {
      rifa_bilhetes.push(doc.data());
    });

    // 5. Buscar Curtidas novas
    const curtidasSnap = await dbAdmin.collection("curtidas")
      .where("timestamp", ">", since)
      .get();
    
    const curtidas: Record<string, unknown>[] = [];
    curtidasSnap.forEach((doc: QueryDocumentSnapshot) => {
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

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Erro ao obter atualizações pendentes: " + err.message }, { status: 500 });
  }
}
