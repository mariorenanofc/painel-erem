// =========================================================================
// INTERFACE E MENUS CUSTOMIZADOS
// =========================================================================
function executarExtracao() {
abrirMenuPrincipal();
}

// =========================================================================
// PAINEL PRINCIPAL DE GERENCIAMENTO
// OTIMIZAÇÃO: abre rápido com dados brutos (sem chamada à API do Classroom)
// O nome real é buscado em segundo plano pelo próprio painel via JS
// =========================================================================
function abrirMenuPrincipal() {
// Lê apenas os links/IDs salvos — SEM chamar a API do Classroom aqui
// Isso faz o painel abrir instantaneamente
let linksOuIds = [];
try {
const raw = PropertiesService.getScriptProperties().getProperty('LINKS_TURMAS') || "";
linksOuIds = raw.split(",").map(s => s.trim()).filter(Boolean);
} catch(e) {
SpreadsheetApp.getUi().alert("Erro ao ler turmas: " + e.message);
return;
}

const totalTurmas = linksOuIds.length;

// Monta HTML das linhas de turma usando apenas o ID/link salvo
// O nome real é resolvido via google.script.run em background (não trava a abertura)
let blocoTurmasHtml = "";
if (totalTurmas === 0) {
blocoTurmasHtml = `<div class="sem-turmas"><i class="ti ti-school-off"></i><span>Nenhuma turma vinculada</span></div>`;
} else {
linksOuIds.forEach((item, index) => {
// Extrai ID legível para exibir enquanto carrega o nome real
let idExibido = item;
if (item.includes("classroom.google.com")) {
const m = item.match(/\/(?:c|f|w|courses)\/([^\/\?\#]+)/i);
if (m && m[1]) idExibido = m[1];
}
blocoTurmasHtml += `
        <div class="linha-turma" id="linha-${index}" data-index="${index}">
          <div class="turma-info">
            <div class="turma-nome" id="nome-${index}">
              <span class="carregando-nome">Carregando...</span>
            </div>
            <div class="turma-id" id="id-${index}">ID: ${idExibido}</div>
          </div>
          <button class="btn-desvincular" onclick="desvincularTurma(${index}, this)" title="Remover turma">
            <span class="icone-x">✕</span>
            <span class="spinner-mini"></span>
          </button>
        </div>`;
});
}

const estaDesativado = totalTurmas === 0 ? "disabled" : "";
const classeBotaoRestrito = totalTurmas === 0 ? "desativado" : "";

const html = `<!DOCTYPE html>

<html>
<head>
  <base target="_top">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #F1F5F9;
      color: #1E293B;
      padding: 16px;
      min-height: 100%;
      overflow: hidden;
    }

    /* ---- PAINEL PRINCIPAL ---- */
    .painel {
      background: #FFFFFF;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
      position: relative;
    }
    .painel-header {
      background: #0F172A;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .painel-titulo { font-size: 14px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.3px; }
    .painel-subtitulo { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .badge-count {
      background: #334155;
      color: #94A3B8;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 20px;
      border: 1px solid #475569;
    }
    .badge-count.tem-turmas { background: #1D4ED8; color: #BFDBFE; border-color: #2563EB; }

    /* ---- LISTA DE TURMAS ---- */
    .lista-turmas {
      max-height: 140px;
      overflow-y: auto;
      padding: 8px 0;
    }
    .lista-turmas::-webkit-scrollbar { width: 4px; }
    .lista-turmas::-webkit-scrollbar-track { background: transparent; }
    .lista-turmas::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
    .linha-turma {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 20px;
      border-bottom: 1px solid #F1F5F9;
      transition: background 0.15s, opacity 0.2s;
    }
    .linha-turma:last-child { border-bottom: none; }
    .linha-turma:hover { background: #F8FAFC; }
    .linha-turma.removendo { opacity: 0.3; pointer-events: none; }
    .turma-info { flex: 1; min-width: 0; }
    .turma-nome {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .carregando-nome { color: #94A3B8; font-style: italic; font-weight: 400; }
    .turma-id { font-size: 11px; color: #94A3B8; margin-top: 1px; }

    /* ---- BOTÃO REMOVER (X VERMELHO) ---- */
    .btn-desvincular {
      background: #FEE2E2;
      border: 1.5px solid #FECACA;
      color: #DC2626;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
      margin-left: 10px;
      transition: all 0.15s;
      line-height: 1;
    }
    .btn-desvincular:hover { background: #EF4444; border-color: #EF4444; color: #FFFFFF; }
    .btn-desvincular.carregando { pointer-events: none; opacity: 0.6; }
    .icone-x { display: block; }
    .spinner-mini {
      width: 12px;
      height: 12px;
      border: 2px solid #FECACA;
      border-top-color: #EF4444;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: none;
    }
    .btn-desvincular.carregando .icone-x { display: none; }
    .btn-desvincular.carregando .spinner-mini { display: block; }

    .sem-turmas {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 24px 20px;
      color: #94A3B8;
      font-size: 13px;
    }
    .sem-turmas i { font-size: 28px; color: #CBD5E1; }

    /* ---- AÇÕES ---- */
    .acoes {
      padding: 14px 20px;
      display: flex;
      gap: 10px;
      border-top: 1px solid #F1F5F9;
      background: #F8FAFC;
    }
    .btn-acao {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-adicionar { background: #1D4ED8; color: #FFFFFF; }
    .btn-adicionar:hover { background: #1E40AF; }
    .btn-extrair { background: #16A34A; color: #FFFFFF; }
    .btn-extrair:hover:not(:disabled) { background: #15803D; }
    .btn-acao:disabled, .btn-acao.desativado {
      background: #E2E8F0 !important;
      color: #94A3B8 !important;
      cursor: not-allowed !important;
    }
    .footer {
      padding: 10px 20px;
      font-size: 11px;
      color: #94A3B8;
      text-align: center;
      border-top: 1px solid #F1F5F9;
    }

    /* ---- ÁREA DE PROGRESSO ---- */
    #area-progresso { display: none; padding: 20px; }
    .progress-label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .progress-track { width: 100%; height: 8px; background: #E2E8F0; border-radius: 8px; overflow: hidden; }
    .progress-fill { height: 100%; width: 0%; background: #2563EB; border-radius: 8px; transition: background 0.3s; }
    .progress-pct { font-size: 11px; color: #64748B; text-align: right; margin-top: 4px; font-weight: 600; }
    .logger { font-size: 11px; font-family: monospace; color: #D97706; margin-top: 8px; height: 15px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .log-erros { font-size: 11px; color: #EF4444; background: #FEF2F2; border: 1px solid #FECACA; padding: 8px; margin-top: 10px; border-radius: 6px; display: none; max-height: 70px; overflow-y: auto; white-space: pre-line; }
    .acoes-progresso { display: flex; gap: 10px; margin-top: 14px; }
    .btn-prog { flex: 1; padding: 9px; font-size: 13px; font-weight: 600; border-radius: 8px; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.15s; }
    .btn-prog-cancel { background: #FFF; color: #475569; }
    .btn-prog-cancel:hover { background: #F8FAFC; }
    .btn-prog-ok { background: #E2E8F0; color: #94A3B8; cursor: not-allowed; }
    .btn-prog-ok.ativo { background: #16A34A; color: #FFF; border-color: #16A34A; cursor: pointer; }
    .btn-prog-ok.gravando { background: #1E293B !important; color: #64748B !important; cursor: not-allowed !important; }

    /* =============================================
       OVERLAY DE ADICIONAR TURMA (flutuante sobre o painel, não fecha nada)
       ============================================= */
    #overlay-adicionar {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    #overlay-adicionar.visivel { display: flex; }
    .modal-adicionar {
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      width: 90%;
      max-width: 400px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.18s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      background: #0F172A;
      padding: 18px 22px 14px;
    }
    .modal-header-icon {
      width: 36px; height: 36px;
      background: #1D4ED8;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: #FFFFFF;
      margin-bottom: 10px;
    }
    .modal-titulo { font-size: 14px; font-weight: 700; color: #F8FAFC; }
    .modal-subtitulo { font-size: 11px; color: #64748B; margin-top: 2px; }
    .modal-body { padding: 18px 22px; }
    .campo-label {
      font-size: 12px; font-weight: 600; color: #475569;
      margin-bottom: 6px;
      display: flex; align-items: center; gap: 5px;
    }
    /* Campo retangular, visual limpo */
    .campo-input {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      font-size: 13px;
      color: #1E293B;
      background: #F8FAFC;
      outline: none;
      transition: all 0.15s;
      font-family: inherit;
    }
    .campo-input:focus { border-color: #2563EB; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
    .campo-input::placeholder { color: #CBD5E1; }
    .dica {
      display: flex; align-items: flex-start; gap: 8px;
      background: #EFF6FF; border: 1px solid #BFDBFE;
      border-radius: 8px; padding: 10px 12px; margin-top: 12px;
    }
    .dica i { font-size: 14px; color: #2563EB; flex-shrink: 0; margin-top: 1px; }
    .dica-texto { font-size: 11px; color: #1E40AF; line-height: 1.5; }
    .dica-texto strong { font-weight: 600; }
    .msg-erro {
      font-size: 12px; color: #DC2626; margin-top: 6px;
      display: none; align-items: center; gap: 4px;
    }
    .msg-erro.visivel { display: flex; }
    .modal-footer {
      padding: 14px 22px;
      display: flex; gap: 10px;
      border-top: 1px solid #F1F5F9;
      background: #F8FAFC;
    }
    .btn-modal {
      flex: 1; padding: 10px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; border: none;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all 0.15s;
    }
    .btn-modal-cancelar { background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }
    .btn-modal-cancelar:hover { background: #E2E8F0; }
    .btn-modal-vincular { background: #1D4ED8; color: #FFFFFF; }
    .btn-modal-vincular:hover:not(:disabled) { background: #1E40AF; }
    .btn-modal-vincular:disabled { background: #93C5FD; cursor: not-allowed; }

    @keyframes spin { to { transform: rotate(360deg); } }

  </style>
</head>
<body>

  <!-- ============ PAINEL PRINCIPAL ============ -->
  <div class="painel">
    <div class="painel-header">
      <div>
        <div class="painel-titulo">Painel de Gerenciamento</div>
        <div class="painel-subtitulo">Google Classroom</div>
      </div>
      <span class="badge-count ${totalTurmas > 0 ? 'tem-turmas' : ''}" id="badge-count">
        ${totalTurmas} turma${totalTurmas !== 1 ? 's' : ''}
      </span>
    </div>

    <!-- menu principal -->
    <div id="menu-principal">
      <div class="lista-turmas" id="lista-turmas">
        ${blocoTurmasHtml}
      </div>
      <div class="acoes">
        <button class="btn-acao btn-adicionar" onclick="abrirOverlayAdicionar()">
          <i class="ti ti-plus"></i> Adicionar Turma
        </button>
        <button class="btn-acao btn-extrair ${classeBotaoRestrito}" id="btn-extrair"
          ${estaDesativado} onclick="iniciarExtracao()">
          <i class="ti ti-download"></i> Extrair Dados
        </button>
      </div>
      <div class="footer">Processamento automatizado diário ativo no sistema.</div>
    </div>

    <!-- área de progresso -->
    <div id="area-progresso">
      <div class="progress-label" id="p-label">Conectando ao Google Classroom...</div>
      <div class="progress-track"><div class="progress-fill" id="p-fill"></div></div>
      <div class="progress-pct" id="p-pct">0%</div>
      <div class="logger" id="p-logger">Aguardando autorização da API...</div>
      <div class="log-erros" id="p-erros"></div>
      <div class="acoes-progresso">
        <button class="btn-prog btn-prog-cancel" id="btn-cancel" onclick="cancelarExtracao()">Cancelar</button>
        <button class="btn-prog btn-prog-ok" id="btn-ok" disabled onclick="confirmarGravacao()">Aguardando...</button>
      </div>
    </div>

  </div>

  <!-- ============ OVERLAY DE ADICIONAR TURMA ============ -->
  <div id="overlay-adicionar">
    <div class="modal-adicionar">
      <div class="modal-header">
        <div class="modal-header-icon"><i class="ti ti-plus"></i></div>
        <div class="modal-titulo">Vincular Nova Turma</div>
        <div class="modal-subtitulo">Cole o link ou ID numérico da turma</div>
      </div>
      <div class="modal-body">
        <div class="campo-label">
          <i class="ti ti-link" style="font-size:13px;color:#94A3B8;"></i>
          Link ou ID da turma
        </div>
        <input
          id="campo-link"
          class="campo-input"
          type="text"
          placeholder="https://classroom.google.com/c/... ou ID numérico"
          oninput="validarCampoModal()"
          onkeydown="if(event.key==='Enter') tentarVincular()"
        />
        <div class="msg-erro" id="msg-erro">
          <i class="ti ti-alert-circle" style="font-size:13px;"></i>
          <span id="msg-erro-texto">Campo obrigatório.</span>
        </div>
        <div class="dica">
          <i class="ti ti-bulb"></i>
          <div class="dica-texto">
            <strong>Dica:</strong> Use o <strong>ID numérico</strong> para evitar falhas.
            Você encontra o ID no link do Classroom após <code>/c/</code>.
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-modal btn-modal-cancelar" onclick="fecharOverlayAdicionar()">
          <i class="ti ti-x"></i> Cancelar
        </button>
        <button class="btn-modal btn-modal-vincular" id="btn-vincular" onclick="tentarVincular()" disabled>
          <i class="ti ti-circle-check"></i> Vincular Turma
        </button>
      </div>
    </div>
  </div>

  <script>
    // =============================================
    // ESTADO GLOBAL
    // =============================================
    var cancelado = false;
    var listaIds = [];
    var indice = 0;
    var progAtual = 0;
    var tempos = [];
    var segsRestantes = 0;
    var timerCron = null;
    var totalTurmasAtual = ${totalTurmas};

    // =============================================
    // CARREGAMENTO DE NOMES EM BACKGROUND
    // Chama a API do Classroom depois que o painel já abriu
    // =============================================
    (function carregarNomesEmBackground() {
      if (totalTurmasAtual === 0) return;
      google.script.run
        .withSuccessHandler(function(lista) {
          if (!lista || !lista.length) return;
          lista.forEach(function(t, i) {
            var elNome = document.getElementById('nome-' + i);
            var elId   = document.getElementById('id-'   + i);
            if (elNome) elNome.innerHTML = escapeHtml(t.nome);
            if (elId)   elId.innerText   = 'ID: ' + t.id;
          });
        })
        .withFailureHandler(function() {}) // silencioso — exibe só o ID
        .obterNomesEIdsTurmasSalvas();
    })();

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // =============================================
    // OVERLAY DE ADICIONAR TURMA
    // =============================================
    function abrirOverlayAdicionar() {
      document.getElementById('campo-link').value = '';
      document.getElementById('btn-vincular').disabled = true;
      document.getElementById('msg-erro').classList.remove('visivel');
      document.getElementById('overlay-adicionar').classList.add('visivel');
      setTimeout(function() { document.getElementById('campo-link').focus(); }, 80);
    }

    function fecharOverlayAdicionar() {
      document.getElementById('overlay-adicionar').classList.remove('visivel');
    }

    // Fecha overlay ao clicar fora do modal
    document.getElementById('overlay-adicionar').addEventListener('click', function(e) {
      if (e.target === this) fecharOverlayAdicionar();
    });

    function validarCampoModal() {
      var val = document.getElementById('campo-link').value.trim();
      document.getElementById('btn-vincular').disabled = val.length === 0;
      document.getElementById('msg-erro').classList.remove('visivel');
    }

    function tentarVincular() {
      var val = document.getElementById('campo-link').value.trim();
      if (!val) {
        document.getElementById('msg-erro-texto').innerText = 'Por favor, cole o link ou ID da turma.';
        document.getElementById('msg-erro').classList.add('visivel');
        return;
      }

      var btn = document.getElementById('btn-vincular');
      btn.disabled = true;
      btn.innerHTML = '<span style="display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px;"></span> Vinculando...';

      // UMA ÚNICA chamada para salvar — sem duplicação
      google.script.run
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<i class="ti ti-circle-check"></i> Vincular Turma';
          document.getElementById('msg-erro-texto').innerText = 'Erro: ' + err.message;
          document.getElementById('msg-erro').classList.add('visivel');
        })
        .withSuccessHandler(function(resultado) {
          if (!resultado.ok) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ti ti-circle-check"></i> Vincular Turma';
            document.getElementById('msg-erro-texto').innerText = resultado.erro || 'Não foi possível vincular.';
            document.getElementById('msg-erro').classList.add('visivel');
            return;
          }

          // Adiciona a linha visualmente SEM fechar o painel
          var novoIndex = resultado.index; // índice real no array salvo
          adicionarLinhaTurma(novoIndex, resultado.id, resultado.nome);
          fecharOverlayAdicionar();
        })
        .salvarTurmaLinkComRetorno(val);
    }

    function adicionarLinhaTurma(index, id, nomeInicial) {
      var lista = document.getElementById('lista-turmas');

      // Remove mensagem de "sem turmas" se existir
      var semTurmas = lista.querySelector('.sem-turmas');
      if (semTurmas) semTurmas.remove();

      var div = document.createElement('div');
      div.className = 'linha-turma';
      div.id = 'linha-' + index;
      div.setAttribute('data-index', index);
      div.innerHTML =
        '<div class="turma-info">' +
          '<div class="turma-nome" id="nome-' + index + '">' + escapeHtml(nomeInicial) + '</div>' +
          '<div class="turma-id" id="id-' + index + '">ID: ' + escapeHtml(String(id)) + '</div>' +
        '</div>' +
        '<button class="btn-desvincular" onclick="desvincularTurma(' + index + ', this)" title="Remover turma">' +
          '<span class="icone-x">\u2715</span>' +
          '<span class="spinner-mini"></span>' +
        '</button>';
      lista.appendChild(div);

      // Atualiza badge e habilita botão de extrair
      totalTurmasAtual++;
      atualizarBadge(totalTurmasAtual);
      var btnExtrair = document.getElementById('btn-extrair');
      if (btnExtrair) {
        btnExtrair.disabled = false;
        btnExtrair.classList.remove('desativado');
      }

      // Tenta buscar o nome real em background
      if (nomeInicial === 'Carregando...') {
        google.script.run
          .withSuccessHandler(function(lista2) {
            if (!lista2) return;
            lista2.forEach(function(t, i) {
              if (i === index) {
                var el = document.getElementById('nome-' + i);
                if (el) el.innerHTML = escapeHtml(t.nome);
                var elId = document.getElementById('id-' + i);
                if (elId) elId.innerText = 'ID: ' + t.id;
              }
            });
          })
          .withFailureHandler(function() {})
          .obterNomesEIdsTurmasSalvas();
      }
    }

    function atualizarBadge(n) {
      var badge = document.getElementById('badge-count');
      if (!badge) return;
      badge.innerText = n + (n !== 1 ? ' turmas' : ' turma');
      if (n > 0) badge.classList.add('tem-turmas');
      else badge.classList.remove('tem-turmas');
    }

    // =============================================
    // DESVINCULAR TURMA — sem fechar o painel
    // =============================================
    function desvincularTurma(index, btn) {
      btn.classList.add('carregando');
      var linha = document.getElementById('linha-' + index);
      if (linha) linha.classList.add('removendo');

      google.script.run
        .withFailureHandler(function(err) {
          btn.classList.remove('carregando');
          if (linha) linha.classList.remove('removendo');
          alert('Erro ao desvincular: ' + err.message);
        })
        .withSuccessHandler(function(sucesso) {
          if (sucesso) {
            if (linha) linha.remove();
            totalTurmasAtual = Math.max(0, totalTurmasAtual - 1);
            atualizarBadge(totalTurmasAtual);
            if (totalTurmasAtual === 0) {
              var lista = document.getElementById('lista-turmas');
              lista.innerHTML = '<div class="sem-turmas"><i class="ti ti-school-off"></i><span>Nenhuma turma vinculada</span></div>';
              var btnExtrair = document.getElementById('btn-extrair');
              if (btnExtrair) { btnExtrair.disabled = true; btnExtrair.classList.add('desativado'); }
            }
          } else {
            btn.classList.remove('carregando');
            if (linha) linha.classList.remove('removendo');
            alert('Não foi possível remover a turma.');
          }
        })
        .removerTurmaPorIndice(index);
    }

    // =============================================
    // EXTRAÇÃO
    // =============================================
    function iniciarExtracao() {
      document.getElementById('menu-principal').style.display = 'none';
      document.getElementById('area-progresso').style.display = 'block';
      progAtual = 0; cancelado = false; indice = 0; tempos = [];
      setFill(0, '#2563EB');
      setLogger('Requisitando canais de dados seguros...');
      rodarCronometro();

      google.script.run
        .withSuccessHandler(function(turmas) {
          listaIds = turmas;
          if (!listaIds || listaIds.length === 0) {
            mostrarErro('Nenhum ID de turma legível encontrado.');
            return;
          }
          degradeNumeral(1, 10, function() { proximaTurma(); });
        })
        .withFailureHandler(function(err) { mostrarErro('Falha crítica: ' + err.message); })
        .obterTurmasSalvasOnlyIds();
    }

    function rodarCronometro() {
      timerCron = setInterval(function() {
        if (cancelado || indice >= listaIds.length) return;
        if (segsRestantes > 0) { segsRestantes--; atualizarLabel(); }
      }, 1000);
    }

    function atualizarLabel() {
      var t = segsRestantes > 60
        ? Math.floor(segsRestantes/60) + 'm ' + (segsRestantes%60) + 's restantes'
        : segsRestantes + 's restantes';
      document.getElementById('p-label').innerText =
        'Processando ' + (indice+1) + 'ª de ' + listaIds.length + ' turmas (' + t + ')';
    }

    function degradeNumeral(de, ate, cb) {
      if (cancelado) return;
      var i = de;
      (function passo() {
        if (i <= ate) { setFill(i, null); progAtual = i; i++; setTimeout(passo, 8); }
        else { if (cb) cb(); }
      })();
    }

    function setFill(pct, cor) {
      var fill = document.getElementById('p-fill');
      document.getElementById('p-fill').style.width = pct + '%';
      document.getElementById('p-pct').innerText = pct + '%';
      if (cor) fill.style.background = cor;
    }

    function setLogger(msg) { document.getElementById('p-logger').innerText = msg; }

    function proximaTurma() {
      if (cancelado) return;
      if (indice >= listaIds.length) {
        clearInterval(timerCron);
        document.getElementById('p-logger').style.color = '#16A34A';
        setLogger('✓ Sincronização concluída!');
        degradeNumeral(progAtual, 100, function() {
          document.getElementById('p-label').innerText = 'Análise finalizada com sucesso!';
          setFill(100, '#16A34A');
          document.getElementById('btn-cancel').style.display = 'none';
          var ok = document.getElementById('btn-ok');
          ok.disabled = false;
          ok.innerText = 'Confirmar e Gravar';
          ok.classList.add('ativo');
        });
        return;
      }
      var id = listaIds[indice];
      if (indice > 0 && tempos.length > 0) {
        var media = tempos.reduce(function(a,b){return a+b;},0) / tempos.length;
        segsRestantes = Math.ceil(media * (listaIds.length - indice) / 1000);
      } else {
        segsRestantes = listaIds.length * 12;
      }
      atualizarLabel();
      setLogger('Abrindo conexão com o banco Classroom...');
      escutarStatus(id, Date.now());
    }

    function escutarStatus(id, t0) {
      google.script.run
        .withSuccessHandler(function(st) {
          if (cancelado) return;
          if (st) {
            setLogger('Turma: [' + st.nomeTurma + '] ➜ ' + st.mensagem);
            if (st.concluido) {
              tempos.push(Date.now() - t0);
              indice++;
              var alvo = Math.min(Math.floor((indice / listaIds.length) * 90), 95);
              degradeNumeral(progAtual, alvo, function() { proximaTurma(); });
            } else {
              setTimeout(function() { escutarStatus(id, t0); }, 1000);
            }
          }
        })
        .withFailureHandler(function(err) {
          mostrarErro('Falha ao ler progresso: ' + err.message);
          indice++;
          proximaTurma();
        })
        .obterStatusEvolucaoServidor(id);
    }

    function mostrarErro(msg) {
      var el = document.getElementById('p-erros');
      el.innerHTML += '⚠️ ' + msg + '<br>';
      el.style.display = 'block';
    }

    function cancelarExtracao() {
      cancelado = true;
      clearInterval(timerCron);
      // Volta para o menu principal em vez de fechar o painel
      document.getElementById('area-progresso').style.display = 'none';
      document.getElementById('menu-principal').style.display = 'block';
      // Reseta estado de progresso para próxima execução
      document.getElementById('p-fill').style.width = '0%';
      document.getElementById('p-pct').innerText = '0%';
      document.getElementById('p-erros').style.display = 'none';
      document.getElementById('p-erros').innerHTML = '';
      document.getElementById('p-logger').style.color = '#D97706';
      document.getElementById('btn-cancel').style.display = '';
      var ok = document.getElementById('btn-ok');
      ok.disabled = true; ok.innerText = 'Aguardando...';
      ok.classList.remove('ativo','gravando');
    }

    function confirmarGravacao() {
      var ok = document.getElementById('btn-ok');
      ok.disabled = true;
      ok.classList.remove('ativo');
      ok.classList.add('gravando');
      var s = 1;
      ok.innerText = 'Gravando... (' + s + 's)';
      var t = setInterval(function() { s++; ok.innerText = 'Gravando... (' + s + 's)'; }, 1000);
      google.script.run
        .withFailureHandler(function(err) { clearInterval(t); alert('Erro ao gravar: ' + err.message); })
        .withSuccessHandler(function() {
          clearInterval(t);
          ok.innerText = '✓ Concluído!';
          // Não fecha o painel — apenas mostra sucesso e volta ao menu
          setTimeout(function() { cancelarExtracao(); }, 1200);
        })
        .finalizarCadastroMestre();
    }
  </script>
</body>
</html>`;

try {
SpreadsheetApp.getUi().showSidebar(
HtmlService.createHtmlOutput(html).setTitle('Painel — Google Classroom')
);
} catch(e) {
Logger.log("Erro ao abrir painel: " + e.message);
}
}

// =========================================================================
// SALVAR TURMA COM RETORNO COMPLETO (UMA única chamada, sem duplicação)
// Retorna { ok, index, id, nome, erro }
// =========================================================================
function salvarTurmaLinkComRetorno(link) {
try {
if (!link || link.trim() === "") return { ok: false, erro: "Link vazio." };
link = link.trim();

    const propriedades = PropertiesService.getScriptProperties();
    let lista = (propriedades.getProperty('LINKS_TURMAS') || "")
      .split(",").map(s => s.trim()).filter(Boolean);

    // Extrai o ID para comparação de duplicatas
    let idNovo = link;
    if (link.includes("classroom.google.com")) {
      const m = link.match(/\/(?:c|f|w|courses)\/([^\/\?\#]+)/i);
      if (m && m[1]) {
        try { idNovo = Utilities.newBlob(Utilities.base64Decode(m[1])).getDataAsString(); }
        catch(e) { idNovo = m[1]; }
      }
    }

    // Verifica duplicata
    for (var i = 0; i < lista.length; i++) {
      var itemAtual = lista[i];
      var idAtual = itemAtual;
      if (itemAtual.includes("classroom.google.com")) {
        var m2 = itemAtual.match(/\/(?:c|f|w|courses)\/([^\/\?\#]+)/i);
        if (m2 && m2[1]) {
          try { idAtual = Utilities.newBlob(Utilities.base64Decode(m2[1])).getDataAsString(); }
          catch(e) { idAtual = m2[1]; }
        }
      }
      if (String(idAtual) === String(idNovo) || String(itemAtual) === String(link)) {
        return { ok: false, erro: "Esta turma já está vinculada." };
      }
    }

    lista.push(link);
    propriedades.setProperty('LINKS_TURMAS', lista.join(","));

    // Tenta buscar o nome real da turma para exibir imediatamente no painel
    var nomeExibir = idNovo;
    try {
      var curso = Classroom.Courses.get(idNovo);
      nomeExibir = curso.section || curso.name || idNovo;
    } catch(e) {}

    return { ok: true, index: lista.length - 1, id: idNovo, nome: nomeExibir };

} catch(e) {
Logger.log("Erro ao salvar turma: " + e.message);
return { ok: false, erro: e.message };
}
}

// Mantido por compatibilidade — não é mais chamado pelo painel principal
function salvarTurmaLink(link) {
var r = salvarTurmaLinkComRetorno(link);
return r.ok;
}

// Função auxiliar (mantida por compatibilidade)
function \_noop() { return true; }

// =========================================================================
// SISTEMA DE ESTADO DO MOTOR DO LOGGER
// =========================================================================
function obterStatusEvolucaoServidor(idTurma) {
const cache = CacheService.getScriptCache();
const dadosStr = cache.get("STATUS*LOG*" + idTurma);

if (!dadosStr) {
cache.put("STATUS*LOG*" + idTurma, JSON.stringify({
nomeTurma: "Classroom", mensagem: "Iniciando varredura...", concluido: false
}), 20);
Utilities.sleep(50);
var keyGatilho = "LOCK*RUN*" + idTurma;
if (!cache.get(keyGatilho)) {
cache.put(keyGatilho, "ATIVO", 60);
CacheService.getScriptCache().remove("STATUS*LOG*" + idTurma);
processarTurmaIndividual(idTurma);
}
return { nomeTurma: "Classroom", mensagem: "Acessando servidores Google...", concluido: false };
}
return JSON.parse(dadosStr);
}

// =========================================================================
// REMOVER TURMA POR ÍNDICE
// =========================================================================
function removerTurmaPorIndice(index) {
try {
const propriedades = PropertiesService.getScriptProperties();
let lista = (propriedades.getProperty('LINKS_TURMAS') || "")
.split(",").map(item => item.trim()).filter(Boolean);

    if (index >= 0 && index < lista.length) {
      lista.splice(index, 1);
      if (lista.length > 0) {
        propriedades.setProperty('LINKS_TURMAS', lista.join(","));
      } else {
        propriedades.deleteProperty('LINKS_TURMAS');
      }
      return true;
    }
    return false;

} catch(e) {
Logger.log("Erro ao remover turma: " + e.message);
return false;
}
}

// =========================================================================
// GESTÃO DE TURMAS
// =========================================================================
function obterNomesEIdsTurmasSalvas() {
let CRU = "";
try { CRU = PropertiesService.getScriptProperties().getProperty('LINKS_TURMAS') || ""; }
catch(e) { return []; }

const linksOuIds = CRU.split(",").map(item => item.trim()).filter(Boolean);
if (linksOuIds.length === 0) return [];

let cursoList = [];
try { cursoList = Classroom.Courses.list().courses || []; }
catch(e) {
return linksOuIds.map(id => ({ id: id, nome: "Sem conexão com API" }));
}

return linksOuIds.map(item => {
let idBusca = item;
if (item.includes("classroom.google.com")) {
const matchDireto = item.match(/\/(?:c|f|w|courses)\/([^\/\?\#]+)/i);
if (matchDireto && matchDireto[1]) {
let codigoBase64 = matchDireto[1];
try { idBusca = Utilities.newBlob(Utilities.base64Decode(codigoBase64)).getDataAsString(); }
catch(e) { idBusca = codigoBase64; }
} else if (item.includes("cjc=")) {
const matchCodigo = item.match(/cjc=([^\&\?\#]+)/i);
if (matchCodigo && matchCodigo[1]) {
const turmaPeloCodigo = cursoList.find(c => c.enrollmentCode === matchCodigo[1]);
if (turmaPeloCodigo) idBusca = String(turmaPeloCodigo.id);
}
}
}
const achado = cursoList.find(c => String(c.id) === String(idBusca));
return {
id: idBusca,
nome: achado ? (achado.section || achado.name) : `ID/Link inválido: ${item}`
};
});
}

function obterTurmasSalvasOnlyIds() {
try { return obterNomesEIdsTurmasSalvas().map(t => t.id); }
catch(e) { return []; }
}

// =========================================================================
// PROCESSAMENTO PRINCIPAL DA TURMA
// =========================================================================
function processarTurmaIndividual(idTurma) {
let planilha = SpreadsheetApp.getActiveSpreadsheet();
let cacheLog = CacheService.getScriptCache();
let curso = null;

try {
curso = Classroom.Courses.get(idTurma);
} catch(e) {
gerarCascaVisualVazia(planilha, `Erro ID ${idTurma}`, "Falha crítica: ID inexistente ou sem acesso.");
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma: "Erro", mensagem: "Acesso negado à turma.", concluido: true }), 30);
return "ERRO";
}

const nomeTurma = curso.section || curso.name;
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma: nomeTurma, mensagem: "Lendo cadastro de alunos...", concluido: false }), 40);

let abaIdsControle = planilha.getSheetByName("CONTROLE_IDS_ALUNOS") || planilha.insertSheet("CONTROLE_IDS_ALUNOS");
let linhasControleIds = [];

let aba = planilha.getSheetByName(nomeTurma) || planilha.insertSheet(nomeTurma);
try { aba.clear(); } catch(e) {}
try { aba.setGridlines(false); } catch(err) {}

let alunos = [];
try { alunos = (Classroom.Courses.Students.list(curso.id)).students || []; }
catch(e) {
gerarCascaVisualVazia(planilha, nomeTurma, "Erro na API ao listar alunos: " + e.message);
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma: nomeTurma, mensagem: "Erro ao listar alunos.", concluido: true }), 30);
return "ERRO";
}

let listaAtividadesCruas = [];
try { listaAtividadesCruas = (Classroom.Courses.CourseWork.list(curso.id)).courseWork || []; }
catch(e) {
gerarCascaVisualVazia(planilha, nomeTurma, "Erro na API ao buscar atividades: " + e.message);
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma: nomeTurma, mensagem: "Erro ao buscar atividades.", concluido: true }), 30);
return "ERRO";
}

if (alunos.length === 0 || listaAtividadesCruas.length === 0) {
gerarCascaVisualVazia(planilha, nomeTurma, "A turma está sem dados ativos.");
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma: nomeTurma, mensagem: "Turma vazia.", concluido: true }), 30);
return "AVISO";
}

const alunosMap = Object.create(null);
const cacheUser = Object.create(null);

function resolverUsuario(userId) {
if (cacheUser[userId]) return cacheUser[userId];
let nome = userId, email = "";
try {
const prof = Classroom.UserProfiles.get(userId);
nome = (prof?.name?.fullName || nome).toUpperCase();
email = (prof?.emailAddress || "").toLowerCase();
} catch(e) {}
if (!email) {
try {
const files = DriveApp.searchFiles(`'${userId}' in owners`);
if (files.hasNext()) email = (files.next().getOwner().getEmail() || "").toLowerCase();
} catch(e) {}
}
const final = { nome, email, id: userId };
cacheUser[userId] = final;
return final;
}

let maxNome = 12, maxEmail = 18;

alunos.forEach(a => {
const u = resolverUsuario(a.userId);
const chave = u.nome || u.email || u.id || "SEM_NOME";
if (chave.length > maxNome) maxNome = chave.length;
if (u.email.length > maxEmail) maxEmail = u.email.length;
alunosMap[chave] = { meta: u, atividades: Object.create(null), ultimoAcesso: null };
linhasControleIds.push([nomeTurma, chave, u.id]);
});

const hoje = new Date(); hoje.setHours(0,0,0,0);
const atividadesFiltradas = [], dicMeta = {};

listaAtividadesCruas.forEach(atv => {
let titulo = atv.title || "Sem título";
let lower = titulo.toLowerCase();
let eM = lower.includes("miniprojeto"), eD = lower.includes("desafio");
if (!eM && !eD) return;
if (eM) { let m = titulo.match(/miniprojeto\s*(\d+)/i); if (m && parseInt(m[1],10) % 2 === 0) return; }
if (eD && /desafio\s*\d+\.3/i.test(titulo)) return;

    let limpo = titulo
      .replace(/\s*\(diagnóstico de[^\)]*\)/i,"")
      .replace(/\s*\(diagnóstico[^\)]*\)/i,"")
      .replace(/\s*\(assimilação[^\)]*\)/i,"").trim();
    let pos = limpo.indexOf("("); if (pos !== -1) limpo = limpo.substring(0, pos).trim();

    let tempo = "PASSADO";
    if (atv.creationTime) {
      const d = new Date(atv.creationTime); d.setHours(0,0,0,0);
      if (d.getTime() === hoje.getTime()) tempo = "HOJE";
      else if (d.getTime() > hoje.getTime()) tempo = "FUTURO";
    }
    atividadesFiltradas.push({ tituloOriginal: titulo, tituloLimpo: limpo, id: atv.id });
    dicMeta[limpo] = tempo;

});

atividadesFiltradas.sort((a, b) => a.tituloLimpo.localeCompare(b.tituloLimpo, 'pt', { numeric: true }));
const titulos = atividadesFiltradas.map(a => a.tituloLimpo);
const divisor = titulos.length;

atividadesFiltradas.forEach((atv, idx) => {
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma, mensagem: `Buscando entregas (${idx+1}/${titulos.length})...`, concluido: false }), 40);
try {
const entregas = (Classroom.Courses.CourseWork.StudentSubmissions.list(curso.id, atv.id)).studentSubmissions || [];
const tempo = dicMeta[atv.tituloLimpo];
entregas.forEach(e => {
const u = resolverUsuario(e.userId);
const chave = u.nome || u.email || u.id;
if (!alunosMap[chave]) alunosMap[chave] = { meta: u, atividades: Object.create(null), ultimoAcesso: null };
if (e.updateTime) {
const dr = new Date(e.updateTime);
if (!alunosMap[chave].ultimoAcesso || dr > alunosMap[chave].ultimoAcesso) alunosMap[chave].ultimoAcesso = dr;
}
let st = "nãoentregou";
if (tempo === "FUTURO") st = "--";
else if (e.state === "TURNED_IN" || e.state === "RETURNED") st = "entregou";
else if (tempo === "HOJE") st = "PENDENTE";
alunosMap[chave].atividades[atv.tituloLimpo] = st;
});
} catch(err) {}
});

const listaAlunos = Object.keys(alunosMap);
listaAlunos.sort((a, b) => {
const ea = (alunosMap[a].meta.email||"").toLowerCase();
const eb = (alunosMap[b].meta.email||"").toLowerCase();
const suf = "@aluno.educacao.pe.gov.br";
if (ea.endsWith(suf) && !eb.endsWith(suf)) return -1;
if (!ea.endsWith(suf) && eb.endsWith(suf)) return 1;
return a.localeCompare(b, 'pt', { sensitivity: 'base' });
});

const dados = [
Array(6+titulos.length).fill(""), Array(6+titulos.length).fill(""),
Array(6+titulos.length).fill(""), Array(6+titulos.length).fill(""),
["Nº","Estudante","E-mail Institucional","Último Acesso","Entregas","Progresso",...titulos]
];

let somaTotal = 0;
const contPorAtv = Array(titulos.length).fill(0);
let contInst = 1;
let cacheAlunosTurma = {};

listaAlunos.forEach(aluno => {
const info = alunosMap[aluno].meta;
let num = "";
if (info.email.endsWith("@aluno.educacao.pe.gov.br")) { num = contInst; contInst++; }
let entregas = 0;
const cols = titulos.map((atv, idx) => {
const tempo = dicMeta[atv];
const padrao = tempo === "FUTURO" ? "--" : tempo === "HOJE" ? "PENDENTE" : "nãoentregou";
const st = alunosMap[aluno].atividades[atv] || padrao;
if (st === "entregou") { entregas++; contPorAtv[idx]++; }
return st;
});
somaTotal += entregas;
const pct = divisor > 0 ? ((entregas/divisor)\*100).toFixed(1)+"%" : "0.0%";
const data = alunosMap[aluno].ultimoAcesso
? Utilities.formatDate(alunosMap[aluno].ultimoAcesso, "America/Sao_Paulo", "dd/MM HH:mm") : "-";
dados.push([num, aluno, info.email, data, entregas, pct, ...cols]);
cacheAlunosTurma[info.id] = { nome: aluno, email: info.email };
});

const total = listaAlunos.length;
const media = total > 0 ? somaTotal / total : 0;
const mediaPct = divisor > 0 ? ((media/divisor)*100).toFixed(1)+"%" : "0.0%";
const lineMedia = contPorAtv.map(q => total > 0 ? ((q/total)*100).toFixed(0)+"%" : "0%");
dados.splice(5, 0, ["","DESEMPENHO MÉDIO DA TURMA","-","-",media.toFixed(1),mediaPct,...lineMedia]);

try { aba.getRange(1, 1, dados.length, dados[0].length).setValues(dados); }
catch(e) {
cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma, mensagem: "Erro ao gravar.", concluido: true }), 30);
return "ERRO";
}

const nCols = dados[0].length, nLinhas = dados.length;

try {
aba.getRange("A1").setValue(" 🟡 REPOSITÓRIO CLASSROOM").setFontSize(14).setFontColor("#FFFFFF").setFontWeight("bold");
aba.getRange("B1").setValue(`Painel Analítico • ${nomeTurma}`).setFontSize(11).setFontColor("#94A3B8").setFontStyle("italic");
aba.getRange(1,1,1,nCols).setBackground("#0F172A");
aba.getRange(2,1,1,nCols).setBackground("#1E293B");
aba.getRange(3,1,2,nCols).setBackground("#F8FAFC");
aba.getRange("A3").setValue("Estudantes").setFontSize(9).setFontColor("#64748B").setFontWeight("bold");
aba.getRange("A4").setValue(total).setFontSize(16).setFontColor("#0F172A").setFontWeight("bold");
aba.getRange("C3").setValue("Média de Entregas").setFontSize(9).setFontColor("#64748B").setFontWeight("bold");
aba.getRange("C4").setValue(media.toFixed(1)).setFontSize(16).setFontColor("#2563EB").setFontWeight("bold");
let apr = divisor > 0 ? media/divisor : 0;
let cInd = aba.getRange("D4").setFontSize(9).setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("left");
if (apr < 0.50) cInd.setValue("● BAIXA").setFontColor("#DC2626");
else if (apr <= 0.75) cInd.setValue("● REGULAR").setFontColor("#D97706");
else cInd.setValue("● ALTA").setFontColor("#16A34A");
aba.getRange("E3").setValue("Progresso da Sala").setFontSize(9).setFontColor("#64748B").setFontWeight("bold");
let cProg = aba.getRange("E4").setValue(mediaPct).setFontSize(16).setFontWeight("bold");
if (apr < 0.50) cProg.setFontColor("#DC2626");
else if (apr <= 0.75) cProg.setFontColor("#D97706");
else cProg.setFontColor("#16A34A");
aba.getRange(5,1,1,nCols).setBackground("#334155").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(10);
aba.getRange(6,1,1,nCols).setBackground("#F1F5F9").setFontColor("#1E293B").setFontWeight("bold").setFontSize(10);

    if (total > 0) {
      const fundos = [], textos = [];
      for (let i = 6; i < nLinhas; i++) {
        let ent = parseFloat(dados[i][4]) || 0;
        let cf = "#FEE2E2", ct = "#B91C1C";
        if (ent === Math.round(media)) { cf = "#FEF3C7"; ct = "#D97706"; }
        else if (ent > media) { cf = "#DCFCE7"; ct = "#15803D"; }
        let linha = (i%2===0) ? "#F8FAFC" : "#FFFFFF";
        const F = [linha,cf,linha,linha,linha,linha];
        const T = ["#475569",ct,"#64748B","#0F172A","#0F172A","#0F172A"];
        for (let j = 6; j < nCols; j++) {
          const v = dados[i][j];
          if (v==="entregou"){F.push("#DCFCE7");T.push("#15803D");}
          else if (v==="PENDENTE"){F.push("#FEF3C7");T.push("#D97706");}
          else if (v==="--"){F.push("#F1F5F9");T.push("#94A3B8");}
          else{F.push("#FEE2E2");T.push("#B91C1C");}
        }
        fundos.push(F); textos.push(T);
      }
      aba.getRange(7,1,fundos.length,nCols).setBackgrounds(fundos).setFontColors(textos).setFontSize(10);
      aba.getRange(7,1,fundos.length,1).setHorizontalAlignment("center").setFontWeight("bold");
      aba.getRange(7,2,fundos.length,1).setFontWeight("bold");
      aba.getRange(5,1,nLinhas-4,nCols).setVerticalAlignment("middle");
      const rv = SpreadsheetApp.newDataValidation()
        .requireValueInList(["entregou","PENDENTE","nãoentregou","--"],true)
        .setAllowInvalid(false).build();
      aba.getRange(7,7,total,nCols-6).setDataValidation(rv);
    }

    aba.setColumnWidth(1,45);
    aba.setColumnWidth(2, Math.max(maxNome*7.8, 210));
    aba.setColumnWidth(3, Math.max(maxEmail*6.8, 220));
    aba.setColumnWidth(4,110); aba.setColumnWidth(5,75); aba.setColumnWidth(6,80);
    for (let c=7; c<=nCols; c++) aba.setColumnWidth(c,145);
    aba.setRowHeights(1,4,24); aba.setRowHeight(4,30); aba.setRowHeights(5,nLinhas-4,22);

} catch(e) {}

try {
const props = PropertiesService.getScriptProperties();
let mestre = JSON.parse(props.getProperty('TEMP_ALUNOS_MESTRE')||"{}");
Object.assign(mestre, cacheAlunosTurma);
props.setProperty('TEMP_ALUNOS_MESTRE', JSON.stringify(mestre));
} catch(e) {}

if (linhasControleIds.length > 0) {
let ul = abaIdsControle.getLastRow();
if (ul === 0) {
abaIdsControle.getRange(1,1,1,3).setValues([["Turma","Nome Aluno","ID Classroom"]]).setFontWeight("bold");
ul = 1;
}
abaIdsControle.getRange(ul+1, 1, linhasControleIds.length, 3).setValues(linhasControleIds);
}

cacheLog.put("STATUS*LOG*" + idTurma, JSON.stringify({ nomeTurma, mensagem: "Finalizado!", concluido: true }), 30);
return "OK";
}

// =========================================================================
// CASCA DE ERRO NA PLANILHA
// =========================================================================
function gerarCascaVisualVazia(planilha, nomeAba, motivo) {
try {
let aba = planilha.getSheetByName(nomeAba) || planilha.insertSheet(nomeAba);
aba.clear();
const cols = 8;
const dados = [
Array(cols).fill(""), Array(cols).fill(""), Array(cols).fill(""), Array(cols).fill(""),
["Nº","Estudante","E-mail Institucional","Último Acesso","Entregas","Progresso","Status","Detalhes"],
["1","DADOS INDISPONÍVEIS","-","-","0","0%","RETORNO VAZIO", motivo]
];
aba.getRange(1,1,dados.length,cols).setValues(dados);
aba.getRange("A1").setValue(" 🟡 OPERAÇÃO CONCLUÍDA COM ADVERTÊNCIA").setFontSize(14).setFontColor("#FFFFFF").setFontWeight("bold");
aba.getRange(1,1,1,cols).setBackground("#0F172A");
aba.getRange(5,1,1,cols).setBackground("#475569").setFontColor("#FFFFFF").setFontWeight("bold");
aba.autoResizeColumns(1, cols);
} catch(e) {}
}

// =========================================================================
// FINALIZAR CADASTRO MESTRE
// =========================================================================
function finalizarCadastroMestre() {
try {
let planilha = SpreadsheetApp.getActiveSpreadsheet();
let aba = planilha.getSheetByName("Lista_Alunos") || planilha.insertSheet("Lista_Alunos");
try { aba.setGridlines(false); } catch(e) {}
const props = PropertiesService.getScriptProperties();
const mapa = JSON.parse(props.getProperty('TEMP_ALUNOS_MESTRE')||"{}");
const matriz = [
[" 🟡 CADASTRO GERAL DE ALUNOS ATIVOS","",""],
["","",""],
["ID de Registro","Nome Completo","E-mail de Contato"]
];
Object.entries(mapa).sort((a,b) => {
const ea=(a[1].email||"").toLowerCase(), eb=(b[1].email||"").toLowerCase();
const s="@aluno.educacao.pe.gov.br";
if(ea.endsWith(s)&&!eb.endsWith(s)) return -1;
if(!ea.endsWith(s)&&eb.endsWith(s)) return 1;
return a[1].nome.localeCompare(b[1].nome,'pt');
}).forEach(([id,info]) => matriz.push([id, info.nome.toUpperCase(), info.email]));
aba.clear();
aba.getRange(1,1,matriz.length,3).setValues(matriz);
aba.getRange("A1").setFontSize(12).setFontColor("#FFFFFF").setFontWeight("bold");
aba.getRange("A1:C1").setBackground("#0F172A");
aba.getRange("A3:C3").setBackground("#334155").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(10);
aba.autoResizeColumn(1); aba.autoResizeColumn(2); aba.autoResizeColumn(3);
props.deleteProperty('TEMP_ALUNOS_MESTRE');
SpreadsheetApp.flush();
} catch(e) {}
}

// =========================================================================
// FALLBACK — mantido por compatibilidade
// =========================================================================
function fluxoAdicionarTurmas() { return true; }
function fluxoAdicionarTurmasComPainel() { return false; }
