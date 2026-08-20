import { getApps, initializeApp, cert } from "firebase-admin/app";
import { Firestore, getFirestore, Query, DocumentReference, CollectionReference } from "firebase-admin/firestore";

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

  // === INJEÇÃO DO MONITOR SEGURO DE LEITURAS (MONKEY PATCH) ===
  const globalAny = global as any;

  if (!globalAny.firestoreReadStats) {
    globalAny.firestoreReadStats = {};
    globalAny.firestoreMonitorTimeout = null;
  }

  function registrarLeitura(collectionPath: string, size: number) {
    if (collectionPath.includes("monitor_leituras")) return;
    
    if (!globalAny.firestoreReadStats[collectionPath]) {
      globalAny.firestoreReadStats[collectionPath] = { buscas: 0, documentosLidos: 0 };
    }
    globalAny.firestoreReadStats[collectionPath].buscas += 1;
    globalAny.firestoreReadStats[collectionPath].documentosLidos += size;
    
    if (!globalAny.firestoreMonitorTimeout) {
      globalAny.firestoreMonitorTimeout = setTimeout(async () => {
        const statsToSave = { ...globalAny.firestoreReadStats };
        globalAny.firestoreReadStats = {};
        globalAny.firestoreMonitorTimeout = null;
        
        let totalLidos = 0;
        for (const key in statsToSave) {
          totalLidos += statsToSave[key].documentosLidos;
        }
        
        if (totalLidos > 0) {
          try {
            const tzOffset = -3 * 60 * 60 * 1000;
            const now = new Date(Date.now() + tzOffset);
            const dataHoraStr = now.toISOString().replace("T", " ").split(".")[0];
            
            await dbAdmin.collection("monitor_leituras").add({
              dataHora: dataHoraStr,
              totalLeiturasNestaJanela: totalLidos,
              detalhesPorColecao: statsToSave,
              timestamp: Date.now()
            });
            console.log(`[FIRESTORE MONITOR] 📊 Agregador Salvo no Banco! ${totalLidos} leituras contabilizadas.`);
          } catch (err) {
            console.error("[FIRESTORE MONITOR] Erro ao salvar agregado:", err);
          }
        }
      }, 10000); // Tenta salvar a cada 10 segundos
    }
  }

  const origQueryGet = Query.prototype.get;
  Query.prototype.get = async function (...args) {
    const snap = await origQueryGet.apply(this, args);
    const size = snap.size || 0;
    
    let path = "query_desconhecida";
    try {
      if ((this as any)._queryOptions?.collectionId) {
        path = (this as any)._queryOptions.collectionId;
      } else if ((this as any)._queryOptions?.parentPath?.segments) {
        path = (this as any)._queryOptions.parentPath.segments.join('/');
      }
    } catch {}

    registrarLeitura(path, size);
    return snap;
  };

  const origDocGet = DocumentReference.prototype.get;
  DocumentReference.prototype.get = async function (...args) {
    const snap = await origDocGet.apply(this, args);
    const size = snap.exists ? 1 : 0;
    
    let path = "doc_desconhecido";
    try {
      if (this.path) {
        path = this.path.split('/')[0];
      }
    } catch {}

    registrarLeitura(path, size);
    return snap;
  };

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
