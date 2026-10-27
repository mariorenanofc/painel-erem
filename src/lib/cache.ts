// Cache simples em memória para reduzir leituras no Firestore e otimizar performance
export const rankingCache: Record<string, { data: unknown; timestamp: number }> = {};
export const portalCache: Record<string, { data: unknown; globalUpdateReference: number; timestamp: number }> = {};
let configCache: { data: unknown; timestamp: number } | null = null;
let lastKnownGlobalUpdate: number = 0;

// Caches globais compartilhados para coleções de turmas e atividades
let globalAtividadesCache: { data: unknown; timestamp: number } | null = null;
const globalClassDatesCache: Record<string, { data: unknown; timestamp: number }> = {};
let globalModulosCache: { data: unknown; timestamp: number } | null = null;
export const tutorAtividadesCache: Record<string, { data: unknown; timestamp: number }> = {};
let aniversariantesCache: { dateKey: string; data: unknown; timestamp: number } | null = null;
let globalJustificativasCache: { data: unknown; timestamp: number } | null = null;
let analyticsGeralCache: { data: unknown; timestamp: number } | null = null;

export function getCachedPortal(matricula: string): unknown | null {
  const cached = portalCache[matricula.trim()];
  if (!cached) return null;
  
  if (cached.globalUpdateReference < lastKnownGlobalUpdate) {
    return null; // Atividades foram atualizadas no Firestore! Invalida o portal.
  }
  
  if (Date.now() - cached.timestamp < 43200000) { // 12 horas ou até o aluno enviar entrega
    return cached.data;
  }
  return null;
}

export function setCachedPortal(matricula: string, data: unknown) {
  portalCache[matricula.trim()] = {
    data,
    globalUpdateReference: lastKnownGlobalUpdate,
    timestamp: Date.now()
  };
}

export function getCachedRanking(filtro: string): unknown | null {
  const cached = rankingCache[filtro.trim()];
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 minuto
    return cached.data;
  }
  return null;
}

export function setCachedRanking(filtro: string, data: unknown) {
  rankingCache[filtro.trim()] = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedConfigs(): unknown | null {
  if (configCache && Date.now() - configCache.timestamp < 300000) { // 5 minutos
    return configCache.data;
  }
  return null;
}

export function setCachedConfigs(data: unknown) {
  configCache = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedAtividades(): unknown | null {
  if (globalAtividadesCache && Date.now() - globalAtividadesCache.timestamp < 10000) { // 10 segundos
    return globalAtividadesCache.data;
  }
  return null;
}

export function setCachedAtividades(data: unknown, updatedAtISO?: string) {
  if (updatedAtISO) {
    lastKnownGlobalUpdate = new Date(updatedAtISO).getTime();
  } else if (lastKnownGlobalUpdate === 0) {
    lastKnownGlobalUpdate = Date.now();
  }
  globalAtividadesCache = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedClassDates(turma: string): unknown | null {
  const cached = globalClassDatesCache[turma.trim()];
  if (cached && Date.now() - cached.timestamp < 43200000) { // 12 horas
    return cached.data;
  }
  return null;
}

export function setCachedClassDates(turma: string, data: unknown) {
  globalClassDatesCache[turma.trim()] = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedModulos(): unknown | null {
  if (globalModulosCache && Date.now() - globalModulosCache.timestamp < 300000) { // 5 minutos
    return globalModulosCache.data;
  }
  return null;
}

export function setCachedModulos(data: unknown) {
  globalModulosCache = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedTutorAtividades(filtroTurma: string, filtroTipo: string): unknown | null {
  const cached = tutorAtividadesCache[`${filtroTurma}|${filtroTipo}`];
  if (cached && Date.now() - cached.timestamp < 10000) { // 10 segundos
    return cached.data;
  }
  return null;
}

export function setCachedTutorAtividades(filtroTurma: string, filtroTipo: string, data: unknown) {
  tutorAtividadesCache[`${filtroTurma}|${filtroTipo}`] = {
    data,
    timestamp: Date.now()
  };
}

export function invalidateTutorAtividadesCache() {
  Object.keys(tutorAtividadesCache).forEach(k => {
    delete tutorAtividadesCache[k];
  });
}

export function invalidateConfigCache() {
  configCache = null;
}

export function getCachedAniversariantes(dateKey: string): unknown | null {
  if (aniversariantesCache && aniversariantesCache.dateKey === dateKey && Date.now() - aniversariantesCache.timestamp < 43200000) { // 12 horas
    return aniversariantesCache.data;
  }
  return null;
}

export function setCachedAniversariantes(dateKey: string, data: unknown) {
  aniversariantesCache = {
    dateKey,
    data,
    timestamp: Date.now()
  };
}

export function invalidateAniversariantesCache() {
  aniversariantesCache = null;
}

export function invalidatePortalCache(matricula: string) {
  delete portalCache[matricula.trim()];
  invalidateTutorAtividadesCache();
}

export function invalidateRankingCache() {
  Object.keys(rankingCache).forEach(k => {
    delete rankingCache[k];
  });
}

export function clearAllPortalCaches() {
  // Limpa caches individuais
  Object.keys(portalCache).forEach(k => {
    delete portalCache[k];
  });
  // Limpa caches globais compartilhados
  globalAtividadesCache = null;
  Object.keys(globalClassDatesCache).forEach(k => {
    delete globalClassDatesCache[k];
  });
  globalModulosCache = null;
  invalidateTutorAtividadesCache();
  invalidateRankingCache();
  invalidateConfigCache();
  invalidateAniversariantesCache();
}

// -----------------------------------------------------------------------------
// FIRESTORE SINGLETON CACHE
// Esse cache centraliza as consultas pesadas de atividades num único documento,
// resolvendo o problema de 100+ leituras por recarregamento em ambiente Serverless.
// -----------------------------------------------------------------------------
import type { Firestore } from "firebase-admin/firestore";

export interface AtividadeCacheItem {
  id: string;
  titulo?: string;
  descricao?: string;
  dataLimite?: string;
  xp?: number;
  tipo?: string;
  opcaoA?: string;
  opcaoB?: string;
  opcaoC?: string;
  opcaoD?: string;
  statusPublicacao?: string;
  turmaAlvo?: string;
  gabaritoLiberado?: boolean;
  linkClassroom?: string;
  imageUrl?: string;
  modulo?: string;
  gabarito?: string;
  resolucaoTyping?: string;
  limiteTempoTyping?: number;
}

export async function loadFirestoreCacheAtividades(dbAdmin: Firestore): Promise<{ atividades: AtividadeCacheItem[]; updatedAt?: string }> {
  try {
    const cacheDoc = await dbAdmin.collection("cache").doc("atividades_publicadas").get();
    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      const updatedAt = data?.updatedAt as string | undefined;
      const chunkCount = Number(data?.chunkCount) || 0;

      if (chunkCount > 0) {
        const chunkSnaps = await Promise.all(
          Array.from({ length: chunkCount }).map((_, i) =>
            dbAdmin.collection("cache").doc(`atividades_chunk_${i}`).get()
          )
        );
        const allAtividades: AtividadeCacheItem[] = [];
        for (const cDoc of chunkSnaps) {
          if (cDoc.exists) {
            const list = (cDoc.data()?.atividades as AtividadeCacheItem[]) || [];
            allAtividades.push(...list);
          }
        }
        return { atividades: allAtividades, updatedAt };
      } else if (Array.isArray(data?.atividades)) {
        return { atividades: data.atividades as AtividadeCacheItem[], updatedAt };
      }
    }

    console.warn("[Firestore Query] Cache particionado vazio, carregando fallback da coleção atividades...");
    const atividadesSnap = await dbAdmin.collection("atividades").where("statusPublicacao", "==", "Publicada").get();
    const fallbackList: AtividadeCacheItem[] = [];
    atividadesSnap.forEach((doc) => {
      const data = doc.data();
      fallbackList.push({
        id: doc.id,
        titulo: (data.titulo as string) || "",
        descricao: (data.descricao as string) || "",
        dataLimite: (data.dataLimite as string) || "",
        xp: Number(data.xp) || 0,
        tipo: (data.tipo as string) || "Projeto",
        opcaoA: (data.opcaoA as string) || "",
        opcaoB: (data.opcaoB as string) || "",
        opcaoC: (data.opcaoC as string) || "",
        opcaoD: (data.opcaoD as string) || "",
        statusPublicacao: (data.statusPublicacao as string) || "Publicada",
        turmaAlvo: (data.turmaAlvo as string) || "Todas",
        gabaritoLiberado: data.gabaritoLiberado === true || String(data.gabaritoLiberado).toLowerCase() === "true",
        linkClassroom: (data.linkClassroom as string) || "",
        imageUrl: ((data.imageUrl || data.imagemUrl) as string) || "",
        modulo: (data.modulo as string) || "Geral",
        gabarito: (data.gabarito as string) || "",
        resolucaoTyping: (data.resolucaoTyping as string) || "",
        limiteTempoTyping: Number(data.limiteTempoTyping) || 0
      });
    });
    return { atividades: fallbackList, updatedAt: new Date().toISOString() };
  } catch (error: unknown) {
    console.error("[Firestore Cache] Erro ao carregar cache de atividades:", error);
    return { atividades: [], updatedAt: new Date().toISOString() };
  }
}

export async function refreshFirestoreCacheAtividades(dbAdmin: Firestore) {
  try {
    const atividadesSnap = await dbAdmin.collection("atividades").where("statusPublicacao", "==", "Publicada").get();
    const atividadesList: AtividadeCacheItem[] = [];
    atividadesSnap.forEach((doc) => {
      const data = doc.data();
      atividadesList.push({
        id: doc.id,
        titulo: (data.titulo as string) || "",
        descricao: (data.descricao as string) || "",
        dataLimite: (data.dataLimite as string) || "",
        xp: Number(data.xp) || 0,
        tipo: (data.tipo as string) || "Projeto",
        opcaoA: (data.opcaoA as string) || "",
        opcaoB: (data.opcaoB as string) || "",
        opcaoC: (data.opcaoC as string) || "",
        opcaoD: (data.opcaoD as string) || "",
        statusPublicacao: (data.statusPublicacao as string) || "Publicada",
        turmaAlvo: (data.turmaAlvo as string) || "Todas",
        gabaritoLiberado: data.gabaritoLiberado === true || String(data.gabaritoLiberado).toLowerCase() === "true",
        linkClassroom: (data.linkClassroom as string) || "",
        imageUrl: ((data.imageUrl || data.imagemUrl) as string) || "",
        modulo: (data.modulo as string) || "Geral",
        gabarito: (data.gabarito as string) || "",
        resolucaoTyping: (data.resolucaoTyping as string) || "",
        limiteTempoTyping: Number(data.limiteTempoTyping) || 0
      });
    });

    // Chunking: dividir em blocos de 150 atividades para NUNCA estourar o limite de 1MB do Firestore
    const CHUNK_SIZE = 150;
    const totalChunks = Math.ceil(atividadesList.length / CHUNK_SIZE);
    const nowISO = new Date().toISOString();

    const metaDoc = await dbAdmin.collection("cache").doc("atividades_publicadas").get();
    const prevChunkCount = Number(metaDoc.data()?.chunkCount) || 0;

    const chunkPromises: Promise<unknown>[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = atividadesList.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      chunkPromises.push(
        dbAdmin.collection("cache").doc(`atividades_chunk_${i}`).set({
          atividades: chunk,
          index: i,
          totalChunks,
          updatedAt: nowISO
        })
      );
    }

    if (prevChunkCount > totalChunks) {
      for (let i = totalChunks; i < prevChunkCount; i++) {
        chunkPromises.push(dbAdmin.collection("cache").doc(`atividades_chunk_${i}`).delete());
      }
    }

    await Promise.all(chunkPromises);

    // Prepara payload do manifesto (com fallback retrocompatível se couber no limite do Firestore)
    const compactList = atividadesList.map(a => {
      const item: Record<string, unknown> = {
        id: a.id,
        titulo: a.titulo || "",
        descricao: a.descricao || "",
        dataLimite: a.dataLimite || "",
        xp: a.xp || 0,
        tipo: a.tipo || "Projeto",
        turmaAlvo: a.turmaAlvo || "Todas",
        modulo: a.modulo || "Geral"
      };
      if (a.opcaoA) item.opcaoA = a.opcaoA;
      if (a.opcaoB) item.opcaoB = a.opcaoB;
      if (a.opcaoC) item.opcaoC = a.opcaoC;
      if (a.opcaoD) item.opcaoD = a.opcaoD;
      if (a.statusPublicacao) item.statusPublicacao = a.statusPublicacao;
      if (a.gabaritoLiberado) item.gabaritoLiberado = true;
      if (a.linkClassroom) item.linkClassroom = a.linkClassroom;
      if (a.imageUrl) item.imageUrl = a.imageUrl;
      if (a.gabarito) item.gabarito = a.gabarito;
      if (a.resolucaoTyping) item.resolucaoTyping = a.resolucaoTyping;
      if (a.limiteTempoTyping) item.limiteTempoTyping = a.limiteTempoTyping;
      return item;
    });

    const manifestPayload: Record<string, unknown> = {
      chunkCount: totalChunks,
      totalAtividades: atividadesList.length,
      updatedAt: nowISO
    };

    // Se o payload compactado couber com segurança dentro de 1MB, grava 'atividades' no manifesto
    const testJson = JSON.stringify({ ...manifestPayload, atividades: compactList });
    if (Buffer.byteLength(testJson, 'utf8') < 1035000) {
      manifestPayload.atividades = compactList;
    }

    await dbAdmin.collection("cache").doc("atividades_publicadas").set(manifestPayload);

    setCachedAtividades(atividadesList, nowISO);

    console.log(`[Firestore Cache] Cache particionado atualizado com sucesso (${totalChunks} chunks, ${atividadesList.length} atividades).`);
  } catch (err: unknown) {
    console.error("[Firestore Cache] Erro ao atualizar cache de atividades:", err);
  }
}

// Cache para o painel administrativo (TrilhaTech e GodMode)
let adminAlunosCache: { data: unknown; timestamp: number } | null = null;

export function getCachedAdminAlunos(): unknown | null {
  if (adminAlunosCache && Date.now() - adminAlunosCache.timestamp < 86400000) { // 24 horas
    return adminAlunosCache.data;
  }
  return null;
}

export function setCachedAdminAlunos(data: unknown) {
  adminAlunosCache = {
    data,
    timestamp: Date.now()
  };
}

export function invalidateAdminAlunosCache() {
  adminAlunosCache = null;
}

export function getCachedJustificativas(): unknown | null {
  if (globalJustificativasCache && Date.now() - globalJustificativasCache.timestamp < 43200000) { // 12 horas
    return globalJustificativasCache.data;
  }
  return null;
}

export function setCachedJustificativas(data: unknown) {
  globalJustificativasCache = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedAnalyticsGeral(): unknown | null {
  if (analyticsGeralCache && Date.now() - analyticsGeralCache.timestamp < 1800000) { // 30 minutos
    return analyticsGeralCache.data;
  }
  return null;
}

export function setCachedAnalyticsGeral(data: unknown) {
  analyticsGeralCache = {
    data,
    timestamp: Date.now()
  };
}

// -----------------------------------------------------------------------------
// FIRESTORE SINGLETON CACHE PARA ALUNOS (ADMIN/TUTOR)
// Resolve as varreduras completas da coleção alunos.
// -----------------------------------------------------------------------------
export async function getAlunosAtivosSnapshot(dbAdmin: Firestore) {
  try {
    const indexDoc = await dbAdmin.collection("metadata").doc("cache_alunos_index").get();
    if (!indexDoc.exists) {
      console.warn("[Firestore Cache] Snapshot de alunos não encontrado, caindo para leitura completa.");
      return null;
    }

    const { totalChunks } = indexDoc.data() as { totalChunks: number };
    let todosAlunos: Record<string, unknown>[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await dbAdmin.collection("metadata").doc(`cache_alunos_geral_${i}`).get();
      if (chunkDoc.exists) {
        todosAlunos = todosAlunos.concat(chunkDoc.data()?.alunos || []);
      }
    }

    return todosAlunos;
  } catch (err) {
    console.error("[Firestore Cache] Erro ao buscar snapshot de alunos:", err);
    return null;
  }
}

