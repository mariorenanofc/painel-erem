const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
require("dotenv").config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!getApps().length) {
    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, "\n");
    }
    initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

const db = getFirestore();

// Funções utilitárias
function getRankingKeys(dateAtual) {
  const d = new Date(dateAtual);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const dStr = String(monday.getDate()).padStart(2, "0");
  const mStr = String(monday.getMonth() + 1).padStart(2, "0");
  const yStr = monday.getFullYear();
  const semanaKey = `${dStr}_${mStr}_${yStr}`;
  
  const mMes = String(dateAtual.getMonth() + 1).padStart(2, "0");
  const yMes = dateAtual.getFullYear();
  const mesKey = `${mMes}_${yMes}`;
  
  return { semanaKey, mesKey };
}

const normalizeToDateStr = (dateStr) => {
  if (!dateStr) return "";
  let d = "", m = "", y = "";
  if (dateStr.includes("T")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      d = parts[2];
      m = parts[1];
      y = parts[0];
    }
  } else if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = parts[2];
        m = parts[1];
        y = parts[0];
      } else {
        d = parts[0];
        m = parts[1];
        y = parts[2];
      }
    }
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      d = parts[0];
      m = parts[1];
      y = parts[2];
    }
  }
  if (d && m && y) {
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return "";
};

async function migrarRankingAtual() {
  console.log("🚀 Iniciando migração de Ranking Atual para os Agregadores...");

  const dataAtual = new Date();
  
  // 1. Chaves de hoje
  const { semanaKey, mesKey } = getRankingKeys(dataAtual);
  console.log(`Chaves geradas -> Semanal: ${semanaKey} | Mensal: ${mesKey}`);

  // 2. Definir Início/Fim Semanal
  let timeInicioSemana = 0;
  const diaSemana = dataAtual.getDay();
  const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioSemana = new Date(dataAtual);
  inicioSemana.setDate(dataAtual.getDate() - diffParaSegunda);
  inicioSemana.setHours(0, 0, 0, 0);
  timeInicioSemana = inicioSemana.getTime();

  // 3. Definir Início/Fim Mensal
  const inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
  inicioMes.setHours(0, 0, 0, 0);
  const timeInicioMes = inicioMes.getTime();

  const timeFim = dataAtual.getTime();
  
  // Como precisamos migrar ambos (Semanal e Mensal), o início global para varredura é o menor deles.
  // Como a semana pode começar no mês passado, precisamos pegar o Math.min
  const timeInicioGlobal = Math.min(timeInicioSemana, timeInicioMes);

  // 4. Carregar Atividades
  const atividadesMap = {};
  const atividadesSnap = await db.collection("atividades").get();
  atividadesSnap.forEach((doc) => {
    atividadesMap[doc.id] = { dataLimite: doc.data().dataLimite };
  });

  // 5. Carregar Justificativas de Falta
  const justificativasMap = {};
  const justificadasSnap = await db.collection("frequencia")
    .where("status", "in", ["Justificada", "justificada", "J", "j", "JUSTIFICADA"])
    .get();
  justificadasSnap.forEach((doc) => {
    const f = doc.data();
    const mat = f.matricula;
    const dataFormatada = normalizeToDateStr(f.data || "");
    if (mat && dataFormatada) {
      if (!justificativasMap[mat]) justificativasMap[mat] = new Set();
      justificativasMap[mat].add(dataFormatada);
    }
  });

  // 6. Estruturas em memória para os aggregators
  // Formato esperado no db: { alunos: { [matricula]: { xpNormal, xpAtrasado, ultimoEnvio } } }
  const alunosSemanal = {};
  const alunosMensal = {};

  const addXP = (alunoMap, matricula, xpNormal, xpAtrasado, timestamp) => {
    if (!alunoMap[matricula]) {
      alunoMap[matricula] = { xpNormal: 0, xpAtrasado: 0, ultimoEnvio: 9999999999999 };
    }
    alunoMap[matricula].xpNormal += xpNormal;
    alunoMap[matricula].xpAtrasado += xpAtrasado;
    if (timestamp > 0 && timestamp < alunoMap[matricula].ultimoEnvio) {
      alunoMap[matricula].ultimoEnvio = timestamp;
    }
  };

  // 7. Varredura Global de ENTREGAS
  console.log("Carregando Entregas recentes...");
  const entregasSnap = await db.collection("entregas")
    .where("timestamp", ">=", timeInicioGlobal)
    .where("timestamp", "<=", timeFim)
    .get();

  entregasSnap.forEach((doc) => {
    const e = doc.data();
    if (e.status !== "Avaliado") return;
    const mat = e.matricula;
    const xp = Number(e.xpGanho) || 0;
    const timestampEnvio = e.timestamp || 0;
    const idAtividade = e.idAtividade || doc.id.split("-")[0];

    // Verificar Atraso
    const ativ = atividadesMap[idAtividade];
    let ehAtrasado = false;
    if (ativ && ativ.dataLimite) {
      const dataLimiteStr = String(ativ.dataLimite).trim();
      let dataLimObj = null;
      if (dataLimiteStr.includes("-")) {
        const p = dataLimiteStr.split("T")[0].split("-");
        if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59);
      } else if (dataLimiteStr.includes("/")) {
        const p = dataLimiteStr.split("/");
        if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]), 23, 59, 59);
      }
      if (dataLimObj && timestampEnvio > dataLimObj.getTime()) {
        ehAtrasado = true;
      }
    }

    let temFaltaJustificada = false;
    if (ehAtrasado && ativ && ativ.dataLimite) {
      const dataLimiteStrNormalized = normalizeToDateStr(ativ.dataLimite);
      if (dataLimiteStrNormalized && justificativasMap[mat] && justificativasMap[mat].has(dataLimiteStrNormalized)) {
        temFaltaJustificada = true;
      }
    }

    const xpAtrasado = (ehAtrasado && !temFaltaJustificada) ? xp : 0;
    const xpNormal = (ehAtrasado && !temFaltaJustificada) ? 0 : xp;

    // Aplicar na Semana se estiver dentro da semana
    if (timestampEnvio >= timeInicioSemana && timestampEnvio <= timeFim) {
      addXP(alunosSemanal, mat, xpNormal, xpAtrasado, timestampEnvio);
    }
    
    // Aplicar no Mês se estiver dentro do mês
    if (timestampEnvio >= timeInicioMes && timestampEnvio <= timeFim) {
      addXP(alunosMensal, mat, xpNormal, xpAtrasado, timestampEnvio);
    }
  });

  // 8. Varredura Global de FREQUENCIA (Presenças)
  console.log("Carregando Frequências recentes...");
  const freqSnap = await db.collection("frequencia")
    .where("timestamp", ">=", timeInicioGlobal)
    .where("timestamp", "<=", timeFim)
    .get();

  freqSnap.forEach((doc) => {
    const f = doc.data();
    const statusVal = String(f.status || "").trim();
    if (!["Presente", "P", "p", "presente"].includes(statusVal)) return;
    
    const mat = f.matricula;
    const xp = Number(f.xpGanho) !== undefined && !isNaN(Number(f.xpGanho)) ? Number(f.xpGanho) : 10;
    const timestampFreq = f.timestamp || 0;

    // Frequência não tem atraso (XP vai todo pra normal)
    if (timestampFreq >= timeInicioSemana && timestampFreq <= timeFim) {
      addXP(alunosSemanal, mat, xp, 0, timestampFreq);
    }
    if (timestampFreq >= timeInicioMes && timestampFreq <= timeFim) {
      addXP(alunosMensal, mat, xp, 0, timestampFreq);
    }
  });

  // 9. Salvar no Firestore
  console.log(`Salvando estatisticas/ranking_semanal_${semanaKey}...`);
  await db.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`).set({ alunos: alunosSemanal }, { merge: true });

  console.log(`Salvando estatisticas/ranking_mensal_${mesKey}...`);
  await db.collection("estatisticas").doc(`ranking_mensal_${mesKey}`).set({ alunos: alunosMensal }, { merge: true });

  console.log("✅ Migração do Ranking Concluída com Sucesso!");
}

migrarRankingAtual().catch(console.error);
