"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DadosAluno, AlunoRanking } from "../types";
import PerfilPublicoModal from "./PerfilPublicoModal";
import { apiTutor } from "@/src/services/api";

interface AlunoRankingComAvatar extends AlunoRanking {
  avatar?: string;
}

interface RankingModalProps {
  aluno: DadosAluno;
  onClose: () => void;
}

export default function RankingModal({ aluno, onClose }: RankingModalProps) {
  const [dadosRanking, setDadosRanking] = useState<AlunoRankingComAvatar[]>([]);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [abaRanking, setAbaRanking] = useState<"Geral" | "Turma">("Geral");
  const [filtroTempo, setFiltroTempo] = useState<"geral" | "semanal" | "mensal">("geral");
  const [perfilAlvo, setPerfilAlvo] = useState<string | null>(null);

  const carregarRanking = async (tempoSelecionado: "geral" | "semanal" | "mensal") => {
    setCarregandoRanking(true);
    try {
      const data = await apiTutor.buscarRanking(tempoSelecionado);
      if (data.status === "sucesso") {
        setDadosRanking(data.ranking);
      }
    } catch {
      // Silently fail or handled
    } finally {
      setCarregandoRanking(false);
    }
  };

  useEffect(() => {
    carregarRanking(filtroTempo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mudarFiltroTempo = (novoTempo: "geral" | "semanal" | "mensal") => {
    setFiltroTempo(novoTempo);
    carregarRanking(novoTempo);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in transition-colors duration-300">
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel-heavy w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-white/5 transition-colors duration-300"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 dark:from-slate-950 dark:via-amber-950/30 dark:to-slate-900 p-5 flex justify-between items-center text-white shrink-0 shadow-md relative transition-colors duration-300">
          <div>
            <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2 tracking-tight">
              <span>🏆</span> Leaderboard da Escola
            </h2>
            <p className="text-amber-100 dark:text-amber-400 text-[10px] md:text-xs mt-1 font-medium font-sans">
              Os maiores pontuadores de programação do Trilha Tech
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="cursor-pointer text-3xl leading-none text-white/70 hover:text-white transition-colors"
          >
            &times;
          </motion.button>
        </div>

        {/* ABAS */}
        <div className="flex bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-300 font-sans">
          <button
            onClick={() => setAbaRanking("Geral")}
            className={`cursor-pointer flex-1 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all duration-200 ${
              abaRanking === "Geral"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white/70 dark:bg-slate-900/60"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/20"
            }`}
          >
            🌎 Ranking Geral
          </button>
          <button
            onClick={() => setAbaRanking("Turma")}
            className={`cursor-pointer flex-1 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all duration-200 ${
              abaRanking === "Turma"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white/70 dark:bg-slate-900/60"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/20"
            }`}
          >
            👥 Minha Turma
          </button>
        </div>

        {/* FILTROS DE TEMPO */}
        <div className="bg-white/60 dark:bg-slate-950/30 px-4 py-3 flex justify-center gap-2 border-b border-slate-200 dark:border-slate-800/80 shrink-0 transition-colors duration-300">
          {(["geral", "mensal", "semanal"] as const).map((tempo) => {
            const label = tempo === "geral" ? "Histórico Total" : tempo === "mensal" ? "Este Mês" : "Esta Semana";
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={tempo}
                onClick={() => mudarFiltroTempo(tempo)}
                className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  filtroTempo === tempo
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 border-slate-200 dark:border-slate-800/80"
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </div>

        {/* CONTAINER DA LISTA */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/40 dark:bg-slate-900/20 transition-colors duration-300 select-none custom-scrollbar">
          {carregandoRanking ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-amber-500/40 rounded-full"
                />
                <motion.span
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="text-4xl relative z-10"
                >
                  🏆
                </motion.span>
              </div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 animate-pulse tracking-widest uppercase mt-1">
                Processando Classificação...
              </p>
            </div>
          ) : dadosRanking.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-5xl mb-3 opacity-55">📭</div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Nenhum aluno pontuou neste período ainda.
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
                Realize as missões e envie as respostas para garantir o topo!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-w-xl mx-auto">
              {(() => {
                const minhaTurmaTrilha = dadosRanking.find(
                  (r) => r.matricula === aluno.matricula,
                )?.turma;
                const listaExibicao =
                  abaRanking === "Geral"
                    ? dadosRanking
                    : dadosRanking
                        .filter((r) => r.turma === minhaTurmaTrilha)
                        .map((r, index) => ({ ...r, posicao: index + 1 }));

                if (abaRanking === "Turma" && !minhaTurmaTrilha)
                  return (
                    <p className="text-center text-slate-500 dark:text-slate-400 font-medium py-8">
                      Não foi possível identificar a sua turma cadastrada.
                    </p>
                  );
                if (listaExibicao.length === 0)
                  return (
                    <p className="text-center text-slate-500 dark:text-slate-400 font-medium py-8">
                      Nenhum colega da sua turma pontuou neste período ainda.
                    </p>
                  );

                return (
                  <AnimatePresence>
                    {listaExibicao.map((userRank, idx) => {
                      const isMe = userRank.matricula === aluno.matricula;
                      let medalha = "";
                      let styleCard = "bg-white/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700";
                      let styleNome = "text-slate-850 dark:text-slate-100";
                      
                      if (userRank.posicao === 1) {
                        medalha = "🥇";
                        styleCard = "bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-amber-400/50 dark:border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.06)]";
                        styleNome = "text-amber-900 dark:text-amber-400";
                      } else if (userRank.posicao === 2) {
                        medalha = "🥈";
                        styleCard = "bg-gradient-to-r from-slate-400/10 via-slate-300/5 to-transparent border-slate-300/50 dark:border-slate-600/30 shadow-[0_4px_15px_rgba(156,163,175,0.04)]";
                        styleNome = "text-slate-900 dark:text-slate-200";
                      } else if (userRank.posicao === 3) {
                        medalha = "🥉";
                        styleCard = "bg-gradient-to-r from-orange-400/10 via-orange-300/5 to-transparent border-orange-300/40 dark:border-orange-500/20 shadow-[0_4px_15px_rgba(249,115,22,0.04)]";
                        styleNome = "text-orange-900 dark:text-orange-400";
                      } else if (isMe) {
                        styleCard = "bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent border-indigo-500/40 dark:border-indigo-500/30 shadow-[0_4px_15px_rgba(99,102,241,0.06)]";
                        styleNome = "text-indigo-900 dark:text-indigo-400";
                      }

                      const avatarExibicao =
                        userRank.avatar && userRank.avatar !== "avatar-padrao"
                          ? userRank.avatar
                          : "👨‍💻";

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                          key={userRank.matricula}
                          onClick={() => setPerfilAlvo(userRank.matricula)}
                          className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] hover:shadow-md ${styleCard}`}
                        >
                          {/* Rank indicator and Avatar */}
                          <div className="flex items-center justify-center gap-2.5 shrink-0 w-16 md:w-20">
                            <div className="w-6 text-center font-black text-slate-400 dark:text-slate-500 text-sm md:text-base">
                              {medalha || `${userRank.posicao}º`}
                            </div>
                            <div className="w-10 h-10 md:w-11 md:h-11 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                              {avatarExibicao}
                            </div>
                          </div>

                          {/* Student Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm md:text-base truncate ${styleNome}`}>
                              {userRank.nome}
                              {isMe && (
                                <span className="text-[9px] bg-indigo-600 dark:bg-indigo-500 text-white font-black px-2 py-0.5 rounded-full ml-2 shadow-sm align-middle">
                                  VOCÊ
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">
                              {userRank.turma} • {userRank.nivel}
                            </p>
                          </div>

                          {/* XP amount */}
                          <div className="text-right bg-white/60 dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 whitespace-nowrap shrink-0">
                            <span className="font-display font-black text-amber-600 dark:text-amber-500 text-base md:text-lg">
                              {userRank.xp}
                            </span>
                            <span className="text-[9px] text-slate-450 dark:text-slate-500 ml-1 font-bold uppercase tracking-widest">
                              XP
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          )}
        </div>
      </motion.div>

      {perfilAlvo && (
        <PerfilPublicoModal
          matriculaAlvo={perfilAlvo}
          matriculaVisualizador={aluno.matricula}
          onClose={() => setPerfilAlvo(null)}
        />
      )}
    </div>
  );
}
