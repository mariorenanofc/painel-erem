// Cache simples em memória para reduzir leituras no Firestore e otimizar performance
import type { Firestore } from "firebase-admin/firestore";

export const rankingCache: Record<string, { data: unknown; timestamp: number }> = {};
export const portalCache: Record<string, { data: unknown; globalUpdateReference: number; timestamp: number }> = {};
let configCache: { data: Record<string, unknown>; timestamp: number } | null = null;
let lastKnownGlobalUpdate: number = 0;

// Caches globais compartilhados para coleções de turmas e atividades
let globalAtividadesCache: { data: AtividadeCacheItem[]; maiorIdNumerico?: number; updatedAt?: string; timestamp: number } | null = null;
const globalClassDatesCache: Record<string, { data: unknown; timestamp: number }> = {};
let globalModulosCache: { data: unknown; timestamp: number } | null = null;
export const tutorAtividadesCache: Record<string, { data: unknown; timestamp: number }> = {};
let estatisticasAtividadesCache: { data: Record<string, EstatisticaAtividadeItem>; timestamp: number } | null = null;
let aniversariantesCache: { dateKey: string; data: unknown; timestamp: number } | null = null;
let globalJustificativasCache: { data: unknown; timestamp: number } | null = null;
let analyticsGeralCache: { data: unknown; timestamp: number } | null = null;
let rankingAlunosAtivosCache: { data: Record<string, unknown>[]; timestamp: number } | null = null;

export interface EstatisticaAtividadeItem {
  pendentes: number;
  aguardandoValidacao: number;
  validadasAVA: number;
}

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

export function getCachedRankingAlunosAtivos(): Record<string, unknown>[] | null {
  if (rankingAlunosAtivosCache && Date.now() - rankingAlunosAtivosCache.timestamp < 60000) { // 1 minuto compartilhado entre as 3 abas
    return rankingAlunosAtivosCache.data;
  }
  return null;
}

export function setCachedRankingAlunosAtivos(data: Record<string, unknown>[]) {
  rankingAlunosAtivosCache = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedConfigs(): Record<string, unknown> | null {
  if (configCache && Date.now() - configCache.timestamp < 300000) { // 5 minutos
    return configCache.data;
  }
  return null;
}

export function setCachedConfigs(data: Record<string, unknown>) {
  // Se alguém passar { status: "sucesso", configuracoes: {...} }, normaliza para guardar apenas o dicionário de configurações
  const normalized = (data && typeof data === "object" && "configuracoes" in data && data.configuracoes && typeof data.configuracoes === "object")
    ? (data.configuracoes as Record<string, unknown>)
    : data;
  configCache = {
    data: normalized,
    timestamp: Date.now()
  };
}

export async function loadFirestoreConfiguracoes(dbAdmin: Firestore): Promise<Record<string, unknown>> {
  const cached = getCachedConfigs();
  if (cached) return cached;

  const tempMap: Record<string, unknown> = {};
  try {
    const configCacheDoc = await dbAdmin.collection("cache").doc("configuracoes_gerais").get();
    if (configCacheDoc.exists) {
      const data = configCacheDoc.data() || {};
      for (const k of Object.keys(data)) {
        if (k !== "updatedAt") {
          tempMap[k] = data[k];
        }
      }
      if (Object.keys(tempMap).length > 0) {
        setCachedConfigs(tempMap);
        return tempMap;
      }
    }

    const configSnap = await dbAdmin.collection("configuracoes").get();
    configSnap.forEach((doc) => {
      const d = doc.data();
      tempMap[doc.id] = Array.isArray(d.valor) ? d.valor : String(d.valor ?? "").trim();
    });

    if (Object.keys(tempMap).length > 0) {
      await dbAdmin.collection("cache").doc("configuracoes_gerais").set({
        ...tempMap,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }

    setCachedConfigs(tempMap);
    return tempMap;
  } catch (err: unknown) {
    console.error("[Firestore Cache] Erro ao carregar configurações:", err);
    return tempMap;
  }
}

export function getCachedAtividades(): AtividadeCacheItem[] | null {
  if (globalAtividadesCache && Date.now() - globalAtividadesCache.timestamp < 1800000) { // 30 minutos (invalidado instantaneamente ao salvar/editar missão)
    return globalAtividadesCache.data;
  }
  return null;
}

export function setCachedAtividades(data: AtividadeCacheItem[], updatedAtISO?: string, maiorIdNumerico?: number) {
  if (updatedAtISO) {
    lastKnownGlobalUpdate = new Date(updatedAtISO).getTime();
  } else if (lastKnownGlobalUpdate === 0) {
    lastKnownGlobalUpdate = Date.now();
  }
  globalAtividadesCache = {
    data,
    updatedAt: updatedAtISO,
    maiorIdNumerico,
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
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos (invalidado a cada entrega/avaliação/edição)
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
  estatisticasAtividadesCache = null;
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
  invalidateTransacoesCache();
  invalidateFrequenciaCache();
  invalidateRifasCache();
}

export function invalidateRankingCache() {
  Object.keys(rankingCache).forEach(k => {
    delete rankingCache[k];
  });
  rankingAlunosAtivosCache = null;
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
  invalidateTransacoesCache();
  invalidateFrequenciaCache();
  invalidateRifasCache();
  invalidateRankingCache();
  invalidateConfigCache();
  invalidateAniversariantesCache();
}

// -----------------------------------------------------------------------------
// FIRESTORE SINGLETON CACHE DE ATIVIDADES (CHUNKING 150 ITENS)
// Centraliza as consultas de atividades em blocos particionados, atendendo
// tanto o Portal do Aluno quanto o Painel do Tutor com 0 a 7 leituras.
// -----------------------------------------------------------------------------

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
  respostaCorreta?: string;
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

export async function loadFirestoreCacheAtividades(dbAdmin: Firestore): Promise<{ atividades: AtividadeCacheItem[]; updatedAt?: string; maiorIdNumerico?: number }> {
  // 1. Verificar memória RAM (L1) primeiro
  if (globalAtividadesCache && Date.now() - globalAtividadesCache.timestamp < 1800000) {
    return {
      atividades: globalAtividadesCache.data,
      updatedAt: globalAtividadesCache.updatedAt,
      maiorIdNumerico: globalAtividadesCache.maiorIdNumerico
    };
  }

  try {
    const cacheDoc = await dbAdmin.collection("cache").doc("atividades_publicadas").get();
    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      const updatedAt = data?.updatedAt as string | undefined;
      const chunkCount = Number(data?.chunkCount) || 0;
      const maiorIdNumerico = Number(data?.maiorIdNumerico) || 0;
      const includesRascunhos = data?.includesRascunhos === true;

      if (chunkCount > 0 && includesRascunhos) {
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
        setCachedAtividades(allAtividades, updatedAt, maiorIdNumerico);
        return { atividades: allAtividades, updatedAt, maiorIdNumerico };
      }
    }

    console.warn("[Firestore Query] Cache particionado desatualizado ou sem flag includesRascunhos, regenerando chunks...");
    return await refreshFirestoreCacheAtividades(dbAdmin);
  } catch (error: unknown) {
    console.error("[Firestore Cache] Erro ao carregar cache de atividades:", error);
    return { atividades: [], updatedAt: new Date().toISOString(), maiorIdNumerico: 0 };
  }
}

export async function refreshFirestoreCacheAtividades(dbAdmin: Firestore): Promise<{ atividades: AtividadeCacheItem[]; updatedAt: string; maiorIdNumerico: number }> {
  try {
    const atividadesSnap = await dbAdmin.collection("atividades").get();
    const atividadesList: AtividadeCacheItem[] = [];
    let maiorIdNumerico = 0;

    atividadesSnap.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      if (docId.startsWith("ATIV-")) {
        const numId = parseInt(docId.replace("ATIV-", ""), 10);
        if (!isNaN(numId) && numId > maiorIdNumerico) {
          maiorIdNumerico = numId;
        }
      }

      atividadesList.push({
        id: docId,
        titulo: (data.titulo as string) || "",
        descricao: (data.descricao as string) || "",
        dataLimite: (data.dataLimite as string) || "",
        xp: Number(data.xp) || 0,
        tipo: (data.tipo as string) || "Projeto",
        opcaoA: (data.opcaoA as string) || "",
        opcaoB: (data.opcaoB as string) || "",
        opcaoC: (data.opcaoC as string) || "",
        opcaoD: (data.opcaoD as string) || "",
        respostaCorreta: (data.respostaCorreta as string) || "A",
        statusPublicacao: String(data.statusPublicacao || "Publicada").trim(),
        turmaAlvo: (data.turmaAlvo as string) || "Todas",
        gabaritoLiberado: data.gabaritoLiberado === true || String(data.gabaritoLiberado).toLowerCase() === "true",
        linkClassroom: ((data.links_ava || data.link || data.linkClassroom) as string) || "",
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

    const manifestPayload: Record<string, unknown> = {
      chunkCount: totalChunks,
      totalAtividades: atividadesList.length,
      maiorIdNumerico,
      includesRascunhos: true,
      updatedAt: nowISO
    };

    await dbAdmin.collection("cache").doc("atividades_publicadas").set(manifestPayload);

    setCachedAtividades(atividadesList, nowISO, maiorIdNumerico);
    invalidateTutorAtividadesCache();
  invalidateTransacoesCache();
  invalidateFrequenciaCache();
  invalidateRifasCache();

    console.log(`[Firestore Cache] Cache particionado atualizado com sucesso (${totalChunks} chunks, ${atividadesList.length} atividades, maiorId: ATIV-${maiorIdNumerico}).`);
    return { atividades: atividadesList, updatedAt: nowISO, maiorIdNumerico };
  } catch (err: unknown) {
    console.error("[Firestore Cache] Erro ao atualizar cache de atividades:", err);
    return { atividades: [], updatedAt: new Date().toISOString(), maiorIdNumerico: 0 };
  }
}

export async function getNextAtividadeId(dbAdmin: Firestore): Promise<string> {
  try {
    // Se já temos em memória, incrementamos localmente e atualizamos o manifesto
    let maiorId = globalAtividadesCache?.maiorIdNumerico || 0;
    if (!maiorId) {
      const metaDoc = await dbAdmin.collection("cache").doc("atividades_publicadas").get();
      if (metaDoc.exists && metaDoc.data()?.maiorIdNumerico) {
        maiorId = Number(metaDoc.data()?.maiorIdNumerico) || 0;
      } else {
        const loaded = await loadFirestoreCacheAtividades(dbAdmin);
        maiorId = loaded.maiorIdNumerico || 0;
      }
    }
    const proximoNumero = maiorId + 1;
    if (globalAtividadesCache) {
      globalAtividadesCache.maiorIdNumerico = proximoNumero;
    }
    await dbAdmin.collection("cache").doc("atividades_publicadas").set({
      maiorIdNumerico: proximoNumero
    }, { merge: true }).catch(() => {});

    return "ATIV-" + proximoNumero.toString().padStart(3, "0");
  } catch {
    return "ATIV-" + Date.now().toString().slice(-6);
  }
}

// -----------------------------------------------------------------------------
// SINGLETON CONSOLIDADO DE CONTADORES DE ATIVIDADES (estatisticas_atividades_resumo)
// Reduz 857 leituras em /api/tutor/atividades para apenas 1 leitura (ou 0 em RAM)
// -----------------------------------------------------------------------------
export async function loadEstatisticasAtividadesResumo(dbAdmin: Firestore): Promise<Record<string, EstatisticaAtividadeItem>> {
  if (estatisticasAtividadesCache && Date.now() - estatisticasAtividadesCache.timestamp < 300000) {
    return estatisticasAtividadesCache.data;
  }

  try {
    const resumoRef = dbAdmin.collection("cache").doc("estatisticas_atividades_resumo");
    const resumoDoc = await resumoRef.get();

    if (resumoDoc.exists && resumoDoc.data()?.stats) {
      const rawStats = resumoDoc.data()?.stats as Record<string, Partial<EstatisticaAtividadeItem>>;
      const normalized: Record<string, EstatisticaAtividadeItem> = {};
      for (const [id, st] of Object.entries(rawStats)) {
        normalized[id] = {
          pendentes: Math.max(0, Number(st?.pendentes) || 0),
          aguardandoValidacao: Math.max(0, Number(st?.aguardandoValidacao) || 0),
          validadasAVA: Math.max(0, Number(st?.validadasAVA) || 0)
        };
      }
      estatisticasAtividadesCache = { data: normalized, timestamp: Date.now() };
      return normalized;
    }

    // Migração automática inicial: lê estatisticas_atividades uma única vez e salva o resumo
    console.log("[Firestore Cache] Gerando singleton inicial cache/estatisticas_atividades_resumo...");
    const statsSnap = await dbAdmin.collection("estatisticas_atividades").get();
    const statsMap: Record<string, EstatisticaAtividadeItem> = {};
    statsSnap.forEach((doc) => {
      const d = doc.data();
      statsMap[doc.id] = {
        pendentes: Math.max(0, Number(d.pendentes) || 0),
        aguardandoValidacao: Math.max(0, Number(d.aguardandoValidacao) || 0),
        validadasAVA: Math.max(0, Number(d.validadasAVA) || 0)
      };
    });

    await resumoRef.set({
      stats: statsMap,
      updatedAt: new Date().toISOString()
    });

    estatisticasAtividadesCache = { data: statsMap, timestamp: Date.now() };
    return statsMap;
  } catch (err: unknown) {
    console.error("[Firestore Cache] Erro ao carregar estatisticas_atividades_resumo:", err);
    return {};
  }
}

// Cache para o painel administrativo (TrilhaTech e GodMode)
let adminAlunosCache: { data: unknown; timestamp: number } | null = null;
let alunosAtivosSnapshotRamCache: { data: Record<string, unknown>[]; timestamp: number } | null = null;

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
  alunosAtivosSnapshotRamCache = null;
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
// FIRESTORE SINGLETON CACHE PARA ALUNOS (ADMIN/TUTOR/AVA)
// Mantém snapshot particionado em blocos de 150 estudantes em metadata/cache_alunos_geral_${i}
// -----------------------------------------------------------------------------
export async function getAlunosAtivosSnapshot(dbAdmin: Firestore): Promise<Record<string, unknown>[] | null> {
  if (alunosAtivosSnapshotRamCache && Date.now() - alunosAtivosSnapshotRamCache.timestamp < 1800000) {
    return alunosAtivosSnapshotRamCache.data;
  }
  try {
    const indexDoc = await dbAdmin.collection("metadata").doc("cache_alunos_index").get();
    if (!indexDoc.exists) {
      console.warn("[Firestore Cache] Snapshot de alunos não encontrado, regenerando...");
      return await refreshAlunosAtivosSnapshot(dbAdmin);
    }

    const { totalChunks } = indexDoc.data() as { totalChunks: number };
    let todosAlunos: Record<string, unknown>[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await dbAdmin.collection("metadata").doc(`cache_alunos_geral_${i}`).get();
      if (chunkDoc.exists) {
        todosAlunos = todosAlunos.concat(chunkDoc.data()?.alunos || []);
      }
    }

    alunosAtivosSnapshotRamCache = { data: todosAlunos, timestamp: Date.now() };
    return todosAlunos;
  } catch (err: unknown) {
    console.error("[Firestore Cache] Erro ao buscar snapshot de alunos:", err);
    return null;
  }
}

export async function refreshAlunosAtivosSnapshot(dbAdmin: Firestore): Promise<Record<string, unknown>[]> {
  try {
    const snap = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
    const lista: Record<string, unknown>[] = [];

    snap.forEach((doc) => {
      const d = doc.data();
      lista.push({
        matricula: doc.id,
        nome: String(d.nome || `Aluno ${doc.id}`),
        turma: String(d.turma || ""),
        turmaTrilha: String(d.turmaTrilha || d.turma || ""),
        statusTrilha: String(d.statusTrilha || "Ativo"),
        email: String(d.email || ""),
        xp: Number(d.xp) || 0,
        xpTotal: Number(d.xp) || 0,
        xpGasto: Number(d.xpGasto) || 0,
        nivel: String(d.nivel || "Iniciante"),
        avatarId: String(d.avatarId || "avatar-padrao"),
        dataNasc: String(d.dataNasc || d.dataNascimento || "")
      });
    });

    const CHUNK_SIZE = 150;
    const totalChunks = Math.max(1, Math.ceil(lista.length / CHUNK_SIZE));
    const nowISO = new Date().toISOString();

    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = lista.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      promises.push(
        dbAdmin.collection("metadata").doc(`cache_alunos_geral_${i}`).set({
          alunos: chunk,
          updatedAt: nowISO
        })
      );
    }

    promises.push(
      dbAdmin.collection("metadata").doc("cache_alunos_index").set({
        totalChunks,
        totalAlunos: lista.length,
        updatedAt: nowISO
      })
    );

    await Promise.all(promises);
    invalidateAdminAlunosCache();
    invalidateRankingCache();
    console.log(`[Firestore Cache] Snapshot de alunos ativos atualizado (${lista.length} alunos em ${totalChunks} chunk(s)).`);
    return lista;
  } catch (err: unknown) {
    console.error("[Firestore Cache] Erro ao atualizar snapshot de alunos ativos:", err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// CACHE EM MEMÓRIA PARA HALL DA FAMA (VETERANOS)
// Evita leituras repetidas nas coleções 'alunos' e 'portal_views' em visitas públicas
// -----------------------------------------------------------------------------
let veteranosCache: { data: unknown; timestamp: number } | null = null;

export function getCachedVeteranos(): unknown | null {
  if (veteranosCache && Date.now() - veteranosCache.timestamp < 600000) { // 10 minutos
    return veteranosCache.data;
  }
  return null;
}

export function setCachedVeteranos(data: unknown) {
  veteranosCache = {
    data,
    timestamp: Date.now()
  };
}

export function invalidateVeteranosCache() {
  veteranosCache = null;
}

const frequenciaRamCache: Record<string, { data: unknown; timestamp: number }> = {};
let transacoesRecentesRamCache: { data: unknown[]; timestamp: number } | null = null;

export function getCachedFrequencia(key: string): unknown | null {
  const cached = frequenciaRamCache[key];
  if (cached && Date.now() - cached.timestamp < 120000) {
    return cached.data;
  }
  return null;
}

export function setCachedFrequencia(key: string, data: unknown) {
  frequenciaRamCache[key] = { data, timestamp: Date.now() };
}

export function invalidateFrequenciaCache() {
  Object.keys(frequenciaRamCache).forEach(k => delete frequenciaRamCache[k]);
}

export function getCachedTransacoesRecentes<T = unknown>(): T[] | null {
  if (transacoesRecentesRamCache && Date.now() - transacoesRecentesRamCache.timestamp < 120000) {
    return transacoesRecentesRamCache.data as T[];
  }
  return null;
}

export function setCachedTransacoesRecentes(data: unknown[]) {
  transacoesRecentesRamCache = { data, timestamp: Date.now() };
}

export function invalidateTransacoesCache() {
  transacoesRecentesRamCache = null;
}

let rifasRamCache: { data: unknown; timestamp: number } | null = null;

export function getCachedRifas(): unknown | null {
  if (rifasRamCache && Date.now() - rifasRamCache.timestamp < 300000) {
    return rifasRamCache.data;
  }
  return null;
}

export function setCachedRifas(data: unknown) {
  rifasRamCache = { data, timestamp: Date.now() };
}

export function invalidateRifasCache() {
  rifasRamCache = null;
  // Mantém chave para fechar a função:
}
