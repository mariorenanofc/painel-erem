"use client";

import { NovaConquistaModalProps } from "../types";

export default function NovaConquistaModal({
  badge,
  loading,
  onResgatar,
}: NovaConquistaModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in duration-300 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center border-4 border-amber-400 dark:border-amber-600 relative transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-amber-200/60 dark:from-amber-900/30 to-transparent pointer-events-none transition-colors duration-300"></div>
        <div className="p-8 relative z-10 flex flex-col items-center">
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full shadow-sm animate-pulse transition-colors">
            Nova Conquista Desbloqueada!
          </p>
          <div className="text-7xl mb-6 drop-shadow-xl animate-bounce">
            {badge.icone}
          </div>
          <h2 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-2 transition-colors">
            {badge.nome}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed transition-colors">
            {badge.descricao}
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 w-full rounded-xl p-3 mb-6 transition-colors duration-300">
            <p className="text-xs text-amber-700 dark:text-amber-500 font-bold uppercase mb-1">
              Recompensa da Conquista:
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              +{badge.recompensa} XP
            </p>
          </div>

          <button
            onClick={() => onResgatar(badge)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "A PROCESSAR..." : "🏆 RESGATAR RECOMPENSA"}
          </button>
        </div>
      </div>
    </div>
  );
}
