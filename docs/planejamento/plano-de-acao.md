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

### ⏳ Onde Retomar na Próxima Sessão (Checklist de Continuidade)
1. **Hall da Fama — Etapa 3 (Certificados & Compartilhamento):**
   - Construir `src/components/CertificadoModal.tsx` (Certificado Digital Verificável) e `src/components/CardCompartilharModal.tsx` (Card para Stories).
2. **Refatoração Modular do Backend:**
   - Desmembrar gradualmente [`src/app/api/action-proxy/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/action-proxy/route.ts) em handlers dedicados por domínio.
