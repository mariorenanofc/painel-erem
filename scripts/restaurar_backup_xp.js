const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  })
});

const db = getFirestore();

async function restaurar() {
  try {
    const backupData = JSON.parse(fs.readFileSync('scripts/ranking_backup.json', 'utf8'));
    const ranking = backupData.ranking;
    
    const alunosRef = db.collection('alunos');
    const snapshot = await alunosRef.get();
    
    const batch = db.batch();
    let restored = 0;
    let cleared = 0;

    const rankingMap = {};
    ranking.forEach(r => rankingMap[r.matricula] = r.xp);

    snapshot.forEach(doc => {
      const mat = doc.id;
      const data = doc.data();
      const updates = {};
      
      // Deletar o xpTotal que foi criado indevidamente
      if (data.xpTotal !== undefined) {
         updates.xpTotal = FieldValue.delete();
      }

      const isAtivo = String(data.statusTrilha || "").toLowerCase() === "ativo";
      
      if (isAtivo) {
         // Restaurar do backup
         const realXp = rankingMap[mat] !== undefined ? rankingMap[mat] : 0;
         updates.xp = realXp;
         restored++;
      } else {
         // Para inativos, limparmos o XP gerado indevidamente
         // Idealmente voltaríamos ao que era, mas não temos backup dos inativos.
         // Zerando para não gerar bagunça caso sejam reativados.
         updates.xp = 0;
         cleared++;
      }
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
      }
    });

    await batch.commit();
    console.log(`Sucesso! ${restored} alunos ativos restaurados. ${cleared} inativos limpos.`);
  } catch (err) {
    console.error(err);
  }
}

restaurar();
