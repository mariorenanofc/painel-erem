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
    { id: "Secretas", nome: "🕵️ Conquistas Secretas" },
  ];

  const totalDesbloqueadas = badges.filter((b) => b.desbloqueada).length;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mt-6 transition-colors duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors duration-300">
        <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors">
          <span>🏆</span> Mural de Conquistas
        </h3>
        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 text-xs font-bold px-3 py-1 rounded-full shadow-sm transition-colors">
          {totalDesbloqueadas} / {badges.length} Desbloqueadas
        </span>
      </div>

      <div className="space-y-8">
        {categorias.map((cat) => {
          const badgesDaCategoria = badges.filter(
            (b) => b.categoria === cat.id,
          );
          if (badgesDaCategoria.length === 0) return null;

          return (
            <div key={cat.id}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1 transition-colors">
                {cat.nome}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {badgesDaCategoria.map((badge) => (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 ${badge.desbloqueada ? "bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-500/50 shadow-md hover:-translate-y-1 hover:shadow-lg" : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 grayscale hover:grayscale-0"}`}
                    title={badge.descricao}
                  >
                    {/* PLAQUETA DE XP */}
                    <span
                      className={`absolute -top-2 -right-2 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-10 transition-colors ${badge.desbloqueada ? "bg-amber-500 text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}
                    >
                      +{badge.recompensa} XP
                    </span>
                    {!badge.desbloqueada && (
                      <span className="absolute top-2 left-2 text-xs opacity-50">
                        🔒
                      </span>
                    )}

                    <div
                      className={`text-4xl mb-2 ${badge.desbloqueada ? "drop-shadow-md animate-in zoom-in" : ""}`}
                    >
                      {badge.icone}
                    </div>
                    <h5
                      className={`font-bold text-xs leading-tight mb-1 transition-colors ${badge.desbloqueada ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {badge.nome}
                    </h5>

                    <div className="w-full mt-auto pt-2">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                        <span>Progresso</span>
                        <span>
                          {badge.progresso} / {badge.meta}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-colors">
                        <div
                          className={`h-full rounded-full transition-colors ${badge.desbloqueada ? "bg-amber-500" : "bg-blue-400 dark:bg-blue-500"}`}
                          style={{
                            width: `${(badge.progresso / badge.meta) * 100}%`,
                          }}
                        ></div>
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
