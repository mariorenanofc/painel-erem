import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { clearAllPortalCaches, invalidateRankingCache, invalidateConfigCache } from "@/src/lib/cache";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN
  ? process.env.NEXT_PUBLIC_TUTOR_TOKEN.replace(/^["']|["']$/g, "").trim()
  : undefined;

interface TrilhaData {
  turmaTrilha: string;
  statusTrilha: string;
  dataInscricao: string;
  xp: number;
  nivel: string;
  whatsappConfirmado: boolean;
  pinPix: string;
  avatarId: string;
  likes: number;
  bloqueioPix: boolean;
  xpGasto: number;
}

export async function GET() {
  if (!GOOGLE_API_URL || !TUTOR_TOKEN) {
    return NextResponse.json({ error: "Configurações de API ausentes no .env" }, { status: 500 });
  }

  try {
    console.log("Iniciando busca de dados na Planilha...");
    let response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "exportar_dados_migracao", token: TUTOR_TOKEN }),
      redirect: "manual",
    });

    if (response.status === 302 || response.status === 301) {
      const redirectUrl = response.headers.get("location");
      if (redirectUrl) {
        response = await fetch(redirectUrl, {
          method: "GET",
        });
      }
    }

    const data = await response.json();
    if (data.status !== "sucesso") {
      return NextResponse.json({ error: data.mensagem || "Falha ao ler dados da planilha" }, { status: 500 });
    }

    console.log("Dados carregados com sucesso. Iniciando escrita seletiva no Firestore...");

    // A. CONFIGURAÇÕES
    const configValues = data.configuracoes || [];
    
    // Obter existentes para evitar escritas duplicadas
    const existingConfigSnap = await dbAdmin.collection("configuracoes").get();
    const existingConfigMap = new Map<string, string>();
    existingConfigSnap.forEach(doc => {
      existingConfigMap.set(doc.id, String(doc.data().valor || ""));
    });

    const configBatch = dbAdmin.batch();
    let configWrites = 0;
    for (let i = 1; i < configValues.length; i++) {
      const chave = String(configValues[i][0]).trim();
      const valor = String(configValues[i][1] || "");
      if (chave) {
        if (existingConfigMap.get(chave) !== valor) {
          const ref = dbAdmin.collection("configuracoes").doc(chave);
          configBatch.set(ref, { valor });
          configWrites++;
        }
      }
    }
    if (configWrites > 0) {
      await configBatch.commit();
      console.log(`[Sync] Configurações: ${configWrites} gravações realizadas.`);
    }

    // B. USUARIOS
    const userValues = data.usuarios || [];
    
    const existingUserSnap = await dbAdmin.collection("usuarios").get();
    const existingUserMap = new Map<string, Record<string, unknown>>();
    existingUserSnap.forEach(doc => {
      existingUserMap.set(doc.id, doc.data());
    });

    const userBatch = dbAdmin.batch();
    let userWrites = 0;
    for (let i = 1; i < userValues.length; i++) {
      const usuario = String(userValues[i][0]).trim().toLowerCase();
      const senha = String(userValues[i][1]).trim();
      const nome = String(userValues[i][2]).trim();
      if (usuario) {
        const existing = existingUserMap.get(usuario);
        const shouldWrite = !existing || existing.senha !== senha || existing.nome !== nome;
        if (shouldWrite) {
          const ref = dbAdmin.collection("usuarios").doc(usuario);
          userBatch.set(ref, { usuario, senha, nome });
          userWrites++;
        }
      }
    }
    if (userWrites > 0) {
      await userBatch.commit();
      console.log(`[Sync] Usuários: ${userWrites} gravações realizadas.`);
    }

    // C. ATIVIDADES (Com limpeza de removidas e escrita seletiva)
    const ativValues = data.atividades || [];
    const sheetAtivIds = new Set<string>();

    for (let i = 1; i < ativValues.length; i++) {
      const id = String(ativValues[i][0]).trim();
      if (id && id !== "ID") {
        sheetAtivIds.add(id);
      }
    }

    // Buscar atividades existentes no Firestore para comparar dados e deletar órfãs
    const dbAtivSnap = await dbAdmin.collection("atividades").get();
    const existingAtivMap = new Map<string, Record<string, unknown>>();
    dbAtivSnap.forEach(doc => {
      existingAtivMap.set(doc.id, doc.data());
    });
    const dbAtivIds = Array.from(existingAtivMap.keys());

    // Deletar as que não estão mais na planilha
    let deleteBatch = dbAdmin.batch();
    let deleteCount = 0;
    const deletePromises = [];
    for (const dbId of dbAtivIds) {
      if (!sheetAtivIds.has(dbId)) {
        deleteBatch.delete(dbAdmin.collection("atividades").doc(dbId));
        deleteCount++;
        if (deleteCount === 400) {
          deletePromises.push(deleteBatch.commit());
          deleteBatch = dbAdmin.batch();
          deleteCount = 0;
        }
      }
    }
    if (deleteCount > 0) {
      deletePromises.push(deleteBatch.commit());
    }
    await Promise.all(deletePromises);
    if (deleteCount > 0) {
      console.log(`[Sync] Atividades: ${deleteCount} remoções realizadas.`);
    }

    // Gravar seletivamente as atividades vindas da planilha
    let ativBatch = dbAdmin.batch();
    let ativCount = 0;
    let ativWrites = 0;
    const ativPromises = [];

    for (let i = 1; i < ativValues.length; i++) {
      const id = String(ativValues[i][0]).trim();
      if (!id || id === "ID") continue;

      const titulo = String(ativValues[i][1] || "");
      const descricao = String(ativValues[i][2] || "");
      const dataLimite = String(ativValues[i][3] || "");
      const xp = Number(ativValues[i][4]) || 0;
      const turmaAlvo = String(ativValues[i][5] || "Todas").trim();
      const tipo = String(ativValues[i][6] || "Projeto").trim();
      const opcaoA = String(ativValues[i][7] || "");
      const opcaoB = String(ativValues[i][8] || "");
      const opcaoC = String(ativValues[i][9] || "");
      const opcaoD = String(ativValues[i][10] || "");
      const respostaCorreta = String(ativValues[i][11] || "");
      const linkClassroom = String(ativValues[i][12] || "");
      const statusPublicacao = String(ativValues[i][13] || "Publicada").trim();
      const imageUrl = String(ativValues[i][14] || "");
      const modulo = String(ativValues[i][15] || "Geral").trim();
      const gabarito = String(ativValues[i][16] || "");
      const gabaritoLiberado = ativValues[i][17] === true || String(ativValues[i][17]).toLowerCase() === "true";
      const resolucaoTyping = String(ativValues[i][18] || "").trim();
      const limiteTempoTyping = Number(ativValues[i][19]) || 0;

      const existing = existingAtivMap.get(id);
      const shouldWrite = !existing ||
        existing.titulo !== titulo ||
        existing.descricao !== descricao ||
        existing.dataLimite !== dataLimite ||
        existing.xp !== xp ||
        existing.turmaAlvo !== turmaAlvo ||
        existing.tipo !== tipo ||
        existing.opcaoA !== opcaoA ||
        existing.opcaoB !== opcaoB ||
        existing.opcaoC !== opcaoC ||
        existing.opcaoD !== opcaoD ||
        existing.respostaCorreta !== respostaCorreta ||
        existing.linkClassroom !== linkClassroom ||
        existing.statusPublicacao !== statusPublicacao ||
        existing.imageUrl !== imageUrl ||
        existing.modulo !== modulo ||
        existing.gabarito !== gabarito ||
        existing.gabaritoLiberado !== gabaritoLiberado ||
        existing.resolucaoTyping !== resolucaoTyping ||
        existing.limiteTempoTyping !== limiteTempoTyping;

      if (shouldWrite) {
        const ref = dbAdmin.collection("atividades").doc(id);
        ativBatch.set(ref, {
          id,
          titulo,
          descricao,
          dataLimite,
          xp,
          turmaAlvo,
          tipo,
          opcaoA,
          opcaoB,
          opcaoC,
          opcaoD,
          respostaCorreta,
          linkClassroom,
          statusPublicacao,
          imageUrl,
          modulo,
          gabarito,
          gabaritoLiberado,
          resolucaoTyping,
          limiteTempoTyping
        });
        ativCount++;
        ativWrites++;
        if (ativCount === 400) {
          ativPromises.push(ativBatch.commit());
          ativBatch = dbAdmin.batch();
          ativCount = 0;
        }
      }
    }
    if (ativCount > 0) {
      ativPromises.push(ativBatch.commit());
    }
    await Promise.all(ativPromises);
    if (ativWrites > 0) {
      console.log(`[Sync] Atividades: ${ativWrites} gravações realizadas.`);
    }

    // D. ALUNOS (FUSÃO DE basededados E trilhatech com escrita seletiva)
    const baseValues = data.basededados || [];
    const trilhaValues = data.trilhatech || [];

    const trilhaMap: Record<string, TrilhaData> = {};
    const matriculaParaTurma: Record<string, string> = {};
    for (let i = 1; i < trilhaValues.length; i++) {
      const mat = String(trilhaValues[i][0]).trim();
      if (mat) {
        const tName = String(trilhaValues[i][1] || "").trim();
        matriculaParaTurma[mat] = tName;
        trilhaMap[mat] = {
          turmaTrilha: tName,
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

    // Buscar alunos existentes do Firestore para comparação
    const existingAlunosSnap = await dbAdmin.collection("alunos").get();
    const existingAlunosMap = new Map<string, Record<string, unknown>>();
    existingAlunosSnap.forEach(doc => {
      existingAlunosMap.set(doc.id, doc.data());
    });

    let alunoBatch = dbAdmin.batch();
    let alunoCount = 0;
    let alunoWrites = 0;
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
      const nome = String(baseValues[i][0] || "");
      const dataNasc = String(baseValues[i][1] || "");
      const email = String(baseValues[i][3] || "").toLowerCase().trim();
      const turma = String(baseValues[i][4] || "");
      const telefoneAluno = String(baseValues[i][5] || "");
      const telefoneResponsavel = String(baseValues[i][6] || "");
      const obs = String(baseValues[i][7] || "");

      const existing = existingAlunosMap.get(matricula);
      const shouldWrite = !existing ||
        existing.nome !== nome ||
        existing.dataNasc !== dataNasc ||
        existing.email !== email ||
        existing.turma !== turma ||
        existing.telefoneAluno !== telefoneAluno ||
        existing.telefoneResponsavel !== telefoneResponsavel ||
        existing.obs !== obs ||
        existing.turmaTrilha !== tData.turmaTrilha ||
        existing.statusTrilha !== tData.statusTrilha ||
        existing.dataInscricao !== tData.dataInscricao ||
        existing.xp !== tData.xp ||
        existing.nivel !== tData.nivel ||
        existing.whatsappConfirmado !== tData.whatsappConfirmado ||
        existing.pinPix !== tData.pinPix ||
        existing.avatarId !== tData.avatarId ||
        existing.likes !== tData.likes ||
        existing.bloqueioPix !== tData.bloqueioPix ||
        existing.xpGasto !== tData.xpGasto;

      if (shouldWrite) {
        alunoBatch.set(ref, {
          matricula,
          nome,
          dataNasc,
          email,
          turma,
          telefoneAluno,
          telefoneResponsavel,
          obs,
          ...tData
        });
        alunoCount++;
        alunoWrites++;
        if (alunoCount === 400) {
          alunoPromises.push(alunoBatch.commit());
          alunoBatch = dbAdmin.batch();
          alunoCount = 0;
        }
      }
    }
    if (alunoCount > 0) {
      alunoPromises.push(alunoBatch.commit());
    }
    await Promise.all(alunoPromises);
    if (alunoWrites > 0) {
      console.log(`[Sync] Alunos: ${alunoWrites} gravações realizadas.`);
    }

    // E. ENTREGAS (Escrita seletiva baseada em conteúdo)
    const entregasValues = data.entregas || [];
    
    // Obter entregas existentes do Firestore para comparação
    const existingEntregasSnap = await dbAdmin.collection("entregas").get();
    const existingEntregasMap = new Map<string, Record<string, unknown>>();
    existingEntregasSnap.forEach(doc => {
      existingEntregasMap.set(doc.id, doc.data());
    });

    let currentBatch = dbAdmin.batch();
    let opCount = 0;
    let entregasWrites = 0;
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

      const existing = existingEntregasMap.get(id);
      const shouldWrite = !existing ||
        existing.matricula !== matricula ||
        existing.idAtividade !== idAtiv ||
        existing.resposta !== resposta ||
        existing.status !== statusEntrega ||
        existing.xpGanho !== xpGanho ||
        existing.timestamp !== timestamp ||
        existing.feedback !== feedback;

      if (shouldWrite) {
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
        opCount++;
        entregasWrites++;
        if (opCount === 400) {
          entregasPromises.push(currentBatch.commit());
          currentBatch = dbAdmin.batch();
          opCount = 0;
        }
      }

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
    }
    if (opCount > 0) {
      entregasPromises.push(currentBatch.commit());
    }
    await Promise.all(entregasPromises);
    if (entregasWrites > 0) {
      console.log(`[Sync] Entregas: ${entregasWrites} gravações realizadas.`);
    }

    // F. FREQUENCIA (Escrita seletiva)
    const freqValues = data.frequencia || [];

    // Obter frequencias existentes do Firestore para comparação
    const existingFreqSnap = await dbAdmin.collection("frequencia").get();
    const existingFreqMap = new Map<string, Record<string, unknown>>();
    existingFreqSnap.forEach(doc => {
      existingFreqMap.set(doc.id, doc.data());
    });

    currentBatch = dbAdmin.batch();
    opCount = 0;
    let freqWrites = 0;
    const freqPromises = [];

    for (let i = 1; i < freqValues.length; i++) {
      const id = String(freqValues[i][0]).trim();
      const matricula = String(freqValues[i][1]).trim();
      const nome = String(freqValues[i][2]).trim();
      const dataStrRaw = String(freqValues[i][3]).trim();
      const hora = String(freqValues[i][4]).trim();
      const xpGanho = Number(freqValues[i][5]) || 10;
      const justificativa = String(freqValues[i][6] || "").trim();
      const turma = matriculaParaTurma[matricula] || String(freqValues[i][7] || "").trim();

      if (!id || !matricula) continue;

      const status = id.startsWith("FALTA-") ? "Justificada" : "Presente";

      let dataStr = dataStrRaw;
      if (dataStrRaw.includes("T")) {
        const parts = dataStrRaw.split("T")[0].split("-");
        if (parts.length === 3) dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (dataStrRaw.includes("-") && dataStrRaw.split("-")[0].length === 4) {
        const parts = dataStrRaw.split("-");
        dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      if (dataStr.includes("/") && dataStr.length > 10) {
        dataStr = dataStr.slice(0, 10);
      }

      let docTimestamp = Date.now();
      let p: string[] = [];
      if (dataStr.includes("/")) p = dataStr.split("/");
      else if (dataStr.includes("-")) p = dataStr.split("-");
      if (p.length === 3) {
        docTimestamp = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]), 12, 0, 0).getTime();
      }

      const docId = `${dataStr.replace(/\//g, "-")}_${matricula}`;
      
      const existing = existingFreqMap.get(docId);
      const shouldWrite = !existing ||
        existing.data !== dataStr ||
        existing.matricula !== matricula ||
        existing.nome !== nome ||
        existing.hora !== hora ||
        existing.status !== status ||
        existing.xpGanho !== xpGanho ||
        existing.justificativa !== justificativa ||
        existing.turma !== turma ||
        existing.timestamp !== docTimestamp;

      if (shouldWrite) {
        const ref = dbAdmin.collection("frequencia").doc(docId);
        currentBatch.set(ref, {
          id: docId,
          data: dataStr,
          matricula,
          nome,
          hora,
          status,
          xpGanho,
          justificativa,
          turma,
          timestamp: docTimestamp
        });
        opCount++;
        freqWrites++;
        if (opCount === 400) {
          freqPromises.push(currentBatch.commit());
          currentBatch = dbAdmin.batch();
          opCount = 0;
        }
      }
    }
    if (opCount > 0) {
      freqPromises.push(currentBatch.commit());
    }
    await Promise.all(freqPromises);
    if (freqWrites > 0) {
      console.log(`[Sync] Frequencia: ${freqWrites} gravações realizadas.`);
    }

    // G. RIFA BILHETES (Escrita seletiva)
    const rifaValues = data.rifa_bilhetes || [];
    
    const existingRifaSnap = await dbAdmin.collection("rifa_bilhetes").get();
    const existingRifaMap = new Map<string, Record<string, unknown>>();
    existingRifaSnap.forEach(doc => {
      existingRifaMap.set(doc.id, doc.data());
    });

    currentBatch = dbAdmin.batch();
    opCount = 0;
    let rifaWrites = 0;
    const rifaPromises = [];

    for (let i = 1; i < rifaValues.length; i++) {
      const id = String(rifaValues[i][0]).trim();
      if (!id) continue;
      
      const matricula = String(rifaValues[i][1]).trim();
      const nomeAluno = String(rifaValues[i][2] || "");
      const turma = String(rifaValues[i][3] || "");
      const dataV = String(rifaValues[i][4] || "");
      const status = String(rifaValues[i][5] || "ATIVO").trim();

      const existing = existingRifaMap.get(id);
      const shouldWrite = !existing ||
        existing.matricula !== matricula ||
        existing.nomeAluno !== nomeAluno ||
        existing.turma !== turma ||
        existing.data !== dataV ||
        existing.status !== status;

      if (shouldWrite) {
        const ref = dbAdmin.collection("rifa_bilhetes").doc(id);
        currentBatch.set(ref, {
          id,
          matricula,
          nomeAluno,
          turma,
          data: dataV,
          status,
          timestamp: Date.now()
        });
        opCount++;
        rifaWrites++;
        if (opCount === 400) {
          rifaPromises.push(currentBatch.commit());
          currentBatch = dbAdmin.batch();
          opCount = 0;
        }
      }
    }
    if (opCount > 0) {
      rifaPromises.push(currentBatch.commit());
    }
    await Promise.all(rifaPromises);
    if (rifaWrites > 0) {
      console.log(`[Sync] Rifa Bilhetes: ${rifaWrites} gravações realizadas.`);
    }

    // H. CURTIDAS (Escrita seletiva)
    const curtidasValues = data.curtidas || [];

    const existingCurtidasSnap = await dbAdmin.collection("curtidas").get();
    const existingCurtidasMap = new Map<string, Record<string, unknown>>();
    existingCurtidasSnap.forEach(doc => {
      existingCurtidasMap.set(doc.id, doc.data());
    });

    currentBatch = dbAdmin.batch();
    opCount = 0;
    let curtidasWrites = 0;
    const curtidasPromises = [];

    for (let i = 1; i < curtidasValues.length; i++) {
      const id = String(curtidasValues[i][0]).trim();
      if (!id) continue;
      
      const remetente = String(curtidasValues[i][1]).trim();
      const destinatario = String(curtidasValues[i][2]).trim();
      const dataV = String(curtidasValues[i][3]).trim();

      const existing = existingCurtidasMap.get(id);
      const shouldWrite = !existing ||
        existing.remetente !== remetente ||
        existing.destinatario !== destinatario ||
        existing.data !== dataV;

      if (shouldWrite) {
        const ref = dbAdmin.collection("curtidas").doc(id);
        currentBatch.set(ref, {
          id,
          remetente,
          destinatario,
          data: dataV,
          timestamp: Date.now()
        });
        opCount++;
        curtidasWrites++;
        if (opCount === 400) {
          curtidasPromises.push(currentBatch.commit());
          currentBatch = dbAdmin.batch();
          opCount = 0;
        }
      }
    }
    if (opCount > 0) {
      curtidasPromises.push(currentBatch.commit());
    }
    await Promise.all(curtidasPromises);
    if (curtidasWrites > 0) {
      console.log(`[Sync] Curtidas: ${curtidasWrites} gravações realizadas.`);
    }

    // I. MODULOS (Controle de Módulos)
    console.log("Migrando controle de módulos...");
    const moduloValues = data.controle_modulos || [];

    const existingModulosSnap = await dbAdmin.collection("modulos").get();
    const existingModulosMap = new Map<string, Record<string, unknown>>();
    existingModulosSnap.forEach(doc => {
      existingModulosMap.set(doc.id, doc.data());
    });

    const moduloBatch = dbAdmin.batch();
    let moduloWrites = 0;
    for (let i = 1; i < moduloValues.length; i++) {
      const nomeMod = String(moduloValues[i][0]).trim();
      const statusMod = String(moduloValues[i][1]).trim();
      const turmaMod = String(moduloValues[i][2] || "Todas").trim();
      if (nomeMod) {
        const docId = `${nomeMod}|${turmaMod}`;
        const existing = existingModulosMap.get(docId);
        const shouldWrite = !existing ||
          existing.nome !== nomeMod ||
          existing.status !== statusMod ||
          existing.turma !== turmaMod;

        if (shouldWrite) {
          const ref = dbAdmin.collection("modulos").doc(docId);
          moduloBatch.set(ref, {
            nome: nomeMod,
            status: statusMod,
            turma: turmaMod
          });
          moduloWrites++;
        }
      }
    }
    if (moduloWrites > 0) {
      await moduloBatch.commit();
      console.log(`[Sync] Módulos: ${moduloWrites} gravações realizadas.`);
    }

    // J. ESTATISTICAS ATIVIDADES (Contadores Consolidados)
    console.log("Migrando estatísticas consolidadas de atividades...");

    const existingStatsSnap = await dbAdmin.collection("estatisticas_atividades").get();
    const existingStatsMap = new Map<string, Record<string, unknown>>();
    existingStatsSnap.forEach(doc => {
      existingStatsMap.set(doc.id, doc.data());
    });

    const statsBatch = dbAdmin.batch();
    let statsWrites = 0;
    for (const idAtiv of Object.keys(statsTempMap)) {
      const currentStats = statsTempMap[idAtiv];
      const existing = existingStatsMap.get(idAtiv);
      const shouldWrite = !existing ||
        existing.pendentes !== currentStats.pendentes ||
        existing.aguardandoValidacao !== currentStats.aguardandoValidacao ||
        existing.validadasAVA !== currentStats.validadasAVA;

      if (shouldWrite) {
        const ref = dbAdmin.collection("estatisticas_atividades").doc(idAtiv);
        statsBatch.set(ref, currentStats);
        statsWrites++;
      }
    }
    if (statsWrites > 0) {
      await statsBatch.commit();
      console.log(`[Sync] Estatísticas: ${statsWrites} gravações realizadas.`);
    }

    console.log("Migração concluída com sucesso no Firestore! Invalidando caches...");
    clearAllPortalCaches();
    invalidateRankingCache();
    invalidateConfigCache();
    return NextResponse.json({ status: "sucesso", mensagem: "Migração completa para o Firestore!" });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro durante a migração:", err);
    return NextResponse.json({ error: "Falha na migração: " + err.message }, { status: 500 });
  }
}
