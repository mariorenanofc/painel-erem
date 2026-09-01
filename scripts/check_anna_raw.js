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

async function checkRaw() {
    const matricula = "3183600";
    const doc = await db.collection("portal_views").doc(matricula).get();
    
    if (doc.exists) {
        console.log(JSON.stringify(doc.data(), null, 2));
    } else {
        console.log("Documento não existe!");
    }
}

checkRaw().catch(console.error);
