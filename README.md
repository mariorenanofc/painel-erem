# 🎓 TrilhaTech — Painel de Gestão e Gamificação Escolar (EREM)

> **Plataforma completa de engajamento pedagógico, gamificação de sala de aula e gestão docente.**  
> Criado e testado em ambiente escolar real na EREM Barão de Exu, integrando Google Classroom, pontuações de XP, ranking em tempo real, diário de bordo e um santuário histórico no Hall da Fama.

---

## ✨ Módulos e Funcionalidades

### 🎮 1. Portal do Aluno (`/portal`)
* **Gamificação Completa:** Níveis dinâmicos (Iniciante a Lendário), XP acumulativo, saldo em carteira e barra de progresso.
* **Missões & Entregas:** Visualização em tempo real de missões pendentes, concluídas, devolvidas e atrasadas, organizadas por módulos de estudo.
* **Coding Practice & Typing Test:** Desafios de código e treino de digitação com validação de precisão e tempo.
* **Loja de Recompensas & Rifa:** Troca de XP por itens pedagógicos, prêmios reais e rifas semanais.
* **Quiz Teórico Infinito:** Banco inteligente de perguntas aleatórias com anti-repetição e controle de teto diário.
* **Extrato & Pix Pedagógico:** Histórico completo de transações e transferências de XP entre colegas.

### 🛡️ 2. Portal do Tutor & Gestão Docente (`/trilhatech`)
* **Sincronização com Google Classroom (AVA):** Importação automatizada de submissões, notas e feedback com barra de progresso granular e auditoria de duplicidade.
* **Radar de Atividades:** Detecção instantânea de novas atividades publicadas no Google Classroom para inclusão em lote na Trilha.
* **Central de Correções & Auditoria:** Moderação de notas de XP, devolução de atividades para refação e estorno seguro de pontuações.
* **Diário de Frequência & Check-in:** Chamada rápida hoje/mensal, geração de senhas rotativas de lousa e justificativa de faltas.
* **Ranking Semanal, Mensal e Geral:** Filtros por turma, pódio dinâmico e coroação da elite semanal com injeção de bônus.
* **Controle de Módulos & Permissões:** Abertura, fechamento e controle de status de módulos por turma.

### 🏛️ 3. Hall da Fama Público (`/hall-da-fama`)
* **Memorial Histórico de Formandos:** Vitrine pública acessível a pais, empresas e comunidade escolar.
* **Pódio 3D & Collector Cards:** Destaque dos formandos com stacks dominadas, frases de formatura e links de projetos reais.
* **Curadoria do Mestre:** Apenas formandos com projeto aprovado, selo honorífico e parecer oficial do tutor são laureados.
* **Sistema de Aplausos 👏:** Reconhecimento diário autenticado para homenagear os formandos.

---

## 🛠️ Stack Tecnológica

* **Frontend:** [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), Canvas Confetti, Lucide Icons.
* **Backend:** Next.js Route Handlers (`/api`), [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup).
* **Banco de Dados:** [Google Cloud Firestore](https://firebase.google.com/docs/firestore) Nativo.
* **Integrações:** Google Classroom API v1, Google OAuth2, Google Apps Script (legado).
* **Tipagem & Qualidade:** TypeScript estrito com **proibição de `any`** e validação contínua via `tsc`.

---

## 📚 Mapa da Documentação Oficial (`docs/`)

Toda a documentação técnica, regras de arquitetura e planos de expansão estão organizados na pasta [`docs/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/):

```text
docs/
├── arquitetura/
│   ├── hall-da-fama.md          # Regras, modelo de dados e contratos do Hall da Fama
│   ├── firestore-cache-cqrs.md   # CQRS (portal_views), Cache Particionado e Cotas do Firestore
│   └── saas-expansao.md         # Planejamento SaaS, Landing Page e Onboarding Multi-Escola
├── planejamento/
│   ├── plano-de-acao.md         # Relatório de auditoria e roadmap de refatorações ativas
│   ├── fases-migracao-task.md   # Histórico de conclusão das Fases 4.1 e 4.2
│   └── historico-correcoes-criticas.md # Histórico de correções de quiz, jogos e concorrência
└── legado/
    └── appscript/               # Scripts e documentação técnica legada do Google Apps Script
```

> [!IMPORTANT]
> **Instrução Obrigatória para IAs e Desenvolvedores:** Antes de propor ou implementar qualquer alteração neste repositório, leia integralmente [`.agents/AGENTS.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/.agents/AGENTS.md), que contém a Constituição do Agente Guardião, o Mapa Anti-Alucinação de coleções/arquivos e o Roteador de Arquitetura.

---

## 🚀 Como Rodar Localmente

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/mariorenanofc/painel-erem.git
cd painel-erem
npm install
```

### 2. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com as credenciais do Firebase e do Google Classroom:
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@seu-projeto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"
GOOGLE_REFRESH_TOKEN="seu-refresh-token"
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📦 Deploy em Produção

O projeto está otimizado para deploy contínuo na [Vercel](https://vercel.com/) integrado ao repositório GitHub.  
Todas as alterações na branch `master` disparam builds automáticos com checagem rigorosa de compilação TypeScript.

---

Desenvolvido com 💜 e propósito educacional por **Mario Renan**.