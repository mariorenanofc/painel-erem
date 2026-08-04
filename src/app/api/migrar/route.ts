import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

export async function GET() {
  if (!GOOGLE_API_URL || !TUTOR_TOKEN) {
    return NextResponse.json({ error: "Configurações de API ausentes no .env" }, { status: 500 });
  }

  try {
    console.log("Iniciando busca de dados na Planilha...");
    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "exportar_dados_migracao", token: TUTOR_TOKEN }),
    });

    const data = await response.json();
    if (data.status !== "sucesso") {
      return NextResponse.json({ error: data.mensagem || "Falha ao ler dados da planilha" }, { status: 500 });
    }

    console.log("Dados carregados com sucesso. Iniciando escrita paralela no Firestore...");

    // A. CONFIGURAÇÕES
    const configValues = data.configuracoes || [];
    const configBatch = dbAdmin.batch();
    for (let i = 1; i < configValues.length; i++) {
      const chave = String(configValues[i][0]).trim();
      const valor = configValues[i][1];
      if (chave) {
        const ref = dbAdmin.collection("configuracoes").doc(chave);
        configBatch.set(ref, { valor });
      }
    }
    await configBatch.commit();

    // B. USUARIOS
    const userValues = data.usuarios || [];
    const userBatch = dbAdmin.batch();
    for (let i = 1; i < userValues.length; i++) {
      const usuario = String(userValues[i][0]).trim().toLowerCase();
      const senha = String(userValues[i][1]).trim();
      const nome = String(userValues[i][2]).trim();
      if (usuario) {
        const ref = dbAdmin.collection("usuarios").doc(usuario);
        userBatch.set(ref, { usuario, senha, nome });
      }
    }
    await userBatch.commit();

    // C. ATIVIDADES (Processamento Paralelo)
    const ativValues = data.atividades || [];
    let ativBatch = dbAdmin.batch();
    let ativCount = 0;
    const ativPromises = [];

    for (let i = 1; i < ativValues.length; i++) {
      const id = String(ativValues[i][0]).trim();
      if (!id || id === "ID") continue;
      const ref = dbAdmin.collection("atividades").doc(id);
      ativBatch.set(ref, {
        id,
        titulo: String(ativValues[i][1] || ""),
        descricao: String(ativValues[i][2] || ""),
        dataLimite: String(ativValues[i][3] || ""),
        xp: Number(ativValues[i][4]) || 0,
        turmaAlvo: String(ativValues[i][5] || "Todas").trim(),
        tipo: String(ativValues[i][6] || "Projeto").trim(),
        opcaoA: String(ativValues[i][7] || ""),
        opcaoB: String(ativValues[i][8] || ""),
        opcaoC: String(ativValues[i][9] || ""),
        opcaoD: String(ativValues[i][10] || ""),
        respostaCorreta: String(ativValues[i][11] || ""),
        linkClassroom: String(ativValues[i][12] || ""),
        statusPublicacao: String(ativValues[i][13] || "Publicada").trim(),
        imageUrl: String(ativValues[i][14] || ""),
        modulo: String(ativValues[i][15] || "Geral").trim(),
        gabarito: String(ativValues[i][16] || ""),
        gabaritoLiberado: ativValues[i][17] === true || String(ativValues[i][17]).toLowerCase() === "true",
        resolucaoTyping: String(ativValues[i][18] || "").trim(),
        limiteTempoTyping: Number(ativValues[i][19]) || 0
      });

      ativCount++;
      if (ativCount === 400) {
        ativPromises.push(ativBatch.commit());
        ativBatch = dbAdmin.batch();
        ativCount = 0;
      }
    }
    if (ativCount > 0) {
      ativPromises.push(ativBatch.commit());
    }
    await Promise.all(ativPromises);

    // D. ALUNOS (FUSÃO DE basededados E trilhatech)
    const baseValues = data.basededados || [];
    const trilhaValues = data.trilhatech || [];

    const trilhaMap: any = {};
    for (let i = 1; i < trilhaValues.length; i++) {
      const mat = String(trilhaValues[i][0]).trim();
      if (mat) {
        trilhaMap[mat] = {
          turmaTrilha: String(trilhaValues[i][1] || ""),
          statusTrilha: String(trilhaValues[i][2] || ""),
          dataInscricao: String(trilhaValues[i][3] || ""),
          xp: Number(trilhaValues[i][4]) || 0,
          nivel: String(trilhaValues[i][5] || "Iniciante"),
          whatsappConfirmado: String(trilhaValues[i][6]).trim().toUpperCase() === "SIM",
          pinPix: String(trilhaValues[i][7] || "").trim(),
          avatarId: String(trilhaValues[i][8] || "avatar_01"),
          likes: Number(trilhaValues[i][9]) || 0,
          bloqueioPix: String(trilhaValues[i][10]).trim().toUpperCase() === "SIM",
          xpGasto: Number(trilhaValues[i][11]) || 0
        };
      }
    }

    let alunoBatch = dbAdmin.batch();
    let alunoCount = 0;
    const alunoPromises = [];

    for (let i = 1; i < baseValues.length; i++) {
      const matricula = String(baseValues[i][2]).trim();
      if (!matricula) continue;
      const tData = trilhaMap[matricula] || {
        turmaTrilha: "",
        statusTrilha: "",
        dataInscricao: "",
        xp: 0,
        nivel: "Iniciante",
        whatsappConfirmado: false,
        pinPix: "",
        avatarId: "avatar_01",
        likes: 0,
        bloqueioPix: false,
        xpGasto: 0
      };

      const ref = dbAdmin.collection("alunos").doc(matricula);
      alunoBatch.set(ref, {
        matricula,
        nome: String(baseValues[i][0] || ""),
        dataNasc: String(baseValues[i][1] || ""),
        email: String(baseValues[i][3] || "").toLowerCase().trim(),
        turma: String(baseValues[i][4] || ""),
        telefoneAluno: String(baseValues[i][5] || ""),
        telefoneResponsavel: String(baseValues[i][6] || ""),
        obs: String(baseValues[i][7] || ""),
        ...tData
      });

      alunoCount++;
      if (alunoCount === 400) {
        alunoPromises.push(alunoBatch.commit());
        alunoBatch = dbAdmin.batch();
        alunoCount = 0;
      }
    }
    if (alunoCount > 0) {
      alunoPromises.push(alunoBatch.commit());
    }
    await Promise.all(alunoPromises);

    // E. ENTREGAS (Processamento Paralelo em Lote)
    const entregasValues = data.entregas || [];
    let currentBatch = dbAdmin.batch();
    let opCount = 0;
    const entregasPromises = [];
    const statsTempMap: Record<string, { pendentes: number; aguardandoValidacao: number; validadasAVA: number }> = {};

    for (let i = 1; i < entregasValues.length; i++) {
      const id = String(entregasValues[i][0]).trim();
      if (!id) continue;

      const matricula = String(entregasValues[i][1]).trim();
      const idAtiv = String(entregasValues[i][2]).trim();
      const resposta = String(entregasValues[i][3] || "");
      const statusEntrega = String(entregasValues[i][4] || "Aguardando Correção").trim();
      const xpGanho = Number(entregasValues[i][5]) || 0;
      const timestamp = Number(entregasValues[i][6]) || 0;
      const feedback = String(entregasValues[i][7] || "").trim();

      const ref = dbAdmin.collection("entregas").doc(id);
      currentBatch.set(ref, {
        id,
        matricula,
        idAtividade: idAtiv,
        resposta,
        status: statusEntrega,
        xpGanho,
        timestamp,
        feedback
      });

      // Acumular estatísticas se for atividade escolar real
      if (idAtiv && !id.startsWith("BADGE-") && !id.startsWith("NIVER-") && !id.startsWith("COMPRA-") && !id.startsWith("DOACAO-")) {
        if (!statsTempMap[idAtiv]) {
          statsTempMap[idAtiv] = { pendentes: 0, aguardandoValidacao: 0, validadasAVA: 0 };
        }
        if (statusEntrega === "Aguardando Correção") {
          statsTempMap[idAtiv].pendentes++;
        } else if (statusEntrega === "Aguardando Validação" || statusEntrega === "Aguardando Validacao") {
          statsTempMap[idAtiv].aguardandoValidacao++;
        } else if (statusEntrega === "Avaliado" && (feedback.includes("Classroom") || feedback.includes("AVA") || feedback.includes("sincronizada"))) {
          statsTempMap[idAtiv].validadasAVA++;
        }
      }

      opCount++;
      if (opCount === 400) {
        entregasPromises.push(currentBatch.commit());
        currentBatch = dbAdmin.batch();
        opCount = 0;
      }
    }
    if (opCount > 0) {
      entregasPromises.push(currentBatch.commit());
    }
    await Promise.all(entregasPromises);

    // F. FREQUENCIA (Processamento Paralelo)
    const freqValues = data.frequencia || [];
    currentBatch = dbAdmin.batch();
    opCount = 0;
    const freqPromises = [];

    for (let i = 1; i < freqValues.length; i++) {
      const dataStr = String(freqValues[i][0]).trim();
      const matricula = String(freqValues[i][1]).trim();
      const turma = String(freqValues[i][2]).trim();
      const status = String(freqValues[i][3] || "Presente").trim();
      const justificativa = String(freqValues[i][4] || "").trim();

      if (!dataStr || !matricula) continue;

      const docId = `${dataStr.replace(/\//g, "-")}_${matricula}`;
      const ref = dbAdmin.collection("frequencia").doc(docId);
      currentBatch.set(ref, {
        id: docId,
        data: dataStr,
        matricula,
        turma,
        status,
        justificativa,
        timestamp: Date.now() // data-driven fallback if needed
      });

      opCount++;
      if (opCount === 400) {
        freqPromises.push(currentBatch.commit());
        currentBatch = dbAdmin.batch();
        opCount = 0;
      }
    }
    if (opCount > 0) {
      freqPromises.push(currentBatch.commit());
    }
    await Promise.all(freqPromises);

    // G. RIFA BILHETES (Processamento Paralelo)
    const rifaValues = data.rifa_bilhetes || [];
    currentBatch = dbAdmin.batch();
    opCount = 0;
    const rifaPromises = [];

    for (let i = 1; i < rifaValues.length; i++) {
      const id = String(rifaValues[i][0]).trim();
      if (!id) continue;
      const ref = dbAdmin.collection("rifa_bilhetes").doc(id);
      currentBatch.set(ref, {
        id,
        matricula: String(rifaValues[i][1]).trim(),
        nomeAluno: String(rifaValues[i][2] || ""),
        turma: String(rifaValues[i][3] || ""),
        data: String(rifaValues[i][4] || ""),
        status: String(rifaValues[i][5] || "ATIVO").trim(),
        timestamp: Date.now()
      });

      opCount++;
      if (opCount === 400) {
        rifaPromises.push(currentBatch.commit());
        currentBatch = dbAdmin.batch();
        opCount = 0;
      }
    }
    if (opCount > 0) {
      rifaPromises.push(currentBatch.commit());
    }
    await Promise.all(rifaPromises);

    // H. CURTIDAS (Processamento Paralelo)
    const curtidasValues = data.curtidas || [];
    currentBatch = dbAdmin.batch();
    opCount = 0;
    const curtidasPromises = [];

    for (let i = 1; i < curtidasValues.length; i++) {
      const id = String(curtidasValues[i][0]).trim();
      if (!id) continue;
      const ref = dbAdmin.collection("curtidas").doc(id);
      currentBatch.set(ref, {
        id,
        remetente: String(curtidasValues[i][1]).trim(),
        destinatario: String(curtidasValues[i][2]).trim(),
        data: String(curtidasValues[i][3]).trim(),
        timestamp: Date.now()
      });

      opCount++;
      if (opCount === 400) {
        curtidasPromises.push(currentBatch.commit());
        currentBatch = dbAdmin.batch();
        opCount = 0;
      }
    }
    if (opCount > 0) {
      curtidasPromises.push(currentBatch.commit());
    }
    await Promise.all(curtidasPromises);

    // I. MODULOS (Controle de Módulos)
    console.log("Migrando controle de módulos...");
    const moduloValues = data.controle_modulos || [];
    const moduloBatch = dbAdmin.batch();
    for (let i = 1; i < moduloValues.length; i++) {
      const nomeMod = String(moduloValues[i][0]).trim();
      const statusMod = String(moduloValues[i][1]).trim();
      const turmaMod = String(moduloValues[i][2] || "Todas").trim();
      if (nomeMod) {
        const docId = `${nomeMod}|${turmaMod}`;
        const ref = dbAdmin.collection("modulos").doc(docId);
        moduloBatch.set(ref, {
          nome: nomeMod,
          status: statusMod,
          turma: turmaMod
        });
      }
    }
    await moduloBatch.commit();

    // J. ESTATISTICAS ATIVIDADES (Contadores Consolidados)
    console.log("Migrando estatísticas consolidadas de atividades...");
    const statsBatch = dbAdmin.batch();
    for (const idAtiv of Object.keys(statsTempMap)) {
      const ref = dbAdmin.collection("estatisticas_atividades").doc(idAtiv);
      statsBatch.set(ref, statsTempMap[idAtiv]);
    }
    await statsBatch.commit();

    console.log("Migração concluída com sucesso no Firestore!");
    return NextResponse.json({ status: "sucesso", mensagem: "Migração completa para o Firestore!" });
  } catch (error: any) {
    console.error("Erro durante a migração:", error);
    return NextResponse.json({ error: "Falha na migração: " + error.message }, { status: 500 });
  }
}
