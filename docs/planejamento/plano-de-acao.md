# 🔍 Relatório de Auditoria e Raio-X do Sistema (TrilhaTech)

Este documento apresenta uma análise profunda de toda a estrutura do projeto, desde o fluxo de autenticação até o gerenciamento de estado e arquitetura do backend. O objetivo é identificar pontos críticos, violações de regras, débitos técnicos e tarefas pendentes para garantir um sistema escalável, seguro e performático.

---

## 1. 🐞 Problemas e Tarefas Pendentes (Alta Prioridade)

Durante as sessões de desenvolvimento, identificamos problemas críticos que precisam ser endereçados imediatamente antes de adicionar novas funcionalidades:

> [!IMPORTANT]
> **Validação do TOP 10 Semanal**
> O fluxo do `FechamentoCicloModal.tsx` e a injeção do bônus de XP semanal e mensal agora operam com motor central de idempotência e parametrização dinâmica de regras de corte e premiação.

---

## 2. 🏗️ Arquitetura e Débito Técnico

O sistema está crescendo rapidamente e alguns arquivos tornaram-se "monolíticos", o que dificulta a manutenção e aumenta a chance de bugs colaterais.

*   **Front-end Monolítico (`src/app/portal/page.tsx`):**
    *   Este arquivo atingiu quase **2.000 linhas de código**. Ele gerencia estados excessivos (modal, dados do aluno, gamificação, fetch de configs).
    *   **Proposta:** Extrair a lógica pesada para Custom Hooks (ex: `useAlunoData`, `useGamification`) e fragmentar partes exclusivas da UI em componentes menores (como já foi feito com os Modais).
*   **Back-end Monolítico (`src/app/api/action-proxy/route.ts`):**
    *   O endpoint centralizador tem mais de **1.350 linhas** e processa praticamente TODAS as ações do sistema (switch/if-else gigantes).
    *   **Proposta:** Utilizar o padrão de "Controllers" ou "Handlers" (ex: criar uma pasta `/handlers/` e separar as lógicas como `handleAtividades.ts`, `handleAlunos.ts`, `handleConfiguracoes.ts`).

---

## 4. 🗄️ Estratégia de Dados, Cache e Sincronização

A transição gradual do Google Sheets para o Firestore Nativo (Fase 4) está concluída nos fluxos principais:

*   **Cache Unificado de Configurações, Atividades e Alunos (`src/lib/cache.ts`):** Estendido para cobrir tanto o Portal do Aluno quanto o Painel do Tutor (`/trilhatech`), utilizando singletons (`cache/configuracoes_gerais`, `cache/estatisticas_atividades_resumo`, `metadata/cache_alunos_geral_0`) e chunks particionados (`cache/atividades_chunk_{i}`).
*   **Autenticação e Segurança (Erro 403):** O bloqueio de segurança que verifica o cookie `tutor_session` está funcional, com redirecionamento automático em caso de expiração.

---

## 5. 🛠️ Plano de Ação Proposto (Status Atual & Próximos Passos)

### ✅ Entregas Recentes Concluídas
1. **Cache Particionado de Atividades & Correção "Aula 47":** Implementado particionamento em blocos (*chunks* de 150 itens) em [`src/lib/cache.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/cache.ts) e sincronização com `portal_views`.
2. **Constituição do Agente Guardião ([`.agents/AGENTS.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/.agents/AGENTS.md)):** Criado protocolo de interrupção proativa de risco, roteador de intenção e mapa anti-alucinação.
3. **Hall da Fama — Etapa 2 (Curadoria do Tutor & Cache de Veteranos):**
   - Implementados [`src/app/api/tutor/memorial/curadoria/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/tutor/memorial/curadoria/route.ts) e [`src/components/CuradoriaHallModal.tsx`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/components/CuradoriaHallModal.tsx).
   - Aplicada soberania estrita de `publicadoNoHall === true` na vitrine pública ([`src/app/api/alunos/veteranos/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/veteranos/route.ts)) e remoção de mockups forçados.
4. **Fase 2 de Blindagem de Cota do Firestore, Radar Classroom Organizado & Sincronizar AVA em Lote (Concluída em 28/10/2026):**
   - [x] Chunks de atividades unificados (`includesRascunhos: true`, `respostaCorreta`, `maiorIdNumerico`) e singletons otimizados.
   - [x] Radar Classroom organizado (`DRAFT` + `PUBLISHED`) e Sincronizar AVA acelerado com busca em lote (`courseWorkId: "-"`).
5. **Automação Inteligente de Ciclos, Calendário Oficial & Parametrização Dinâmica de XP (Concluído em 02/11/2026):**
   - [x] **Fase 1 (Parametrização Dinâmica):** Modelos `RegrasCiclosConfig` em `types/index.ts`, cache L1 em `cache.ts`, endpoints no backend e nova aba de gestão visual em `AbaCiclos.tsx` (dia de fechamento, horário de corte, modo automático/alerta XP do Top 1, Top 2-3 e Top 4-10, além de controle por checkbox para premiação de Brinde Físico exclusivo e geração dinâmica das mensagens de WhatsApp).
   - [x] **Fase 2 (Motor de Fechamento & Estorno Seguro):** Engine `ciclosEngine.ts` com idempotência absoluta, IDs determinísticos na coleção `entregas`, isolamento total das notas escolares, atualização CQRS em `portal_views`, gravação de snapshot em `historico_ciclos`, ação `estornar_ciclo` e endpoint `/api/cron/fechar-ciclo`.
   - [x] **Fase 3 (Modal Renovado com Retroatividade):** `FechamentoCicloModal.tsx` com navegação entre "Ciclo Anterior" e "Ciclo Atual", auditoria com status `✅ Pago / Concluído`, abas de WhatsApp individuais (Turma 1, Turma 2, Geral) e botão de estorno de emergência.
   - [x] **Fase 4 (Calendário Oficial Integrado):** `CalendarioOficial.tsx` com visão mensal estilo Google Agenda, lista de prazos de missões, datas de aulas, contagem regressiva para fechamento de ciclo e feriados nacionais (fixos e móveis calculados por feriadosUtils.ts), com acesso no Portal do Aluno (botão de acesso rápido no header e menu de perfil) e no Painel do Tutor.
6. **Transição Visual Oficial PFT (Projeto Florescendo Talentos) & Canonicidade Tailwind CSS (Concluído em 13/11/2026):**
   - [x] **Fase 1 (Design Tokens & CSS Global):** Configuração de tokens em globals.css para Light (Areia #f7f5ec) e Dark (Azul Marinho #08172e/#0e2442), bordas PFT e blobs de iluminação ambiental.
   - [x] **Fase 2 (Portal do Aluno, Cockpit & Login):** Implementação de PftBackgroundPattern.tsx com trilhas tubulares e nós de circuito, alinhamento dos fundos 3D Three.js e calibração de contraste nos botões e abas.
   - [x] **Fase 3 (Área Docente / TrilhaTech):** Header, Dashboard, Aulas, Analytics, Configurações e Gabaritos vestidos com a nova identidade visual PFT; eliminação completa de tipos any com tipagem estrita (FichaAluno, HistoricoXPItem).
   - [x] **Fase 4 (Hall da Fama, Modais Compartilhados & Release Sync):** Fundo PFT, luzes cósmicas laranja/azul e badges de honra no Hall da Fama; atualização das novidades para v2.3.0 em NovidadesModal.tsx e LancamentoNovidadesModal.tsx.
   - [x] **Auditoria de Canonicidade:** Eliminação de classes arbitrárias fora da escala oficial do Tailwind CSS e validação estrita (npx tsc --noEmit código 0).


7. **Blindagem de Automação de Ciclos, Fuso de Brasília & Fechamento Semanal W46 (Concluído em 13/11/2026):**
   - [x] Criação de `getDataBrasilia(date?: Date)` em `src/lib/dateUtils.ts` via `Intl.DateTimeFormat` (`America/Sao_Paulo`), eliminando distorções de fuso horário nos servidores UTC da Vercel.
   - [x] Correção de chave padrão e seleção inteligente em `src/lib/ciclosEngine.ts` com base no dia e horário de corte configurados.
   - [x] Verificação passiva Just-in-Time em `src/app/api/action-proxy/route.ts` (`listar_historico_ciclos`), garantindo fechamento instantâneo se o cron falhar.
   - [x] Apuração oficial da Semana 46 com 20 estudantes bonificados no Top 10 e disparo de novidades `v2.4.0`.

---

## 6. 🎨 Fase 7: Refinamento de UI/UX, Microinterações & Psicologia Cognitiva (Os 20 Princípios)

Plano de ação estruturado para transformar a plataforma em uma experiência ultra-polida, fluida e instintiva para estudantes e tutores, alinhado aos 20 princípios de animação, design de produto e psicologia cognitiva, respeitando a Constituição do Agente ([`.agents/AGENTS.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/.agents/AGENTS.md)).

> 📊 **Impacto Firestore:** 0 leituras extras (opera exclusivamente com a visão consolidada CQRS `portal_views` e cache em memória).
> ⚡ **Zero Regressões:** Manter estritamente tipos fortes (Zero `any`), compilação limpa (`npx tsc --noEmit`) e classes canônicas do Tailwind CSS.

### 📋 Checklist de Execução por Etapas:

- [x] **Etapa 7.1: Fundação de Acessibilidade & Física de Movimento (Regras 9, 2, 3, 7, 8)**
  - [x] Adicionar suporte a `prefers-reduced-motion` no CSS global (`src/app/globals.css`) e hook unificado (`src/lib/motion.ts`) para desativar molas/escalas para usuários com sensibilidade vestibular.
  - [x] Padronizar física de mola elástica (`spring physics`: `stiffness: 300-340, damping: 26-28`) e desaceleração suave (`easeOut on enter`) nos modais compartilhados (`CertificadosModal`, `ResponderMissaoModal`, `NovidadesModal`, `PerfilModal`, `JogosModal`).
  - [x] Completar feedback de toque (`active:scale-95`) e elevação ao passar o mouse (`hover:-translate-y-1` + sombra difusa) nas tabelas e cards de certificados.

- [x] **Etapa 7.2: Skeleton Loading & Eliminação de Spinners de Bloqueio (Regra 5)**
  - [x] Criar `<CockpitSkeleton />`, `<GabaritoGridSkeleton />` e `<TableSkeleton />` em `src/components/Skeletons.tsx` com placeholders pulsando no formato real dos cards.
  - [x] Substituir a tela de bloqueio total `TrilhaTechLoader` em `src/app/portal/page.tsx` pela montagem instantânea com esqueleto.
  - [x] Substituir o spinner "Descriptografando matrizes..." em `src/app/portal/gabaritos/page.tsx` por `<GabaritoGridSkeleton />`.
  - [x] Implementar `<TableSkeleton />` na frequência do aluno e extrato de transações em `src/app/trilhatech/aulas/page.tsx`.

- [x] **Etapa 7.3: Stagger Transitions & Shared Element Layout (Regras 1, 4, 10)**
  - [x] Implementar entrada em cascata escalonada (`staggerContainer`/`staggerItem`) na lista de trilhas e missões (`src/app/portal/page.tsx`), certificados (`CertificadosModal.tsx`) e ranking docente (`RankingTutorModal.tsx`).
  - [x] Implementar Shared Element Transition com `layoutId` conectando o card da missão em `src/app/portal/page.tsx` ao `<ResponderMissaoModal.tsx>`, e os cards de certificado ao visualizador em `<CertificadosModal.tsx>`.
  - [x] Garantir animações interrompíveis e seguras com `useMotionConfig()` respeitando `prefers-reduced-motion`.

- [x] **Etapa 7.4: Psicologia do Aluno: Próximo Passo, Urgência & Metas (Regras 12, 16, 17, 19)**
  - [x] **Von Restorff Effect (16):** Card mestre *"Próximo Passo"* em destaque visual no Cockpit (`PortalCockpit.tsx`) com acesso direto à próxima missão aberta.
  - [x] **Zeigarnik Effect (19):** Banner de urgência no Cockpit para tarefas devolvidas pelo tutor aguardando correção com botão *"Corrigir Agora"*.
  - [x] **Goal-Gradient Effect (12):** Barra de evolução com porcentagem real, destaque de *"Reta Final"* (>= 75%) e texto dinâmico de proximidade de patente.
  - [x] **Serial Position Effect (17):** Posicionamento das ações de maior retenção nos extremos dos painéis.

- [x] **Etapa 7.5: Optimistic UI & Peak-End Rule (Regras 6, 18, 11, 13, 14, 15, 20)**
  - [x] **Optimistic UI (6):** Atualização instantânea (0ms) com rollback automático nas avaliações e reversões de entregas pelo tutor (`src/app/trilhatech/aulas/page.tsx`).
  - [x] **Peak-End Rule (18):** Micro-celebração com confetti (respeitando `prefers-reduced-motion`) no envio bem-sucedido de missões e respostas corretas de quiz (`src/app/portal/page.tsx`) e na visualização/download de certificados oficiais (`CertificadosModal.tsx`).
  - [x] **Auditoria de Proximidade, Similaridade e Região Comum (13, 14, 15, 20):** Validação final de espaçamentos, agrupamento contextual, zero `any`, e conservação de complexidade no backend CQRS.

---

### ⏳ Onde Retomar na Próxima Sessão (Checklist de Continuidade)
1. **Hall da Fama — Etapa 3 (Certificados & Compartilhamento):**
   - Construir `src/components/CertificadoModal.tsx` e `src/components/CardCompartilharModal.tsx`.
2. **Refatoração Modular do Backend:**
   - Desmembrar gradualmente [`src/app/api/action-proxy/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/action-proxy/route.ts) em handlers dedicados por domínio.
