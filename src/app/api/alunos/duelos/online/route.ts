import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matricula = String(body.matricula || "").trim();

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula não informada" }, { status: 400 });
    }

    const alunoDoc = await dbAdmin.collection("alunos").doc(matricula).get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }
    
    const { nome, turma } = alunoDoc.data() || {};
    const now = Date.now();

    const docRef = dbAdmin.collection("estatisticas").doc("duelos_online");
    
    // Atualiza o próprio status e pega a lista no mesmo batch/transação
    const docSnap = await docRef.get();
    let onlineMap: Record<string, { nome: string; turma: string; ts: number }> = {};
    if (docSnap.exists) {
      onlineMap = docSnap.data() as Record<string, { nome: string; turma: string; ts: number }>;
    }

    // Limpar inativos (> 5 min)
    const limiteInativo = now - 5 * 60 * 1000;
    const playersOnline = [];
    
    const updates: Record<string, unknown> = {};

    for (const [mat, data] of Object.entries(onlineMap)) {
      if (data.ts < limiteInativo) {
        updates[mat] = FieldValue.delete();
      } else {
        if (mat !== matricula) {
          playersOnline.push({ matricula: mat, nome: data.nome, turma: data.turma });
        }
      }
    }

    // Atualiza o jogador atual
    updates[matricula] = { nome: nome || "Aluno", turma: turma || "", ts: now };

    await docRef.set(updates, { merge: true });

    return NextResponse.json({ status: "sucesso", online: playersOnline });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Duelos Online Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
