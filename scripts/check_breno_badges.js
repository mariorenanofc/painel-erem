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

async function checkBrenoBadges() {
    const matricula = "3826087";
    const entregasSnap = await db.collection("entregas").where("matricula", "==", matricula).get();
    
    let totalXp = 0;
    let badgeCount = 0;
    entregasSnap.forEach(doc => {
        const data = doc.data();
        totalXp += data.xpGanho || 0;
        if (data.status === "Badge") badgeCount++;
    });

    console.log("XP Total em entregas:", totalXp);
    console.log("Número de recompensas de Badge:", badgeCount);
}

checkBrenoBadges().catch(console.error);
