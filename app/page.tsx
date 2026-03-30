"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import SearchFilter from "./components/SearchFilter";
import StudentModal from "./components/StudentModal";
import StudentTable from "./components/StudentTable";
import LoginScreen from "./components/LoginScreen";
import { formatarDataInput, formatarDataTabela } from "@/utils/formatters";
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
  const [mostrarSemEmail, setMostrarSemEmail] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    matricula: "",
    nome: "",
    dataNasc: "",
    email: "",
    turma: "",
    telefoneAluno: "",
    telefoneResponsavel: "",
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
    // Regra da Turma e Barra de Busca
    const matchTurma =
      turmaSelecionada === "" || aluno.turma === turmaSelecionada;
    const matchBusca =
      busca === "" ||
      aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
      aluno.matricula.includes(busca);

    // Regra do "Sem Email"
    // Identifica emails vazios OU escritos como "Não encontrado" / "Sem email"
    const isEmailVazio =
      !aluno.email ||
      aluno.email.trim() === "" ||
      aluno.email.toLowerCase() === "não encontrado" ||
      aluno.email.toLowerCase() === "sem email";

    // Se o checkbox estiver marcado, exige que seja vazio. Se não, ignora essa regra (true).
    const matchSemEmail = mostrarSemEmail ? isEmailVazio : true;

    return matchTurma && matchBusca && matchSemEmail;
  });

  // === FUNÇÃO DE EXPORTAR RELATÓRIO ===
  const exportarParaCSV = () => {
    if (alunosFiltrados.length === 0) {
      alert("⚠️ Não há alunos para exportar com os filtros atuais.");
      return;
    }

    // 1. Cria os cabeçalhos da planilha
    const cabecalhos = [
      "Nome",
      "Data de Nascimento",
      "Matricula",
      "Email",
      "Turma",
      "Tel. Pessoal",
      "Tel. Responsável",
      "Observacoes",
    ];

    // 2. Transforma cada aluno em uma linha de texto separada por ponto-e-vírgula
    const linhasCSV = alunosFiltrados.map((aluno) => {
      return [
        `"${aluno.nome}"`,
        `"${formatarDataTabela(aluno.dataNasc)}"`, // Data formatada padrão BR
        `"${aluno.matricula}"`,
        `"${aluno.email || "Sem email"}"`,
        `"${aluno.turma}"`,
        `"${aluno.telefoneAluno || ""}"`,
        `"${aluno.telefoneResponsavel || ""}"`,
        `"${aluno.obs || ""}"`,
      ].join(";");
    });

    // 3. Junta tudo com quebras de linha
    const conteudoCSV = [cabecalhos.join(";"), ...linhasCSV].join("\n");

    // 4. Cria o arquivo na memória do navegador (O \uFEFF garante que o Excel leia os acentos)
    const blob = new Blob(["\uFEFF" + conteudoCSV], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    // 5. Força o download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Relatorio_EREM_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      telefoneAluno: "",
      telefoneResponsavel: "",
      obs: "",
    });
    setIsEditing(false);
    setModalAberto(true);
  };

  const abrirVisualizacao = (aluno: Aluno) => {
    setFormData({
      matricula: aluno.matricula,
      nome: aluno.nome,
      dataNasc: formatarDataInput(aluno.dataNasc),
      email: aluno.email,
      turma: aluno.turma,
      telefoneAluno: aluno.telefoneAluno || "",
      telefoneResponsavel: aluno.telefoneResponsavel || "",
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
        mostrarSemEmail={mostrarSemEmail}
        setMostrarSemEmail={setMostrarSemEmail}
        exportarDados={exportarParaCSV}
      />

      <StudentTable
        alunosFiltrados={alunosFiltrados}
        preencherEdicao={abrirVisualizacao}
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
