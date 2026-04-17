function doGet(e) {
const planilha = SpreadsheetApp.getActiveSpreadsheet();
const bd = planilha.getSheetByName("basededados");
const dados = bd.getDataRange().getValues();

// 1. LER OS DADOS DO PROJETO TRILHA TECH
const abaTrilha = planilha.getSheetByName("trilhatech");
let trilhaMap = {}; // Dicionário inteligente para busca rápida

if (abaTrilha) {
const dadosTrilha = abaTrilha.getDataRange().getValues();
// Pula o cabeçalho (i=1)
for (let j = 1; j < dadosTrilha.length; j++) {
let mat = String(dadosTrilha[j][0]).trim();
trilhaMap[mat] = {
turmaTrilha: String(dadosTrilha[j][1] || ""),
statusTrilha: String(dadosTrilha[j][2] || ""),
whatsapp: String(dadosTrilha[j][6] || "").trim() === "SIM"
};
}
}

const alunos = [];

// 2. CRUZAR ESCOLA COM CURSO
for (let i = 1; i < dados.length; i++) {
let dataNascFormatada = dados[i][1];
if (dataNascFormatada instanceof Date) {
dataNascFormatada = dataNascFormatada.toISOString().split('T')[0];
}

    let matricula = String(dados[i][2] || "").trim();
    // Procura se esse aluno está no dicionário do Trilha Tech
    let infoTrilha = trilhaMap[matricula] || { turmaTrilha: "", statusTrilha: "" };

    alunos.push({
      nome: String(dados[i][0] || ""),
      dataNasc: String(dataNascFormatada || ""),
      matricula: matricula,
      email: String(dados[i][3] || ""),
      turma: String(dados[i][4] || ""),
      telefoneAluno: String(dados[i][5] || ""),
      telefoneResponsavel: String(dados[i][6] || ""),
      obs: String(dados[i][7] || ""),
      turmaTrilha: infoTrilha.turmaTrilha,   // <-- INFORMAÇÃO TRILHA
      statusTrilha: infoTrilha.statusTrilha,  // <-- INFORMAÇÃO TRILHA
      whatsapp: infoTrilha.whatsapp
    });

}

return ContentService.createTextOutput(JSON.stringify(alunos))
.setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
try {
const dadosApp = JSON.parse(e.postData.contents);
const action = dadosApp.action;
const planilha = SpreadsheetApp.getActiveSpreadsheet();

    // ==========================================
    // ROTA 1: LOGIN DA GESTÃO
    // ==========================================
    if (action === "login") {
      const abaUsuarios = planilha.getSheetByName("usuarios");
      const dadosUsuarios = abaUsuarios.getDataRange().getValues();
      const usuarioDigitado = String(dadosApp.usuario).trim().toLowerCase();
      const senhaDigitada = String(dadosApp.senha).trim();

      for (let i = 1; i < dadosUsuarios.length; i++) {
        if (String(dadosUsuarios[i][0]).trim().toLowerCase() === usuarioDigitado && String(dadosUsuarios[i][1]).trim() === senhaDigitada) {
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", nome: dadosUsuarios[i][2] })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Usuário ou senha incorretos." })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 2: LOGIN DO ALUNO DO TRILHA TECH
    // ==========================================
    if (action === "login_aluno") {
      var matriculaDigitada = String(dadosApp.matricula).trim();
      var dataNascDigitada = String(dadosApp.dataNasc).trim();

      var planBase = planilha.getSheetByName("basededados");
      var dadosBase = planBase.getDataRange().getValues();

      var alunoEncontrado = false;
      var dadosDoAluno = null;

      // Pula o cabeçalho (i=1) e procura a matrícula na escola
      for (var i = 1; i < dadosBase.length; i++) {
        var matriculaPlanilha = String(dadosBase[i][2]).trim();

        if (matriculaPlanilha === matriculaDigitada) {
          alunoEncontrado = true;

          var dataNascBruta = dadosBase[i][1];
          var dataNascPlanilha = "";

          if (dataNascBruta instanceof Date) {
            var timezone = Session.getScriptTimeZone();
            dataNascPlanilha = Utilities.formatDate(dataNascBruta, timezone, "yyyy-MM-dd");
          } else {
            dataNascPlanilha = String(dataNascBruta).trim();
          }

          if (dataNascPlanilha === dataNascDigitada || dataNascPlanilha.includes(dataNascDigitada)) {
            dadosDoAluno = {
              matricula: matriculaPlanilha,
              nome: dadosBase[i][0],
              turma: dadosBase[i][4]
            };
            break;
          }
        }
      }

      // Se achou na escola, agora VERIFICA NO TRILHA TECH!
      if (alunoEncontrado && dadosDoAluno) {
        var abaTrilha = planilha.getSheetByName("trilhatech");
        var statusNoProjeto = ""; // Começa vazio

        if (abaTrilha) {
          var dadosTrilha = abaTrilha.getDataRange().getValues();
          for (var t = 1; t < dadosTrilha.length; t++) {
            if (String(dadosTrilha[t][0]).trim() === dadosDoAluno.matricula) {
              statusNoProjeto = String(dadosTrilha[t][2]).trim(); // Pega o status (Ativo, Desistente, Inscrito...)
              break;
            }
          }
        }

        // A BARREIRA: Só entra se for "Ativo"
        if (statusNoProjeto === "Ativo") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "sucesso",
            mensagem: "Login aprovado!",
            aluno: dadosDoAluno
          })).setMimeType(ContentService.MimeType.JSON);
        } else {
          // O aluno existe, mas NÃO está aprovado no projeto
          return ContentService.createTextOutput(JSON.stringify({
            status: "nao_autorizado",
            mensagem: "Aluno não faz parte do projeto.",
            nomeAluno: dadosDoAluno.nome
          })).setMimeType(ContentService.MimeType.JSON);
        }

      } else if (alunoEncontrado && !dadosDoAluno) {
        return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Data de nascimento incorreta."})).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Matrícula não encontrada na escola."})).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ==========================================
    // ROTA 3: SALVAR/EDITAR ALUNO (Gestão Escolar)
    // ==========================================
    if (action === "salvar_aluno") {
      const matriculaDigitada = String(dadosApp.matricula).trim();
      const nome = dadosApp.nome;
      const dataNasc = dadosApp.dataNasc;
      const email = String(dadosApp.email || "").trim();
      const turma = dadosApp.turma;
      const telefoneAluno = String(dadosApp.telefoneAluno || "").trim();
      const telefoneResponsavel = String(dadosApp.telefoneResponsavel || "").trim();
      const obs = dadosApp.obs;

      if (!matriculaDigitada || !nome || !turma) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Matrícula, Nome e Turma são obrigatórios." })).setMimeType(ContentService.MimeType.JSON);
      }

      const bd = planilha.getSheetByName("basededados");
      const dadosBD = bd.getDataRange().getValues();
      let linhaBD = -1;

      for (let i = 1; i < dadosBD.length; i++) {
        let matLinha = String(dadosBD[i][2]).trim();
        let emailLinha = String(dadosBD[i][3]).trim().toLowerCase();
        let telAlunoLinha = String(dadosBD[i][5]).trim();

        if (matLinha === matriculaDigitada) {
          linhaBD = i + 1;
        } else {
          if (email && email.toLowerCase() !== "sem email" && email.toLowerCase() !== "não encontrado" && emailLinha === email.toLowerCase()) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: `Este e-mail já está cadastrado na matrícula: ${matLinha}` })).setMimeType(ContentService.MimeType.JSON);
          }
          if (telefoneAluno && telAlunoLinha === telefoneAluno) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: `Este telefone de aluno já pertence à matrícula: ${matLinha}` })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      if (linhaBD > 0) {
        bd.getRange(linhaBD, 1).setValue(nome);
        bd.getRange(linhaBD, 2).setValue(dataNasc);
        bd.getRange(linhaBD, 3).setValue(matriculaDigitada);
        bd.getRange(linhaBD, 4).setValue(email);
        bd.getRange(linhaBD, 5).setValue(turma);
        bd.getRange(linhaBD, 6).setValue(telefoneAluno);
        bd.getRange(linhaBD, 7).setValue(telefoneResponsavel);
        bd.getRange(linhaBD, 8).setValue(obs);
      } else {
        bd.appendRow([nome, dataNasc, matriculaDigitada, email, turma, telefoneAluno, telefoneResponsavel, obs]);
      }

      const nomeAbaTurma = turma.replace(" ANO ", " ");
      const abaTurma = planilha.getSheetByName(nomeAbaTurma);

      if (abaTurma) {
        const dadosTurma = abaTurma.getDataRange().getValues();
        let linhaTurma = -1;
        for (let i = 1; i < dadosTurma.length; i++) {
          if (String(dadosTurma[i][3]).trim() === matriculaDigitada) {
            linhaTurma = i + 1; break;
          }
        }

        if (linhaTurma > 0) {
          abaTurma.getRange(linhaTurma, 2).setValue(nome);
          abaTurma.getRange(linhaTurma, 3).setValue(dataNasc);
          abaTurma.getRange(linhaTurma, 4).setValue(matriculaDigitada);
          abaTurma.getRange(linhaTurma, 5).setValue(email);
          abaTurma.getRange(linhaTurma, 6).setValue(turma);
          abaTurma.getRange(linhaTurma, 7).setValue(telefoneAluno);
          abaTurma.getRange(linhaTurma, 8).setValue(telefoneResponsavel);
          abaTurma.getRange(linhaTurma, 9).setValue(obs);
        } else {
          const proximoNumero = dadosTurma.length;
          abaTurma.appendRow([proximoNumero, nome, dataNasc, matriculaDigitada, email, turma, telefoneAluno, telefoneResponsavel, obs]);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Salvo com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 4: INSCREVER NO TRILHA TECH
    // ==========================================
    if (action === "inscrever_trilhatech") {
      const matricula = String(dadosApp.matricula).trim();
      const turmaCurso = dadosApp.turmaCurso;
      const statusCurso = dadosApp.statusCurso;

      // Formata a data atual do Brasil
      const dataAtual = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}).split(',')[0];

      const abaTrilha = planilha.getSheetByName("trilhatech");
      const dadosTrilha = abaTrilha.getDataRange().getValues();

      // 1. Verifica se já não foi inscrito antes
      for (let i = 1; i < dadosTrilha.length; i++) {
        if (String(dadosTrilha[i][0]).trim() === matricula) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Esta matrícula já está inscrita no projeto." })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // 2. Registra na aba
      abaTrilha.appendRow([matricula, turmaCurso, statusCurso, dataAtual]);
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Inscrição realizada com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 5: MUDAR STATUS NO TRILHA TECH
    // ==========================================
    if (action === "mudar_status_trilhatech") {
      const matricula = String(dadosApp.matricula).trim();
      const novoStatus = dadosApp.novoStatus; // Ex: "Ativo", "Reserva", "Desistente"
      const dataAtual = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}).split(',')[0];

      const abaTrilha = planilha.getSheetByName("trilhatech");
      const dadosTrilha = abaTrilha.getDataRange().getValues();

      let linha = -1;
      for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matricula) {
            linha = i + 1;
            break;
          }
      }

      if (linha > 0) {
          abaTrilha.getRange(linha, 3).setValue(novoStatus); // Atualiza o status
          abaTrilha.getRange(linha, 4).setValue(dataAtual);  // Atualiza a data da mudança
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `Status atualizado para ${novoStatus}!` })).setMimeType(ContentService.MimeType.JSON);
      } else {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Matrícula não encontrada no curso." })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ==========================================
    // ROTA 6: BUSCAR ATIVIDADES DO ALUNO (CORRIGIDA)
    // ==========================================
    if (action === "buscar_atividades") {
      const matricula = String(dadosApp.matricula).trim();

      const abaAtividades = planilha.getSheetByName("atividades");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaTrilha = planilha.getSheetByName("trilhatech"); // <-- NOVA BUSCA

      let atividades = [];
      let entregasMap = {};

      // 1. Descobre a Turma, o XP e o Nível do aluno no Projeto
      let turmaDoAlunoNoProjeto = "";
      let xpTotalDoAluno = 0;
      let nivelDoAluno = "Iniciante";

      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let t = 1; t < dadosTrilha.length; t++) {
          if (String(dadosTrilha[t][0]).trim() === matricula) {
            turmaDoAlunoNoProjeto = String(dadosTrilha[t][1]).trim();
            xpTotalDoAluno = Number(dadosTrilha[t][4]) || 0; // Coluna E (XP Total)
            nivelDoAluno = String(dadosTrilha[t][5]) || "Iniciante"; // Coluna F (Nível)
            break;
          }
        }
      }

      // 2. Mapeia as entregas que ele já fez
      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          let mat = String(dadosEntregas[i][1]).trim();
          if (mat === matricula) {
            let idAtividade = String(dadosEntregas[i][2]).trim();
            entregasMap[idAtividade] = {
              resposta: String(dadosEntregas[i][3]).trim(),
              status: String(dadosEntregas[i][4]).trim() || "Aguardando Correção",
              xpGanho: dadosEntregas[i][5] || 0
            };
          }
        }
      }

      // 3. Filtra as missões cruzando com a Turma do Projeto
      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        for (let i = 1; i < dadosAtiv.length; i++) {
          let turmaAlvo = String(dadosAtiv[i][5]).trim();

          // O SEGREDO ESTÁ AQUI: Compara a turma da missão com a turma do PROJETO do aluno
          if (turmaAlvo.toLowerCase() === "todas" || turmaAlvo === turmaDoAlunoNoProjeto) {
            let idAtiv = String(dadosAtiv[i][0]).trim();
            let entregaAluno = entregasMap[idAtiv];

            let dataLimiteBruta = dadosAtiv[i][3];
            let dataLimiteStr = "";
            if (dataLimiteBruta instanceof Date) {
               dataLimiteStr = Utilities.formatDate(dataLimiteBruta, Session.getScriptTimeZone(), "dd/MM/yyyy");
            } else {
               dataLimiteStr = String(dataLimiteBruta);
            }

            let statusPrazo = "No Prazo";
            if (!entregaAluno && dataLimiteStr) {
               let hoje = new Date();
               hoje.setHours(0,0,0,0);
               let partesData = dataLimiteStr.split('/');
               if (partesData.length === 3) {
                  let dataLim = new Date(Number(partesData[2]), Number(partesData[1])-1, Number(partesData[0]));
                  if (hoje > dataLim) {
                     statusPrazo = "Atrasada";
                  }
               }
            }

            atividades.push({
              id: idAtiv,
              titulo: String(dadosAtiv[i][1]),
              descricao: String(dadosAtiv[i][2]),
              dataLimite: dataLimiteStr,
              xp: dadosAtiv[i][4],
              tipo: String(dadosAtiv[i][6] || "Projeto"),
              opcaoA: String(dadosAtiv[i][7] || ""),
              opcaoB: String(dadosAtiv[i][8] || ""),
              opcaoC: String(dadosAtiv[i][9] || ""),
              opcaoD: String(dadosAtiv[i][10] || ""),
              status: entregaAluno ? entregaAluno.status : "Pendente",
              respostaEnviada: entregaAluno ? entregaAluno.resposta : "",
              xpGanho: entregaAluno ? entregaAluno.xpGanho : 0,
              statusPrazo: statusPrazo
            });
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", atividades: atividades, xpTotal: xpTotalDoAluno, nivel: nivelDoAluno })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 7: SALVAR OU EDITAR ATIVIDADE (Professor)
    // ==========================================
    if (action === "salvar_atividade") {
      const idAtividadeEdit = dadosApp.idAtividadeEdit; // Se vier preenchido, é EDIÇÃO
      const titulo = dadosApp.titulo;
      const descricao = dadosApp.descricao;
      const dataLimite = dadosApp.dataLimite;
      const xp = dadosApp.xp;
      const turmaAlvo = dadosApp.turmaAlvo;
      const tipo = dadosApp.tipo || "Projeto";
      const opcaoA = dadosApp.opcaoA || "";
      const opcaoB = dadosApp.opcaoB || "";
      const opcaoC = dadosApp.opcaoC || "";
      const opcaoD = dadosApp.opcaoD || "";
      const respostaCorreta = dadosApp.respostaCorreta || "";

      const abaAtividades = planilha.getSheetByName("atividades");
      if (!abaAtividades) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba 'atividades' não encontrada." })).setMimeType(ContentService.MimeType.JSON);

      if (idAtividadeEdit) {
        // MODO EDIÇÃO
        const dados = abaAtividades.getDataRange().getValues();
        let linhaEdit = -1;
        for (let i = 1; i < dados.length; i++) {
          if (String(dados[i][0]).trim() === idAtividadeEdit) {
            linhaEdit = i + 1;
            break;
          }
        }
        if (linhaEdit > 0) {
          abaAtividades.getRange(linhaEdit, 2).setValue(titulo);
          abaAtividades.getRange(linhaEdit, 3).setValue(descricao);
          abaAtividades.getRange(linhaEdit, 4).setValue(dataLimite);
          abaAtividades.getRange(linhaEdit, 5).setValue(xp);
          abaAtividades.getRange(linhaEdit, 6).setValue(turmaAlvo);
          abaAtividades.getRange(linhaEdit, 7).setValue(tipo);
          abaAtividades.getRange(linhaEdit, 8).setValue(opcaoA);
          abaAtividades.getRange(linhaEdit, 9).setValue(opcaoB);
          abaAtividades.getRange(linhaEdit, 10).setValue(opcaoC);
          abaAtividades.getRange(linhaEdit, 11).setValue(opcaoD);
          abaAtividades.getRange(linhaEdit, 12).setValue(respostaCorreta);
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão atualizada!" })).setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        // MODO CRIAÇÃO (Gerar ID)
        const ultimaLinha = abaAtividades.getLastRow();
        const numeroId = ultimaLinha.toString().padStart(3, '0');
        const idGerado = "ATIV-" + numeroId;
        abaAtividades.appendRow([idGerado, titulo, descricao, dataLimite, xp, turmaAlvo, tipo, opcaoA, opcaoB, opcaoC, opcaoD, respostaCorreta]);
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão criada! ID: " + idGerado })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ==========================================
    // ROTA 8: BUSCAR TODAS ATIVIDADES (Professor)
    // ==========================================
    if (action === "buscar_todas_atividades") {
      const filtroTurma = String(dadosApp.filtroTurma || "Todas").trim();
      const filtroTipo = String(dadosApp.filtroTipo || "Todos").trim();
      const abaAtividades = planilha.getSheetByName("atividades");
      let atividades = [];
      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        for (let i = 1; i < dadosAtiv.length; i++) {
          let dataLimiteBruta = dadosAtiv[i][3];
          let dataLimiteStr = dataLimiteBruta instanceof Date ? Utilities.formatDate(dataLimiteBruta, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(dataLimiteBruta);

          let turmaAlvo = String(dadosAtiv[i][5]);
          let tipoAtiv = String(dadosAtiv[i][6] || "Projeto");

          if (filtroTurma !== "Todas" && turmaAlvo !== "Todas" && turmaAlvo !== filtroTurma) continue;
          if (filtroTipo !== "Todos" && tipoAtiv !== filtroTipo) continue;

          atividades.push({
            id: String(dadosAtiv[i][0]),
            titulo: String(dadosAtiv[i][1]),
            descricao: String(dadosAtiv[i][2]),
            dataLimite: dataLimiteStr,
            xp: dadosAtiv[i][4],
            turmaAlvo: String(dadosAtiv[i][5]),
            tipo: String(dadosAtiv[i][6] || "Projeto"),
            opcaoA: String(dadosAtiv[i][7] || ""),
            opcaoB: String(dadosAtiv[i][8] || ""),
            opcaoC: String(dadosAtiv[i][9] || ""),
            opcaoD: String(dadosAtiv[i][10] || ""),
            respostaCorreta: String(dadosAtiv[i][11] || "A")
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", atividades: atividades.reverse() })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 9: ENVIAR ATIVIDADE (Auto-Correção e Trava de Prazo)
    // ==========================================
    if (action === "enviar_atividade") {
      const matricula = String(dadosApp.matricula).trim();
      const idAtividade = String(dadosApp.idAtividade).trim();
      const resposta = String(dadosApp.resposta).trim();
      const timestampAtual = new Date().getTime();

      const abaEntregas = planilha.getSheetByName("entregas");
      const abaAtividades = planilha.getSheetByName("atividades") || planilha.getSheetByName("basededados"); // Tenta encontrar onde estão as missões
      const abaTrilha = planilha.getSheetByName("trilhatech");

      if (!abaEntregas) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba entregas não encontrada." })).setMimeType(ContentService.MimeType.JSON);

      // 1. Busca os detalhes da Missão para auto-correção
      let ativTipo = "Projeto";
      let ativXp = 0;
      let ativRespostaCorreta = "";
      let ativDataLimite = "";

      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        for (let i = 1; i < dadosAtiv.length; i++) {
          if (String(dadosAtiv[i][0]).trim() === idAtividade) {
             ativDataLimite = String(dadosAtiv[i][3]).trim();
             ativXp = Number(dadosAtiv[i][4]) || 0;
             ativTipo = String(dadosAtiv[i][6]).trim();
             ativRespostaCorreta = String(dadosAtiv[i][11]).trim(); // Coluna L (Resposta Correta)
             break;
          }
        }
      }

      // 2. Trava de Segurança: Bloqueio de Prazo
      if (ativDataLimite) {
         let hoje = new Date();
         hoje.setHours(0,0,0,0);
         let partesData = ativDataLimite.split('-');
         if (partesData.length === 3) {
            let dataLim = new Date(Number(partesData[0]), Number(partesData[1])-1, Number(partesData[2]));
            if (hoje > dataLim) {
               return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "O prazo para envio desta missão já encerrou!" })).setMimeType(ContentService.MimeType.JSON);
            }
         }
      }

      // 3. Auto-Correção para Quizzes
      let statusFinal = "Aguardando Correção";
      let xpGanhoFinal = 0;

      if (ativTipo === "Quiz") {
         statusFinal = "Avaliado"; // Já marca como avaliado!
         if (resposta === ativRespostaCorreta) {
            xpGanhoFinal = ativXp; // Acertou! Ganha o XP total.
            // Soma o XP direto no perfil do aluno
            if (abaTrilha) {
               const dadosTrilha = abaTrilha.getDataRange().getValues();
               for(let t = 1; t < dadosTrilha.length; t++) {
                  if(String(dadosTrilha[t][0]).trim() === matricula) {
                     let xpAtual = Number(dadosTrilha[t][4]) || 0;
                     abaTrilha.getRange(t+1, 5).setValue(xpAtual + xpGanhoFinal);
                     break;
                  }
               }
            }
         }
      }

      // 4. Salva a entrega na folha
      const idEntrega = idAtividade + "-" + matricula;
      let linhaExistente = -1;
      const dadosEntregas = abaEntregas.getDataRange().getValues();
      for (let i = 1; i < dadosEntregas.length; i++) {
        if (String(dadosEntregas[i][1]).trim() === matricula && String(dadosEntregas[i][2]).trim() === idAtividade) {
          linhaExistente = i + 1; break;
        }
      }

      if (linhaExistente > 0) {
         abaEntregas.getRange(linhaExistente, 4).setValue(resposta);
         abaEntregas.getRange(linhaExistente, 5).setValue(statusFinal);
         abaEntregas.getRange(linhaExistente, 6).setValue(xpGanhoFinal);
         abaEntregas.getRange(linhaExistente, 7).setValue(timestampAtual);
      } else {
         abaEntregas.appendRow([idEntrega, matricula, idAtividade, resposta, statusFinal, xpGanhoFinal, timestampAtual]);
      }

      let msgRetorno = (ativTipo === "Quiz" && xpGanhoFinal > 0) ? "Resposta correta! XP adicionado automaticamente." : (ativTipo === "Quiz" && xpGanhoFinal === 0) ? "Resposta errada. Mas o Tutor pode rever depois!" : "Missão enviada com sucesso!";

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: msgRetorno })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 10: EXCLUIR ATIVIDADE (Professor)
    // ==========================================
    if (action === "excluir_atividade") {
      const idAtiv = String(dadosApp.idAtividade).trim();
      const abaAtividades = planilha.getSheetByName("atividades");
      if (abaAtividades) {
        const dados = abaAtividades.getDataRange().getValues();
        // Começa do fim para não quebrar a ordem ao deletar
        for (let i = dados.length - 1; i >= 1; i--) {
          if (String(dados[i][0]).trim() === idAtiv) {
            abaAtividades.deleteRow(i + 1);
            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão excluída!" })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Atividade não encontrada." })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 11: BUSCAR ENTREGAS DA ATIVIDADE E AVALIAR (Professor)
    // ==========================================
    if (action === "buscar_entregas_atividade") {
      const idAtiv = String(dadosApp.idAtividade).trim();
      const abaEntregas = planilha.getSheetByName("entregas");
      const planBase = planilha.getSheetByName("basededados");

      let alunosMap = {}; // Dicionário para buscar o Nome pela Matrícula
      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          alunosMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]);
        }
      }

      let entregas = [];
      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          if (String(dadosEntregas[i][2]).trim() === idAtiv) {
            entregas.push({
              idEntrega: String(dadosEntregas[i][0]),
              matricula: String(dadosEntregas[i][1]),
              nomeAluno: alunosMap[String(dadosEntregas[i][1])] || "Nome não encontrado",
              resposta: String(dadosEntregas[i][3]),
              status: String(dadosEntregas[i][4]),
              xpGanho: dadosEntregas[i][5] || 0
            });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", entregas: entregas })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "avaliar_entrega") {
      const idEntrega = String(dadosApp.idEntrega).trim();
      const matricula = String(dadosApp.matricula).trim();
      const xpGanho = Number(dadosApp.xpGanho) || 0;
      const novoStatus = dadosApp.novoStatus || "Avaliado";

      const abaEntregas = planilha.getSheetByName("entregas");
      let xpAnterior = 0;

      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          if (String(dadosEntregas[i][0]).trim() === idEntrega) {
            xpAnterior = Number(dadosEntregas[i][5]) || 0;
            abaEntregas.getRange(i + 1, 5).setValue(novoStatus); // status
            abaEntregas.getRange(i + 1, 6).setValue(xpGanho); // xp_ganho
            break;
          }
        }
      }

      // Adiciona o XP na aba TrilhaTech (Coluna E = índice 5 da tabela)
      const abaTrilha = planilha.getSheetByName("trilhatech");
      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matricula) {
            let xpTotalAtual = Number(dadosTrilha[i][4]) || 0;
            let novoXpTotal = xpTotalAtual - xpAnterior + xpGanho;
            abaTrilha.getRange(i + 1, 5).setValue(novoXpTotal);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Avaliação salva com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 12: BUSCAR PERFIL DO ALUNO (Visualização Completa)
    // ==========================================
    if (action === "buscar_perfil_aluno") {
      const matricula = String(dadosApp.matricula).trim();
      const planBase = planilha.getSheetByName("basededados");

      if (!planBase) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba basededados não encontrada." })).setMimeType(ContentService.MimeType.JSON);

      const dadosBase = planBase.getDataRange().getValues();
      let perfil = null;

      for (let i = 1; i < dadosBase.length; i++) {
        if (String(dadosBase[i][2]).trim() === matricula) {

          // Formata a data de nascimento se for um objeto nativo
          let dataNascBruta = dadosBase[i][1];
          let dataNascStr = dataNascBruta instanceof Date ? Utilities.formatDate(dataNascBruta, Session.getScriptTimeZone(), "dd/MM/yyyy") : String(dataNascBruta);

          perfil = {
            nome: String(dadosBase[i][0]),
            dataNasc: dataNascStr,
            matricula: String(dadosBase[i][2]),
            email: String(dadosBase[i][3]),
            turma: String(dadosBase[i][4]),
            telefoneAluno: String(dadosBase[i][5]),
            telefoneResponsavel: String(dadosBase[i][6])
          };
          break;
        }
      }

      if (perfil) {
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", perfil: perfil })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado na base de dados." })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ==========================================
    // ROTA 13: ATUALIZAR APENAS CONTATOS DO ALUNO
    // ==========================================
    if (action === "atualizar_contatos_aluno") {
      const matricula = String(dadosApp.matricula).trim();
      const telefoneAluno = String(dadosApp.telefoneAluno || "").trim();
      const telefoneResponsavel = String(dadosApp.telefoneResponsavel || "").trim();
      const turma = String(dadosApp.turma).trim();

      const bd = planilha.getSheetByName("basededados");
      let atualizado = false;

      // 1. Atualiza na aba Geral (basededados)
      if (bd) {
        const dadosBD = bd.getDataRange().getValues();
        for (let i = 1; i < dadosBD.length; i++) {
          if (String(dadosBD[i][2]).trim() === matricula) {
            bd.getRange(i + 1, 6).setValue(telefoneAluno); // Coluna F
            bd.getRange(i + 1, 7).setValue(telefoneResponsavel); // Coluna G
            atualizado = true;
            break;
          }
        }
      }

      // 2. Atualiza na aba Específica da Turma (Ex: "1º ANO A")
      const nomeAbaTurma = turma.replace(" ANO ", " ");
      const abaTurma = planilha.getSheetByName(nomeAbaTurma);
      if (abaTurma) {
        const dadosTurma = abaTurma.getDataRange().getValues();
        for (let i = 1; i < dadosTurma.length; i++) {
          if (String(dadosTurma[i][3]).trim() === matricula) { // Matrícula é Coluna D
            abaTurma.getRange(i + 1, 7).setValue(telefoneAluno); // Coluna G
            abaTurma.getRange(i + 1, 8).setValue(telefoneResponsavel); // Coluna H
            break;
          }
        }
      }

      if (atualizado) {
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Contatos atualizados com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro ao tentar salvar contatos." })).setMimeType(ContentService.MimeType.JSON);
      }
    }


    // ==========================================
    // ROTA 14: FAZER CHECK-IN DE PRESENÇA (Com Senha da Lousa e Dias)
    // ==========================================
    if (action === "fazer_checkin") {
      const matricula = String(dadosApp.matricula).trim();
      const senhaDigitada = String(dadosApp.senha).trim().toUpperCase();
      const timezone = Session.getScriptTimeZone();

      const dataHoje = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");
      const horaAtual = Utilities.formatDate(new Date(), timezone, "HH:mm:ss");
      const diaSemana = new Date().getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb

      const abaFrequencia = planilha.getSheetByName("frequencia");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaConfig = planilha.getSheetByName("configuracoes");

      if (!abaFrequencia || !abaTrilha) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      // 1. VALIDAÇÃO DA SENHA DA LOUSA
      let senhaCorreta = "";
      if (abaConfig) senhaCorreta = String(abaConfig.getRange("B1").getValue()).trim().toUpperCase();

      if (senhaCorreta !== "" && senhaDigitada !== senhaCorreta) {
         return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Senha da lousa incorreta! Verifique com o tutor." })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2. Descobre a Turma do aluno no Projeto
      let turmaDoAluno = "";
      let linhaTrilhaAluno = -1;
      let xpAtual = 0;
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        if (String(dadosTrilha[i][0]).trim() === matricula) {
          turmaDoAluno = String(dadosTrilha[i][1]).trim();
          linhaTrilhaAluno = i + 1;
          xpAtual = Number(dadosTrilha[i][4]) || 0;
          break;
        }
      }

      // 3. VALIDAÇÃO DE CALENDÁRIO: DIAS DA SEMANA PERMITIDOS
      if (turmaDoAluno.includes("1º Ano") && diaSemana !== 1 && diaSemana !== 3) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Ops! O 1º Ano só pode registrar presença nas Segundas e Quartas." })).setMimeType(ContentService.MimeType.JSON);
      }
      if (turmaDoAluno.includes("2º Ano") && diaSemana !== 2 && diaSemana !== 4) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Ops! O 2º Ano só pode registrar presença nas Terças e Quintas." })).setMimeType(ContentService.MimeType.JSON);
      }

      // 4. Verifica se já fez check-in HOJE
      const dadosFreq = abaFrequencia.getDataRange().getValues();
      for (let i = 1; i < dadosFreq.length; i++) {
        let matFreq = String(dadosFreq[i][1]).trim();
        let dataFreqBruta = dadosFreq[i][3];
        let dataFreqStr = dataFreqBruta instanceof Date ? Utilities.formatDate(dataFreqBruta, timezone, "dd/MM/yyyy") : String(dataFreqBruta);

        if (matFreq === matricula && dataFreqStr === dataHoje) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você já garantiu o seu XP de presença hoje!" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // 5. Salva a presença
      let nomeAluno = "Aluno";
      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          if (String(dadosBase[i][2]).trim() === matricula) { nomeAluno = String(dadosBase[i][0]); break; }
        }
      }

      const idCheckin = "CHK-" + new Date().getTime();
      const xpGanho = 10;
      abaFrequencia.appendRow([idCheckin, matricula, nomeAluno, dataHoje, horaAtual, xpGanho]);
      if (linhaTrilhaAluno > 0) abaTrilha.getRange(linhaTrilhaAluno, 5).setValue(xpAtual + xpGanho);

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Check-in realizado! +10 XP" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 15: BUSCAR FREQUÊNCIA HOJE (COM CONTROLE DE FALTAS ACUMULADAS)
    // ==========================================
    if (action === "buscar_frequencia_hoje") {
      const turma = String(dadosApp.turma || "").trim();
      const abaFrequencia = planilha.getSheetByName("frequencia");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");

      if (!abaFrequencia || !abaTrilha || !planBase) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);
      }

      // 1. Data de Hoje Formatada (DD/MM/YYYY)
      const timezone = Session.getScriptTimeZone();
      const dataHojeStr = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");

      // 2. Mapear Alunos Ativos da Turma
      let alunosDaTurma = {};
      let nomesMap = {};

      const dadosBase = planBase.getDataRange().getValues();
      for(let i = 1; i < dadosBase.length; i++) {
          nomesMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]).trim();
      }

      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for(let i = 1; i < dadosTrilha.length; i++) {
         let mat = String(dadosTrilha[i][0]).trim();
         let t = String(dadosTrilha[i][1]).trim();
         let status = String(dadosTrilha[i][3]).trim().toLowerCase();

         // Somente alunos ativos que pertencem à turma selecionada
         if (mat && t === turma && status !== "desclassificado") {
            alunosDaTurma[mat] = {
               matricula: mat,
               nome: nomesMap[mat] || "Aluno " + mat,
               presencasTotais: 0,
               faltasTotais: 0,
               presenteHoje: false,
               horaHoje: ""
            };
         }
      }

      // 3. Varre a Frequência para calcular totais e presenças de hoje
      let diasDeAulaSet = new Set();
      const dadosFreq = abaFrequencia.getDataRange().getValues();

      for(let i = 1; i < dadosFreq.length; i++) {
         let mat = String(dadosFreq[i][1]).trim();
         let dataBruta = dadosFreq[i][3];
         let dataFormatada = "";

         if (dataBruta instanceof Date) {
            dataFormatada = Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy");
         } else {
            dataFormatada = String(dataBruta).trim();
         }

         if (alunosDaTurma[mat]) {
            // Conta os dias únicos de aula da turma
            diasDeAulaSet.add(dataFormatada);
            alunosDaTurma[mat].presencasTotais++;

            // Verifica se o aluno fez check-in HOJE
            if (dataFormatada === dataHojeStr) {
               alunosDaTurma[mat].presenteHoje = true;
               alunosDaTurma[mat].horaHoje = String(dadosFreq[i][4]);
            }
         }
      }

      let totalAulasTurma = diasDeAulaSet.size;

      // 4. Calcula Faltas Acumuladas
      let listaFinal = Object.values(alunosDaTurma).map(a => {
         a.faltasTotais = totalAulasTurma - a.presencasTotais;
         if (a.faltasTotais < 0) a.faltasTotais = 0; // Proteção
         return a;
      });

      // Ordenar por ordem alfabética
      listaFinal.sort((a, b) => a.nome.localeCompare(b.nome));

      return ContentService.createTextOutput(JSON.stringify({
         status: "sucesso",
         registros: listaFinal,
         totalAulas: totalAulasTurma
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 16: BUSCAR RANKING DINÂMICO
    // ==========================================
    if (action === "buscar_ranking") {
      const filtroTempo = String(dadosApp.filtroTempo || "geral").trim();
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaFrequencia = planilha.getSheetByName("frequencia");

      if (!abaTrilha || !planBase) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      let dataAtual = new Date();
      let timeInicio = 0;
      let timeFim = dataAtual.getTime();

      // AJUSTE: Semana começa na Segunda-feira e vai até Domingo
      if (filtroTempo === "semanal") {
        let diaSemana = dataAtual.getDay(); // JS Padrão: 0 é Domingo, 1 é Segunda...
        let diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;

        let inicioSemana = new Date(dataAtual);
        inicioSemana.setDate(dataAtual.getDate() - diffParaSegunda);
        inicioSemana.setHours(0,0,0,0);
        timeInicio = inicioSemana.getTime();
      } else if (filtroTempo === "mensal") {
        let inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
        inicioMes.setHours(0,0,0,0);
        timeInicio = inicioMes.getTime();
      }

      function parseDataBr(str) {
        if (!str) return 0;
        let p = str.split('/');
        if (p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime();
        return 0;
      }

      let alunosRankMap = {};
      let nomesMap = {};
      const dadosBase = planBase.getDataRange().getValues();
      for (let i = 1; i < dadosBase.length; i++) nomesMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]);

      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        let mat = String(dadosTrilha[i][0]).trim();
        let status = String(dadosTrilha[i][3]).trim().toLowerCase();
        let xpTotalFolha = Number(dadosTrilha[i][4]) || 0;

        if (mat && status !== "desclassificado") {
           alunosRankMap[mat] = {
             matricula: mat,
             nome: nomesMap[mat] || "Aluno " + mat,
             turma: String(dadosTrilha[i][1]).trim(),
             nivel: String(dadosTrilha[i][5]) || "Iniciante",
             // AJUSTE: O Histórico Total puxa da folha, a Semana/Mês começa do zero
             xpCalculado: filtroTempo === "geral" ? xpTotalFolha : 0
           };
        }
      }

      let maxTimes = {};

      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          let mat = String(dadosEntregas[i][1]).trim();
          let status = String(dadosEntregas[i][4]).trim();
          let xp = Number(dadosEntregas[i][5]) || 0;
          let timestampEnvio = Number(dadosEntregas[i][6]) || 0;

          if (alunosRankMap[mat] && status === "Avaliado") {
             // Salva a hora exata para fazer o desempate justo
             if (!maxTimes[mat] || timestampEnvio > maxTimes[mat]) maxTimes[mat] = timestampEnvio;

             // Se for semana/mês, vai somando ponto a ponto o que aconteceu naquele período
             if (filtroTempo !== "geral" && timestampEnvio >= timeInicio && timestampEnvio <= timeFim) {
                 alunosRankMap[mat].xpCalculado += xp;
             }
          }
        }
      }

      if (abaFrequencia && filtroTempo !== "geral") {
        const dadosFreq = abaFrequencia.getDataRange().getValues();
        for (let i = 1; i < dadosFreq.length; i++) {
          let mat = String(dadosFreq[i][1]).trim();
          let dataStr = String(dadosFreq[i][3]).trim();
          let xp = Number(dadosFreq[i][5]) || 0;
          let timestampFreq = parseDataBr(dataStr);

          if (alunosRankMap[mat]) {
             if (timestampFreq >= timeInicio && timestampFreq <= timeFim) {
                 alunosRankMap[mat].xpCalculado += xp;
             }
          }
        }
      }

      let ranking = Object.values(alunosRankMap).map(aluno => ({
         ...aluno, ultimoEnvio: maxTimes[aluno.matricula] || 9999999999999
      }));

      // ORDENAÇÃO E DESEMPATE
      ranking.sort((a, b) => {
        if (b.xpCalculado !== a.xpCalculado) return b.xpCalculado - a.xpCalculado; // Quem tem + XP vence
        else return a.ultimoEnvio - b.ultimoEnvio; // Empatou? Quem entregou a última missão primeiro vence
      });

      ranking = ranking.map((aluno, index) => ({
        ...aluno, xp: aluno.xpCalculado, posicao: index + 1
      }));

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", ranking: ranking })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 17: GERENCIAR SENHA DA LOUSA (TUTOR)
    // ==========================================
    if (action === "buscar_senha_checkin") {
      const abaConfig = planilha.getSheetByName("configuracoes");
      if (!abaConfig) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba configuracoes não encontrada." })).setMimeType(ContentService.MimeType.JSON);
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", senha: String(abaConfig.getRange("B1").getValue() || "") })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "atualizar_senha_checkin") {
      const novaSenha = String(dadosApp.novaSenha).trim().toUpperCase();
      const abaConfig = planilha.getSheetByName("configuracoes");
      if (!abaConfig) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba configuracoes não encontrada." })).setMimeType(ContentService.MimeType.JSON);
      abaConfig.getRange("A1").setValue("senha_checkin");
      abaConfig.getRange("B1").setValue(novaSenha);
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Senha atualizada com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 18: SINCRONIZADOR SIEPE (BASE GERAL)
    // ==========================================
    if (action === "sincronizar_siepe") {
      const alunosNovos = dadosApp.alunos || [];
      const planBase = planilha.getSheetByName("basededados");
      const abaTrilha = planilha.getSheetByName("trilhatech");

      if (!planBase || !abaTrilha) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      let dadosBase = planBase.getDataRange().getValues();
      let mapBase = {};
      for(let i = 1; i < dadosBase.length; i++) { mapBase[String(dadosBase[i][2]).trim()] = i + 1; }

      let dadosTrilha = abaTrilha.getDataRange().getValues();
      let mapTrilha = {};
      for(let i = 1; i < dadosTrilha.length; i++) { mapTrilha[String(dadosTrilha[i][0]).trim()] = i + 1; }

      let inseridos = 0;
      let atualizados = 0;

      alunosNovos.forEach(aluno => {
         let matricula = String(aluno.matricula).trim();
         let nome = String(aluno.nome).trim();
         let dataNasc = String(aluno.dataNasc).trim();
         let turmaEscola = String(aluno.turmaEscola).trim();
         let emailInstitucional = matricula + "@aluno.educacao.pe.gov.br";

         // 1. ATUALIZA OU INSERE NA BASE GERAL (basededados)
         if (mapBase[matricula]) {
            let linha = mapBase[matricula];
            planBase.getRange(linha, 1).setValue(nome);
            planBase.getRange(linha, 2).setValue(dataNasc);
            planBase.getRange(linha, 5).setValue(turmaEscola);
            atualizados++;
         } else {
            planBase.appendRow([nome, dataNasc, matricula, emailInstitucional, turmaEscola, "", ""]);
            inseridos++;
         }

         // 2. ATUALIZA NA TRILHA APENAS SE JÁ EXISTIR LÁ
         if (mapTrilha[matricula]) {
            let linhaTrilha = mapTrilha[matricula];
            let turmaProjeto = turmaEscola.includes("1º") ? "Turma 1 - 1º Ano" : "Turma 2 - 2º Ano";
            abaTrilha.getRange(linhaTrilha, 2).setValue(turmaProjeto);
         }
         // Se não existe na trilha, não fazemos nada. O aluno fica apenas na base geral.
      });

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso", inseridos: inseridos, atualizados: atualizados
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 19: BUSCAR DIÁRIO DE CLASSE (MATRIZ)
    // ==========================================
    if (action === "buscar_diario_classe") {
      const turmaSelecionada = String(dadosApp.turma || "").trim();
      const mesStr = String(dadosApp.mes || ""); // Ex: "4" para Abril
      const anoStr = String(dadosApp.ano || ""); // Ex: "2026"

      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaFrequencia = planilha.getSheetByName("frequencia");

      if (!abaTrilha || !planBase || !abaFrequencia) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);
      }

      // 1. Encontrar todos os alunos ativos da turma selecionada
      let alunosMap = {};
      let nomesMap = {};

      const dadosBase = planBase.getDataRange().getValues();
      for (let i = 1; i < dadosBase.length; i++) {
        nomesMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]);
      }

      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        let mat = String(dadosTrilha[i][0]).trim();
        let turma = String(dadosTrilha[i][1]).trim();
        let status = String(dadosTrilha[i][3]).trim().toLowerCase();

        if (mat && turma === turmaSelecionada && status !== "desclassificado") {
          alunosMap[mat] = {
            matricula: mat,
            nome: nomesMap[mat] || "Aluno " + mat,
            frequencia: {} // Objeto para guardar as presenças do mês
          };
        }
      }

      if (Object.keys(alunosMap).length === 0) {
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", diasComAula: [], alunos: [] })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2. Vasculhar a aba de frequência para descobrir os dias de aula do mês
      let diasComAulaSet = new Set();
      const dadosFreq = abaFrequencia.getDataRange().getValues();

      for (let i = 1; i < dadosFreq.length; i++) {
        let idCheckin = String(dadosFreq[i][0]).trim();
        let mat = String(dadosFreq[i][1]).trim();
        let dataBruta = dadosFreq[i][3];
        let xp = Number(dadosFreq[i][5]) || 0;
        let justificativa = String(dadosFreq[i][6] || "").trim(); // Coluna G

        // Formatação universal de datas
        let dataFormatada = "";
        if (dataBruta instanceof Date) {
          let d = dataBruta.getDate();
          let m = dataBruta.getMonth() + 1;
          let y = dataBruta.getFullYear();
          dataFormatada = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        } else {
          dataFormatada = String(dataBruta).trim();
        }

        // Filtra se o registro é do mês/ano que o professor escolheu
        let partesData = dataFormatada.split('/');
        if (partesData.length === 3) {
          let diaFreq = Number(partesData[0]);
          let mesFreq = Number(partesData[1]);
          let anoFreq = Number(partesData[2]);

          if (mesFreq === Number(mesStr) && anoFreq === Number(anoStr)) {
            // Se o aluno pertence à turma selecionada, é porque teve aula nesse dia!
            if (alunosMap[mat]) {
              diasComAulaSet.add(diaFreq);

              let statusPresenca = "presente";
              // XP 0 ou ter justificativa ou ser criado como FALTA indica falta justificada
              if ((xp === 0 && justificativa !== "") || idCheckin.startsWith("FALTA-")) {
                statusPresenca = "justificada";
              }

              alunosMap[mat].frequencia[diaFreq] = {
                status: statusPresenca,
                justificativa: justificativa,
                idFalta: idCheckin
              };
            }
          }
        }
      }

      let diasComAula = Array.from(diasComAulaSet).sort((a, b) => a - b);

      // 3. Preencher as FALTAS (Quem não tem registro no dia com aula, levou X)
      let alunosArray = Object.values(alunosMap);
      alunosArray.forEach(aluno => {
        diasComAula.forEach(dia => {
          if (!aluno.frequencia[dia]) {
            aluno.frequencia[dia] = { status: "falta" };
          }
        });
      });

      // Ordenar alfabeticamente
      alunosArray.sort((a, b) => a.nome.localeCompare(b.nome));

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso",
        diasComAula: diasComAula,
        alunos: alunosArray
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 20: JUSTIFICAR FALTA DO ALUNO (TUTOR)
    // ==========================================
    if (action === "justificar_falta") {
      const matricula = String(dadosApp.matricula).trim();
      const dataIso = String(dadosApp.data).trim(); // Frontend manda YYYY-MM-DD
      const justificativa = String(dadosApp.justificativa).trim();
      const idFalta = dadosApp.idFalta ? String(dadosApp.idFalta).trim() : null;

      const abaFrequencia = planilha.getSheetByName("frequencia");
      const planBase = planilha.getSheetByName("basededados");

      if (!abaFrequencia) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba frequencia não encontrada." })).setMimeType(ContentService.MimeType.JSON);

      // Converte Data de YYYY-MM-DD para DD/MM/YYYY
      let partesData = dataIso.split('-');
      if (partesData.length !== 3) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Data inválida." })).setMimeType(ContentService.MimeType.JSON);
      let dataBR = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

      let nomeAluno = "Aluno";
      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          if (String(dadosBase[i][2]).trim() === matricula) { nomeAluno = String(dadosBase[i][0]); break; }
        }
      }

      if (idFalta) {
        // Se já existe um ID (ele está a editar uma justificativa antiga)
        const dadosFreq = abaFrequencia.getDataRange().getValues();
        let linhaAtualizar = -1;
        for (let i = 1; i < dadosFreq.length; i++) {
          if (String(dadosFreq[i][0]).trim() === idFalta) { linhaAtualizar = i + 1; break; }
        }

        if (linhaAtualizar > -1) {
          abaFrequencia.getRange(linhaAtualizar, 7).setValue(justificativa); // Coluna G
          abaFrequencia.getRange(linhaAtualizar, 6).setValue(0); // XP = 0
        } else {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Registro não encontrado para edição." })).setMimeType(ContentService.MimeType.JSON);
        }

      } else {
        // Se ele não tinha justificado antes (Nova Justificativa)
        const novoId = "FALTA-" + new Date().getTime();
        // Colunas: [id, mat, nome, data, hora, xp, justificativa]
        abaFrequencia.appendRow([novoId, matricula, nomeAluno, dataBR, "00:00:00", 0, justificativa]);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Falta justificada com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 21: MINHA FREQUÊNCIA (PORTAL DO ALUNO)
    // ==========================================
    if (action === "minha_frequencia") {
      const matricula = String(dadosApp.matricula).trim();
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaFrequencia = planilha.getSheetByName("frequencia");

      if (!abaTrilha || !planBase || !abaFrequencia) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      // 1. Achar a turma do aluno
      let minhaTurma = "";
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        if (String(dadosTrilha[i][0]).trim() === matricula) { minhaTurma = String(dadosTrilha[i][1]).trim(); break; }
      }

      // 2. Mapear colegas para descobrir dias que tiveram aula
      let alunosDaTurma = new Set();
      for (let i = 1; i < dadosTrilha.length; i++) {
        if (String(dadosTrilha[i][1]).trim() === minhaTurma && String(dadosTrilha[i][3]).trim().toLowerCase() !== "desclassificado") {
          alunosDaTurma.add(String(dadosTrilha[i][0]).trim());
        }
      }

      // 3. Varrendo a frequência
      let diasComAulaSet = new Set();
      let meusRegistrosMap = {};
      const dadosFreq = abaFrequencia.getDataRange().getValues();

      for (let i = 1; i < dadosFreq.length; i++) {
        let idCheckin = String(dadosFreq[i][0]).trim();
        let mat = String(dadosFreq[i][1]).trim();
        let dataStr = String(dadosFreq[i][3]).trim();
        let xp = Number(dadosFreq[i][5]) || 0;
        let justificativa = String(dadosFreq[i][6] || "").trim();

        let dataFormatada = dataStr;
        if (dadosFreq[i][3] instanceof Date) {
          let d = dadosFreq[i][3].getDate(); let m = dadosFreq[i][3].getMonth() + 1; let y = dadosFreq[i][3].getFullYear();
          dataFormatada = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }

        if (alunosDaTurma.has(mat) && !idCheckin.startsWith("BDAY")) diasComAulaSet.add(dataFormatada);

        if (mat === matricula) {
           let status = "presente";
           if ((xp === 0 && justificativa !== "") || idCheckin.startsWith("FALTA-")) status = "justificada";
           meusRegistrosMap[dataFormatada] = status;
        }
      }

      // 4. Montar o relatório
      let relatorio = []; let totalAulas = 0; let totalPresencas = 0; let totalFaltas = 0;
      let diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
         let pA = String(a).split('/'); let pB = String(b).split('/');
         return new Date(pA[2], pA[1]-1, pA[0]).getTime() - new Date(pB[2], pB[1]-1, pB[0]).getTime();
      });

      diasOrdenados.forEach(dia => {
         totalAulas++;
         let status = meusRegistrosMap[dia] || "falta";
         if (status === "presente" || status === "justificada") totalPresencas++; else totalFaltas++;
         relatorio.push({ data: dia, status: status });
      });

      let taxa = totalAulas === 0 ? 100 : Math.round((totalPresencas / totalAulas) * 100);

      // Gatilhos Emocionais e Avisos
      let mensagem = "";
      if (taxa >= 90) mensagem = "🌟 Sensacional! Você é um exemplo de dedicação. Continue assim e o topo do ranking será seu!";
      else if (taxa >= 75) mensagem = "👍 Muito bom! Sua presença garante seu aprendizado, mas cuidado para não faltar nos próximos dias.";
      else if (taxa >= 60) mensagem = "⚠️ Atenção! Você está no limite. Faltar muito vai te deixar para trás nos conteúdos e na pontuação.";
      else mensagem = "🚨 ALERTA VERMELHO! Sua taxa de faltas está altíssima. Você corre sério risco de perder a sua vaga. Procure o Tutor urgente!";

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", taxa: taxa, totalAulas: totalAulas, totalPresencas: totalPresencas, totalFaltas: totalFaltas, mensagem: mensagem, historico: relatorio.reverse() })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 22: VERIFICAR ANIVERSÁRIO E RESGATAR
    // ==========================================
    if (action === "checar_aniversario") {
      const matricula = String(dadosApp.matricula).trim();
      const planBase = planilha.getSheetByName("basededados");
      const abaEntregas = planilha.getSheetByName("entregas");

      if (!planBase || !abaEntregas) return ContentService.createTextOutput(JSON.stringify({ status: "erro" })).setMimeType(ContentService.MimeType.JSON);

      const timezone = Session.getScriptTimeZone();
      const dataHoje = new Date();
      const diaHoje = Utilities.formatDate(dataHoje, timezone, "dd");
      const mesHoje = Utilities.formatDate(dataHoje, timezone, "MM");
      const anoHoje = Utilities.formatDate(dataHoje, timezone, "yyyy");

      let isAniversario = false;
      const dadosBase = planBase.getDataRange().getValues();
       for (let i = 1; i < dadosBase.length; i++) {
        if (String(dadosBase[i][2]).trim() === matricula) {
          let celulaDataNasc = dadosBase[i][1];
          let diaNasc = "";
          let mesNasc = "";

          // 1. Se o Google Sheets leu a célula como um Objeto de Data
          if (celulaDataNasc instanceof Date) {
            diaNasc = Utilities.formatDate(celulaDataNasc, timezone, "dd");
            mesNasc = Utilities.formatDate(celulaDataNasc, timezone, "MM");
          }
          // 2. Se o Google Sheets leu como um simples Texto (String) "10/04/1997" ou "10/4/1997"
          else {
            let partesNasc = String(celulaDataNasc).trim().split("/");
            if (partesNasc.length === 3) {
              diaNasc = partesNasc[0].padStart(2, '0'); // Garante que "4" vire "04"
              mesNasc = partesNasc[1].padStart(2, '0');
            }
          }

          // Confere se o dia e o mês batem com a data de hoje!
          if (diaNasc === diaHoje && mesNasc === mesHoje) {
            isAniversario = true;
          }
          break;
        }
      }

      let jaResgatado = false;
      const idNiver = "BDAY-" + anoHoje + "-" + matricula;
      const dadosEntregas = abaEntregas.getDataRange().getValues();
      for (let i = 1; i < dadosEntregas.length; i++) {
        if (String(dadosEntregas[i][0]).trim() === idNiver) { jaResgatado = true; break; }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", isAniversario: isAniversario, jaResgatado: jaResgatado })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "resgatar_aniversario") {
      const matricula = String(dadosApp.matricula).trim();
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaTrilha = planilha.getSheetByName("trilhatech");

      const timezone = Session.getScriptTimeZone();
      const anoHoje = Utilities.formatDate(new Date(), timezone, "yyyy");
      const timestampAtual = new Date().getTime();
      const idNiver = "BDAY-" + anoHoje + "-" + matricula;

      // Proteção anti-fraude (só pega uma vez no ano)
      const dadosEntregas = abaEntregas.getDataRange().getValues();
      for (let i = 1; i < dadosEntregas.length; i++) {
        if (String(dadosEntregas[i][0]).trim() === idNiver) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Presente já resgatado!" })).setMimeType(ContentService.MimeType.JSON);
      }

      // Entrega o presente
      abaEntregas.appendRow([idNiver, matricula, "PRESENTE-ANIVERSARIO", "Feliz Aniversário!", "Avaliado", 100, timestampAtual]);

      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for(let t = 1; t < dadosTrilha.length; t++) {
         if(String(dadosTrilha[t][0]).trim() === matricula) {
            let xpAtual = Number(dadosTrilha[t][4]) || 0;
            abaTrilha.getRange(t+1, 5).setValue(xpAtual + 100);
            break;
         }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 23: BUSCAR ANIVERSARIANTES DO DIA
    // ==========================================
    if (action === "buscar_aniversariantes_dia") {
      const planBase = planilha.getSheetByName("basededados");

      if (!planBase) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba não encontrada" })).setMimeType(ContentService.MimeType.JSON);
      }

      const dadosBase = planBase.getDataRange().getValues();
      const hoje = new Date();

      // Formata o dia e mês de hoje para "DD/MM" (ex: 15/04)
      const diaHoje = String(hoje.getDate()).padStart(2, '0');
      const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0');
      const dataBuscada = `${diaHoje}/${mesHoje}`;

      let listaAniversariantes = [];

      for (let i = 1; i < dadosBase.length; i++) {
        let nomeCompleto = String(dadosBase[i][0]).trim();
        let dataBruta = dadosBase[i][1]; // Data crua vinda da planilha
        let turmaEscola = String(dadosBase[i][4]).trim();

        let dataFormatada = "";

        // Se a célula do Sheets for um objeto de Data nativo:
        if (dataBruta instanceof Date) {
          let d = String(dataBruta.getDate()).padStart(2, '0');
          let m = String(dataBruta.getMonth() + 1).padStart(2, '0');
          dataFormatada = `${d}/${m}`;
        } else {
          // Se for apenas um texto digitado pelo usuário (Ex: "15/04/2006")
          let str = String(dataBruta).trim();
          dataFormatada = str.substring(0, 5); // Corta para pegar só "15/04"
        }

        // Agora a comparação será justa! (Ex: "15/04" === "15/04")
        if (dataFormatada === dataBuscada && nomeCompleto) {
          listaAniversariantes.push({
            nome: nomeCompleto.split(" ")[0], // Apenas o primeiro nome
            turma: turmaEscola
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso",
        aniversariantes: listaAniversariantes
      })).setMimeType(ContentService.MimeType.JSON);
    }


    // ==========================================
    // ROTA 24: RECUPERAR MATRÍCULA (PORTAL DO ALUNO)
    // ==========================================
    if (action === "recuperar_matricula") {
      const nomeDigitado = String(dadosApp.nome || "").trim();
      const dataNascDigitada = String(dadosApp.dataNasc || "").trim(); // O Front envia DD/MM/YYYY

      const planBase = planilha.getSheetByName("basededados");
      if (!planBase) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Base de dados não encontrada." })).setMimeType(ContentService.MimeType.JSON);

      // Função Mágica: Remove acentos, cedilhas, espaços duplos e coloca tudo em minúsculo
      const normalizar = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
      const nomeBusca = normalizar(nomeDigitado);

      const dadosBase = planBase.getDataRange().getValues();

      for (let i = 1; i < dadosBase.length; i++) {
        let nomeBanco = normalizar(String(dadosBase[i][0]).trim());
        let dataBruta = dadosBase[i][1];
        let matricula = String(dadosBase[i][2]).trim();

        // Formatação universal de data para evitar conflitos de fuso horário do Google Sheets
        let dataBancoFormatada = String(dataBruta).trim();
        if (dataBruta instanceof Date) {
          let d = String(dataBruta.getDate()).padStart(2, '0');
          let m = String(dataBruta.getMonth() + 1).padStart(2, '0');
          let y = String(dataBruta.getFullYear());
          dataBancoFormatada = `${d}/${m}/${y}`;
        } else if (dataBancoFormatada.includes("T")) {
          let partes = dataBancoFormatada.split("T")[0].split("-");
          if (partes.length === 3) dataBancoFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        // Match perfeito: Nome e Data conferem
        if (nomeBanco === nomeBusca && dataBancoFormatada === dataNascDigitada) {
           return ContentService.createTextOutput(JSON.stringify({
             status: "sucesso",
             matricula: matricula,
             nomeReal: String(dadosBase[i][0]).trim()
           })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "erro",
        mensagem: "Aluno não encontrado. Verifique se digitou o Nome Completo exatamente igual ao da escola e a Data de Nascimento correta."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTAS 25: INTEGRAÇÃO WHATSAPP
    // ==========================================

    // ROTA: Salvar os Links (Tutor)
    if (action === "salvar_links_whatsapp") {
      let abaConfig = planilha.getSheetByName("configuracoes");
      // Cria a aba de configurações sozinha se não existir
      if (!abaConfig) { abaConfig = planilha.insertSheet("configuracoes"); abaConfig.appendRow(["Chave", "Valor"]); }

      const link1 = String(dadosApp.link1Ano || "").trim();
      const link2 = String(dadosApp.link2Ano || "").trim();

      const salvarOuAtualizar = (chave, valor) => {
        let dados = abaConfig.getDataRange().getValues();
        for (let i = 1; i < dados.length; i++) {
          if (dados[i][0] === chave) { abaConfig.getRange(i + 1, 2).setValue(valor); return; }
        }
        abaConfig.appendRow([chave, valor]);
      };

      salvarOuAtualizar("WHATSAPP_1ANO", link1);
      salvarOuAtualizar("WHATSAPP_2ANO", link2);

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ROTA: Buscar Links para o Painel do Tutor
    if (action === "buscar_links_whatsapp") {
      let abaConfig = planilha.getSheetByName("configuracoes");
      let link1 = "", link2 = "";
      if (abaConfig) {
        let dadosConf = abaConfig.getDataRange().getValues();
        for(let i=1; i<dadosConf.length; i++){
          if(dadosConf[i][0] === "WHATSAPP_1ANO") link1 = dadosConf[i][1];
          if(dadosConf[i][0] === "WHATSAPP_2ANO") link2 = dadosConf[i][1];
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", link1Ano: link1, link2Ano: link2 })).setMimeType(ContentService.MimeType.JSON);
    }

    // ROTA: Verificar status do Aluno no Portal
    if (action === "status_whatsapp_aluno") {
      const matricula = String(dadosApp.matricula).trim();
      let abaConfig = planilha.getSheetByName("configuracoes");
      let link1 = "", link2 = "";
      if (abaConfig) {
        let dadosConf = abaConfig.getDataRange().getValues();
        for(let i=1; i<dadosConf.length; i++) {
          if(dadosConf[i][0] === "WHATSAPP_1ANO") link1 = dadosConf[i][1];
          if(dadosConf[i][0] === "WHATSAPP_2ANO") link2 = dadosConf[i][1];
        }
      }

      let abaTrilha = planilha.getSheetByName("trilhatech");
      let confirmado = false; let linkDestino = "";
      if (abaTrilha) {
        let dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matricula) {
            let turma = String(dadosTrilha[i][1]).trim();
            confirmado = String(dadosTrilha[i][6]).trim() === "SIM"; // Coluna G
            linkDestino = turma.includes("1º") ? link1 : link2;
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", confirmado: confirmado, link: linkDestino })).setMimeType(ContentService.MimeType.JSON);
    }

    // ROTA: Aluno clica em "Já entrei no grupo"
    if (action === "confirmar_whatsapp") {
      const matricula = String(dadosApp.matricula).trim();
      let abaTrilha = planilha.getSheetByName("trilhatech");
      if (abaTrilha) {
        let dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matricula) {
            abaTrilha.getRange(i + 1, 7).setValue("SIM"); // Grava SIM na Coluna G
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTAS 27: DO PIX DE XP (P2P)
    // ==========================================

    // 1. INICIAR PIX (Carrega colegas, limite e status da senha)
    if (action === "iniciar_pix") {
      const matricula = String(dadosApp.matricula).trim();
      let abaTrilha = planilha.getSheetByName("trilhatech");
      let planBase = planilha.getSheetByName("basededados");
      let abaConfig = planilha.getSheetByName("configuracoes");
      let abaEntregas = planilha.getSheetByName("entregas");

      // Cria aba configurações se não existir
      if (!abaConfig) { abaConfig = planilha.insertSheet("configuracoes"); abaConfig.appendRow(["Chave", "Valor"]); }

      let limiteDiario = 50;
      let dadosConf = abaConfig.getDataRange().getValues();
      let temConfig = false;
      for(let i=1; i<dadosConf.length; i++) {
         if(dadosConf[i][0] === "LIMITE_PIX_DIARIO") { limiteDiario = Number(dadosConf[i][1]) || 50; temConfig = true; break; }
      }
      if(!temConfig) abaConfig.appendRow(["LIMITE_PIX_DIARIO", 50]);

      let minhaTurma = ""; let temSenhaPix = false; let meuXpTotal = 0;
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for(let i=1; i<dadosTrilha.length; i++) {
         if(String(dadosTrilha[i][0]).trim() === matricula) {
            minhaTurma = String(dadosTrilha[i][1]).trim();
            meuXpTotal = Number(dadosTrilha[i][4]) || 0;
            temSenhaPix = String(dadosTrilha[i][7] || "").trim().length >= 4; // Coluna H
            break;
         }
      }

      let nomesMap = {};
      const dadosBase = planBase.getDataRange().getValues();
      for(let i=1; i<dadosBase.length; i++) nomesMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]);

      let colegas = [];
      for(let i=1; i<dadosTrilha.length; i++) {
         let mat = String(dadosTrilha[i][0]).trim();
         let t = String(dadosTrilha[i][1]).trim();
         let status = String(dadosTrilha[i][3]).trim().toLowerCase();
         if(t === minhaTurma && mat !== matricula && status !== "desclassificado") {
            colegas.push({ matricula: mat, nome: nomesMap[mat] || "Aluno "+mat });
         }
      }
      colegas.sort((a,b) => a.nome.localeCompare(b.nome));

      // Calcula quanto o aluno já doou hoje
      let xpDoadoHoje = 0;
      const timezone = Session.getScriptTimeZone();
      const hojeStr = Utilities.formatDate(new Date(), timezone, "yyyyMMdd");
      const prefixoHoje = "PIX-" + hojeStr;

      const dadosEntregas = abaEntregas.getDataRange().getValues();
      for(let i=1; i<dadosEntregas.length; i++) {
         let id = String(dadosEntregas[i][0]).trim();
         let matRow = String(dadosEntregas[i][1]).trim();
         if(matRow === matricula && id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) {
            xpDoadoHoje += Math.abs(Number(dadosEntregas[i][5]) || 0);
         }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso", colegas: colegas, limiteDiario: limiteDiario, xpDoadoHoje: xpDoadoHoje, temSenhaPix: temSenhaPix, meuXpTotal: meuXpTotal
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. CRIAR SENHA PIX (Apenas a primeira vez ou se o Tutor apagar)
    if (action === "criar_senha_pix") {
      const matricula = String(dadosApp.matricula).trim();
      const senha = String(dadosApp.senha).trim();
      let abaTrilha = planilha.getSheetByName("trilhatech");
      let dadosTrilha = abaTrilha.getDataRange().getValues();

      for(let i=1; i<dadosTrilha.length; i++) {
         if(String(dadosTrilha[i][0]).trim() === matricula) {
            abaTrilha.getRange(i+1, 8).setValue(senha); // Grava na Coluna H
            return ContentService.createTextOutput(JSON.stringify({status: "sucesso"})).setMimeType(ContentService.MimeType.JSON);
         }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Aluno não encontrado."})).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. TRANSFERIR XP (Com segurança e recibos)
    if (action === "transferir_xp") {
      const matriculaOrigem = String(dadosApp.matriculaOrigem).trim();
      const senhaDigitada = String(dadosApp.senha).trim();
      const matriculaDestino = String(dadosApp.matriculaDestino).trim();
      const quantidade = Number(dadosApp.quantidade);
      const motivo = String(dadosApp.motivo).trim();

      if(quantidade <= 0) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Quantidade inválida."})).setMimeType(ContentService.MimeType.JSON);

      let abaTrilha = planilha.getSheetByName("trilhatech");
      let abaEntregas = planilha.getSheetByName("entregas");
      let abaConfig = planilha.getSheetByName("configuracoes");

      let limiteDiario = 50;
      if (abaConfig) {
         let dadosConf = abaConfig.getDataRange().getValues();
         for(let i=1; i<dadosConf.length; i++) { if(dadosConf[i][0] === "LIMITE_PIX_DIARIO") limiteDiario = Number(dadosConf[i][1]) || 50; }
      }

      let linhaOrigem = -1, linhaDestino = -1, xpOrigem = 0, xpDestino = 0, senhaReal = "";
      let dadosTrilha = abaTrilha.getDataRange().getValues();
      for(let i=1; i<dadosTrilha.length; i++) {
         let mat = String(dadosTrilha[i][0]).trim();
         if(mat === matriculaOrigem) { linhaOrigem = i+1; xpOrigem = Number(dadosTrilha[i][4]) || 0; senhaReal = String(dadosTrilha[i][7] || "").trim(); }
         if(mat === matriculaDestino) { linhaDestino = i+1; xpDestino = Number(dadosTrilha[i][4]) || 0; }
      }

      if (linhaOrigem === -1 || linhaDestino === -1) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Contas não encontradas."})).setMimeType(ContentService.MimeType.JSON);
      if (senhaDigitada !== senhaReal) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Senha PIN incorreta."})).setMimeType(ContentService.MimeType.JSON);
      if (xpOrigem < quantidade) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Você não tem XP suficiente."})).setMimeType(ContentService.MimeType.JSON);

      // Bloqueio do Limite Diário
      let xpDoadoHoje = 0;
      const timezone = Session.getScriptTimeZone();
      const hojeStr = Utilities.formatDate(new Date(), timezone, "yyyyMMdd");
      const prefixoHoje = "PIX-" + hojeStr;
      const dadosEntregas = abaEntregas.getDataRange().getValues();

      for(let i=1; i<dadosEntregas.length; i++) {
         let id = String(dadosEntregas[i][0]).trim();
         let matRow = String(dadosEntregas[i][1]).trim();
         if(matRow === matriculaOrigem && id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) {
            xpDoadoHoje += Math.abs(Number(dadosEntregas[i][5]) || 0);
         }
      }

      if (xpDoadoHoje + quantidade > limiteDiario) {
         return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: `Limite excedido! Você só pode doar mais ${limiteDiario - xpDoadoHoje} XP hoje.`})).setMimeType(ContentService.MimeType.JSON);
      }

      // Desconta de um, Paga ao outro
      abaTrilha.getRange(linhaOrigem, 5).setValue(xpOrigem - quantidade);
      abaTrilha.getRange(linhaDestino, 5).setValue(xpDestino + quantidade);

      // Gera os "Recibos" na aba entregas para que os Rankings reflitam na hora
      let timestamp = new Date().getTime();
      let idBase = prefixoHoje + "-" + timestamp;
      abaEntregas.appendRow([idBase + "-ENVIOU", matriculaOrigem, "PIX-XP", `Enviou para ${matriculaDestino}: ${motivo}`, "Avaliado", -quantidade, timestamp]);
      abaEntregas.appendRow([idBase + "-RECEBEU", matriculaDestino, "PIX-XP", `Recebeu de ${matriculaOrigem}: ${motivo}`, "Avaliado", quantidade, timestamp]);

      return ContentService.createTextOutput(JSON.stringify({status: "sucesso"})).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 28: CARREGAR PORTAL DO ALUNO (SUPER ROTA DE PERFORMANCE + ESTATÍSTICAS)
    // ==========================================
    if (action === "carregar_portal_aluno") {
      const matricula = String(dadosApp.matricula).trim();

      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaAtividades = planilha.getSheetByName("atividades");
      const abaConfig = planilha.getSheetByName("configuracoes");
      const abaFrequencia = planilha.getSheetByName("frequencia"); // NOVA ABA ADICIONADA

      let dadosRetorno = {
        status: "sucesso",
        xpTotal: 0,
        nivel: "Iniciante",
        whatsapp: { confirmado: true, link: "" },
        aniversario: { isAniversario: false, jaResgatado: false },
        atividades: [],
        notificacoes: [],
        // NOVO: ESTATÍSTICAS PARA AS BADGES
        stats: { xpDoado: 0, xpRecebido: 0, totalCheckins: 0 }
      };

      let turmaDoAlunoNoProjeto = "";
      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let t = 1; t < dadosTrilha.length; t++) {
          if (String(dadosTrilha[t][0]).trim() === matricula) {
            turmaDoAlunoNoProjeto = String(dadosTrilha[t][1]).trim();
            dadosRetorno.xpTotal = Number(dadosTrilha[t][4]) || 0;
            dadosRetorno.nivel = String(dadosTrilha[t][5]) || "Iniciante";
            dadosRetorno.whatsapp.confirmado = String(dadosTrilha[t][6]).trim() === "SIM";
            break;
          }
        }
      }

      if (abaConfig) {
        let dadosConf = abaConfig.getDataRange().getValues();
        for(let i = 1; i < dadosConf.length; i++) {
          if(turmaDoAlunoNoProjeto.includes("1º") && dadosConf[i][0] === "WHATSAPP_1ANO") dadosRetorno.whatsapp.link = dadosConf[i][1];
          if(turmaDoAlunoNoProjeto.includes("2º") && dadosConf[i][0] === "WHATSAPP_2ANO") dadosRetorno.whatsapp.link = dadosConf[i][1];
        }
      }

      const timezone = Session.getScriptTimeZone();
      const dataHoje = new Date();
      const diaHoje = Utilities.formatDate(dataHoje, timezone, "dd");
      const mesHoje = Utilities.formatDate(dataHoje, timezone, "MM");
      const anoHoje = Utilities.formatDate(dataHoje, timezone, "yyyy");
      const idNiver = "BDAY-" + anoHoje + "-" + matricula;

      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          if (String(dadosBase[i][2]).trim() === matricula) {
            let celulaDataNasc = dadosBase[i][1];
            let diaNasc = ""; let mesNasc = "";
            if (celulaDataNasc instanceof Date) {
              diaNasc = Utilities.formatDate(celulaDataNasc, timezone, "dd");
              mesNasc = Utilities.formatDate(celulaDataNasc, timezone, "MM");
            } else {
              let partesNasc = String(celulaDataNasc).trim().split("/");
              if (partesNasc.length === 3) { diaNasc = partesNasc[0].padStart(2, '0'); mesNasc = partesNasc[1].padStart(2, '0'); }
            }
            if (diaNasc === diaHoje && mesNasc === mesHoje) dadosRetorno.aniversario.isAniversario = true;
            break;
          }
        }
      }

      let entregasMap = {};
      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          let idEntrega = String(dadosEntregas[i][0]).trim();
          let mat = String(dadosEntregas[i][1]).trim();

          if (mat === matricula) {
            if (!idEntrega.startsWith("BDAY") && !idEntrega.startsWith("PIX")) {
              let idAtividade = String(dadosEntregas[i][2]).trim();
              entregasMap[idAtividade] = {
                resposta: String(dadosEntregas[i][3]).trim(), status: String(dadosEntregas[i][4]).trim() || "Aguardando Correção", xpGanho: dadosEntregas[i][5] || 0
              };
            }
            if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) {
               dadosRetorno.stats.xpRecebido += Number(dadosEntregas[i][5]) || 0; // SOMA XP RECEBIDO
               let timestampEnvio = Number(dadosEntregas[i][6]) || 0;
               dadosRetorno.notificacoes.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: Number(dadosEntregas[i][5]), tempo: timestampEnvio, tipo: "PIX" });
            }
            if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
               dadosRetorno.stats.xpDoado += Math.abs(Number(dadosEntregas[i][5]) || 0); // SOMA XP DOADO
            }
            if (idEntrega === idNiver) dadosRetorno.aniversario.jaResgatado = true;

            // O replace inteligente remove apenas o prefixo e o sufixo, deixando o ID da badge intacto
            if(idEntrega.startsWith("BADGE-")){
              let badgeId = idEntrega.replace("BADGE-", "").replace("-" + matricula, "");
              dadosRetorno.badgesResgatadas.push(badgeId);
            }
          }
        }
      }

      dadosRetorno.notificacoes.sort((a, b) => b.tempo - a.tempo);
      dadosRetorno.notificacoes = dadosRetorno.notificacoes.slice(0, 10);

      // BUSCA O TOTAL DE CHECK-INS (FREQUÊNCIA)
      if (abaFrequencia) {
         const dadosFreq = abaFrequencia.getDataRange().getValues();
         for (let i = 1; i < dadosFreq.length; i++) {
            if (String(dadosFreq[i][1]).trim() === matricula && String(dadosFreq[i][4]).trim() !== "00:00:00") { // Ignora as faltas justificadas (00:00:00)
               dadosRetorno.stats.totalCheckins++;
            }
         }
      }

      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        let hojeTime = new Date(); hojeTime.setHours(0,0,0,0);

        for (let i = 1; i < dadosAtiv.length; i++) {
          let turmaAlvo = String(dadosAtiv[i][5]).trim();
          if (turmaAlvo.toLowerCase() === "todas" || turmaAlvo === turmaDoAlunoNoProjeto) {
            let idAtiv = String(dadosAtiv[i][0]).trim();
            let entregaAluno = entregasMap[idAtiv];
            let dataLimiteBruta = dadosAtiv[i][3];
            let dataLimiteStr = dataLimiteBruta instanceof Date ? Utilities.formatDate(dataLimiteBruta, timezone, "dd/MM/yyyy") : String(dataLimiteBruta);

            let statusPrazo = "No Prazo";
            if (!entregaAluno && dataLimiteStr) {
               let partesData = dataLimiteStr.split('/');
               if (partesData.length === 3) {
                  let dataLim = new Date(Number(partesData[2]), Number(partesData[1])-1, Number(partesData[0]));
                  if (hojeTime > dataLim) statusPrazo = "Atrasada";
               }
            }

            dadosRetorno.atividades.push({
              id: idAtiv, titulo: String(dadosAtiv[i][1]), descricao: String(dadosAtiv[i][2]), dataLimite: dataLimiteStr,
              xp: dadosAtiv[i][4], tipo: String(dadosAtiv[i][6] || "Projeto"),
              opcaoA: String(dadosAtiv[i][7] || ""), opcaoB: String(dadosAtiv[i][8] || ""), opcaoC: String(dadosAtiv[i][9] || ""), opcaoD: String(dadosAtiv[i][10] || ""),
              status: entregaAluno ? entregaAluno.status : "Pendente", respostaEnviada: entregaAluno ? entregaAluno.resposta : "",
              xpGanho: entregaAluno ? entregaAluno.xpGanho : 0, statusPrazo: statusPrazo
            });
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify(dadosRetorno)).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // ROTA 29: RESGATAR RECOMPENSA DE CONQUISTA (BADGE)
    // ==========================================
    if (action === "resgatar_badge") {
      const matricula = String(dadosApp.matricula).trim();
      const badgeId = String(dadosApp.badgeId).trim();
      const xpGanho = Number(dadosApp.xpGanho) || 0;
      const nomeBadge = String(dadosApp.nomeBadge).trim();

      const abaEntregas = planilha.getSheetByName("entregas");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const timestampAtual = new Date().getTime();
      const idUnico = "BADGE-" + badgeId + "-" + matricula;

      if (!abaEntregas || !abaTrilha) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      // Proteção anti-fraude: verifica se já resgatou
      const dadosEntregas = abaEntregas.getDataRange().getValues();
      for (let i = 1; i < dadosEntregas.length; i++) {
        if (String(dadosEntregas[i][0]).trim() === idUnico) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Recompensa já resgatada!" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // 1. Gera o recibo da conquista na aba Entregas
      abaEntregas.appendRow([idUnico, matricula, "CONQUISTA-BADGE", `Desbloqueou: ${nomeBadge}`, "Avaliado", xpGanho, timestampAtual]);

      // 2. Soma o XP na aba TrilhaTech
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for(let t = 1; t < dadosTrilha.length; t++) {
         if(String(dadosTrilha[t][0]).trim() === matricula) {
            let xpAtual = Number(dadosTrilha[t][4]) || 0;
            abaTrilha.getRange(t+1, 5).setValue(xpAtual + xpGanho);
            break;
         }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `+${xpGanho} XP Resgatado!` })).setMimeType(ContentService.MimeType.JSON);
    }

} catch (erro) {
return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: erro.toString() })).setMimeType(ContentService.MimeType.JSON);
}
}
