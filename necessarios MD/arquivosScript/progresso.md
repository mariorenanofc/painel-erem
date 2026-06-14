<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8fafc;
        margin: 0;
        padding: 20px;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100cc;
      }
      .card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        width: 100%;
        max-width: 340px;
        text-align: center;
      }
      .title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #1d3557;
      }
      .status-container {
        margin: 20px 0;
      }
      .status-text {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 10px;
        font-weight: 500;
      }
      /* Barra de Progresso */
      .progress-bar-container {
        background-color: #e2e8f0;
        border-radius: 9999px;
        overflow: hidden;
        height: 10px;
        width: 100%;
      }
      .progress-bar {
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        height: 100%;
        width: 15%; /* Começa simulando um carregamento */
        border-radius: 9999px;
        transition: width 0.4s ease;
      }
      /* Spinner Animado */
      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #2563eb;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .success-icon {
        color: #166534;
        font-size: 32px;
        margin-bottom: 10px;
        display: none;
      }
      .error-box {
        background-color: #fef2f2;
        border: 1px solid #fee2e2;
        color: #991b1b;
        padding: 10px;
        border-radius: 6px;
        font-size: 13px;
        text-align: left;
        word-break: break-word;
        display: none;
        margin-top: 15px;
      }
    </style>
  </head>
  <body>

    <div class="card">
      <div id="spinner" class="spinner"></div>
      <div id="success-icon" class="success-icon">✅</div>

      <div class="title" id="main-title">Sincronizando Diário</div>

      <div class="status-container">
        <div id="status" class="status-text">Iniciando conexão com o servidor...</div>
        <div class="progress-bar-container" id="bar-container">
          <div id="progress" class="progress-bar"></div>
        </div>
      </div>

      <div id="error-message" class="error-box"></div>
    </div>

    <script>
      window.onload = function() {
        const statusEl = document.getElementById('status');
        const progressEl = document.getElementById('progress');
        const spinnerEl = document.getElementById('spinner');
        const successEl = document.getElementById('success-icon');
        const errorEl = document.getElementById('error-message');
        const barContainer = document.getElementById('bar-container');
        const titleEl = document.getElementById('main-title');

        // Passo 1: Mudança visual rápida simulando o início da varredura
        setTimeout(() => {
          statusEl.innerHTML = "Vasculhando e-mails do Ensino Médio...";
          progressEl.style.width = "40%";
        }, 1200);

        // Passo 2: Próxima etapa simulada (já que a chamada do GAS é síncrona por execução)
        setTimeout(() => {
          statusEl.innerHTML = "Vasculhando e-mails da EJA...";
          progressEl.style.width = "70%";
        }, 4000);

        // Dispara a execução real no servidor do Google
        google.script.run
          .withSuccessHandler(function(msg) {
            // Sucesso total
            progressEl.style.width = "100%";
            statusEl.innerHTML = "Planilha atualizada com sucesso!";
            statusEl.style.color = "#166534";
            titleEl.innerHTML = "Concluído!";
            spinnerEl.style.display = "none";
            successEl.style.display = "block";

            // Fecha o modal automaticamente após 2.5 segundos
            setTimeout(() => {
              google.script.host.close();
            }, 2500);
          })
          .withFailureHandler(function(err) {
            // Se der erro em qualquer parte do processo
            spinnerEl.style.display = "none";
            barContainer.style.display = "none";
            statusEl.innerHTML = "Ocorreu um erro no processamento.";
            statusEl.style.color = "#991b1b";
            titleEl.innerHTML = "Falha na Extração";

            errorEl.innerHTML = "<b>Detalhes:</b> " + err.message;
            errorEl.style.display = "block";
          })
          .rodarProcessoReal(); // Chama a função que criamos no code.gs
      };
    </script>

  </body>
</html>
