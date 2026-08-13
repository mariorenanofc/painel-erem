const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

try {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    })
  });
} catch (error) {
  console.error("Erro ao configurar Firebase Admin:", error);
  process.exit(1);
}

const db = getFirestore();

async function recalcularXP() {
  try {
    console.log("Iniciando recalculo de XP de todos os alunos...");
    
    // 1. Somar XP de todas as Entregas
    const entregasSnap = await db.collection("entregas").get();
    const xpPorAluno = {};
    
    entregasSnap.forEach(doc => {
      const e = doc.data();
      const xp = Number(e.xpGanho) || 0;
      if (e.matricula && xp !== 0) {
        if (!xpPorAluno[e.matricula]) xpPorAluno[e.matricula] = 0;
        xpPorAluno[e.matricula] += xp;
      }
    });

    // 2. Somar XP de toda a Frequência (Check-ins)
    const freqSnap = await db.collection("frequencia").get();
    freqSnap.forEach(doc => {
      const f = doc.data();
      const xp = Number(f.xpGanho) || 0;
      if (f.matricula && xp !== 0) {
        if (!xpPorAluno[f.matricula]) xpPorAluno[f.matricula] = 0;
        xpPorAluno[f.matricula] += xp;
      }
    });

    // 3. Atualizar Alunos
    const alunosRef = db.collection('alunos');
    const alunosSnap = await alunosRef.get();
    
    if (alunosSnap.empty) {
      console.log("Nenhum aluno encontrado.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    alunosSnap.forEach((doc) => {
      const mat = doc.id;
      const novoXp = xpPorAluno[mat] || 0;
      
      batch.update(doc.ref, {
        xp: novoXp,
        xpTotal: novoXp // Criamos também o campo xpTotal para ficar visível se o tutor procurar!
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Sucesso! O XP de ${count} alunos foi recalculado e corrigido.`);
    } else {
      console.log("Nenhum aluno para ser atualizado.");
    }
  } catch (error) {
    console.error("Erro ao recalcular XP:", error);
  }
}

recalcularXP();
