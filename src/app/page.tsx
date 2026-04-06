"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr"; // <-- Importação do SWR
import Header from "../components/Header";
import SearchFilter from "../components/SearchFilter";
import StudentModal from "../components/StudentModal";
import StudentTable from "../components/StudentTable";
import LoginScreen from "../components/LoginScreen";
import { formatarDataInput, formatarDataTabela } from "../utils/formatters";
import { Aluno } from "../types";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL as string;

// Buscador do SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardAlunos() {
  // === ESTADOS DE LOGIN ===
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  // === ESTADOS DE FILTROS ===
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarSemEmail, setMostrarSemEmail] = useState(false);
  const [mostrarComObs, setMostrarComObs] = useState(false);

  // === ESTADOS DO MODAL ===
  const [modalAberto, setModalAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState<Aluno>({
    matricula: "",
    nome: "",
    dataNasc: "",
    email: "",
    turma: "",
    telefoneAluno: "",
    telefoneResponsavel: "",
    obs: "",
  });

  // 1. VERIFICAÇÃO DE LOGIN INICIAL
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");
    if (usuarioSalvo) setUsuarioLogado(usuarioSalvo);
    setVerificandoSessao(false);
  }, []);

  // 2. BUSCA DE DADOS COM SWR (Só busca se a pessoa estiver logada)
  const {
    data: alunos = [],
    isLoading: carregando,
    mutate,
  } = useSWR(usuarioLogado ? GOOGLE_API_URL : null, fetcher, {
    revalidateOnFocus: true,
  });

  // 3. FILTRO OTIMIZADO COM useMemo
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno: Aluno) => {
      const matchTurma =
        turmaSelecionada === "" || aluno.turma === turmaSelecionada;
      const matchBusca =
        busca === "" ||
        aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
        aluno.matricula.includes(busca);

      const isEmailVazio =
        !aluno.email ||
        aluno.email.trim() === "" ||
        aluno.email.toLowerCase() === "não encontrado" ||
        aluno.email.toLowerCase() === "sem email";
      const matchSemEmail = mostrarSemEmail ? isEmailVazio : true;

      // --- 2. NOVA REGRA DE OBSERVAÇÕES AQUI ---
      const temObs = aluno.obs && aluno.obs.trim() !== "";
      const matchObs = mostrarComObs ? temObs : true;

      return matchTurma && matchBusca && matchSemEmail && matchObs;
    });
  }, [alunos, turmaSelecionada, busca, mostrarSemEmail, mostrarComObs]);

  // === FUNÇÕES DE AÇÃO ===

  const fazerLogout = () => {
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
  };

  const exportarParaCSV = () => {
    if (alunosFiltrados.length === 0)
      return alert("⚠️ Não há alunos para exportar com os filtros atuais.");

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
    const linhasCSV = alunosFiltrados.map((aluno: Aluno) =>
      [
        `"${aluno.nome}"`,
        `"${formatarDataTabela(aluno.dataNasc)}"`,
        `"${aluno.matricula}"`,
        `"${aluno.email || "Sem email"}"`,
        `"${aluno.turma}"`,
        `"${aluno.telefoneAluno || ""}"`,
        `"${aluno.telefoneResponsavel || ""}"`,
        `"${aluno.obs || ""}"`,
      ].join(";"),
    );

    const conteudoCSV = [cabecalhos.join(";"), ...linhasCSV].join("\n");
    const blob = new Blob(["\uFEFF" + conteudoCSV], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Relatorio_EREM_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`;
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
      ...aluno,
      dataNasc: formatarDataInput(aluno.dataNasc),
    });
    setIsEditing(true);
    setModalAberto(true);
  };

  const salvarAluno = async () => {
    if (!formData.matricula || !formData.nome || !formData.turma)
      return alert("⚠️ Matrícula, Nome e Turma são obrigatórios!");
    setSalvando(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "salvar_aluno", ...formData }),
      });
      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert("✅ Aluno salvo com sucesso!");
        setModalAberto(false);
        mutate(); // 🚀 O SWR busca os dados novos em segundo plano!
      } else {
        alert("❌ Erro: " + resposta.mensagem);
      }
    } catch {
      alert("🔌 Erro de conexão. Verifique sua internet.");
    } finally {
      setSalvando(false);
    }
  };

  const inscreverNoTrilha = async (matricula: string, turmaCurso: string) => {
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "inscrever_trilhatech",
          matricula,
          turmaCurso,
          statusCurso: "Inscrito",
        }),
      });
      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert("✅ Inscrição realizada com sucesso!");
        mutate(); // 🚀 Atualiza a tabela na hora para a etiqueta do foguete aparecer!
        setModalAberto(false);
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro ao conectar com o sistema: " + erro);
    }
  };

  const mudarStatusTrilha = async (matricula: string, novoStatus: string) => {
    const acaoTexto = novoStatus === "Ativo" ? "APROVAR" : "DESCLASSIFICAR";
    if (
      !confirm(
        `Deseja realmente ${acaoTexto} este aluno no projeto Trilha Tech?`,
      )
    )
      return;

    setSalvando(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "mudar_status_trilhatech",
          matricula,
          novoStatus,
        }),
      });
      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert(
          `✅ Aluno ${novoStatus === "Ativo" ? "aprovado" : "desclassificado"} com sucesso!`,
        );
        mutate();
        setModalAberto(false);
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro ao conectar com o sistema: " + erro);
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
      <div className="max-w-7xl mx-auto">
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
          mostrarComObs={mostrarComObs}
          setMostrarComObs={setMostrarComObs}
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
          inscreverNoTrilha={inscreverNoTrilha}
          mudarStatusTrilha={mudarStatusTrilha}
        />
      </div>
    </div>
  );
}
