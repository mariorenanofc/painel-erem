import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { Transaction, FieldValue } from "firebase-admin/firestore";
import { calcularGamificacao, GamificacaoStatus } from "@/src/lib/gamificacao";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function POST(request: Request) {
  let matricula = "";
  let idAtividade = "";
  let resposta = "";
  try {
    const body = await request.json();
    matricula = String(body.matricula || "").trim();
    idAtividade = String(body.idAtividade || "").trim();
    resposta = String(body.resposta || "").trim();
    const xpGanhoBody = body.xpGanho !== undefined ? Number(body.xpGanho) : undefined;
    const timestampAtual = Date.now();

    if (!matricula || !idAtividade) {
      return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    const docId = `${idAtividade}-${matricula}`;
    const entregaRef = dbAdmin.collection("entregas").doc(docId);
    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const atividadeRef = dbAdmin.collection("atividades").doc(idAtividade);

    // 1. Carregar Aluno e Atividade
    const alunoDoc = await alunoRef.get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." });
    }
    const aluno = alunoDoc.data()!;
    const turmaAlvo = aluno.turma || aluno.turmaTrilha || "";

    const atividadeDoc = await atividadeRef.get();
    if (!atividadeDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Atividade não encontrada." });
    }
    const ativ = atividadeDoc.data()!;

    // 2. Verificar se já existe entrega
    const entregaDoc = await entregaRef.get();
    let linhaExistente = false;
    let statusAtualBD = "";
    let xpAnterior = 0;
    let ehEntregaClassroom = false;

    if (entregaDoc.exists) {
      linhaExistente = true;
      const entData = entregaDoc.data()!;
      statusAtualBD = String(entData.status || "").toLowerCase().trim();
      xpAnterior = Number(entData.xpGanho) || 0;
      if (String(entData.feedback || "").toLowerCase().includes("classroom") || String(entData.feedback || "").toLowerCase().includes("ava")) {
        ehEntregaClassroom = true;
      }
    }

    if (ehEntregaClassroom) {
      return NextResponse.json({ status: "erro", mensagem: "Você não precisa entregar por aqui! O sistema já avaliou automaticamente pelo Classroom. 🤖" });
    }
    if (linhaExistente && statusAtualBD !== "devolvida") {
      const isTyping = ativ.resolucaoTyping && String(ativ.resolucaoTyping).trim() !== "";
      if (isTyping && statusAtualBD === "aguardando validação") {
        // PERMITIR RE-ENVIO SILENCIOSO PARA O JOGO DE DIGITAÇÃO (Permite Auto-Save + Resgate Manual)
      } else {
        return NextResponse.json({ status: "erro", mensagem: "Você já enviou esta missão! Não é possível reenviar." });
      }
    }

    // 3. Regras de Módulos (Encerrado)
    let xpFinalPermitido = Number(ativ.xp) || 0;

    const moduloDaAtividade = String(ativ.modulo || "Geral").trim();
    const modKey = `${moduloDaAtividade}_${turmaAlvo}`.replace(/\s+/g, '_').toLowerCase();
    const modKeyTodas = `${moduloDaAtividade}_Todas`.replace(/\s+/g, '_').toLowerCase();
    
    const modDoc = await dbAdmin.collection("controle_modulos").doc(modKey).get();
    const modDocTodas = await dbAdmin.collection("controle_modulos").doc(modKeyTodas).get();

    let statusMod = "aberto";
    if (modDoc.exists) statusMod = String(modDoc.data()?.statusMod || "aberto").toLowerCase().trim();
    else if (modDocTodas.exists) statusMod = String(modDocTodas.data()?.statusMod || "aberto").toLowerCase().trim();

    if (statusMod === "encerrado") {
      xpFinalPermitido = 0;
    }

    // 4. Calcular Atraso
    let atrasoDias = 0;
    const dataLimiteStr = String(ativ.dataLimite || "").trim();
    let dataLimObj: Date | null = null;
    
    if (dataLimiteStr) {
      if (dataLimiteStr.includes("-")) {
        const p = dataLimiteStr.split("T")[0].split("-");
        if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      } else if (dataLimiteStr.includes("/")) {
        const p = dataLimiteStr.split("/");
        if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
      }
      if (dataLimObj) {
        dataLimObj.setHours(0, 0, 0, 0);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        if (hoje > dataLimObj) {
          atrasoDias = Math.ceil(Math.abs(hoje.getTime() - dataLimObj.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    }

    // 5. Determinar Status Final e XP Ganho
    let statusFinal = "Aguardando Correção";
    let xpGanhoFinal = 0;
    let msgDesconto = "";
    const isCorreto = ativ.tipo === "Material" ? true : (resposta.toUpperCase() === String(ativ.respostaCorreta || "").toUpperCase());

    const isTyping = ativ.resolucaoTyping && String(ativ.resolucaoTyping).trim() !== "";
    let feedbackFinal = "";

    if (isTyping) {
      statusFinal = "Aguardando Validação";
      xpGanhoFinal = 0;
      feedbackFinal = xpGanhoBody !== undefined ? `[XP_DIGITACAO: ${xpGanhoBody}]` : "";
    } else {
      const linkClassroom = String(ativ.linkClassroom || "").trim();
      if (linkClassroom && linkClassroom.includes("classroom.google.com")) {
        statusFinal = "Aguardando Validação";
        xpGanhoFinal = 0;
      } else {
        if (ativ.tipo === "Quiz" || ativ.tipo === "Material") {
          statusFinal = "Avaliado";
          if (isCorreto) {
            if (xpFinalPermitido > 0) {
              let descontoAtraso = 0;
              if (atrasoDias > 0) {
                // Regra Percentual: 10% por dia de atraso, teto de 50%
                const porcentagemDesconto = Math.min(atrasoDias * 0.10, 0.50);
                descontoAtraso = Math.floor(xpFinalPermitido * porcentagemDesconto);
              }

              const isGabaritoLiberado = ativ.gabaritoLiberado === true;
              let descontoGabarito = 0;
              if (atrasoDias > 0 && isGabaritoLiberado) {
                descontoGabarito = Math.floor((ativ.xp || 0) * 0.3);
              }

              const descontoTotal = descontoAtraso + descontoGabarito;
              xpGanhoFinal = xpFinalPermitido - descontoTotal;

              const piso = Math.ceil((ativ.xp || 0) * 0.1);
              if (xpGanhoFinal < piso) xpGanhoFinal = piso;

              if (descontoTotal > 0) {
                const msgs = [];
                if (descontoAtraso > 0) msgs.push(`-${descontoAtraso} XP (${atrasoDias * 10}% por atraso)`);
                if (descontoGabarito > 0) msgs.push(`-30% por gabarito liberado`);
                msgDesconto = ` (${msgs.join(", ")})`;
              }
            } else {
              xpGanhoFinal = 0;
              msgDesconto = " (0 XP: O módulo desta atividade já foi encerrado!)";
            }
          }
        }
      }
    }

    // 6. Transação atômica no Firestore
    const statusAnterior = entregaDoc.exists ? (entregaDoc.data()?.status || null) : null;

    let finalXp = 0;
    let finalGamificacao: GamificacaoStatus = {
      nivel: "Hello World",
      saldoCarteira: 0,
      progressoNivel: { porcentagem: 0, faltam: 500, nomeProximo: "Bug Hunter", isMaximo: false }
    };

    await dbAdmin.runTransaction(async (transaction: Transaction) => {
      const freshAlunoDoc = await transaction.get(alunoRef);
      const freshAluno = freshAlunoDoc.data()!;
      const currentXp = Number(freshAluno.xp) || 0;
      const xpGasto = Number(freshAluno.xpGasto) || 0;

      // Gravar ou Atualizar entrega
      transaction.set(entregaRef, {
        id: docId,
        matricula,
        idAtividade,
        resposta,
        status: statusFinal,
        xpGanho: xpGanhoFinal,
        timestamp: timestampAtual,
        feedback: feedbackFinal
      });

      // Atualizar contadores estatísticos de agregação
      const getStatusCategory = (status: string | null, fb: string = "") => {
        if (!status) return null;
        const s = String(status).trim();
        if (s === "Aguardando Correção") return "pendentes";
        if (s === "Aguardando Validação" || s === "Aguardando Validacao") return "aguardandoValidacao";
        if (s === "Avaliado" && (fb.includes("Classroom") || fb.includes("AVA") || fb.includes("sincronizada"))) {
          return "validadasAVA";
        }
        return null;
      };

      const oldCat = getStatusCategory(statusAnterior, entregaDoc.exists ? (entregaDoc.data()?.feedback || "") : "");
      const newCat = getStatusCategory(statusFinal, feedbackFinal);

      if (oldCat !== newCat) {
        const statsRef = dbAdmin.collection("estatisticas_atividades").doc(idAtividade);
        const statsUpdates: Record<string, FieldValue> = {};
        if (oldCat) statsUpdates[oldCat] = FieldValue.increment(-1);
        if (newCat) statsUpdates[newCat] = FieldValue.increment(1);
        transaction.set(statsRef, statsUpdates, { merge: true });
      }

      // Calcular novo XP
      finalXp = currentXp;
      if (xpGanhoFinal > 0) {
        finalXp = currentXp - xpAnterior + xpGanhoFinal;
      }

      const updatePayload: Record<string, unknown> = {
        lastUpdated: timestampAtual
      };
      if (xpGanhoFinal > 0) {
        updatePayload.xp = finalXp;
      }
      transaction.update(alunoRef, updatePayload);

      // Calcular nível e saldo atualizado do gamificação
      finalGamificacao = calcularGamificacao(finalXp, xpGasto);
    });

    const msgRetorno = isTyping
      ? `Código completado! Agora você deve entregar a atividade correspondente lá no Google Classroom para validarmos seus ${xpGanhoBody || ativ.xp || 200} XP calculados! 🚀`
      : (ativ.tipo === "Quiz" && xpGanhoFinal > 0)
        ? "Resposta correta! XP adicionado." + msgDesconto
        : (ativ.tipo === "Quiz" && xpGanhoFinal === 0 && isCorreto)
          ? "Você acertou o Quiz, mas não ganhou XP." + msgDesconto
          : (ativ.tipo === "Quiz" && xpGanhoFinal === 0 && !isCorreto)
            ? "Resposta errada. Mas o Tutor pode rever depois!"
            : "Missão enviada com sucesso!";

    invalidatePortalCache(matricula);
    invalidateRankingCache();

    // Sincronizar com Google Sheets em segundo plano (assíncrono, sem travar o usuário)
    if (GOOGLE_API_URL) {
      fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
          action: "enviar_atividade", 
          matricula, 
          idAtividade, 
          resposta, 
          xpGanho: xpGanhoFinal,
          feedback: feedbackFinal
        }),
      }).catch((error: unknown) => {
        const err = error as Error;
        console.error("[Background Sync Error] Enviar atividade:", err.message);
      });
    }

    return NextResponse.json({ 
      status: "sucesso", 
      mensagem: msgRetorno,
      perfilAtualizado: {
        xpTotal: finalXp,
        nivel: finalGamificacao.nivel,
        saldoCarteira: finalGamificacao.saldoCarteira,
        progressoNivel: finalGamificacao.progressoNivel
      },
      atividadeAtualizada: {
        id: idAtividade,
        status: statusFinal,
        respostaEnviada: resposta,
        xpGanho: xpGanhoFinal,
        dataEnvio: timestampAtual,
        feedback: feedbackFinal
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API Error] Erro no envio de missão:", err.message);
    return NextResponse.json({ status: "erro", mensagem: "Erro ao processar envio: " + err.message }, { status: 500 });
  }
}
