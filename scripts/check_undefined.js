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

async function checkUndefined() {
    const doc = await db.collection("portal_views").doc("undefined").get();
    if (doc.exists) {
        console.log("ACHOU DOCUMENTO UNDEFINED!");
        console.log(Object.keys(doc.data()));
    } else {
        console.log("Documento undefined nao existe.");
    }
}

checkUndefined().catch(console.error);
