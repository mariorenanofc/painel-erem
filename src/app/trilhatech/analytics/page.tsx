/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";
import { AlunoRisco, AlunoSimples } from "@/src/types/index";
import { apiTutor } from "@/src/services/api"; // 🔥 API CENTRALIZADA

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FichaAluno = any;

export default function AnalyticsPage() {
  const router = useRouter();
  const [nomeUsuario] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioLogado") || ""
      : "",
  );
  const [montado, setMontado] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<"geral" | "ficha">("geral");

  // Estados: Analytics Geral
  const [carregandoGeral, setCarregandoGeral] = useState(true);
  const [dadosGerais, setDadosGerais] = useState({
    totalAlunos: 0,
    totalXpEscola: 0,
    volumePix: 0,
    radarRisco: [] as AlunoRisco[],
  });
  const [listaAlunos, setListaAlunos] = useState<AlunoSimples[]>([]);

  // Estados: Diretório e Filtros
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroTurmaAluno, setFiltroTurmaAluno] = useState("Todas");

  // Estados: Ficha do Aluno
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [carregandoFicha, setCarregandoFicha] = useState(false);
  const [ficha360, setFicha360] = useState<FichaAluno | null>(null);

  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) window.location.href = "/";

    const buscarGeral = async () => {
      try {
        const data = await apiTutor.buscarAnalyticsGeral(); // 🔥 USO DA API
        if (data.status === "sucesso") {
          setDadosGerais({
            totalAlunos: data.totalAlunos,
            totalXpEscola: data.totalXpEscola,
            volumePix: data.volumePix,
            radarRisco: data.radarRisco || [],
          });
          setListaAlunos(data.alunos);
        }
      } catch (e) {
        console.error("Erro ao buscar analytics", e);
      } finally {
        setCarregandoGeral(false);
      }
    };

    buscarGeral();
  }, [nomeUsuario]);

  const buscarFichaAluno = async (matricula: string) => {
    setAlunoSelecionado(matricula);
    setCarregandoFicha(true);
    try {
      const data = await apiTutor.buscarFicha360(matricula); // 🔥 USO DA API
      if (data.status === "sucesso") setFicha360(data.ficha);
    } catch (e) {
      alert("Erro ao buscar a ficha do aluno.");
    } finally {
      setCarregandoFicha(false);
    }
  };

  const voltarParaLista = () => {
    setAlunoSelecionado("");
    setFicha360(null);
  };

  const investigarAluno = (matricula: string) => {
    setAbaAtiva("ficha");
    buscarFichaAluno(matricula);
  };

  const alunosFiltrados = listaAlunos.filter((a) => {
    const matchBusca =
      a.nome.toLowerCase().includes(buscaAluno.toLowerCase()) ||
      a.matricula.includes(buscaAluno);
    const matchTurma =
      filtroTurmaAluno === "Todas" || a.turma === filtroTurmaAluno;
    return matchBusca && matchTurma;
  });

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Header
          carregando={false}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "/";
          }}
        />

        <div className="flex items-center gap-4 mb-6 mt-4">
          <button
            onClick={() => router.push("/trilhatech/aulas")}
            className="text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-black text-slate-800 border-l-4 border-indigo-500 pl-3">
            Analytics & CRM
          </h2>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => {
              setAbaAtiva("geral");
              voltarParaLista();
            }}
            className={`px-6 py-3 rounded-t-lg font-bold transition-all whitespace-nowrap ${abaAtiva === "geral" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-100"}`}
          >
            📊 Visão Geral da Escola
          </button>
          <button
            onClick={() => setAbaAtiva("ficha")}
            className={`px-6 py-3 rounded-t-lg font-bold transition-all whitespace-nowrap ${abaAtiva === "ficha" ? "bg-amber-500 text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-100"}`}
          >
            🔍 Ficha 360º do Aluno
          </button>
        </div>

        {/* ABA: VISÃO GERAL */}
        {abaAtiva === "geral" && (
          <div className="space-y-6 animate-in fade-in">
            {carregandoGeral ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="bg-blue-100 p-4 rounded-full text-3xl">
                      👥
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Alunos Ativos
                      </p>
                      <p className="text-3xl font-black text-slate-800">
                        {dadosGerais.totalAlunos}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="bg-emerald-100 p-4 rounded-full text-3xl">
                      ⭐
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Economia (XP Gerado)
                      </p>
                      <p className="text-3xl font-black text-emerald-600">
                        {dadosGerais.totalXpEscola.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="bg-purple-100 p-4 rounded-full text-3xl">
                      💸
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Volume de Pix de XP
                      </p>
                      <p className="text-3xl font-black text-purple-600">
                        {dadosGerais.volumePix.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                        <span className="text-red-500 animate-pulse">🚨</span>{" "}
                        Radar de Risco
                      </h3>
                      <p className="text-xs text-slate-500">
                        Alunos com frequência crítica (&lt;70%) ou com 2+
                        missões atrasadas.
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 shadow-sm">
                      {dadosGerais.radarRisco.length} Alunos em Alerta
                    </span>
                  </div>

                  {dadosGerais.radarRisco.length === 0 ? (
                    <div className="text-center py-10 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-5xl block mb-3">🎉</span>
                      <p className="font-bold text-emerald-800 text-lg">
                        Tudo sob controlo!
                      </p>
                      <p className="text-sm text-emerald-600">
                        Nenhum aluno apresenta risco crítico de evasão neste
                        momento.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-2">
                      {dadosGerais.radarRisco.map((aluno, idx) => {
                        const numeroLimpo = aluno.telefone.replace(/\D/g, "");
                        const linkZap = numeroLimpo
                          ? `https://wa.me/55${numeroLimpo}?text=Olá ${aluno.nome.split(" ")[0]}, notámos a sua ausência nas atividades do Trilha Tech e gostávamos de ajudar. Está tudo bem?`
                          : "";

                        return (
                          <div
                            key={idx}
                            className="border border-red-200 bg-red-50/50 rounded-xl p-4 flex flex-col gap-3 hover:bg-white hover:shadow-md transition-all group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="pr-2">
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                                  {aluno.nome}
                                </h4>
                                <p className="text-[10px] font-mono text-slate-500">
                                  {aluno.turma} • {aluno.matricula}
                                </p>
                              </div>
                              {linkZap ? (
                                <a
                                  href={linkZap}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center flex-shrink-0"
                                  title="Chamar no WhatsApp"
                                >
                                  💬
                                </a>
                              ) : (
                                <span
                                  className="bg-slate-200 text-slate-500 p-2 rounded-lg text-xs font-bold flex-shrink-0"
                                  title="Sem telefone"
                                >
                                  📵
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-auto">
                              {aluno.taxaPresenca < 70 && (
                                <span className="bg-red-100 text-red-700 border border-red-200 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                  📉 Freq: {aluno.taxaPresenca}%
                                </span>
                              )}
                              {aluno.missoesAtrasadas >= 2 && (
                                <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                  ⚠️ {aluno.missoesAtrasadas} Atrasadas
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => investigarAluno(aluno.matricula)}
                              className="w-full mt-2 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              Ver Ficha Completa
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ABA: FICHA 360 DO ALUNO */}
        {abaAtiva === "ficha" && (
          <div className="animate-in fade-in">
            {!alunoSelecionado ? (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="w-full md:w-1/2 relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar por nome ou matrícula..."
                      value={buscaAluno}
                      onChange={(e) => setBuscaAluno(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      value={filtroTurmaAluno}
                      onChange={(e) => setFiltroTurmaAluno(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 text-slate-700 font-bold outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="Todas">Todas as Turmas</option>
                      <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
                      <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alunosFiltrados.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                      Nenhum aluno encontrado com estes filtros.
                    </div>
                  ) : (
                    alunosFiltrados.map((aluno) => (
                      <div
                        key={aluno.matricula}
                        onClick={() => buscarFichaAluno(aluno.matricula)}
                        className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:shadow-md hover:border-amber-300 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg border border-slate-200 group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors">
                            👤
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                              {aluno.nome}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {aluno.turma} • {aluno.matricula}
                            </p>
                          </div>
                        </div>
                        <div className="bg-amber-100 text-amber-700 w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          ❯
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={voltarParaLista}
                  className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  ← Voltar para o Diretório
                </button>

                {carregandoFicha ? (
                  <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500"></div>
                  </div>
                ) : ficha360 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-linear-to-b from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-slate-600">
                          👤
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="font-black text-xl mb-1">
                              {ficha360.dadosPessoais?.nome || "Sem Nome"}
                            </h2>
                            <p className="text-slate-400 font-mono text-sm mb-4">
                              Mat: {alunoSelecionado}
                            </p>
                          </div>
                          {ficha360.statusProjeto?.toLowerCase() ===
                          "reserva" ? (
                            <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2 py-1 rounded shadow-sm">
                              RESERVA
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded shadow-sm">
                              ATIVO
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-700 text-sm">
                          <div>
                            <span className="text-slate-500 text-xs uppercase block">
                              Turma do Projeto
                            </span>
                            <span className="font-bold text-amber-400">
                              {ficha360.turmaProjeto || "Não inscrito"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs uppercase block">
                              Email
                            </span>
                            <span>{ficha360.dadosPessoais?.email || "-"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs uppercase block">
                              Telefone (Aluno)
                            </span>
                            <span className="font-bold text-emerald-400">
                              {ficha360.dadosPessoais?.telefone ||
                                "Não informado"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs uppercase block">
                              Responsável
                            </span>
                            <span>
                              {ficha360.dadosPessoais?.responsavel || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                        <h3 className="font-bold text-amber-900 mb-2 uppercase text-xs tracking-widest flex items-center gap-1">
                          <span>⚠️</span> Observações da Gestão
                        </h3>
                        <p className="text-sm text-amber-800 bg-white p-3 rounded border border-amber-100 whitespace-pre-wrap">
                          {ficha360.dadosPessoais?.obs ||
                            "Nenhuma observação registrada."}
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      {ficha360.statusProjeto?.toLowerCase() === "reserva" && (
                        <div className="bg-slate-100 border border-slate-300 text-slate-700 px-5 py-4 rounded-xl shadow-sm flex items-center gap-4 animate-pulse">
                          <span className="text-3xl">🪑</span>
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-tight text-slate-800">
                              Aluno Reserva
                            </h3>
                            <p className="text-xs md:text-sm mt-0.5">
                              Este aluno está no banco de reservas.{" "}
                              <strong>Não há obrigatoriedade</strong> de
                              frequência ou entrega de missões enquanto não for
                              efetivado.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="text-4xl">⭐</div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              XP Total
                            </p>
                            <p className="text-2xl font-black text-emerald-600">
                              {ficha360.xpTotal ?? 0}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="text-4xl">🎓</div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Nível Atual
                            </p>
                            <p className="text-2xl font-black text-blue-600">
                              {ficha360.nivel || "Iniciante"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="text-4xl">📍</div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Frequência
                            </p>
                            <p
                              className={`text-2xl font-black ${(ficha360.frequencia?.taxa ?? 100) >= 75 ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {ficha360.frequencia?.taxa ?? 100}%
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {ficha360.frequencia?.totalPresencas ?? 0} de{" "}
                              {ficha360.frequencia?.totalAulas ?? 0} aulas
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-200">
                          <h3 className="font-bold text-slate-700 text-sm">
                            Histórico de Atividades e Economia
                          </h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto p-4">
                          {!ficha360.historicoXP ||
                          ficha360.historicoXP.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">
                              Nenhum registro de atividade encontrado.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {ficha360.historicoXP.map(
                                (item: any, idx: number) => {
                                  const isPix = item.id.includes("PIX");
                                  const isDoacao = isPix && item.xp < 0;
                                  const isBadge = item.id.includes("BADGE");

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                          {isPix ? "💸" : isBadge ? "🏆" : "📝"}
                                        </div>
                                        <div>
                                          <p className="font-bold text-slate-700 text-sm">
                                            {isPix
                                              ? "Transferência Pix"
                                              : isBadge
                                                ? "Conquista Desbloqueada"
                                                : `Missão: ${item.atividade}`}
                                          </p>
                                          <p className="text-xs text-slate-400">
                                            {new Date(
                                              item.data,
                                            ).toLocaleDateString("pt-BR")}{" "}
                                            - Status: {item.status}
                                          </p>
                                        </div>
                                      </div>
                                      <div
                                        className={`font-black text-lg ${isDoacao ? "text-red-500" : "text-emerald-600"}`}
                                      >
                                        {isDoacao ? "" : "+"}
                                        {item.xp} XP
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
