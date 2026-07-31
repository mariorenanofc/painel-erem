import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let dbAdmin: any;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

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
  });
}

export { dbAdmin };
