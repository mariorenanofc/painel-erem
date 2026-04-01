import { ChangeEvent } from "react";

// 1. MODELO DE DADOS PRINCIPAL
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
}

// 2. TIPAGENS DOS COMPONENTES (PROPS)
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
  abrirModalNovoAluno: () => void;
  exportarDados: () => void;
}

export interface StudentTableProps {
  alunosFiltrados: Aluno[];
  preencherEdicao: (aluno: Aluno) => void;
}

export interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Aluno; // Usando a interface principal do Aluno aqui!
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  salvarAluno: () => void;
  salvando: boolean;
  isEditing: boolean;
}

export interface StudentFormProps {
  formData: Aluno;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
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
  inscreverNoTrilha?: (matricula: string, turmaCurso: string) => Promise<void>; // <-- NOVO AQUI
}