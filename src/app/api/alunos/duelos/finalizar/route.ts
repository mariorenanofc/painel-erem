import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getRankingKeys } from "@/src/lib/dateUtils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idDuelo, tempo, precisao, matricula } = body;

    if (!idDuelo || tempo === undefined || precisao === undefined || !matricula) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const dueloRef = dbAdmin.collection("duelos").doc(idDuelo);
    const dueloDoc = await dueloRef.get();

    if (!dueloDoc.exists) {
      return NextResponse.json({ error: "Duelo não encontrado." }, { status: 404 });
    }

    const d = dueloDoc.data();

    if (d?.desafiado.matricula !== matricula) {
      return NextResponse.json({ error: "Apenas o desafiado pode finalizar este duelo." }, { status: 403 });
    }

    if (d?.status !== "Iniciado_Desafiado") {
      return NextResponse.json({ error: "Duelo não está no status correto para finalizar." }, { status: 400 });
    }

    const tempoDesafiado = Number(tempo);
    const precisaoDesafiado = Number(precisao);
    
    const tempoDesafiante = Number(d.desafiante.tempo);
    const precisaoDesafiante = Number(d.desafiante.precisao);

    let vencedorMatricula = "";
    let isEmpate = false;

    // Regra: Precisão vence. Se houver empate na precisão, o Menor Tempo vence.
    if (precisaoDesafiado > precisaoDesafiante) {
      vencedorMatricula = d.desafiado.matricula;
    } else if (precisaoDesafiante > precisaoDesafiado) {
      vencedorMatricula = d.desafiante.matricula;
    } else {
      // Empate na precisão
      if (tempoDesafiado < tempoDesafiante) {
        vencedorMatricula = d.desafiado.matricula;
      } else if (tempoDesafiante < tempoDesafiado) {
        vencedorMatricula = d.desafiante.matricula;
      } else {
        // Empate absoluto
        isEmpate = true;
      }
    }

    const batch = dbAdmin.batch();

    batch.update(dueloRef, {
      "desafiado.tempo": tempoDesafiado,
      "desafiado.precisao": precisaoDesafiado,
      "desafiado.finalizado": true,
      status: "Finalizado",
      vencedor: isEmpate ? "Empate" : vencedorMatricula,
      ultimaAtualizacao: Date.now()
    });

    const now = Date.now();
    const { semanaKey, mesKey } = getRankingKeys(new Date(now));
    
    if (isEmpate) {
      // Reembolsa 50 XP para ambos
      const refA = dbAdmin.collection("alunos").doc(d.desafiante.matricula);
      const refB = dbAdmin.collection("alunos").doc(d.desafiado.matricula);
      batch.update(refA, { xp: FieldValue.increment(50) });
      batch.update(refB, { xp: FieldValue.increment(50) });

      // Extrato de reembolso
      const extA = dbAdmin.collection("entregas").doc(`DUELO-EMPATE-${idDuelo}-A`);
      batch.set(extA, {
        id: extA.id, matricula: d.desafiante.matricula, idAtividade: "DUELO-1V1",
        resposta: "Empate no Duelo (Reembolso)", status: "Avaliado", xpGanho: 50, timestamp: now, feedback: "Aposta Devolvida"
      });
      const extB = dbAdmin.collection("entregas").doc(`DUELO-EMPATE-${idDuelo}-B`);
      batch.set(extB, {
        id: extB.id, matricula: d.desafiado.matricula, idAtividade: "DUELO-1V1",
        resposta: "Empate no Duelo (Reembolso)", status: "Avaliado", xpGanho: 50, timestamp: now, feedback: "Aposta Devolvida"
      });
    } else {
      // Paga 100 XP pro vencedor e soma 50 no Ranking Mensal/Semanal (o lucro)
      const vencedorRef = dbAdmin.collection("alunos").doc(vencedorMatricula);
      batch.update(vencedorRef, { 
        xp: FieldValue.increment(100),
        xpTotal: FieldValue.increment(50)
      });

      // Extrato de prêmio
      const extVencedor = dbAdmin.collection("entregas").doc(`DUELO-WIN-${idDuelo}`);
      batch.set(extVencedor, {
        id: extVencedor.id, matricula: vencedorMatricula, idAtividade: "DUELO-1V1",
        resposta: "Vitória na Arena 1v1", status: "Avaliado", xpGanho: 100, timestamp: now, feedback: "Prêmio do Duelo"
      });

      const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
      batch.set(rankSemanaRef, {
        alunos: { [vencedorMatricula]: { xpNormal: FieldValue.increment(50), ultimoEnvio: now } }
      }, { merge: true });

      const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
      batch.set(rankMesRef, {
        alunos: { [vencedorMatricula]: { xpNormal: FieldValue.increment(50), ultimoEnvio: now } }
      }, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({ status: "sucesso", vencedor: isEmpate ? "Empate" : vencedorMatricula, xpGanhador: 100 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Duelos Finalizar Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
