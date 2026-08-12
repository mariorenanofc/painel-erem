


/**
 * Função central de comunicação com o Google Apps Script.
 * Centraliza os cabeçalhos, o método POST e o tratamento de erros.
 */
async function fetchApi(payload: Record<string, unknown>) {
  // Criamos um controlador de tempo limite (35 segundos para suportar fila de espera)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch("/api/action-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (_e: unknown) {
      if (text.includes("504") || text.includes("Time-out") || text.includes("Timeout")) {
         return {
           status: "erro",
           mensagem: "Tempo limite excedido (Timeout). A ação pode ter sido concluída em segundo plano. Por favor, atualize ou sincronize para verificar."
         };
      }
      throw new Error(`Erro inesperado do servidor. (Não é JSON valido)`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return {
        status: "erro",
        mensagem:
          "O servidor demorou a responder devido à fila de processamento. Verifique se a ação refletiu após alguns segundos.",
      };
    }
    return { status: "erro", mensagem: "Falha na conexão com o servidor." };
  }
}

// ==========================================
// 1. API DE AUTENTICAÇÃO E CONFIGURAÇÃO
// ==========================================
export const apiGeral = {
  loginGestao: (usuario: string, senha: string) =>
    fetchApi({ action: "login", usuario, senha }),

  logoutGestao: () => fetchApi({ action: "logout" }),

  loginAluno: (matricula: string, dataNasc: string) =>
    fetchApi({ action: "login_aluno", matricula, dataNasc }),

  recuperarMatricula: (nome: string, dataNasc: string) =>
    fetchApi({ action: "recuperar_matricula", nome, dataNasc }),

  buscarConfiguracoes: async () => {
    const res = await fetch("/api/configuracoes");
    return res.json();
  },
};

// ==========================================
// 2. API DO ALUNO (PORTAL) - SEM O TOKEN DE MESTRE
// ==========================================
export const apiAluno = {
  coroarElite: (
    matriculaNova: string,
    tipoPlaca: "Elite Ouro" | "Elite Prata" | "Elite Bronze",
  ) =>
    fetchApi({ action: "coroar_elite", matricula: matriculaNova, tipoPlaca }),

  buscarPerfil: async (matricula: string) => {
    const res = await fetch(`/api/alunos/perfil?matricula=${matricula}`);
    return res.json();
  },

  carregarPortal: async (matricula: string, nocache?: boolean) => {
    const res = await fetch(`/api/alunos/portal?matricula=${matricula}${nocache ? "&nocache=true" : ""}`);
    return res.json();
  },

  fazerCheckin: async (matricula: string, senha: string) => {
    const res = await fetch("/api/alunos/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, senha })
    });
    return res.json();
  },

  minhaFrequencia: (matricula: string) =>
    fetchApi({ action: "minha_frequencia", matricula }),

  enviarMissao: async (matricula: string, idAtividade: string, resposta: string, xpGanho?: number) => {
    const res = await fetch("/api/alunos/enviar-missao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, idAtividade, resposta, xpGanho })
    });
    return res.json();
  },

  atualizarContatos: (
    matricula: string,
    turma: string,
    telefoneAluno: string,
    telefoneResponsavel: string,
  ) =>
    fetchApi({
      action: "atualizar_contatos_aluno",
      matricula,
      turma,
      telefoneAluno,
      telefoneResponsavel,
    }),

  salvarAvatar: async (matricula: string, avatarId: string) => {
    const res = await fetch("/api/alunos/salvar-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, avatarId })
    });
    return res.json();
  },

  buscarPerfilPublico: async (matriculaVisualizador: string, matriculaAlvo: string) => {
    const res = await fetch(`/api/alunos/perfil-publico?matriculaVisualizador=${matriculaVisualizador}&matriculaAlvo=${matriculaAlvo}`);
    return res.json();
  },

  curtirPerfil: async (matriculaRemetente: string, matriculaDestinatario: string) => {
    const res = await fetch("/api/alunos/curtir-perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matriculaRemetente, matriculaDestinatario })
    });
    return res.json();
  },

  resgatarAniversario: (matricula: string) =>
    fetchApi({ action: "resgatar_aniversario", matricula }),

  resgatarBadge: (
    matricula: string,
    badgeId: string,
    xpGanho: number,
    nomeBadge: string,
  ) =>
    fetchApi({
      action: "resgatar_badge",
      matricula,
      badgeId,
      xpGanho,
      nomeBadge,
    }),

  confirmarWhatsapp: (matricula: string) =>
    fetchApi({ action: "confirmar_whatsapp", matricula }),

  iniciarPix: (matricula: string) =>
    fetchApi({ action: "iniciar_pix", matricula }),

  criarSenhaPix: (matricula: string, senha: string) =>
    fetchApi({ action: "criar_senha_pix", matricula, senha }),

  transferirXP: async (
    matriculaOrigem: string,
    senha: string,
    matriculaDestino: string,
    quantidade: number,
    motivo: string,
  ) => {
    const res = await fetch("/api/alunos/transferir-xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matriculaOrigem, senha, matriculaDestino, quantidade, motivo })
    });
    return res.json();
  },

  comprarRifa: async (matricula: string, pacote: string) => {
    const res = await fetch("/api/alunos/comprar-rifa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, pacote })
    });
    return res.json();
  },

  buscarMeusBilhetes: (matricula: string) =>
    fetchApi({
      action: "buscar_bilhetes_aluno",
      matricula,
    }),

  buscarAtividadeStatus: async (matricula: string, idAtividade: string) => {
    const res = await fetch(`/api/alunos/atividade-status?matricula=${matricula}&idAtividade=${idAtividade}`);
    return res.json();
  },

  salvarPontuacaoJogo: async (
    matricula: string,
    tipoJogo: string,
    score: number,
    duracaoPartida: number,
    tempoInicio: number
  ) => {
    const res = await fetch("/api/alunos/jogos/salvar-pontuacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, tipoJogo, score, duracaoPartida, tempoInicio })
    });
    return res.json();
  },
  buscarJogosStatus: async (matricula: string) => {
    const res = await fetch(`/api/alunos/jogos/status?matricula=${matricula}`);
    return res.json();
  },
};

// ==========================================
// 3. API DO TUTOR E GESTÃO - BLINDADA COM O TOKEN
// ==========================================
export const apiTutor = {
  // --- SINCRONIZAÇÃO CLASSROOM E CONFIG ---
  sincronizarAVA: () =>
    fetchApi({ action: "sincronizar_ava" }),

  sincronizarConfiguracoes: () =>
    fetchApi({ action: "sincronizar_configuracoes" }),

  // --- RANKING E ANALYTICS ---
  buscarRanking: async (filtroTempo: "geral" | "semanal" | "mensal", nocache?: boolean) => {
    const res = await fetch(`/api/alunos/ranking?filtroTempo=${filtroTempo}${nocache ? "&nocache=true" : ""}`);
    return res.json();
  },

  buscarAnalyticsGeral: () =>
    fetchApi({ action: "buscar_analytics_geral" }),

  buscarFicha360: (matricula: string) =>
    fetchApi({ action: "buscar_ficha_360", matricula }),

  toggleGabaritoRápido: (idAtividade: string) =>
    fetchApi({ action: "toggle_gabarito", idAtividade }),

  // --- GESTÃO DE GABARITOS EM LOTE ---
  salvarGabaritosLote: (atualizacoes: Record<string, unknown>[]) =>
    fetchApi({
      action: "salvar_gabaritos_lote",
      atualizacoes
    }),

  // --- MISSÕES ---
  buscarTodasAtividades: async (
    filtroTurma: string = "Todas",
    filtroTipo: string = "Todos",
    nocache?: boolean,
  ) => {
    const res = await fetch(`/api/tutor/atividades?filtroTurma=${filtroTurma}&filtroTipo=${filtroTipo}${nocache ? "&nocache=true" : ""}`);
    return res.json();
  },

  salvarAtividade: (dados: Record<string, unknown>) =>
    fetchApi({ action: "salvar_atividade", ...dados }),

  excluirAtividade: (idAtividade: string) =>
    fetchApi({ action: "excluir_atividade", idAtividade }),

  buscarEntregas: (idAtividade: string) =>
    fetchApi({
      action: "buscar_entregas_atividade",
      idAtividade
    }),

  avaliarEntrega: (
    idEntrega: string,
    matricula: string,
    xpGanho: number,
    novoStatus: string,
    feedback: string,
  ) =>
    fetchApi({
      action: "avaliar_entrega",
      idEntrega,
      matricula,
      xpGanho,
      novoStatus,
      feedback
    }),

  // --- FREQUÊNCIA ---
  buscarDiarioClasse: async (turma: string, mes: string, ano: string) => {
    const res = await fetch(`/api/tutor/diario-classe?turma=${encodeURIComponent(turma)}&mes=${encodeURIComponent(mes)}&ano=${encodeURIComponent(ano)}&_t=${Date.now()}`);
    return res.json();
  },

  buscarFrequenciaHoje: async (turma: string) => {
    const res = await fetch(`/api/tutor/frequencia-hoje?turma=${encodeURIComponent(turma)}&_t=${Date.now()}`);
    return res.json();
  },

  justificarFalta: (
    matricula: string,
    dataIso: string,
    justificativa: string,
    idFalta?: string,
  ) =>
    fetchApi({
      action: "justificar_falta",
      matricula,
      data: dataIso,
      justificativa,
      idFalta
    }),

  // --- GOD MODE ---
  listarAlunosGodMode: () =>
    fetchApi({ action: "listar_alunos_godmode" }),

  injetarXP: (matriculaAlvo: string, quantidadeXP: number, motivo: string) =>
    fetchApi({
      action: "injetar_xp_manual",
      matriculaAlvo,
      quantidadeXP,
      motivo
    }),

  coroarElite: (matricula: string, tipoPlaca: string) =>
    fetchApi({
      action: "coroar_elite",
      matricula,
      tipoPlaca
    }),

  // --- CONFIGURAÇÕES ---
  buscarSenhaCheckin: async () => {
    const res = await fetch("/api/tutor/senha-checkin");
    return res.json();
  },

  atualizarSenhaCheckin: (novaSenha: string) =>
    fetchApi({
      action: "atualizar_senha_checkin",
      novaSenha
    }),

  toggleModoReposicao: (status: "LIGADO" | "DESLIGADO") =>
    fetchApi({ action: "toggle_modo_reposicao", status }),

  buscarAniversariantes: async () => {
    const res = await fetch("/api/tutor/aniversariantes");
    return res.json();
  },

  // 🔥 NOVA ROTA DE CONFIGURAÇÕES INTEGRADAS
  salvarConfiguracoes: (configs: Record<string, unknown>) =>
    fetchApi({ action: "salvar_configuracoes", configs }),

  // Economia e Rifa
  sortearRifa: (turma: string, tokenSeguranca: string) =>
    fetchApi({
      action: "sortear_rifa",
      turma,
      token: tokenSeguranca,
    }),
};
