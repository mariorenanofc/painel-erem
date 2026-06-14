/**************************************************************
 * MENU PRINCIPAL (VERSÃO DEPURADA)
 **************************************************************/

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // Log para garantir que a função está sendo disparada
  Logger.log("Iniciando criação do menu...");

  try {
    // Removemos o try/catch interno para que, se houver erro, 
    // ele apareça nas Execuções e você saiba o motivo exato.
    ui.createMenu('🟠MENU')
      .addItem('Google Classroom', 'abrirMenuPrincipal')
      .addSeparator()
      .addItem('Extrair Diário', 'iniciarExtracao')
      .addToUi();
      
    Logger.log("Menu criado com sucesso.");
  } catch (e) {
    // Se o menu não aparecer, verifique o Log de Execuções (Ctrl+Enter no editor)
    Logger.log("Erro crítico ao criar menu: " + e.toString());
  }
}
