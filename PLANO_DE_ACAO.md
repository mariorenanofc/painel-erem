# 🔍 Relatório de Auditoria e Raio-X do Sistema (TrilhaTech)

Este documento apresenta uma análise profunda de toda a estrutura do projeto, desde o fluxo de autenticação até o gerenciamento de estado e arquitetura do backend. O objetivo é identificar pontos críticos, violações de regras, débitos técnicos e tarefas pendentes para garantir um sistema escalável, seguro e performático.

---

## 1. 🐞 Problemas e Tarefas Pendentes (Alta Prioridade)

Durante as sessões de desenvolvimento, identificamos problemas críticos que precisam ser endereçados imediatamente antes de adicionar novas funcionalidades:

> [!WARNING]
> **Explosão de Leituras no Firestore (10k+ Reads)**
> O sistema está realizando um número excessivo de leituras (reads) no banco de dados na coleção `entregas` ou `atividades` durante o carregamento dos painéis. Isso ocorre provavelmente devido a loops (ex: `.map` ou `for`) executando queries individuais em vez de utilizar buscas em lote (batch queries / `where in`) ou por falta de paginação/caching na carga inicial.

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

## 3. 🚨 Violações de Regras do Projeto (AGENTS.md)

O projeto possui uma regra de extrema importância no arquivo de configuração (`AGENTS.md`): a **Proibição Estrita do Tipo `any`**.

> [!CAUTION]
> A varredura no código acusou cerca de **72 ocorrências ativas** da palavra-chave `any` (excluindo dependências), além do uso inadequado em tratamentos de erro (`catch (e: any)`).

*   **Onde ocorre mais:** `src/types/index.ts`, `src/components/MissoesList.tsx`, `src/app/trilhatech/aulas/page.tsx`, entre outros.
*   **Proposta:** Tipagem rigorosa. Definir interfaces robustas (`interface Missao`, `interface DadosAluno`), substituir casts de `(ativ as any)` por tipos reais e substituir blocos `catch (e: any)` por `catch (error: unknown) { const err = error as Error; ... }`.

---

## 4. 🗄️ Estratégia de Dados, Cache e Sincronização

A transição gradual do Google Sheets para o Firestore Nativo (Fase 4) está fluindo, mas deixou alguns resquícios estruturais:

*   **Cache de Configurações:** O arquivo `src/lib/cache.ts` é excelente para economizar leituras (mantendo cache por 5 min). No entanto, precisamos estender esse padrão de cache no servidor (ou Redux/Zustand no cliente) para a lista de `atividades` e `alunos`, que são os maiores gargalos de faturamento do Firebase.
*   **Autenticação e Segurança (Erro 403):** O bloqueio de segurança que verifica o cookie `tutor_session` está funcional. Você recentemente aplicou o redirecionamento manual para `/trilhatech` em caso de 403 (Token Expirado/Não Autorizado) no `api.ts`, o que é uma boa prática de UX. Precisamos apenas garantir que as rotas de API do Aluno também tenham camadas robustas de verificação.

---

## 5. 🛠️ Plano de Ação Proposto (Próximos Passos)

Se você aprovar, podemos seguir com a seguinte ordem de execução para "limpar a casa":

1.  **Fase 1: Estancar o Sangramento (Leituras Firestore)**
    *   Analisar e refatorar as queries de `entregas` e `atividades` que estão causando as 10 mil requisições. Otimizar a busca substituindo chamadas dentro de loops por uma busca única em lote.
2.  **Fase 2: Erradicação do Tipo `any`**
    *   Aplicar uma força-tarefa rápida para substituir as variáveis `any` por suas interfaces corretas nos arquivos de componentes vitais, respeitando a regra principal do projeto.
3.  **Fase 3: Refatoração do Action Proxy**
    *   Desmembrar o `action-proxy/route.ts` dividindo as responsabilidades, para não perdermos o controle da API conforme a TrilhaTech cresce.
4.  **Fase 4: Validação do TOP 10 (Funcional)**
    *   Testar de ponta a ponta o fechamento da semana e injeção do bônus.

## User Review Required

Você concorda com essa avaliação de cenário? Gostaria de atacar o problema da **explosão de leituras (10k reads) no Firebase** agora como nossa primeira prioridade?
