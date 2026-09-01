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

async function checkLuiz() {
    const matricula = "3986360";
    const entregasSnap = await db.collection("entregas").where("matricula", "==", matricula).get();
    
    let totalXP = 0;
    entregasSnap.forEach(doc => {
        const data = doc.data();
        const { semanaKey } = getRankingKeys(data.timestamp);
        if (semanaKey === "2026_W35" && data.xpGanho > 0) {
            console.log(`- ${data.idAtividade} | XP: ${data.xpGanho} | DataEnvio: ${new Date(data.timestamp).toISOString()} | Status: ${data.status} | Feedback: ${data.feedback}`);
            totalXP += data.xpGanho;
        }
    });
    
    console.log(`\nTOTAL XP SEMANA: ${totalXP}`);
}

checkLuiz().catch(console.error);
