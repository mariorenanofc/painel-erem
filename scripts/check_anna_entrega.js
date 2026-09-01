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

async function checkAnnaEntrega() {
    const matricula = "3183600";
    const entregasSnap = await db.collection("entregas")
        .where("matricula", "==", matricula)
        .where("idAtividade", "==", "ATIV-625")
        .get();
        
    entregasSnap.forEach(doc => {
        console.log(`ID do Documento na collection entregas: ${doc.id}`);
        console.log(doc.data());
    });
}

checkAnnaEntrega().catch(console.error);
