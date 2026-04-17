"use client";

import { calcularBadges, DadosParaBadges } from "../utils/badges";

export default function BadgesGallery({ dados }: { dados: DadosParaBadges }) {
  const badges = calcularBadges(dados);

  const categorias = [
    { id: "Missoes", nome: "🎯 Missões e Tarefas" },
    { id: "Acertos", nome: "🧠 Precisão e Acertos" },
    { id: "Disciplina", nome: "⏰ Disciplina" },
    { id: "XP", nome: "⭐ Experiência (XP)" },
    { id: "Social", nome: "🤝 Comunidade" },
    { id: "Frequencia", nome: "📍 Presença" },
    { id: "Secretas", nome: "🕵️ Conquistas Secretas" }
  ];

  const totalDesbloqueadas = badges.filter(b => b.desbloqueada).length;

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-3">
        <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><span>🏆</span> Mural de Conquistas</h3>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">{totalDesbloqueadas} / {badges.length} Desbloqueadas</span>
      </div>

      <div className="space-y-8">
        {categorias.map(cat => {
          const badgesDaCategoria = badges.filter(b => b.categoria === cat.id);
          if (badgesDaCategoria.length === 0) return null;

          return (
            <div key={cat.id}>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">{cat.nome}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {badgesDaCategoria.map(badge => (
                  <div key={badge.id} className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 ${badge.desbloqueada ? "bg-white border-amber-200 shadow-md hover:-translate-y-1 hover:shadow-lg" : "bg-slate-100 border-slate-200 opacity-60 grayscale hover:grayscale-0"}`} title={badge.descricao}>
                    
                    {/* PLAQUETA DE XP */}
                    <span className={`absolute -top-2 -right-2 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-10 ${badge.desbloqueada ? "bg-amber-500 text-white" : "bg-slate-300 text-slate-500"}`}>+{badge.recompensa} XP</span>
                    {!badge.desbloqueada && (<span className="absolute top-2 left-2 text-xs opacity-50">🔒</span>)}
                    
                    <div className={`text-4xl mb-2 ${badge.desbloqueada ? "drop-shadow-md animate-in zoom-in" : ""}`}>{badge.icone}</div>
                    <h5 className={`font-bold text-xs leading-tight mb-1 ${badge.desbloqueada ? "text-slate-800" : "text-slate-500"}`}>{badge.nome}</h5>
                    
                    <div className="w-full mt-auto pt-2">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1"><span>Progresso</span><span>{badge.progresso} / {badge.meta}</span></div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${badge.desbloqueada ? "bg-amber-500" : "bg-blue-400"}`} style={{ width: `${(badge.progresso / badge.meta) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}