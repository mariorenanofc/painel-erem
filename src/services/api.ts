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

  try {
    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Erro na comunicação com a API:", error);
    throw new Error(
      "Falha na conexão com o servidor. Verifique a sua internet.",
    );
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

  buscarConfiguracoes: () => fetchApi({ action: "buscar_configuracoes" }),
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

  buscarPerfil: (matricula: string) =>
    fetchApi({ action: "buscar_perfil_aluno", matricula }),

  carregarPortal: (matricula: string) =>
    fetchApi({ action: "carregar_portal_aluno", matricula }),

  fazerCheckin: (matricula: string, senha: string) =>
    fetchApi({ action: "fazer_checkin", matricula, senha }),

  minhaFrequencia: (matricula: string) =>
    fetchApi({ action: "minha_frequencia", matricula }),

  enviarMissao: (matricula: string, idAtividade: string, resposta: string) =>
    fetchApi({ action: "enviar_atividade", matricula, idAtividade, resposta }),

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

  salvarAvatar: (matricula: string, avatarId: string) =>
    fetchApi({ action: "salvar_avatar", matricula, avatarId }),

  buscarPerfilPublico: (matriculaVisualizador: string, matriculaAlvo: string) =>
    fetchApi({
      action: "buscar_perfil_publico",
      matriculaVisualizador,
      matriculaAlvo,
    }),

  curtirPerfil: (matriculaRemetente: string, matriculaDestinatario: string) =>
    fetchApi({
      action: "curtir_perfil",
      matriculaRemetente,
      matriculaDestinatario,
    }),

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

  transferirXP: (
    matriculaOrigem: string,
    senha: string,
    matriculaDestino: string,
    quantidade: number,
    motivo: string,
  ) =>
    fetchApi({
      action: "transferir_xp",
      matriculaOrigem,
      senha,
      matriculaDestino,
      quantidade,
      motivo,
    }),
};

// ==========================================
// 3. API DO TUTOR E GESTÃO - BLINDADA COM O TOKEN
// ==========================================
export const apiTutor = {
  // --- RANKING E ANALYTICS ---
  buscarRanking: (filtroTempo: "geral" | "semanal" | "mensal") =>
    fetchApi({ action: "buscar_ranking", filtroTempo, token: TUTOR_TOKEN }),

  buscarAnalyticsGeral: () =>
    fetchApi({ action: "buscar_analytics_geral", token: TUTOR_TOKEN }),

  buscarFicha360: (matricula: string) =>
    fetchApi({ action: "buscar_ficha_360", matricula, token: TUTOR_TOKEN }),

  toggleGabaritoRápido: (idAtividade: string) =>
    fetchApi({ action: "toggle_gabarito", idAtividade, token: TUTOR_TOKEN }),

  // --- GESTÃO DE GABARITOS EM LOTE ---
  salvarGabaritosLote: (atualizacoes: any[]) =>
    fetchApi({ action: "salvar_gabaritos_lote", atualizacoes, token: TUTOR_TOKEN }),

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
};
