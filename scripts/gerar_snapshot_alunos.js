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

async function gerarSnapshot() {
    console.log("Gerando snapshot de alunos ativos...");
    try {
        const alunosSnap = await db.collection("alunos")
            .where("statusTrilha", "in", ["ativo", "Ativo"])
            .get();
        
        const alunosData = [];
        
        alunosSnap.forEach(doc => {
            const data = doc.data();
            if (doc.id === "MESTRE") return;
            
            alunosData.push({
                matricula: doc.id,
                nome: data.nome || "",
                turma: data.turma || "",
                turmaTrilha: data.turmaTrilha || "",
                xp: data.xp || 0,
                nivel: data.nivel || "Iniciante",
                avatarId: data.avatarId || "avatar-padrao",
                statusTrilha: data.statusTrilha || "ativo",
                xpGasto: data.xpGasto || 0,
                pinPix: data.pinPix || data.senha || "",
                email: data.email || ""
            });
        });
        
        console.log(`Encontrados ${alunosData.length} alunos ativos.`);
        
        // Chunking the data Se for grande demais (limite é 1MB)
        const chunkSize = 2000;
        const totalChunks = Math.ceil(alunosData.length / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const chunk = alunosData.slice(i * chunkSize, (i + 1) * chunkSize);
            await db.collection("metadata").doc(`cache_alunos_geral_${i}`).set({
                timestamp: Date.now(),
                alunos: chunk,
                totalChunks: totalChunks,
                chunkIndex: i
            });
            console.log(`Salvo chunk ${i+1}/${totalChunks} com ${chunk.length} alunos.`);
        }

        // Save a pointer/metadata document
        await db.collection("metadata").doc("cache_alunos_index").set({
            timestamp: Date.now(),
            totalAlunos: alunosData.length,
            totalChunks: totalChunks
        });
        
        console.log("Snapshot gerado com sucesso!");
    } catch (e) {
        console.error("Erro ao gerar snapshot:", e);
    }
}

gerarSnapshot();
