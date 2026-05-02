import { ChangeEvent } from "react";
import { Badge } from "../utils/badges";

// ==========================================
// 1. MODELOS DE DADOS GERAIS
// ==========================================
export interface Aluno {
  matricula: string;
  nome: string;
  dataNasc: string;
  email: string;
  turma: string;
  telefoneAluno: string;
  telefoneResponsavel: string;
  obs: string;
  turmaTrilha?: string;
  statusTrilha?: string;
  whatsapp?: boolean;
}

// ==========================================
// 2. MODELOS DO PORTAL DO ALUNO
// ==========================================
export interface DadosAluno {
  matricula: string;
  nome: string;
  turma: string;
}

export interface Atividade {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: string | number;
  tipo: string;
  opcaoA?: string;
  opcaoB?: string;
  opcaoC?: string;
  opcaoD?: string;
  status?: string;
  respostaEnviada?: string;
  xpGanho?: number;
  statusPrazo?: string;
  turmaAlvo?: string;
  respostaCorreta?: string;
  feedback?: string;
  linkClassroom?: string;
  statusPublicacao?: string;
  imagemUrl?: string;
}

export interface PerfilAluno {
  nome: string;
  dataNasc: string;
  matricula: string;
  email: string;
  turma: string;
  telefoneAluno: string;
  telefoneResponsavel: string;
}

export interface AlunoRanking {
  matricula: string;
  nome: string;
  turma: string;
  xp: number;
  nivel: string;
  posicao: number;
}

export interface ColegaPix {
  matricula: string;
  nome: string;
}

// ==========================================
// 3. TIPAGENS DOS COMPONENTES (PROPS GESTÃO)
// ==========================================
export interface HeaderProps {
  carregando: boolean;
  nomeUsuario: string;
  onLogout: () => void;
}

export interface LoginScreenProps {
  onLoginSuccess: (nome: string) => void;
  apiUrl: string;
}

export interface SearchFilterProps {
  turmaSelecionada: string;
  setTurmaSelecionada: (val: string) => void;
  busca: string;
  setBusca: (val: string) => void;
  mostrarSemEmail: boolean;
  setMostrarSemEmail: (val: boolean) => void;
  mostrarComObs: boolean;
  setMostrarComObs: (val: boolean) => void;
  abrirModalNovoAluno: () => void;
  exportarDados: () => void;
}

export interface StudentTableProps {
  alunosFiltrados: Aluno[];
  preencherEdicao: (aluno: Aluno) => void;
}

export interface StudentFormProps {
  formData: Aluno;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  salvarAluno: () => void;
  salvando: boolean;
}

export interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Aluno;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  salvarAluno: () => void;
  salvando: boolean;
  isEditing: boolean;
  inscreverNoTrilha?: (matricula: string, turmaCurso: string) => Promise<void>;
  mudarStatusTrilha?: (matricula: string, novaStatus: string) => Promise<void>;
}

export interface TrilhaFiltersProps {
  busca: string;
  setBusca: (val: string) => void;
  filtroTurma: string;
  setFiltroTurma: (val: string) => void;
  filtroStatus: string;
  setFiltroStatus: (val: string) => void;
  exportarListaFrequencia: () => void;
  mostrarComObs: boolean;
  setMostrarComObs: (val: boolean) => void;
}

export interface FrequenciaHistorico {
  data: string;
  status: "presente" | "justificada" | "falta";
}

export interface DadosFrequencia {
  totalAulas: number;
  totalPresencas: number;
  totalFaltas: number;
  taxa: number;
  mensagem: string;
  historico: FrequenciaHistorico[];
}

export interface Notificacao {
  id: string;
  mensagem: string;
  xp: number;
  tempo: number;
  tipo: string;
}

// ==========================================
// 4. MODELOS DO PAINEL DE GESTÃO (TUTOR)
// ==========================================
export interface Entrega {
  feedback: string;
  idEntrega: string;
  matricula: string;
  nomeAluno: string;
  resposta: string;
  status: string;
  xpGanho: number;
}

export interface FrequenciaHoje {
  matricula: string;
  nome: string;
  presencasTotais: number;
  faltasTotais: number;
  presenteHoje: boolean;
  horaHoje: string;
}

// Já deve existir no seu index.ts, mas garanta que tem estas propriedades:
export interface AlunoRankingTutor {
  matricula: string;
  nome: string;
  turma: string;
  nivel: string | number; // O back manda string ("Iniciante"), mas o front antigo esperava number
  xp: number;
  posicao?: number;
}

// Tipagem para a Frequência do Diário (Mensal)
export interface RegistroDiario {
  matricula: string;
  nome: string;
  frequencia: Record<
    number,
    { status: string; justificativa?: string; idFalta?: string }
  >;
}

export interface AlunoSimples {
  matricula: string;
  nome: string;
  turma: string;
}

export interface AlunoRisco {
  matricula: string;
  nome: string;
  turma: string;
  telefone: string;
  taxaPresenca: number;
  missoesAtrasadas: number;
}

export interface FichaAluno {
  dadosPessoais: {
    nome: string;
    email: string;
    telefone: string;
    responsavel: string;
    obs: string;
  };
  statusProjeto: string;
  turmaProjeto: string;
  xpTotal: number;
  nivel: string;
  frequencia: {
    taxa: number;
    totalPresencas: number;
    totalAulas: number;
  };
  historicoXP: HistoricoXP[];
}

interface HistoricoXP {
  id: string;
  data: string;
  atividade: string;
  xp: number;
  status: string;
}

export interface CorrecaoMissoesModalProps {
  missaoAberta: Atividade | null;
  entregas: Entrega[];
  carregando: boolean;
  notasTemp: Record<string, number>;
  onClose: () => void;
  onSetNotasTemp: (notas: Record<string, number>) => void;
  onAvaliar: (
    entrega: Entrega,
    statusAvaliacao: "Avaliado" | "Devolvida",
    feedbackTutor: string,
  ) => void;
}

export interface GestaoFrequenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  abaDiario: "mensal" | "hoje";
  setAbaDiario: (aba: "mensal" | "hoje") => void;
  turmaDiario: string;
  setTurmaDiario: (val: string) => void;
  mesDiario: string;
  setMesDiario: (val: string) => void;
  anoDiario: string;
  setAnoDiario: (val: string) => void;
  carregandoFreq: boolean;
  diasComAula: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alunosDiario: any[];
  carregandoFreqHoje: boolean;
  freqHojeFiltrada: FrequenciaHoje[];
  dadosFreqHoje: FrequenciaHoje[];
  totalAulasTurma: number;
  filtroStatusHoje: "Todos" | "Presentes" | "Faltantes";
  setFiltroStatusHoje: (val: "Todos" | "Presentes" | "Faltantes") => void;
  ordenacaoFreq: "alfabetica" | "mais_faltas";
  setOrdenacaoFreq: (val: "alfabetica" | "mais_faltas") => void;

  // Justificativas
  modalJustificativaAberto: {
    matricula: string;
    nome: string;
    dia: number;
    idFalta?: string;
  } | null;
  setModalJustificativaAberto: (
    val: {
      matricula: string;
      nome: string;
      dia: number;
      idFalta?: string;
    } | null,
  ) => void;
  textoJustificativa: string;
  setTextoJustificativa: (val: string) => void;
  salvarJustificativa: () => void;
}

export interface AlunoGodMode {
  matricula: string;
  nome: string;
  turma: string;
}

export interface GodModeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export interface MissoesListProps {
  atividades: Atividade[];
  isLoading: boolean;
  turmasDisponiveis: string[];
  onEdit: (ativ: Atividade) => void;
  onDelete: (id: string) => void;
  onViewEntregas: (ativ: Atividade) => void;
}

export interface NovaConquistaModalProps {
  badge: Badge;
  loading: boolean;
  onResgatar: (badge: Badge) => void;
}

export interface PerfilModalProps {
  dadosPerfil: PerfilAluno | null;
  carregando: boolean;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (dadosAtualizados: PerfilAluno) => void;
  setDadosPerfil: (dados: PerfilAluno) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dadosBadges: any;
  avatarAtual: string;
  totalCurtidas: number;
  onSalvarAvatar: (avatarId: string) => void;
  ofensivaDias: number; // NOVO: Dias restantes para a ofensiva, se aplicável
}

export interface PerfilPublicoModalProps {
  matriculaAlvo: string;
  matriculaVisualizador: string;
  onClose: () => void;
}

export interface PixModalProps {
  aluno: DadosAluno;
  onClose: () => void;
  onSuccess: () => void;
  alunoAlvoInicial?: string | null;
}

export interface ItemExtrato {
  id: string;
  mensagem: string;
  xp: number;
  tempo: number;
  tipo: "ENVIOU" | "RECEBEU";
}

export interface PortalHeaderProps {
  matricula: string;
  nomeAluno: string;
  turma: string;
  nomeProjeto?: string; // NOVO: Recebe o nome dinâmico da planilha
  notificacoes: Notificacao[];
  onAbrirRanking: () => void;
  onAbrirFrequencia: () => void;
  onAbrirPerfil: () => void;
  onLogout: () => void;
}
