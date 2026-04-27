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

          if (String(novoStatus).trim().toLocaleLowerCase() === "desistente"){
            abaTrilha.getRange(linha, 5).setValue(0)
          }

          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `Status atualizado para ${novoStatus}!` })).setMimeType(ContentService.MimeType.JSON);
      } else {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Matrícula não encontrada no curso." })).setMimeType(ContentService.MimeType.JSON);
      }
    }

  


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
                respostaCorreta: String(dadosAtiv[i][11] || "A"),
                linkClassroom: String(dadosAtiv[i][12] || ""), // <-- RETORNA PRO TUTOR
                statusPublicacao: String(dadosAtiv[i][13] || "Publicada") // <-- RETORNA PRO TUTOR
              });
            }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", atividades: atividades.reverse() })).setMimeType(ContentService.MimeType.JSON);
    }
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
                respostaCorreta: String(dadosAtiv[i][11] || "A"),
                linkClassroom: String(dadosAtiv[i][12] || ""), // <-- RETORNA PRO TUTOR
                statusPublicacao: String(dadosAtiv[i][13] || "Publicada") // <-- RETORNA PRO TUTOR
              });
            }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", atividades: atividades.reverse() })).setMimeType(ContentService.MimeType.JSON);
    }
  // ==========================================
  // ROTA 6: BUSCAR ATIVIDADES DO ALUNO (CORRIGIDA E LIMPA)
  // ==========================================
    if (action === "buscar_atividades") {
      const matricula = String(dadosApp.matricula).trim();

      const abaAtividades = planilha.getSheetByName("atividades");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaTrilha = planilha.getSheetByName("trilhatech"); 

      let atividades = [];
      let entregasMap = {};

      let turmaDoAlunoNoProjeto = "";
      let xpTotalDoAluno = 0;
      let nivelDoAluno = "Iniciante";

      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let t = 1; t < dadosTrilha.length; t++) {
          if (String(dadosTrilha[t][0]).trim() === matricula) {
            turmaDoAlunoNoProjeto = String(dadosTrilha[t][1]).trim();
            xpTotalDoAluno = Number(dadosTrilha[t][4]) || 0; 
            nivelDoAluno = String(dadosTrilha[t][5]) || "Iniciante"; 
            break;
          }
        }
      }

      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          let mat = String(dadosEntregas[i][1]).trim();
          if (mat === matricula) {
            let idAtividade = String(dadosEntregas[i][2]).trim();
            entregasMap[idAtividade] = {
              resposta: String(dadosEntregas[i][3]).trim(),
              status: String(dadosEntregas[i][4]).trim() || "Aguardando Correção",
              xpGanho: dadosEntregas[i][5] || 0,
              feedback: String(dadosEntregas[i][7] || "").trim() 
            };
          }
        }
      }

      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        for (let i = 1; i < dadosAtiv.length; i++) {
          
          // --- MÁGICA 1: OCULTA OS RASCUNHOS ---
          let statusPublicacao = String(dadosAtiv[i][13] || "Publicada").trim();
          if (statusPublicacao !== "Publicada") continue;

          let turmaAlvo = String(dadosAtiv[i][5]).trim();

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
              statusPrazo: statusPrazo,
              feedback: entregaAluno ? entregaAluno.feedback : "",
              linkClassroom: String(dadosAtiv[i][12] || "") // <-- ENVIA O LINK CLASSROOM
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
          const idAtividadeEdit = dadosApp.idAtividadeEdit; 
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
          
          // --- NOVOS CAMPOS ---
          const linkClassroom = String(dadosApp.linkClassroom || "").trim(); 
          const statusPublicacao = String(dadosApp.statusPublicacao || "Publicada").trim(); 

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
              abaAtividades.getRange(linhaEdit, 13).setValue(linkClassroom); // Coluna M
              abaAtividades.getRange(linhaEdit, 14).setValue(statusPublicacao); // Coluna N
              return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão atualizada!" })).setMimeType(ContentService.MimeType.JSON);
            }
          } else {
            // MODO CRIAÇÃO
            const ultimaLinha = abaAtividades.getLastRow();
            const numeroId = ultimaLinha.toString().padStart(3, '0');
            const idGerado = "ATIV-" + numeroId;
            abaAtividades.appendRow([idGerado, titulo, descricao, dataLimite, xp, turmaAlvo, tipo, opcaoA, opcaoB, opcaoC, opcaoD, respostaCorreta, linkClassroom, statusPublicacao]);
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
                respostaCorreta: String(dadosAtiv[i][11] || "A"),
                linkClassroom: String(dadosAtiv[i][12] || ""), // <-- RETORNA PRO TUTOR
                statusPublicacao: String(dadosAtiv[i][13] || "Publicada") // <-- RETORNA PRO TUTOR
              });
            }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", atividades: atividades.reverse() })).setMimeType(ContentService.MimeType.JSON);
    }  
  // ==========================================
  // ROTA 9: ENVIAR ATIVIDADE (Com Auto-Desconto de Atraso)
  // ==========================================
    if (action === "enviar_atividade") {
      const matricula = String(dadosApp.matricula).trim();
      const idAtividade = String(dadosApp.idAtividade).trim();
      const resposta = String(dadosApp.resposta).trim();
      const timestampAtual = new Date().getTime();

      const abaEntregas = planilha.getSheetByName("entregas");
      const abaAtividades = planilha.getSheetByName("atividades") || planilha.getSheetByName("basededados"); 
      const abaTrilha = planilha.getSheetByName("trilhatech");

      if (!abaEntregas) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba entregas não encontrada." })).setMimeType(ContentService.MimeType.JSON);

      // 1. Busca os detalhes da Missão e Traduz a Data
      let ativTipo = "Projeto";
      let ativXp = 0;
      let ativRespostaCorreta = "";
      let dataLimObj = null; // <- NOVO TRADUTOR DE DATA
      
      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        for (let i = 1; i < dadosAtiv.length; i++) {
          if (String(dadosAtiv[i][0]).trim() === idAtividade) {
            ativXp = Number(dadosAtiv[i][4]) || 0;
            ativTipo = String(dadosAtiv[i][6]).trim();
            ativRespostaCorreta = String(dadosAtiv[i][11]).trim(); 
            
            let rawDate = dadosAtiv[i][3];
            if (rawDate instanceof Date) {
                dataLimObj = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
            } else if (typeof rawDate === "string") {
                let strDate = rawDate.trim();
                if (strDate.includes("-")) {
                    let p = strDate.split("-");
                    if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
                } else if (strDate.includes("/")) {
                    let p = strDate.split("/");
                    if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                }
            }
            if (dataLimObj) dataLimObj.setHours(0,0,0,0);
            break;
          }
        }
      }

      // 2. NOVO CÁLCULO DE ATRASO (Agora funciona sempre)
      let atrasoDias = 0;
      if (dataLimObj) {
        let hoje = new Date();
        hoje.setHours(0,0,0,0);
        if (hoje > dataLimObj) {
            let diffTime = Math.abs(hoje - dataLimObj);
            atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // 3. Auto-Correção para Quizzes com Desconto Automático
      let statusFinal = "Aguardando Correção";
      let xpGanhoFinal = 0;
      let msgDesconto = "";

      if (ativTipo === "Quiz") {
        statusFinal = "Avaliado";
        if (resposta === ativRespostaCorreta) {
            let desconto = 0;
            if (atrasoDias > 0) {
              let teto = Math.floor(ativXp / 2); // O teto máximo de desconto é metade do XP
              desconto = atrasoDias; // 1 XP perdido por dia de atraso
              if (desconto > teto) desconto = teto;
              msgDesconto = ` (Desconto de -${desconto} XP pelo atraso de ${atrasoDias} dias)`;
            }
            xpGanhoFinal = ativXp - desconto;
            
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

      let msgRetorno = (ativTipo === "Quiz" && xpGanhoFinal > 0) ? "Resposta correta! XP adicionado." + msgDesconto : (ativTipo === "Quiz" && xpGanhoFinal === 0) ? "Resposta errada. Mas o Tutor pode rever depois!" : "Missão enviada com sucesso!";

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

        let alunosMap = {}; 
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
                xpGanho: dadosEntregas[i][5] || 0,
                feedback: String(dadosEntregas[i][7] || "") // <--- NOVO: LÊ A COLUNA H
              });
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", entregas: entregas })).setMimeType(ContentService.MimeType.JSON);
      }

      if (action === "avaliar_entrega") {
        const idEntrega = String(dadosApp.idEntrega).trim();
        const matricula = String(dadosApp.matricula).trim();
        let xpGanhoTutor = Number(dadosApp.xpGanho) || 0;
        const novoStatus = dadosApp.novoStatus || "Avaliado"; // Pode ser "Avaliado" ou "Devolvida"
        const feedbackTutor = String(dadosApp.feedback || "").trim(); // <--- NOVO: RECEBE O FEEDBACK

        // Se for devolvida, o XP tem que ser 0 obrigatoriamente
        if (novoStatus === "Devolvida") xpGanhoTutor = 0;

        const abaEntregas = planilha.getSheetByName("entregas");
        const abaAtividades = planilha.getSheetByName("atividades");
        let xpAnterior = 0;
        let linhaEntrega = -1;
        let idAtiv = "";
        let dataEnvioTime = 0;

        if (abaEntregas) {
          const dadosEntregas = abaEntregas.getDataRange().getValues();
          for (let i = 1; i < dadosEntregas.length; i++) {
            if (String(dadosEntregas[i][0]).trim() === idEntrega) {
              linhaEntrega = i + 1;
              idAtiv = String(dadosEntregas[i][2]).trim();
              xpAnterior = Number(dadosEntregas[i][5]) || 0;
              dataEnvioTime = Number(dadosEntregas[i][6]) || new Date().getTime();
              break;
            }
          }
        }

        let atrasoDias = 0;
        if (abaAtividades && idAtiv) {
            const dadosAtiv = abaAtividades.getDataRange().getValues();
            for (let i = 1; i < dadosAtiv.length; i++) {
                if (String(dadosAtiv[i][0]).trim() === idAtiv) {
                    let dataLimObj = null;
                    let rawDate = dadosAtiv[i][3];
                    if (rawDate instanceof Date) {
                        dataLimObj = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
                    } else if (typeof rawDate === "string") {
                        let strDate = rawDate.trim();
                        if (strDate.includes("-")) {
                            let p = strDate.split("-");
                            if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
                        } else if (strDate.includes("/")) {
                            let p = strDate.split("/");
                            if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                        }
                    }
                    if (dataLimObj) {
                        dataLimObj.setHours(0,0,0,0);
                        let dataEnvio = new Date(dataEnvioTime);
                        dataEnvio.setHours(0,0,0,0);
                        if (dataEnvio > dataLimObj) {
                            let diffTime = Math.abs(dataEnvio - dataLimObj);
                            atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }
                    }
                    break;
                }
            }
        }

        let xpGanhoFinal = xpGanhoTutor;
        let msgDesconto = "";
        if (atrasoDias > 0 && xpGanhoTutor > 0) {
            let teto = Math.floor(xpGanhoTutor / 2);
            let desconto = atrasoDias; 
            if (desconto > teto) desconto = teto;
            xpGanhoFinal = xpGanhoTutor - desconto;
            if (desconto > 0) msgDesconto = ` (Desconto automático de -${desconto} XP pelo atraso)`;
        }

        if (linhaEntrega > -1) {
          abaEntregas.getRange(linhaEntrega, 5).setValue(novoStatus);
          abaEntregas.getRange(linhaEntrega, 6).setValue(xpGanhoFinal);
          abaEntregas.getRange(linhaEntrega, 8).setValue(feedbackTutor); // SALVA O FEEDBACK

          // GERA A NOTIFICAÇÃO NO SININHO DO ALUNO
          let timestampAtual = new Date().getTime();
          let msgNotif = novoStatus === "Devolvida" 
            ? `⚠️ Sua missão foi devolvida! Verifique o feedback do tutor.` 
            : `⭐ Sua missão foi aprovada!`;
          let tipoNotif = novoStatus === "Devolvida" ? "DEVOLVIDA" : "AVALIADA";
          
          abaEntregas.appendRow([`NOTIF-${timestampAtual}`, matricula, "SISTEMA", msgNotif, tipoNotif, xpGanhoFinal, timestampAtual]);
      }

        const abaTrilha = planilha.getSheetByName("trilhatech");
        if (abaTrilha) {
          const dadosTrilha = abaTrilha.getDataRange().getValues();
          for (let i = 1; i < dadosTrilha.length; i++) {
            if (String(dadosTrilha[i][0]).trim() === matricula) {
              let xpTotalAtual = Number(dadosTrilha[i][4]) || 0;
              // Se foi devolvida, xpGanhoFinal é 0. Vai subtrair o xpAnterior que ele tinha ganho (se for uma re-avaliação)
              let novoXpTotal = xpTotalAtual - xpAnterior + xpGanhoFinal;
              abaTrilha.getRange(i + 1, 5).setValue(novoXpTotal);
              break;
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: (novoStatus === "Devolvida" ? "Missão devolvida para refazer!" : "Avaliação salva!") + msgDesconto })).setMimeType(ContentService.MimeType.JSON);
      }
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
        let xpGanhoTutor = Number(dadosApp.xpGanho) || 0;
        const novoStatus = dadosApp.novoStatus || "Avaliado";

        const abaEntregas = planilha.getSheetByName("entregas");
        const abaAtividades = planilha.getSheetByName("atividades");
        let xpAnterior = 0;
        let linhaEntrega = -1;
        let idAtiv = "";
        let dataEnvioTime = 0;

        if (abaEntregas) {
          const dadosEntregas = abaEntregas.getDataRange().getValues();
          for (let i = 1; i < dadosEntregas.length; i++) {
            if (String(dadosEntregas[i][0]).trim() === idEntrega) {
              linhaEntrega = i + 1;
              idAtiv = String(dadosEntregas[i][2]).trim();
              xpAnterior = Number(dadosEntregas[i][5]) || 0;
              dataEnvioTime = Number(dadosEntregas[i][6]) || new Date().getTime();
              break;
            }
          }
        }

        // NOVO CÁLCULO DE DESCONTO POR ATRASO PARA CORREÇÃO MANUAL (BLINDADO)
        let atrasoDias = 0;
        if (abaAtividades && idAtiv) {
            const dadosAtiv = abaAtividades.getDataRange().getValues();
            for (let i = 1; i < dadosAtiv.length; i++) {
                if (String(dadosAtiv[i][0]).trim() === idAtiv) {
                    let dataLimObj = null;
                    let rawDate = dadosAtiv[i][3];
                    
                    // Tradutor Universal de Data
                    if (rawDate instanceof Date) {
                        dataLimObj = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
                    } else if (typeof rawDate === "string") {
                        let strDate = rawDate.trim();
                        if (strDate.includes("-")) {
                            let p = strDate.split("-");
                            if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
                        } else if (strDate.includes("/")) {
                            let p = strDate.split("/");
                            if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                        }
                    }
                    
                    if (dataLimObj) {
                        dataLimObj.setHours(0,0,0,0);
                        let dataEnvio = new Date(dataEnvioTime);
                        dataEnvio.setHours(0,0,0,0);
                        
                        // Verifica se entregou atrasado
                        if (dataEnvio > dataLimObj) {
                            let diffTime = Math.abs(dataEnvio - dataLimObj);
                            atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }
                    }
                    break;
                }
            }
        }

        let xpGanhoFinal = xpGanhoTutor;
        let msgDesconto = "";
        if (atrasoDias > 0 && xpGanhoTutor > 0) {
            let teto = Math.floor(xpGanhoTutor / 2);
            let desconto = atrasoDias; // 1 XP perdido por dia de atraso
            if (desconto > teto) desconto = teto;
            xpGanhoFinal = xpGanhoTutor - desconto;
            if (desconto > 0) msgDesconto = ` (Desconto automático de -${desconto} XP aplicado pelo atraso de ${atrasoDias} dias)`;
        }

        if (linhaEntrega > -1) {
            abaEntregas.getRange(linhaEntrega, 5).setValue(novoStatus); 
            abaEntregas.getRange(linhaEntrega, 6).setValue(xpGanhoFinal); 
        }

        // Adiciona o XP na aba TrilhaTech (Cobrindo as diferenças)
        const abaTrilha = planilha.getSheetByName("trilhatech");
        if (abaTrilha) {
          const dadosTrilha = abaTrilha.getDataRange().getValues();
          for (let i = 1; i < dadosTrilha.length; i++) {
            if (String(dadosTrilha[i][0]).trim() === matricula) {
              let xpTotalAtual = Number(dadosTrilha[i][4]) || 0; 
              let novoXpTotal = xpTotalAtual - xpAnterior + xpGanhoFinal;
              abaTrilha.getRange(i + 1, 5).setValue(novoXpTotal); 
              break;
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Avaliação salva!" + msgDesconto })).setMimeType(ContentService.MimeType.JSON);
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
  // ROTA 14: FAZER CHECK-IN DE PRESENÇA (Com Senha e Ofensiva 🔥)
  // ==========================================
    if (action === "fazer_checkin") {
      const matricula = String(dadosApp.matricula).trim();
      const senhaInformada = String(dadosApp.senha).trim();

      const planilha = SpreadsheetApp.getActiveSpreadsheet();
      const abaConfig = planilha.getSheetByName("configuracoes");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const abaFrequencia = planilha.getSheetByName("frequencia");
      const planBase = planilha.getSheetByName("basededados");

      if (!abaTrilha || !abaFrequencia || !planBase) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro interno: Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);
      }

      const timezone = Session.getScriptTimeZone();
      const agora = new Date();
      const dataHoje = Utilities.formatDate(agora, timezone, "dd/MM/yyyy");
      const horaAtual = Utilities.formatDate(agora, timezone, "HH:mm:ss");
      const diaSemana = Number(Utilities.formatDate(agora, timezone, "u"));

      let senhaCorreta = ""; let modoReposicao = "DESLIGADO";
      if (abaConfig) {
        const dadosConf = abaConfig.getDataRange().getValues();
        for (let i = 1; i < dadosConf.length; i++) {
          if (String(dadosConf[i][0]).trim() === "SENHA_CHECKIN") senhaCorreta = String(dadosConf[i][1]).trim();
          if (String(dadosConf[i][0]).trim() === "MODO_REPOSICAO") modoReposicao = String(dadosConf[i][1]).trim().toUpperCase();
        }
      }

      if (!senhaCorreta || senhaInformada.toUpperCase() !== senhaCorreta.toUpperCase()) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Senha incorreta ou não configurada!" })).setMimeType(ContentService.MimeType.JSON);
      }

      let turmaDoAluno = ""; let linhaTrilhaAluno = -1; let xpAtual = 0;
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        if (String(dadosTrilha[i][0]).trim() === matricula) {
          turmaDoAluno = String(dadosTrilha[i][1]).trim();
          linhaTrilhaAluno = i + 1;
          xpAtual = Number(dadosTrilha[i][4]) || 0;
          break;
        }
      }

      if (linhaTrilhaAluno === -1) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado no Projeto." })).setMimeType(ContentService.MimeType.JSON);

      if (modoReposicao !== "LIGADO") {
        if ((turmaDoAluno.includes("1º") || turmaDoAluno.includes("1 ANO")) && diaSemana !== 1 && diaSemana !== 3) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Calma aí! Hoje não é dia de aula para o 1º Ano (apenas Seg/Qua)." })).setMimeType(ContentService.MimeType.JSON);
        } else if ((turmaDoAluno.includes("2º") || turmaDoAluno.includes("2 ANO")) && diaSemana !== 2 && diaSemana !== 4) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Calma aí! Hoje não é dia de aula para o 2º Ano (apenas Ter/Qui)." })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // CALCULADOR DE OFENSIVA (FOGUINHO 🔥)
      let alunosDaMesmaTurma = new Set();
      for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][1]).trim() === turmaDoAluno && String(dadosTrilha[i][2]).trim().toLowerCase() === "ativo") {
              alunosDaMesmaTurma.add(String(dadosTrilha[i][0]).trim());
          }
      }

      let diasComAulaSet = new Set();
      let presencasAluno = 0;
      const dadosFreq = abaFrequencia.getDataRange().getValues();
      for (let i = 1; i < dadosFreq.length; i++) {
        let matFreq = String(dadosFreq[i][1]).trim();
        let dataBruta = dadosFreq[i][3];
        let hora = String(dadosFreq[i][4]).trim();
        let idCheckinFreq = String(dadosFreq[i][0]).trim();
        
        let dataFormatada = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

        if (matFreq === matricula && dataFormatada === dataHoje) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você já garantiu o seu XP de presença hoje!" })).setMimeType(ContentService.MimeType.JSON);
        }

        if (!idCheckinFreq.startsWith("BDAY") && alunosDaMesmaTurma.has(matFreq)) diasComAulaSet.add(dataFormatada);
        if (matFreq === matricula && hora !== "00:00:00" && hora !== "00:00" && hora !== "") presencasAluno++;
      }

      let totalAulas = diasComAulaSet.size;
      let taxa = totalAulas === 0 ? 100 : Math.round((presencasAluno / totalAulas) * 100);
      
      let xpGanho = 10;
      let msgFogo = "";
      if (taxa >= 90) { xpGanho = 15; msgFogo = " 🔥 Ofensiva Alta!"; }
      else if (taxa >= 75) { xpGanho = 12; msgFogo = " ⚡ Ofensiva Média!"; }

      let nomeAluno = "Aluno";
      const dadosBase = planBase.getDataRange().getValues();
      for (let i = 1; i < dadosBase.length; i++) {
        if (String(dadosBase[i][2]).trim() === matricula) { nomeAluno = String(dadosBase[i][0]); break; }
      }

      const idCheckin = "CHK-" + agora.getTime();
      abaFrequencia.appendRow([idCheckin, matricula, nomeAluno, dataHoje, horaAtual, xpGanho]);
      abaTrilha.getRange(linhaTrilhaAluno, 5).setValue(xpAtual + xpGanho);

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `Check-in realizado! +${xpGanho} XP garantidos.${msgFogo}` })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 15: BUSCAR FREQUÊNCIA HOJE (COM CONTROLE DE FALTAS ACUMULADAS)
  // ==========================================
    if (action === "buscar_frequencia_hoje") {
      const turma = String(dadosApp.turma || "").trim();
      const abaFrequencia = planilha.getSheetByName("frequencia");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");

      if (!abaFrequencia || !abaTrilha || !planBase) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      const timezone = Session.getScriptTimeZone();
      const dataHojeStr = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");

      let alunosDaTurma = {};
      let nomesMap = {};

      const dadosBase = planBase.getDataRange().getValues();
      for(let i = 1; i < dadosBase.length; i++) nomesMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]).trim();

      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for(let i = 1; i < dadosTrilha.length; i++) {
        let mat = String(dadosTrilha[i][0]).trim();
        let t = String(dadosTrilha[i][1]).trim();
        let status = String(dadosTrilha[i][2]).trim().toLowerCase(); // CORRIGIDO PARA [2]

        // CORRIGIDO: Status "ativo" em minúsculo
        if (mat && t === turma && status === "ativo") {
            alunosDaTurma[mat] = { matricula: mat, nome: nomesMap[mat] || "Aluno " + mat, presencasTotais: 0, faltasTotais: 0, presenteHoje: false, horaHoje: "" };
        }
      }

      let diasDeAulaSet = new Set();
      const dadosFreq = abaFrequencia.getDataRange().getValues();

      for(let i = 1; i < dadosFreq.length; i++) {
        let mat = String(dadosFreq[i][1]).trim();
        let dataBruta = dadosFreq[i][3];
        let dataFormatada = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

        if (alunosDaTurma[mat]) {
            diasDeAulaSet.add(dataFormatada);
            alunosDaTurma[mat].presencasTotais++;
            if (dataFormatada === dataHojeStr) { alunosDaTurma[mat].presenteHoje = true; alunosDaTurma[mat].horaHoje = String(dadosFreq[i][4]); }
        }
      }

      let totalAulasTurma = diasDeAulaSet.size;
      let listaFinal = Object.values(alunosDaTurma).map(a => {
        a.faltasTotais = totalAulasTurma - a.presencasTotais;
        if (a.faltasTotais < 0) a.faltasTotais = 0;
        return a;
      });

      listaFinal.sort((a, b) => a.nome.localeCompare(b.nome));

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", registros: listaFinal, totalAulas: totalAulasTurma })).setMimeType(ContentService.MimeType.JSON);
    }
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
        if (mat && t === turma && status === "Ativo") {
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
  // ROTA 16: BUSCAR RANKING DINÂMICO (Ignorando o Mestre)
  // ==========================================
    if (action === "buscar_ranking") {
      const filtroTempo = String(dadosApp.filtroTempo || "geral").trim();
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaFrequencia = planilha.getSheetByName("frequencia");

      if (!abaTrilha || !planBase) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      const CONTA_MESTRE = "1234567"; // SUA MATRÍCULA MESTRE

      let dataAtual = new Date();
      let timeInicio = 0;
      let timeFim = dataAtual.getTime();

      if (filtroTempo === "semanal") {
        let diaSemana = dataAtual.getDay();
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
        let status = String(dadosTrilha[i][2]).trim().toLowerCase(); // CORRIGIDO PARA [2] E TOLOWERCASE
        let xpTotalFolha = Number(dadosTrilha[i][4]) || 0;
        let avatarSheet = String(dadosTrilha[i][8]).trim() || "avatar-padrao";

        // A MÁGICA: Ignora Reservas, Desistentes e a conta Mestre
        if (mat && status === "ativo" && mat !== CONTA_MESTRE) { // CORRIGIDO PARA "ativo"
          alunosRankMap[mat] = {
            matricula: mat, nome: nomesMap[mat] || "Aluno " + mat, turma: String(dadosTrilha[i][1]).trim(),
            nivel: String(dadosTrilha[i][5]) || "Iniciante", xpCalculado: filtroTempo === "geral" ? xpTotalFolha : 0,
            turma: String(dadosTrilha[i][1]).trim(),
            avatar: avatarSheet, // <--- ADICIONA NO RANKING
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
            if (!maxTimes[mat] || timestampEnvio > maxTimes[mat]) maxTimes[mat] = timestampEnvio;
            if (filtroTempo !== "geral" && timestampEnvio >= timeInicio && timestampEnvio <= timeFim) alunosRankMap[mat].xpCalculado += xp;
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
            if (timestampFreq >= timeInicio && timestampFreq <= timeFim) alunosRankMap[mat].xpCalculado += xp;
          }
        }
      }

      let ranking = Object.values(alunosRankMap).map(aluno => ({ ...aluno, ultimoEnvio: maxTimes[aluno.matricula] || 9999999999999 }));
      ranking.sort((a, b) => { if (b.xpCalculado !== a.xpCalculado) return b.xpCalculado - a.xpCalculado; else return a.ultimoEnvio - b.ultimoEnvio; });
      ranking = ranking.map((aluno, index) => ({ ...aluno, xp: aluno.xpCalculado, posicao: index + 1 }));

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", ranking: ranking })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 17: GERENCIAR SENHA DA LOUSA (TUTOR)
  // ==========================================
    if (action === "buscar_senha_checkin") {
      const abaConfig = planilha.getSheetByName("configuracoes");
      let senha = "";
      
      if (abaConfig) {
        const dados = abaConfig.getDataRange().getValues();
        for (let i = 1; i < dados.length; i++) {
          if (String(dados[i][0]).trim() === "SENHA_CHECKIN") {
            senha = String(dados[i][1]).trim();
            break;
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", senha: senha 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "atualizar_senha_checkin") {
      const novaSenha = String(dadosApp.novaSenha).trim();
      const abaConfig = planilha.getSheetByName("configuracoes");

      if (abaConfig) {
        const dados = abaConfig.getDataRange().getValues();
        let achou = false;
        
        for (let i = 1; i < dados.length; i++) {
          if (String(dados[i][0]).trim() === "SENHA_CHECKIN") {
            abaConfig.getRange(i + 1, 2).setValue(novaSenha); 
            achou = true;
            break;
          }
        }
        
        if (!achou) abaConfig.appendRow(["SENHA_CHECKIN", novaSenha]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", mensagem: "Senha atualizada com sucesso!" 
      })).setMimeType(ContentService.MimeType.JSON);
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

      // Apenas encontrar alunos ATIVOS
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        let mat = String(dadosTrilha[i][0]).trim();
        let turma = String(dadosTrilha[i][1]).trim();
        let status = String(dadosTrilha[i][2]).trim().toLowerCase(); // Lendo a Coluna 2 corretamente

        if (mat && turma === turmaSelecionada && status === "ativo") { // Status "ativo" em minúsculo
          alunosMap[mat] = {
            matricula: mat,
            nome: nomesMap[mat] || "Aluno " + mat,
            frequencia: {} 
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
        if (String(dadosTrilha[i][1]).trim() === minhaTurma && String(dadosTrilha[i][2]).trim().toLowerCase() === "ativo") {
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
  // ROTA 23: BUSCAR ANIVERSARIANTES DO DIA (FILTRADO POR TRILHATECH ATIVO)
  // ==========================================
    if (action === "buscar_aniversariantes_dia") {
      const planBase = planilha.getSheetByName("basededados");
      const abaTrilha = planilha.getSheetByName("trilhatech"); // <-- Lemos a aba do Trilha Tech
      
      if (!planBase || !abaTrilha) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas" })).setMimeType(ContentService.MimeType.JSON);
      }

      // 1. Criar um "Dicionário" apenas com alunos ATIVOS no projeto
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      let alunosAtivosTrilha = new Set();
      
      for (let i = 1; i < dadosTrilha.length; i++) {
        let mat = String(dadosTrilha[i][0]).trim(); // Coluna A (Matrícula)
        let status = String(dadosTrilha[i][2]).trim().toLowerCase(); // Coluna C (Status)
        
        // Se tem matrícula e está ativo, adiciona à nossa lista VIP
        if (mat && status === "ativo") {
          alunosAtivosTrilha.add(mat);
        }
      }

      const dadosBase = planBase.getDataRange().getValues();
      
      // Usa o fuso horário oficial do Script para evitar bugs de virada de noite
      const timezone = Session.getScriptTimeZone();
      const hoje = new Date();
      const diaHoje = Utilities.formatDate(hoje, timezone, "dd");
      const mesHoje = Utilities.formatDate(hoje, timezone, "MM");
      const dataBuscada = `${diaHoje}/${mesHoje}`;

      let listaAniversariantes = [];

      for (let i = 1; i < dadosBase.length; i++) {
        let nomeCompleto = String(dadosBase[i][0]).trim();
        let dataBruta = dadosBase[i][1]; 
        let matriculaBase = String(dadosBase[i][2]).trim(); // Coluna C (Matrícula na Base)
        let turmaEscola = String(dadosBase[i][4]).trim();

        // 2. SÓ VERIFICA O ANIVERSÁRIO SE O ALUNO ESTIVER ATIVO NO TRILHA TECH
        if (alunosAtivosTrilha.has(matriculaBase)) {
          let dataFormatada = "";

          // Se a célula do Sheets for um objeto de Data nativo:
          if (dataBruta instanceof Date) {
            let d = Utilities.formatDate(dataBruta, timezone, "dd");
            let m = Utilities.formatDate(dataBruta, timezone, "MM");
            dataFormatada = `${d}/${m}`;
          } else {
            // Se for apenas um texto digitado pelo usuário (Ex: "15/04/2006")
            let str = String(dataBruta).trim();
            if(str.includes("/")) {
                let partes = str.split("/");
                // Garante que fique "15/04" mesmo se digitar "15/4"
                dataFormatada = `${partes[0].padStart(2, '0')}/${partes[1].padStart(2, '0')}`;
            } else {
                dataFormatada = str.substring(0, 5);
            }
          }

          // Agora a comparação será justa!
          if (dataFormatada === dataBuscada && nomeCompleto) {
            listaAniversariantes.push({ 
              nome: nomeCompleto.split(" ")[0], // Apenas o primeiro nome
              turma: turmaEscola 
            });
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso",
        aniversariantes: listaAniversariantes
      })).setMimeType(ContentService.MimeType.JSON);
    }
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

    // ROTA: Buscar Links do Whatsapp
    if (action === "buscar_links_whatsapp") {
      const abaConfig = planilha.getSheetByName("configuracoes");
      let link1Ano = "";
      let link2Ano = "";

      if (abaConfig) {
        const dados = abaConfig.getDataRange().getValues();
        for (let i = 1; i < dados.length; i++) {
          let chave = String(dados[i][0]).trim();
          if (chave === "LINK_WPP_T1") link1Ano = String(dados[i][1]).trim();
          if (chave === "LINK_WPP_T2") link2Ano = String(dados[i][1]).trim();
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", link1Ano, link2Ano 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ROTA: Salvar os Links (Tutor)
    if (action === "salvar_links_whatsapp") {
      const link1Ano = String(dadosApp.link1Ano || "").trim();
      const link2Ano = String(dadosApp.link2Ano || "").trim();
      const abaConfig = planilha.getSheetByName("configuracoes");

      if (abaConfig) {
        const dados = abaConfig.getDataRange().getValues();
        let achouT1 = false;
        let achouT2 = false;

        for (let i = 1; i < dados.length; i++) {
          let chave = String(dados[i][0]).trim();
          // Atualiza a Coluna B (índice 2 no getRange)
          if (chave === "LINK_WPP_T1") { abaConfig.getRange(i + 1, 2).setValue(link1Ano); achouT1 = true; }
          if (chave === "LINK_WPP_T2") { abaConfig.getRange(i + 1, 2).setValue(link2Ano); achouT2 = true; }
        }

        // Se o professor tiver apagado a linha sem querer, o sistema recria no fim
        if (!achouT1) abaConfig.appendRow(["LINK_WPP_T1", link1Ano]);
        if (!achouT2) abaConfig.appendRow(["LINK_WPP_T2", link2Ano]);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", mensagem: "Links atualizados!" 
      })).setMimeType(ContentService.MimeType.JSON);
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
  // ROTAS 27: DO PIX DE XP (P2P) - COM CONTA MESTRE
  // ==========================================

    // 1. INICIAR PIX (Carrega colegas, limite, status da senha e EXTRATO BANCÁRIO)
    if (action === "iniciar_pix") {
      const matricula = String(dadosApp.matricula).trim();
      const CONTA_MESTRE = "1234567"; // <--- A SUA MATRÍCULA MESTRE AQUI
      const ehMestre = (matricula === CONTA_MESTRE);

      let abaTrilha = planilha.getSheetByName("trilhatech");
      let planBase = planilha.getSheetByName("basededados");
      let abaConfig = planilha.getSheetByName("configuracoes");
      let abaEntregas = planilha.getSheetByName("entregas");

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
            temSenhaPix = String(dadosTrilha[i][7] || "").trim().length >= 4; 
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
        let status = String(dadosTrilha[i][2]).trim().toLowerCase();
        
        // REGRA DO MESTRE: Ignora a restrição de turma
        let ehDaMesmaTurmaOuMestre = ehMestre ? true : (t === minhaTurma);

        if(ehDaMesmaTurmaOuMestre && mat !== matricula && status !== "desclassificado") {
            // Se for Mestre, mostra a turma ao lado do nome para ajudar a identificar
            let nomeExibicao = (nomesMap[mat] || "Aluno "+mat) + (ehMestre ? ` (${t.split("-")[0].trim()})` : "");
            colegas.push({ matricula: mat, nome: nomeExibicao });
        }
      }
      colegas.sort((a,b) => a.nome.localeCompare(b.nome));

      let xpDoadoHoje = 0;
      let extratoPix = [];
      const timezone = Session.getScriptTimeZone();
      const hojeStr = Utilities.formatDate(new Date(), timezone, "yyyyMMdd");
      const prefixoHoje = "PIX-" + hojeStr;

      const dadosEntregas = abaEntregas.getDataRange().getValues();
      for(let i=1; i<dadosEntregas.length; i++) {
        let id = String(dadosEntregas[i][0]).trim();
        let matRow = String(dadosEntregas[i][1]).trim();
        
        if(matRow === matricula) {
            if(id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) {
              xpDoadoHoje += Math.abs(Number(dadosEntregas[i][5]) || 0);
            }
            if(id.includes("PIX-")) {
              let isEnvio = id.includes("-ENVIOU");
              let xpLido = Number(dadosEntregas[i][5]) || 0;
              let timestampEnvio = Number(dadosEntregas[i][6]) || 0;
              extratoPix.push({
                  id: id,
                  mensagem: String(dadosEntregas[i][3]),
                  xp: isEnvio ? -Math.abs(xpLido) : Math.abs(xpLido),
                  tempo: timestampEnvio,
                  tipo: isEnvio ? "ENVIOU" : "RECEBEU"
              });
            }
        }
      }
      extratoPix.sort((a,b) => b.tempo - a.tempo);
      extratoPix = extratoPix.slice(0, 20);

      // Se for Mestre, dá limite diário infinito e XP infinito na visualização
      if (ehMestre) {
        limiteDiario = 999999;
        meuXpTotal = 999999;
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso", colegas: colegas, limiteDiario: limiteDiario, xpDoadoHoje: xpDoadoHoje, temSenhaPix: temSenhaPix, meuXpTotal: meuXpTotal, extrato: extratoPix
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. CRIAR SENHA PIX (Apenas a primeira vez) - MANTÉM IGUAL
    if (action === "criar_senha_pix") {
      const matricula = String(dadosApp.matricula).trim();
      const senha = String(dadosApp.senha).trim();
      let abaTrilha = planilha.getSheetByName("trilhatech");
      let dadosTrilha = abaTrilha.getDataRange().getValues();

      for(let i=1; i<dadosTrilha.length; i++) {
        if(String(dadosTrilha[i][0]).trim() === matricula) {
            abaTrilha.getRange(i+1, 8).setValue(senha); 
            return ContentService.createTextOutput(JSON.stringify({status: "sucesso"})).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Aluno não encontrado."})).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. TRANSFERIR XP (Mestre burla todas as travas anti-fraude)
    if (action === "transferir_xp") {
      const matriculaOrigem = String(dadosApp.matriculaOrigem).trim();
      const CONTA_MESTRE = "1234567"; // <--- A SUA MATRÍCULA MESTRE AQUI
      const ehMestre = (matriculaOrigem === CONTA_MESTRE);

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
      
      // Se não for o Mestre, verifica se tem saldo
      if (!ehMestre && xpOrigem < quantidade) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Você não tem XP suficiente."})).setMimeType(ContentService.MimeType.JSON);

      let xpRecebidoHojeDestino = 0;
      let xpEnviadoSemana = 0;
      let temBloqueio = false;
      let dataBloqueio = "";

      const timezone = Session.getScriptTimeZone();
      const agoraTime = new Date().getTime();
      const hojeStr = Utilities.formatDate(new Date(), timezone, "yyyyMMdd");
      const prefixoHoje = "PIX-" + hojeStr;
      const seteDiasAtras = agoraTime - (7 * 24 * 60 * 60 * 1000);

      const dadosEntregas = abaEntregas.getDataRange().getValues();
      let xpDoadoHoje = 0;

      for(let i=1; i<dadosEntregas.length; i++) {
        let id = String(dadosEntregas[i][0]).trim();
        let matRow = String(dadosEntregas[i][1]).trim();
        let desc = String(dadosEntregas[i][3]).trim();
        let xpLido = Number(dadosEntregas[i][5]) || 0;
        let tstamp = Number(dadosEntregas[i][6]) || 0;

        if (id === "BLOCK-" + matriculaOrigem + "-" + matriculaDestino) {
            if (agoraTime < tstamp) { temBloqueio = true; dataBloqueio = Utilities.formatDate(new Date(tstamp), timezone, "dd/MM/yyyy HH:mm"); }
        }
        if (matRow === matriculaDestino && id.startsWith(prefixoHoje) && id.includes("-RECEBEU")) { xpRecebidoHojeDestino += xpLido; }
        if (matRow === matriculaOrigem && id.includes("-ENVIOU") && tstamp >= seteDiasAtras) {
            if (desc.includes("Enviou para " + matriculaDestino + ":")) { xpEnviadoSemana += Math.abs(xpLido); }
        }
        if (matRow === matriculaOrigem && id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) { xpDoadoHoje += Math.abs(xpLido); }
      }

      // REGRAS APLICADAS APENAS SE NÃO FOR O MESTRE
      if (!ehMestre) {
          if (temBloqueio) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "🔒 Você está bloqueado de enviar XP para este colega até " + dataBloqueio + "."})).setMimeType(ContentService.MimeType.JSON);
          if (xpDoadoHoje + quantidade > limiteDiario) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: `Limite global excedido! Você só pode doar mais ${limiteDiario - xpDoadoHoje} XP hoje.`})).setMimeType(ContentService.MimeType.JSON);
          if (xpRecebidoHojeDestino + quantidade > 50) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "🔒 O colega de destino já atingiu o limite de receber 50 XP por dia."})).setMimeType(ContentService.MimeType.JSON);
          if (xpEnviadoSemana + quantidade > 100) {
              let expira = agoraTime + (7 * 24 * 60 * 60 * 1000);
              abaEntregas.appendRow(["BLOCK-" + matriculaOrigem + "-" + matriculaDestino, matriculaOrigem, "PIX-BLOCK", matriculaDestino, "Bloqueado", 0, expira]);
              return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "🚨 Você foi bloqueado de transferir para este colega por 7 dias!"})).setMimeType(ContentService.MimeType.JSON);
          }
      }

      // Se não for o Mestre, desconta do remetente. O Mestre cria XP do nada!
      if (!ehMestre) { abaTrilha.getRange(linhaOrigem, 5).setValue(xpOrigem - quantidade); }
      
      // Paga ao destino
      abaTrilha.getRange(linhaDestino, 5).setValue(xpDestino + quantidade);

      let timestamp = new Date().getTime();
      let idBase = prefixoHoje + "-" + timestamp;
      abaEntregas.appendRow([idBase + "-ENVIOU", matriculaOrigem, "PIX-XP", `Enviou para ${matriculaDestino}: ${motivo}`, "Avaliado", -quantidade, timestamp]);
      abaEntregas.appendRow([idBase + "-RECEBEU", matriculaDestino, "PIX-XP", `Recebeu de ${matriculaOrigem}: ${motivo}`, "Avaliado", quantidade, timestamp]);

      return ContentService.createTextOutput(JSON.stringify({status: "sucesso"})).setMimeType(ContentService.MimeType.JSON);
    }



  // ==========================================
  // ROTA 28: CARREGAR PORTAL DO ALUNO (SUPER ROTA LIMPA E ATUALIZADA)
  // ==========================================
    if (action === "carregar_portal_aluno") {
      const matricula = String(dadosApp.matricula).trim();

      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaAtividades = planilha.getSheetByName("atividades");
      const abaConfig = planilha.getSheetByName("configuracoes");
      const abaFrequencia = planilha.getSheetByName("frequencia");
      const abaCurtidas = planilha.getSheetByName("curtidas");

      let dadosRetorno = {
        status: "sucesso",
        xpTotal: 0,
        nivel: "Iniciante",
        avatar: "avatar-padrao",
        totalCurtidas: 0,
        ofensivaDias: 0,
        whatsapp: { confirmado: true, link: "" },
        aniversario: { isAniversario: false, jaResgatado: false },
        atividades: [],
        notificacoes: [],
        extratoPix: [],
        badgesResgatadas: [],
        taxaPresenca: 100,
        stats: { xpDoado: 0, xpRecebido: 0, totalCheckins: 0 }
      };

      let turmaDoAlunoNoProjeto = "";

      const niveisGamificacao = [
        { nome: "Hello World", min: 0, max: 499 },
        { nome: "Bug Hunter", min: 500, max: 1499 },
        { nome: "Coder Ninja", min: 1500, max: 2999 },
        { nome: "Tech Hacker", min: 3000, max: 4999 },
        { nome: "Dev Supremo", min: 5000, max: 7499 },
        { nome: "Lenda Binária", min: 7500, max: 999999 }
      ];

      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let t = 1; t < dadosTrilha.length; t++) {
          if (String(dadosTrilha[t][0]).trim() === matricula) {
            turmaDoAlunoNoProjeto = String(dadosTrilha[t][1]).trim();
            let xpTotalAtual = Number(dadosTrilha[t][4]) || 0;
            let nivelAtualSheet = String(dadosTrilha[t][5]).trim();

            dadosRetorno.avatar = String(dadosTrilha[t][8]).trim() || "avatar-padrao";
            dadosRetorno.totalCurtidas = Number(dadosTrilha[t][9]) || 0;

            let nivelCalculado = niveisGamificacao[0];
            let proximoNivel = niveisGamificacao[1];
            for (let n = 0; n < niveisGamificacao.length; n++) {
              if (xpTotalAtual >= niveisGamificacao[n].min && xpTotalAtual <= niveisGamificacao[n].max) {
                nivelCalculado = niveisGamificacao[n];
                proximoNivel = niveisGamificacao[n+1] || niveisGamificacao[n];
                break;
              }
            }

            if (nivelCalculado.nome !== nivelAtualSheet) {
                abaTrilha.getRange(t + 1, 6).setValue(nivelCalculado.nome);
            }

            let xpBaseNivel = nivelCalculado.min;
            let xpParaProximo = proximoNivel.min;
            let progressoAtual = xpTotalAtual - xpBaseNivel;
            let totalDoNivel = xpParaProximo - xpBaseNivel;
            let porcentagemProgresso = totalDoNivel === 0 ? 100 : Math.floor((progressoAtual / totalDoNivel) * 100);
            let xpFaltante = xpParaProximo - xpTotalAtual > 0 ? xpParaProximo - xpTotalAtual : 0;

            dadosRetorno.xpTotal = xpTotalAtual;
            dadosRetorno.nivel = nivelCalculado.nome;
            dadosRetorno.progressoNivel = { porcentagem: porcentagemProgresso, faltam: xpFaltante, nomeProximo: proximoNivel.nome, isMaximo: totalDoNivel === 0 };
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

      let nomesMap = {};
      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          let mat = String(dadosBase[i][2]).trim();
          nomesMap[mat] = String(dadosBase[i][0]).trim();
          if (mat === matricula) {
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
            if (idEntrega.startsWith("NOTIF-")) {
                let timestampEnvio = Number(dadosEntregas[i][6]) || 0;
                dadosRetorno.notificacoes.push({ 
                  id: idEntrega, 
                  mensagem: String(dadosEntregas[i][3]), 
                  xp: Number(dadosEntregas[i][5]) || 0, 
                  tempo: timestampEnvio, 
                  tipo: String(dadosEntregas[i][4]) 
                });
                continue; // Pula o resto para não ler como entrega normal
            }

            if (!idEntrega.startsWith("BDAY") && !idEntrega.startsWith("PIX") && !idEntrega.startsWith("BADGE") && !idEntrega.startsWith("BLOCK")) {
              let idAtividade = String(dadosEntregas[i][2]).trim();
              entregasMap[idAtividade] = {
                resposta: String(dadosEntregas[i][3]).trim(), 
                status: String(dadosEntregas[i][4]).trim() || "Aguardando Correção", 
                xpGanho: dadosEntregas[i][5] || 0,
                feedback: String(dadosEntregas[i][7] || "").trim() // <--- LEITURA DO FEEDBACK (COLUNA H)
              };
            }
            if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) {
                dadosRetorno.stats.xpRecebido += Number(dadosEntregas[i][5]) || 0;
                let timestampEnvio = Number(dadosEntregas[i][6]) || 0;
                dadosRetorno.extratoPix.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: Number(dadosEntregas[i][5]), tempo: timestampEnvio, tipo: "RECEBEU" });
                dadosRetorno.notificacoes.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: Number(dadosEntregas[i][5]), tempo: timestampEnvio, tipo: "PIX" });
            }
            if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
                let xpD = Math.abs(Number(dadosEntregas[i][5]) || 0);
                dadosRetorno.stats.xpDoado += xpD;
                let timestampEnvio = Number(dadosEntregas[i][6]) || 0;
                dadosRetorno.extratoPix.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: -xpD, tempo: timestampEnvio, tipo: "ENVIOU" });
            }
            if (idEntrega === idNiver) dadosRetorno.aniversario.jaResgatado = true;
            if (idEntrega.startsWith("BADGE-")){
              let badgeId = idEntrega.replace("BADGE-", "").replace("-" + matricula, "");
              dadosRetorno.badgesResgatadas.push(badgeId);
            }
          }
        }
      }

      if (abaCurtidas) {
        const dadosCurt = abaCurtidas.getDataRange().getValues();
        for (let i = 1; i < dadosCurt.length; i++) {
            if (String(dadosCurt[i][2]).trim() === matricula) {
                let idLike = String(dadosCurt[i][0]).trim();
                let remetente = String(dadosCurt[i][1]).trim();
                let nomeCurto = nomesMap[remetente] ? nomesMap[remetente].split(" ")[0] : "Um colega";
                let tstamp = Number(idLike.split("-")[1]) || new Date().getTime();

                dadosRetorno.notificacoes.push({
                    id: idLike,
                    mensagem: `${nomeCurto} curtiu o seu perfil! ❤️`,
                    xp: 0,
                    tempo: tstamp,
                    tipo: "LIKE"
                });
            }
        }
      }

      dadosRetorno.notificacoes.sort((a, b) => b.tempo - a.tempo);
      dadosRetorno.notificacoes = dadosRetorno.notificacoes.slice(0, 10);

      dadosRetorno.extratoPix.sort((a, b) => b.tempo - a.tempo);
      dadosRetorno.extratoPix = dadosRetorno.extratoPix.slice(0, 20);

      if (abaFrequencia && turmaDoAlunoNoProjeto) {
          let alunosDaMesmaTurma = new Set();
          if(abaTrilha) {
              const dTrilha = abaTrilha.getDataRange().getValues();
              for (let i = 1; i < dTrilha.length; i++) {
                  if (String(dTrilha[i][1]).trim() === turmaDoAlunoNoProjeto && String(dTrilha[i][2]).trim().toLowerCase() === "ativo") {
                      alunosDaMesmaTurma.add(String(dTrilha[i][0]).trim());
                  }
              }
          }

          let diasComAulaSet = new Set();
          let checkinsMap = {};
          let presencasAluno = 0;
          const dadosFreq = abaFrequencia.getDataRange().getValues();
          for (let i = 1; i < dadosFreq.length; i++) {
            let idCheckin = String(dadosFreq[i][0]).trim();
            let matFreq = String(dadosFreq[i][1]).trim();
            let dataBruta = dadosFreq[i][3];
            let hora = String(dadosFreq[i][4]).trim();

            if (idCheckin.startsWith("BDAY")) continue;
            let dataFormatada = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

            if (alunosDaMesmaTurma.has(matFreq)) diasComAulaSet.add(dataFormatada);
            if (matFreq === matricula && hora !== "00:00:00" && hora !== "00:00" && hora !== "") {
                presencasAluno++;
                dadosRetorno.stats.totalCheckins++;
                checkinsMap[dataFormatada] = true;
            }
          }
          let totalAulas = diasComAulaSet.size;
          dadosRetorno.taxaPresenca = totalAulas === 0 ? 100 : Math.round((presencasAluno / totalAulas) * 100);

          let diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
              let pA = String(a).split('/'); let pB = String(b).split('/');
              return new Date(pB[2], pB[1]-1, pB[0]).getTime() - new Date(pA[2], pA[1]-1, pA[0]).getTime();
          });
          let streak = 0;
          const dataHojeStr = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");
          for (let dia of diasOrdenados) {
              if (dia === dataHojeStr && !checkinsMap[dia]) continue;
              if (checkinsMap[dia]) streak++;
              else break;
          }
          dadosRetorno.ofensivaDias = streak;
      }

      if (abaAtividades) {
        const dadosAtiv = abaAtividades.getDataRange().getValues();
        let hojeTime = new Date(); hojeTime.setHours(0,0,0,0);

        for (let i = 1; i < dadosAtiv.length; i++) {
          
          // --- MÁGICA 1: OCULTA OS RASCUNHOS ---
          let statusPublicacao = String(dadosAtiv[i][13] || "Publicada").trim();
          if (statusPublicacao !== "Publicada") continue;

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
              status: entregaAluno ? entregaAluno.status : "Pendente",
              respostaEnviada: entregaAluno ? entregaAluno.resposta : "",
              xpGanho: entregaAluno ? entregaAluno.xpGanho : 0,
              statusPrazo: statusPrazo,
              feedback: entregaAluno ? entregaAluno.feedback : "",
              linkClassroom: String(dadosAtiv[i][12] || "") // <-- ENVIA O LINK
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

  // ==========================================
  // ROTA 30: DASHBOARD ANALYTICS (GERAL E RADAR DE RISCO)
  // ==========================================
    if (action === "buscar_analytics_geral") {
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const planBase = planilha.getSheetByName("basededados");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaFrequencia = planilha.getSheetByName("frequencia");
      const abaAtividades = planilha.getSheetByName("atividades");

      let totalAlunos = 0;
      let totalXpEscola = 0;
      let volumePix = 0;
      let listaAlunos = [];
      let alunosMap = {};
      let turmasAulas = {};
      let nomesMap = {};
      let telefonesMap = {};

      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          let mat = String(dadosBase[i][2]).trim();
          nomesMap[mat] = String(dadosBase[i][0]);
          telefonesMap[mat] = String(dadosBase[i][5]);
        }
      }

      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          let mat = String(dadosTrilha[i][0]).trim();
          let turma = String(dadosTrilha[i][1]).trim();
          // CORREÇÃO: Status está na Coluna C (Índice 2)
          let status = String(dadosTrilha[i][2]).trim().toLowerCase(); 
          let xp = Number(dadosTrilha[i][4]) || 0;

          if (mat && status === "ativo") {
            totalAlunos++;
            totalXpEscola += xp;
            listaAlunos.push({ matricula: mat, nome: nomesMap[mat] || "Sem Nome", turma: turma });

            // Só entram no Radar alunos que NÃO são reserva
            if (status !== "reserva" || "desistente") {
              alunosMap[mat] = {
                matricula: mat, nome: nomesMap[mat] || "Sem Nome", turma: turma,
                telefone: telefonesMap[mat] || "", presencas: 0, missoesAtrasadas: 0
              };
              if (!turmasAulas[turma]) turmasAulas[turma] = new Set();
            }
          }
        }
      }
      listaAlunos.sort((a,b) => a.nome.localeCompare(b.nome));

      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          let idEntrega = String(dadosEntregas[i][0]).trim();
          if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
            volumePix += Math.abs(Number(dadosEntregas[i][5]) || 0);
          }
        }
      }

      if (abaFrequencia) {
        const dadosFreq = abaFrequencia.getDataRange().getValues();
        let timezone = Session.getScriptTimeZone();
        for (let i = 1; i < dadosFreq.length; i++) {
          let mat = String(dadosFreq[i][1]).trim();
          let dataBruta = dadosFreq[i][3];
          let hora = String(dadosFreq[i][4]).trim();
          let justificativa = String(dadosFreq[i][6] || "").trim();
          let idCheckin = String(dadosFreq[i][0]).trim();

          let dataFormatada = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

          if (!idCheckin.startsWith("BDAY") && alunosMap[mat]) {
              turmasAulas[alunosMap[mat].turma].add(dataFormatada);
              let presente = (hora !== "00:00:00" && hora !== "00:00" && hora !== "");
              if (presente || justificativa !== "") alunosMap[mat].presencas++;
          }
        }
      }

      if (abaAtividades && abaEntregas) {
          let missoesVencidas = [];
          let hoje = new Date(); hoje.setHours(0,0,0,0);
          const dadosAtiv = abaAtividades.getDataRange().getValues();
          for (let i = 1; i < dadosAtiv.length; i++) {
            let dataLimiteBruta = dadosAtiv[i][3];
            let dataLimiteStr = dataLimiteBruta instanceof Date ? Utilities.formatDate(dataLimiteBruta, Session.getScriptTimeZone(), "dd/MM/yyyy") : String(dataLimiteBruta);
            if (dataLimiteStr) {
                let p = dataLimiteStr.split('/');
                if (p.length === 3) {
                  let dLim = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                  if (hoje > dLim) missoesVencidas.push({ id: String(dadosAtiv[i][0]).trim(), turma: String(dadosAtiv[i][5]).trim() });
                }
            }
          }

          let entregasFeitas = {};
          const dadosEnt = abaEntregas.getDataRange().getValues();
          for (let i = 1; i < dadosEnt.length; i++) {
            let mat = String(dadosEnt[i][1]).trim();
            let idAtiv = String(dadosEnt[i][2]).trim();
            if (!entregasFeitas[mat]) entregasFeitas[mat] = new Set();
            entregasFeitas[mat].add(idAtiv);
          }

          Object.values(alunosMap).forEach(aluno => {
            missoesVencidas.forEach(m => {
                if (m.turma === "Todas" || m.turma === aluno.turma) {
                  if (!entregasFeitas[aluno.matricula] || !entregasFeitas[aluno.matricula].has(m.id)) aluno.missoesAtrasadas++;
                }
            });
          });
      }

      let radarRisco = [];
      Object.values(alunosMap).forEach(aluno => {
          let totalAulas = turmasAulas[aluno.turma] ? turmasAulas[aluno.turma].size : 0;
          let taxaPresenca = totalAulas === 0 ? 100 : Math.round((aluno.presencas / totalAulas) * 100);
          if (taxaPresenca < 70 || aluno.missoesAtrasadas >= 2) {
            radarRisco.push({ matricula: aluno.matricula, nome: aluno.nome, turma: aluno.turma, telefone: aluno.telefone, taxaPresenca, missoesAtrasadas: aluno.missoesAtrasadas });
          }
      });

      radarRisco.sort((a,b) => {
          if (a.taxaPresenca !== b.taxaPresenca) return a.taxaPresenca - b.taxaPresenca;
          return b.missoesAtrasadas - a.missoesAtrasadas;
      });

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", totalAlunos, totalXpEscola, volumePix, alunos: listaAlunos, radarRisco })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 31: FICHA 360 DO ALUNO (TUTOR)
  // ==========================================
    if (action === "buscar_ficha_360") {
      const matricula = String(dadosApp.matricula).trim();
      const planBase = planilha.getSheetByName("basededados");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaFrequencia = planilha.getSheetByName("frequencia");

      let ficha = {
        dadosPessoais: {}, xpTotal: 0, nivel: "", turmaProjeto: "", statusProjeto: "", historicoXP: [],
        frequencia: { taxa: 100, totalAulas: 0, totalPresencas: 0, totalFaltas: 0 }
      };

      if (planBase) {
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) {
          if (String(dadosBase[i][2]).trim() === matricula) {
            let dataBruta = dadosBase[i][1];
            let dataStr = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, Session.getScriptTimeZone(), "dd/MM/yyyy") : String(dataBruta);
            ficha.dadosPessoais = {
              nome: String(dadosBase[i][0]), nascimento: dataStr, email: String(dadosBase[i][3]),
              turmaEscola: String(dadosBase[i][4]), telefone: String(dadosBase[i][5]), responsavel: String(dadosBase[i][6]), obs: String(dadosBase[i][7])
            }; break;
          }
        }
      }

      let alunosDaMesmaTurma = [];
      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matricula) {
            ficha.turmaProjeto = String(dadosTrilha[i][1]).trim();
            // CORREÇÃO: Status está na Coluna C (Índice 2)
            ficha.statusProjeto = String(dadosTrilha[i][2]).trim(); 
            ficha.xpTotal = Number(dadosTrilha[i][4]) || 0;
            ficha.nivel = String(dadosTrilha[i][5]);
          }
        }
        // Buscar todos os alunos da turma dele
        for (let i = 1; i < dadosTrilha.length; i++) {
            if (String(dadosTrilha[i][1]).trim() === ficha.turmaProjeto) {
                alunosDaMesmaTurma.push(String(dadosTrilha[i][0]).trim());
            }
        }
      }

      if (abaFrequencia && ficha.turmaProjeto) {
        let diasComAulaSet = new Set();
        let meusRegistrosMap = {};
        const dadosFreq = abaFrequencia.getDataRange().getValues();
        let timezone = Session.getScriptTimeZone();

        for (let i = 1; i < dadosFreq.length; i++) {
          let idCheckin = String(dadosFreq[i][0]).trim();
          let matFreq = String(dadosFreq[i][1]).trim();
          let dataBruta = dadosFreq[i][3];
          let hora = String(dadosFreq[i][4]).trim();
          let justificativa = String(dadosFreq[i][6] || "").trim();

          if (!idCheckin || idCheckin.startsWith("BDAY")) continue;

          let dataFormatada = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

          // Conta as aulas que qualquer aluno desta turma teve
          if (alunosDaMesmaTurma.includes(matFreq)) diasComAulaSet.add(dataFormatada);

          // Verifica o status deste aluno específico
          if (matFreq === matricula) {
              let presente = (hora !== "00:00:00" && hora !== "00:00" && hora !== "");
              if (presente) meusRegistrosMap[dataFormatada] = "presente";
              else if (justificativa !== "") meusRegistrosMap[dataFormatada] = "justificada";
              else meusRegistrosMap[dataFormatada] = "falta";
          }
        }

        let totalAulas = diasComAulaSet.size;
        let totalPresencas = 0;
        let totalFaltas = 0;

        diasComAulaSet.forEach(dia => {
            let st = meusRegistrosMap[dia] || "falta";
            if (st === "presente" || st === "justificada") totalPresencas++; else totalFaltas++;
        });

        let taxa = totalAulas === 0 ? 100 : Math.round((totalPresencas / totalAulas) * 100);
        ficha.frequencia = { totalAulas, totalPresencas, totalFaltas, taxa };
      }

      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        for (let i = 1; i < dadosEntregas.length; i++) {
          if (String(dadosEntregas[i][1]).trim() === matricula) {
            ficha.historicoXP.push({
              id: String(dadosEntregas[i][0]), atividade: String(dadosEntregas[i][2]),
              status: String(dadosEntregas[i][4]), xp: Number(dadosEntregas[i][5]) || 0,
              data: Number(dadosEntregas[i][6]) || 0
            });
          }
        }
      }
      ficha.historicoXP.sort((a,b) => b.data - a.data); 

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", ficha })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 32: BUSCAR CONFIGURAÇÕES DO SISTEMA (WHITE-LABEL)
  // ==========================================
    if (action === "buscar_configuracoes") {
      const abaConfig = planilha.getSheetByName("configuracoes");
      
      // Valores padrão caso a aba esteja vazia ou incompleta
      let configuracoes = {
        nomeEscola: "Escola Padrão",
        nomeProjeto: "Trilha Tech",
        turmas: ["Turma 1 - 1º Ano", "Turma 2 - 2º Ano"],
        linkPlanilha: "https://docs.google.com/spreadsheets",
        linkClassroom: "https://classroom.google.com/",
        linkMatriz: "#",
        linkAjuda: "#",
        linkCronograma: "#",
        modoReposicao: "DESLIGADO",
        
      };

      if (abaConfig) {
        const dadosConf = abaConfig.getDataRange().getValues();
        for (let i = 1; i < dadosConf.length; i++) {
          let chave = String(dadosConf[i][0]).trim();
          let valor = String(dadosConf[i][1]).trim();
          
          if (chave === "NOME_ESCOLA") configuracoes.nomeEscola = valor;
          if (chave === "NOME_PROJETO") configuracoes.nomeProjeto = valor;
          if (chave === "TURMAS_PROJETO") {
            configuracoes.turmas = valor.split(",").map(t => t.trim()).filter(t => t !== "");
          }
          // Lendo os novos links dinâmicos
          if (chave === "LINK_PLANILHA") configuracoes.linkPlanilha = valor;
          if (chave === "LINK_CLASSROOM") configuracoes.linkClassroom = valor;
          if (chave === "LINK_MATRIZ") configuracoes.linkMatriz = valor;
          if (chave === "LINK_AJUDA") configuracoes.linkAjuda = valor;
          if (chave === "LINK_CRONOGRAMA") configuracoes.linkCronograma = valor;
          if (chave === "MODO_REPOSICAO") configuracoes.modoReposicao = valor.toUpperCase();
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", configuracoes })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 33: LIGAR/DESLIGAR MODO DE REPOSIÇÃO
  // ==========================================
    if (action === "toggle_modo_reposicao") {
      const abaConfig = planilha.getSheetByName("configuracoes");
      const novoStatus = String(dadosApp.status).toUpperCase(); // "LIGADO" ou "DESLIGADO"

      if (abaConfig) {
        const dadosConf = abaConfig.getDataRange().getValues();
        let encontrou = false;
        
        for (let i = 1; i < dadosConf.length; i++) {
          if (String(dadosConf[i][0]).trim() === "MODO_REPOSICAO") {
            abaConfig.getRange(i + 1, 2).setValue(novoStatus);
            encontrou = true;
            break;
          }
        }
        
        // Se a chave não existir na planilha, ele cria automaticamente
        if (!encontrou) {
          abaConfig.appendRow(["MODO_REPOSICAO", novoStatus]);
        }
        
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "sucesso", 
          mensagem: "Modo Reposição " + (novoStatus === "LIGADO" ? "Ativado" : "Desativado") + "!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "erro", 
        mensagem: "Aba de configurações não encontrada." 
      })).setMimeType(ContentService.MimeType.JSON);
    }


  // ==========================================
  // ROTA 34: SALVAR AVATAR DO ALUNO
  // ==========================================
    if (action === "salvar_avatar") {
      const matricula = String(dadosApp.matricula).trim();
      const avatarId = String(dadosApp.avatarId).trim();
      const abaTrilha = planilha.getSheetByName("trilhatech");

      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matricula) {
            // Salva o ID do Avatar na Coluna I (índice 9)
            abaTrilha.getRange(i + 1, 9).setValue(avatarId); 
            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso" })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado." })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 35: CURTIR PERFIL DO COLEGA (1x ao dia)
  // ==========================================
    if (action === "curtir_perfil") {
      const matriculaRemetente = String(dadosApp.matriculaRemetente).trim();
      const matriculaDestinatario = String(dadosApp.matriculaDestinatario).trim();

      if (matriculaRemetente === matriculaDestinatario) {
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você não pode curtir o próprio perfil!" })).setMimeType(ContentService.MimeType.JSON);
      }

      // Cria a aba de curtidas se não existir
      let abaCurtidas = planilha.getSheetByName("curtidas");
      if (!abaCurtidas) {
        abaCurtidas = planilha.insertSheet("curtidas");
        abaCurtidas.appendRow(["ID_CURTIDA", "REMETENTE", "DESTINATARIO", "DATA"]);
      }

      const timezone = Session.getScriptTimeZone();
      const dataHoje = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");

      // Regra de Ouro: Verifica se o Remetente JÁ CURTIU o Destinatário HOJE
      const dadosCurtidas = abaCurtidas.getDataRange().getValues();
      for (let i = 1; i < dadosCurtidas.length; i++) {
        let rem = String(dadosCurtidas[i][1]).trim();
        let dest = String(dadosCurtidas[i][2]).trim();
        let dataBruta = dadosCurtidas[i][3];
        let dataStr = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

        if (rem === matriculaRemetente && dest === matriculaDestinatario && dataStr === dataHoje) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você já curtiu o perfil desta Lenda hoje. Volte amanhã!" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Se passou no teste, registra a curtida no banco
      const idCurtida = "LIKE-" + new Date().getTime();
      abaCurtidas.appendRow([idCurtida, matriculaRemetente, matriculaDestinatario, dataHoje]);

      // Soma +1 Curtida no perfil do destinatário (Aba trilhatech, Coluna J / Índice 10)
      const abaTrilha = planilha.getSheetByName("trilhatech");
      if (abaTrilha) {
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          if (String(dadosTrilha[i][0]).trim() === matriculaDestinatario) {
            let curtidasAtuais = Number(dadosTrilha[i][9]) || 0;
            abaTrilha.getRange(i + 1, 10).setValue(curtidasAtuais + 1);
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Perfil curtido com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
    }

  // ==========================================
  // ROTA 36: BUSCAR PERFIL PÚBLICO (O Mural do Aluno)
  // ==========================================
    if (action === "buscar_perfil_publico") {
      const matriculaAlvo = String(dadosApp.matriculaAlvo).trim();
      const matriculaVisualizador = String(dadosApp.matriculaVisualizador).trim(); 

      const planBase = planilha.getSheetByName("basededados");
      const abaTrilha = planilha.getSheetByName("trilhatech");
      const abaEntregas = planilha.getSheetByName("entregas");
      const abaCurtidas = planilha.getSheetByName("curtidas");
      const abaFrequencia = planilha.getSheetByName("frequencia");

      if (!planBase || !abaTrilha) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

      let perfil = {
        matricula: matriculaAlvo, nome: "", turma: "",
        xpTotal: 0, nivel: "Hello World", avatar: "avatar-padrao", totalCurtidas: 0,
        jaCurtiuHoje: false, missoesConcluidas: 0,
        pixEnviado: 0, pixRecebido: 0, badges: [],
        ofensivaDias: 0
      };

      // 1. Busca Nome
      const dadosBase = planBase.getDataRange().getValues();
      for (let i = 1; i < dadosBase.length; i++) {
        if (String(dadosBase[i][2]).trim() === matriculaAlvo) { perfil.nome = String(dadosBase[i][0]); break; }
      }

      // 2. Busca Turma, XP, Nível, Avatar e Curtidas Totais
      const dadosTrilha = abaTrilha.getDataRange().getValues();
      for (let i = 1; i < dadosTrilha.length; i++) {
        if (String(dadosTrilha[i][0]).trim() === matriculaAlvo) {
          perfil.turma = String(dadosTrilha[i][1]).trim();
          perfil.xpTotal = Number(dadosTrilha[i][4]) || 0;
          perfil.nivel = String(dadosTrilha[i][5]).trim() || "Hello World";
          perfil.avatar = String(dadosTrilha[i][8]).trim() || "avatar-padrao";
          perfil.totalCurtidas = Number(dadosTrilha[i][9]) || 0;
          break;
        }
      }

      // 3. Calcula as vitórias na aba Entregas (Pix, Missões e Badges)
      if (abaEntregas) {
        const dadosEntregas = abaEntregas.getDataRange().getValues();
        let missoesUnicas = new Set();
        for (let i = 1; i < dadosEntregas.length; i++) {
          let idEntrega = String(dadosEntregas[i][0]).trim();
          let matRow = String(dadosEntregas[i][1]).trim();

          if (matRow === matriculaAlvo) {
            if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) perfil.pixRecebido += Number(dadosEntregas[i][5]) || 0;
            if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) perfil.pixEnviado += Math.abs(Number(dadosEntregas[i][5]) || 0);
            if (idEntrega.startsWith("BADGE-")) {
              let nomeBadge = String(dadosEntregas[i][3]).replace("Desbloqueou: ", "").trim();
              perfil.badges.push(nomeBadge);
            }
            // Conta as missões concluídas ignorando PIX, BDAY, BLOCK, etc.
            if (!idEntrega.startsWith("PIX") && !idEntrega.startsWith("BDAY") && !idEntrega.startsWith("BADGE") && !idEntrega.startsWith("BLOCK") && String(dadosEntregas[i][4]) !== "Pendente") {
              missoesUnicas.add(String(dadosEntregas[i][2]));
            }
          }
        }
        perfil.missoesConcluidas = missoesUnicas.size;
      }

      // 4. Verifica o botão de curtir (Para desabilitar se já curtiu hoje ou se for ele mesmo)
      if (matriculaVisualizador === matriculaAlvo) {
        perfil.jaCurtiuHoje = true; 
      } else if (abaCurtidas) {
        const timezone = Session.getScriptTimeZone();
        const dataHoje = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");
        const dadosCurtidas = abaCurtidas.getDataRange().getValues();
        for (let i = 1; i < dadosCurtidas.length; i++) {
          let rem = String(dadosCurtidas[i][1]).trim();
          let dest = String(dadosCurtidas[i][2]).trim();
          let dataBruta = dadosCurtidas[i][3];
          let dataStr = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

          if (rem === matriculaVisualizador && dest === matriculaAlvo && dataStr === dataHoje) {
            perfil.jaCurtiuHoje = true; break;
          }
        }
      }

      // 5. CÁLCULO DE OFENSIVA PARA O PERFIL PÚBLICO
      if (abaFrequencia && perfil.turma) {
        let alunosDaMesmaTurma = new Set();
        const dadosTrilhaAux = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilhaAux.length; i++) {
            if (String(dadosTrilhaAux[i][1]).trim() === perfil.turma && String(dadosTrilhaAux[i][2]).trim().toLowerCase() === "ativo") {
                alunosDaMesmaTurma.add(String(dadosTrilhaAux[i][0]).trim());
            }
        }
        let diasComAulaSet = new Set();
        let checkinsMap = {};
        const timezone = Session.getScriptTimeZone();
        const dadosFreq = abaFrequencia.getDataRange().getValues();
        for (let i = 1; i < dadosFreq.length; i++) {
            let idCheckin = String(dadosFreq[i][0]).trim();
            if (idCheckin.startsWith("BDAY")) continue;
            let mat = String(dadosFreq[i][1]).trim();
            let dataBruta = dadosFreq[i][3];
            let hora = String(dadosFreq[i][4]).trim();
            let dataFormatada = dataBruta instanceof Date ? Utilities.formatDate(dataBruta, timezone, "dd/MM/yyyy") : String(dataBruta).trim();

            if (alunosDaMesmaTurma.has(mat)) diasComAulaSet.add(dataFormatada);
            if (mat === matriculaAlvo && (hora !== "00:00:00" && hora !== "00:00" && hora !== "")) {
                checkinsMap[dataFormatada] = true;
            }
        }
        let diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
            let pA = String(a).split('/'); let pB = String(b).split('/');
            return new Date(pB[2], pB[1]-1, pB[0]).getTime() - new Date(pA[2], pA[1]-1, pA[0]).getTime();
        });
        let streak = 0;
        const dataHojeStr = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");
        for (let dia of diasOrdenados) {
            if (dia === dataHojeStr && !checkinsMap[dia]) continue;
            if (checkinsMap[dia]) streak++;
            else break;
        }
        perfil.ofensivaDias = streak;
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", perfil: perfil })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: erro.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
  }

// ==========================================
// GATILHO AUTOMÁTICO (Vigia edições manuais na Planilha)
// ==========================================
function onEdit(e) {
  if (!e) return;
  const aba = e.source.getActiveSheet();
  
  // Verifica se a edição foi na aba "trilhatech" e na Coluna C (Status = Coluna 3)
  if (aba.getName() === "trilhatech" && e.range.getColumn() === 3) {
    const linha = e.range.getRow();
    
    // Ignora a linha 1 (Cabeçalho)
    if (linha > 1) {
      const novoStatus = String(e.value).trim().toLowerCase();
      
      // Se você digitar "Desistente" (com maiúscula ou minúscula, não importa)
      if (novoStatus === "desistente") {
        
        // 1. Zera o XP do aluno na Coluna E (Coluna 5)
        aba.getRange(linha, 5).setValue(0);
        
        // 2. Já preenche a Data de Mudança de Status na Coluna D (Coluna 4) automaticamente!
        const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
        aba.getRange(linha, 4).setValue(dataAtual);
      }
    }
  }
}