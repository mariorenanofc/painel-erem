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

async function rebuildRankings() {
    console.log("Reconstruindo rankings baseados na collection entregas...");
    const entregasSnap = await db.collection("entregas").get();
    
    const rankingsSemana = {};
    const rankingsMes = {};

    let processed = 0;
    entregasSnap.forEach(doc => {
        const data = doc.data();
        if (!data.matricula || !data.timestamp || !data.xpGanho || data.xpGanho <= 0) return;

        const ts = data.timestamp;
        const keys = getRankingKeys(ts);
        const { semanaKey, mesKey } = keys;
        
        // Apenas reconstruir semana e mês atuais
        if (semanaKey !== "2026_W35" && mesKey !== "2026_08") return;

        if (semanaKey === "2026_W35") {
            if (!rankingsSemana[semanaKey]) rankingsSemana[semanaKey] = {};
            if (!rankingsSemana[semanaKey][data.matricula]) {
                rankingsSemana[semanaKey][data.matricula] = { xpNormal: 0, xpAtrasado: 0, ultimoEnvio: 0 };
            }
            rankingsSemana[semanaKey][data.matricula].xpNormal += data.xpGanho;
            if (ts > rankingsSemana[semanaKey][data.matricula].ultimoEnvio) {
                rankingsSemana[semanaKey][data.matricula].ultimoEnvio = ts;
            }
        }

        if (mesKey === "2026_08") {
            if (!rankingsMes[mesKey]) rankingsMes[mesKey] = {};
            if (!rankingsMes[mesKey][data.matricula]) {
                rankingsMes[mesKey][data.matricula] = { xpNormal: 0, xpAtrasado: 0, ultimoEnvio: 0 };
            }
            rankingsMes[mesKey][data.matricula].xpNormal += data.xpGanho;
            if (ts > rankingsMes[mesKey][data.matricula].ultimoEnvio) {
                rankingsMes[mesKey][data.matricula].ultimoEnvio = ts;
            }
        }
        
        processed++;
    });

    console.log(`Processadas ${processed} entregas relevantes para o período atual.`);

    const batch = db.batch();

    for (const [semana, alunos] of Object.entries(rankingsSemana)) {
        console.log(`Atualizando ranking_semanal_${semana} (${Object.keys(alunos).length} alunos)`);
        const ref = db.collection("estatisticas").doc(`ranking_semanal_${semana}`);
        batch.set(ref, { alunos }, { merge: true });
    }

    for (const [mes, alunos] of Object.entries(rankingsMes)) {
        console.log(`Atualizando ranking_mensal_${mes} (${Object.keys(alunos).length} alunos)`);
        const ref = db.collection("estatisticas").doc(`ranking_mensal_${mes}`);
        batch.set(ref, { alunos }, { merge: true });
    }

    await batch.commit();
    console.log("Reconstrução concluída com sucesso!");
}

rebuildRankings().catch(console.error);
