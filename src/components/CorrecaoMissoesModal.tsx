"use client";

import { Atividade, Entrega } from "../types";

interface CorrecaoMissoesModalProps {
  missaoAberta: Atividade | null;
  entregas: Entrega[];
  carregando: boolean;
  notasTemp: Record<string, number>;
  onClose: () => void;
  onSetNotasTemp: (notas: Record<string, number>) => void;
  onAvaliar: (entrega: Entrega) => void;
}

export default function CorrecaoMissoesModal({
  missaoAberta, entregas, carregando, notasTemp, onClose, onSetNotasTemp, onAvaliar
}: CorrecaoMissoesModalProps) {
  
  if (!missaoAberta) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">📝 Entregas: {missaoAberta.titulo}</h2>
          <button onClick={onClose} className="text-3xl leading-none hover:text-slate-300">&times;</button>
        </div>

        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <span className="text-sm font-bold text-slate-600">Alunos que enviaram: {entregas.length}</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">XP Máximo: {missaoAberta.xp}</span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {carregando ? (
            <p className="text-center text-slate-500 py-8 animate-pulse">Buscando cadernos...</p>
          ) : entregas.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhum aluno enviou resposta ainda.</p>
          ) : (
            entregas.map((ent) => (
              <div key={ent.idEntrega} className="border border-slate-200 rounded-lg bg-white p-4 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${ent.status === "Avaliado" ? "bg-emerald-500" : "bg-amber-400"}`}></span>
                    <h3 className="font-bold text-slate-800">{ent.nomeAluno}</h3>
                    <span className="text-xs text-slate-400 font-mono">({ent.matricula})</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-700 text-sm break-all font-medium">
                    {missaoAberta.tipo === "Projeto" && ent.resposta.startsWith("http") ? (
                      <a href={ent.resposta} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">🔗 Abrir Link do Projeto</a>
                    ) : (
                      <p><span className="text-slate-400 text-xs uppercase block mb-1">Resposta do Aluno:</span> {ent.resposta}</p>
                    )}
                    {missaoAberta.tipo === "Quiz" && (
                      <p className={`mt-2 text-xs font-bold ${ent.resposta === missaoAberta.respostaCorreta ? "text-emerald-600" : "text-red-500"}`}>
                        Gabarito Oficial: {missaoAberta.respostaCorreta}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-48 border-l border-slate-100 pl-0 md:pl-6 flex flex-col justify-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dar Nota (XP)</label>
                  <input
                    type="number"
                    max={Number(missaoAberta.xp)}
                    value={notasTemp[ent.idEntrega] ?? 0}
                    onChange={(e) => onSetNotasTemp({ ...notasTemp, [ent.idEntrega]: Number(e.target.value) })}
                    className="w-full border-2 border-emerald-200 focus:border-emerald-500 rounded p-2 text-center font-black text-emerald-700 outline-none"
                  />
                  <button
                    onClick={() => onAvaliar(ent)}
                    className={`w-full py-2 rounded text-sm font-bold text-white transition-colors ${ent.status === "Avaliado" ? "bg-slate-400 hover:bg-slate-500" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {ent.status === "Avaliado" ? "Reavaliar" : "Avaliar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}