"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CorrecaoMissoesModalProps } from "../types";

export default function CorrecaoMissoesModal({
  missaoAberta,
  entregas,
  carregando,
  notasTemp,
  onClose,
  onSetNotasTemp,
  onAvaliar,
}: CorrecaoMissoesModalProps) {
  const [feedbacksTemp, setFeedbacksTemp] = useState<Record<string, string>>({});

  if (!missaoAberta) return null;

  const handleNotaChange = (idEntrega: string, val: string) => {
    onSetNotasTemp({ ...notasTemp, [idEntrega]: Number(val) });
  };

  const handleFeedbackChange = (idEntrega: string, val: string) => {
    setFeedbacksTemp({ ...feedbacksTemp, [idEntrega]: val });
  };

  const isQuiz = missaoAberta.tipo === "Quiz";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
        >
          {/* Glow decorativo de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 p-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2.5 tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shadow-inner">
                  ✍️
                </span>{" "}
                Central de Correções
              </h2>
              <p className="text-blue-300 dark:text-blue-400 text-xs mt-1 font-semibold tracking-wide">
                Missão: <strong className="text-white dark:text-slate-100">{missaoAberta.titulo}</strong> (Max: {missaoAberta.xp} XP)
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
            >
              &times;
            </button>
          </div>

          {/* Conteúdo rolável */}
          <div className="p-0 overflow-y-auto flex-1 custom-scrollbar bg-white/40 dark:bg-transparent">
            {carregando ? (
              <div className="flex flex-col justify-center items-center py-20 opacity-60">
                <div className="relative w-10 h-10 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                </div>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">
                  Buscando entregas dos alunos...
                </p>
              </div>
            ) : entregas.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center">
                <div className="text-6xl mb-4 select-none opacity-40">📭</div>
                <p className="text-slate-500 dark:text-slate-400 font-black text-base uppercase tracking-wider">
                  Nenhum aluno enviou esta missão ainda.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {entregas.map((entrega, index) => {
                  const isDevolvida = entrega.status === "Devolvida";
                  const isAprovada = entrega.status === "Avaliado";
                  const aguardando = entrega.status === "Aguardando Correção";

                  // Formatação de data
                  const rawDataEnvio = entrega.dataEnvio;
                  const dataFormatada = rawDataEnvio
                    ? new Date(rawDataEnvio)
                        .toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        .replace(",", " às")
                    : "";

                  return (
                    <div
                      key={`${entrega.idEntrega}-${index}`}
                      className={`p-6 transition-all duration-300 ${
                        isDevolvida
                          ? "bg-red-500/5 dark:bg-red-950/5 border-l-4 border-l-red-500"
                          : isAprovada
                            ? "bg-emerald-500/5 dark:bg-emerald-950/5 border-l-4 border-l-emerald-500"
                            : "bg-white/60 dark:bg-slate-900/10 hover:bg-white/80 dark:hover:bg-slate-900/20 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                            <h3 className="font-display font-black text-slate-800 dark:text-white text-base leading-tight">
                              {entrega.nomeAluno}
                            </h3>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg font-mono font-bold">
                              {entrega.matricula}
                            </span>
                            {aguardando && !isQuiz && (
                              <span className="bg-amber-100/90 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-lg border border-amber-200/40 dark:border-amber-900/20 animate-pulse">
                                Novo
                              </span>
                            )}
                          </div>

                          {dataFormatada && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-4 flex items-center gap-1">
                              <span>🕒</span> Enviado em: {dataFormatada}
                            </p>
                          )}

                          {/* Resposta do aluno */}
                          <div className="bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 mb-4 shadow-inner">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                              {isQuiz ? "Alternativa Escolhida:" : "Resposta / Link do Projeto:"}
                            </p>
                            {entrega.resposta.startsWith("http") ? (
                              <motion.a
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                href={entrega.resposta}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/15 p-2 px-4.5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-sm break-all"
                              >
                                🔗 Abrir Link do Projeto
                              </motion.a>
                            ) : (
                              <p className="text-slate-700 dark:text-slate-300 font-mono text-xs whitespace-pre-wrap font-semibold leading-relaxed break-all select-all">
                                {entrega.resposta}
                              </p>
                            )}
                          </div>

                          {/* Campo de Feedback */}
                          {!isQuiz && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Feedback para o Aluno (Opcional):
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Deixe uma dica, observação ou explique o motivo da devolução..."
                                value={feedbacksTemp[entrega.idEntrega] ?? (entrega.feedback || "")}
                                onChange={(e) => handleFeedbackChange(entrega.idEntrega, e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                              />
                            </div>
                          )}
                        </div>

                        {/* Painel de Ação de Notas */}
                        <div className="md:w-60 shrink-0 flex flex-col justify-end border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800 pt-4 md:pt-0 md:pl-5">
                          {isQuiz ? (
                            <div className="text-center flex flex-col h-full justify-center py-2.5">
                              <div className="text-4xl mb-2 select-none">
                                {entrega.xpGanho > 0 ? "🎉" : "❌"}
                              </div>
                              <span className="text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-widest mb-1.5">
                                Auto-Corrigido
                              </span>
                              <span
                                className={`font-display font-black text-xl ${
                                  entrega.xpGanho > 0 ? "text-emerald-600 dark:text-emerald-450" : "text-red-500 dark:text-red-400"
                                }`}
                              >
                                {entrega.xpGanho} XP
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="mb-4">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase text-center mb-1.5 tracking-wider">
                                  Nota (XP)
                                </label>
                                <div className="relative max-w-[140px] mx-auto">
                                  <input
                                    type="number"
                                    value={notasTemp[entrega.idEntrega] ?? 0}
                                    onChange={(e) => handleNotaChange(entrega.idEntrega, e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 text-center font-black text-lg outline-none focus:border-emerald-500 transition-all font-mono"
                                  />
                                  <span className="absolute right-3.5 top-3.5 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase font-mono tracking-wide pointer-events-none">
                                    XP
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2.5">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() =>
                                    onAvaliar(
                                      entrega,
                                      "Devolvida",
                                      feedbacksTemp[entrega.idEntrega] || entrega.feedback || "",
                                    )
                                  }
                                  className="cursor-pointer flex-1 py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-955/20 text-red-600 dark:text-red-400"
                                >
                                  🔄 Devolver
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() =>
                                    onAvaliar(
                                      entrega,
                                      "Avaliado",
                                      feedbacksTemp[entrega.idEntrega] || entrega.feedback || "",
                                    )
                                  }
                                  className="cursor-pointer flex-1 py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-650 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                                >
                                  ✅ Aprovar
                                </motion.button>
                              </div>

                              <div className="mt-3.5 text-center">
                                {isDevolvida && (
                                  <span className="text-red-500 dark:text-red-400 font-black text-[10px] uppercase tracking-wider">
                                    ⚠️ Devolvida
                                  </span>
                                )}
                                {isAprovada && (
                                  <span className="text-emerald-600 dark:text-emerald-450 font-black text-[10px] uppercase tracking-wider">
                                    ✅ Avaliada ({entrega.xpGanho} XP)
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
