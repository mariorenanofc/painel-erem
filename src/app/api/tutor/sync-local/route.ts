import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { invalidatePortalCache, invalidateRankingCache, invalidateConfigCache, clearAllPortalCaches, refreshFirestoreCacheAtividades } from "@/src/lib/cache";
import { Transaction, FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("tutor_session");
    if (!sessionCookie || sessionCookie.value !== "active") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    console.log(`[Tutor Sync Local] Ação: ${action}`);

    if (action === "salvar_atividade") {
      const ativ = body;
      const id = String(ativ.id || ativ.idAtividade || ativ.idAtividadeEdit || "").trim();
      if (id) {
        await dbAdmin.collection("atividades").doc(id).set({
          id,
          titulo: String(ativ.titulo || ""),
          descricao: String(ativ.descricao || ""),
          dataLimite: String(ativ.dataLimite || ""),
          xp: Number(ativ.xp) || 0,
          turmaAlvo: String(ativ.turmaAlvo || "Todas").trim(),
          tipo: String(ativ.tipo || "Projeto").trim(),
          opcaoA: String(ativ.opcaoA || ""),
          opcaoB: String(ativ.opcaoB || ""),
          opcaoC: String(ativ.opcaoC || ""),
          opcaoD: String(ativ.opcaoD || ""),
          respostaCorreta: String(ativ.respostaCorreta || ""),
          linkClassroom: String(ativ.linkClassroom || ""),
          statusPublicacao: String(ativ.statusPublicacao || "Publicada").trim(),
          imageUrl: String(ativ.imageUrl || ativ.imagemUrl || ""),
          modulo: String(ativ.modulo || "Geral").trim(),
          gabarito: String(ativ.gabarito || ""),
          gabaritoLiberado: ativ.gabaritoLiberado === true || String(ativ.gabaritoLiberado).toLowerCase() === "true",
          ...(ativ.resolucaoTyping !== undefined ? { resolucaoTyping: String(ativ.resolucaoTyping || "") } : {}),
          ...(ativ.limiteTempoTyping !== undefined ? { limiteTempoTyping: Number(ativ.limiteTempoTyping) || 0 } : {})
        }, { merge: true });
        invalidateRankingCache();
        clearAllPortalCaches();
        await refreshFirestoreCacheAtividades(dbAdmin);
      }
    }

    else if (action === "excluir_atividade") {
      const id = String(body.idAtividade).trim();
      if (id) {
        await dbAdmin.collection("atividades").doc(id).delete();
        invalidateRankingCache();
        clearAllPortalCaches();
        await refreshFirestoreCacheAtividades(dbAdmin);
      }
    }

    else if (action === "avaliar_entrega") {
      const { idEntrega, matricula, xpGanho, novoStatus, feedback } = body;
      const mat = String(matricula).trim();
      if (idEntrega && mat) {
        const entregaRef = dbAdmin.collection("entregas").doc(idEntrega);
        const alunoRef = dbAdmin.collection("alunos").doc(mat);

        await dbAdmin.runTransaction(async (transaction: Transaction) => {
          const entregaDoc = await transaction.get(entregaRef);
          const alunoDoc = await transaction.get(alunoRef);

          let statusAnterior = "Aguardando Correção";
          let xpAnterior = 0;

          if (entregaDoc.exists) {
            statusAnterior = entregaDoc.data()?.status || "Aguardando Correção";
            xpAnterior = Number(entregaDoc.data()?.xpGanho) || 0;
          }

          const xpDiff = Number(xpGanho) - xpAnterior;

          transaction.set(entregaRef, {
            id: idEntrega,
            matricula: mat,
            status: novoStatus,
            xpGanho: Number(xpGanho),
            feedback: String(feedback || ""),
            timestamp: Date.now()
          }, { merge: true });

          // Atualizar contadores estatísticos de agregação
          const idAtividade = entregaDoc.exists 
            ? (entregaDoc.data()?.idAtividade || idEntrega.split("-")[0]) 
            : idEntrega.split("-")[0];

          const getStatusCategory = (status: string, fb: string = "") => {
            const s = String(status).trim();
            if (s === "Aguardando Correção") return "pendentes";
            if (s === "Aguardando Validação" || s === "Aguardando Validacao") return "aguardandoValidacao";
            if (s === "Avaliado" && (fb.includes("Classroom") || fb.includes("AVA") || fb.includes("sincronizada"))) {
              return "validadasAVA";
            }
            return null;
          };

          const oldCat = getStatusCategory(statusAnterior, entregaDoc.data()?.feedback || "");
          const newCat = getStatusCategory(novoStatus, feedback || "");

          if (idAtividade && oldCat !== newCat) {
            const statsRef = dbAdmin.collection("estatisticas_atividades").doc(idAtividade);
            const statsUpdates: Record<string, FieldValue> = {};
            if (oldCat) statsUpdates[oldCat] = FieldValue.increment(-1);
            if (newCat) statsUpdates[newCat] = FieldValue.increment(1);
            transaction.set(statsRef, statsUpdates, { merge: true });
          }

          if (alunoDoc.exists) {
            const currentXp = Number(alunoDoc.data()?.xp) || 0;
            transaction.update(alunoRef, {
              xp: currentXp + xpDiff,
              lastUpdated: Date.now()
            });
          }
        });

        invalidatePortalCache(mat);
        invalidateRankingCache();
      }
    }

    else if (action === "injetar_xp_manual") {
      const { matriculaAlvo, quantidadeXP, motivo } = body;
      const mat = String(matriculaAlvo).trim();
      const xp = Number(quantidadeXP) || 0;
      if (mat && xp !== 0) {
        const alunoRef = dbAdmin.collection("alunos").doc(mat);
        const timestamp = Date.now();
        const idEntrega = `NOTIF-${timestamp}-${mat}`;

        await dbAdmin.runTransaction(async (transaction: Transaction) => {
          const alunoDoc = await transaction.get(alunoRef);
          if (alunoDoc.exists) {
            const currentXp = Number(alunoDoc.data()?.xp) || 0;
            transaction.update(alunoRef, {
              xp: currentXp + xp,
              lastUpdated: timestamp
            });

            transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
              id: idEntrega,
              matricula: mat,
              idAtividade: "BÔNUS/MULTA",
              resposta: String(motivo || "XP Injetado pelo Tutor"),
              status: xp > 0 ? "Bônus" : "Multa",
              xpGanho: xp,
              timestamp
            });
          }
        });

        invalidatePortalCache(mat);
        invalidateRankingCache();
      }
    }

    else if (action === "atualizar_senha_checkin") {
      const { novaSenha } = body;
      if (novaSenha) {
        await dbAdmin.collection("configuracoes").doc("SENHA_CHECKIN").set({ valor: String(novaSenha).trim() });
        invalidateConfigCache();
      }
    }

    else if (action === "toggle_modo_reposicao") {
      const { status } = body;
      if (status) {
        await dbAdmin.collection("configuracoes").doc("MODO_REPOSICAO").set({ valor: String(status).trim() });
        invalidateConfigCache();
      }
    }

    else if (action === "salvar_configuracoes") {
      const { configs } = body;
      if (configs && typeof configs === "object") {
        const promises = Object.keys(configs).map(key => {
          return dbAdmin.collection("configuracoes").doc(key).set({ valor: configs[key] });
        });
        await Promise.all(promises);
        invalidateConfigCache();
      }
    }

    else if (action === "toggle_gabarito") {
      const { idAtividade } = body;
      if (idAtividade) {
        const ref = dbAdmin.collection("atividades").doc(idAtividade);
        const doc = await ref.get();
        if (doc.exists) {
          const current = doc.data()?.gabaritoLiberado === true;
          await ref.update({ gabaritoLiberado: !current });
          clearAllPortalCaches();
        }
      }
    }

    else if (action === "salvar_gabaritos_lote") {
      const { atualizacoes } = body;
      if (Array.isArray(atualizacoes)) {
        const batch = dbAdmin.batch();
        atualizacoes.forEach((item: { id: string; gabarito?: string; gabaritoLiberado?: boolean }) => {
          const ref = dbAdmin.collection("atividades").doc(item.id);
          batch.set(ref, {
            gabarito: String(item.gabarito || ""),
            gabaritoLiberado: item.gabaritoLiberado === true
          }, { merge: true });
        });
        await batch.commit();
        clearAllPortalCaches();
        await refreshFirestoreCacheAtividades(dbAdmin);
      }
    }

    else if (action === "justificar_falta") {
      const { matricula, data, justificativa, idFalta } = body;
      const mat = String(matricula).trim();
      const dataIso = String(data).trim();
      const reason = String(justificativa || "").trim();

      if (mat && dataIso) {
        const partes = dataIso.split("-");
        if (partes.length === 3) {
          const dia = partes[2];
          const mes = partes[1];
          const ano = partes[0];
          const dataBR = `${dia}/${mes}/${ano}`;
          const docId = `${dia}-${mes}-${ano}_${mat}`;

          const finalIdFalta = idFalta ? String(idFalta).trim() : `FALTA-${Date.now()}`;

          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const alunoDoc = await alunoRef.get();
          const freshAluno = alunoDoc.exists ? alunoDoc.data() : null;
          const nomeAluno = freshAluno ? String(freshAluno.nome || "Aluno") : "Aluno";
          const turmaDoAluno = freshAluno ? String(freshAluno.turmaTrilha || freshAluno.turma || "Todas").trim() : "Todas";

          const docTimestamp = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0).getTime();

          const freqRef = dbAdmin.collection("frequencia").doc(docId);
          await freqRef.set({
            id: finalIdFalta,
            matricula: mat,
            nome: nomeAluno,
            data: dataBR,
            hora: "00:00:00",
            status: "Justificada",
            xpGanho: 0,
            justificativa: reason,
            turma: turmaDoAluno,
            timestamp: docTimestamp
          }, { merge: true });

          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }
    }

    return NextResponse.json({ status: "sucesso" });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Tutor Sync Local Error]", err);
    return NextResponse.json({ status: "sucesso", warning: "Erro no sync local: " + err.message });
  }
}
