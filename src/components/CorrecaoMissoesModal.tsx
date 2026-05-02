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

  // Verifica se é Quiz para desabilitar a devolução manual
  const isQuiz = missaoAberta.tipo === "Quiz";

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="bg-blue-900 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="font-black text-xl flex items-center gap-2">
              <span>✍️</span> Central de Correções
            </h2>
            <p className="text-blue-300 text-xs mt-1">
              Missão:{" "}
              <strong className="text-white">{missaoAberta.titulo}</strong>{" "}
              (Max: {missaoAberta.xp} XP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl leading-none hover:text-blue-200 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
              <p className="font-bold">Buscando entregas...</p>
            </div>
          ) : entregas.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-40">📭</div>
              <p className="text-slate-600 font-bold text-lg">
                Nenhum aluno enviou esta missão ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {entregas.map((entrega, index) => {
                const isDevolvida = entrega.status === "Devolvida";
                const isAprovada = entrega.status === "Avaliado";
                const aguardando = entrega.status === "Aguardando Correção";

                return (
                  <div
                    key={`${entrega.idEntrega}-${index}`}
                    className={`p-5 transition-colors ${isDevolvida ? "bg-red-50/50" : isAprovada ? "bg-emerald-50/30" : "bg-white"}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-black text-slate-800 text-lg">
                            {entrega.nomeAluno}
                          </h3>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {entrega.matricula}
                          </span>
                          {aguardando && !isQuiz && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                              NOVO
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 mb-3">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                            {isQuiz
                              ? "Alternativa Escolhida:"
                              : "Resposta / Link do Projeto:"}
                          </p>
                          {entrega.resposta.startsWith("http") ? (
                            <a
                              href={entrega.resposta}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 font-bold hover:underline break-all"
                            >
                              🔗 Abrir Projeto ({entrega.resposta})
                            </a>
                          ) : (
                            <p className="text-slate-700 font-mono text-sm whitespace-pre-wrap font-black">
                              {entrega.resposta}
                            </p>
                          )}
                        </div>

                        {!isQuiz && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
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
                              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none transition-colors text-slate-700"
                            />
                          </div>
                        )}
                      </div>

                      <div className="md:w-64 shrink-0 flex flex-col justify-end border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
                        {isQuiz ? (
                          <div className="text-center flex flex-col h-full justify-center">
                            <div className="text-4xl mb-2">
                              {entrega.xpGanho > 0 ? "🎉" : "❌"}
                            </div>
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">
                              Auto-Corrigido
                            </span>
                            <span
                              className={`font-black text-2xl ${entrega.xpGanho > 0 ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {entrega.xpGanho} XP
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="mb-3">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase text-center mb-1">
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
                                  className="w-full bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl p-3 text-center font-black text-xl outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                                />
                                <span className="absolute right-4 top-3 text-slate-400 font-bold">
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
                                className="flex-1 py-3 px-2 rounded-xl text-xs font-black shadow-sm transition-all border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105"
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
                                className="flex-1 py-3 px-2 rounded-xl text-xs font-black shadow-md transition-all border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105"
                              >
                                ✅ Aprovar
                              </button>
                            </div>

                            <div className="mt-3 text-center">
                              {isDevolvida && (
                                <span className="text-red-600 font-bold text-xs uppercase tracking-widest">
                                  ⚠️ Devolvida
                                </span>
                              )}
                              {isAprovada && (
                                <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">
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
