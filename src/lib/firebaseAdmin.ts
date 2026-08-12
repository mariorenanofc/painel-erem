import { getApps, initializeApp, cert } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let dbAdmin: Firestore;

const cleanString = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const projectId = cleanString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const clientEmail = cleanString(process.env.FIREBASE_CLIENT_EMAIL);
let privateKey = cleanString(process.env.FIREBASE_PRIVATE_KEY);

const isPlaceholder = (val?: string) => !val || val.includes("SUA_") || val.includes("SEU_") || val.includes("AQUI");

if (!isPlaceholder(projectId) && !isPlaceholder(clientEmail) && !isPlaceholder(privateKey)) {
  if (!getApps().length) {
    privateKey = privateKey!.replace(/\\n/g, "\n");
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  dbAdmin = getFirestore();
} else {
  // Durante o build ou se as chaves não forem configuradas, evitamos quebrar o processo com erros do OpenSSL
  dbAdmin = new Proxy({}, {
    get(target, prop) {
      return () => {
        throw new Error(`Firestore Admin acionado para a propriedade '${String(prop)}' sem credenciais válidas configuradas no arquivo .env.local.`);
      };
    }
  }) as unknown as Firestore;
}

export { dbAdmin };

/**
 * Registra um evento de segurança (fraudes, tokens inválidos, etc)
 */
export async function registrarLogSeguranca(
  matricula: string,
  nome: string,
  acao: string,
  detalhes: string
) {
  try {
    const tzOffset = -3 * 60 * 60 * 1000;
    const now = new Date(Date.now() + tzOffset);
    const dataHoraStr = now.toISOString().replace("T", " ").split(".")[0];
    
    await dbAdmin.collection("logs_seguranca").add({
      dataHora: dataHoraStr,
      matricula,
      nome,
      acao,
      detalhes,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("[Security Log Error]", error);
  }
}
