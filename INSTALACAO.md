# 🚀 Trilha Tech - Plataforma Gamificada de Ensino

Bem-vindo ao Trilha Tech! Um sistema completo (SaaS White-Label) de acompanhamento, gamificação e gestão escolar, feito de Tutor para Tutores.

Sem saber programar, você pode ter o seu próprio portal de alunos com Ranking de XP, Loja de Recompensas, Diário de Classe e Radar de Risco de Evasão.

---

## 🛠️ Como instalar na sua Escola (Em 3 Passos)

### 1️⃣ Copie o Banco de Dados (Google Sheets)
Todo o sistema é gerido através de uma Planilha do Google.
👉 **[CLIQUE AQUI PARA FAZER A SUA CÓPIA DA PLANILHA](https://docs.google.com/spreadsheets/d/1-J3PKSlTOZDP6ce2WXBwb2JbTxkd-tGdmnTRTAw8m8M/copy)** 

### 2️⃣ Ative a sua API (Servidor)
Na sua nova planilha copiada, siga estes passos para ativar a comunicação com o site:
1. Clique no menu superior em **Extensões > Apps Script**.
2. No canto superior direito, clique no botão azul **Implantar > Nova implantação**.
3. Selecione o tipo **"App da Web"**.
4. Em *Quem pode acessar*, mude para **"Qualquer pessoa"**.
5. Clique em **Implantar** e autorize o Google (Avançado > Acessar script).
6. **Copie a URL do App da Web** que vai aparecer na tela.

### 3️⃣ Publique o seu Site (Vercel)
Agora, basta clicar no botão abaixo para criar o seu site gratuitamente na Vercel. 
Durante a instalação, a Vercel vai pedir a variável `NEXT_PUBLIC_GOOGLE_API_URL`. **Cole a URL que você copiou no Passo 2!**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SEU_USUARIO/SEU_REPOSITORIO&env=NEXT_PUBLIC_GOOGLE_API_URL)
*(Troque `SEU_USUARIO/SEU_REPOSITORIO` pelo seu link do GitHub)*

---

## ⚙️ Configurando as suas Turmas
Com o site no ar, vá à sua Planilha do Google, clique no menu **⚙️ Trilha Tech > 🛠️ Gerar Painel de Configurações**.
Uma aba de configurações será criada onde você pode alterar o Nome da Escola, Turmas, e Senha de Check-in! Tudo atualiza automaticamente no seu site.