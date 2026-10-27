# Relatório de Diagnóstico & Otimização do Backend (Google Apps Script)

Este relatório apresenta um diagnóstico detalhado dos problemas de instabilidade e queda (timeouts/erros de serviço) no backend do **Trilha Tech** que roda sobre o Google Apps Script, acompanhado das soluções e melhorias arquiteturais para otimizar a escalabilidade e o desempenho sob acessos simultâneos.

---

## 🔍 Diagnóstico dos Problemas

Ao analisar a estrutura do arquivo `appscript.md`, identificamos três grandes gargalos que causam instabilidade no servidor, travando mesmo sob poucos acessos e caindo constantemente com requisições concorrentes:

### 1. Efeito "Thundering Herd" (Efeito Manada) no Cache
A função `lerComCacheSeguro` implementa um cache em blocos (chunks) usando o `CacheService` do Apps Script. Porém, sob alta concorrência:
- Quando o cache expira ou é invalidado por uma gravação, **múltiplas requisições simultâneas sofrem cache miss ao mesmo tempo**.
- Todas essas requisições tentam reconstruir o cache acessando a Planilha Google diretamente via `SpreadsheetApp.getActiveSpreadsheet()` e `getDataRange().getValues()`.
- A API do Google Sheets possui limites estritos de taxa (cota de leitura por minuto). O estouro dessa cota resulta no erro fatal de serviço: `Service error: Spreadsheets`.

### 2. Leitura Direta sem Cache em Rotas Críticas
Várias rotas de leitura pesada não utilizavam a função `lerComCacheSeguro`, lendo diretamente da planilha em tempo real a cada requisição:
- **`buscar_analytics_geral`**: Realiza 5 leituras diretas à planilha por requisição (`basededados`, `trilhatech`, `entregas`, `frequencia` e `atividades`).
- **`iniciar_pix`**: Faz leituras diretas em 4 abas por requisição.
- **`buscar_todas_atividades`**: Bypassa o cache e faz leituras diretas.
- **`buscar_ficha_360`**: Lê da planilha diretamente.
Isso causava um consumo descontrolado de conexões à planilha, gerando instabilidade mesmo com 1 usuário ativo acessando telas administrativas ou de métricas.

### 3. Escrita Lenta e Locks Prolongados (Timeout de 15s)
Durante ações de gravação (como check-in, envio de atividade e compra de rifa), o script utiliza a trava global `LockService.getScriptLock()` e executa métodos muito lentos dentro da trava:
- **Uso do `appendRow()`**: O método `appendRow()` é conhecido no Apps Script por ser muito lento, pois varre a planilha em busca da última linha em todas as colunas.
- **Leitura desnecessária dentro do lock**: O código executa leituras como `getValue()` na planilha dentro do lock antes de atualizar com `setValue()`, dobrando o tempo de processamento.
Quando 30 alunos enviam uma atividade ao mesmo tempo, a fila de espera ultrapassa o limite de 15 segundos configurado no `.waitLock(15000)`, gerando erros de "servidor ocupado" e recusando a requisição dos alunos.

---

## 🛠️ Soluções Propostas (Plano de Ação)

Para blindar o servidor contra quedas simultâneas e torná-lo extremamente rápido, propomos as seguintes otimizações:

### A. Implementação de Mutex com Cache Backup (Stale-While-Revalidate)
Modificar a função `lerComCacheSeguro` para usar um conceito avançado de concorrência:
- Salvar uma cópia de backup do cache de longa duração (`CACHE_aba_BACKUP`).
- Se houver cache miss, a thread tenta obter um lock rápido de 1 segundo.
- Se obtiver o lock, ela reconstrói o cache na planilha e atualiza o backup.
- Se falhar no lock (indicando que outra thread já está reconstruindo o cache), ela **retorna o cache de backup imediatamente**, sem tocar na Planilha Google! Isso reduz o uso do Sheets a apenas **1 leitura por minuto**, independente de haver 10 ou 1000 acessos simultâneos.

### B. Migração das Leituras para Cache Seguro
Substituir todas as leituras de abas por chamadas a `lerComCacheSeguro` nas seguintes rotas:
- `buscar_analytics_geral`
- `iniciar_pix`
- `buscar_todas_atividades`
- `buscar_ficha_360`
- `buscar_bilhetes_aluno`

### C. Otimização das Escritas (Redução de Contenção de Locks)
- Substituir todos os `.appendRow(dados)` por `.getRange(lastRow + 1, 1, 1, dados.length).setValues([dados])` (até 4x mais rápido).
- Evitar o método `.getValue()` dentro de travas críticas como `fazer_checkin` e `enviar_atividade`. O cálculo de XP pode ser feito diretamente na memória a partir dos dados preexistentes.
- Aumentar preventivamente a tolerância das filas de lock de `15000` (15s) para `30000` (30s) para garantir que todas as requisições na fila de concorrência sejam processadas em vez de caírem com erro.

---

## ⚙️ Código Otimizado (Função Caching)

Abaixo está o exemplo da nova lógica estrutural para a leitura rápida concorrente:

```javascript
// Caching robusto de dupla camada contra Thundering Herd
function lerComCacheSeguro(nomeAba, tempoSegundos) {
  const cache = CacheService.getScriptCache();
  const cacheChave = "CACHE_" + nomeAba;
  
  // 1. Tenta obter o cache ativo
  let dadosString = cache.get(cacheChave);
  try {
    if (dadosString) return JSON.parse(dadosString);
    let chunksTotal = cache.get(cacheChave + "_CHUNKS");
    if (chunksTotal) {
      let reconstruido = "";
      for (let c = 0; c < Number(chunksTotal); c++) reconstruido += cache.get(cacheChave + "_" + c) || "";
      if (reconstruido) return JSON.parse(reconstruido);
    }
  } catch(e) {}

  // 2. Cache Miss: Tenta obter o lock rápido para reconstrução
  const lock = LockService.getScriptLock();
  let lockAdquirido = false;
  try {
    lock.waitLock(1200); // Espera no máximo 1.2 segundos
    lockAdquirido = true;
    
    // Duplo check: verifica se outra thread gerou o cache enquanto esperava
    dadosString = cache.get(cacheChave);
    if (dadosString) return JSON.parse(dadosString);
  } catch (e) {
    // Falha ao obter o lock (outra requisição está atualizando o cache).
    // Servimos o cache backup de imediato, salvando o Google Sheets!
    try {
      let backupString = cache.get(cacheChave + "_BACKUP");
      if (backupString) return JSON.parse(backupString);
      let chunksBackup = cache.get(cacheChave + "_BACKUP_CHUNKS");
      if (chunksBackup) {
        let reconstruido = "";
        for (let c = 0; c < Number(chunksBackup); c++) reconstruido += cache.get(cacheChave + "_BACKUP_" + c) || "";
        if (reconstruido) return JSON.parse(reconstruido);
      }
    } catch(err) {}
  }

  // 3. Se obteve o lock, lê da planilha
  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    let aba = planilha.getSheetByName(nomeAba);
    if (!aba) return [];

    let dados = aba.getDataRange().getValues();
    let timezone = Session.getScriptTimeZone();
    
    let dadosProcessados = dados.map(linha => linha.map(celula => {
      if (celula instanceof Date) {
        let d = String(celula.getDate()).padStart(2, '0');
        let m = String(celula.getMonth() + 1).padStart(2, '0');
        let y = celula.getFullYear();
        return `${d}/${m}/${y}`; 
      }
      return celula;
    }));

    let jsonStr = JSON.stringify(dadosProcessados);

    // Grava no cache ativo e no cache de backup (longa duração)
    gravarNoCache(cacheChave, jsonStr, tempoSegundos, cache);
    gravarNoCache(cacheChave + "_BACKUP", jsonStr, 7200, cache); // 2 Horas de Backup

    return dadosProcessados;
  } catch (err) {
    // Fallback absoluto em caso de pane geral na planilha
    try {
      let backupString = cache.get(cacheChave + "_BACKUP");
      if (backupString) return JSON.parse(backupString);
    } catch(e) {}
    return [];
  } finally {
    if (lockAdquirido) lock.releaseLock();
  }
}
```
