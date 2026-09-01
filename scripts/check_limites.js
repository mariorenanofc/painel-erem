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

async function checkAtivs() {
    const ativs = ["ATIV-512", "ATIV-559", "ATIV-601", "ATIV-615", "ATIV-629"];
    for (const id of ativs) {
        const doc = await db.collection("atividades").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            console.log(`- ${id}: limite = ${data.dataLimite}`);
        } else {
            console.log(`- ${id}: NÃO EXISTE`);
        }
    }
}

checkAtivs().catch(console.error);
