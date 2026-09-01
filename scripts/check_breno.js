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

async function checkBreno() {
    // 1. Encontrar o Breno
    const alunosRef = db.collection("alunos");
    const snapshot = await alunosRef.where("nome", "==", "BRENO RUAN LOPES DA SILVA").get();
    
    if (snapshot.empty) {
        console.log("Breno não encontrado!");
        return;
    }

    const brenoDoc = snapshot.docs[0];
    const matricula = brenoDoc.id;
    console.log("Matrícula do Breno:", matricula);
    console.log("XP atual do Breno:", brenoDoc.data().xp, "XP Total:", brenoDoc.data().xpTotal);

    // 2. Histórico de Pontuações
    console.log("\n--- HISTÓRICO DE ENTREGAS ---");
    const entregasRef = db.collection("entregas");
    const entregasSnap = await entregasRef.where("matricula", "==", matricula).get();
    
    const entregasDocs = entregasSnap.docs.map(doc => doc.data());
    entregasDocs.sort((a, b) => b.timestamp - a.timestamp);
    entregasDocs.slice(0, 20).forEach(data => {
        const dataString = new Date(data.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        console.log(`[${dataString}] Atividade: ${data.idAtividade} | XP: ${data.xpGanho} | Status: ${data.status} | Feedback: ${data.feedback || data.resposta}`);
    });

    console.log("\n--- PORTAL VIEWS ---");
    const portalDoc = await db.collection("portal_views").doc(matricula).get();
    if (portalDoc.exists) {
        console.log("ALL Root level keys in portal_views:", Object.keys(portalDoc.data()));
        const entregasMap = portalDoc.data().entregasMap || {};
        console.log(`Total de itens no entregasMap: ${Object.keys(entregasMap).length}`);
        Object.keys(entregasMap).forEach(key => {
            console.log(`Map Key: ${key} -> Status: ${entregasMap[key].status}`);
        });
    }
}

checkBreno().catch(console.error);
