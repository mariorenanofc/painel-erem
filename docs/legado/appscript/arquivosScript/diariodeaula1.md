/**************************************************************
 * DIÁRIO DE AULA 2026
 * CODE.GS - PARTE 1
 **************************************************************/

/**************************************************************
 * CONFIGURAÇÕES
 **************************************************************/

const CONFIG = {

  ANO: 2026,

  NOME_ABA: "📚 Diário de Aula",

  DATA_INICIO: new Date(2026, 3, 6),

  // ATUALIZADO: Incluído [PFT] conforme padrão dos novos formulários
  QUERY_EM:
  'subject:"[PFT] DIÁRIO DE AULA 2026 - ENSINO MÉDIO"',

  QUERY_EJA:
  'subject:"[PFT] DIÁRIO DE AULA 2026 - EJA"',

  LIMITE_THREADS: 500

};

/**************************************************************
 * WEB APP
 **************************************************************/

function doGet() {

  return HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Diário de Aula")
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}

function include(nomeArquivo) {

  return HtmlService
    .createHtmlOutputFromFile(nomeArquivo)
    .getContent();

}

/**************************************************************
 * USUÁRIO
 **************************************************************/

function obterUsuario() {

  try {

    const email =
      Session.getActiveUser().getEmail();

    const nome = email
      ? email.split("@")[0]
      : "Usuário";

    return {

      sucesso: true,

      nome,

      email

    };

  }

  catch (erro) {

    return {

      sucesso: false,

      erro: erro.toString()

    };

  }

}

/**************************************************************
 * LOG
 **************************************************************/

function adicionarLog(

  resposta,

  mensagem

) {

  resposta.logs.push({

    data:
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "dd/MM/yyyy HH:mm:ss"
      ),

    mensagem

  });

}

/**************************************************************
 * INICIANDO EXTRAÇÃO
 **************************************************************/
// Apenas na PARTE 1:
function iniciarExtracao() {
  const html = HtmlService.createHtmlOutputFromFile('Progresso')
      .setWidth(400)
      .setHeight(350);
  SpreadsheetApp.getUi().showModalDialog(html, 'Status da Extração');
}
/**************************************************************
 * BUSCA EMAIL EM
 **************************************************************/

function buscarEmailsEM() {

  return buscarEmails(
    CONFIG.QUERY_EM
  );

}

/**************************************************************
 * BUSCA EMAIL EJA
 **************************************************************/

function buscarEmailsEJA() {

  return buscarEmails(
    CONFIG.QUERY_EJA
  );

}

/**************************************************************
 * MOTOR DE BUSCA
 **************************************************************/

/**************************************************************
 * MOTOR DE BUSCA (ATUALIZADO)
 **************************************************************/
function buscarEmails(queryBase) {
  const registros = {};
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999); // Garante que e-mails de hoje sejam incluídos

  const query = `
    ${queryBase}
    after:${CONFIG.ANO - 1}/12/31
    before:${CONFIG.ANO + 1}/01/01
  `;

  const threads = GmailApp.search(query, 0, CONFIG.LIMITE_THREADS);

  threads.forEach(thread => {
    const mensagens = thread.getMessages();
    mensagens.forEach(msg => {
      const resultado = extrairDataEmail(msg);
      if (!resultado) return;

      // Conversão segura para comparar datas
      const dataEmail = new Date(resultado.data.replace(/-/g, '/'));
      
      // APENAS ADICIONA SE A DATA NÃO FOR FUTURA
      if (dataEmail <= hoje) {
        registros[resultado.data] = {
          hora: resultado.hora,
          assunto: msg.getSubject()
        };
      }
    });
  });

  return registros;
}

/**************************************************************
 * EXTRAÇÃO DE DATA - MÉTODOS 1 A 5
 **************************************************************/

function extrairDataEmail(msg) {

  try {

    const tz =
      Session.getScriptTimeZone();

    const texto =
      msg.getPlainBody();

    const html =
      msg.getBody();

    let data = null;

    /************************************************
     * MÉTODO 1 - ATUALIZADO: Regex mais flexível para capturar
     * variações de espaços e quebras no padrão DD / MM / AAAA
     ************************************************/

    const regexMultilinha =
      /DD\s*[\/\-\.]?\s*(\d{1,2})\s*[\/\-\.]?\s*MM\s*[\/\-\.]?\s*(\d{1,2})\s*[\/\-\.]?\s*AAAA\s*[\/\-\.]?\s*(\d{4})/i;

    const m1 =
      texto.match(
        regexMultilinha
      );

    if (m1) {

      data =
        montarData(
          m1[1],
          m1[2],
          m1[3]
        );

    }

    /************************************************
     * MÉTODO 2 - Texto Compactado
     ************************************************/

    if (!data) {

      const textoCompactado =
        texto.replace(
          /[\s\r\n\/]+/g,
          ""
        );

      const regexCompactado =
        /DD(\d{1,2})MM(\d{1,2})AAAA(\d{4})/i;

      const m2 =
        textoCompactado.match(
          regexCompactado
        );

      if (m2) {

        data =
          montarData(
            m2[1],
            m2[2],
            m2[3]
          );

      }

    }

    /************************************************
     * MÉTODO 3 - HTML Limpo
     ************************************************/

    if (!data) {

      const htmlLimpo =
        html
          .replace(
            /<[^>]*>/g,
            " "
          )
          .replace(
            /\s+/g,
            " "
          );

      const regexHtml =
        /DD\s*[\/\-\.]?\s*(\d{1,2}).*MM\s*[\/\-\.]?\s*(\d{1,2}).*AAAA\s*[\/\-\.]?\s*(\d{4})/i;

      const m3 =
        htmlLimpo.match(
          regexHtml
        );

      if (m3) {

        data =
          montarData(
            m3[1],
            m3[2],
            m3[3]
          );

      }

    }

    /************************************************
     * MÉTODO 4 - Data do Registro
     ************************************************/

    if (!data) {

      const marcador =
        "Data do registro";

      const posicao =
        texto.indexOf(
          marcador
        );

      if (posicao > -1) {

        const trecho =
          texto.substring(
            posicao,
            posicao + 200
          );

        const numeros =
          trecho.match(
            /\d+/g
          );

        if (
          numeros &&
          numeros.length >= 3
        ) {

          data =
            montarData(
              numeros[0],
              numeros[1],
              numeros[2]
            );

        }

      }

    }

    /************************************************
     * MÉTODO 5 - Data do Email
     ************************************************/

    if (!data) {

      data =
        Utilities.formatDate(
          msg.getDate(),
          tz,
          "yyyy-MM-dd"
        );

    }

    const hora =
      Utilities.formatDate(
        msg.getDate(),
        tz,
        "HH:mm:ss"
      );

    return {

      data,

      hora

    };

  }

  catch (erro) {

    Logger.log(
      erro.toString()
    );

    return null;

  }

}

/**************************************************************
 * UTILITÁRIOS
 **************************************************************/

function montarData(
  dia,
  mes,
  ano
) {

  return `${ano}-${
    String(mes)
      .padStart(2,"0")
  }-${
    String(dia)
      .padStart(2,"0")
  }`;

}

function formatarDataBR(
  data
) {

  return Utilities.formatDate(
    data,
    Session.getScriptTimeZone(),
    "dd/MM/yyyy"
  );

}

function formatarHora(
  data
) {

  return Utilities.formatDate(
    data,
    Session.getScriptTimeZone(),
    "HH:mm:ss"
  );

}

/**************************************************************
 * PONTE DE EXECUÇÃO (CHAMADA PELO HTML)
 **************************************************************/
function rodarProcessoReal() {
  try {
    Logger.log("Iniciando rodarProcessoReal...");
    
    // 1. Busca os e-mails do Ensino Médio
    Logger.log("Buscando EM...");
    const dadosEM = buscarEmailsEM();
    
    // 2. Busca os e-mails da EJA
    Logger.log("Buscando EJA...");
    const dadosEJA = buscarEmailsEJA();
    
    // 3. Processa e desenha a planilha com os dados coletados
    Logger.log("Gerando planilha...");
    gerarPlanilhaDiario(dadosEM, dadosEJA);
    
    Logger.log("Processo concluído com sucesso!");
    return "Planilha atualizada com sucesso!";
    
  } catch (erro) {
    Logger.log("Erro em rodarProcessoReal: " + erro.toString());
    throw new Error("Falha no processamento: " + erro.message);
  }
}