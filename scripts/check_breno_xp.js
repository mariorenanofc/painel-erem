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

async function checkBrenoXp() {
    const matricula = "3826087";
    const entregasSnap = await db.collection("entregas").where("matricula", "==", matricula).get();
    
    const docs = entregasSnap.docs.map(d => d.data());
    docs.sort((a, b) => (b.xpGanho || 0) - (a.xpGanho || 0));
    
    console.log("Top 10 atividades que mais deram XP para o Breno:");
    docs.slice(0, 10).forEach(d => {
        console.log(`- ${d.idAtividade}: ${d.xpGanho} XP | Data: ${new Date(d.timestamp).toLocaleString("pt-BR")}`);
    });

    console.log("\nTop 10 atividades mais antigas (quando ele começou a ganhar muito XP):");
    docs.sort((a, b) => a.timestamp - b.timestamp);
    docs.slice(0, 10).forEach(d => {
        console.log(`- ${d.idAtividade}: ${d.xpGanho} XP | Data: ${new Date(d.timestamp).toLocaleString("pt-BR")}`);
    });
}

checkBrenoXp().catch(console.error);
