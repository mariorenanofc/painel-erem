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

async function checkAtividadesSchema() {
  try {
    const atividadesRef = db.collection('atividades');
    const snapshot = await atividadesRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log("Nenhuma atividade encontrada no banco.");
      return;
    }

    snapshot.forEach((doc) => {
      console.log(`Exemplo Atividade (ID: ${doc.id}):`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error("Erro ao buscar atividade:", error);
  }
}

checkAtividadesSchema();
