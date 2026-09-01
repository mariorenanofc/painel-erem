"use client";

import Header from "@/src/components/Header";
import StudentModal from "@/src/components/StudentModal";
import TrilhaStatsCards from "@/src/components/TrilhaStatsCards";
import TrilhaFilters from "@/src/components/TrilhaFilters";
import TrilhaTable from "@/src/components/TrilhaTable";
import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Aluno } from "@/src/types";
import { motion } from "framer-motion";
import { apiTutor } from "@/src/services/api";

export default function TrilhaTechPage() {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  useEffect(() => {
    const sessao = localStorage.getItem("usuarioLogado");
    if (sessao) setNomeUsuario(sessao);
    setVerificandoSessao(false);
  }, []);

  const [atualizandoMatricula, setAtualizandoMatricula] = useState<
    string | null
  >(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno>({
    matricula: "",
    nome: "",
    dataNasc: "",
    email: "",
    turma: "",
    telefoneAluno: "",
    telefoneResponsavel: "",
    obs: "",
  });

  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [mostrarComObs, setMostrarComObs] = useState(false);

  // 🚀 SWR com economia agressiva (Cache 24 horas no frontend)
  const {
    data: dadosBrutos,
    isLoading: carregando,
    mutate,
  } = useSWR("buscar_alunos_admin", () => apiTutor.buscarAlunosAdmin(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 86400000, // 24 horas
  });

  // Filtra a base geral para pegar apenas os alunos do Projeto
  const alunosCurso = useMemo(() => {
    if (!dadosBrutos) return [];

    let listaAlunos: Aluno[] = [];
    if (Array.isArray(dadosBrutos)) {
      listaAlunos = dadosBrutos;
    } else if (
      dadosBrutos.status === "sucesso" &&
      Array.isArray(dadosBrutos.alunos)
    ) {
      listaAlunos = dadosBrutos.alunos;
    } else {
      return [];
    }

    return listaAlunos;
  }, [dadosBrutos]);

  // Aplica a barra de pesquisa e os filtros suspensos
  const alunosFiltrados = useMemo(() => {
    return alunosCurso.filter((aluno: Aluno) => {
      const matchBusca =
        aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
        aluno.matricula.includes(busca);
      const matchTurma =
        filtroTurma === "" || aluno.turmaTrilha === filtroTurma;
      const matchStatus =
        filtroStatus === "" || aluno.statusTrilha === filtroStatus;

      const temObs = aluno.obs && aluno.obs.trim() !== "";
      const matchObs = mostrarComObs ? temObs : true;

      return matchBusca && matchTurma && matchStatus && matchObs;
    });
  }, [alunosCurso, busca, filtroTurma, filtroStatus, mostrarComObs]);

  // Calcula as estatísticas dos Cards
  const totalTurma1Ativos = useMemo(() => {
    return alunosCurso.filter(
      (a: Aluno) =>
        a.turmaTrilha === "Turma 1 - 1º Ano" && a.statusTrilha === "Ativo",
    ).length;
  }, [alunosCurso]);

  const totalTurma2Ativos = useMemo(() => {
    return alunosCurso.filter(
      (a: Aluno) =>
        a.turmaTrilha === "Turma 2 - 2º Ano" && a.statusTrilha === "Ativo",
    ).length;
  }, [alunosCurso]);

  // FUNÇÕES DE AÇÃO
  const mudarStatus = async (matricula: string, novoStatus: string) => {
    if (
      !confirm(
        `Deseja realmente mudar o status desta matrícula para: ${novoStatus}?`,
      )
    )
      return;
    setAtualizandoMatricula(matricula);
    try {
      const resposta = await apiTutor.mudarStatusTrilhaTech(matricula, novoStatus);
      if (resposta.status === "sucesso") {
        alert("✅ " + resposta.mensagem);
        mutate();
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro ao atualizar status: " + erro);
    } finally {
      setAtualizandoMatricula(null);
    }
  };

  const exportarListaFrequencia = () => {
    const ativos = alunosCurso.filter((a: Aluno) => a.statusTrilha === "Ativo");
    if (ativos.length === 0)
      return alert(
        "⚠️ Não há nenhum aluno 'Ativo' para gerar a lista de presença.",
      );

    let csvContent =
      "data:text/csv;charset=utf-8,\uFEFFNOME DO ALUNO;MATRICULA;TURMA DO CURSO;TELEFONE;ASSINATURA\n";
    ativos
      .sort((a: Aluno, b: Aluno) => a.nome.localeCompare(b.nome))
      .forEach((aluno: Aluno) => {
        csvContent += `${aluno.nome};${aluno.matricula};${aluno.turmaTrilha};${aluno.telefoneAluno};_______________________\n`;
      });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Lista_Frequencia_TrilhaTech.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirModalVisualizacao = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };

  if (verificandoSessao) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-bold text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <span>Verificando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 dark:bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <Header
          carregando={carregando}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            fetch("/api/action-proxy", { method: "POST", body: JSON.stringify({ action: "logout" }) }).then(() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            });
          }}
        />

        {/* Dashboard Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 mt-4 gap-4">
          <div className="text-left">
            <h2 className="font-display font-black text-2xl md:text-3xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
              Alunos Trilha Tech
              <span className="text-[10px] font-black tracking-widest uppercase bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl border border-blue-500/20 dark:border-blue-900/10 shadow-sm align-middle">
                Tutor Area
              </span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              Gerencie inscrições, turmas e emita listas de frequência da trilha gamificada.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => (window.location.href = "/trilhatech/aulas")}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/10 transition-all flex items-center gap-2"
            >
              <span>👨‍🏫</span> Gestão de Aulas
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => (window.location.href = "/trilhatech/configuracoes")}
              className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all flex items-center gap-2"
            >
              <span>⚙️</span> Configurações
            </motion.button>
          </div>
        </div>

        {/* Stats Cards Dashboard */}
        <TrilhaStatsCards
          totalInscritos={alunosCurso.length}
          totalTurma1Ativos={totalTurma1Ativos}
          totalTurma2Ativos={totalTurma2Ativos}
        />

        {/* Filter controls */}
        <TrilhaFilters
          busca={busca}
          setBusca={setBusca}
          filtroTurma={filtroTurma}
          setFiltroTurma={setFiltroTurma}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          mostrarComObs={mostrarComObs}
          setMostrarComObs={setMostrarComObs}
          exportarListaFrequencia={exportarListaFrequencia}
        />

        {/* Main Students Table */}
        <TrilhaTable
          alunosFiltrados={alunosFiltrados}
          atualizandoMatricula={atualizandoMatricula}
          mudarStatus={mudarStatus}
          abrirModalVisualizacao={abrirModalVisualizacao}
        />
      </div>

      <StudentModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        formData={alunoSelecionado}
        isEditing={true}
        handleChange={() => {}}
        salvarAluno={() => {}}
        salvando={false}
      />
    </main>
  );
}
