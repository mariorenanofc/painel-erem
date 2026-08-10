# Plano de Correção Crítica (Firestore, Badges, Jogos e Quiz)

Identificamos a origem exata dos problemas críticos relatados em sala de aula. Abaixo estão as análises e o plano de ação para resolver cada um de forma definitiva.

> [!IMPORTANT]
> **Necessário Avaliação:** Por favor, revise as soluções propostas abaixo. Elas envolvem mudanças arquiteturais no Firebase para derrubar o custo de leitura e correções no backend. Se aprovar, iniciarei a execução imediatamente.

## 1. Explosão de Leituras no Firestore (258 mil leituras)
- **Causa:** O painel usa um cache *em memória* no backend (Next.js/Vercel). Em ambientes Serverless, a memória não é compartilhada. Se 10 alunos apertam F5 ao mesmo tempo, são criadas 10 instâncias limpas do servidor. Cada instância faz uma busca completa na coleção `atividades` (lendo 100+ documentos). 10 alunos x 10 reloads = 10.000+ leituras. Quando o professor salva uma atividade, o cache daquela instância é limpo, mas os alunos continuam dando F5 e gerando milhares de consultas.
- **Solução:** Criar um **Cache Singleton no Firestore** (`cache/atividades_publicadas`). Quando o professor salvar/excluir uma atividade, o servidor atualizará *este único documento* com um JSON consolidado de todas as atividades. Assim, quando os 10 alunos derem F5, o sistema fará **apenas 1 leitura por aluno** (o documento de cache) em vez de 100+. Redução de 99% no consumo!

## 2. Falhas de Sincronização Local (Badges, Aniversário e Whatsapp)
- **Causa Analisada (`appscript.md` vs `action-proxy`):** Ao comparar o backend do Apps Script com a nossa API `action-proxy/route.ts`, identificamos que a lista de `ACTIONS_TO_SYNC` (ações que o Next.js repassa para o Apps Script e depois salva no Firestore) **está incompleta**. 
Ações disparadas pelos alunos como `resgatar_badge`, `resgatar_aniversario` e `confirmar_whatsapp` são enviadas apenas para o Sheets. Como o Firestore local nunca é avisado desse resgate em tempo real, o frontend continua achando que o aluno tem direito ao prêmio. Ao recarregar a página, o popup ressurge, gerando o **Loop Infinito** relatado.
- **Solução:** Expandir a lista de sincronização obrigatória no `action-proxy/route.ts` incluindo:
  - `resgatar_badge` (Cria documento na coleção `entregas` e soma XP)
  - `resgatar_aniversario` (Cria documento na coleção `entregas` e soma XP)
  - `confirmar_whatsapp` (Atualiza perfil na coleção `alunos`)
  - *Bônus (Para a Gestão):* Adicionar `cadastrar_aluno`, `salvar_aluno`, `inscrever_trilhatech` e `mudar_status_trilhatech` para que as edições do Tutor reflitam instantaneamente no Firestore sem precisar forçar uma migração manual (`sincronizar_ava`).

## 3. Coleta Múltipla de Recompensas nos Jogos
- **Causa:** Falta de bloqueio de concorrência. Se o aluno clicar várias vezes no final do jogo ou a internet oscilar, o frontend pode disparar o resgate de XP múltiplas vezes antes do backend responder e bloquear o teto diário.
- **Solução:** Adicionar um estado de "loading" impenetrável no `JogosLayout.tsx` (desativando o botão enquanto processa) e uma trava de idempotência para evitar envios duplicados.

## 4. Repetição de Perguntas no Quiz Infinito
- **Causa:** O banco de 3.000 questões tem apenas 30 perguntas base (repetidas 100 vezes cada com o sufixo Var X que ocultamos). Como a seleção aleatória puxa 10 itens puros, a probabilidade estatística de cair a mesma pergunta base é gigantesca.
- **Solução:** Modificar a lógica de sorteio no `QuizTeoricoInfinito.tsx` usando um `Set` ou filtro para garantir que as 10 perguntas sorteadas tenham o texto-base 100% exclusivo, impedindo qualquer repetição na mesma rodada.

---

# Plano de Implementação: Otimização de Leituras no Firebase e Correção de Atrasos (EREM Painel)

Este plano descreve as melhorias arquiteturais e de codificação para sanar o alto consumo de leituras no Firebase e resolver o problema de atrasos de atualização (onde atividades e pontos demoram cerca de 5 minutos para refletir no portal dos alunos e do tutor).

## User Review Required

> [!IMPORTANT]
> **Modificações nas Respostas das APIs:** As rotas `/api/alunos/enviar-missao`, `/api/alunos/checkin` e `/api/alunos/comprar-rifa` passarão a retornar os dados atualizados do perfil do aluno (XP total, saldo, nível, progresso de nível) e o status específico da atividade modificada. Isso permite que o frontend atualize seu estado em memória instantaneamente sem disparar uma nova requisição geral (`carregarPortal(true)`).

> [!IMPORTANT]
> **Correção de Headers de Cache (Atraso de 5 Minutos):**
> Rotas como `/api/alunos/portal` e `/api/alunos/ranking` utilizam o header `Cache-Control: s-maxage=60, stale-while-revalidate=300`. Isto faz com que os navegadores dos alunos e servidores CDN de borda cacheiem as informações por 5 minutos, ignorando atualizações em tempo real no banco de dados.
> **Solução:** Alterar os headers de resposta HTTP para `"Cache-Control": "no-store, max-age=0, must-revalidate"`. As informações de alunos, configurações, módulos e atividades serão mantidas em cache no servidor da aplicação (através do cache em memória do Node.js), que é limpo instantaneamente (`clearAllPortalCaches()`) quando o tutor realiza ações de gravação. Isso dará uma experiência de tempo de atualização de **0 segundos** preservando a redução de leituras do Firestore.

## Open Questions

Nenhuma questão em aberto encontrada. O escopo é estrito às otimizações de leitura propostas.

## Proposed Changes

---

### Componente: Cache e Lógicas Compartilhadas

#### [NEW] [gamificacao.ts](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/gamificacao.ts)
Criação de um utilitário centralizado para calcular o nível do aluno, progresso do próximo nível e saldo da carteira, garantindo reutilização de código entre a rota do portal e as rotas de ações de forma tipada e segura.

#### [CONCLUÍDO] [MODIFY] [cache.ts](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/cache.ts)
- [x] Adicionar cache em memória global e getters/setters/invalidadores para `atividades` publicadas e `diasComAula` por turma.
- [x] Integrar a invalidação de todos os caches estáticos e globais na função `clearAllPortalCaches()`.
- [x] Aumentar a expiração dos caches principais (`portalCache`, `rankingCache`, `configCache` e `tutorAtividadesCache`) de 5/10 minutos para **12 horas** (`43200000` ms) para maximizar o reuso em memória (0 leituras Firestore) nas sessões repetidas dos alunos, aproveitando que todas as rotas de gravação e sincronização já possuem invalidação ativa (deletando do cache no momento exato da alteração).

---

### Componente: Rotas da API de Alunos (Backend)

#### [CONCLUÍDO] [MODIFY] [route.ts (Portal)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/portal/route.ts)
- [x] Alterar cabeçalho de cache HTTP (`Cache-Control`) para `"no-store, max-age=0, must-revalidate"`.
- [x] Adaptar para ler `configuracoes`, `modulos`, `atividades` publicadas e `diasComAula` por turma dos caches globais em memória.
- [x] Utilizar o novo utilitário de gamificação para cálculo de nível.

#### [CONCLUÍDO] [MODIFY] [route.ts (Ranking)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/ranking/route.ts)
- [x] Alterar cabeçalho de cache HTTP (`Cache-Control`) para `"no-store, max-age=0, must-revalidate"`.

#### [CONCLUÍDO] [MODIFY] [route.ts (Perfil)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/perfil/route.ts)
- [x] Adicionar cabeçalho de cache HTTP (`Cache-Control`) como `"no-store, max-age=0, must-revalidate"` para evitar cache heurístico no perfil.

#### [MODIFY] [route.ts (Enviar Missão)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/enviar-missao/route.ts)
- Alterar o retorno de sucesso para incluir os dados de perfil atualizados (`xpTotal`, `nivel`, `saldoCarteira`, `progressoNivel`) e o objeto da atividade atualizado (`atividadeAtualizada`), permitindo atualização in-memory pelo frontend.
- Eliminar o tipo `any` presente nos blocos de transação e tratamento de exceções.

#### [MODIFY] [route.ts (Check-in)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/checkin/route.ts)
- Alterar o retorno de sucesso para fornecer dados de perfil atualizados do aluno.
- Eliminar tipagens soltas de `any` em blocos `catch` ou variáveis.

#### [MODIFY] [route.ts (Comprar Rifa)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/comprar-rifa/route.ts)
- Alterar o retorno de sucesso para fornecer dados de perfil atualizados do aluno.
- Tipar formalmente a transação do Firestore e remover o tipo `any`.

#### [NEW] [route.ts (Atividade Status)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/atividade-status/route.ts)
Criação de uma rota leve para retornar o status de uma atividade específica e do perfil atual do estudante (apenas 3 leituras de documentos no total).

---

### Componente: Rotas da API do Tutor (Backend)

#### [CONCLUÍDO] [MODIFY] [route.ts (Transações)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/tutor/transacoes/route.ts)
- [x] Adicionar cabeçalho de cache HTTP (`Cache-Control`) como `"no-store, max-age=0, must-revalidate"` para evitar cache heurístico do navegador nas transações.

#### [CONCLUÍDO] [MODIFY] [route.ts (Migrar)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/migrar/route.ts)
- [x] Comparar os registros da planilha (entregas, alunos, frequências, rifas, curtidas, módulos) com os existentes no Firestore antes de gravar, realizando escritas apenas para dados novos ou modificados.

---

### Componente: Tela do Portal do Aluno (Frontend)

#### [CONCLUÍDO] [MODIFY] [page.tsx](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/portal/page.tsx)
- [x] Modificar funções `enviarMissao`, `confirmarCheckin` e `onCompraSucesso` (no modal da rifa) para que usem os dados retornados pelas APIs, atualizando o estado do React em memória (`atividades`, `xpTotalSistema`, `nivelSistema`, `saldoCarteira`, `progressoNivel`), eliminando a chamada pesada `carregarPortal(true)`.
- [x] Adicionar uma função de atualização de atividade específica (`atualizarStatusAtividade`) que consulta a nova rota `/api/alunos/atividade-status` ao abrir o modal de detalhes ou sob demanda.

#### [CONCLUÍDO] [MODIFY] [ResponderMissaoModal.tsx](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/components/ResponderMissaoModal.tsx)
- [x] Adicionar um botão de "Atualizar Status" ou mecanismo de sincronização individual para que o estudante possa forçar a checagem individual daquela atividade no Classroom.

## Plano de Verificação

### Testes Manuais
- Verificar fluxo de login e primeiro carregamento do portal (verificando os logs de `[Firestore Query]` no console do Next.js).
- Abrir uma missão (verificar que apenas aquela missão é consultada/atualizada sob demanda).
- Responder um Quiz / Missão de Digitação: validar que o XP e o progresso mudam na tela sem que novas leituras em massa de atividades/frequências ocorram no backend.
- Fazer check-in e comprar rifa: confirmar atualização de saldo e logs na lousa/carteira de XP.
