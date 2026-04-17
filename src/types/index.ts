import { ChangeEvent } from "react";

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
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  status: string;
  respostaEnviada: string;
  xpGanho: number;
  statusPrazo?: string;
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