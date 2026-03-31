# 🏫 Painel de Gestão Escolar - EREM Barão do Exu

Um sistema web responsivo e moderno desenvolvido para facilitar o gerenciamento de alunos da EREM Barão do Exu. A aplicação utiliza o **Google Sheets** como banco de dados dinâmico, garantindo custo zero de infraestrutura e facilidade de manutenção para a coordenação da escola.

## ✨ Funcionalidades

- **Autenticação Segura:** Sistema de login validado diretamente no banco de dados.
- **Leitura em Tempo Real:** Listagem completa de alunos carregada instantaneamente da base central.
- **Filtros e Busca:** Pesquisa global por Nome ou Matrícula e filtro dinâmico por Turmas.
- **Sistema de Cadastro/Edição (CRUD):** Modal intuitivo para adicionar novos alunos ou atualizar dados existentes, com travas de segurança na edição da matrícula.
- **Espelhamento de Dados:** Ao salvar um aluno, o sistema atualiza automaticamente a Base de Dados Central e a aba específica da turma correspondente no Google Sheets.
- **Design Responsivo:** Interface construída com Tailwind CSS, adaptando-se perfeitamente de celulares a monitores ultrawide.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
- [Next.js](https://nextjs.org/) (React Framework)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

**Backend / Banco de Dados:**
- [Google Apps Script](https://developers.google.com/apps-script) (Atuando como API RESTful)
- Google Sheets (Atuando como Banco de Dados NoSQL em coleções separadas por abas)

## 📂 Arquitetura do Projeto

O projeto segue o padrão estrutural do Next.js App Router, focado em separação de responsabilidades (Clean Code):

- `/src/app`: Ponto de entrada da aplicação, rotas e estilos globais.
- `/src/components`: Componentes UI isolados e reutilizáveis (Header, Modais, Tabelas).
- `/src/types`: Definições de tipagem estática (Interfaces TypeScript) para garantir a integridade dos dados.
- `/src/utils`: Funções auxiliares isoladas, como formatadores de data e máscaras de input.

## 🚀 Como rodar o projeto localmente

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Clonar o repositório
```bash
git clone [https://github.com/mariorenanofc/painel-erem.git](https://github.com/SEU_USUARIO/painel-erem.git)
cd painel-erem
```

### 3. Instalar as dependências
```bash
npm install
```

### 4. Configurar Variáveis de Ambiente
Crie um arquivo chamado `.env.local` na raiz do projeto e adicione a URL gerada pelo seu Google Apps Script:
```env
NEXT_PUBLIC_GOOGLE_API_URL="sua_url_da_api_do_google_aqui"
```

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o sistema rodando.

## 📦 Deploy na Vercel

Este projeto está pronto para ser hospedado na [Vercel](https://vercel.com/). 
Durante a importação do repositório no painel da Vercel, não se esqueça de adicionar a variável de ambiente `NEXT_PUBLIC_GOOGLE_API_URL` na seção de *Environment Variables* antes de concluir o deploy.

---
Desenvolvido com 💻 por Mario Renan.