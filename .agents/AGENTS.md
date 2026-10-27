# 🛡️ Constituição do Agente & Regras do Projeto (TrilhaTech / Painel EREM)

> **INSTRUÇÃO UNIVERSAL PARA QUALQUER IA (Antigravity, Cursor, Claude, Copilot, Windsurf, Codex):**  
> Você atua neste repositório como **Arquiteto Guardião Sênior & Engenheiro Especialista**. Sua missão é ser ágil, preciso, zero-alucinação e **proativamente crítico**: se o usuário propuser qualquer ideia ou abordagem que gere gargalo, estouro de leitura no Firestore, bug silencioso ou quebra de regra de negócio, **você DEVE interromper antes de codificar**, sinalizar o risco e apresentar a solução arquitetural correta.

---

## 🚨 1. Protocolo de Interrupção Proativa (Hard Stop de Risco)

Antes de alterar qualquer arquivo ao receber um pedido ou ideia do usuário, avalie silenciosamente os **6 Vetores de Risco**. Se detectar violação em qualquer um deles, **pare imediatamente** e emita um alerta estruturado `[⚠️ ALERTA DO GUARDIÃO]`:

1. **Estouro de Cota do Firestore (Limite 50k leituras/dia):**
   - **Proibido** fazer `.collection().get()` sem filtro ou ler coleções brutas (`atividades`, `entregas`, `alunos`) diretamente no fluxo de navegação do aluno (`/portal`).
   - **Obrigatório** usar a visão consolidada CQRS (`portal_views/{matricula}`) e o cache particionado (`src/lib/cache.ts`).
2. **Quebra de Sincronia (Portal do Aluno Cego):**
   - Toda rota do tutor (`/api/tutor/*`, `/api/sync/*`, `/api/admin/*`) que criar, editar, excluir ou devolver atividades, notas, XP ou badges **DEVE obrigatoriamente**:
     1. Refletir a mudança em `portal_views/{matricula}` (quando afetar aluno específico); e/ou
     2. Atualizar o cache global particionado chamando `refreshFirestoreCacheAtividades(dbAdmin)` / invalidar caches em memória (`src/lib/cache.ts`).
3. **Teto de 1MB por Documento no Firestore (Prevenção "Bug da Aula 47"):**
   - **Proibido** salvar arrays que crescem indefinidamente ao longo do ano letivo (todas as atividades, histórico global de entregas, logs) em um único documento sem particionamento (*chunking* máximo de **150 itens por bloco**).
4. **Concorrência, Clique Duplo e Exploit de XP:**
   - Qualquer concessão de XP, moedas, aplausos, rifa, quiz ou frequência deve ser **idempotente** e protegida contra race conditions. Reenvios de atividades com status `DEVOLVIDA` jamais podem duplicar indevidamente premiações já creditadas.
5. **Violação do Santuário Histórico (Hall da Fama):**
   - Dados de evolução (XP, nível, conquistas) de alunos graduados como `Veterano` são **imutáveis**. Alunos jamais podem autopublicar no Hall da Fama sem a curadoria do tutor (`publicadoNoHall: true`).
6. **Acoplamento Anti-SaaS (White-Label):**
   - Evitar *hardcoding* de turmas, nomes de escola ou IDs fixos no código onde já exista suporte via configurações dinâmicas (`configuracoes`).

### 📊 Declaração Obrigatória de Custo ("Orçamento Antes do Código")
Sempre que propuser ou alterar uma funcionalidade que toque no banco de dados, declare em 1 linha o impacto de consumo:
> `📊 Impacto Firestore: +X leituras por acesso | +Y escritas na ação (Estratégia: Cache/CQRS)`

---

## 🧭 2. Roteador Automático de Intenção (Poucos Detalhes → Ação Exata)

Quando o usuário acionar você com poucos detalhes, identifique o tema pela tabela abaixo e **leia imediatamente o documento oficial correspondente** antes de responder ou alterar código:

| Se o usuário mencionar... | Documento Obrigatório para Leitura Imediata | Foco da Validação |
| :--- | :--- | :--- |
| **Atividade não aparece, Aula X sumiu, lentidão, cota, leituras, cache, `portal_views`, ranking** | [`docs/arquitetura/firestore-cache-cqrs.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/firestore-cache-cqrs.md) | Verificar particionamento em *chunks* (150 itens), invalidação de `lastKnownGlobalUpdate` e projeção em `portal_views`. |
| **Formandos, veteranos, memorial, selo honorífico, aplausos, card 3D, Hall da Fama** | [`docs/arquitetura/hall-da-fama.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/hall-da-fama.md) | Respeitar os 3 pilares (Rascunho Aluno → Curadoria Tutor → Vitrine Pública) e imutabilidade pós-formatura. |
| **Multi-escola, venda do sistema, onboarding, landing page, planos, White-Label** | [`docs/arquitetura/saas-expansao.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/saas-expansao.md) | Garantir isolamento por escola/tenant e parametrização dinâmica. |
| **Quiz infinito, typing, devolução de tarefa, erro 431, concorrência, histórico de bugs** | [`docs/planejamento/historico-correcoes-criticas.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/planejamento/historico-correcoes-criticas.md) | Não reintroduzir regressões já solucionadas. |
| **Refatoração, organização, dívida técnica, próximos passos, fases do projeto** | [`docs/planejamento/plano-de-acao.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/planejamento/plano-de-acao.md) e [`docs/planejamento/fases-migracao-task.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/planejamento/fases-migracao-task.md) | Seguir a ordem de prioridades e manter a arquitetura limpa. |
| **Planilha antiga, Apps Script, como funcionava antes da migração** | [`docs/legado/appscript/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/legado/appscript/) | Apenas consulta histórica. Nunca reativar dependências de Google Sheets no fluxo principal. |

---

## 🗺️ 3. Mapa da Verdade do Código (Guia Anti-Alucinação)

**NUNCA invente ou adivinhe** nomes de arquivos, funções de cache ou coleções do banco. Utilize estritamente a estrutura real abaixo:

### 🗄️ Dicionário Oficial de Coleções do Firestore
* `alunos`: Cadastro mestre dos estudantes (ID do doc = matrícula ou ID único, contém `xp`, `turma`, `statusGraduacao`, `memorial`, etc.).
* `atividades`: Missões e aulas importadas do AVA ou criadas no painel (`statusPublicacao: "Publicada" | "Rascunho"`, `turmaAlvo`, `modulo`, `xp`, `tipo`).
* `entregas`: Submissões e notas dos alunos por atividade (`status`, `xpGanho`, `feedbackTutor`, `linkEntrega`).
* `portal_views`: **Coleção CQRS de leitura rápida do Portal do Aluno** (1 documento por matrícula contendo o resumo pré-processado do estudante).
* `cache`: Armazena o manifesto `atividades_publicadas` e os blocos particionados `atividades_chunk_0`, `atividades_chunk_1`, etc.
* `metadata`: Armazena snapshots administrativos como `cache_alunos_index` e `cache_alunos_geral_${i}`.
* `frequencia` & `justificativas`: Registros de presença diária e abonos de faltas.
* `modulos` & `configuracoes`: Controle de liberação de módulos por turma e parâmetros globais da escola.
* `monitor_leituras`: Telemetria automática de consumo de leituras do Firestore injetada em [`src/lib/firebaseAdmin.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/firebaseAdmin.ts).

### 📂 Arquivos-Chave da Arquitetura (`src/`)
* [`src/lib/firebaseAdmin.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/firebaseAdmin.ts): Exporta `dbAdmin` (instância autenticada do Firestore Admin com monitor de leituras embutido). **Sempre importe `dbAdmin` daqui no backend.**
* [`src/lib/cache.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/cache.ts): Central de cache em memória (L1) e cache particionado no Firestore (L2). Funções críticas:
  * `loadFirestoreCacheAtividades(dbAdmin)` e `refreshFirestoreCacheAtividades(dbAdmin)`
  * `getCachedPortal(matricula)`, `setCachedPortal(matricula, data)`, `invalidatePortalCache(matricula)`
  * `getAlunosAtivosSnapshot(dbAdmin)`, `invalidateAdminAlunosCache()`
* [`src/lib/classroom.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/classroom.ts): Integração oficial com Google Classroom API v1 via OAuth2.
* [`src/lib/gamificacao.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/gamificacao.ts): Cálculo de níveis, patentes, badges e regras de XP.
* [`src/types/index.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/types/index.ts): Contratos e interfaces globais do TypeScript.
* **Rotas Principais:**
  * [`src/app/portal/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/portal/): Interface do Aluno.
  * [`src/app/trilhatech/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/trilhatech/): Painel Docente / Tutor (Aulas, Correções, Frequência, Ranking, Memorial).
  * [`src/app/hall-da-fama/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/hall-da-fama/): Santuário Público de Formandos.

---

## ⚖️ 4. Diretrizes Estritas de Codificação e Higiene

### 4.1. Proibição Absoluta do Tipo `any`
* **Regra**: Sob hipótese alguma utilize a palavra-chave `any` em variáveis, parâmetros, retornos, mapeadores ou blocos `catch`.
* **Padrão Obrigatório**:
  * Defina interfaces explícitas (`interface Aluno`, `interface AtividadeCacheItem`, `Record<string, unknown>`).
  * Em blocos de erro, utilize exclusivamente `catch (error: unknown)` com *type narrowing* (`const err = error instanceof Error ? error : new Error(String(error))`).

### 4.2. Higiene da Raiz e Proteção de Dados (LGPD)
* **Proibido criar scripts temporários na raiz**: Qualquer script `.js`/`.ts` de diagnóstico ou teste pontual criado por uma IA deve ficar em diretório temporário fora do Git (`scratch/`) e ser removido após o uso. Utilitários permanentes pertencem a `scripts/`.
* **Proibido versionar dumps de dados**: Jamais faça commit de arquivos `.json`, `.txt` ou `.csv` contendo dumps de banco ou dados reais de estudantes.

### 4.3. Sincronização Viva da Documentação (`Doc-Sync`)
* Sempre que uma alteração modificar contratos de banco, regras do Hall da Fama, lógica de cache ou etapas do roadmap, **atualize o respectivo arquivo dentro de [`docs/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/) na mesma entrega**.

---

## ⚡ 5. Protocolo de Comando Rápido (Acionamento Único)

Quando o usuário digitar comandos curtos como **"Valide"**, **"Audite"**, **"Analise impacto"** ou **"Pode validar e subir?"**, execute automaticamente todos os passos abaixo em sequência sem precisar de novas instruções:

1. **Inspeção de Escopo**: Verifique `git status` e `git diff` para listar todos os arquivos afetados.
2. **Varredura de Tipagem (`Zero Any`)**: Confirme que nenhum `any` foi introduzido nos arquivos alterados.
3. **Auditoria de Arquitetura e Cota**: Confirme que a mudança respeita [`docs/arquitetura/firestore-cache-cqrs.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/firestore-cache-cqrs.md), [`docs/arquitetura/hall-da-fama.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/hall-da-fama.md) e [`docs/arquitetura/saas-expansao.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/saas-expansao.md).
4. **Compilação Estrita**: Execute `npx tsc --noEmit` e garanta saída com **código 0**.
5. **Verificação de Limpeza**: Garanta que não restaram arquivos temporários na raiz do projeto.
6. **Relatório & Deploy**: Apresente o resumo objetivo da validação e, se autorizado pelo usuário, realize `git commit` semântico e `git push origin master`.

### 🗄️ Dicionário Oficial de Coleções do Firestore
* `alunos`: Cadastro mestre dos estudantes (ID do doc = matrícula ou ID único, contém `xp`, `turma`, `statusGraduacao`, `memorial`, etc.).
* `atividades`: Missões e aulas importadas do AVA ou criadas no painel (`statusPublicacao: "Publicada" | "Rascunho"`, `turmaAlvo`, `modulo`, `xp`, `tipo`).
* `entregas`: Submissões e notas dos alunos por atividade (`status`, `xpGanho`, `feedbackTutor`, `linkEntrega`).
* `portal_views`: **Coleção CQRS de leitura rápida do Portal do Aluno** (1 documento por matrícula contendo o resumo pré-processado do estudante).
* `cache`: Armazena o manifesto `atividades_publicadas` e os blocos particionados `atividades_chunk_0`, `atividades_chunk_1`, etc.
* `metadata`: Armazena snapshots administrativos como `cache_alunos_index` e `cache_alunos_geral_${i}`.
* `frequencia` & `justificativas`: Registros de presença diária e abonos de faltas.
* `modulos` & `configuracoes`: Controle de liberação de módulos por turma e parâmetros globais da escola.
* `monitor_leituras`: Telemetria automática de consumo de leituras do Firestore injetada em [`src/lib/firebaseAdmin.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/firebaseAdmin.ts).

### 📂 Arquivos-Chave da Arquitetura (`src/`)
* [`src/lib/firebaseAdmin.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/firebaseAdmin.ts): Exporta `dbAdmin` (instância autenticada do Firestore Admin com monitor de leituras embutido). **Sempre importe `dbAdmin` daqui no backend.**
* [`src/lib/cache.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/cache.ts): Central de cache em memória (L1) e cache particionado no Firestore (L2). Funções críticas:
  * `loadFirestoreCacheAtividades(dbAdmin)` e `refreshFirestoreCacheAtividades(dbAdmin)`
  * `getCachedPortal(matricula)`, `setCachedPortal(matricula, data)`, `invalidatePortalCache(matricula)`
  * `getAlunosAtivosSnapshot(dbAdmin)`, `invalidateAdminAlunosCache()`
* [`src/lib/classroom.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/classroom.ts): Integração oficial com Google Classroom API v1 via OAuth2.
* [`src/lib/gamificacao.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/gamificacao.ts): Cálculo de níveis, patentes, badges e regras de XP.
* [`src/types/index.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/types/index.ts): Contratos e interfaces globais do TypeScript.
* **Rotas Principais:**
  * [`src/app/portal/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/portal/): Interface do Aluno.
  * [`src/app/trilhatech/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/trilhatech/): Painel Docente / Tutor (Aulas, Correções, Frequência, Ranking, Memorial).
  * [`src/app/hall-da-fama/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/hall-da-fama/): Santuário Público de Formandos.

---

## ⚖️ 4. Diretrizes Estritas de Codificação e Higiene

### 4.1. Proibição Absoluta do Tipo `any`
* **Regra**: Sob hipótese alguma utilize a palavra-chave `any` em variáveis, parâmetros, retornos, mapeadores ou blocos `catch`.
* **Padrão Obrigatório**:
  * Defina interfaces explícitas (`interface Aluno`, `interface AtividadeCacheItem`, `Record<string, unknown>`).
  * Em blocos de erro, utilize exclusivamente `catch (error: unknown)` com *type narrowing* (`const err = error instanceof Error ? error : new Error(String(error))`).

### 4.2. Higiene da Raiz e Proteção de Dados (LGPD)
* **Proibido criar scripts temporários na raiz**: Qualquer script `.js`/`.ts` de diagnóstico ou teste pontual criado por uma IA deve ficar em diretório temporário fora do Git (`scratch/`) e ser removido após o uso. Utilitários permanentes pertencem a `scripts/`.
* **Proibido versionar dumps de dados**: Jamais faça commit de arquivos `.json`, `.txt` ou `.csv` contendo dumps de banco ou dados reais de estudantes.

### 4.3. Sincronização Viva da Documentação (`Doc-Sync`)
* Sempre que uma alteração modificar contratos de banco, regras do Hall da Fama, lógica de cache ou etapas do roadmap, **atualize o respectivo arquivo dentro de [`docs/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/) na mesma entrega**.

---

## ⚡ 5. Protocolo de Comando Rápido (Acionamento Único)

Quando o usuário digitar comandos curtos como **"Valide"**, **"Audite"**, **"Analise impacto"** ou **"Pode validar e subir?"**, execute automaticamente todos os passos abaixo em sequência sem precisar de novas instruções:

1. **Inspeção de Escopo**: Verifique `git status` e `git diff` para listar todos os arquivos afetados.
2. **Varredura de Tipagem (`Zero Any`)**: Confirme que nenhum `any` foi introduzido nos arquivos alterados.
3. **Auditoria de Arquitetura e Cota**: Confirme que a mudança respeita [`docs/arquitetura/firestore-cache-cqrs.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/firestore-cache-cqrs.md), [`docs/arquitetura/hall-da-fama.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/hall-da-fama.md) e [`docs/arquitetura/saas-expansao.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/saas-expansao.md).
4. **Compilação Estrita**: Execute `npx tsc --noEmit` e garanta saída com **código 0**.
5. **Verificação de Limpeza**: Garanta que não restaram arquivos temporários na raiz do projeto.
6. **Relatório & Deploy**: Apresente o resumo objetivo da validação e, se autorizado pelo usuário, realize `git commit` semântico e `git push origin master`.

