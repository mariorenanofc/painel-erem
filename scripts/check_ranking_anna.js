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

async function checkRanking() {
    const snap = await db.collection("estatisticas").get();
    snap.forEach(doc => {
        if (doc.id.startsWith("ranking_semanal_2026")) {
            console.log(`\n=== ${doc.id} ===`);
            const alunos = doc.data().alunos || {};
            const anna = alunos["3183600"];
            if (anna) {
                console.log(`Anna Bethânia (3183600): XP Normal = ${anna.xpNormal} | XP Atrasado = ${anna.xpAtrasado}`);
            } else {
                console.log(`Anna Bethânia (3183600) NÃO ESTÁ NESSE RANKING`);
            }
        }
    });
}

checkRanking().catch(console.error);
