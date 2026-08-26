const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
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

async function migrarPortalViews() {
    console.log("Iniciando migração para portal_views...");
    
    // Aggregation maps
    const studentData = {};
    
    function getStudent(mat) {
        if (!studentData[mat]) {
            studentData[mat] = {
                entregasMap: {},
                frequencias: [],
                extratoPix: [],
                notificacoes: [],
                badges: [],
                curtidasRecebidas: 0,
                aniversarioResgatado: false
            };
        }
        return studentData[mat];
    }
    
    try {
        console.log("Lendo entregas...");
        const entregasSnap = await db.collection("entregas").get();
        entregasSnap.forEach(doc => {
            const val = doc.data();
            const idEntrega = doc.id;
            const mat = val.matricula;
            if (!mat) return;
            
            const s = getStudent(mat);
            const idAtiv = String(val.idAtividade || "").trim();
            
            if (idEntrega.startsWith("NOTIF-")) {
                s.notificacoes.push({
                    id: idEntrega,
                    mensagem: val.resposta || "",
                    xp: val.xpGanho || 0,
                    tempo: val.timestamp || 0,
                    tipo: val.status || "Info"
                });
                return;
            }
            
            if (!idEntrega.startsWith("BDAY") && !idEntrega.startsWith("PIX") && !idEntrega.startsWith("BADGE") && !idEntrega.startsWith("BLOCK")) {
                if (val.status !== "EXCLUIDA") {
                    s.entregasMap[idAtiv] = {
                        resposta: val.resposta || "",
                        status: val.status || "Aguardando Correção",
                        xpGanho: val.xpGanho || 0,
                        dataEnvio: val.timestamp || 0,
                        feedback: val.feedback || ""
                    };
                }
            }

            if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) {
                s.extratoPix.push({
                    id: idEntrega,
                    mensagem: val.resposta || "",
                    xp: val.xpGanho || 0,
                    tempo: val.timestamp || 0,
                    tipo: "RECEBEU"
                });
            }
            if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
                const xpD = Math.abs(val.xpGanho || 0);
                s.extratoPix.push({
                    id: idEntrega,
                    mensagem: val.resposta || "",
                    xp: -xpD,
                    tempo: val.timestamp || 0,
                    tipo: "ENVIOU"
                });
            }
            if (idEntrega.startsWith("BDAY")) {
                s.aniversarioResgatado = true;
            }
            if (idEntrega.startsWith("BADGE-")) {
                const badgeId = idEntrega.replace("BADGE-", "").replace(`-${mat}`, "");
                s.badges.push(badgeId);
            }
        });
        
        console.log("Lendo frequência...");
        const freqSnap = await db.collection("frequencia").get();
        freqSnap.forEach(doc => {
            const f = doc.data();
            const mat = f.matricula;
            if (!mat) return;
            
            let dataFormatada = f.data || "";
            if (dataFormatada.includes("/") && dataFormatada.length > 10) {
                dataFormatada = dataFormatada.slice(0, 10);
            }
            if (dataFormatada) {
                const s = getStudent(mat);
                if (!s.frequencias.includes(dataFormatada)) {
                    s.frequencias.push(dataFormatada);
                }
            }
        });
        
        console.log("Lendo curtidas...");
        const curtidasSnap = await db.collection("curtidas").get();
        curtidasSnap.forEach(doc => {
            const c = doc.data();
            const mat = c.destinatario;
            if (!mat) return;
            
            const s = getStudent(mat);
            s.curtidasRecebidas = (s.curtidasRecebidas || 0) + 1;
            
            const tempo = Number(doc.id.split("-")[1]) || Date.now();
            s.notificacoes.push({
                id: doc.id,
                mensagem: "Alguém curtiu o seu perfil! ❤️",
                xp: 0,
                tempo: tempo,
                tipo: "LIKE"
            });
        });
        
        console.log("Preparando escrita na coleção portal_views...");
        let count = 0;
        let batch = db.batch();
        
        for (const [mat, data] of Object.entries(studentData)) {
            // Sort arrays
            data.notificacoes.sort((a, b) => b.tempo - a.tempo);
            data.notificacoes = data.notificacoes.slice(0, 10);
            
            data.extratoPix.sort((a, b) => b.tempo - a.tempo);
            data.extratoPix = data.extratoPix.slice(0, 20);
            
            const docRef = db.collection("portal_views").doc(mat);
            batch.set(docRef, data, { merge: true });
            
            count++;
            
            if (count % 400 === 0) {
                await batch.commit();
                batch = db.batch();
                console.log(`Commit de ${count} alunos...`);
            }
        }
        
        if (count % 400 !== 0) {
            await batch.commit();
        }
        
        console.log(`Migração concluída para ${count} alunos!`);
        
    } catch (e) {
        console.error("Erro na migração:", e);
    }
}

migrarPortalViews();
