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

async function checkAnnaPortalFull() {
    const matricula = "3183600";
    const portalDoc = await db.collection("portal_views").doc(matricula).get();
    
    if (portalDoc.exists) {
        const data = portalDoc.data();
        console.log("Root keys:", Object.keys(data));
        
        const ativs = [
            "ATIV-611", "ATIV-612", "ATIV-613", "ATIV-614", "ATIV-615", "ATIV-616", "ATIV-617",
            "ATIV-625", "ATIV-626", "ATIV-627", "ATIV-628", "ATIV-629", "ATIV-630", "ATIV-631"
        ];
        
        console.log("\nNo entregasMap:");
        const map = data.entregasMap || {};
        ativs.forEach(id => {
            console.log(`- ${id}: ${map[id] ? map[id].status : "NÃO EXISTE"}`);
        });
    }
}

checkAnnaPortalFull().catch(console.error);
