const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
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

async function removerCampoSenha() {
  try {
    console.log("Iniciando limpeza do campo 'senha'...");
    const alunosRef = db.collection('alunos');
    const snapshot = await alunosRef.get();
    
    if (snapshot.empty) {
      console.log("Nenhum aluno encontrado.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Só atualiza se o campo existir
      if (data.senha !== undefined) {
        batch.update(doc.ref, {
          senha: FieldValue.delete()
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Sucesso! O campo 'senha' foi removido de ${count} alunos.`);
    } else {
      console.log("Nenhum aluno tinha o campo 'senha' para ser removido.");
    }
  } catch (error) {
    console.error("Erro ao remover campo senha:", error);
  }
}

removerCampoSenha();
