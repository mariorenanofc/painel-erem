import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matricula = searchParams.get("matricula");

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula não informada" }, { status: 400 });
    }
    const now = Date.now();
    const limite15Min = now - 15 * 60 * 1000;

    // Buscar todos os duelos em que o aluno está envolvido e que ainda estão ativos ou foram criados hoje
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    // Como o Firestore não permite "OR" queries complexas com múltiplas coleções facilmente, 
    // vamos buscar duelos onde ele é desafiante OU desafiado.
    const desafianteSnap = await dbAdmin.collection("duelos")
      .where("desafiante.matricula", "==", matricula)
      .get();
      
    const desafiadoSnap = await dbAdmin.collection("duelos")
      .where("desafiado.matricula", "==", matricula)
      .get();

    const duelosMap = new Map();
    const tsInicioDia = inicioDia.getTime();
    
    desafianteSnap.forEach(doc => {
      const data = doc.data();
      if (data.timestampCriacao >= tsInicioDia || data.status === "Aguardando Oponente" || data.status.startsWith("Iniciado")) {
        duelosMap.set(doc.id, { id: doc.id, ...data });
      }
    });
    
    desafiadoSnap.forEach(doc => {
      const data = doc.data();
      if (data.timestampCriacao >= tsInicioDia || data.status === "Aguardando Oponente" || data.status.startsWith("Iniciado")) {
        duelosMap.set(doc.id, { id: doc.id, ...data });
      }
    });

    const duelosArray = Array.from(duelosMap.values());
    const batch = dbAdmin.batch();
    let hasUpdates = false;

    // Verificação de Expiração
    for (const d of duelosArray) {
      if (["Finalizado", "Cancelado", "Expirado", "Expirado_ChallengerWO", "Expirado_TempoEsgotado", "Expirado_ChallengedWO"].includes(d.status)) {
        continue;
      }

      // Se passou de 15 minutos desde a última atualização
      if (d.ultimaAtualizacao < limite15Min) {
        const ref = dbAdmin.collection("duelos").doc(d.id);
        
        if (d.status === "Iniciado_Desafiante") {
          // Desafiante não concluiu. Perdeu 50 XP por W.O. Desafiado nunca chegou a pagar ou jogar.
          d.status = "Expirado_ChallengerWO";
          batch.update(ref, { status: d.status, ultimaAtualizacao: now });
          hasUpdates = true;
        } 
        else if (d.status === "Aguardando Oponente") {
          // Desafiado não aceitou a tempo. Reembolsa o desafiante.
          d.status = "Expirado_TempoEsgotado";
          batch.update(ref, { status: d.status, ultimaAtualizacao: now });
          
          const alunoRef = dbAdmin.collection("alunos").doc(d.desafiante.matricula);
          batch.update(alunoRef, { xp: FieldValue.increment(50) });
          hasUpdates = true;
        }
        else if (d.status === "Iniciado_Desafiado") {
          // Desafiado não concluiu. Desafiante ganha W.O (100 XP). Desafiado perde seus 50 XP (já cobrados no Aceite).
          d.status = "Expirado_ChallengedWO";
          d.vencedor = d.desafiante.matricula;
          batch.update(ref, { status: d.status, vencedor: d.vencedor, ultimaAtualizacao: now });
          
          const alunoRef = dbAdmin.collection("alunos").doc(d.desafiante.matricula);
          batch.update(alunoRef, { 
            xp: FieldValue.increment(100),
            xpTotal: FieldValue.increment(50) // Ganho real
          });
          
          // Adicionar no rank semanal/mensal do desafiante
          const { getRankingKeys } = await import("@/src/lib/dateUtils");
          const { semanaKey, mesKey } = getRankingKeys(new Date());
          
          const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
          batch.set(rankSemanaRef, { alunos: { [d.desafiante.matricula]: { xpNormal: FieldValue.increment(50), ultimoEnvio: now } } }, { merge: true });
          
          const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
          batch.set(rankMesRef, { alunos: { [d.desafiante.matricula]: { xpNormal: FieldValue.increment(50), ultimoEnvio: now } } }, { merge: true });
          
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
      await batch.commit();
    }

    // Ordenar do mais recente para o mais antigo
    duelosArray.sort((a, b) => b.timestampCriacao - a.timestampCriacao);

    return NextResponse.json({ status: "sucesso", duelos: duelosArray });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Duelos Listar Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
