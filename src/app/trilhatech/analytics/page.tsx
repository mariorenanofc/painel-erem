/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";
import { AlunoRisco, AlunoSimples } from "@/src/types/index";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

type FichaAluno = any;

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();

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
        const data = await apiTutor.buscarAnalyticsGeral();
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
        toast("Erro ao carregar o painel geral.", "error", "Falha de Conexão");
      } finally {
        setCarregandoGeral(false);
      }
    };

    buscarGeral();
  }, [nomeUsuario, toast]);

  const buscarFichaAluno = async (matricula: string) => {
    setAlunoSelecionado(matricula);
    setCarregandoFicha(true);
    try {
      const data = await apiTutor.buscarFicha360(matricula);
      if (data.status === "sucesso") setFicha360(data.ficha);
    } catch (e) {
      toast("Erro ao buscar a ficha do aluno.", "error", "Falha");
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
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300"></div>
    );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/5 dark:bg-fuchsia-500/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 relative z-10">
        <Header
          carregando={false}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            fetch("/api/action-proxy", { method: "POST", body: JSON.stringify({ action: "logout" }) }).then(() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            });
          }}
        />

        {/* TOP HEADER */}
        <div className="flex items-center gap-4 mb-8 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/trilhatech/aulas")}
            className="cursor-pointer text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            ← Voltar
          </motion.button>
          <div className="text-left">
            <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
              Analytics & CRM
              <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 dark:border-indigo-900/10 shadow-sm align-middle">
                Tutor Radar
              </span>
            </h2>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex gap-2.5 mb-8 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              setAbaAtiva("geral");
              voltarParaLista();
            }}
            className={`cursor-pointer px-6 py-3.5 rounded-t-2xl font-black uppercase text-[10px] tracking-wider transition-all whitespace-nowrap relative ${
              abaAtiva === "geral"
                ? "text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-slate-900/30 border border-b-transparent border-slate-200 dark:border-slate-800"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/10"
            }`}
          >
            📊 Visão Geral da Escola
            {abaAtiva === "geral" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setAbaAtiva("ficha")}
            className={`cursor-pointer px-6 py-3.5 rounded-t-2xl font-black uppercase text-[10px] tracking-wider transition-all whitespace-nowrap relative ${
              abaAtiva === "ficha"
                ? "text-amber-600 dark:text-amber-400 bg-white/70 dark:bg-slate-900/30 border border-b-transparent border-slate-200 dark:border-slate-800"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/10"
            }`}
          >
            🔍 Ficha 360º do Aluno
            {abaAtiva === "ficha" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-amber-500"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* CONTENEDORES DE TAB */}
        <AnimatePresence mode="wait">
          {abaAtiva === "geral" && (
            <motion.div
              key="geral"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              {carregandoGeral ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* BENTO STATS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/85 dark:bg-slate-900/40 p-6 rounded-[2rem] shadow-md border border-slate-200/60 dark:border-white/5 backdrop-blur-md flex items-center gap-4 transition-all">
                      <div className="bg-blue-500/10 dark:bg-blue-500/5 p-4 rounded-2xl text-2xl select-none">
                        👥
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                          Alunos Ativos
                        </p>
                        <p className="text-3xl font-display font-black text-slate-800 dark:text-white font-mono mt-0.5">
                          {dadosGerais.totalAlunos}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/85 dark:bg-slate-900/40 p-6 rounded-[2rem] shadow-md border border-slate-200/60 dark:border-white/5 backdrop-blur-md flex items-center gap-4 transition-all">
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-2xl text-2xl select-none">
                        ⭐
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                          XP Gerado (Economia)
                        </p>
                        <p className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-450 font-mono mt-0.5">
                          {dadosGerais.totalXpEscola.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/85 dark:bg-slate-900/40 p-6 rounded-[2rem] shadow-md border border-slate-200/60 dark:border-white/5 backdrop-blur-md flex items-center gap-4 transition-all">
                      <div className="bg-purple-500/10 dark:bg-purple-500/5 p-4 rounded-2xl text-2xl select-none">
                        💸
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                          Volume de Pix de XP
                        </p>
                        <p className="text-3xl font-display font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                          {dadosGerais.volumePix.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RADAR DE RISCO */}
                  <div className="bg-white/85 dark:bg-slate-900/40 p-6 rounded-[2.5rem] shadow-lg border border-slate-200/60 dark:border-white/5 backdrop-blur-md transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
                      <div className="text-left">
                        <h3 className="font-display font-black text-slate-800 dark:text-white text-lg flex items-center gap-2.5">
                          <span className="text-red-500 animate-pulse select-none">🚨</span> Radar de Risco
                        </h3>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-semibold">
                          Alunos com frequência crítica (&lt;70%) ou com 2+ missões atrasadas.
                        </p>
                      </div>
                      <span className="bg-rose-500/10 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-rose-500/20 dark:border-rose-900/10 shadow-sm">
                        {dadosGerais.radarRisco.length} Alunos em Alerta
                      </span>
                    </div>

                    {dadosGerais.radarRisco.length === 0 ? (
                      <div className="text-center py-12 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl border border-emerald-500/15 dark:border-emerald-900/10">
                        <span className="text-5xl block mb-3 select-none">🎉</span>
                        <p className="font-black text-emerald-800 dark:text-emerald-300 text-base uppercase tracking-wider">
                          Tudo sob controle!
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 font-semibold">
                          Nenhum aluno apresenta risco crítico de evasão neste momento.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[500px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                        {dadosGerais.radarRisco.map((aluno, idx) => {
                          const numeroLimpo = aluno.telefone.replace(/\D/g, "");
                          const linkZap = numeroLimpo
                            ? `https://wa.me/55${numeroLimpo}?text=Olá ${aluno.nome.split(" ")[0]}, notámos a sua ausência nas atividades do Trilha Tech e gostávamos de ajudar. Está tudo bem?`
                            : "";

                          return (
                            <motion.div
                              key={idx}
                              whileHover={{ y: -3 }}
                              className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/20 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:bg-white dark:hover:bg-slate-900 hover:shadow-md transition-all text-left"
                            >
                              <div className="flex justify-between items-start">
                                <div className="pr-2 min-w-0">
                                  <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">
                                    {aluno.nome}
                                  </h4>
                                  <p className="text-[9px] font-mono font-bold text-slate-450 dark:text-slate-500 mt-0.5">
                                    {aluno.turma} • {aluno.matricula}
                                  </p>
                                </div>
                                {linkZap ? (
                                  <a
                                    href={linkZap}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl shadow-sm transition-colors text-xs flex items-center justify-center shrink-0 w-8 h-8 select-none"
                                    title="Chamar no WhatsApp"
                                  >
                                    💬
                                  </a>
                                ) : (
                                  <span
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-550 p-2 rounded-xl text-xs font-bold shrink-0 w-8 h-8 flex items-center justify-center select-none"
                                    title="Sem telefone"
                                  >
                                    📵
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mt-auto">
                                {aluno.taxaPresenca < 70 && (
                                  <span className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                                    📉 Freq: {aluno.taxaPresenca}%
                                  </span>
                                )}
                                {aluno.missoesAtrasadas >= 2 && (
                                  <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                                    ⚠️ {aluno.missoesAtrasadas} Atrasadas
                                  </span>
                                )}
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => investigarAluno(aluno.matricula)}
                                className="cursor-pointer w-full text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-inner"
                              >
                                Ver Ficha Completa
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {abaAtiva === "ficha" && (
            <motion.div
              key="ficha"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {!alunoSelecionado ? (
                <div className="space-y-6">
                  {/* DIRECTORY FILTERS */}
                  <div className="bg-white/85 dark:bg-slate-900/40 p-5 rounded-[2rem] shadow-lg border border-slate-200/60 dark:border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center backdrop-blur-md">
                    <div className="w-full md:w-1/2 relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      <input
                        type="text"
                        placeholder="Buscar por nome ou matrícula..."
                        value={buscaAluno}
                        onChange={(e) => setBuscaAluno(e.target.value)}
                        className="w-full pl-9 pr-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 transition-all text-xs font-semibold placeholder:text-slate-400"
                      />
                    </div>
                    <div className="w-full md:w-auto relative">
                      <select
                        value={filtroTurmaAluno}
                        onChange={(e) => setFiltroTurmaAluno(e.target.value)}
                        className="cursor-pointer w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 pr-10 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider outline-none focus:border-amber-500 bg-white dark:bg-slate-950 appearance-none shadow-sm"
                      >
                        <option value="Todas" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todas as Turmas</option>
                        <option value="Turma 1 - 1º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 1 - 1º Ano</option>
                        <option value="Turma 2 - 2º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 2 - 2º Ano</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[9px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* ALUNOS GRID LIST */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {alunosFiltrados.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-450 dark:text-slate-500 bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 font-black uppercase tracking-wider text-xs shadow-md">
                        Nenhum aluno encontrado com estes filtros.
                      </div>
                    ) : (
                      alunosFiltrados.map((aluno) => (
                        <motion.div
                          key={aluno.matricula}
                          whileHover={{ y: -3, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => buscarFichaAluno(aluno.matricula)}
                          className="bg-white/80 dark:bg-slate-900/40 p-4 px-5 rounded-2xl border border-slate-200/60 dark:border-white/5 flex justify-between items-center hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/50 cursor-pointer transition-all group text-left"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-base border border-slate-200 dark:border-slate-850 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 group-hover:text-amber-500 transition-colors select-none">
                              👤
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-850 dark:text-white text-sm line-clamp-1">
                                {aluno.nome}
                              </h4>
                              <p className="text-xs text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                                {aluno.turma} • {aluno.matricula}
                              </p>
                            </div>
                          </div>
                          <div className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 w-8 h-8 rounded-xl flex items-center justify-center border border-amber-500/20 dark:border-amber-500/10 group-hover:scale-105 transition-transform select-none">
                            ❯
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={voltarParaLista}
                    className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black py-2.5 px-5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center gap-2 shadow-sm text-xs uppercase tracking-wider"
                  >
                    ← Voltar para o Diretório
                  </motion.button>

                  {carregandoFicha ? (
                    <div className="flex justify-center py-20 bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-md">
                      <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  ) : ficha360 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* FICHA ESQUERDA: PROFILE */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden border border-white/5">
                          <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full blur-[70px] pointer-events-none" />
                          
                          <div className="w-18 h-18 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-5 border-2 border-slate-700 relative select-none">
                            👤
                          </div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="font-display font-black text-xl mb-1">
                                {ficha360.dadosPessoais?.nome || "Sem Nome"}
                              </h2>
                              <p className="text-slate-500 font-mono font-bold text-xs mb-4">
                                Mat: {alunoSelecionado}
                              </p>
                            </div>
                            {ficha360.statusProjeto?.toLowerCase() === "reserva" ? (
                              <span className="bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-slate-700 shadow-sm">
                                RESERVA
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-emerald-500/25 shadow-sm">
                                ATIVO
                              </span>
                            )}
                          </div>

                          <div className="space-y-3.5 pt-5 border-t border-slate-800 text-xs">
                            <div>
                              <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block mb-0.5">
                                Turma do Projeto
                              </span>
                              <span className="font-bold text-amber-400">
                                {ficha360.turmaProjeto || "Não inscrito"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block mb-0.5">
                                Email
                              </span>
                              <span className="font-semibold text-slate-300 truncate block">{ficha360.dadosPessoais?.email || "-"}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block mb-0.5">
                                Telefone (Aluno)
                              </span>
                              <span className="font-bold text-emerald-400">
                                {ficha360.dadosPessoais?.telefone || "Não informado"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block mb-0.5">
                                Responsável
                              </span>
                              <span className="font-semibold text-slate-300">{ficha360.dadosPessoais?.responsavel || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {/* OBSERVACOES */}
                        <div className="bg-amber-500/5 dark:bg-amber-950/10 p-5 rounded-[2rem] border border-amber-500/20 dark:border-amber-900/10">
                          <h3 className="font-display font-black text-amber-700 dark:text-amber-300 mb-3.5 uppercase text-[10px] tracking-widest flex items-center gap-1.5 select-none">
                            <span>⚠️</span> Observações da Gestão
                          </h3>
                          <p className="text-xs text-amber-800 dark:text-amber-200 bg-white/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-amber-500/10 dark:border-amber-900/10 whitespace-pre-wrap font-semibold leading-relaxed">
                            {ficha360.dadosPessoais?.obs || "Nenhuma observação registrada."}
                          </p>
                        </div>
                      </div>

                      {/* FICHA DIREITA: ANALYTICS CARDS & HISTÓRICO */}
                      <div className="lg:col-span-2 space-y-6">
                        {ficha360.statusProjeto?.toLowerCase() === "reserva" && (
                          <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-350 p-5 rounded-2xl shadow-sm flex items-center gap-4 animate-pulse">
                            <span className="text-3xl select-none">🪑</span>
                            <div>
                              <h3 className="font-display font-black text-sm uppercase tracking-tight text-slate-800 dark:text-white">
                                Aluno Reserva
                              </h3>
                              <p className="text-xs mt-1 font-semibold leading-relaxed">
                                Este aluno está no banco de reservas. <strong>Não há obrigatoriedade</strong> de frequência ou entrega de missões enquanto não for efetivado.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="bg-white/80 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center gap-4">
                            <div className="text-3xl select-none">⭐</div>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                                XP Total
                              </p>
                              <p className="text-2xl font-display font-black text-emerald-600 dark:text-emerald-450 mt-0.5 font-mono">
                                {ficha360.xpTotal ?? 0}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center gap-4">
                            <div className="text-3xl select-none">🎓</div>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                                Nível Atual
                              </p>
                              <p className="text-xl font-display font-black text-blue-600 dark:text-brand-secondary mt-1">
                                {ficha360.nivel || "Iniciante"}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/80 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center gap-4">
                            <div className="text-3xl select-none">📍</div>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                                Frequência
                              </p>
                              <p className={`text-2xl font-display font-black mt-0.5 font-mono ${(ficha360.frequencia?.taxa ?? 100) >= 75 ? "text-emerald-600 dark:text-emerald-450" : "text-red-500"}`}>
                                {ficha360.frequencia?.taxa ?? 100}%
                              </p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                                {ficha360.frequencia?.totalPresencas ?? 0} de {ficha360.frequencia?.totalAulas ?? 0} aulas
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* HISTÓRICO */}
                        <div className="bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 shadow-lg overflow-hidden backdrop-blur-md">
                          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-display font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                              Histórico de Atividades e Economia
                            </h3>
                          </div>
                          <div className="max-h-96 overflow-y-auto p-5 custom-scrollbar">
                            {!ficha360.historicoXP || ficha360.historicoXP.length === 0 ? (
                              <p className="text-center text-slate-450 dark:text-slate-500 py-10 font-bold text-xs uppercase tracking-wider italic">
                                Nenhum registro de atividade encontrado.
                              </p>
                            ) : (
                              <div className="space-y-3.5">
                                {ficha360.historicoXP.map((item: any, idx: number) => {
                                  const isPix = item.id.includes("PIX");
                                  const isDoacao = isPix && item.xp < 0;
                                  const isBadge = item.id.includes("BADGE");

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                    >
                                      <div className="flex items-center gap-3.5">
                                        <div className="text-xl select-none">
                                          {isPix ? "💸" : isBadge ? "🏆" : "📝"}
                                        </div>
                                        <div className="text-left">
                                          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                            {isPix
                                              ? "Transferência Pix"
                                              : isBadge
                                                ? "Conquista Desbloqueada"
                                                : `Missão: ${item.atividade}`}
                                          </p>
                                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-black uppercase tracking-wider font-mono">
                                            <span>🕒</span>{" "}
                                            {new Date(item.data)
                                              .toLocaleString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })
                                              .replace(",", " às")}{" "}
                                            • Status: {item.status}
                                          </p>
                                        </div>
                                      </div>
                                      <div
                                        className={`font-display font-black text-base font-mono ${isDoacao ? "text-rose-500" : "text-emerald-600 dark:text-emerald-450"}`}
                                      >
                                        {isDoacao ? "" : "+"}
                                        {item.xp} XP
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
