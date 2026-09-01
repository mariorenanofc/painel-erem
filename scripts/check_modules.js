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

async function checkModules() {
    const modSnap = await db.collection("modulos").get();
    modSnap.forEach(doc => {
        console.log(`Doc ID: ${doc.id} | Nome: ${doc.data().nome} | Turma: ${doc.data().turma} | Status: ${doc.data().status}`);
    });
}

checkModules().catch(console.error);
