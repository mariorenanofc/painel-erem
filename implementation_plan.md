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

#### [MODIFY] [cache.ts](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/cache.ts)
- Adicionar cache em memória e getters/setters/invalidadores para `modulos` e `atividades` publicadas.
- Integrar a invalidação de todos os caches estáticos na função `clearAllPortalCaches()`.

---

### Componente: Rotas da API de Alunos (Backend)

#### [PARCIALMENTE CONCLUÍDO] [MODIFY] [route.ts (Portal)](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/portal/route.ts)
- [x] Alterar cabeçalho de cache HTTP (`Cache-Control`) para `"no-store, max-age=0, must-revalidate"`.
- [ ] Adaptar para ler `configuracoes`, `modulos` e `atividades` publicadas dos caches globais em memória.
- [ ] Utilizar o novo utilitário de gamificação para cálculo de nível.

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

---

### Componente: Tela do Portal do Aluno (Frontend)

#### [MODIFY] [page.tsx](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/portal/page.tsx)
- Modificar funções `enviarMissao`, `confirmarCheckin` e `onCompraSucesso` (no modal da rifa) para que usem os dados retornados pelas APIs, atualizando o estado do React em memória (`atividades`, `xpTotalSistema`, `nivelSistema`, `saldoCarteira`, `progressoNivel`), eliminando a chamada pesada `carregarPortal(true)`.
- Adicionar uma função de atualização de atividade específica (`atualizarStatusAtividade`) que consulta a nova rota `/api/alunos/atividade-status` ao abrir o modal de detalhes ou sob demanda.

#### [MODIFY] [ResponderMissaoModal.tsx](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/components/ResponderMissaoModal.tsx)
- Adicionar um botão de "Atualizar Status" ou mecanismo de sincronização individual para que o estudante possa forçar a checagem individual daquela atividade no Classroom.

## Plano de Verificação

### Testes Manuais
- Verificar fluxo de login e primeiro carregamento do portal (verificando os logs de `[Firestore Query]` no console do Next.js).
- Abrir uma missão (verificar que apenas aquela missão é consultada/atualizada sob demanda).
- Responder um Quiz / Missão de Digitação: validar que o XP e o progresso mudam na tela sem que novas leituras em massa de atividades/frequências ocorram no backend.
- Fazer check-in e comprar rifa: confirmar atualização de saldo e logs na lousa/carteira de XP.
