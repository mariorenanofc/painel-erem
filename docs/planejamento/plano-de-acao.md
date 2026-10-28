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

## 5. 🛠️ Plano de Ação Proposto (Status Atual & Próximos Passos)

### ✅ Entregas Recentes Concluídas
1. **Cache Particionado de Atividades & Correção "Aula 47":** Implementado particionamento em blocos (*chunks* de 150 itens) em [`src/lib/cache.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/lib/cache.ts) e sincronização com `portal_views`.
2. **Constituição do Agente Guardião ([`.agents/AGENTS.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/.agents/AGENTS.md)):** Criado protocolo de interrupção proativa de risco, roteador de intenção e mapa anti-alucinação.
3. **Hall da Fama — Etapa 2 (Curadoria do Tutor & Cache de Veteranos):**
   - Implementados [`src/app/api/tutor/memorial/curadoria/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/tutor/memorial/curadoria/route.ts) e [`src/components/CuradoriaHallModal.tsx`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/components/CuradoriaHallModal.tsx).
   - Aplicada soberania estrita de `publicadoNoHall === true` na vitrine pública ([`src/app/api/alunos/veteranos/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/alunos/veteranos/route.ts)) e remoção de mockups forçados.

### ⏳ Onde Retomar na Próxima Sessão (Checklist de Continuidade)
1. **Validação Local & Deploy da Etapa 2 do Hall da Fama:**
   - Confirmar testes locais da Curadoria do Tutor (publicar/ocultar formandos, aprovar TCC e exibir *Palavra do Mestre*).
   - Executar validação final e subir (`git commit` + `git push`) os arquivos da Etapa 2.
2. **Hall da Fama — Etapa 3 (Certificados & Compartilhamento):**
   - Construir `src/components/CertificadoModal.tsx` (Certificado Digital Verificável) e `src/components/CardCompartilharModal.tsx` (Card para Stories).
3. **Refatoração Modular & Validação Sistêmica:**
   - Desmembrar gradualmente [`src/app/api/action-proxy/route.ts`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/src/app/api/action-proxy/route.ts) em handlers dedicados.
   - Validar de ponta a ponta o fechamento da semana (`coroar_elite` / TOP 10 Semanal) e desconto de 30% de XP por atraso.

