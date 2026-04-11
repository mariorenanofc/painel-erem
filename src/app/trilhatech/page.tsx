"use client";

import Header from "@/src/components/Header";
import StudentModal from "@/src/components/StudentModal";
import TrilhaStatsCards from "@/src/components/TrilhaStatsCards";
import TrilhaFilters from "@/src/components/TrilhaFilters";
import TrilhaTable from "@/src/components/TrilhaTable";
import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Aluno } from "@/src/types";

// --- O "Buscador" que o SWR vai usar para ler a API ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  // 🚀 OTIMIZAÇÃO 1: SWR (Substitui o useEffect)
  const {
    data: dadosBrutos,
    isLoading: carregando,
    mutate,
  } = useSWR(GOOGLE_API_URL, fetcher, {
    revalidateOnFocus: true, // Atualiza os dados sozinho se você voltar para a aba
  });

  // 🚀 OTIMIZAÇÃO 2: useMemo (Memória do Navegador)

  // 1. Filtra a base geral para pegar apenas os alunos do Projeto
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

    return listaAlunos.filter(
      (aluno: Aluno) => aluno.statusTrilha && aluno.statusTrilha.trim() !== "",
    );
  }, [dadosBrutos]);

  // 2. Aplica a barra de pesquisa e os filtros suspensos
  const alunosFiltrados = useMemo(() => {
    return alunosCurso.filter((aluno: Aluno) => {
      const matchBusca =
        aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
        aluno.matricula.includes(busca);
      const matchTurma =
        filtroTurma === "" || aluno.turmaTrilha === filtroTurma;
      const matchStatus =
        filtroStatus === "" || aluno.statusTrilha === filtroStatus;

      // --- REGRA DE OBSERVAÇÕES ---
      const temObs = aluno.obs && aluno.obs.trim() !== "";
      const matchObs = mostrarComObs ? temObs : true;

      return matchBusca && matchTurma && matchStatus && matchObs;
    });
  }, [alunosCurso, busca, filtroTurma, filtroStatus, mostrarComObs]);

  // 3. Calcula as estatísticas dos Cards
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
        alert("✅ " + resposta.mensagem);
        mutate(); // Pede ao SWR para atualizar a tela!
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">
        Verificando sessão...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Header
          carregando={carregando}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "/";
          }}
        />

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-4 gap-4">
          <h2 className="text-2xl font-black text-slate-800">
            Alunos Trilha Tech
          </h2>
          <button
            onClick={() => (window.location.href = "/trilhatech/aulas")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <span>👨‍🏫</span> Gestão de Aulas
          </button>
        </div>

        {/* COMPONENTES QUE CRIAMOS SEPARADOS */}
        <TrilhaStatsCards
          totalInscritos={alunosCurso.length}
          totalTurma1Ativos={totalTurma1Ativos}
          totalTurma2Ativos={totalTurma2Ativos}
        />

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
        isEditing={false}
        handleChange={() => {}}
        salvarAluno={() => {}}
        salvando={false}
      />
    </main>
  );
}
