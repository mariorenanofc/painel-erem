"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import SearchFilter from "./components/SearchFilter";
import StudentModal from "./components/StudentModal";
import StudentTable from "./components/StudentTable";
import LoginScreen from "./components/LoginScreen";
import { formatarDataInput } from "@/utils/formatters";
import { Aluno } from "@/types";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL as string;  

export default function DashboardAlunos() {
  // === ESTADOS DE LOGIN ===
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  // === ESTADOS DO SISTEMA ===
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    matricula: "",
    nome: "",
    dataNasc: "",
    email: "",
    turma: "",
    obs: "",
  });

  // 1. Ao abrir o site, verifica se já tem login salvo no navegador
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");
    if (usuarioSalvo) {
      setUsuarioLogado(usuarioSalvo);
    }
    setVerificandoSessao(false);
  }, []);

  // 2. Quando o usuário loga com sucesso, carrega a lista de alunos
  useEffect(() => {
    if (usuarioLogado) {
      carregarAlunos();
    }
  }, [usuarioLogado]);

  // Função para deslogar
  const fazerLogout = () => {
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
    setAlunos([]); // Limpa a tabela da memória por segurança
  };

  const carregarAlunos = async () => {
    try {
      setCarregando(true);
      const res = await fetch(GOOGLE_API_URL);
      const data = await res.json();
      setAlunos(data);
    } catch (error) {
      console.error("Erro:", error);
      alert("⚠️ Erro ao carregar os alunos da base de dados.");
    } finally {
      setCarregando(false);
    }
  };

  const alunosFiltrados = alunos.filter((aluno) => {
    const matchTurma =
      turmaSelecionada === "" || aluno.turma === turmaSelecionada;
    const matchBusca =
      busca === "" ||
      aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
      aluno.matricula.includes(busca);
    return matchTurma && matchBusca;
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirModalNovo = () => {
    setFormData({
      matricula: "",
      nome: "",
      dataNasc: "",
      email: "",
      turma: "",
      obs: "",
    });
    setIsEditing(false);
    setModalAberto(true);
  };

  const preencherEdicao = (aluno: Aluno) => {
    setFormData({
      matricula: aluno.matricula,
      nome: aluno.nome,
      dataNasc: formatarDataInput(aluno.dataNasc),
      email: aluno.email,
      turma: aluno.turma,
      obs: aluno.obs,
    });
    setIsEditing(true);
    setModalAberto(true);
  };

  const salvarAluno = async () => {
    if (!formData.matricula || !formData.nome || !formData.turma) {
      alert("⚠️ Matrícula, Nome e Turma são obrigatórios!");
      return;
    }

    setSalvando(true);

    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "salvar_aluno", // Avisa a API que é pra salvar aluno
          ...formData,
        }),
      });

      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert("✅ Aluno salvo com sucesso!");
        setModalAberto(false);
        carregarAlunos();
      } else {
        alert("❌ Erro: " + resposta.mensagem);
      }
    } catch {
      alert("🔌 Erro de conexão. Verifique sua internet.");
    } finally {
      setSalvando(false);
    }
  };

  // Enquanto lê o navegador, não mostra nada
  if (verificandoSessao)
    return <div className="min-h-screen bg-slate-100"></div>;

  // Se NÃO tiver logado, mostra a tela de Login
  if (!usuarioLogado) {
    return (
      <LoginScreen
        onLoginSuccess={(nome) => setUsuarioLogado(nome)}
        apiUrl={GOOGLE_API_URL}
      />
    );
  }

  // Se tiver logado, mostra o Painel
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <Header
        carregando={carregando}
        nomeUsuario={usuarioLogado}
        onLogout={fazerLogout}
      />

      <SearchFilter
        turmaSelecionada={turmaSelecionada}
        setTurmaSelecionada={setTurmaSelecionada}
        busca={busca}
        setBusca={setBusca}
        abrirModalNovoAluno={abrirModalNovo}
      />

      <StudentTable
        alunosFiltrados={alunosFiltrados}
        preencherEdicao={preencherEdicao}
      />

      <StudentModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        formData={formData}
        handleChange={handleChange}
        salvarAluno={salvarAluno}
        salvando={salvando}
        isEditing={isEditing}
      />
    </div>
  );
}



//Codigo de implantação: AKfycbxwSFpmHe6QV-czUhJMTBOoXbZGulchb8QrUvgRhS_HGA6VPusBPbwslxsou8IwOTDonQ
