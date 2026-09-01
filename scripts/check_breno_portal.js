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

async function check() {
    const doc = await db.collection("portal_views").doc("3826087").get();
    const data = doc.data();
    console.log("Root keys:", Object.keys(data));
    console.log("ATIV-615:", data.entregasMap["ATIV-615"]);
    console.log("ATIV-629:", data.entregasMap["ATIV-629"]);
}
check().catch(console.error);
