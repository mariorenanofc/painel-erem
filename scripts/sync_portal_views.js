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

async function syncPortalViews() {
    console.log("Iniciando reconstrução inteligente do portal_views...");
    const entregasSnap = await db.collection("entregas").where("status", "==", "Avaliado").get();
    
    // Agrupar por matrícula
    const entregasPorAluno = {};
    entregasSnap.forEach(doc => {
        const data = doc.data();
        if (!entregasPorAluno[data.matricula]) {
            entregasPorAluno[data.matricula] = [];
        }
        entregasPorAluno[data.matricula].push(data);
    });

    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    for (const matricula of Object.keys(entregasPorAluno)) {
        const portalDoc = await db.collection("portal_views").doc(matricula).get();
        if (!portalDoc.exists) continue;

        const data = portalDoc.data();
        const entregasMap = data.entregasMap || {};
        let needsUpdate = false;

        for (const entrega of entregasPorAluno[matricula]) {
            const idAtiv = entrega.idAtividade;
            const portalEntrega = entregasMap[idAtiv];

            if (!portalEntrega || portalEntrega.status !== "Avaliado") {
                console.log(`Corrigindo/Adicionando ${matricula} - ${idAtiv}: ${portalEntrega ? portalEntrega.status : "MISSING"} -> Avaliado`);
                
                if (!entregasMap[idAtiv]) entregasMap[idAtiv] = {};
                entregasMap[idAtiv].status = "Avaliado";
                entregasMap[idAtiv].xpGanho = entrega.xpGanho || 0;
                entregasMap[idAtiv].dataEnvio = entrega.timestamp || Date.now();
                entregasMap[idAtiv].resposta = entrega.resposta || "Entrega validada pelo AVA.";
                
                // Só substitui o feedback se for do AVA ou vazio
                if (!entregasMap[idAtiv].feedback || entregasMap[idAtiv].feedback.includes("Aguardando") || entregasMap[idAtiv].feedback === "") {
                    entregasMap[idAtiv].feedback = entrega.feedback || "Avaliado";
                }
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            batch.update(portalDoc.ref, { entregasMap });
            count++;
            totalUpdated++;

            if (count === 400) {
                await batch.commit();
                batch = db.batch();
                count = 0;
            }
        }
    }

    if (count > 0) {
        await batch.commit();
    }
    
    console.log(`Reconstrução concluída! Documentos portal_views atualizados: ${totalUpdated}`);
}

syncPortalViews().catch(console.error);
