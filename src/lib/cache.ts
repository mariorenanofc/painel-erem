// Cache simples em memória para reduzir leituras no Firestore e otimizar performance
export const rankingCache: Record<string, { data: unknown; timestamp: number }> = {};
export const portalCache: Record<string, { data: unknown; timestamp: number }> = {};
let configCache: { data: unknown; timestamp: number } | null = null;

// Caches globais compartilhados para coleções de turmas e atividades
let globalAtividadesCache: { data: unknown; timestamp: number } | null = null;
const globalClassDatesCache: Record<string, { data: unknown; timestamp: number }> = {};
let globalModulosCache: { data: unknown; timestamp: number } | null = null;
export const tutorAtividadesCache: Record<string, { data: unknown; timestamp: number }> = {};
let aniversariantesCache: { dateKey: string; data: unknown; timestamp: number } | null = null;

export function getCachedPortal(matricula: string): unknown | null {
  const cached = portalCache[matricula.trim()];
  if (cached && Date.now() - cached.timestamp < 43200000) { // 12 horas (invalidação ativa nos endpoints de escrita)
    return cached.data;
  }
  return null;
}

export function setCachedPortal(matricula: string, data: unknown) {
  portalCache[matricula.trim()] = {
    data,
    timestamp: Date.now()
  };
}

export function getCachedRanking(filtro: string): unknown | null {
  const cached = rankingCache[filtro.trim()];
  if (cached && Date.now() - cached.timestamp < 43200000) { // 12 horas (invalidação ativa nos endpoints de escrita)
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
  if (configCache && Date.now() - configCache.timestamp < 43200000) { // 12 horas (invalidação ativa nos endpoints de escrita)
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
  if (globalAtividadesCache && Date.now() - globalAtividadesCache.timestamp < 43200000) { // 12 horas
    return globalAtividadesCache.data;
  }
  return null;
}

export function setCachedAtividades(data: unknown) {
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
  if (globalModulosCache && Date.now() - globalModulosCache.timestamp < 43200000) { // 12 horas
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
  if (cached && Date.now() - cached.timestamp < 43200000) { // 12 horas (invalidação ativa nos endpoints de escrita)
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
  globalModulosCache = null;
  invalidateTutorAtividadesCache();
  invalidateAniversariantesCache();
  Object.keys(globalClassDatesCache).forEach(k => {
    delete globalClassDatesCache[k];
  });
}
