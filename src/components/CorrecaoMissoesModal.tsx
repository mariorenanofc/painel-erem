/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
  const [feedbacksTemp, setFeedbacksTemp] = useState<Record<string, string>>(
    {},
  );

  if (!missaoAberta) return null;

  const handleNotaChange = (idEntrega: string, val: string) => {
    onSetNotasTemp({ ...notasTemp, [idEntrega]: Number(val) });
  };

  const handleFeedbackChange = (idEntrega: string, val: string) => {
    setFeedbacksTemp({ ...feedbacksTemp, [idEntrega]: val });
  };

  const isQuiz = missaoAberta.tipo === "Quiz";

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border dark:border-slate-800 transition-colors duration-300">
        <div className="bg-blue-900 dark:bg-slate-900 p-5 flex justify-between items-center text-white shrink-0 border-b dark:border-slate-800 transition-colors duration-300">
          <div>
            <h2 className="font-black text-xl flex items-center gap-2">
              <span>✍️</span> Central de Correções
            </h2>
            <p className="text-blue-300 dark:text-blue-400 text-xs mt-1 transition-colors">
              Missão:{" "}
              <strong className="text-white dark:text-slate-100">
                {missaoAberta.titulo}
              </strong>{" "}
              (Max: {missaoAberta.xp} XP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-3xl leading-none hover:text-blue-200 dark:hover:text-blue-400 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 custom-scrollbar">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 dark:border-blue-500 mb-4"></div>
              <p className="font-bold">Buscando entregas...</p>
            </div>
          ) : entregas.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-40">📭</div>
              <p className="text-slate-600 dark:text-slate-400 font-bold text-lg transition-colors">
                Nenhum aluno enviou esta missão ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
              {entregas.map((entrega, index) => {
                const isDevolvida = entrega.status === "Devolvida";
                const isAprovada = entrega.status === "Avaliado";
                const aguardando = entrega.status === "Aguardando Correção";

                // 🔥 FORMATAÇÃO DA HORA DA ENTREGA
                const rawDataEnvio = (entrega as any).dataEnvio;
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
                    className={`p-5 transition-colors duration-300 ${isDevolvida ? "bg-red-50/50 dark:bg-red-900/10" : isAprovada ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "bg-white dark:bg-slate-900"}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg transition-colors">
                            {entrega.nomeAluno}
                          </h3>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono transition-colors">
                            {entrega.matricula}
                          </span>
                          {aguardando && !isQuiz && (
                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 border border-amber-200 dark:border-amber-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse transition-colors">
                              NOVO
                            </span>
                          )}
                        </div>

                        {/* 🔥 EXIBIÇÃO DA HORA */}
                        {dataFormatada && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-3 flex items-center gap-1 transition-colors">
                            <span>🕒</span> Enviado em: {dataFormatada}
                          </p>
                        )}

                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 transition-colors">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                            {isQuiz
                              ? "Alternativa Escolhida:"
                              : "Resposta / Link do Projeto:"}
                          </p>
                          {entrega.resposta.startsWith("http") ? (
                            <a
                              href={entrega.resposta}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 font-bold hover:underline break-all transition-colors"
                            >
                              🔗 Abrir Projeto ({entrega.resposta})
                            </a>
                          ) : (
                            <p className="text-slate-700 dark:text-slate-300 font-mono text-sm whitespace-pre-wrap font-black transition-colors">
                              {entrega.resposta}
                            </p>
                          )}
                        </div>

                        {!isQuiz && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block transition-colors">
                              Feedback para o Aluno (Opcional):
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Deixe uma dica ou explique o motivo da devolução..."
                              value={
                                feedbacksTemp[entrega.idEntrega] ??
                                (entrega.feedback || "")
                              }
                              onChange={(e) =>
                                handleFeedbackChange(
                                  entrega.idEntrega,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors text-slate-700 dark:text-slate-200"
                            />
                          </div>
                        )}
                      </div>

                      <div className="md:w-64 shrink-0 flex flex-col justify-end border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-4 transition-colors">
                        {isQuiz ? (
                          <div className="text-center flex flex-col h-full justify-center">
                            <div className="text-4xl mb-2">
                              {entrega.xpGanho > 0 ? "🎉" : "❌"}
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 transition-colors">
                              Auto-Corrigido
                            </span>
                            <span
                              className={`font-black text-2xl transition-colors ${entrega.xpGanho > 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-500 dark:text-red-400"}`}
                            >
                              {entrega.xpGanho} XP
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="mb-3">
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-center mb-1 transition-colors">
                                Nota (XP)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={notasTemp[entrega.idEntrega] ?? 0}
                                  onChange={(e) =>
                                    handleNotaChange(
                                      entrega.idEntrega,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-center font-black text-xl outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                />
                                <span className="absolute right-4 top-3 text-slate-400 dark:text-slate-500 font-bold transition-colors">
                                  XP
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  onAvaliar(
                                    entrega,
                                    "Devolvida",
                                    feedbacksTemp[entrega.idEntrega] ||
                                      entrega.feedback ||
                                      "",
                                  )
                                }
                                className="cursor-pointer flex-1 py-3 px-2 rounded-xl text-xs font-black shadow-sm transition-all border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-105"
                              >
                                🔄 Devolver
                              </button>
                              <button
                                onClick={() =>
                                  onAvaliar(
                                    entrega,
                                    "Avaliado",
                                    feedbacksTemp[entrega.idEntrega] ||
                                      entrega.feedback ||
                                      "",
                                  )
                                }
                                className="cursor-pointer flex-1 py-3 px-2 rounded-xl text-xs font-black shadow-md transition-all border border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 hover:scale-105"
                              >
                                ✅ Aprovar
                              </button>
                            </div>

                            <div className="mt-3 text-center">
                              {isDevolvida && (
                                <span className="text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest transition-colors">
                                  ⚠️ Devolvida
                                </span>
                              )}
                              {isAprovada && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest transition-colors">
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
      </div>
    </div>
  );
}
