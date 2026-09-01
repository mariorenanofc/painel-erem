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

async function checkAnnaAll() {
    const matricula = "3183600";
    console.log("=== ENTREGAS DA ANNA (Aula 29 e 30) ===");
    
    // Pegar todas as entregas dela
    const entregasSnap = await db.collection("entregas").where("matricula", "==", matricula).get();
    const entregasMap = {};
    entregasSnap.forEach(doc => {
        entregasMap[doc.data().idAtividade] = doc.data();
    });

    const ativs = [
        "ATIV-611", "ATIV-612", "ATIV-613", "ATIV-614", "ATIV-615", "ATIV-616", "ATIV-617", // Aula 29
        "ATIV-625", "ATIV-626", "ATIV-627", "ATIV-628", "ATIV-629", "ATIV-630", "ATIV-631"  // Aula 30
    ];

    ativs.forEach(id => {
        if (entregasMap[id]) {
            console.log(`- ${id} | Status: ${entregasMap[id].status} | XP: ${entregasMap[id].xpGanho}`);
        } else {
            console.log(`- ${id} | NÃO EXISTE na collection entregas`);
        }
    });
}

checkAnnaAll().catch(console.error);
