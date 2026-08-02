// Cache simples em memória para reduzir leituras no Firestore e otimizar performance
export const rankingCache: Record<string, { data: unknown; timestamp: number }> = {};
export const portalCache: Record<string, { data: unknown; timestamp: number }> = {};

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

export function invalidatePortalCache(matricula: string) {
  delete portalCache[matricula.trim()];
}

export function invalidateRankingCache() {
  Object.keys(rankingCache).forEach(k => {
    delete rankingCache[k];
  });
}
