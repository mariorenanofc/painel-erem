import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { fetchSheetsQueued } from "@/src/lib/sheetsQueue";
import { invalidatePortalCache, invalidateRankingCache, invalidateConfigCache, clearAllPortalCaches, refreshFirestoreCacheAtividades } from "@/src/lib/cache";
import { Transaction, FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

const TUTOR_TOKEN_SECRET = process.env.TUTOR_TOKEN_SECRET
  ? process.env.TUTOR_TOKEN_SECRET.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function POST(request: Request) {
  if (!GOOGLE_API_URL) {
    return NextResponse.json({ status: "erro", mensagem: "URL da planilha não configurada no servidor." }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const requestAction = payload.action;

    // --- MIDDLEWARE DE SEGURANÇA ---
    if (requestAction === "logout") {
      const response = NextResponse.json({ status: "sucesso", mensagem: "Logout efetuado com sucesso." });
      response.cookies.delete("tutor_session");
      return response;
    }

    const ROTAS_PROTEGIDAS = [
      "salvar_atividade", "excluir_atividade", "avaliar_entrega", 
      "injetar_xp_manual", "cadastrar_aluno", "inscrever_trilhatech", "salvar_aluno",
      "mudar_status_trilhatech", "atualizar_senha_checkin", "toggle_modo_reposicao",
      "salvar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote", "sincronizar_ava",
      "justificar_falta", "buscar_analytics_geral", "buscar_ficha_360", "listar_alunos_godmode",
      "coroar_elite", "sortear_rifa"
    ];

    if (ROTAS_PROTEGIDAS.includes(requestAction)) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("tutor_session");
      if (!sessionCookie || sessionCookie.value !== "active") {
        return NextResponse.json({ status: "erro", mensagem: "Não autorizado. Faça login novamente." }, { status: 403 });
      }
      // Se autenticado, injeta a senha secreta no payload invisivelmente
      payload.token = TUTOR_TOKEN_SECRET;
    }
    // ---------------------------------
    
    // 1. Executar na fila serializada do Google Sheets (evita LockService concurrency errors)
    const sheetsResponse = await fetchSheetsQueued(GOOGLE_API_URL, payload);
    const result = await sheetsResponse.json();

    // Se for login e teve sucesso, cria a sessão!
    if (requestAction === "login" && result.status === "sucesso") {
      const response = NextResponse.json(result);
      response.cookies.set("tutor_session", "active", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });
      return response;
    }

    // 2. Se for sucesso, e for uma ação de escrita/sincronização do tutor, rodar a escrita local no Firestore
    const ACTIONS_TO_SYNC = [
      "salvar_atividade", "excluir_atividade", "avaliar_entrega", 
      "injetar_xp_manual", "atualizar_senha_checkin", "toggle_modo_reposicao",
      "salvar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote",
      "justificar_falta",
      "resgatar_badge", "resgatar_aniversario", "confirmar_whatsapp",
      "cadastrar_aluno", "salvar_aluno", "inscrever_trilhatech", "mudar_status_trilhatech"
    ];

    if (result.status === "sucesso" && ACTIONS_TO_SYNC.includes(String(payload.action))) {
      let idAtiv = (result.idAtividade || payload.idAtividadeEdit || payload.id) as string | undefined;
      if (!idAtiv && result.mensagem) {
        const match = String(result.mensagem).match(/ATIV-\d+/);
        if (match) idAtiv = match[0];
      }

      const action = payload.action;

      if (action === "salvar_atividade") {
        const ativ = payload;
        const id = String(idAtiv || "").trim();
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
        const id = String(payload.idAtividade || idAtiv).trim();
        if (id) {
          await dbAdmin.collection("atividades").doc(id).delete();
          invalidateRankingCache();
          clearAllPortalCaches();
          await refreshFirestoreCacheAtividades(dbAdmin);
        }
      }

      else if (action === "avaliar_entrega") {
        const { idEntrega, matricula, xpGanho, novoStatus, feedback } = payload;
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
        const { matriculaAlvo, quantidadeXP, motivo } = payload;
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
        const { novaSenha } = payload;
        if (novaSenha) {
          await dbAdmin.collection("configuracoes").doc("SENHA_CHECKIN").set({ valor: String(novaSenha).trim() });
          invalidateConfigCache();
        }
      }

      else if (action === "toggle_modo_reposicao") {
        const { status } = payload;
        if (status) {
          await dbAdmin.collection("configuracoes").doc("MODO_REPOSICAO").set({ valor: String(status).trim() });
          invalidateConfigCache();
        }
      }

      else if (action === "salvar_configuracoes") {
        const { configs } = payload;
        if (configs && typeof configs === "object") {
          const promises = Object.keys(configs).map(key => {
            return dbAdmin.collection("configuracoes").doc(key).set({ valor: configs[key] });
          });
          await Promise.all(promises);
          invalidateConfigCache();
        }
      }

      else if (action === "toggle_gabarito") {
        const { idAtividade } = payload;
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
        const { atualizacoes } = payload;
        if (Array.isArray(atualizacoes)) {
          const promises = atualizacoes.map((item: { id: string; gabarito?: string; gabaritoLiberado?: boolean }) => {
            return dbAdmin.collection("atividades").doc(item.id).set({
              gabarito: String(item.gabarito || ""),
              gabaritoLiberado: item.gabaritoLiberado === true
            }, { merge: true });
          });
          await Promise.all(promises);
          clearAllPortalCaches();
        }
      }

      else if (action === "justificar_falta") {
        const { matricula, data, justificativa, idFalta } = payload;
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

      else if (action === "resgatar_badge") {
        const { matricula, badgeId, xpGanho, nomeBadge } = payload;
        const mat = String(matricula).trim();
        const xp = Number(xpGanho) || 0;
        if (mat && badgeId) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const idEntrega = `BADGE-${badgeId}-${mat}`;
          await dbAdmin.runTransaction(async (transaction: Transaction) => {
            const alunoDoc = await transaction.get(alunoRef);
            if (alunoDoc.exists) {
              const currentXp = Number(alunoDoc.data()?.xp) || 0;
              transaction.update(alunoRef, {
                xp: currentXp + xp,
                lastUpdated: Date.now()
              });
              transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
                id: idEntrega,
                matricula: mat,
                idAtividade: "RECOMPENSA",
                resposta: `Badge Resgatada: ${nomeBadge}`,
                status: "Badge",
                xpGanho: xp,
                timestamp: Date.now()
              });
            }
          });
          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }

      else if (action === "resgatar_aniversario") {
        const { matricula } = payload;
        const mat = String(matricula).trim();
        if (mat) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const ano = new Date().getFullYear();
          const idEntrega = `BDAY-${ano}-${mat}`;
          await dbAdmin.runTransaction(async (transaction: Transaction) => {
            const alunoDoc = await transaction.get(alunoRef);
            if (alunoDoc.exists) {
              const currentXp = Number(alunoDoc.data()?.xp) || 0;
              transaction.update(alunoRef, {
                xp: currentXp + 500,
                lastUpdated: Date.now()
              });
              transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
                id: idEntrega,
                matricula: mat,
                idAtividade: "RECOMPENSA",
                resposta: "Presente de Aniversário! 🎉",
                status: "Aniversário",
                xpGanho: 500,
                timestamp: Date.now()
              });
            }
          });
          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }

      else if (action === "confirmar_whatsapp") {
        const { matricula } = payload;
        const mat = String(matricula).trim();
        if (mat) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const alunoDoc = await alunoRef.get();
          if (alunoDoc.exists) {
            const currentXp = Number(alunoDoc.data()?.xp) || 0;
            await alunoRef.update({
              xp: currentXp + 200,
              whatsapp: { confirmado: true }
            });
            invalidatePortalCache(mat);
            invalidateRankingCache();
          }
        }
      }

      else if (action === "cadastrar_aluno" || action === "salvar_aluno") {
        const mat = String(payload.matricula).trim();
        if (mat) {
          await dbAdmin.collection("alunos").doc(mat).set({
            matricula: mat,
            nome: String(payload.nome || ""),
            dataNasc: String(payload.dataNasc || ""),
            email: String(payload.email || ""),
            turma: String(payload.turma || ""),
            telefoneAluno: String(payload.telefoneAluno || ""),
            telefoneResponsavel: String(payload.telefoneResponsavel || ""),
            obs: String(payload.obs || "")
          }, { merge: true });
          invalidatePortalCache(mat);
        }
      }

      else if (action === "inscrever_trilhatech" || action === "mudar_status_trilhatech") {
        const mat = String(payload.matricula).trim();
        if (mat) {
          const updateData: Record<string, string> = {};
          if (payload.turma) updateData.turmaTrilha = String(payload.turma).trim();
          if (payload.novoStatus) updateData.statusTrilha = String(payload.novoStatus).trim();
          if (action === "inscrever_trilhatech") updateData.statusTrilha = "Ativo";
          
          await dbAdmin.collection("alunos").doc(mat).set(updateData, { merge: true });
          invalidatePortalCache(mat);
        }
      }

    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Action Proxy Error]", err);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
