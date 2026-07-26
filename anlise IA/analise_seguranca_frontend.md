# Avaliação de Segurança e Regras do Backend vs. Frontend - Portal Trilha Tech

Realizamos uma análise profunda cruzando o código do frontend (especificamente em [api.ts](file:///c:/Users/Mario%20Renan/OneDrive/Área de Trabalho/painel-erem/src/services/api.ts)) com as regras de validação estruturadas no backend do Google Apps Script ([appscript.md](file:///c:/Users/Mario%20Renan/OneDrive/Área de Trabalho/painel-erem/necessarios%20MD/appscript.md)). 

Identificamos falhas críticas de segurança, brechas para trapaça de XP por parte dos alunos e problemas de vazamento de credenciais que precisam ser corrigidos.

---

## 1. Vulnerabilidades Críticas de Segurança

### 🔴 Vazamento do `TUTOR_TOKEN` no Client Bundle (Gravíssimo)
* **Onde está a falha:** No frontend [api.ts](file:///c:/Users/Mario%20Renan/OneDrive/Área de Trabalho/painel-erem/src/services/api.ts#L5), o token é carregado do ambiente como:
  ```typescript
  const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;
  ```
* **Impacto:** Qualquer variável iniciada com `NEXT_PUBLIC_` no Next.js é compilada diretamente no bundle de Javascript enviado ao navegador do aluno. 
* **Exploit:** O aluno pode inspecionar a aba Network do navegador ou rodar um comando simples no Console do desenvolvedor (`process.env.NEXT_PUBLIC_TUTOR_TOKEN`) para extrair a senha secreta `"TrilhaTech_Seguranca_Total_2026"`. De posse dessa senha, o aluno consegue enviar requisições diretas via POST (ex: `curl`) fingindo ser o tutor para rotas altamente protegidas como `injetar_xp_manual`, `salvar_atividade` ou `avaliar_entrega`.

---

### 🔴 Escalada de Privilégios na rota `coroar_elite`
* **Onde está a falha:** O frontend tem duas chamadas para a rota `coroar_elite`:
  1. Em `apiAluno.coroarElite` (linha 65), que roda do lado do aluno **sem** enviar o token.
  2. Em `apiTutor.coroarElite` (linha 285), que envia o token.
  No entanto, no backend (`doPost` do Apps Script), a rota `coroar_elite` **não foi incluída** no array `ROTAS_PROTEGIDAS` e também **não possui verificação de token** interna.
* **Impacto:** Qualquer aluno pode invocar `{ action: "coroar_elite", matricula: "sua_matricula", tipoPlaca: "Elite Ouro" }` diretamente pelo console e se coroar como o campeão de Elite da escola, modificando a planilha e removendo o troféu do aluno legítimo.

---

## 2. Falhas de Lógica e Brechas para Trapaça de XP (Cheats)

### ⚠️ Manipulação de XP no resgate de Badges (`resgatar_badge`)
* **Onde está a falha:** Na chamada de API do aluno `apiAluno.resgatarBadge` (linhas 120-132), o frontend envia os parâmetros `xpGanho` e `nomeBadge`:
  ```typescript
  resgatarBadge: (matricula, badgeId, xpGanho, nomeBadge) => fetchApi({ action: "resgatar_badge", ... })
  ```
  No backend (`action === "resgatar_badge"`), o script lê `xpGanho` enviado pelo payload da requisição e adiciona esse valor na planilha diretamente, sem validar se a badge de fato existe ou se ela vale aquele XP.
* **Impacto:** Um aluno malicioso pode interceptar a requisição ou disparar um POST manual configurando `xpGanho` para `999999`. O backend aceitará o valor sem questionar e creditará quase 1 milhão de XP para o aluno.

---

### ⚠️ Resgate ilícito do presente de Aniversário (`resgatar_aniversario`)
* **Onde está a falha:** A rota do backend `resgatar_aniversario` possui uma trava temporal correta que impede o resgate do presente mais de uma vez no mesmo ano (`BDAY-ANO-MATRICULA`).
  No entanto, **o backend não checa se hoje é realmente a data de nascimento do aluno** cadastrada na base de dados (`basededados`). Ele apenas executa o resgate se o aluno enviar a ação.
* **Impacto:** O aluno não precisa esperar pelo dia do seu aniversário. Ele pode simular o clique e chamar `{ action: "resgatar_aniversario", matricula: "sua_matricula" }` em qualquer dia do ano (ex: 1º de janeiro) e ganhar 100 XP extras de forma ilícita.

---

### ⚠️ Acesso à Senha do Check-in Presencial (`buscar_senha_checkin`)
* **Onde está a falha:** Para validar o check-in presencial dos alunos, a lousa gera uma senha que o professor compartilha na sala. O aluno digita essa senha no portal, e a rota `fazer_checkin` valida contra a senha armazenada na planilha.
  A rota `buscar_senha_checkin` é teoricamente protegida pelo `TUTOR_TOKEN`. Porém, como o `TUTOR_TOKEN` está exposto no bundle público (`NEXT_PUBLIC_TUTOR_TOKEN`), um aluno com conhecimento básico pode ler a senha do check-in direto do backend.
* **Impacto:** Alunos faltosos conseguem obter a senha do dia remotamente (de casa) e burlar a frequência marcando presença na aula.

---

## 3. Plano de Ação Recomendado (Próximos Passos)

Para mitigar e resolver em definitivo esses pontos de falha:

1. **Remover o token estático do código do cliente**:
   Substituir o `NEXT_PUBLIC_TUTOR_TOKEN` por autenticação dinâmica baseada nas credenciais do tutor (usuário e senha criptografada) enviadas a cada requisição restrita, ou criar uma rota proxy no backend do Next.js (API Route) que anexe o token apenas no servidor.
2. **Adicionar `coroar_elite` nas `ROTAS_PROTEGIDAS`**:
   Incluir a ação no array de rotas restritas do Apps Script para bloquear requisições não autorizadas.
3. **Hardcodificar valores de Badges no Apps Script**:
   Em vez de aceitar o `xpGanho` do frontend, o backend deve conter um dicionário seguro (ex: `const BADGES_XP = { "badge_python_1": 150, ... }`) e creditar apenas o XP predefinido daquela badge correspondente ao `badgeId` informado.
4. **Verificar Data de Nascimento no Aniversário**:
   Na rota `resgatar_aniversario` do backend, ler a data de nascimento do aluno na tabela `basededados`, comparar com a data atual e só conceder o XP se for o dia correto de aniversário.
