import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idDuelo, matricula } = body;

    if (!idDuelo || !matricula) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const dueloRef = dbAdmin.collection("duelos").doc(idDuelo);
    const dueloDoc = await dueloRef.get();

    if (!dueloDoc.exists) {
      return NextResponse.json({ error: "Duelo não encontrado." }, { status: 404 });
    }

    const d = dueloDoc.data();

    if (d?.desafiado.matricula !== matricula) {
      return NextResponse.json({ error: "Apenas o desafiado pode aceitar este duelo." }, { status: 403 });
    }

    if (d?.status !== "Aguardando Oponente") {
      return NextResponse.json({ error: "Duelo já foi aceito, expirado ou finalizado." }, { status: 400 });
    }

    // Checar saldo
    const alunoDoc = await dbAdmin.collection("alunos").doc(matricula).get();
    const xpAtual = Number(alunoDoc.data()?.xp) || 0;
    if (xpAtual < 50) {
      return NextResponse.json({ error: "Saldo de XP insuficiente. Você precisa de 50 XP para aceitar." }, { status: 403 });
    }

    // Debitar 50 XP e iniciar
    const batch = dbAdmin.batch();
    batch.update(alunoDoc.ref, { xp: FieldValue.increment(-50) });

    // Grava transação no extrato (entregas)
    const timestamp = Date.now();
    const extratoRef = dbAdmin.collection("entregas").doc(`DUELO-ACEIT-${idDuelo}`);
    batch.set(extratoRef, {
      id: `DUELO-ACEIT-${idDuelo}`,
      matricula,
      idAtividade: "DUELO-1V1",
      resposta: `Aceitou Desafio de ${d?.desafiante.nome}`,
      status: "Avaliado",
      xpGanho: -50,
      timestamp,
      feedback: "Aposta de Duelo"
    });

    batch.update(dueloRef, {
      status: "Iniciado_Desafiado",
      ultimaAtualizacao: Date.now()
    });

    await batch.commit();

    return NextResponse.json({ status: "sucesso", codigoDesafio: d?.codigoDesafio });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Duelos Aceitar Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
