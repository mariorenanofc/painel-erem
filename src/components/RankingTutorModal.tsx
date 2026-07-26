"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlunoRankingTutor } from "../types";
import PerfilPublicoModal from "./PerfilPublicoModal";
import ThreeInteractiveBg from "./ThreeInteractiveBg";

interface AlunoRankingComAvatar extends AlunoRankingTutor {
  avatar?: string;
}

interface RankingTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carregando: boolean;
  dadosRanking: AlunoRankingComAvatar[];
  filtroTempo: "geral" | "mensal" | "semanal";
  filtroTurma: string;
  setFiltroTurma: (val: string) => void;
  onMudarFiltroTempo: (tempo: "geral" | "mensal" | "semanal") => void;
  onExportarCSV: () => void;
}

export default function RankingTutorModal({
  isOpen,
  onClose,
  carregando,
  dadosRanking,
  filtroTempo,
  filtroTurma,
  setFiltroTurma,
  onMudarFiltroTempo,
  onExportarCSV,
}: RankingTutorModalProps) {
  const [perfilAlvo, setPerfilAlvo] = useState<string | null>(null);

  const turmasRanking = useMemo(() => {
    const turmas = new Set(dadosRanking.map((a) => a.turma));
    return ["Todas", ...Array.from(turmas).sort()];
  }, [dadosRanking]);

  const rankingFiltrado = useMemo(() => {
    let lista = dadosRanking;
    if (filtroTurma !== "Todas") {
      lista = dadosRanking.filter((a) => a.turma === filtroTurma);
    }
    return lista.map((aluno, index) => ({ ...aluno, posicao: index + 1 }));
  }, [dadosRanking, filtroTurma]);

  const podio = rankingFiltrado.slice(0, 3);

  const getAvatar = (avatarStr?: string) =>
    avatarStr && avatarStr !== "avatar-padrao" ? avatarStr : "👨‍💻";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] overflow-y-auto font-sans flex flex-col transition-colors duration-300 select-none">
      
      {/* 3D Dynamic Interactive Star Constellation background behind the tutor table report */}
      <ThreeInteractiveBg />

      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-brand-primary via-indigo-650 to-brand-secondary dark:from-slate-950 dark:via-indigo-955/20 dark:to-slate-900 text-white p-4 sticky top-0 z-20 shadow-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display font-black flex items-center gap-2 leading-tight">
              <span>🏆</span> Relatórios e Rankings
            </h2>
            <p className="text-indigo-100 dark:text-slate-400 text-xs font-sans font-medium mt-0.5">
              Visão estratégica e métricas de engajamento da escola
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="cursor-pointer bg-white/10 hover:bg-white/20 p-2 px-3 rounded-xl transition-colors text-sm font-bold flex items-center gap-1 border border-white/15"
          >
            <span>Fechar</span> &times;
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-6xl w-full mx-auto p-4 md:p-6 flex-1 relative z-10">
        
        {/* FILTROS E AÇÕES BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          
          <div className="flex bg-white/60 dark:bg-slate-950/45 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 w-full md:w-auto transition-colors duration-300 backdrop-blur-sm">
            {(["geral", "mensal", "semanal"] as const).map((tempo) => (
              <button
                key={tempo}
                onClick={() => onMudarFiltroTempo(tempo)}
                className={`cursor-pointer flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  filtroTempo === tempo
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-500/25"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                }`}
              >
                {tempo === "geral" ? "Histórico Total" : tempo}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto flex items-center gap-3 bg-white/60 dark:bg-slate-950/45 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-sm">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">
              Turma:
            </label>
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 text-slate-800 dark:text-slate-100 rounded-lg p-1.5 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all w-48"
            >
              {turmasRanking.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExportarCSV}
              title="Exportar CSV para Excel"
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold p-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs"
            >
              <span>📥</span> Exportar
            </motion.button>
          </div>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-indigo-500/40 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                className="absolute inset-2 border border-dotted border-cyan-500/30 rounded-full"
              />
              <motion.span
                animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="text-5xl relative z-10"
              >
                🏆
              </motion.span>
            </div>
            <p className="text-xs font-bold text-brand-primary dark:text-brand-secondary animate-pulse tracking-widest uppercase mt-1">
              Computando Relatórios...
            </p>
          </div>
        ) : rankingFiltrado.length === 0 ? (
          <div className="glass-panel-heavy p-16 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg transition-colors duration-300">
            <div className="text-5xl mb-4 opacity-50">📭</div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              Nenhum aluno pontuou neste período de tempo.
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* O PÓDIO VISUAL DO TUTOR COM AVATARES */}
            <div className="lg:col-span-1 glass-panel-heavy rounded-3xl p-6 shadow-xl relative border border-slate-200 dark:border-white/5 transition-colors duration-300 flex flex-col justify-between min-h-[350px]">
              <h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-widest text-center mb-6">
                🏆 Top 3 Podio
              </h3>
              
              <div className="flex justify-center items-end gap-2.5 h-56 mt-4">
                {podio[1] && (
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => setPerfilAlvo(podio[1].matricula)}
                    className="w-1/3 flex flex-col items-center cursor-pointer group"
                  >
                    <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 -mb-6 border-4 border-slate-350 dark:border-slate-600 relative transition-colors">
                      {getAvatar(podio[1].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-slate-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                        2
                      </div>
                    </div>
                    <div className="bg-slate-200/60 dark:bg-slate-850/40 w-full h-28 rounded-2xl border border-slate-300/40 dark:border-slate-800/60 flex flex-col items-center pt-8 px-1.5 text-center group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                      <p className="font-bold text-[10px] line-clamp-2 text-slate-800 dark:text-slate-200 leading-tight">
                        {podio[1].nome}
                      </p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-black mt-auto mb-3 text-[10px]">
                        {podio[1].xp} XP
                      </p>
                    </div>
                  </motion.div>
                )}

                {podio[0] && (
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => setPerfilAlvo(podio[0].matricula)}
                    className="w-1/3 flex flex-col items-center z-10 cursor-pointer group"
                  >
                    <div className="text-3xl mb-1 filter drop-shadow-md animate-bounce">
                      👑
                    </div>
                    <div className="bg-white dark:bg-slate-800 w-14 h-14 rounded-full flex items-center justify-center text-4xl shadow-xl z-10 -mb-7 border-4 border-amber-400 dark:border-amber-500 relative transition-colors">
                      {getAvatar(podio[0].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-amber-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                        1
                      </div>
                    </div>
                    <div className="bg-amber-500/10 dark:bg-amber-550/10 w-full h-36 rounded-2xl border border-amber-400/30 dark:border-amber-500/30 flex flex-col items-center pt-9 px-1.5 text-center group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/15 transition-colors">
                      <p className="font-bold text-[11px] line-clamp-2 text-amber-950 dark:text-amber-400 leading-tight">
                        {podio[0].nome}
                      </p>
                      <p className="text-amber-600 dark:text-amber-500 font-black mt-auto mb-3 text-xs">
                        {podio[0].xp} XP
                      </p>
                    </div>
                  </motion.div>
                )}

                {podio[2] && (
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => setPerfilAlvo(podio[2].matricula)}
                    className="w-1/3 flex flex-col items-center cursor-pointer group"
                  >
                    <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 -mb-6 border-4 border-orange-350 dark:border-orange-500 relative transition-colors">
                      {getAvatar(podio[2].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-orange-400 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                        3
                      </div>
                    </div>
                    <div className="bg-slate-200/60 dark:bg-slate-850/40 w-full h-24 rounded-2xl border border-slate-300/40 dark:border-slate-800/60 flex flex-col items-center pt-8 px-1.5 text-center group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                      <p className="font-bold text-[10px] line-clamp-2 text-slate-800 dark:text-slate-200 leading-tight">
                        {podio[2].nome}
                      </p>
                      <p className="text-orange-600 dark:text-orange-500 font-black mt-auto mb-3 text-[10px]">
                        {podio[2].xp} XP
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* TABELA COMPLETA COM AVATARES */}
            <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-lg transition-colors duration-300">
              <div className="bg-slate-100/60 dark:bg-slate-950/60 p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest">
                  Lista Geral de Alunos
                </h3>
                <span className="bg-indigo-500/10 text-brand-primary dark:text-brand-secondary text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-500/20">
                  {rankingFiltrado.length} Alunos
                </span>
              </div>
              
              <div className="overflow-x-auto max-h-[55vh] overflow-y-auto custom-scrollbar select-text">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10 transition-colors">
                    <tr className="text-slate-450 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800 text-center w-16">
                        Pos
                      </th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">
                        Aluno
                      </th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">
                        Turma
                      </th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">
                        Nível
                      </th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800 text-right">
                        XP
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                    {rankingFiltrado.map((aluno) => (
                      <tr
                        key={aluno.matricula}
                        onClick={() => setPerfilAlvo(aluno.matricula)}
                        className={`cursor-pointer hover:bg-brand-primary/5 dark:hover:bg-slate-850/60 transition-colors ${
                          aluno.posicao && aluno.posicao <= 3
                            ? "bg-amber-500/5 dark:bg-amber-500/[0.03]"
                            : ""
                        }`}
                      >
                        <td className="p-3 text-center font-black text-slate-450 dark:text-slate-500">
                          {aluno.posicao}º
                        </td>
                        
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-lg shrink-0 shadow-sm transition-colors">
                              {getAvatar(aluno.avatar)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight transition-colors">
                                {aluno.nome}
                              </p>
                              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-mono font-medium transition-colors mt-0.5">
                                {aluno.matricula}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-3 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                          {aluno.turma}
                        </td>
                        
                        <td className="p-3">
                          <span className="bg-indigo-500/10 border border-indigo-500/20 text-brand-primary dark:text-brand-secondary text-[10px] font-black px-2 py-0.5 rounded">
                            {aluno.nivel}
                          </span>
                        </td>
                        
                        <td className="p-3 text-right">
                          <span className="font-display font-black text-emerald-600 dark:text-emerald-500 text-base">
                            {aluno.xp}
                          </span>{" "}
                          <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest">
                            XP
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {perfilAlvo && (
        <PerfilPublicoModal
          matriculaAlvo={perfilAlvo}
          matriculaVisualizador={"1234567"}
          onClose={() => setPerfilAlvo(null)}
        />
      )}
    </div>
  );
}
