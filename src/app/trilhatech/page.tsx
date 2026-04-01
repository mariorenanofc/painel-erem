"use client";

import Header from "@/src/components/Header"; // Mantive o seu padrão de importação!
import { useState, useEffect } from "react";
// Se o seu arquivo de tipos estiver em outro lugar, ajuste o caminho abaixo
import { Aluno } from "@/src/types";

export default function TrilhaTechPage() {
  const [nomeUsuario] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("usuarioLogado") || "";
    }
    return "";
  });

  const [alunosCurso, setAlunosCurso] = useState<Aluno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizandoMatricula, setAtualizandoMatricula] = useState<
    string | null
  >(null);

  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  // 1. BUSCAR ALUNOS DA API
  useEffect(() => {
    const carregarAlunos = async () => {
      setCarregando(true);
      try {
        const res = await fetch(GOOGLE_API_URL);
        const data = await res.json();

        // Filtra Mágica: Pega SOMENTE quem tem algum status no Trilha Tech
        const alunosDoProjeto = data.filter(
          (aluno: Aluno) =>
            aluno.statusTrilha && aluno.statusTrilha.trim() !== "",
        );
        setAlunosCurso(alunosDoProjeto);
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        alert("❌ Falha ao carregar os alunos do curso.");
      } finally {
        setCarregando(false);
      }
    };

    if (GOOGLE_API_URL) carregarAlunos();
  }, [GOOGLE_API_URL]);

  // 2. FUNÇÃO PARA MUDAR O STATUS DO ALUNO
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
          matricula: matricula,
          novoStatus: novoStatus,
        }),
      });

      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert("✅ " + resposta.mensagem);
        // Recarrega os alunos após atualizar o status
        setCarregando(true);
        const reloadRes = await fetch(GOOGLE_API_URL);
        const reloadData = await reloadRes.json();
        const alunosDoProjeto = reloadData.filter(
          (aluno: Aluno) =>
            aluno.statusTrilha && aluno.statusTrilha.trim() !== "",
        );
        setAlunosCurso(alunosDoProjeto);
        setCarregando(false);
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro ao atualizar status: " + erro);
    } finally {
      setAtualizandoMatricula(null);
    }
  };

  function handleLogout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/";
  }

  // 3. CÁLCULO DE ESTATÍSTICAS RÁPIDAS
  const totalTurma1Ativos = alunosCurso.filter(
    (a) => a.turmaTrilha === "Turma 1 - 1º Ano" && a.statusTrilha === "Ativo",
  ).length;
  const totalTurma2Ativos = alunosCurso.filter(
    (a) => a.turmaTrilha === "Turma 2 - 2º Ano" && a.statusTrilha === "Ativo",
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Header
          carregando={carregando}
          nomeUsuario={nomeUsuario}
          onLogout={handleLogout}
        />

        {/* --- CARDS DE ESTATÍSTICAS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-bold text-slate-500 uppercase">
              Total de Inscritos
            </h3>
            <p className="text-3xl font-black text-slate-800">
              {alunosCurso.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-bold text-slate-500 uppercase">
              Ativos: Turma 1 (1º Ano)
            </h3>
            <p className="text-3xl font-black text-slate-800">
              {totalTurma1Ativos}{" "}
              <span className="text-sm font-medium text-slate-400">
                / 30 vagas
              </span>
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-bold text-slate-500 uppercase">
              Ativos: Turma 2 (2º Ano)
            </h3>
            <p className="text-3xl font-black text-slate-800">
              {totalTurma2Ativos}{" "}
              <span className="text-sm font-medium text-slate-400">
                / 30 vagas
              </span>
            </p>
          </div>
        </div>

        {/* --- TABELA DE GERENCIAMENTO --- */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              📋 Gerenciamento de Vagas
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs md:text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nome do Aluno</th>
                  <th className="p-4 font-semibold">Matrícula</th>
                  <th className="p-4 font-semibold">Turma do Curso</th>
                  <th className="p-4 font-semibold">Status Atual</th>
                  <th className="p-4 font-semibold text-center">
                    Ações de Gestão
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-sm">
                {alunosCurso.length > 0 ? (
                  alunosCurso.map((aluno, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="p-4 font-medium">{aluno.nome}</td>
                      <td className="p-4 font-mono text-emerald-600">
                        {aluno.matricula}
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        {aluno.turmaTrilha}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            aluno.statusTrilha === "Ativo"
                              ? "bg-emerald-100 text-emerald-700"
                              : aluno.statusTrilha === "Reserva"
                                ? "bg-amber-100 text-amber-700"
                                : aluno.statusTrilha === "Inscrito"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {aluno.statusTrilha}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {atualizandoMatricula === aluno.matricula ? (
                          <span className="text-slate-400 font-bold text-xs animate-pulse">
                            Atualizando...
                          </span>
                        ) : (
                          <select
                            className="bg-white border border-slate-300 text-slate-700 text-xs rounded p-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                            value=""
                            onChange={(e) =>
                              mudarStatus(aluno.matricula, e.target.value)
                            }
                          >
                            <option value="" disabled>
                              Mudar Status para...
                            </option>
                            <option value="Ativo">✅ Promover a Ativo</option>
                            <option value="Reserva">
                              ⏳ Mover para Reserva
                            </option>
                            <option value="Desistente">
                              ❌ Marcar como Desistente
                            </option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-500 font-medium"
                    >
                      Nenhum aluno inscrito no projeto ainda. Inscreva-os pelo
                      Painel de Gestão!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
