const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf8");

function getEnv(key) {
  const regex = new RegExp(key + '=["\']?(.*?)["\']?(\\r?\\n|$)');
  const match = envContent.match(regex);
  return match ? match[1].trim() : "";
}

const projectId = getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL");
let privateKey = getEnv("FIREBASE_PRIVATE_KEY");
if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const dbAdmin = getFirestore();

async function check() {
  console.log("Checking configuracoes document...");
  const doc = await dbAdmin.collection("configuracoes").doc("geral").get();
  if (doc.exists) {
    console.log("Config geral:", doc.data());
  } else {
    console.log("Config geral not found. Listing all configuration documents:");
    const snap = await dbAdmin.collection("configuracoes").get();
    snap.forEach(d => console.log(d.id, d.data()));
  }
  
  console.log("\nChecking unique student turmas in DB...");
  const students = await dbAdmin.collection("alunos").get();
  const turmas = new Set();
  students.forEach(s => {
    const data = s.data();
    turmas.add(data.turma || data.turmaTrilha || "");
  });
  console.log("Unique turmas:", Array.from(turmas));
}

check();
