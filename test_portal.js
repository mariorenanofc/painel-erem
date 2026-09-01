const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert(require("./serviceAccountKey.json")),
    databaseURL: "https://painel-erem-default-rtdb.firebaseio.com"
  });
}
const db = getFirestore();

async function checkPortalViews() {
  const pvSnap = await db.collection("portal_views").limit(1).get();
  pvSnap.forEach(doc => {
    console.log(`Portal View do aluno ${doc.id}:`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

checkPortalViews().then(() => process.exit(0));
