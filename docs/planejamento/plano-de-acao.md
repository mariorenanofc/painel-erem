# 🔍 Relatório de Auditoria e Raio-X do Sistema (TrilhaTech)

Este documento apresenta uma análise profunda de toda a estrutura do projeto, desde o fluxo de autenticação até o gerenciamento de estado e arquitetura do backend. O objetivo é identificar pontos críticos, violações de regras, débitos técnicos e tarefas pendentes para garantir um sistema escalável, seguro e performático.

---

## 1. 🐞 Problemas e Tarefas Pendentes (Alta Prioridade)

Durante as sessões de desenvolvimento, identificamos problemas críticos que precisam ser endereçados imediatamente antes de adicionar novas funcionalidades:


> [!IMPORTANT]
> **Validação do TOP 10 Semanal**
> O fluxo do `FechamentoCicloModal.tsx` e a injeção do bônus de XP semanal não foram completamente validados. Precisamos garantir que a lógica de "coroar_elite" seja testada de ponta a ponta sem falhas de concorrência.

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
   - [x] **Etapa 1 (`src/lib/cache.ts` & `src/lib/firebaseAdmin.ts`):** Chunks de atividades unificados (`includesRascunhos: true`, `respostaCorreta`, `maiorIdNumerico`), singletons `loadEstatisticasAtividadesResumo`, `loadFirestoreConfiguracoes`, `refreshAlunosAtivosSnapshot` (com cache RAM), caches em memória para frequência, transações e rifas, e trava `firestoreMonkeyPatched` em `firebaseAdmin.ts`.
   - [x] **Etapa 2 (`src/app/api/tutor/atividades/route.ts` & `src/app/api/alunos/portal/route.ts`):** `/api/tutor/atividades` lendo de `loadFirestoreCacheAtividades` + `loadEstatisticasAtividadesResumo` (reduzindo de ~1.696 para ~8 leituras no *cold start* e 0 em RAM); filtro estrito `statusPublicacao === "Publicada"` e omissão de `respostaCorreta` em `/api/alunos/portal`.
   - [x] **Etapa 3 (`src/app/api/action-proxy/route.ts`, `enviar-missao`, `transacoes`, `diario-classe`, `frequencia-hoje`, `rifas`):** Removido `refreshFirestoreCacheAtividades` de `avaliar_entrega`/`reverter_entrega`/`excluir_entrega`; geração de ID `O(1)` (`getNextAtividadeId`) e `skipCacheRefresh` em `salvar_atividade`; sincronia atômica de `cache/estatisticas_atividades_resumo`, `cache/configuracoes_gerais` e `refreshAlunosAtivosSnapshot`; eliminação do erro de índice composto em `diario-classe`.
   - [x] **Etapa 4 (`radar/route.ts`, `ImportadorLoteModal.tsx`, `sincronizar-ava/route.ts`):** Leitura de `PUBLISHED` e `DRAFT` no Radar Classroom com interface organizada (abas Publicadas/Rascunhos/Todas, busca, ordenação por aula, modo compacto e seleção segura); auto-publicação ao sincronizar com o AVA e busca em lote `courseWorkId: "-"` no Google Classroom (reduzindo a sincronização geral para poucos segundos e ~44 leituras no Firestore).

### ⏳ Onde Retomar na Próxima Sessão (Checklist de Continuidade)
1. **Hall da Fama — Etapa 3 (Certificados & Compartilhamento):**
   - Construir `src/components/CertificadoModal.tsx` (Certificado Digital Verificável) e `src/components/CardCompartilharModal.tsx` (Card para Stories).
2. **Refatoração Modular & Validação Sistêmica:**
   - Desmembrar gradualmente [`src/app/api/action-proxy/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/action-proxy/route.ts) em handlers dedicados.
   - Validar de ponta a ponta o fechamento da semana (`coroar_elite` / TOP 10 Semanal) e desconto de 30% de XP por atraso.
