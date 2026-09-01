const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
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

function getRankingKeys(date) {
    const dataAtual = new Date(date);
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    const mesKey = `${ano}_${mes}`;

    const diaSemana = dataAtual.getDay();
    const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
    const inicioSemana = new Date(dataAtual);
    inicioSemana.setDate(dataAtual.getDate() - diffParaSegunda);
    inicioSemana.setHours(0, 0, 0, 0);

    const target = new Date(inicioSemana.valueOf());
    const dayNr = (inicioSemana.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const semanaKey = `${ano}_W${String(weekNumber).padStart(2, "0")}`;

    return { semanaKey, mesKey };
}

async function revalidate() {
    console.log("Carregando mapa de atividades...");
    const ativsSnap = await db.collection("atividades").get();
    const mapaAtividades = {};
    ativsSnap.forEach(doc => {
        mapaAtividades[doc.id] = doc.data();
    });

    console.log("Processando entregas e recalculando XP...");
    const entregasSnap = await db.collection("entregas").get();
    
    const rankingsSemana = {};
    const rankingsMes = {};
    const deltasAlunos = {}; // Para atualizar xpTotal
    
    const batchList = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    function commitBatch() {
        batchList.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount = 0;
    }

    entregasSnap.forEach(doc => {
        const data = doc.data();
        if (!data.matricula || !data.timestamp || !data.xpGanho || data.xpGanho <= 0) return;

        const ts = data.timestamp;
        const keys = getRankingKeys(ts);
        const { semanaKey, mesKey } = keys;
        
        // Focar apenas no que afeta os rankings atuais
        if (semanaKey !== "2026_W35" && mesKey !== "2026_08") return;

        let ehAtrasado = false;
        let novoXp = data.xpGanho;
        let novoFeedback = data.feedback || "";
        let mudou = false;

        if (data.idAtividade && data.idAtividade.startsWith("ATIV-")) {
            const ativ = mapaAtividades[data.idAtividade];
            if (ativ) {
                // Descobrir a base real de XP
                let baseXP = ativ.xp || 0;
                let matchDig = (data.feedback || "").match(/\[XP_DIGITACAO:\s*(\d+)\]/);
                if (matchDig) {
                    baseXP = parseInt(matchDig[1], 10);
                } else if (data.feedback && data.feedback.includes("Sincronizado via Google Classroom")) {
                    // Tentar inferir se a base que veio foi a cheia
                    // Como não gravamos o original do AVA se foi alterado, vamos assumir ativ.xp
                    // a menos que xpGanho > ativ.xp (o que pode ocorrer em atividades editadas)
                    if (data.xpGanho > baseXP) baseXP = data.xpGanho;
                }

                let atrasoDias = 0;
                if (ativ.dataLimite) {
                    let dataLimObj = null;
                    if (ativ.dataLimite.includes('T')) {
                        dataLimObj = new Date(ativ.dataLimite);
                    } else {
                        dataLimObj = new Date(ativ.dataLimite + "T23:59:59");
                    }
                    
                    if (dataLimObj && !isNaN(dataLimObj.getTime())) {
                        const dataEnvioZero = new Date(ts);
                        dataEnvioZero.setHours(0,0,0,0);
                        if (dataEnvioZero > dataLimObj) {
                            const diffTime = Math.abs(dataEnvioZero.getTime() - dataLimObj.getTime());
                            atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }
                    }
                }

                if (atrasoDias > 0) {
                    ehAtrasado = true;
                    let descontoAtraso = atrasoDias; // 1 XP por dia
                    
                    const isGabarito = ativ.gabaritoLiberado === true || String(ativ.gabaritoLiberado).toLowerCase() === "true";
                    let descontoGabarito = isGabarito ? Math.floor(baseXP * 0.3) : 0;
                    
                    const descontoTotal = descontoAtraso + descontoGabarito;
                    let xpRecalculado = baseXP - descontoTotal;
                    
                    const piso = Math.ceil(baseXP * 0.1);
                    if (xpRecalculado < piso && baseXP > 0) xpRecalculado = piso;
                    
                    if (xpRecalculado !== data.xpGanho) {
                        novoXp = xpRecalculado;
                        mudou = true;
                        
                        // Refazer o feedback se foi Classroom
                        if (data.feedback && data.feedback.includes("Sincronizado via Google Classroom")) {
                            const msgs = [];
                            if (descontoAtraso > 0) msgs.push(`-${descontoAtraso}XP por Atraso`);
                            if (descontoGabarito > 0) msgs.push(`-30% por Gabarito Liberado`);
                            const notaAdd = msgs.length > 0 ? ` (${msgs.join(", ")})` : "";
                            novoFeedback = `Sincronizado via Google Classroom${notaAdd}\n[🤖 AVA: Nota sincronizada automaticamente]`;
                        }
                    }
                }
            }
        } else if (data.feedback && (data.feedback.includes("por Atraso") || data.feedback.includes("Gabarito Liberado"))) {
            ehAtrasado = true;
        }

        // Se mudou o XP ganho na base, atualizar o doc
        if (mudou) {
            currentBatch.update(db.collection("entregas").doc(doc.id), {
                xpGanho: novoXp,
                feedback: novoFeedback
            });
            batchCount++;
            if (batchCount >= 400) commitBatch();

            // Delta para o aluno
            if (!deltasAlunos[data.matricula]) deltasAlunos[data.matricula] = 0;
            deltasAlunos[data.matricula] += (novoXp - data.xpGanho);
        }

        const xpNormal = ehAtrasado ? 0 : novoXp;
        const xpAtrasado = ehAtrasado ? novoXp : 0;

        if (semanaKey === "2026_W35") {
            if (!rankingsSemana[semanaKey]) rankingsSemana[semanaKey] = {};
            if (!rankingsSemana[semanaKey][data.matricula]) rankingsSemana[semanaKey][data.matricula] = { xpNormal: 0, xpAtrasado: 0, ultimoEnvio: 0 };
            rankingsSemana[semanaKey][data.matricula].xpNormal += xpNormal;
            rankingsSemana[semanaKey][data.matricula].xpAtrasado += xpAtrasado;
            if (ts > rankingsSemana[semanaKey][data.matricula].ultimoEnvio) rankingsSemana[semanaKey][data.matricula].ultimoEnvio = ts;
        }

        if (mesKey === "2026_08") {
            if (!rankingsMes[mesKey]) rankingsMes[mesKey] = {};
            if (!rankingsMes[mesKey][data.matricula]) rankingsMes[mesKey][data.matricula] = { xpNormal: 0, xpAtrasado: 0, ultimoEnvio: 0 };
            rankingsMes[mesKey][data.matricula].xpNormal += xpNormal;
            rankingsMes[mesKey][data.matricula].xpAtrasado += xpAtrasado;
            if (ts > rankingsMes[mesKey][data.matricula].ultimoEnvio) rankingsMes[mesKey][data.matricula].ultimoEnvio = ts;
        }
    });

    // Atualizar rankings
    for (const [semana, alunos] of Object.entries(rankingsSemana)) {
        currentBatch.set(db.collection("estatisticas").doc(`ranking_semanal_${semana}`), { alunos }, { merge: false });
        batchCount++;
    }
    for (const [mes, alunos] of Object.entries(rankingsMes)) {
        currentBatch.set(db.collection("estatisticas").doc(`ranking_mensal_${mes}`), { alunos }, { merge: false });
        batchCount++;
    }
    if (batchCount > 0) commitBatch();

    // Atualizar xpTotal dos alunos
    for (const [matricula, delta] of Object.entries(deltasAlunos)) {
        if (delta !== 0) {
            console.log(`Atualizando aluno ${matricula}: Delta = ${delta}`);
            // Pagar do banco, achar aluno com essa matricula
            const alunosSnap = await db.collection("alunos").where("matricula", "==", matricula).get();
            if (!alunosSnap.empty) {
                const docId = alunosSnap.docs[0].id;
                currentBatch.update(db.collection("alunos").doc(docId), {
                    xpTotal: FieldValue.increment(delta)
                });
                batchCount++;
                if (batchCount >= 400) commitBatch();
            }
        }
    }
    if (batchCount > 0) commitBatch();

    await Promise.all(batchList);
    console.log("Revalidação total concluída com sucesso!");
}

revalidate().catch(console.error);
