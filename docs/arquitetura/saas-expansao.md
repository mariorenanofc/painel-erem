# 🚀 Planejamento: Expansão do TrilhaTech (SaaS / Open Source)

Este documento estrutura as etapas para transformar o TrilhaTech em uma plataforma que outros tutores e escolas possam adotar, contendo o escopo da Landing Page e o novo passo a passo de instalação.

---

## 1. 🌐 Landing Page (Página Inicial)
O objetivo desta página é apresentar o projeto para visitantes e outros professores/tutores.

**Estrutura da Página:**
- **Hero Section:** Título de impacto ("Gamifique sua sala de aula"), subtítulo explicando que é um sistema feito de Tutor para Tutor, e um botão "Como instalar na minha escola".
- **Nossa História:** Um breve resumo da história do projeto na EREM Barão de Exu, como ele engajou os alunos e por que foi decidido abri-lo para outros educadores.
- **Features Principais (O que a plataforma faz?):**
  - 🏆 Ranking de XP e Níveis (Gameficação visual).
  - 🛒 Loja de Recompensas (Alunos trocam XP por benefícios reais).
  - 🎯 Missões e Quiz (Integração com Google Classroom e jogos).
  - 📊 Dashboard do Tutor (Acompanhamento, Radar de Evasão e Diário).
- **Rodapé / Footer:** Links para o repositório, contato e redes sociais.

---

## 2. ⚙️ Guia de Instalação para Outras Escolas (Setup Passo a Passo)
Como o sistema está evoluindo (saindo apenas da Planilha e indo para o Firebase), o passo a passo precisa ser claro e fácil para quem não é programador avançado.

**Etapas Propostas para o Guia:**

### Passo 1: O Banco de Dados (Firebase)
*Como a transição para o Firebase está acontecendo, precisaremos orientar o tutor a criar um projeto gratuito no Firebase.*
- Criar conta no Firebase Console.
- Iniciar um novo projeto (ex: `trilhatech-escolaX`).
- Habilitar o Firestore Database e a Autenticação.
- Gerar e copiar as Chaves da API (Firebase Config).

### Passo 2: O Repositório (Vercel / GitHub)
- Fazer um *Fork* ou *Deploy direto* usando o botão da Vercel.
- Colar as variáveis de ambiente (Chaves do Firebase) na Vercel durante a instalação.
- Aguardar o site ficar online.

### Passo 3: O Primeiro Acesso (Setup Inicial)
- Acessar o link gerado pela Vercel.
- O primeiro usuário a criar conta recebe permissão automática de "God Mode / Tutor Master".
- Acessar o painel `trilhatech/configuracoes` para cadastrar o nome da escola, turmas e gerar o código de check-in.

---

## 3. 🛠️ Cronograma de Desenvolvimento (Status Atual)

### ✅ Já Concluído (Feito)
- [x] **Estrutura Base da Landing Page (`LandingPage.tsx`)**: Interface desenhada com Hero Section, História do projeto (PFT/CESAR), Features de Gamificação, Gestão Docente e Missão Institucional.
- [x] **Planejamento de SaaS / Open Source**: Levantamento dos passos necessários para tornar o sistema instalável por outras escolas (este documento).

### ⏳ Pendente (A Fazer)
- [ ] **Mecanismo de "Primeiro Acesso" (Backend)**: Criar a lógica que verifica se o banco (coleção `usuarios`) está vazio e dá poder de Tutor Master automaticamente ao 1º usuário que fizer login.
- [ ] **Call to Action na Landing Page**: Adicionar um botão "Levar para a minha escola" que direcione para as instruções de instalação.
- [ ] **Guia de Setup Firebase (`/setup` ou `INSTALACAO.md`)**: Atualizar o tutorial focando em como criar o banco no Firebase, pegar as chaves e fazer o deploy na Vercel.
- [ ] **Página/Fluxo de Onboarding Inicial**: Tela simples logo após o Primeiro Acesso para configurar Nome da Escola e Turmas padrão.
