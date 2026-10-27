/**************************************************************
 * DIÁRIO DE AULA 2026 - PARTE 2 (CONSOLIDADA E LIMPA)
 **************************************************************/

/**
 * Função principal que gerencia o desenho da planilha.
 * Recebe os dados processados pela PARTE 1.
 */
function gerarPlanilhaDiario(registrosEM, registrosEJA) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(CONFIG.NOME_ABA);
  
  if (!aba) { 
    aba = ss.insertSheet(CONFIG.NOME_ABA); 
  }

  aba.clear();
  aba.setHiddenGridlines(false);
  configurarCabecalhoGeral(aba);

  const possuiEM = Object.keys(registrosEM).length > 0;
  const possuiEJA = Object.keys(registrosEJA).length > 0;

  if (possuiEM) gerarTabelaEM(aba, registrosEM, 1);
  if (possuiEJA) gerarTabelaEJA(aba, registrosEJA, possuiEM ? 8 : 1);

  ajustarLarguras(aba);
}

function configurarCabecalhoGeral(aba) {
  aba.getRange("A1:L2").merge().setValue("📚 CONTROLE DE DIÁRIO DE AULA 2026")
    .setFontSize(18).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setBackground("#1D3557").setFontColor("#FFFFFF");
}

function gerarTabelaEM(aba, registros, colunaInicial) {
  const linhaInicial = 4;
  aba.getRange(linhaInicial, colunaInicial, 1, 4).merge().setValue("🎓 ENSINO MÉDIO")
    .setFontSize(14).setFontWeight("bold").setBackground("#2563EB").setFontColor("#FFFFFF");
  aba.getRange(linhaInicial + 1, colunaInicial, 1, 4).setValues([["📅 Data", "📖 Dia", "📌 Status", "⏰ Hora"]])
    .setFontWeight("bold");
  preencherCalendario(aba, registros, linhaInicial + 2, colunaInicial, false);
}

function gerarTabelaEJA(aba, registros, colunaInicial) {
  const linhaInicial = 4;
  aba.getRange(linhaInicial, colunaInicial, 1, 4).merge().setValue("🧑‍🏫 EJA")
    .setFontSize(14).setFontWeight("bold").setBackground("#7C3AED").setFontColor("#FFFFFF");
  aba.getRange(linhaInicial + 1, colunaInicial, 1, 4).setValues([["📅 Data", "📖 Dia", "📌 Status", "⏰ Hora"]])
    .setFontWeight("bold");
  preencherCalendario(aba, registros, linhaInicial + 2, colunaInicial, true);
}

function preencherCalendario(aba, registros, linha, coluna, incluirSabado) {
  const tz = Session.getScriptTimeZone();
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const fim = new Date(CONFIG.ANO, 11, 31);
  let atual = new Date(CONFIG.DATA_INICIO);

  while (atual <= fim) {
    const diaSemana = atual.getDay();
    const chave = Utilities.formatDate(atual, tz, "yyyy-MM-dd");
    const ehDiaLetivo = incluirSabado ? (diaSemana >= 1 && diaSemana <= 6) : (diaSemana >= 1 && diaSemana <= 5);
    const situacao = calcularStatus(chave, registros, hoje, ehDiaLetivo);
    const hora = registros[chave] ? registros[chave].hora : "-";
    const nomes = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    aba.getRange(linha, coluna, 1, 4).setValues([[Utilities.formatDate(atual, tz, "dd/MM/yyyy"), nomes[diaSemana], situacao, hora]]);

    if (ehDiaLetivo) {
      aba.getRange(linha, coluna + 1).setBackground("#DBEAFE").setFontColor("#1E40AF").setFontWeight("bold");
    }
    aplicarCorStatus(aba, linha, coluna + 2, situacao);
    linha++;
    atual.setDate(atual.getDate() + 1);
  }
}

function calcularStatus(chave, registros, hoje, ehDiaLetivo) {
  if (registros[chave]) return "✅ Entregue";
  if (!ehDiaLetivo) return "---";
  const data = new Date(chave + "T00:00:00");
  if (data < hoje) return "❌ Atrasado";
  if (data.getTime() === hoje.getTime()) return "⏳ Pendente";
  return "---";
}

function aplicarCorStatus(aba, linha, coluna, status) {
  const celula = aba.getRange(linha, coluna);
  if (status.indexOf("Entregue") > -1) celula.setBackground("#DCFCE7").setFontColor("#166534").setFontWeight("bold");
  else if (status.indexOf("Atrasado") > -1) celula.setBackground("#FEE2E2").setFontColor("#991B1B").setFontWeight("bold");
  else if (status === "---") celula.setBackground("#F3F4F6").setFontColor("#64748B").setFontWeight("bold");
  else celula.setBackground("#FEF3C7").setFontColor("#92400E").setFontWeight("bold");
}

function ajustarLarguras(aba) {
  [1, 8].forEach(col => {
    aba.setColumnWidth(col, 120);
    aba.setColumnWidth(col + 1, 130);
    aba.setColumnWidth(col + 2, 140);
    aba.setColumnWidth(col + 3, 100);
  });
}