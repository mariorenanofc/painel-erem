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

async function checkAnna() {
    console.log("=== BÚSCA ALUNA ANNA ===");
    const alunosRef = db.collection("alunos");
    const snapshot = await alunosRef.where("nome", ">=", "ANNA").where("nome", "<=", "ANNA\uf8ff").get();
    
    let matricula = null;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.nome.includes("BETHÂNIA")) {
            matricula = doc.id;
            console.log(`Encontrada: ${doc.id} - ${data.nome} | Email: ${data.email} | XP: ${data.xp}`);
        }
    });

    if (!matricula) {
        console.log("Anna Bethânia não encontrada na collection alunos!");
        return;
    }

    console.log("\n=== ENTREGAS DA ANNA (ATIV-629 e ATIV-615) ===");
    const entregasSnap = await db.collection("entregas").where("matricula", "==", matricula).get();
    entregasSnap.forEach(doc => {
        const data = doc.data();
        if (data.idAtividade === "ATIV-629" || data.idAtividade === "ATIV-615") {
            console.log(`- ${data.idAtividade} | Status: ${data.status} | XP Ganho: ${data.xpGanho} | Feedback: ${data.feedback}`);
        }
    });

    console.log("\n=== PORTAL VIEWS DA ANNA ===");
    const portalDoc = await db.collection("portal_views").doc(matricula).get();
    if (portalDoc.exists) {
        const data = portalDoc.data();
        const map = data.entregasMap || {};
        console.log("ATIV-615 no portal_views:", map["ATIV-615"] ? map["ATIV-615"].status : "NÃO EXISTE");
        console.log("ATIV-629 no portal_views:", map["ATIV-629"] ? map["ATIV-629"].status : "NÃO EXISTE");
    }
}

checkAnna().catch(console.error);
