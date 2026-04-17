import { Atividade } from "../types";

export interface Badge {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  desbloqueada: boolean;
  progresso: number;
  meta: number;
  recompensa: number; // NOVO: Quantidade de XP que a medalha dá
  categoria:
    | "Missoes"
    | "Acertos"
    | "Disciplina"
    | "XP"
    | "Social"
    | "Frequencia"
    | "Secretas";
}

export interface DadosParaBadges {
  atividades: Atividade[];
  xpTotal: number;
  xpDoado: number;
  xpRecebido: number;
  totalCheckins: number;
  whatsappConfirmado: boolean;
  aniversarioResgatado: boolean;
}

export const calcularBadges = (dados: DadosParaBadges): Badge[] => {
  const {
    atividades,
    xpTotal,
    xpDoado,
    xpRecebido,
    totalCheckins,
    whatsappConfirmado,
    aniversarioResgatado,
  } = dados;

  const missoesConcluidas = atividades.filter(
    (a) => a.status !== "Pendente",
  ).length;
  const missoesNoPrazo = atividades.filter(
    (a) => a.status !== "Pendente" && a.statusPrazo !== "Atrasada",
  ).length;
  // NOVO: Calcula quantas missões ele "Acertou" (Ganhou algum XP na correção ou no quiz)
  const missoesAcertadas = atividades.filter(
    (a) => Number(a.xpGanho) > 0,
  ).length;

  return [
    // === EIXO 1: O EXECUTOR (Missões Concluídas) ===
    {
      id: "exec_1",
      nome: "Primeiro Passo",
      icone: "🥚",
      descricao: "Concluiu a sua 1ª missão.",
      desbloqueada: missoesConcluidas >= 1,
      progresso: Math.min(missoesConcluidas, 1),
      meta: 1,
      recompensa: 10,
      categoria: "Missoes",
    },
    {
      id: "exec_2",
      nome: "Aprendiz Focado",
      icone: "🥉",
      descricao: "Concluiu 20 missões.",
      desbloqueada: missoesConcluidas >= 20,
      progresso: Math.min(missoesConcluidas, 20),
      meta: 20,
      recompensa: 20,
      categoria: "Missoes",
    },
    {
      id: "exec_3",
      nome: "Máquina de Entregas",
      icone: "🥈",
      descricao: "Concluiu 50 missões.",
      desbloqueada: missoesConcluidas >= 50,
      progresso: Math.min(missoesConcluidas, 50),
      meta: 50,
      recompensa: 30,
      categoria: "Missoes",
    },
    {
      id: "exec_4",
      nome: "Veterano de Guerra",
      icone: "🥇",
      descricao: "Concluiu 100 missões.",
      desbloqueada: missoesConcluidas >= 100,
      progresso: Math.min(missoesConcluidas, 100),
      meta: 100,
      recompensa: 60,
      categoria: "Missoes",
    },
    {
      id: "exec_5",
      nome: "Lenda das Missões",
      icone: "💎",
      descricao: "Concluiu 200 missões.",
      desbloqueada: missoesConcluidas >= 200,
      progresso: Math.min(missoesConcluidas, 200),
      meta: 200,
      recompensa: 100,
      categoria: "Missoes",
    },

    // === EIXO 2: O MESTRE (Acertos / Precisão) ===
    {
      id: "acer_1",
      nome: "Mente Brilhante",
      icone: "🧠",
      descricao: "Acertou e garantiu XP em 10 missões.",
      desbloqueada: missoesAcertadas >= 10,
      progresso: Math.min(missoesAcertadas, 10),
      meta: 10,
      recompensa: 20,
      categoria: "Acertos",
    },
    {
      id: "acer_2",
      nome: "Gênio da Turma",
      icone: "💡",
      descricao: "Acertou 30 missões.",
      desbloqueada: missoesAcertadas >= 30,
      progresso: Math.min(missoesAcertadas, 30),
      meta: 30,
      recompensa: 40,
      categoria: "Acertos",
    },
    {
      id: "acer_3",
      nome: "Especialista Tech",
      icone: "🔬",
      descricao: "Acertou 60 missões.",
      desbloqueada: missoesAcertadas >= 60,
      progresso: Math.min(missoesAcertadas, 60),
      meta: 60,
      recompensa: 70,
      categoria: "Acertos",
    },
    {
      id: "acer_4",
      nome: "Sábio Supremo",
      icone: "👑",
      descricao: "Acertou incríveis 100 missões.",
      desbloqueada: missoesAcertadas >= 100,
      progresso: Math.min(missoesAcertadas, 100),
      meta: 100,
      recompensa: 100,
      categoria: "Acertos",
    },

    // === EIXO 3: O PONTUAL (Disciplina e Prazos) ===
    {
      id: "disc_1",
      nome: "Relógio Suíço",
      icone: "⏰",
      descricao: "Entregou 10 missões dentro do prazo.",
      desbloqueada: missoesNoPrazo >= 10,
      progresso: Math.min(missoesNoPrazo, 10),
      meta: 10,
      recompensa: 20,
      categoria: "Disciplina",
    },
    {
      id: "disc_2",
      nome: "Senhor do Tempo",
      icone: "⏳",
      descricao: "Entregou 30 missões dentro do prazo.",
      desbloqueada: missoesNoPrazo >= 30,
      progresso: Math.min(missoesNoPrazo, 30),
      meta: 30,
      recompensa: 50,
      categoria: "Disciplina",
    },
    {
      id: "disc_3",
      nome: "O Flash",
      icone: "⚡",
      descricao: "Entregou 80 missões rigorosamente no prazo.",
      desbloqueada: missoesNoPrazo >= 80,
      progresso: Math.min(missoesNoPrazo, 80),
      meta: 80,
      recompensa: 100,
      categoria: "Disciplina",
    },

    // === EIXO 4: O INABALÁVEL (Check-ins / Frequência - Meta mais difícil) ===
    {
      id: "freq_1",
      nome: "Marcando Presença",
      icone: "📍",
      descricao: "Fez check-in em 10 aulas.",
      desbloqueada: totalCheckins >= 10,
      progresso: Math.min(totalCheckins, 10),
      meta: 10,
      recompensa: 20,
      categoria: "Frequencia",
    },
    {
      id: "freq_2",
      nome: "Cadeira Cativa",
      icone: "🪑",
      descricao: "Esteve presente em 40 aulas.",
      desbloqueada: totalCheckins >= 40,
      progresso: Math.min(totalCheckins, 40),
      meta: 40,
      recompensa: 50,
      categoria: "Frequencia",
    },
    {
      id: "freq_3",
      nome: "Mora na Escola",
      icone: "🏠",
      descricao: "Bateu a marca de 100 aulas frequentadas.",
      desbloqueada: totalCheckins >= 100,
      progresso: Math.min(totalCheckins, 100),
      meta: 100,
      recompensa: 100,
      categoria: "Frequencia",
    },

    // === EIXO 5: O ACUMULADOR (XP Total) ===
    {
      id: "xp_1",
      nome: "Poupador",
      icone: "🪙",
      descricao: "Atingiu 1.000 XP.",
      desbloqueada: xpTotal >= 1000,
      progresso: Math.min(xpTotal, 1000),
      meta: 1000,
      recompensa: 10,
      categoria: "XP",
    },
    {
      id: "xp_2",
      nome: "Investidor",
      icone: "💵",
      descricao: "Atingiu 5.000 XP.",
      desbloqueada: xpTotal >= 5000,
      progresso: Math.min(xpTotal, 5000),
      meta: 5000,
      recompensa: 30,
      categoria: "XP",
    },
    {
      id: "xp_3",
      nome: "Magnata",
      icone: "💰",
      descricao: "Atingiu 10.000 XP.",
      desbloqueada: xpTotal >= 10000,
      progresso: Math.min(xpTotal, 10000),
      meta: 10000,
      recompensa: 60,
      categoria: "XP",
    },
    {
      id: "xp_4",
      nome: "Trilionário",
      icone: "🏆",
      descricao: "Atingiu 20.000 XP.",
      desbloqueada: xpTotal >= 20000,
      progresso: Math.min(xpTotal, 20000),
      meta: 20000,
      recompensa: 100,
      categoria: "XP",
    },

    // === EIXO 6: COMUNIDADE (Pix de XP) ===
    {
      id: "soc_1",
      nome: "Quebrando o Gelo",
      icone: "🧊",
      descricao: "Fez a sua primeira doação de XP.",
      desbloqueada: xpDoado > 0,
      progresso: Math.min(xpDoado, 1),
      meta: 1,
      recompensa: 10,
      categoria: "Social",
    },
    {
      id: "soc_2",
      nome: "Mão Generosa",
      icone: "🤝",
      descricao: "Doou um total de 200 XP para os amigos.",
      desbloqueada: xpDoado >= 200,
      progresso: Math.min(xpDoado, 200),
      meta: 200,
      recompensa: 30,
      categoria: "Social",
    },
    {
      id: "soc_3",
      nome: "Filantropo",
      icone: "🕊️",
      descricao: "Doou 500 XP no total.",
      desbloqueada: xpDoado >= 500,
      progresso: Math.min(xpDoado, 500),
      meta: 500,
      recompensa: 60,
      categoria: "Social",
    },
    {
      id: "soc_4",
      nome: "Ídolo da Turma",
      icone: "🌟",
      descricao: "Recebeu mais de 300 XP de doações.",
      desbloqueada: xpRecebido >= 300,
      progresso: Math.min(xpRecebido, 300),
      meta: 300,
      recompensa: 50,
      categoria: "Social",
    },

    // === EIXO 7: CONQUISTAS SECRETAS ===
    {
      id: "sec_1",
      nome: "Conectado",
      icone: "📱",
      descricao: "Entrou no WhatsApp da turma.",
      desbloqueada: whatsappConfirmado,
      progresso: whatsappConfirmado ? 1 : 0,
      meta: 1,
      recompensa: 20,
      categoria: "Secretas",
    },
    {
      id: "sec_2",
      nome: "Festeiro",
      icone: "🥳",
      descricao: "Fez login no aniversário e pegou o presente.",
      desbloqueada: aniversarioResgatado,
      progresso: aniversarioResgatado ? 1 : 0,
      meta: 1,
      recompensa: 20,
      categoria: "Secretas",
    },
  ];
};
