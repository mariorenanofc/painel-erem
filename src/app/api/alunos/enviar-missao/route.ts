import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function POST(request: Request) {
  let matricula = "";
  let idAtividade = "";
  let resposta = "";
  try {
    const body = await request.json();
    matricula = String(body.matricula || "").trim();
    idAtividade = String(body.idAtividade || "").trim();
    resposta = String(body.resposta || "").trim();
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
      return NextResponse.json({ status: "erro", mensagem: "Você já enviou esta missão! Não é possível reenviar." });
    }

    // 3. Regras de Módulos (Encerrado)
    const moduloAtiv = String(ativ.modulo || "Geral").toLowerCase().trim();
    let xpFinalPermitido = Number(ativ.xp) || 0;

    // Buscar controle do módulo
    const modKey = `${ativ.modulo}|${turmaAlvo}`;
    const modKeyTodas = `${ativ.modulo}|Todas`;
    
    const modDoc = await dbAdmin.collection("controle_modulos").doc(modKey).get();
    const modDocTodas = await dbAdmin.collection("controle_modulos").doc(modKeyTodas).get();

    const statusMod = modDoc.exists 
      ? String(modDoc.data()?.status || "Aberto").toLowerCase().trim()
      : (modDocTodas.exists ? String(modDocTodas.data()?.status || "Aberto").toLowerCase().trim() : "aberto");

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
              const teto = Math.floor(xpFinalPermitido / 2);
              descontoAtraso = atrasoDias;
              if (descontoAtraso > teto) descontoAtraso = teto;
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
              if (descontoAtraso > 0) msgs.push(`-${descontoAtraso} XP por atraso`);
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

    // 6. Transação atômica no Firestore
    await dbAdmin.runTransaction(async (transaction: any) => {
      const freshAlunoDoc = await transaction.get(alunoRef);
      const freshAluno = freshAlunoDoc.data()!;
      const currentXp = Number(freshAluno.xp) || 0;

      // Gravar ou Atualizar entrega
      transaction.set(entregaRef, {
        id: docId,
        matricula,
        idAtividade,
        resposta,
        status: statusFinal,
        xpGanho: xpGanhoFinal,
        timestamp: timestampAtual,
        feedback: ""
      });

      // Atualizar XP se ganhou pontos e registrar lastUpdated
      const updatePayload: any = {
        lastUpdated: timestampAtual
      };
      if (xpGanhoFinal > 0) {
        updatePayload.xp = currentXp - xpAnterior + xpGanhoFinal;
      }
      transaction.update(alunoRef, updatePayload);
    });

    const msgRetorno = (ativ.tipo === "Quiz" && xpGanhoFinal > 0)
      ? "Resposta correta! XP adicionado." + msgDesconto
      : (ativ.tipo === "Quiz" && xpGanhoFinal === 0 && isCorreto)
        ? "Você acertou o Quiz, mas não ganhou XP." + msgDesconto
        : (ativ.tipo === "Quiz" && xpGanhoFinal === 0 && !isCorreto)
          ? "Resposta errada. Mas o Tutor pode rever depois!"
          : "Missão enviada com sucesso!";

    invalidatePortalCache(matricula);
    invalidateRankingCache();
    return NextResponse.json({ status: "sucesso", mensagem: msgRetorno });

  } catch (error: any) {
    console.warn("[Failover] Erro no envio de missão do Firestore:", error.message);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "enviar_atividade", matricula, idAtividade, resposta }),
        });
        return NextResponse.json(await response.json());
      } catch (sheetsErr) {}
    }
    return NextResponse.json({ status: "erro", mensagem: "Erro ao processar envio: " + error.message }, { status: 500 });
  }
}
