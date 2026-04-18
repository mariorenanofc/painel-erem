"use client";

import { Badge } from "../utils/badges";

interface NovaConquistaModalProps {
  badge: Badge;
  loading: boolean;
  onResgatar: (badge: Badge) => void;
}

export default function NovaConquistaModal({ badge, loading, onResgatar }: NovaConquistaModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center border-4 border-amber-400 relative">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-amber-200/60 to-transparent pointer-events-none"></div>
        <div className="p-8 relative z-10 flex flex-col items-center">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 bg-amber-100 px-3 py-1 rounded-full shadow-sm animate-pulse">Nova Conquista Desbloqueada!</p>
          <div className="text-7xl mb-6 drop-shadow-xl animate-bounce">{badge.icone}</div>
          <h2 className="font-black text-2xl text-slate-800 mb-2">{badge.nome}</h2>
          <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">{badge.descricao}</p>
          
          <div className="bg-amber-50 border border-amber-200 w-full rounded-xl p-3 mb-6">
            <p className="text-xs text-amber-700 font-bold uppercase mb-1">Recompensa da Conquista:</p>
            <p className="text-2xl font-black text-amber-600">+{badge.recompensa} XP</p>
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