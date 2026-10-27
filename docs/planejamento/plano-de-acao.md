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

A transição gradual do Google Sheets para o Firestore Nativo (Fase 4) está fluindo, mas deixou alguns resquícios estruturais:

*   **Cache de Configurações:** O arquivo `src/lib/cache.ts` é excelente para economizar leituras (mantendo cache por 5 min). No entanto, precisamos estender esse padrão de cache no servidor (ou Redux/Zustand no cliente) para a lista de `atividades` e `alunos`, que são os maiores gargalos de faturamento do Firebase.
*   **Autenticação e Segurança (Erro 403):** O bloqueio de segurança que verifica o cookie `tutor_session` está funcional. Você recentemente aplicou o redirecionamento manual para `/trilhatech` em caso de 403 (Token Expirado/Não Autorizado) no `api.ts`, o que é uma boa prática de UX. Precisamos apenas garantir que as rotas de API do Aluno também tenham camadas robustas de verificação.

---

## 5. 🛠️ Plano de Ação Proposto (Próximos Passos)

1.  **Fase Seguinte: Refatoração do Action Proxy**
    *   Desmembrar o arquivo monolítico `action-proxy/route.ts` dividindo as responsabilidades para `/handlers/`, garantindo a manutenibilidade da API conforme a TrilhaTech cresce.
2.  **Fase Final: Validação Funcional Sistêmica**
    *   Validar o desconto de 30% do XP e as regras do gabarito.
    *   Testar de ponta a ponta o fechamento da semana e injeção do bônus.

