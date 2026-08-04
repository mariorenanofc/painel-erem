const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf8");

function getEnv(key) {
  const regex = new RegExp(key + '=["\']?(.*?)["\']?(\\r?\\n|$)');
  const match = envContent.match(regex);
  return match ? match[1].trim() : "";
}

const GOOGLE_API_URL = getEnv("NEXT_PUBLIC_GOOGLE_API_URL");
const TUTOR_TOKEN = getEnv("NEXT_PUBLIC_TUTOR_TOKEN");

async function check() {
  const response = await fetch(GOOGLE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "exportar_dados_migracao", token: TUTOR_TOKEN }),
  });
  const data = await response.json();
  const trilha = data.trilhatech || [];
  console.log("Trilhatech length:", trilha.length);
  console.log("trilhatech[0]:", trilha[0]);
  console.log("trilhatech[1]:", trilha[1]);
}

check();
