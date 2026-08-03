// Fila global de promessas para serializar requisições ao Google Sheets
let queuePromise = Promise.resolve();

/**
 * Executa requisições ao Google Apps Script uma por vez, garantindo que
 * o LockService do Google não sofra timeouts por concorrência local.
 */
export async function fetchSheetsQueued(url: string, payload: any): Promise<Response> {
  const nextPromise = queuePromise.then(async () => {
    // Pequeno intervalo entre chamadas para liberação limpa do LockService
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  });

  // Atualiza a fila global ignorando erros para não travar a fila subsequente
  queuePromise = nextPromise.then(() => {}).catch(() => {});

  return nextPromise;
}
