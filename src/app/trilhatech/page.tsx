"use client";

import Header from "@/src/components/Header";
import StudentModal from "@/src/components/StudentModal";
import TrilhaStatsCards from "@/src/components/TrilhaStatsCards";
import TrilhaFilters from "@/src/components/TrilhaFilters";
import TrilhaTable from "@/src/components/TrilhaTable";
import { useState, useEffect } from "react";
import { Aluno } from "@/src/types";

export default function TrilhaTechPage() {
  const [nomeUsuario] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("usuarioLogado") || "";
    return "";
  });

  const [alunosCurso, setAlunosCurso] = useState<Aluno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizandoMatricula, setAtualizandoMatricula] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno>({
    matricula: "", nome: "", dataNasc: "", email: "", turma: "", telefoneAluno: "", telefoneResponsavel: "", obs: "",
  });

  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  useEffect(() => {
    const carregarAlunos = async () => {
      setCarregando(true);
      try {
        const res = await fetch(GOOGLE_API_URL);
        const data = await res.json();
        setAlunosCurso(data.filter((aluno: Aluno) => aluno.statusTrilha && aluno.statusTrilha.trim() !== ""));
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        alert("❌ Falha ao carregar os alunos do curso.");
      } finally {
        setCarregando(false);
      }
    };
    if (GOOGLE_API_URL) carregarAlunos();
  }, [GOOGLE_API_URL]);

  const mudarStatus = async (matricula: string, novoStatus: string) => {
    if (!confirm(`Deseja realmente mudar o status desta matrícula para: ${novoStatus}?`)) return;
    setAtualizandoMatricula(matricula);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "mudar_status_trilhatech", matricula, novoStatus }),
      });
      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert("✅ " + resposta.mensagem);
        setAlunosCurso(alunosCurso.map(a => a.matricula === matricula ? { ...a, statusTrilha: novoStatus } : a));
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
    const ativos = alunosCurso.filter(a => a.statusTrilha === "Ativo");
    if (ativos.length === 0) return alert("⚠️ Não há nenhum aluno 'Ativo' para gerar a lista de presença.");
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFNOME DO ALUNO;MATRICULA;TURMA DO CURSO;TELEFONE;ASSINATURA\n";
    ativos.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(aluno => {
      csvContent += `${aluno.nome};${aluno.matricula};${aluno.turmaTrilha};${aluno.telefoneAluno};_______________________\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Lista_Frequencia_TrilhaTech.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const alunosFiltrados = alunosCurso.filter((aluno) => {
    const matchBusca = aluno.nome.toLowerCase().includes(busca.toLowerCase()) || aluno.matricula.includes(busca);
    const matchTurma = !filtroTurma || aluno.turmaTrilha === filtroTurma;
    const matchStatus = !filtroStatus || aluno.statusTrilha === filtroStatus;
    return matchBusca && matchTurma && matchStatus;
  });

  const totalTurma1Ativos = alunosCurso.filter((a) => a.turmaTrilha === "Turma 1 - 1º Ano" && a.statusTrilha === "Ativo").length;
  const totalTurma2Ativos = alunosCurso.filter((a) => a.turmaTrilha === "Turma 2 - 2º Ano" && a.statusTrilha === "Ativo").length;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Header carregando={carregando} nomeUsuario={nomeUsuario} onLogout={() => { localStorage.removeItem("usuarioLogado"); window.location.href = "/"; }} />
        
        <TrilhaStatsCards 
          totalInscritos={alunosCurso.length} 
          totalTurma1Ativos={totalTurma1Ativos} 
          totalTurma2Ativos={totalTurma2Ativos} 
        />
        
        <TrilhaFilters 
          busca={busca} setBusca={setBusca} 
          filtroTurma={filtroTurma} setFiltroTurma={setFiltroTurma} 
          filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus} 
          exportarListaFrequencia={exportarListaFrequencia} 
        />
        
        <TrilhaTable 
          alunosFiltrados={alunosFiltrados} 
          atualizandoMatricula={atualizandoMatricula} 
          mudarStatus={mudarStatus} 
          abrirModalVisualizacao={(aluno) => { setAlunoSelecionado(aluno); setModalAberto(true); }} 
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