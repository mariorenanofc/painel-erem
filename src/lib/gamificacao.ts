export interface NivelInfo {
  nome: string;
  min: number;
  max: number;
}

export const NIVEIS_GAMIFICACAO: NivelInfo[] = [
  { nome: "Hello World", min: 0, max: 499 },
  { nome: "Bug Hunter", min: 500, max: 1499 },
  { nome: "Coder Ninja", min: 1500, max: 2999 },
  { nome: "Tech Hacker", min: 3000, max: 4999 },
  { nome: "Dev Supremo", min: 5000, max: 7499 },
  { nome: "Lenda Binária", min: 7500, max: 9999 },
  { nome: "Mestre do Código", min: 10000, max: 13999 },
  { nome: "Arquiteto de Sistemas", min: 14000, max: 18999 },
  { nome: "Hacker Quântico", min: 19000, max: 24999 },
  { nome: "Oráculo Digital", min: 25000, max: 34999 },
  { nome: "Titã da Nuvem", min: 35000, max: 49999 },
  { nome: "Deus da Lógica", min: 50000, max: 999999 }
];

export interface ProgressoNivel {
  porcentagem: number;
  faltam: number;
  nomeProximo: string;
  isMaximo: boolean;
}

export interface GamificacaoStatus {
  nivel: string;
  saldoCarteira: number;
  progressoNivel: ProgressoNivel;
}

export function calcularGamificacao(xpTotal: number, xpGasto: number): GamificacaoStatus {
  let nivelCalculado = NIVEIS_GAMIFICACAO[0];
  let proximoNivel = NIVEIS_GAMIFICACAO[1];

  for (let n = 0; n < NIVEIS_GAMIFICACAO.length; n++) {
    if (xpTotal >= NIVEIS_GAMIFICACAO[n].min && xpTotal <= NIVEIS_GAMIFICACAO[n].max) {
      nivelCalculado = NIVEIS_GAMIFICACAO[n];
      proximoNivel = NIVEIS_GAMIFICACAO[n + 1] || NIVEIS_GAMIFICACAO[n];
      break;
    }
  }

  const xpBaseNivel = nivelCalculado.min;
  const xpParaProximo = proximoNivel.min;
  const progressoAtual = xpTotal - xpBaseNivel;
  const totalDoNivel = xpParaProximo - xpBaseNivel;

  const porcentagem = totalDoNivel === 0 ? 100 : Math.floor((progressoAtual / totalDoNivel) * 100);
  const faltam = xpParaProximo - xpTotal > 0 ? xpParaProximo - xpTotal : 0;
  const isMaximo = totalDoNivel === 0;

  return {
    nivel: nivelCalculado.nome,
    saldoCarteira: xpTotal - xpGasto,
    progressoNivel: {
      porcentagem,
      faltam,
      nomeProximo: proximoNivel.nome,
      isMaximo
    }
  };
}
