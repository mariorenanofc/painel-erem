function doGet(e) {
  const dados = lerComCacheSeguro("basededados", 1800);
  const dadosTrilha = lerComCacheSeguro("trilhatech", 60);
  
  let trilhaMap = {}; // Dicionário inteligente para busca rápida
  
  if (dadosTrilha && dadosTrilha.length > 0) {
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
    } else if (typeof dataNascFormatada === "string" && dataNascFormatada.includes("/")) {
      let partes = dataNascFormatada.split("/");
      if (partes.length === 3) {
        dataNascFormatada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
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
    // 🛡️ SISTEMA DE SEGURANÇA (FIREWALL)
    // ==========================================
    const ROTAS_PROTEGIDAS = [
      "salvar_atividade", "excluir_atividade", "avaliar_entrega", 
      "injetar_xp_manual", "cadastrar_aluno", "inscrever_trilhatech", 
      "mudar_status_trilha", "atualizar_senha_lousa", "alternar_modo_reposicao",
      "salvar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote", "sincronizar_ava"
    ];
    
    // A nossa "Chave Mestra" que só o Painel do Tutor conhece
    const TOKEN_TUTOR = "TrilhaTech_Seguranca_Total_2026"; 

    // Se a ação for uma rota de professor, exige a chave!
    if (ROTAS_PROTEGIDAS.includes(action)) {
      if (dadosApp.token !== TOKEN_TUTOR) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "erro", 
          mensagem: "⛔ ALERTA DE SEGURANÇA: Tentativa de fraude bloqueada! O seu IP foi registado." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
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
        var dataNascDigitada = String(dadosApp.dataNasc).trim(); // Formato vindo do Front: YYYY-MM-DD
        
        // 🔥 MÁGICA DA DATA: Cria as variações da data para garantir que o login funcione sempre
        var dataNascInvertida = ""; // DD-MM-YYYY
        var dataNascBarra = "";     // DD/MM/YYYY
        
        if (dataNascDigitada.includes("-")) {
          var partes = dataNascDigitada.split("-");
          dataNascInvertida = partes[2] + "-" + partes[1] + "-" + partes[0]; 
          dataNascBarra = partes[2] + "/" + partes[1] + "/" + partes[0];     
        }
        
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
              // Você pode manter o formato visual que desejar aqui
              dataNascPlanilha = Utilities.formatDate(dataNascBruta, timezone, "dd-MM-yyyy");
            } else {
              dataNascPlanilha = String(dataNascBruta).trim();
            }
            
            // 🛡️ COMPARAÇÃO BLINDADA: Aceita a data do HTML, a invertida com traço ou com barra!
            if (dataNascPlanilha === dataNascDigitada || 
                dataNascPlanilha === dataNascInvertida || 
                dataNascPlanilha === dataNascBarra || 
                dataNascPlanilha.includes(dataNascDigitada) ||
                dataNascPlanilha.includes(dataNascInvertida)) {
                
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
        
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          
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
            bd.getRange(linhaBD, 1, 1, 8).setValues([[nome, dataNasc, matriculaDigitada, email, turma, telefoneAluno, telefoneResponsavel, obs]]);
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
              abaTurma.getRange(linhaTurma, 2, 1, 8).setValues([[nome, dataNasc, matriculaDigitada, email, turma, telefoneAluno, telefoneResponsavel, obs]]);
            } else {
              const proximoNumero = dadosTurma.length; 
              abaTurma.appendRow([proximoNumero, nome, dataNasc, matriculaDigitada, email, turma, telefoneAluno, telefoneResponsavel, obs]);
            }
          }
          invalidarCacheGeral();
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Salvo com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao salvar aluno. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

      if (action === "inscrever_trilhatech") {
        const matricula = String(dadosApp.matricula).trim();
        const turmaCurso = dadosApp.turmaCurso;
        const statusCurso = dadosApp.statusCurso;
        const dataAtual = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}).split(',')[0]; 
        
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          
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
          
          // Invalida cache de trilhatech
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
          for (let i = 0; i < 15; i++) keys.push("CACHE_trilhatech_" + i);
          cache.removeAll(keys);
          
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Inscrição realizada com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao inscrever. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 5: MUDAR STATUS NO TRILHA TECH
    // ==========================================
      if (action === "mudar_status_trilhatech") {
        const matricula = String(dadosApp.matricula).trim();
        const novoStatus = dadosApp.novoStatus; // Ex: "Ativo", "Reserva", "Desistente"
        const dataAtual = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}).split(',')[0];
        
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          
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
              if (String(novoStatus).trim().toLowerCase() === "desistente") {
                abaTrilha.getRange(linha, 3, 1, 3).setValues([[novoStatus, dataAtual, 0]]);
              } else {
                abaTrilha.getRange(linha, 3, 1, 2).setValues([[novoStatus, dataAtual]]);
              }
              
              // Invalida cache de trilhatech
              const cache = CacheService.getScriptCache();
              let keys = ["CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
              for (let i = 0; i < 15; i++) keys.push("CACHE_trilhatech_" + i);
              cache.removeAll(keys);

              return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `Status atualizado para ${novoStatus}!` })).setMimeType(ContentService.MimeType.JSON);
          } else {
              return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Matrícula não encontrada no curso." })).setMimeType(ContentService.MimeType.JSON);
          }
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao atualizar status. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }
      
    // ==========================================
    // ROTA 6: BUSCAR ATIVIDADES DO ALUNO
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
                dataEnvio: Number(dadosEntregas[i][6]) || 0, 
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
                linkClassroom: String(dadosAtiv[i][12] || ""), // <-- ENVIA O LINK CLASSROOM
                imageUrl: String(dadosAtiv[i][14] || ""),
                modulo: String(dadosAtiv[i][15] || "Geral")
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
            const linkClassroom = String(dadosApp.linkClassroom || "").trim(); 
            const statusPublicacao = String(dadosApp.statusPublicacao || "Publicada").trim(); 
            const imagemUrl = String(dadosApp.imagemUrl || "").trim();
            const modulo = String(dadosApp.modulo || "Geral").trim();

            const lock = LockService.getScriptLock();
            try {
              lock.waitLock(15000);
              
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
                  abaAtividades.getRange(linhaEdit, 2, 1, 17).setValues([[
                    titulo, 
                    descricao, 
                    dataLimite, 
                    xp, 
                    turmaAlvo, 
                    tipo, 
                    opcaoA, 
                    opcaoB, 
                    opcaoC, 
                    opcaoD, 
                    respostaCorreta, 
                    linkClassroom, 
                    statusPublicacao, 
                    imagemUrl, 
                    modulo, 
                    String(dadosApp.gabarito || ""), 
                    dadosApp.gabaritoLiberado ? true : false
                  ]]);
                  invalidarCacheGeral();
                  return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão atualizada!" })).setMimeType(ContentService.MimeType.JSON);
                } else {
                  return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Missão não encontrada para edição." })).setMimeType(ContentService.MimeType.JSON);
                }
              } else {
                // MODO CRIAÇÃO: Lógica Blindada de ID Sequencial
                const dadosAtuais = abaAtividades.getDataRange().getValues();
                let maiorId = 0;

                // Varre todas as linhas (pulando o cabeçalho) para achar o maior número de ATIV
                for (let i = 1; i < dadosAtuais.length; i++) {
                  let idAtualStr = String(dadosAtuais[i][0]).trim(); // Pega o ID da Coluna A
                  if (idAtualStr.startsWith("ATIV-")) {
                    // Extrai só o número (ex: de "ATIV-015" tira o 15)
                    let numId = parseInt(idAtualStr.replace("ATIV-", ""), 10);
                    if (!isNaN(numId) && numId > maiorId) {
                      maiorId = numId;
                    }
                  }
                }

                // O próximo ID é sempre o maior número encontrado + 1
                const proximoNumero = maiorId + 1;
                const numeroIdStr = proximoNumero.toString().padStart(3, '0');
                const idGerado = "ATIV-" + numeroIdStr;

                // Grava a nova linha
                abaAtividades.appendRow([idGerado, titulo, descricao, dataLimite, xp, turmaAlvo, tipo, opcaoA, opcaoB, opcaoC, opcaoD, respostaCorreta, linkClassroom, statusPublicacao, imagemUrl, modulo, String(dadosApp.gabarito || ""), dadosApp.gabaritoLiberado ? true : false]);
                invalidarCacheGeral();
                return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão criada! ID: " + idGerado })).setMimeType(ContentService.MimeType.JSON);
              }
            } catch (e) {
              return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao salvar missão. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
            } finally {
              lock.releaseLock();
            }
      }

    // ==========================================
    // ROTA 8: BUSCAR TODAS ATIVIDADES (Professor)
    // ==========================================
      if (action === "buscar_todas_atividades") {
      
        const filtroTurma = String(dadosApp.filtroTurma || "Todas").trim();
        const filtroTipo = String(dadosApp.filtroTipo || "Todos").trim();
        
        const abaAtividades = planilha.getSheetByName("atividades");
        const abaEntregas = planilha.getSheetByName("entregas");

        // 🔥 1. LÊ A NOVA ABA DE MÓDULOS (E CRIA A LISTA)
        const abaModulos = planilha.getSheetByName("controle_modulos");
        let statusModulosMap = {};
        let listaModulos = []; 
        if (abaModulos) {
          const dadosModulos = abaModulos.getDataRange().getValues();
          for (let i = 1; i < dadosModulos.length; i++) {
            let nomeMod = String(dadosModulos[i][0]).trim();
            let statusMod = String(dadosModulos[i][1]).trim();
            let turmaMod = String(dadosModulos[i][2] || "Todas").trim();
            if (nomeMod) {
              statusModulosMap[nomeMod + "|" + turmaMod] = statusMod;
              if (listaModulos.indexOf(nomeMod) === -1) listaModulos.push(nomeMod);
            }
          }
        }

        // 🔥 2. MAPA DE PENDÊNCIAS (Para o alerta vermelho)
        let pendentesMap = {};
        if (abaEntregas) {
          const dadosEntregas = abaEntregas.getDataRange().getValues();
          for (let i = 1; i < dadosEntregas.length; i++) {
            let statusEntrega = String(dadosEntregas[i][4]).trim();
            if (statusEntrega === "Aguardando Correção") {
              let idAtiv = String(dadosEntregas[i][2]).trim();
              pendentesMap[idAtiv] = (pendentesMap[idAtiv] || 0) + 1;
            }
          }
        }

        // 🔥 3. LÊ E FILTRA AS ATIVIDADES
        let atividades = [];
        if (abaAtividades) {
          const dadosAtiv = abaAtividades.getDataRange().getValues();
          for (let i = 1; i < dadosAtiv.length; i++) {
            let idAtiv = String(dadosAtiv[i][0]).trim();
            if (!idAtiv || idAtiv === "ID") continue;

            let turmaAtiv = String(dadosAtiv[i][5] || "Todas").trim();
            let tipoAtiv = String(dadosAtiv[i][6] || "Projeto").trim();

            // Aplica os filtros do painel do tutor
            if (filtroTurma !== "Todas" && turmaAtiv !== "Todas" && turmaAtiv !== filtroTurma) continue;
            if (filtroTipo !== "Todos" && tipoAtiv !== filtroTipo) continue;

            let dataLimiteBruta = dadosAtiv[i][3];
            let dataLimiteStr = dataLimiteBruta instanceof Date ? Utilities.formatDate(dataLimiteBruta, Session.getScriptTimeZone(), "dd-MM-yyyy") : String(dataLimiteBruta);
            
            let statusPub = String(dadosAtiv[i][13] || "Publicada").trim();
            let nomeModulo = String(dadosAtiv[i][15] || "Geral").trim();

            atividades.push({
              id: idAtiv,
              titulo: String(dadosAtiv[i][1]),
              descricao: String(dadosAtiv[i][2]),
              dataLimite: dataLimiteStr,
              xp: dadosAtiv[i][4],
              turmaAlvo: turmaAtiv,
              tipo: tipoAtiv,
              opcaoA: String(dadosAtiv[i][7] || ""),
              opcaoB: String(dadosAtiv[i][8] || ""),
              opcaoC: String(dadosAtiv[i][9] || ""),
              opcaoD: String(dadosAtiv[i][10] || ""),
              respostaCorreta: String(dadosAtiv[i][11] || "A"),
              linkClassroom: String(dadosAtiv[i][12] || ""),
              statusPublicacao: statusPub,
              imagemUrl: String(dadosAtiv[i][14] || ""),
              modulo: nomeModulo,
              gabarito: String(dadosAtiv[i][16] || ""),
              gabaritoLiberado: dadosAtiv[i][17] === true || String(dadosAtiv[i][17]).toLowerCase() === "true",
              pendentes: pendentesMap[idAtiv] || 0,
              statusModulo: statusModulosMap[nomeModulo + "|" + turmaAtiv] || statusModulosMap[nomeModulo + "|Todas"] || "Aberto"
            });
          }
        }

        // 🔥 4. DEVOLVE A LISTA DE ATIVIDADES E OS MÓDULOS!
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "sucesso", 
          atividades: atividades,
          modulosMatriz: listaModulos
        })).setMimeType(ContentService.MimeType.JSON);
      }  
      
    // ==========================================
    // ROTA 9: ENVIAR ATIVIDADE (BLINDADA CONTRA DUPLO CHECK-IN)
    // ==========================================
      if (action === "enviar_atividade") {
        const matricula = String(dadosApp.matricula).trim();
        const idAtividade = String(dadosApp.idAtividade).trim();
        const resposta = String(dadosApp.resposta).trim();
        const timestampAtual = new Date().getTime();

        // 1. LEITURA 100% VIA CACHE (Sem estourar a cota da API do Sheets)
        let dadosAtiv = lerComCacheSeguro("atividades", 300);
        let dadosModulos = lerComCacheSeguro("controle_modulos", 900);
        const dadosEntregas = lerComCacheSeguro("entregas", 60);
        const dadosTrilha = lerComCacheSeguro("trilhatech", 60);

        let linhaExistente = -1;
        let statusAtualBD = "";
        let xpAnterior = 0;
        let ehEntregaClassroom = false;

        for (let i = 1; i < dadosEntregas.length; i++) {
            if (String(dadosEntregas[i][1]).trim() === matricula && String(dadosEntregas[i][2]).trim() === idAtividade) {
                linhaExistente = i + 1;
                statusAtualBD = String(dadosEntregas[i][4]).trim().toLowerCase();
                xpAnterior = Number(dadosEntregas[i][5]) || 0;
                if (String(dadosEntregas[i][7]).toLowerCase().includes("classroom") || String(dadosEntregas[i][7]).toLowerCase().includes("ava")) ehEntregaClassroom = true;
                break;
            }
        }

        if (ehEntregaClassroom) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você não precisa entregar por aqui! O sistema já avaliou automaticamente pelo Classroom. 🤖" })).setMimeType(ContentService.MimeType.JSON);
        if (linhaExistente > 0 && statusAtualBD !== "devolvida") return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você já enviou esta missão! Não é possível reenviar." })).setMimeType(ContentService.MimeType.JSON);

        let ativXp = 0; let ativTipo = "Projeto"; let ativRespostaCorreta = ""; 
        let moduloAtiv = ""; let turmaAlvoAtiv = ""; let dataLimObj = null;
        let linkClassroom = ""; let isGabaritoLiberado = false;

        for (let i = 1; i < dadosAtiv.length; i++) {
            if (String(dadosAtiv[i][0]).trim() === idAtividade) {
                ativXp = Number(dadosAtiv[i][4]) || 0;
                turmaAlvoAtiv = String(dadosAtiv[i][5]).trim().toLowerCase();
                ativTipo = String(dadosAtiv[i][6]).trim();
                ativRespostaCorreta = String(dadosAtiv[i][11]).trim();
                moduloAtiv = String(dadosAtiv[i][15]).trim().toLowerCase();
                linkClassroom = String(dadosAtiv[i][12] || "").trim();
                isGabaritoLiberado = dadosAtiv[i][17] === true || String(dadosAtiv[i][17]).toLowerCase() === "true";
                
                let strDate = String(dadosAtiv[i][3]).trim();
                if (strDate.includes("-")) {
                    let p = strDate.split("T")[0].split("-");
                    if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
                } else if (strDate.includes("/")) {
                    let p = strDate.split("/");
                    if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                }
                if (dataLimObj) dataLimObj.setHours(0,0,0,0);
                break;
            }
        }

        let xpFinalPermitido = ativXp;
        for (let i = 1; i < dadosModulos.length; i++) {
            let nomeModBD = String(dadosModulos[i][0]).trim().toLowerCase();
            let statusModBD = String(dadosModulos[i][1]).trim().toLowerCase();
            let turmaModBD = String(dadosModulos[i][2]).trim().toLowerCase();
            
            if (nomeModBD === moduloAtiv && (turmaModBD === turmaAlvoAtiv || turmaModBD === "todas")) {
                if (statusModBD === "encerrado") xpFinalPermitido = 0;
                break;
            }
        }

        let atrasoDias = 0;
        if (dataLimObj) {
            let hoje = new Date(); hoje.setHours(0,0,0,0);
            if (hoje > dataLimObj) atrasoDias = Math.ceil(Math.abs(hoje - dataLimObj) / (1000 * 60 * 60 * 24));
        }

        let statusFinal = "Aguardando Correção";
        let xpGanhoFinal = 0;
        let msgDesconto = "";
        let isCorreto = (ativTipo === "Material") ? true : (resposta === ativRespostaCorreta);

        // Se a atividade possui link do Classroom, entra como "Aguardando Validação" no portal
        if (linkClassroom && linkClassroom.includes("classroom.google.com")) {
            statusFinal = "Aguardando Validação";
            xpGanhoFinal = 0;
        } else {
            if (ativTipo === "Quiz" || ativTipo === "Material") {
                statusFinal = "Avaliado";
                if (isCorreto) {
                    if (xpFinalPermitido > 0) {
                        let descontoAtraso = 0;
                        if (atrasoDias > 0) {
                            let teto = Math.floor(xpFinalPermitido / 2); 
                            descontoAtraso = atrasoDias; 
                            if (descontoAtraso > teto) descontoAtraso = teto;
                        }
                        
                        let descontoGabarito = 0;
                        if (atrasoDias > 0 && isGabaritoLiberado) {
                            descontoGabarito = Math.floor(ativXp * 0.3);
                        }
                        
                        let descontoTotal = descontoAtraso + descontoGabarito;
                        xpGanhoFinal = xpFinalPermitido - descontoTotal;
                        
                        let piso = Math.ceil(ativXp * 0.1);
                        if (xpGanhoFinal < piso) xpGanhoFinal = piso;

                        if (descontoTotal > 0) {
                            let msgs = [];
                            if (descontoAtraso > 0) msgs.push(`-${descontoAtraso} XP por atraso`);
                            if (descontoGabarito > 0) msgs.push(`-30% por gabarito liberado`);
                            msgDesconto = ` (${msgs.join(", ")})`;
                        }
                    } else {
                        xpGanhoFinal = 0;
                        msgDesconto = " (0 XP: O módulo desta atividade já foi encerrado!)";
                    }
                }
            }
        }

        let linhaTrilhaAluno = -1;
        for (let t = 1; t < dadosTrilha.length; t++) {
            if (String(dadosTrilha[t][0]).trim() === matricula) {
                linhaTrilhaAluno = t + 1;
                break;
            }
        }

        // 3. TRANCA O SERVIDOR APENAS PARA ESCREVER (Chama as abas SÓ AQUI)
        const lock = LockService.getScriptLock();
        try {
            lock.waitLock(25000); 
            
            const abaEntregas = planilha.getSheetByName("entregas");
            const abaTrilha = planilha.getSheetByName("trilhatech");

            if (!abaEntregas || !abaTrilha) throw new Error("Planilhas não acessíveis.");

            if (linhaExistente > 0) {
                abaEntregas.getRange(linhaExistente, 4, 1, 4).setValues([[resposta, statusFinal, xpGanhoFinal, timestampAtual]]);
            } else {
                abaEntregas.appendRow([idAtividade + "-" + matricula, matricula, idAtividade, resposta, statusFinal, xpGanhoFinal, timestampAtual, ""]);
            }

            if (xpGanhoFinal > 0 && linhaTrilhaAluno > -1) {
                let xpAtualReal = Number(abaTrilha.getRange(linhaTrilhaAluno, 5).getValue()) || 0;
                abaTrilha.getRange(linhaTrilhaAluno, 5).setValue(xpAtualReal - xpAnterior + xpGanhoFinal);
            }

            // LIMPA O CACHE DE FORMA EFICIENTE 
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_entregas", "CACHE_entregas_CHUNKS", "CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
            for (let i=0; i<10; i++) { keys.push("CACHE_entregas_"+i); keys.push("CACHE_trilhatech_"+i); }
            cache.removeAll(keys);

            let msgRetorno = (ativTipo === "Quiz" && xpGanhoFinal > 0) ? "Resposta correta! XP adicionado." + msgDesconto : (ativTipo === "Quiz" && xpGanhoFinal === 0 && isCorreto) ? "Você acertou o Quiz, mas não ganhou XP." + msgDesconto : (ativTipo === "Quiz" && xpGanhoFinal === 0 && !isCorreto) ? "Resposta errada. Mas o Tutor pode rever depois!" : "Missão enviada com sucesso!";

            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: msgRetorno })).setMimeType(ContentService.MimeType.JSON);

        } catch (e) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor estabilizando fila. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
            lock.releaseLock(); 
        }
      }

    // ==========================================
    // ROTA 10: EXCLUIR ATIVIDADE (Professor)
    // ==========================================
      if (action === "excluir_atividade") {
        const idAtiv = String(dadosApp.idAtividade).trim();
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          const abaAtividades = planilha.getSheetByName("atividades");
          if (abaAtividades) {
            const dados = abaAtividades.getDataRange().getValues();
            // Começa do fim para não quebrar a ordem ao deletar
            for (let i = dados.length - 1; i >= 1; i--) {
              if (String(dados[i][0]).trim() === idAtiv) {
                abaAtividades.deleteRow(i + 1);
                invalidarCacheGeral();
                return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Missão excluída!" })).setMimeType(ContentService.MimeType.JSON);
              }
            }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Atividade não encontrada." })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao excluir atividade. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
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
                dataEnvio: Number(dadosEntregas[i][6] || 0),
                feedback: String(dadosEntregas[i][7] || "") // <--- LÊ A COLUNA H (FEEDBACK)
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
        const feedbackTutor = String(dadosApp.feedback || "").trim();

        // Se for devolvida, o XP tem que ser 0 obrigatoriamente
        if (novoStatus === "Devolvida") xpGanhoTutor = 0;

        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(20000);
          
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
            abaEntregas.getRange(linhaEntrega, 5, 1, 2).setValues([[novoStatus, xpGanhoFinal]]);
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
                let novoXpTotal = xpTotalAtual - xpAnterior + xpGanhoFinal;
                abaTrilha.getRange(i + 1, 5).setValue(novoXpTotal);
                break;
              }
            }
          }
          
          // Invalida cache de entregas e trilhatech
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_entregas", "CACHE_entregas_CHUNKS", "CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
          for (let i = 0; i < 15; i++) {
            keys.push("CACHE_entregas_" + i);
            keys.push("CACHE_trilhatech_" + i);
          }
          cache.removeAll(keys);

          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: (novoStatus === "Devolvida" ? "Missão devolvida para refazer!" : "Avaliação salva!") + msgDesconto })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao avaliar entrega. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
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

        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          
          const bd = planilha.getSheetByName("basededados");
          let atualizado = false;

          // 1. Atualiza na aba Geral (basededados)
          if (bd) {
            const dadosBD = bd.getDataRange().getValues();
            for (let i = 1; i < dadosBD.length; i++) {
              if (String(dadosBD[i][2]).trim() === matricula) {
                bd.getRange(i + 1, 6, 1, 2).setValues([[telefoneAluno, telefoneResponsavel]]);
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
                abaTurma.getRange(i + 1, 7, 1, 2).setValues([[telefoneAluno, telefoneResponsavel]]);
                break;
              }
            }
          }

          if (atualizado) {
            // Invalida cache de basededados
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_basededados", "CACHE_basededados_CHUNKS"];
            for (let i = 0; i < 15; i++) keys.push("CACHE_basededados_" + i);
            cache.removeAll(keys);
            
            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Contatos updated com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
          } else {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro ao tentar salvar contatos." })).setMimeType(ContentService.MimeType.JSON);
          }
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao atualizar contatos. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 14: FAZER CHECK-IN DE PRESENÇA (BLINDADO)
    // ==========================================
      if (action === "fazer_checkin") {
          const matricula = String(dadosApp.matricula).trim();
          const senhaInformada = String(dadosApp.senha).trim();
          const timezone = Session.getScriptTimeZone();
          const agora = new Date();
          const dataHoje = Utilities.formatDate(agora, timezone, "dd/MM/yyyy");
          const horaAtual = Utilities.formatDate(agora, timezone, "HH:mm:ss");
          const diaSemana = Number(Utilities.formatDate(agora, timezone, "u"));

          // 1. LEITURA RÁPIDA FORA DO LOCK
          const dadosConf = lerComCacheSeguro("configuracoes", 1800);
          const dadosTrilha = lerComCacheSeguro("trilhatech", 60);
          const dadosFreq = lerComCacheSeguro("frequencia", 60);
          const dadosBase = lerComCacheSeguro("basededados", 1800);

          let senhaCorreta = ""; let modoReposicao = "DESLIGADO";
          for (let i = 1; i < dadosConf.length; i++) {
            if (String(dadosConf[i][0]).trim() === "SENHA_CHECKIN") senhaCorreta = String(dadosConf[i][1]).trim();
            if (String(dadosConf[i][0]).trim() === "MODO_REPOSICAO") modoReposicao = String(dadosConf[i][1]).trim().toUpperCase();
          }

          if (!senhaCorreta || senhaInformada.toUpperCase() !== senhaCorreta.toUpperCase()) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Senha incorreta ou não configurada!" })).setMimeType(ContentService.MimeType.JSON);
          }

          let turmaDoAluno = ""; let linhaTrilhaAluno = -1; let xpAtual = 0;
          for (let i = 1; i < dadosTrilha.length; i++) {
            if (String(dadosTrilha[i][0]).trim() === matricula) {
              turmaDoAluno = String(dadosTrilha[i][1]).trim();
              linhaTrilhaAluno = i + 1;
              xpAtual = Number(dadosTrilha[i][4]) || 0;
              break;
            }
          }

          if (linhaTrilhaAluno === -1) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado." })).setMimeType(ContentService.MimeType.JSON);

          if (modoReposicao !== "LIGADO") {
            if ((turmaDoAluno.includes("1º") || turmaDoAluno.includes("1 ANO")) && diaSemana !== 1 && diaSemana !== 3) {
                return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Hoje não é dia de aula para o 1º Ano." })).setMimeType(ContentService.MimeType.JSON);
            } else if ((turmaDoAluno.includes("2º") || turmaDoAluno.includes("2 ANO")) && diaSemana !== 2 && diaSemana !== 4) {
                return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Hoje não é dia de aula para o 2º Ano." })).setMimeType(ContentService.MimeType.JSON);
            }
          }

          let alunosDaMesmaTurma = new Set();
          for (let i = 1; i < dadosTrilha.length; i++) {
              if (String(dadosTrilha[i][1]).trim() === turmaDoAluno && String(dadosTrilha[i][2]).trim().toLowerCase() === "ativo") {
                  alunosDaMesmaTurma.add(String(dadosTrilha[i][0]).trim());
              }
          }

          let diasComAulaSet = new Set();
          let presencasAluno = 0;
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

          let xpGanho = 10; let msgFogo = "";
          if (taxa >= 90) { xpGanho = 15; msgFogo = " 🔥 Ofensiva Alta!"; }
          else if (taxa >= 75) { xpGanho = 12; msgFogo = " ⚡ Ofensiva Média!"; }

          let nomeAluno = "Aluno";
          for (let i = 1; i < dadosBase.length; i++) {
            if (String(dadosBase[i][2]).trim() === matricula) { nomeAluno = String(dadosBase[i][0]); break; }
          }

          // 2. LOCK CIRÚRGICO APENAS PARA ESCREVER
          const lock = LockService.getScriptLock();
          try {
            lock.waitLock(15000); 
            const planilha = SpreadsheetApp.getActiveSpreadsheet(); // Abre só aqui
            const abaTrilha = planilha.getSheetByName("trilhatech");
            const abaFrequencia = planilha.getSheetByName("frequencia");

            const idCheckin = "CHK-" + agora.getTime();
            abaFrequencia.appendRow([idCheckin, matricula, nomeAluno, dataHoje, horaAtual, xpGanho]);
            
            let xpAtualReal = Number(abaTrilha.getRange(linhaTrilhaAluno, 5).getValue()) || 0;
            abaTrilha.getRange(linhaTrilhaAluno, 5).setValue(xpAtualReal + xpGanho);

            // Invalida cache de frequencia e trilhatech
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_frequencia", "CACHE_frequencia_CHUNKS", "CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
            for (let i = 0; i < 15; i++) {
              keys.push("CACHE_frequencia_" + i);
              keys.push("CACHE_trilhatech_" + i);
            }
            cache.removeAll(keys);

            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `Check-in realizado! +${xpGanho} XP garantidos.${msgFogo}` })).setMimeType(ContentService.MimeType.JSON);

          } catch (e) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Sistema processando muitos check-ins. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
          } finally {
            lock.releaseLock(); 
          }
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
          let status = String(dadosTrilha[i][2]).trim().toLowerCase(); // Lendo a Coluna 3 corretamente

          // Somente alunos ativos que pertencem à turma selecionada
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
          let status = String(dadosTrilha[i][2]).trim().toLowerCase(); 
          let xpTotalFolha = Number(dadosTrilha[i][4]) || 0;
          let avatarSheet = String(dadosTrilha[i][8]).trim() || "avatar-padrao";

          // A MÁGICA: Ignora Reservas, Desistentes e a conta Mestre
          if (mat && status === "ativo" && mat !== CONTA_MESTRE) { 
            alunosRankMap[mat] = {
              matricula: mat, nome: nomesMap[mat] || "Aluno " + mat, turma: String(dadosTrilha[i][1]).trim(),
              nivel: String(dadosTrilha[i][5]) || "Iniciante", 
              turma: String(dadosTrilha[i][1]).trim(),
              avatar: avatarSheet, 
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
        const dados = lerComCacheSeguro("configuracoes", 1800);
        let senha = "";
        
        for (let i = 1; i < dados.length; i++) {
          if (String(dados[i][0]).trim() === "SENHA_CHECKIN") {
            senha = String(dados[i][1]).trim();
            break;
          }
        }
        
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "sucesso", senha: senha 
        })).setMimeType(ContentService.MimeType.JSON);
      }

      if (action === "atualizar_senha_checkin") {
        const novaSenha = String(dadosApp.novaSenha).trim();
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
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
            
            // Invalida cache de configuracoes
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_configuracoes", "CACHE_configuracoes_CHUNKS"];
            for (let i = 0; i < 15; i++) keys.push("CACHE_configuracoes_" + i);
            cache.removeAll(keys);
          }
          
          return ContentService.createTextOutput(JSON.stringify({ 
            status: "sucesso", mensagem: "Senha atualizada com sucesso!" 
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao atualizar senha. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 18: SINCRONIZADOR SIEPE (BASE GERAL)
    // ==========================================
      if (action === "sincronizar_siepe") {
        const alunosNovos = dadosApp.alunos || [];
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(30000);
          
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

          // Processamento em memória para base geral (basededados)
          let numColsBase = planBase.getLastColumn() || 8;
          let rowsBase = dadosBase.map(r => {
            while (r.length < numColsBase) r.push("");
            return r;
          });

          // Processamento em memória para trilhatech
          let numColsTrilha = abaTrilha.getLastColumn() || 12;
          let rowsTrilha = dadosTrilha.map(r => {
            while (r.length < numColsTrilha) r.push("");
            return r;
          });

          alunosNovos.forEach(aluno => {
              let matricula = String(aluno.matricula).trim();
              let nome = String(aluno.nome).trim();
              let dataNasc = String(aluno.dataNasc).trim();
              let turmaEscola = String(aluno.turmaEscola).trim();
              let emailInstitucional = matricula + "@aluno.educacao.pe.gov.br";

              // 1. ATUALIZA OU INSERE NA BASE GERAL (basededados)
              if (mapBase[matricula]) {
                let rowIndex = mapBase[matricula] - 1;
                rowsBase[rowIndex][0] = nome; 
                rowsBase[rowIndex][1] = dataNasc;
                rowsBase[rowIndex][4] = turmaEscola;
                atualizados++;
              } else {
                let newRow = [nome, dataNasc, matricula, emailInstitucional, turmaEscola, "", "", ""];
                while (newRow.length < numColsBase) newRow.push("");
                rowsBase.push(newRow);
                inseridos++;
              }

              // 2. ATUALIZA NA TRILHA APENAS SE JÁ EXISTIR LÁ
              if (mapTrilha[matricula]) {
                let rowIndexTrilha = mapTrilha[matricula] - 1;
                let turmaProjeto = turmaEscola.includes("1º") ? "Turma 1 - 1º Ano" : "Turma 2 - 2º Ano";
                rowsTrilha[rowIndexTrilha][1] = turmaProjeto;
              }
          });

          // Escreve de volta em lote
          planBase.getRange(1, 1, rowsBase.length, numColsBase).setValues(rowsBase);
          abaTrilha.getRange(1, 1, rowsTrilha.length, numColsTrilha).setValues(rowsTrilha);

          // Invalida caches
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_basededados", "CACHE_basededados_CHUNKS", "CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
          for (let i = 0; i < 15; i++) {
            keys.push("CACHE_basededados_" + i);
            keys.push("CACHE_trilhatech_" + i);
          }
          cache.removeAll(keys);

          return ContentService.createTextOutput(JSON.stringify({ 
            status: "sucesso", inseridos: inseridos, atualizados: atualizados 
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro na sincronização: " + e.message })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
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

          const lock = LockService.getScriptLock();
          try {
            lock.waitLock(15000);
            
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
                abaFrequencia.getRange(linhaAtualizar, 6, 1, 2).setValues([[0, justificativa]]); // Coluna F e G
              } else {
                return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Registro não encontrado para edição." })).setMimeType(ContentService.MimeType.JSON);
              }

            } else {
              // Se ele não tinha justificado antes (Nova Justificativa)
              const novoId = "FALTA-" + new Date().getTime();
              // Colunas: [id, mat, nome, data, hora, xp, justificativa]
              abaFrequencia.appendRow([novoId, matricula, nomeAluno, dataBR, "00:00:00", 0, justificativa]);
            }

            // Invalida cache de frequencia
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_frequencia", "CACHE_frequencia_CHUNKS"];
            for (let i = 0; i < 15; i++) keys.push("CACHE_frequencia_" + i);
            cache.removeAll(keys);

            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Falta justificada com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
          } catch (e) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao justificar falta. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
          } finally {
            lock.releaseLock();
          }
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
          const lock = LockService.getScriptLock();
          try {
            lock.waitLock(10000); // 🔒 Proteção dupla

            const matricula = String(dadosApp.matricula).trim();
            const abaEntregas = planilha.getSheetByName("entregas");
            const abaTrilha = planilha.getSheetByName("trilhatech");

            const timezone = Session.getScriptTimeZone();
            const anoHoje = Utilities.formatDate(new Date(), timezone, "yyyy");
            const timestampAtual = new Date().getTime();
            const idNiver = "BDAY-" + anoHoje + "-" + matricula;

            // 🛡️ Proteção anti-fraude
            const dadosEntregas = abaEntregas.getDataRange().getValues();
            for (let i = 1; i < dadosEntregas.length; i++) {
              if (String(dadosEntregas[i][0]).trim() === idNiver) {
                return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Presente já resgatado!" })).setMimeType(ContentService.MimeType.JSON);
              }
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
            
          } catch (e) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aguarde um momento e tente de novo." })).setMimeType(ContentService.MimeType.JSON);
          } finally {
            lock.releaseLock(); // 🔓
          }
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
      if (action === "buscar_links_whatsapp") {
        const abaConfig = planilha.getSheetByName("configuracoes");
        let link1Ano = "";
        let link2Ano = "";

        if (abaConfig) {
          const dados = abaConfig.getDataRange().getValues();
          for (let i = 1; i < dados.length; i++) {
            let chave = String(dados[i][0]).trim();
            if (chave === "WHATSAPP_1ANO") link1Ano = String(dados[i][1]).trim();
            if (chave === "WHATSAPP_2ANO") link2Ano = String(dados[i][1]).trim();
          }
        }
        
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "sucesso", link1Ano, link2Ano 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      if (action === "salvar_links_whatsapp") {
        const link1Ano = String(dadosApp.link1Ano || "").trim();
        const link2Ano = String(dadosApp.link2Ano || "").trim();
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          const abaConfig = planilha.getSheetByName("configuracoes");

          if (abaConfig) {
            const dados = abaConfig.getDataRange().getValues();
            let achouT1 = false;
            let achouT2 = false;

            for (let i = 1; i < dados.length; i++) {
              let chave = String(dados[i][0]).trim();
              if (chave === "WHATSAPP_1ANO") { abaConfig.getRange(i + 1, 2).setValue(link1Ano); achouT1 = true; }
              if (chave === "WHATSAPP_2ANO") { abaConfig.getRange(i + 1, 2).setValue(link2Ano); achouT2 = true; }
            }

            if (!achouT1) abaConfig.appendRow(["WHATSAPP_1ANO", link1Ano]);
            if (!achouT2) abaConfig.appendRow(["WHATSAPP_2ANO", link2Ano]);
            
            // Invalida cache de configuracoes
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_configuracoes", "CACHE_configuracoes_CHUNKS"];
            for (let i = 0; i < 15; i++) keys.push("CACHE_configuracoes_" + i);
            cache.removeAll(keys);
          }

          return ContentService.createTextOutput(JSON.stringify({ 
            status: "sucesso", mensagem: "Links atualizados!" 
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao salvar links. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

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

      if (action === "confirmar_whatsapp") {
        const matricula = String(dadosApp.matricula).trim();
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          let abaTrilha = planilha.getSheetByName("trilhatech");
          if (abaTrilha) {
            let dadosTrilha = abaTrilha.getDataRange().getValues();
            for (let i = 1; i < dadosTrilha.length; i++) {
              if (String(dadosTrilha[i][0]).trim() === matricula) {
                abaTrilha.getRange(i + 1, 7).setValue("SIM"); // Grava SIM na Coluna G
                
                // Invalida cache de trilhatech
                const cache = CacheService.getScriptCache();
                let keys = ["CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
                for (let k = 0; k < 15; k++) keys.push("CACHE_trilhatech_" + k);
                cache.removeAll(keys);
                
                break;
              }
            }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso" })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao confirmar WhatsApp." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
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
          
          // MÁGICA: Removida a trava de turma! Apenas alunos Ativos aparecem na lista para transferência
          if(mat !== matricula && status === "ativo") {
              // Mostra a turma ao lado do nome para todo mundo, ajudando na identificação
              let turmaCurta = t.split("-")[0].trim(); // Pega apenas "Turma 1" ou "Turma 2"
              let nomeExibicao = (nomesMap[mat] || "Aluno "+mat) + ` (${turmaCurta})`;
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
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          let abaTrilha = planilha.getSheetByName("trilhatech");
          let dadosTrilha = abaTrilha.getDataRange().getValues();

          for(let i=1; i<dadosTrilha.length; i++) {
            if(String(dadosTrilha[i][0]).trim() === matricula) {
                abaTrilha.getRange(i+1, 8).setValue(senha); 
                
                // Invalida cache de trilhatech
                const cache = CacheService.getScriptCache();
                let keys = ["CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
                for (let k = 0; k < 15; k++) keys.push("CACHE_trilhatech_" + k);
                cache.removeAll(keys);

                return ContentService.createTextOutput(JSON.stringify({status: "sucesso"})).setMimeType(ContentService.MimeType.JSON);
            }
          }
          return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Aluno não encontrado."})).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Servidor ocupado ao criar PIN."})).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
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

        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(25000); // 🔒 Protege contra gasto duplo
          
          let abaTrilha = planilha.getSheetByName("trilhatech");
          let abaEntregas = planilha.getSheetByName("entregas");
          let abaConfig = planilha.getSheetByName("configuracoes");

          let limiteDiario = 50;
          if (abaConfig) {
            let dadosConf = abaConfig.getDataRange().getValues();
            for(let i=1; i<dadosConf.length; i++) { if(dadosConf[i][0] === "LIMITE_PIX_DIARIO") limiteDiario = Number(dadosConf[i][1]) || 50; }
          }

          let linhaOrigem = -1, linhaDestino = -1, xpOrigem = 0, xpDestino = 0, senhaReal = "";
          let statusOrigem = "", statusDestino = "", bloqueioPixOrigem = "";
          let dadosTrilha = abaTrilha.getDataRange().getValues();
          for(let i=1; i<dadosTrilha.length; i++) {
            let mat = String(dadosTrilha[i][0]).trim();
            if(mat === matriculaOrigem) { 
              linhaOrigem = i+1; 
              xpOrigem = Number(dadosTrilha[i][4]) || 0; 
              senhaReal = String(dadosTrilha[i][7] || "").trim(); 
              statusOrigem = String(dadosTrilha[i][2] || "").trim().toLowerCase();
              bloqueioPixOrigem = String(dadosTrilha[i][10] || "").trim().toLowerCase();
            }
            if(mat === matriculaDestino) { 
              linhaDestino = i+1; 
              xpDestino = Number(dadosTrilha[i][4]) || 0; 
              statusDestino = String(dadosTrilha[i][2] || "").trim().toLowerCase();
            }
          }

          if (linhaOrigem === -1 || linhaDestino === -1) return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Contas não encontradas."})).setMimeType(ContentService.MimeType.JSON);
          
          // Regras de bloqueio de status
          if (statusOrigem !== "ativo") return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Apenas alunos ativos podem enviar Pix de XP."})).setMimeType(ContentService.MimeType.JSON);
          if (statusDestino !== "ativo") return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Apenas alunos ativos podem receber Pix de XP."})).setMimeType(ContentService.MimeType.JSON);
          if (bloqueioPixOrigem === "sim") return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Você está bloqueado de enviar Pix de XP no painel."})).setMimeType(ContentService.MimeType.JSON);
          
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
                  
                  // Invalida cache de entregas
                  const cache = CacheService.getScriptCache();
                  let keys = ["CACHE_entregas", "CACHE_entregas_CHUNKS"];
                  for (let k = 0; k < 15; k++) keys.push("CACHE_entregas_" + k);
                  cache.removeAll(keys);
                  
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

          // Invalida cache de entregas e trilhatech
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_entregas", "CACHE_entregas_CHUNKS", "CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
          for (let i = 0; i < 15; i++) {
            keys.push("CACHE_entregas_" + i);
            keys.push("CACHE_trilhatech_" + i);
          }
          cache.removeAll(keys);

          return ContentService.createTextOutput(JSON.stringify({status: "sucesso"})).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({status: "erro", mensagem: "Servidor ocupado ao processar transferência de XP. Tente novamente."})).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 28: CARREGAR PORTAL DO ALUNO (COM CACHE ATIVO E BLINDADO)
    // ==========================================
      if (action === "carregar_portal_aluno") {
        const matricula = String(dadosApp.matricula).trim();
        const timezone = Session.getScriptTimeZone();
        
        // As abas são carregadas pela função global
        const dadosBase = lerComCacheSeguro("basededados", 1800); 
        const dadosModulos = lerComCacheSeguro("controle_modulos", 900); 
        const dadosAtiv = lerComCacheSeguro("atividades", 300); 
        const dadosConf = lerComCacheSeguro("configuracoes", 1800); 
        const dadosTrilha = lerComCacheSeguro("trilhatech", 60);
        const dadosEntregas = lerComCacheSeguro("entregas", 60);
        const dadosFrequencia = lerComCacheSeguro("frequencia", 60);
        const dadosCurtidas = lerComCacheSeguro("curtidas", 60);

        let statusModulosMap = {};
        for (let i = 1; i < dadosModulos.length; i++) {
          let nomeMod = String(dadosModulos[i][0]).trim();
          let statusMod = String(dadosModulos[i][1]).trim();
          let turmaMod = String(dadosModulos[i][2] || "Todas").trim();
          if (nomeMod) statusModulosMap[nomeMod + "|" + turmaMod] = statusMod;
        }

        let dadosRetorno = {
          status: "sucesso", nomeAluno: "", xpTotal: 0, nivel: "Iniciante", avatar: "avatar-padrao",
          totalCurtidas: 0, ofensivaDias: 0, whatsapp: { confirmado: true, link: "" },
          aniversario: { isAniversario: false, jaResgatado: false }, atividades: [],
          notificacoes: [], extratoPix: [], badgesResgatadas: [], taxaPresenca: 100,
          stats: { xpDoado: 0, xpRecebido: 0, totalCheckins: 0 }
        };

        let turmaDoAlunoNoProjeto = "";
        const niveisGamificacao = [
          { nome: "Hello World", min: 0, max: 499 }, { nome: "Bug Hunter", min: 500, max: 1499 },
          { nome: "Coder Ninja", min: 1500, max: 2999 }, { nome: "Tech Hacker", min: 3000, max: 4999 },
          { nome: "Dev Supremo", min: 5000, max: 7499 }, { nome: "Lenda Binária", min: 7500, max: 9999 },
          { nome: "Mestre do Código", min: 10000, max: 13999 }, { nome: "Arquiteto de Sistemas", min: 14000, max: 18999 },
          { nome: "Hacker Quântico", min: 19000, max: 24999 }, { nome: "Oráculo Digital", min: 25000, max: 34999 },
          { nome: "Titã da Nuvem", min: 35000, max: 49999 }, { nome: "Deus da Lógica", min: 50000, max: 999999 }
        ];

        if (dadosTrilha && dadosTrilha.length > 0) {
          for (let t = 1; t < dadosTrilha.length; t++) {
            if (String(dadosTrilha[t][0]).trim() === matricula) {
              turmaDoAlunoNoProjeto = String(dadosTrilha[t][1]).trim();
              let xpTotalAtual = Number(dadosTrilha[t][4]) || 0; 
              let xpGasto = Number(dadosTrilha[t][11]) || 0;     

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

              let xpBaseNivel = nivelCalculado.min;
              let xpParaProximo = proximoNivel.min;
              let progressoAtual = xpTotalAtual - xpBaseNivel;
              let totalDoNivel = xpParaProximo - xpBaseNivel;
              dadosRetorno.xpTotal = xpTotalAtual; dadosRetorno.xpGasto = xpGasto;
              dadosRetorno.saldoCarteira = xpTotalAtual - xpGasto; dadosRetorno.nivel = nivelCalculado.nome;
              dadosRetorno.progressoNivel = { porcentagem: totalDoNivel === 0 ? 100 : Math.floor((progressoAtual / totalDoNivel) * 100), faltam: xpParaProximo - xpTotalAtual > 0 ? xpParaProximo - xpTotalAtual : 0, nomeProximo: proximoNivel.nome, isMaximo: totalDoNivel === 0 };
              dadosRetorno.whatsapp.confirmado = String(dadosTrilha[t][6]).trim() === "SIM";
              break;
            }
          }
        }

        for(let i = 1; i < dadosConf.length; i++) {
          if(turmaDoAlunoNoProjeto.includes("1º") && dadosConf[i][0] === "WHATSAPP_1ANO") dadosRetorno.whatsapp.link = dadosConf[i][1];
          if(turmaDoAlunoNoProjeto.includes("2º") && dadosConf[i][0] === "WHATSAPP_2ANO") dadosRetorno.whatsapp.link = dadosConf[i][1];
        }

        const dataHoje = new Date();
        const diaHoje = Utilities.formatDate(dataHoje, timezone, "dd");
        const mesHoje = Utilities.formatDate(dataHoje, timezone, "MM");
        const anoHoje = Utilities.formatDate(dataHoje, timezone, "yyyy");
        const idNiver = "BDAY-" + anoHoje + "-" + matricula;

        let nomesMap = {};
        for (let i = 1; i < dadosBase.length; i++) {
          let mat = String(dadosBase[i][2]).trim();
          nomesMap[mat] = String(dadosBase[i][0]).trim();
          if (mat === matricula) {
            dadosRetorno.nomeAluno = nomesMap[mat];
            let strNasc = String(dadosBase[i][1]).trim();
            let diaNasc = "", mesNasc = "";
            if (strNasc.includes("/")) {
              let p = strNasc.split("/"); if (p.length === 3) { diaNasc = p[0].padStart(2, '0'); mesNasc = p[1].padStart(2, '0'); }
            } else if (strNasc.includes("-")) {
              let p = strNasc.split("T")[0].split("-"); if (p.length === 3) { diaNasc = p[2].padStart(2, '0'); mesNasc = p[1].padStart(2, '0'); }
            }
            if (diaNasc === diaHoje && mesNasc === mesHoje) dadosRetorno.aniversario.isAniversario = true;
          }
        }

        let entregasMap = {};
        if (dadosEntregas && dadosEntregas.length > 0) {
          for (let i = 1; i < dadosEntregas.length; i++) {
            let idEntrega = String(dadosEntregas[i][0]).trim();
            let mat = String(dadosEntregas[i][1]).trim();
            if (mat === matricula) {
              if (idEntrega.startsWith("NOTIF-")) {
                  dadosRetorno.notificacoes.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: Number(dadosEntregas[i][5]) || 0, tempo: Number(dadosEntregas[i][6]) || 0, tipo: String(dadosEntregas[i][4]) });
                  continue; 
              }
              if (!idEntrega.startsWith("BDAY") && !idEntrega.startsWith("PIX") && !idEntrega.startsWith("BADGE") && !idEntrega.startsWith("BLOCK")) {
                entregasMap[String(dadosEntregas[i][2]).trim()] = { resposta: String(dadosEntregas[i][3]).trim(), status: String(dadosEntregas[i][4]).trim() || "Aguardando Correção", xpGanho: dadosEntregas[i][5] || 0, dataEnvio: Number(dadosEntregas[i][6]) || 0, feedback: String(dadosEntregas[i][7] || "").trim() };
              }
              if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) {
                  dadosRetorno.stats.xpRecebido += Number(dadosEntregas[i][5]) || 0;
                  dadosRetorno.extratoPix.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: Number(dadosEntregas[i][5]), tempo: Number(dadosEntregas[i][6]) || 0, tipo: "RECEBEU" });
              }
              if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
                  let xpD = Math.abs(Number(dadosEntregas[i][5]) || 0);
                  dadosRetorno.stats.xpDoado += xpD;
                  dadosRetorno.extratoPix.push({ id: idEntrega, mensagem: String(dadosEntregas[i][3]), xp: -xpD, tempo: Number(dadosEntregas[i][6]) || 0, tipo: "ENVIOU" });
              }
              if (idEntrega === idNiver) dadosRetorno.aniversario.jaResgatado = true;
              
              if (idEntrega.startsWith("BADGE-")){
                let badgeId = idEntrega.replace("BADGE-", "").replace("-" + matricula, "");
                dadosRetorno.badgesResgatadas.push(badgeId);
              }
            }
          }
        }

        if (dadosCurtidas && dadosCurtidas.length > 0) {
          for (let i = 1; i < dadosCurtidas.length; i++) {
              if (String(dadosCurtidas[i][2]).trim() === matricula) {
                  let remetente = String(dadosCurtidas[i][1]).trim();
                  dadosRetorno.notificacoes.push({ id: String(dadosCurtidas[i][0]).trim(), mensagem: `${nomesMap[remetente] ? nomesMap[remetente].split(" ")[0] : "Um colega"} curtiu o seu perfil! ❤️`, xp: 0, tempo: Number(String(dadosCurtidas[i][0]).trim().split("-")[1]) || new Date().getTime(), tipo: "LIKE" });
              }
          }
        }

        dadosRetorno.notificacoes.sort((a, b) => b.tempo - a.tempo);
        dadosRetorno.notificacoes = dadosRetorno.notificacoes.slice(0, 10);
        dadosRetorno.extratoPix.sort((a, b) => b.tempo - a.tempo);
        dadosRetorno.extratoPix = dadosRetorno.extratoPix.slice(0, 20);

        if (dadosFrequencia && dadosFrequencia.length > 0 && turmaDoAlunoNoProjeto) {
            let alunosDaMesmaTurma = new Set();
            if(dadosTrilha && dadosTrilha.length > 0) {
                for (let i = 1; i < dadosTrilha.length; i++) {
                  if (String(dadosTrilha[i][1]).trim() === turmaDoAlunoNoProjeto && String(dadosTrilha[i][2]).trim().toLowerCase() === "ativo") {
                    alunosDaMesmaTurma.add(String(dadosTrilha[i][0]).trim());
                  }
                }
            }

            let diasComAulaSet = new Set(); let checkinsMap = {}; let presencasAluno = 0;
            for (let i = 1; i < dadosFrequencia.length; i++) {
              let idCheckin = String(dadosFrequencia[i][0]).trim();
              if (idCheckin.startsWith("BDAY")) continue;
              let matFreq = String(dadosFrequencia[i][1]).trim();
              
              let dataFormatada = String(dadosFrequencia[i][3]).trim(); 

              if (alunosDaMesmaTurma.has(matFreq)) diasComAulaSet.add(dataFormatada);
              if (matFreq === matricula && String(dadosFrequencia[i][4]).trim() !== "00:00:00" && String(dadosFrequencia[i][4]).trim() !== "") {
                  presencasAluno++; dadosRetorno.stats.totalCheckins++; checkinsMap[dataFormatada] = true;
              }
            }
            dadosRetorno.taxaPresenca = diasComAulaSet.size === 0 ? 100 : Math.round((presencasAluno / diasComAulaSet.size) * 100);

            let diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
                let pA = String(a).split('/'); let pB = String(b).split('/');
                return new Date(pB[2], pB[1]-1, pB[0]).getTime() - new Date(pA[2], pA[1]-1, pA[0]).getTime();
            });
            let streak = 0; const dataHojeStr = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");
            for (let dia of diasOrdenados) {
                if (dia === dataHojeStr && !checkinsMap[dia]) continue;
                if (checkinsMap[dia]) streak++; else break;
            }
            dadosRetorno.ofensivaDias = streak;
        }

        let hojeTime = new Date(); hojeTime.setHours(0,0,0,0);
        for (let i = 1; i < dadosAtiv.length; i++) {
          if (String(dadosAtiv[i][13] || "Publicada").trim() !== "Publicada") continue;

          let turmaAlvo = String(dadosAtiv[i][5]).trim();
          if (turmaAlvo.toLowerCase() === "todas" || turmaAlvo === turmaDoAlunoNoProjeto) {
            let idAtiv = String(dadosAtiv[i][0]).trim();
            let entregaAluno = entregasMap[idAtiv];
            let dataLimiteStr = String(dadosAtiv[i][3]);
            
            let statusPrazo = "No Prazo";
            if (!entregaAluno && dataLimiteStr) {
              if (dataLimiteStr.includes("-")) {
                let p = dataLimiteStr.split("-");
                if (p.length === 3 && hojeTime > new Date(Number(p[0]), Number(p[1])-1, Number(p[2]))) statusPrazo = "Atrasada";
              } else if (dataLimiteStr.includes("/")) {
                let p = dataLimiteStr.split('/');
                if (p.length === 3 && hojeTime > new Date(Number(p[2]), Number(p[1])-1, Number(p[0]))) statusPrazo = "Atrasada";
              }
            }

            let isGabaritoLiberado = dadosAtiv[i][17] === true || String(dadosAtiv[i][17]).toLowerCase() === "true";
            dadosRetorno.atividades.push({
              id: idAtiv, titulo: String(dadosAtiv[i][1]), descricao: String(dadosAtiv[i][2]), dataLimite: dataLimiteStr,
              xp: dadosAtiv[i][4], tipo: String(dadosAtiv[i][6] || "Projeto"),
              opcaoA: String(dadosAtiv[i][7] || ""), opcaoB: String(dadosAtiv[i][8] || ""), opcaoC: String(dadosAtiv[i][9] || ""), opcaoD: String(dadosAtiv[i][10] || ""),
              status: entregaAluno ? entregaAluno.status : "Pendente",
              respostaEnviada: entregaAluno ? entregaAluno.resposta : "", xpGanho: entregaAluno ? entregaAluno.xpGanho : 0,
              dataEnvio: entregaAluno ? entregaAluno.dataEnvio : 0, statusPrazo: statusPrazo, feedback: entregaAluno ? entregaAluno.feedback : "",
              linkClassroom: String(dadosAtiv[i][12] || ""), imagemUrl: String(dadosAtiv[i][14] || ""), modulo: String(dadosAtiv[i][15] || "Geral"),
              gabarito: isGabaritoLiberado ? String(dadosAtiv[i][16] || "") : "",
              statusModulo: statusModulosMap[String(dadosAtiv[i][15]).trim() + "|" + turmaDoAlunoNoProjeto] || statusModulosMap[String(dadosAtiv[i][15]).trim() + "|Todas"] || "Aberto"
            });
          }
        }

        return ContentService.createTextOutput(JSON.stringify(dadosRetorno)).setMimeType(ContentService.MimeType.JSON);
      }

    // ==========================================
    // ROTA 29: RESGATAR RECOMPENSA DE CONQUISTA (BADGE - BLINDADA)
    // ==========================================
      if (action === "resgatar_badge") {
        const matricula = String(dadosApp.matricula).trim();
        const badgeId = String(dadosApp.badgeId).trim();
        const xpGanho = Number(dadosApp.xpGanho) || 0;
        const nomeBadge = String(dadosApp.nomeBadge).trim();
        const timestampAtual = new Date().getTime();
        const idUnico = "BADGE-" + badgeId + "-" + matricula;

        // 1. LEITURA FORA DO LOCK (Mata o travamento de carregamento do portal)
        const dadosEntregas = lerComCacheSeguro("entregas", 60);
        const dadosTrilha = lerComCacheSeguro("trilhatech", 60);

        for (let i = 1; i < dadosEntregas.length; i++) {
          if (String(dadosEntregas[i][0]).trim() === idUnico) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Recompensa já resgatada!" })).setMimeType(ContentService.MimeType.JSON);
          }
        }

        let linhaTrilhaAluno = -1;
        for(let t = 1; t < dadosTrilha.length; t++) {
            if(String(dadosTrilha[t][0]).trim() === matricula) {
              linhaTrilhaAluno = t + 1;
              break;
            }
        }

        // 2. LOCK CIRÚRGICO APENAS PARA ESCREVER
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000); 
          const planilha = SpreadsheetApp.getActiveSpreadsheet(); // Abre só aqui
          const abaEntregas = planilha.getSheetByName("entregas");
          const abaTrilha = planilha.getSheetByName("trilhatech");

          if (!abaEntregas || !abaTrilha) throw new Error("Planilhas inacessíveis.");

          abaEntregas.appendRow([idUnico, matricula, "CONQUISTA-BADGE", `Desbloqueou: ${nomeBadge}`, "Avaliado", xpGanho, timestampAtual]);

          if (linhaTrilhaAluno > -1) {
              let xpAtualReal = Number(abaTrilha.getRange(linhaTrilhaAluno, 5).getValue()) || 0;
              abaTrilha.getRange(linhaTrilhaAluno, 5).setValue(xpAtualReal + xpGanho);
          }

          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `+${xpGanho} XP Resgatado!` })).setMimeType(ContentService.MimeType.JSON);
          
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Processando conquista. A página será atualizada." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
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

              // Só entram no Radar alunos que NÃO são reserva ou desistentes
              if (status !== "reserva" && status !== "desistente") {
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
        const dadosConf = lerComCacheSeguro("configuracoes", 1800);

        // Valores padrão caso a aba esteja vazia ou incompleta
        let configuracoes = {
          nomeEscola: "Escola Padrão",
          nomeProjeto: "Trilha Tech",
          turmas: ["Turma 1 - 1º Ano", "Turma 2 - 2º Ano"],
          linkPlanilha: "https://docs.google.com/spreadsheets",
          linkClassroom: "https://classroom.google.com/",
          linkMatriz: "",
          linkAjuda: "",
          linkCronograma: "",
          modoReposicao: "DESLIGADO"
        };

        for (let i = 1; i < dadosConf.length; i++) {
          let chave = String(dadosConf[i][0]).trim();
          let valor = String(dadosConf[i][1]).trim();

          if (!chave) continue;

          // Injeta a chave EXATA da planilha no JSON enviado ao portal
          configuracoes[chave] = valor;

          // MANTÉM AS TRADUÇÕES ANTIGAS
          if (chave === "NOME_ESCOLA") configuracoes.nomeEscola = valor;
          if (chave === "NOME_PROJETO") configuracoes.nomeProjeto = valor;
          if (chave === "TURMAS_PROJETO") configuracoes.turmas = valor.split(",").map(t => t.trim()).filter(t => t !== "");
          if (chave === "LINK_PLANILHA") configuracoes.linkPlanilha = valor;
          if (chave === "LINK_CLASSROOM") configuracoes.linkClassroom = valor;
          if (chave === "LINK_MATRIZ") configuracoes.linkMatriz = valor;
          if (chave === "LINK_AJUDA") configuracoes.linkAjuda = valor;
          if (chave === "LINK_CRONOGRAMA") configuracoes.linkCronograma = valor;
          if (chave === "MODO_REPOSICAO") configuracoes.modoReposicao = valor.toUpperCase();
        }

        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", configuracoes })).setMimeType(ContentService.MimeType.JSON);
      }

    // ==========================================
    // ROTA 33: SALVAR CONFIGURAÇÕES GERAIS (TUTOR)
    // ==========================================
      if (action === "salvar_configuracoes") {
        const configs = dadosApp.configs; // Objeto no formato { CHAVE: "VALOR", CHAVE2: "VALOR2" }
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          
          const abaConfig = planilha.getSheetByName("configuracoes");
          if (!abaConfig) {
            return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba configuracoes não encontrada." })).setMimeType(ContentService.MimeType.JSON);
          }

          let dadosConf = abaConfig.getDataRange().getValues();
          let chavesPlanilha = {};

          // Mapeia em qual linha está cada chave atual (para não duplicar)
          for (let i = 1; i < dadosConf.length; i++) {
            let chave = String(dadosConf[i][0]).trim();
            if (chave) chavesPlanilha[chave] = i; // Guarda o índice do array dadosConf
          }

          // Percorre as configurações que chegaram do Frontend e atualiza em memória
          for (let chave in configs) {
            let valor = String(configs[chave]);
            if (chavesPlanilha[chave] !== undefined) {
              dadosConf[chavesPlanilha[chave]][1] = valor;
            } else {
              dadosConf.push([chave, valor]);
            }
          }

          // Escreve tudo de volta em lote
          abaConfig.getRange(1, 1, dadosConf.length, 2).setValues(dadosConf);

          // Invalida cache de configuracoes
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_configuracoes", "CACHE_configuracoes_CHUNKS"];
          for (let i = 0; i < 15; i++) keys.push("CACHE_configuracoes_" + i);
          cache.removeAll(keys);

          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Configurações salvas com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao salvar configurações. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 34: LIGAR/DESLIGAR MODO DE REPOSIÇÃO
    // ==========================================
      if (action === "toggle_modo_reposicao") {
        const novoStatus = String(dadosApp.status).toUpperCase(); // "LIGADO" ou "DESLIGADO"
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          const abaConfig = planilha.getSheetByName("configuracoes");

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
            
            // Invalida cache de configuracoes
            const cache = CacheService.getScriptCache();
            let keys = ["CACHE_configuracoes", "CACHE_configuracoes_CHUNKS"];
            for (let i = 0; i < 15; i++) keys.push("CACHE_configuracoes_" + i);
            cache.removeAll(keys);

            return ContentService.createTextOutput(JSON.stringify({ 
              status: "sucesso", 
              mensagem: "Modo Reposição " + (novoStatus === "LIGADO" ? "Ativado" : "Desativado") + "!"
            })).setMimeType(ContentService.MimeType.JSON);
          }
          
          return ContentService.createTextOutput(JSON.stringify({ 
            status: "erro", 
            mensagem: "Aba de configurações não encontrada." 
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao alternar modo reposição." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 35: SALVAR AVATAR DO ALUNO
    // ==========================================
      if (action === "salvar_avatar") {
        const matricula = String(dadosApp.matricula).trim();
        const avatarId = String(dadosApp.avatarId).trim();
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          const abaTrilha = planilha.getSheetByName("trilhatech");

          if (abaTrilha) {
            const dadosTrilha = abaTrilha.getDataRange().getValues();
            for (let i = 1; i < dadosTrilha.length; i++) {
              if (String(dadosTrilha[i][0]).trim() === matricula) {
                // Salva o ID do Avatar na Coluna I (índice 9)
                abaTrilha.getRange(i + 1, 9).setValue(avatarId); 
                
                // Invalida cache de trilhatech
                const cache = CacheService.getScriptCache();
                let keys = ["CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
                for (let k = 0; k < 15; k++) keys.push("CACHE_trilhatech_" + k);
                cache.removeAll(keys);
                
                return ContentService.createTextOutput(JSON.stringify({ status: "sucesso" })).setMimeType(ContentService.MimeType.JSON);
              }
            }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado." })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao salvar avatar." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 36: CURTIR PERFIL DO COLEGA (1x ao dia)
    // ==========================================
      if (action === "curtir_perfil") {
        const matriculaRemetente = String(dadosApp.matriculaRemetente).trim();
        const matriculaDestinatario = String(dadosApp.matriculaDestinatario).trim();

        if (matriculaRemetente === matriculaDestinatario) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Você não pode curtir o próprio perfil!" })).setMimeType(ContentService.MimeType.JSON);
        }

        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          
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

          // Invalida cache de curtidas e trilhatech
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_curtidas", "CACHE_curtidas_CHUNKS", "CACHE_trilhatech", "CACHE_trilhatech_CHUNKS"];
          for (let i = 0; i < 15; i++) {
            keys.push("CACHE_curtidas_" + i);
            keys.push("CACHE_trilhatech_" + i);
          }
          cache.removeAll(keys);

          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Perfil curtido com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao curtir perfil. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 37: BUSCAR PERFIL PÚBLICO (O Mural do Aluno)
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

    // ==========================================
    // ROTA 38: LISTAR ALUNOS PARA O GOD MODE
    // ==========================================
      if (action === "listar_alunos_godmode") {
        const planBase = planilha.getSheetByName("basededados");
        const abaTrilha = planilha.getSheetByName("trilhatech");

        if (!planBase || !abaTrilha) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas não encontradas." })).setMimeType(ContentService.MimeType.JSON);

        let nomesMap = {};
        const dadosBase = planBase.getDataRange().getValues();
        for (let i = 1; i < dadosBase.length; i++) nomesMap[String(dadosBase[i][2]).trim()] = String(dadosBase[i][0]);

        let alunos = [];
        const dadosTrilha = abaTrilha.getDataRange().getValues();
        for (let i = 1; i < dadosTrilha.length; i++) {
          let mat = String(dadosTrilha[i][0]).trim();
          let turma = String(dadosTrilha[i][1]).trim();
          let status = String(dadosTrilha[i][2]).trim().toLowerCase();
          
          if (mat && status === "ativo") {
            alunos.push({ matricula: mat, nome: nomesMap[mat] || "Aluno " + mat, turma: turma });
          }
        }
        // Ordena por turma e depois alfabeticamente
        alunos.sort((a, b) => a.turma.localeCompare(b.turma) || a.nome.localeCompare(b.nome));

        return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", alunos })).setMimeType(ContentService.MimeType.JSON);
      }

    // ==========================================
    // ROTA 39: INJETAR XP MANUAL (GOD MODE)
    // ==========================================
      if (action === "injetar_xp_manual") {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(10000);
          const matriculaAlvo = String(dadosApp.matriculaAlvo).trim();
          const quantidadeXP = Number(dadosApp.quantidadeXP) || 0;
          const motivo = String(dadosApp.motivo).trim() || "Ajuste manual do Mestre.";
          
          const abaTrilha = planilha.getSheetByName("trilhatech");
          const abaEntregas = planilha.getSheetByName("entregas");
          
          if (!abaTrilha || !abaEntregas) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas base não encontradas" })).setMimeType(ContentService.MimeType.JSON);

          let linhaTrilha = -1;
          let xpAtual = 0;
          const dadosTrilha = abaTrilha.getDataRange().getValues();
          for (let i = 1; i < dadosTrilha.length; i++) {
            if (String(dadosTrilha[i][0]).trim() === matriculaAlvo) {
              linhaTrilha = i + 1;
              xpAtual = Number(dadosTrilha[i][4]) || 0;
              break;
            }
          }

          if (linhaTrilha === -1) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado na TrilhaTech." })).setMimeType(ContentService.MimeType.JSON);

          // 1. Injeta/Remove o XP
          let novoXp = xpAtual + quantidadeXP;
          if (novoXp < 0) novoXp = 0; // Não deixa ficar negativo
          abaTrilha.getRange(linhaTrilha, 5).setValue(novoXp);

          const timestamp = new Date().getTime();

          // 2. Gera o Histórico (para o Analytics e Extrato)
          const idEntrega = "GOD-" + timestamp;
          abaEntregas.appendRow([idEntrega, matriculaAlvo, "AJUSTE-MANUAL", motivo, "Avaliado", quantidadeXP, timestamp, ""]);

          // 3. Gera a Notificação Imediata para o Aluno
          const idNotif = "NOTIF-" + timestamp;
          const tipoNotif = quantidadeXP >= 0 ? "GODMODE-B" : "GODMODE-M";
          const msgNotif = quantidadeXP >= 0 ? `⚡ Bônus do Mestre: ${motivo}` : `🚨 Punição do Mestre: ${motivo}`;
          abaEntregas.appendRow([idNotif, matriculaAlvo, "SISTEMA", msgNotif, tipoNotif, quantidadeXP, timestamp, ""]);

          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Poder do Mestre aplicado com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro ao processar." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 40: COROAR ELITE (TROFÉU ROTATIVO)
    // ==========================================
      if (action === "coroar_elite") {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(15000);
          const matriculaNova = String(dadosApp.matricula).trim();
          const tipoPlaca = dadosApp.tipoPlaca; // Ex: "Elite Ouro"

          const sheetEntregas = planilha.getSheetByName("entregas");
          const dataEntregas = sheetEntregas.getDataRange().getValues();

          const dataHoje = new Date();
          // Pega o nome do mês atual para a badge de legado (Ex: "maio")
          const nomeMes = dataHoje.toLocaleString('pt-BR', { month: 'long' });
          const tituloLegado = `Desbloqueou: 🏅 Legado ${tipoPlaca.replace("Elite ", "")} (${nomeMes})`;

          // 1. Procurar o antigo dono e transformá-lo em "Legado"
          for (let i = 1; i < dataEntregas.length; i++) {
            const idAtiv = String(dataEntregas[i][2]).trim();
            const projeto = String(dataEntregas[i][3]).trim();

            if (idAtiv === "CONQUISTA-BADGE" && projeto === `Desbloqueou: ${tipoPlaca}`) {
              // Achou o antigo dono! Troca a placa ativa dele pela badge de legado eterno.
              sheetEntregas.getRange(i + 1, 4).setValue(tituloLegado);
            }
          }

          // 2. Dar a Placa Ativa para o novo Campeão
          const newId = "BADGE-VIP-" + new Date().getTime(); 
          
          sheetEntregas.appendRow([
            newId,
            matriculaNova,
            "CONQUISTA-BADGE",
            `Desbloqueou: ${tipoPlaca}`,
            "Avaliado",
            0, // Sem XP extra
            "token-" + newId
          ]);

          // Invalida cache de entregas
          const cache = CacheService.getScriptCache();
          let keys = ["CACHE_entregas", "CACHE_entregas_CHUNKS"];
          for (let k = 0; k < 15; k++) keys.push("CACHE_entregas_" + k);
          cache.removeAll(keys);

          return ContentService.createTextOutput(JSON.stringify({
            status: "sucesso",
            mensagem: `${tipoPlaca} transferida com sucesso para o novo Campeão!`
          })).setMimeType(ContentService.MimeType.JSON);

        } catch (erro) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: erro.toString() })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 41: SALVAR GABARITOS EM LOTE (TUTOR)
    // ==========================================
      if (action === "salvar_gabaritos_lote") {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(10000);
          const atualizacoes = dadosApp.atualizacoes; // Array de { id, gabarito, linkClassroom, gabaritoLiberado }
          const abaAtividades = planilha.getSheetByName("atividades");

          if (abaAtividades && atualizacoes && atualizacoes.length > 0) {
            const dados = abaAtividades.getDataRange().getValues();
            // Mapeia onde está cada ID para atualizar super rápido
            let mapLinhas = {};
            for (let i = 1; i < dados.length; i++) {
              mapLinhas[String(dados[i][0]).trim()] = i + 1;
            }

            atualizacoes.forEach(update => {
              const linha = mapLinhas[update.id];
              if (linha) {
                if (update.gabarito !== undefined) abaAtividades.getRange(linha, 17).setValue(String(update.gabarito)); // Coluna Q
                if (update.linkClassroom !== undefined) abaAtividades.getRange(linha, 13).setValue(String(update.linkClassroom)); // Coluna M
                if (update.gabaritoLiberado !== undefined) abaAtividades.getRange(linha, 18).setValue(update.gabaritoLiberado ? true : false); // Coluna R
              }
            });

            invalidarCacheGeral();
            return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Gabaritos atualizados em lote com sucesso!" })).setMimeType(ContentService.MimeType.JSON);
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Nenhuma atualização recebida." })).setMimeType(ContentService.MimeType.JSON);
        } catch (e) {
          return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro ao processar o lote." })).setMimeType(ContentService.MimeType.JSON);
        } finally {
          lock.releaseLock();
        }
      }

    // ==========================================
    // ROTA 42: SINCRONIZAR AVA (COM FUSÃO INTELIGENTE DE LINKS DO PORTAL)
    // ==========================================
      if (action === "sincronizar_ava") {
          const lock = LockService.getScriptLock();
          const cache = CacheService.getScriptCache();
          
          const logProgresso = (pct, msg) => {
              cache.put("SYNC_STATUS", JSON.stringify({ progresso: pct, mensagem: msg }), 300);
          };

          try {
              lock.waitLock(30000);
              logProgresso(5, "Iniciando varredura no banco de dados...");

              const filtroTurma = String(dadosApp.filtroTurma || "Todas").trim();
              const filtroModulo = String(dadosApp.filtroModulo || "Todos").trim();

              const abaAtividades = planilha.getSheetByName("atividades");
              const abaBase = planilha.getSheetByName("basededados");
              const abaTrilha = planilha.getSheetByName("trilhatech");
              const abaEntregas = planilha.getSheetByName("entregas");
              const abaModulos = planilha.getSheetByName("controle_modulos");

              if (!abaAtividades || !abaBase || !abaTrilha || !abaEntregas || !abaModulos) {
                  throw new Error("Abas necessárias não encontradas no BD.");
              }

              const normalizar = (texto) => String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

              logProgresso(10, "Mapeando alunos e módulos...");
              
              const dadosModulos = abaModulos.getDataRange().getValues();
              const mapaModulos = {};
              for (let i = 1; i < dadosModulos.length; i++) {
                  let nomeMod = String(dadosModulos[i][0]).trim().toLowerCase();
                  let statusMod = String(dadosModulos[i][1]).trim().toLowerCase();
                  let turmaMod = String(dadosModulos[i][2]).trim().toLowerCase();
                  if (nomeMod) {
                      mapaModulos[nomeMod + "_" + turmaMod] = statusMod;
                      mapaModulos[nomeMod] = statusMod; 
                  }
              }

              const dadosBase = abaBase.getDataRange().getValues();
              const mapaMatricula = {}; 
              for (let i = 1; i < dadosBase.length; i++) {
                  let nome = String(dadosBase[i][0]);
                  let matricula = String(dadosBase[i][2]).trim();
                  let email = String(dadosBase[i][3]).toLowerCase().trim();
                  if (matricula) mapaMatricula[matricula] = { nomeNorm: normalizar(nome), email: email };
              }

              const dadosTrilha = abaTrilha.getDataRange().getValues();
              const mapaBuscaAluno = {}; 
              const listaAlunosAtivos = [];

              function compararNomes(nome1, nome2) {
                  if (!nome1 || !nome2) return false;
                  let n1 = normalizar(nome1);
                  let n2 = normalizar(nome2);
                  if (n1 === n2) return true;
                  
                  if (n1.indexOf(n2) === 0 || n2.indexOf(n1) === 0) return true;
                  
                  let p1 = n1.split(/\s+/);
                  let p2 = n2.split(/\s+/);
                  if (p1.length > 0 && p2.length > 0) {
                      if (p1[0] === p2[0]) {
                          for (let i = 1; i < p1.length; i++) {
                              if (p1[i].length > 2 && p2.indexOf(p1[i]) !== -1) {
                                  return true;
                              }
                          }
                      }
                  }
                  return false;
              }

              for (let i = 1; i < dadosTrilha.length; i++) {
                  let matricula = String(dadosTrilha[i][0]).trim();
                  let status = String(dadosTrilha[i][2]).trim().toLowerCase();
                  let turmaAluno = String(dadosTrilha[i][1]).trim();

                  if (filtroTurma !== "Todas" && turmaAluno !== filtroTurma) continue; 

                  if (matricula && status === "ativo") {
                      let info = mapaMatricula[matricula];
                      if (info) {
                          let objTrilha = { 
                              matricula: matricula, 
                              linhaTrilha: i + 1, 
                              xpAtual: Number(dadosTrilha[i][4]) || 0,
                              email: info.email,
                              nomeNorm: info.nomeNorm
                          };
                          if (info.email) mapaBuscaAluno[info.email] = objTrilha;
                          if (info.nomeNorm) mapaBuscaAluno[info.nomeNorm] = objTrilha;
                          listaAlunosAtivos.push(objTrilha);
                      }
                  }
              }

              logProgresso(15, "Analisando fila de correções pendentes...");
              const dadosEntregas = abaEntregas.getDataRange().getValues();
              
              const mapaEntregas = {}; 
              for (let i = 1; i < dadosEntregas.length; i++) {
                  let matriculaEnt = String(dadosEntregas[i][1]).trim();
                  let idAtivEnt = String(dadosEntregas[i][2]).trim();
                  let statusEnt = String(dadosEntregas[i][4]).trim();
                  mapaEntregas[matriculaEnt + "_" + idAtivEnt] = {
                      linha: i + 1,
                      status: statusEnt
                  };
              }

              function decodificarId(idUrl) {
                  try {
                      let decodificado = Utilities.newBlob(Utilities.base64Decode(idUrl)).getDataAsString();
                      if (/^\d+$/.test(decodificado)) return decodificado;
                  } catch(e) {}
                  return idUrl; 
              }

              const cacheAlunosCurso = {}; // courseId -> { userId -> { nomeNorm, email } }

              function carregarAlunosCurso(courseId) {
                  if (cacheAlunosCurso[courseId]) return cacheAlunosCurso[courseId];
                  let mapa = {};
                  try {
                      let pageToken = null;
                      do {
                          const res = Classroom.Courses.Students.list(courseId, { pageToken: pageToken });
                          const students = res.students || [];
                          students.forEach(s => {
                              if (s.userId && s.profile) {
                                  let email = (s.profile.emailAddress || "").toLowerCase().trim();
                                  let nome = s.profile.name ? (s.profile.name.fullName || "") : "";
                                  mapa[s.userId] = { nomeNorm: normalizar(nome), email: email };
                              }
                          });
                          pageToken = res.nextPageToken;
                      } while (pageToken);
                  } catch(e) {
                      // Fallback se falhar
                  }
                  cacheAlunosCurso[courseId] = mapa;
                  return mapa;
              }

              function resolverUsuario(userId, courseId) {
                  let mapaCurso = carregarAlunosCurso(courseId);
                  if (mapaCurso[userId]) return mapaCurso[userId];
                  
                  let nome = "", email = "";
                  try {
                      const prof = Classroom.UserProfiles.get(userId);
                      if (prof && prof.emailAddress) email = prof.emailAddress.toLowerCase().trim();
                      if (prof && prof.name && prof.name.fullName) nome = prof.name.fullName;
                  } catch(e) {}
                  
                  const final = { nomeNorm: normalizar(nome), email: email, id: userId };
                  mapaCurso[userId] = final;
                  return final;
              }

              const dadosAtiv = abaAtividades.getDataRange().getValues();
              let atividadesParaSincronizar = [];

              for (let i = 1; i < dadosAtiv.length; i++) {
                  let idAtiv = String(dadosAtiv[i][0]).trim();
                  if (!idAtiv || idAtiv === "ID") continue;

                  let turmaAlvoAtiv = String(dadosAtiv[i][5]).trim(); 
                  let nomeModuloAtiv = String(dadosAtiv[i][15]).trim(); 
                  let link = String(dadosAtiv[i][12]).trim();

                  if (!link.includes("classroom.google.com")) continue;
                  if (filtroTurma !== "Todas" && turmaAlvoAtiv !== "Todas" && turmaAlvoAtiv !== filtroTurma) continue;
                  if (filtroModulo !== "Todos" && nomeModuloAtiv !== filtroModulo) continue;

                  atividadesParaSincronizar.push({ linha: i, dadosDaLinha: dadosAtiv[i] });
              }

              let entregasNovas = 0;
              let logsErro = []; 
              let totalParaSincronizar = atividadesParaSincronizar.length;

              if (totalParaSincronizar === 0) {
                  logProgresso(100, "Nenhuma atividade encontrada com os filtros selecionados.");
                  cache.remove("SYNC_STATUS");
                  return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: "Nenhuma atividade corresponde aos filtros." })).setMimeType(ContentService.MimeType.JSON);
              }

              for (let index = 0; index < totalParaSincronizar; index++) {
                  let ativ = atividadesParaSincronizar[index].dadosDaLinha;
                  let idAtiv = String(ativ[0]).trim();
                  let dataLimiteBruta = ativ[3];
                  let xpAtiv = Number(ativ[4]) || 0;
                  let turmaAlvoAtivOrig = String(ativ[5]).trim().toLowerCase();
                  let link = String(ativ[12]).trim();
                  let nomeModuloAtivOrig = String(ativ[15]).trim().toLowerCase();

                  let chaveBusca = nomeModuloAtivOrig + "_" + turmaAlvoAtivOrig;
                  let statusModulo = mapaModulos[chaveBusca] || mapaModulos[nomeModuloAtivOrig] || "aberto";

                  let porcentagem = 20 + Math.floor((index / totalParaSincronizar) * 75);
                  logProgresso(porcentagem, `Avaliando Turma: Missão ${idAtiv}...`);

                  if (statusModulo === "em breve") continue; 

                  let dataLimObj = null;
                  if (dataLimiteBruta instanceof Date) {
                      dataLimObj = new Date(dataLimiteBruta.getFullYear(), dataLimiteBruta.getMonth(), dataLimiteBruta.getDate());
                  } else if (typeof dataLimiteBruta === "string") {
                      let strDate = dataLimiteBruta.trim();
                      if (strDate.includes("-")) {
                          let p = strDate.split("-");
                          if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
                      } else if (strDate.includes("/")) {
                          let p = strDate.split("/");
                          if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                      }
                  }
                  if (dataLimObj) dataLimObj.setHours(0,0,0,0);

                  const match = link.match(/\/c\/([^\/\?]+)\/a\/([^\/\?]+)/i);
                  if (match && match[1] && match[2]) {

                      let courseId = decodificarId(match[1]);
                      let courseWorkId = decodificarId(match[2]);

                      try {
                          let pageToken = null;
                          do {
                              let response = Classroom.Courses.CourseWork.StudentSubmissions.list(courseId, courseWorkId, { pageToken: pageToken });
                              let submissions = response.studentSubmissions || [];

                              for (let sub of submissions) {
                                  if (sub.state === "TURNED_IN" || sub.state === "RETURNED") {

                                      let usr = resolverUsuario(sub.userId, courseId);
                                      let alunoDb = null;
                                      if (usr.email) alunoDb = mapaBuscaAluno[usr.email];
                                      if (!alunoDb && usr.nomeNorm) alunoDb = mapaBuscaAluno[usr.nomeNorm];
                                      
                                      // Fallback robusto por comparação de nome parcial
                                      if (!alunoDb && usr.nomeNorm) {
                                          for (let k = 0; k < listaAlunosAtivos.length; k++) {
                                              if (compararNomes(listaAlunosAtivos[k].nomeNorm, usr.nomeNorm)) {
                                                  alunoDb = listaAlunosAtivos[k];
                                                  break;
                                              }
                                          }
                                      }

                                      if (alunoDb) {
                                          let chaveEntrega = alunoDb.matricula + "_" + idAtiv;
                                          let entregaExistente = mapaEntregas[chaveEntrega];

                                          // FUSÃO INTELIGENTE
                                          if (!entregaExistente || 
                                              entregaExistente.status === "Aguardando Correção" || 
                                              entregaExistente.status === "Pendente" || 
                                              entregaExistente.status === "Aguardando Validação" ||
                                              entregaExistente.status === "Aguardando Validacao") {
                                              
                                              let dataEntregaAVA = sub.updateTime ? new Date(sub.updateTime) : new Date();
                                              let timestampRealDaEntrega = dataEntregaAVA.getTime();

                                              let xpGanhoFinal = xpAtiv;
                                              let notaAdicional = "";

                                              if (statusModulo === "encerrado") {
                                                  xpGanhoFinal = 0;
                                                  notaAdicional = " (Módulo Encerrado: 0 XP)";
                                              } else {
                                                  let atrasoDias = 0;
                                                  if (dataLimObj) {
                                                      let dataEnvioZero = new Date(dataEntregaAVA);
                                                      dataEnvioZero.setHours(0,0,0,0);
                                                      if (dataEnvioZero > dataLimObj) {
                                                          let diffTime = Math.abs(dataEnvioZero - dataLimObj);
                                                          atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                      }
                                                  }

                                                  let descontoAtraso = 0;
                                                  if (atrasoDias > 0 && xpAtiv > 0) {
                                                      let teto = Math.floor(xpAtiv / 2);
                                                      descontoAtraso = atrasoDias;
                                                      if (descontoAtraso > teto) descontoAtraso = teto;
                                                  }

                                                  let isGabaritoLiberado = ativ[17] === true || String(ativ[17]).toLowerCase() === "true";
                                                  let descontoGabarito = 0;
                                                  if (atrasoDias > 0 && isGabaritoLiberado && xpAtiv > 0) {
                                                      descontoGabarito = Math.floor(xpAtiv * 0.3);
                                                  }

                                                  let descontoTotal = descontoAtraso + descontoGabarito;
                                                  xpGanhoFinal = xpAtiv - descontoTotal;

                                                  let piso = Math.ceil(xpAtiv * 0.1);
                                                  if (xpGanhoFinal < piso) xpGanhoFinal = piso;

                                                  if (descontoTotal > 0) {
                                                      let msgs = [];
                                                      if (descontoAtraso > 0) msgs.push(`-${descontoAtraso}XP por Atraso`);
                                                      if (descontoGabarito > 0) msgs.push(`-30% por Gabarito Liberado`);
                                                      notaAdicional = ` (${msgs.join(", ")})`;
                                                  }
                                              }

                                              if (entregaExistente) {
                                                  abaEntregas.getRange(entregaExistente.linha, 5).setValue("Avaliado");
                                                  abaEntregas.getRange(entregaExistente.linha, 6).setValue(xpGanhoFinal);
                                                  
                                                  let feedbackAntigo = String(abaEntregas.getRange(entregaExistente.linha, 8).getValue() || "");
                                                  let msgAviso = "\n[🤖 AVA: Nota sincronizada automaticamente]";
                                                  abaEntregas.getRange(entregaExistente.linha, 8).setValue(feedbackAntigo + msgAviso + notaAdicional);
                                                  
                                                  alunoDb.xpAtual += xpGanhoFinal;
                                                  abaTrilha.getRange(alunoDb.linhaTrilha, 5).setValue(alunoDb.xpAtual);

                                                  mapaEntregas[chaveEntrega].status = "Avaliado";
                                                  entregasNovas++;
                                              } 
                                              else {
                                                  let idUnico = "SYNC-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
                                                  abaEntregas.appendRow([
                                                      idUnico, alunoDb.matricula, idAtiv,
                                                      "Entrega validada pelo AVA.", "Avaliado",
                                                      xpGanhoFinal, timestampRealDaEntrega, 
                                                      "Sincronizado via Google Classroom" + notaAdicional
                                                  ]);

                                                  alunoDb.xpAtual += xpGanhoFinal;
                                                  abaTrilha.getRange(alunoDb.linhaTrilha, 5).setValue(alunoDb.xpAtual);

                                                  mapaEntregas[chaveEntrega] = { status: "Avaliado" };
                                                  entregasNovas++;
                                              }
                                          }
                                      }
                                  }
                              }
                              pageToken = response.nextPageToken;
                          } while (pageToken);
                      } catch(e) {
                          logsErro.push(`Missão [${idAtiv}]: ${e.message}`);
                      }
                  }
              }

              logProgresso(100, "Concluído! Salvando dados...");

              let mensagemFinal = "";
              if (entregasNovas > 0) {
                  mensagemFinal = `Sincronização Perfeita! Projetos pendentes avaliados e novas notas importadas.`;
              } else {
                  mensagemFinal = `Sincronização concluída. Nenhuma nota nova para importar.`;
              }

              if (logsErro.length > 0) {
                  mensagemFinal += `\n\n⚠️ Erros ignorados da API:\n` + logsErro.slice(0, 3).join("\n");
              }

              cache.remove("SYNC_STATUS");

              return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: mensagemFinal })).setMimeType(ContentService.MimeType.JSON);

          } catch (e) {
              cache.remove("SYNC_STATUS");
              return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro crítico no servidor: " + e.message })).setMimeType(ContentService.MimeType.JSON);
          } finally {
              lock.releaseLock();
          }
      }

    // ==========================================
    // ROTA 43: LER STATUS DA SINCRONIZAÇÃO
    // ==========================================
      if (action === "status_sync") {
          const statusCache = CacheService.getScriptCache().get("SYNC_STATUS");
          if (statusCache) {
              return ContentService.createTextOutput(statusCache).setMimeType(ContentService.MimeType.JSON);
          } else {
              return ContentService.createTextOutput(JSON.stringify({ progresso: 0, mensagem: "Aguardando inicialização..." })).setMimeType(ContentService.MimeType.JSON);
          }
      }

    // ==========================================
    // ROTA 44: LOJA COMPRAR BILHETES DA RIFA
    // ==========================================
      if (action === "comprar_rifa") {
          const lock = LockService.getScriptLock();
          try {
              lock.waitLock(10000); // 🔒 Evita AutoClickers (Race Condition)
              const matricula = String(dadosApp.matricula).trim();
              const pacote = String(dadosApp.pacote).trim(); // "BRONZE", "PRATA", "OURO"

              // 🛡️ PREÇOS TABELADOS NO SERVIDOR (Impossível de fraudar pelo F12 do navegador)
              let custo = 0; let qtdBilhetes = 0;
              if (pacote === "BRONZE") { custo = 1000; qtdBilhetes = 10; }
              else if (pacote === "PRATA") { custo = 1800; qtdBilhetes = 20; }
              else if (pacote === "OURO") { custo = 2500; qtdBilhetes = 30; }
              else throw new Error("Pacote inválido manipulado no frontend.");

              const abaTrilha = planilha.getSheetByName("trilhatech");
              const planBase = planilha.getSheetByName("basededados");
              const abaRifa = planilha.getSheetByName("rifa_bilhetes");
              const abaEntregas = planilha.getSheetByName("entregas");

              if (!abaTrilha || !planBase || !abaRifa || !abaEntregas) {
                  return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Abas necessárias não encontradas." })).setMimeType(ContentService.MimeType.JSON);
              }

              // 1. Identificar o Aluno
              let nomeAluno = "Desconhecido";
              let dadosBase = planBase.getDataRange().getValues();
              for (let i = 1; i < dadosBase.length; i++) {
                  if (String(dadosBase[i][2]).trim() === matricula) { nomeAluno = String(dadosBase[i][0]); break; }
              }

              // 2. Analisar o Saldo e o XP Gasto na TrilhaTech (Ajustado para Coluna L)
              let linhaTrilha = -1; let xpTotal = 0; let xpGasto = 0; let turmaAluno = "";
              const dadosTrilha = abaTrilha.getDataRange().getValues();
              
              for (let i = 1; i < dadosTrilha.length; i++) {
                  if (String(dadosTrilha[i][0]).trim() === matricula) {
                      linhaTrilha = i + 1;
                      turmaAluno = String(dadosTrilha[i][1]).trim();
                      xpTotal = Number(dadosTrilha[i][4]) || 0;     // Coluna E (Índice 4: XP Ranking)
                      xpGasto = Number(dadosTrilha[i][11]) || 0;    // 🔥 Coluna L (Índice 11: XP Gasto)
                      break;
                  }
              }

              if (linhaTrilha === -1) {
                  return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aluno não encontrado na TrilhaTech." })).setMimeType(ContentService.MimeType.JSON);
              }

              // 3. Matemática Financeira
              let saldoCarteira = xpTotal - xpGasto;
              let limiteMaximoGasto = saldoCarteira * 0.60; // Só pode gastar 60% do saldo disponível

              // 🚨 TRAVA DE FRAUDE E FALÊNCIA MÚLTIPLA
              if (custo > limiteMaximoGasto) {
                  registrarLogSeguranca(matricula, nomeAluno, "TENTATIVA_COMPRA_INDEVIDA", `Tentou forçar pacote ${pacote} (${custo} XP). Saldo real: ${saldoCarteira}. Limite de 60%: ${limiteMaximoGasto}.`);
                  return ContentService.createTextOutput(JSON.stringify({
                      status: "erro", 
                      mensagem: "🚨 Transação Recusada! O seu saldo é insuficiente ou esta compra ultrapassa o limite de segurança de 60%."
                  })).setMimeType(ContentService.MimeType.JSON);
              }

              // 4. Efetiva a Compra!
              abaTrilha.getRange(linhaTrilha, 12).setValue(xpGasto + custo); // 🔥 Atualiza Coluna L (12)
              const timestamp = new Date().getTime();
              const dataStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");

              // 5. Injeta Bilhetes em Lote (Super Rápido para não pesar a planilha)
              let novosBilhetes = [];
              for (let b = 0; b < qtdBilhetes; b++) {
                  novosBilhetes.push(["RF-" + timestamp + "-" + b, matricula, nomeAluno, turmaAluno, dataStr, "ATIVO"]);
              }
              abaRifa.getRange(abaRifa.getLastRow() + 1, 1, novosBilhetes.length, 6).setValues(novosBilhetes);

              // 6. Registo no Extrato Visual do Aluno (Aba Entregas)
              abaEntregas.appendRow(["RIFA-" + timestamp, matricula, "LOJA-VIRTUAL", `Comprou Pacote ${pacote} (${qtdBilhetes} Bilhetes)`, "Avaliado", -custo, timestamp, "Transação Aprovada pela Loja"]);

              return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", mensagem: `Contrato Aceite! ${qtdBilhetes} Bilhetes gerados com sucesso.` })).setMimeType(ContentService.MimeType.JSON);

          } catch(e) {
              return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Erro no servidor: " + e.message })).setMimeType(ContentService.MimeType.JSON);
          } finally {
              lock.releaseLock();
          }
      }

    // ==========================================
    // ROTA 45: SORTEAR RIFA DA TURMA
    // ==========================================
      if (action === "sortear_rifa") {
          const TOKEN_SEGURANCA = "TrilhaTech_Seguranca_Total_2026";
          if (dadosApp.token !== TOKEN_SEGURANCA) {
              registrarLogSeguranca("TUTOR_DESCONHECIDO", "DESCONHECIDO", "TENTATIVA_ACESSO_SORTEIO", "Token inválido tentou aceder à roleta de sorteio.");
              return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Acesso Negado. Credenciais inválidas." })).setMimeType(ContentService.MimeType.JSON);
          }
          
          const lock = LockService.getScriptLock();
          try {
              lock.waitLock(15000);
              const turmaSorteio = String(dadosApp.turma).trim();
              const abaRifa = planilha.getSheetByName("rifa_bilhetes");
              
              if (!abaRifa) {
                  return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Aba rifa_bilhetes não encontrada." })).setMimeType(ContentService.MimeType.JSON);
              }

              const dadosRifa = abaRifa.getDataRange().getValues();
              let bilhetesValidos = [];
              
              // Separa apenas os bilhetes daquela turma que ainda não ganharam
              for (let i = 1; i < dadosRifa.length; i++) {
                  if (String(dadosRifa[i][3]).trim() === turmaSorteio && String(dadosRifa[i][5]).trim() === "ATIVO") {
                      bilhetesValidos.push({ linha: i + 1, id: dadosRifa[i][0], matricula: dadosRifa[i][1], nome: dadosRifa[i][2] });
                  }
              }

              if (bilhetesValidos.length === 0) return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Nenhum bilhete ativo encontrado nesta turma!" })).setMimeType(ContentService.MimeType.JSON);

              // 🎲 Algoritmo de Sorteio Aleatório (O Coração da Roleta)
              const vencedor = bilhetesValidos[Math.floor(Math.random() * bilhetesValidos.length)];
              
              // Queima o bilhete vencedor para ele não poder ganhar duas vezes na mesma rifa
              abaRifa.getRange(vencedor.linha, 6).setValue("SORTEADO_GANHADOR");

              return ContentService.createTextOutput(JSON.stringify({ 
                  status: "sucesso", 
                  ganhador: { nome: vencedor.nome, matricula: vencedor.matricula, bilhete: vencedor.id } 
              })).setMimeType(ContentService.MimeType.JSON);
          } catch (e) {
              return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Servidor ocupado ao sortear rifa. Tente novamente." })).setMimeType(ContentService.MimeType.JSON);
          } finally {
              lock.releaseLock();
          }
      }

    // ==========================================
    // ROTA 46: HISTORICO DE BILHETES (alunos)
    // ==========================================
      if (action === "buscar_bilhetes_aluno") {
          const matricula = String(dadosApp.matricula).trim();
          const abaRifa = planilha.getSheetByName("rifa_bilhetes");
          const dadosRifa = abaRifa.getDataRange().getValues();
          let meusBilhetes = [];
          
          for (let i = 1; i < dadosRifa.length; i++) {
              if (String(dadosRifa[i][1]).trim() === matricula) {
                  meusBilhetes.push({ 
                      id: dadosRifa[i][0], 
                      data: dadosRifa[i][4], 
                      status: dadosRifa[i][5],
                      ciclo: dadosRifa[i][6] 
                  });
              }
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "sucesso", bilhetes: meusBilhetes })).setMimeType(ContentService.MimeType.JSON);
      }


  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: erro.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
} // <-- FIM DO doPost

// ==========================================
// FUNÇÃO DE SEGURANÇA: LOGS ANTI-FRAUDE
// ==========================================
function registrarLogSeguranca(matricula, nome, acao, detalhes) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let sheetLog = planilha.getSheetByName("logs_seguranca");
  if (sheetLog) {
    const dataHora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheetLog.appendRow([dataHora, matricula, nome, acao, detalhes]);
  }
}

// ==========================================
// FUNÇÃO AUXILIAR: LIMPEZA DE CACHE (INVALIDAÇÃO)
// ==========================================
function invalidarCacheGeral(abasAdicionais) {
  const cache = CacheService.getScriptCache();
  let abas = ["basededados", "controle_modulos", "atividades", "configuracoes"];
  if (abasAdicionais && Array.isArray(abasAdicionais)) {
    abas = abas.concat(abasAdicionais);
  } else if (abasAdicionais && typeof abasAdicionais === "string") {
    abas.push(abasAdicionais);
  }
  
  let chavesParaRemover = [];
  
  // Remove duplicatas
  abas = Array.from(new Set(abas));
  
  abas.forEach(aba => {
    chavesParaRemover.push("CACHE_" + aba);
    chavesParaRemover.push("CACHE_" + aba + "_CHUNKS");
    for (let i = 0; i < 15; i++) chavesParaRemover.push("CACHE_" + aba + "_" + i);
  });
  
  cache.removeAll(chavesParaRemover);
}

// ==========================================
// FUNÇÃO AUXILIAR: LEITURA DE CACHE ULTRA RÁPIDA (BLINDADA)
// ==========================================
  function lerComCacheSeguro(nomeAba, tempoSegundos) {
    const cache = CacheService.getScriptCache();
    const cacheChave = "CACHE_" + nomeAba;
    let dadosString = cache.get(cacheChave);

    try {
      if (dadosString) return JSON.parse(dadosString);
      let chunksTotal = cache.get(cacheChave + "_CHUNKS");
      if (chunksTotal) {
        let reconstruido = "";
        for (let c = 0; c < Number(chunksTotal); c++) reconstruido += cache.get(cacheChave + "_" + c) || "";
        if (reconstruido) return JSON.parse(reconstruido);
      }
    } catch(e) {}

    // Concorrência Segura: Garante que apenas 1 requisição leia a planilha por vez ao expirar o cache
    const lock = LockService.getScriptLock();
    let lockAdquirido = false;
    try {
      lock.waitLock(10000); // Espera até 10 segundos na fila de leitura
      lockAdquirido = true;

      // Duplo Check: Verifica se o cache foi preenchido enquanto esperava o lock
      dadosString = cache.get(cacheChave);
      if (dadosString) return JSON.parse(dadosString);
      let chunksTotal = cache.get(cacheChave + "_CHUNKS");
      if (chunksTotal) {
        let reconstruido = "";
        for (let c = 0; c < Number(chunksTotal); c++) reconstruido += cache.get(cacheChave + "_" + c) || "";
        if (reconstruido) return JSON.parse(reconstruido);
      }

      const planilha = SpreadsheetApp.getActiveSpreadsheet();
      let aba = planilha.getSheetByName(nomeAba);
      if (!aba) return [];

      let dados = aba.getDataRange().getValues();
      let timezone = Session.getScriptTimeZone();
      
      let dadosProcessados = dados.map(linha => linha.map(celula => {
        if (celula instanceof Date) {
          let d = String(celula.getDate()).padStart(2, '0');
          let m = String(celula.getMonth() + 1).padStart(2, '0');
          let y = celula.getFullYear();
          return `${d}/${m}/${y}`; 
        }
        return celula;
      }));

      let jsonStr = JSON.stringify(dadosProcessados);

      try {
        if (jsonStr.length < 90000) {
          cache.put(cacheChave, jsonStr, tempoSegundos);
        } else {
          let numChunks = Math.ceil(jsonStr.length / 90000);
          cache.put(cacheChave + "_CHUNKS", String(numChunks), tempoSegundos);
          for (let c = 0; c < numChunks; c++) {
            cache.put(cacheChave + "_" + c, jsonStr.substring(c * 90000, (c + 1) * 90000), tempoSegundos);
          }
        }
      } catch (e) {}

      return dadosProcessados;

    } catch (e) {
      // Fallback de emergência caso ocorra algum timeout no lock
      try {
        const planilha = SpreadsheetApp.getActiveSpreadsheet();
        let aba = planilha.getSheetByName(nomeAba);
        if (aba) return aba.getDataRange().getValues();
      } catch (err) {}
      return [];
    } finally {
      if (lockAdquirido) {
        lock.releaseLock();
      }
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

// ========================================================
// 🤖 ROBÔ MIGRADOR DE DADOS LEGADOS (TRILHA TECH)
// ========================================================
function migrarAtividadesInteligente() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaAtividades = planilha.getSheetByName("atividades");
  
  if (!abaAtividades) {
    SpreadsheetApp.getUi().alert("Aba 'atividades' não encontrada!");
    return;
  }

  const dados = abaAtividades.getDataRange().getValues();
  let alteradas = 0;

  // 🔥 MAPEAMENTO INTELIGENTE: Liga a turma antiga ao Curso Novo Oficial
  const mapeamentoModulos = {
    "Turma 1 - 1º Ano": "Módulo 1 - Lógica Matemática e Programação em Python",
    "Turma 2 - 2º Ano": "Módulo 3.1 - HTML" // As antigas da T2 eram de HTML
  };

  // Começa do 1 para pular o cabeçalho
  for (let i = 1; i < dados.length; i++) {
    let idAtiv = String(dados[i][0]).trim();
    if (!idAtiv || idAtiv === "ID") continue;

    let tituloAtual = String(dados[i][1]).trim();   // Coluna B
    let turmaAlvo = String(dados[i][5]).trim();     // Coluna F
    let moduloAtual = String(dados[i][15]).trim();  // Coluna P

    // 1. Procura o número da aula no módulo atual ou no título
    let matchAula = moduloAtual.match(/Aula\s*(\d+)/i) || tituloAtual.match(/Aula\s*(\d+)/i);
    
    if (matchAula) {
      let numeroAula = matchAula[1].padStart(2, '0'); // Transforma "1" em "01"
      let prefixo = "[Aula " + numeroAula + "] ";

      // 2. Limpa o título atual para não ficar com "Aula 01" duplicado
      // Isso remove coisas como "Aula 01 - ", "Aula 01- ", "Aula 01" do início
      let tituloLimpo = tituloAtual.replace(/^(Aula\s*\d+\s*[-–]*\s*)/i, "").trim();
      
      // Monta o título final
      if (!tituloLimpo.startsWith("[Aula")) {
        tituloLimpo = prefixo + tituloLimpo;
      }

      // 3. Define o módulo correto baseado na turma do aluno
      let moduloCorreto = mapeamentoModulos[turmaAlvo] || "Módulo Geral";

      // 4. Salva as alterações APENAS se algo mudou (para não pesar a planilha)
      if (tituloAtual !== tituloLimpo || moduloAtual !== moduloCorreto) {
        // Atualiza Título (Coluna B = 2)
        abaAtividades.getRange(i + 1, 2).setValue(tituloLimpo);
        // Atualiza Módulo (Coluna P = 16)
        abaAtividades.getRange(i + 1, 16).setValue(moduloCorreto);
        alteradas++;
      }
    }
  }

  // Avisa que terminou!
  SpreadsheetApp.getUi().alert("✅ Migração Concluída! Foram formatadas e migradas " + alteradas + " atividades com sucesso.");
}

function autorizarSuperPoderes() {
  Classroom.Courses.list();
  DriveApp.getFiles();
}

function repararXP() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaTrilha = planilha.getSheetByName("trilhatech");
  const abaEntregas = planilha.getSheetByName("entregas");
  const abaFrequencia = planilha.getSheetByName("frequencia");

  let xpCorretoDoAluno = {};

  // 1. Soma todo o XP válido que sobrou na aba Entregas (Atividades, Pix, GodMode)
  const dadosEnt = abaEntregas.getDataRange().getValues();
  for(let i = 1; i < dadosEnt.length; i++) {
    let matricula = String(dadosEnt[i][1]).trim();
    let status = String(dadosEnt[i][4]).trim();
    let xp = Number(dadosEnt[i][5]) || 0;
    
    if(!xpCorretoDoAluno[matricula]) xpCorretoDoAluno[matricula] = 0;
    if(status === "Avaliado" || status === "Concluída") {
      xpCorretoDoAluno[matricula] += xp;
    }
  }

  // 2. Soma o XP dos Check-ins de Frequência
  const dadosFreq = abaFrequencia.getDataRange().getValues();
  for(let i = 1; i < dadosFreq.length; i++) {
    let matricula = String(dadosFreq[i][1]).trim();
    let xp = Number(dadosFreq[i][5]) || 0;
    
    if(!xpCorretoDoAluno[matricula]) xpCorretoDoAluno[matricula] = 0;
    xpCorretoDoAluno[matricula] += xp;
  }

  // 3. Atualiza a aba TrilhaTech substituindo o XP errado pelo calculado
  const dadosTrilha = abaTrilha.getDataRange().getValues();
  for(let i = 1; i < dadosTrilha.length; i++) {
    let matricula = String(dadosTrilha[i][0]).trim();
    if(matricula && xpCorretoDoAluno[matricula] !== undefined) {
      abaTrilha.getRange(i + 1, 5).setValue(xpCorretoDoAluno[matricula]); // Grava na Coluna E
    }
  }

  SpreadsheetApp.getUi().alert("XP de todos os alunos recalculado com sucesso!");
}