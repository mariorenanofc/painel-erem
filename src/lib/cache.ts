// Cache simples em memória para reduzir leituras no Firestore e otimizar performance
export const rankingCache: Record<string, { data: unknown; timestamp: number }> = {};
export const portalCache: Record<string, { data: unknown; timestamp: number }> = {};
let configCache: { data: unknown; timestamp: number } | null = null;

export function getCachedPortal(matricula: string): unknown | null {
  const cached = portalCache[matricula.trim()];
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos
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
  if (cached && Date.now() - cached.timestamp < 600000) { // 10 minutos
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
  if (configCache && Date.now() - configCache.timestamp < 600000) { // 10 minutos
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

export function invalidateConfigCache() {
  configCache = null;
}

export function invalidatePortalCache(matricula: string) {
  delete portalCache[matricula.trim()];
}

export function invalidateRankingCache() {
  Object.keys(rankingCache).forEach(k => {
    delete rankingCache[k];
  });
}

export function clearAllPortalCaches() {
  Object.keys(portalCache).forEach(k => {
    delete portalCache[k];
  });
}
