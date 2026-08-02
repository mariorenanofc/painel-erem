/* eslint-disable @typescript-eslint/no-explicit-any */
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

// 🔥 A SUA IDEIA GENIAL APLICADA AQUI:
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

/**
 * Função central de comunicação com o Google Apps Script.
 * Centraliza os cabeçalhos, o método POST e o tratamento de erros.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchApi(payload: any) {
  if (!GOOGLE_API_URL) {
    console.error("URL da API do Google não configurada no .env");
    return { status: "erro", mensagem: "URL da API não configurada." };
  }

  // Criamos um controlador de tempo limite (25 segundos)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    const ACTIONS_TO_SYNC = [
      "salvar_atividade", "excluir_atividade", "avaliar_entrega", 
      "injetar_xp_manual", "atualizar_senha_checkin", "toggle_modo_reposicao",
      "salvar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote"
    ];
    if (result.status === "sucesso" && ACTIONS_TO_SYNC.includes(payload.action)) {
      fetch("/api/tutor/sync-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Falha no sync local do tutor:", err));
    }

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      return {
        status: "erro",
        mensagem:
          "O servidor demorou a responder. Sua missão pode ter sido salva; verifique a trilha.",
      };
    }
    return { status: "erro", mensagem: "Falha na conexão." };
  }
}

// ==========================================
// 1. API DE AUTENTICAÇÃO E CONFIGURAÇÃO
// ==========================================
export const apiGeral = {
  loginGestao: (usuario: string, senha: string) =>
    fetchApi({ action: "login", usuario, senha }),

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

  carregarPortal: async (matricula: string) => {
    const res = await fetch(`/api/alunos/portal?matricula=${matricula}`);
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

  enviarMissao: async (matricula: string, idAtividade: string, resposta: string) => {
    const res = await fetch("/api/alunos/enviar-missao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, idAtividade, resposta })
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
};

// ==========================================
// 3. API DO TUTOR E GESTÃO - BLINDADA COM O TOKEN
// ==========================================
export const apiTutor = {
  // --- SINCRONIZAÇÃO CLASSROOM ---
  sincronizarAVA: () =>
    fetchApi({ action: "sincronizar_ava", token: TUTOR_TOKEN }),

  // --- RANKING E ANALYTICS ---
  buscarRanking: async (filtroTempo: "geral" | "semanal" | "mensal") => {
    const res = await fetch(`/api/alunos/ranking?filtroTempo=${filtroTempo}`);
    return res.json();
  },

  buscarAnalyticsGeral: () =>
    fetchApi({ action: "buscar_analytics_geral", token: TUTOR_TOKEN }),

  buscarFicha360: (matricula: string) =>
    fetchApi({ action: "buscar_ficha_360", matricula, token: TUTOR_TOKEN }),

  toggleGabaritoRápido: (idAtividade: string) =>
    fetchApi({ action: "toggle_gabarito", idAtividade, token: TUTOR_TOKEN }),

  // --- GESTÃO DE GABARITOS EM LOTE ---
  salvarGabaritosLote: (atualizacoes: any[]) =>
    fetchApi({
      action: "salvar_gabaritos_lote",
      atualizacoes,
      token: TUTOR_TOKEN,
    }),

  // --- MISSÕES ---
  buscarTodasAtividades: (
    filtroTurma: string = "Todas",
    filtroTipo: string = "Todos",
  ) =>
    fetchApi({
      action: "buscar_todas_atividades",
      filtroTurma,
      filtroTipo,
      token: TUTOR_TOKEN,
    }),

  salvarAtividade: (dados: any) =>
    fetchApi({ action: "salvar_atividade", ...dados, token: TUTOR_TOKEN }),

  excluirAtividade: (idAtividade: string) =>
    fetchApi({ action: "excluir_atividade", idAtividade, token: TUTOR_TOKEN }),

  buscarEntregas: (idAtividade: string) =>
    fetchApi({
      action: "buscar_entregas_atividade",
      idAtividade,
      token: TUTOR_TOKEN,
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
      feedback,
      token: TUTOR_TOKEN,
    }),

  // --- FREQUÊNCIA ---
  buscarDiarioClasse: (turma: string, mes: string, ano: string) =>
    fetchApi({
      action: "buscar_diario_classe",
      turma,
      mes,
      ano,
      token: TUTOR_TOKEN,
    }),

  buscarFrequenciaHoje: (turma: string) =>
    fetchApi({ action: "buscar_frequencia_hoje", turma, token: TUTOR_TOKEN }),

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
      idFalta,
      token: TUTOR_TOKEN,
    }),

  // --- GOD MODE ---
  listarAlunosGodMode: () =>
    fetchApi({ action: "listar_alunos_godmode", token: TUTOR_TOKEN }),

  injetarXP: (matriculaAlvo: string, quantidadeXP: number, motivo: string) =>
    fetchApi({
      action: "injetar_xp_manual",
      matriculaAlvo,
      quantidadeXP,
      motivo,
      token: TUTOR_TOKEN,
    }),

  coroarElite: (matricula: string, tipoPlaca: string) =>
    fetchApi({
      action: "coroar_elite",
      matricula,
      tipoPlaca,
      token: TUTOR_TOKEN,
    }),

  // --- CONFIGURAÇÕES ---
  buscarSenhaCheckin: () =>
    fetchApi({ action: "buscar_senha_checkin", token: TUTOR_TOKEN }),

  atualizarSenhaCheckin: (novaSenha: string) =>
    fetchApi({
      action: "atualizar_senha_checkin",
      novaSenha,
      token: TUTOR_TOKEN,
    }),

  toggleModoReposicao: (status: "LIGADO" | "DESLIGADO") =>
    fetchApi({ action: "toggle_modo_reposicao", status, token: TUTOR_TOKEN }),

  buscarAniversariantes: () =>
    fetchApi({ action: "buscar_aniversariantes_dia", token: TUTOR_TOKEN }),

  // 🔥 NOVA ROTA DE CONFIGURAÇÕES INTEGRADAS
  salvarConfiguracoes: (configs: Record<string, any>) =>
    fetchApi({ action: "salvar_configuracoes", configs, token: TUTOR_TOKEN }),

  // Economia e Rifa
  sortearRifa: (turma: string, tokenSeguranca: string) =>
    fetchApi({
      action: "sortear_rifa",
      turma,
      token: tokenSeguranca,
    }),
};
