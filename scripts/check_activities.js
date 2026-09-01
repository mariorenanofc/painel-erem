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

async function checkActivities() {
    const ativSnap = await db.collection("atividades").where("modulo", "==", "Módulo 2.2 - Javascript").get();
    
    ativSnap.forEach(doc => {
        const data = doc.data();
        if (data.titulo && (data.titulo.includes("Aula 29") || data.titulo.includes("Aula 30"))) {
            console.log(`\nID: ${doc.id}`);
            console.log(`Título: ${data.titulo}`);
            console.log(`Tipo: ${data.tipo}`);
            console.log(`XP: ${data.xp}`);
            console.log(`Turma Alvo: ${data.turmaAlvo}`);
            console.log(`Link Classroom: ${data.linkClassroom || data.links_ava || data.link || 'NENHUM'}`);
        }
    });
}

checkActivities().catch(console.error);
