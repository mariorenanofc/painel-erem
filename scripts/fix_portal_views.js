const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue, FieldPath } = require("firebase-admin/firestore");
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

async function fixPortalViews() {
    console.log("Iniciando correção da coleção portal_views...");
    const snap = await db.collection("portal_views").get();
    let batch = db.batch();
    let count = 0;
    let totalDocsUpdated = 0;

    for (const doc of snap.docs) {
        const data = doc.data();
        const keys = Object.keys(data);
        
        const corruptedKeys = keys.filter(k => k.startsWith("entregasMap.ATIV-") || k.startsWith("entregasMap.JOGOS-") || k.startsWith("entregasMap.RECOMPENSA-") || (k.startsWith("entregasMap.") && k !== "entregasMap"));
        
        if (corruptedKeys.length > 0) {
            console.log(`Consertando doc ${doc.id} (chaves corrompidas: ${corruptedKeys.length})`);
            
            const updates = {};
            const novoEntregasMap = data.entregasMap || {};
            
            // 1. Mover os dados das chaves raízes para dentro do mapa
            for (const key of corruptedKeys) {
                const idAtiv = key.replace("entregasMap.", "");
                novoEntregasMap[idAtiv] = data[key];
                
                // 2. Marcar a chave raiz literal para deleção
                updates[new FieldPath(key)] = FieldValue.delete();
            }
            
            // 3. Salvar o mapa atualizado
            updates.entregasMap = novoEntregasMap;
            
            batch.update(doc.ref, updates);
            count++;
            totalDocsUpdated++;
            
            if (count === 400) {
                await batch.commit();
                console.log("Lote de 400 committado.");
                batch = db.batch();
                count = 0;
            }
        }
    }
    
    if (count > 0) {
        await batch.commit();
        console.log(`Último lote de ${count} committado.`);
    }
    
    console.log(`Correção concluída! Total de documentos corrigidos: ${totalDocsUpdated}`);
}

fixPortalViews().catch(console.error);
