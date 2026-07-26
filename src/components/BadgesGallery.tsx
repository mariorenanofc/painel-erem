"use client";

import { motion } from "framer-motion";
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] p-6 border border-slate-200/60 dark:border-white/5 shadow-lg backdrop-blur-md transition-colors duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h3 className="font-display font-black text-slate-800 dark:text-white text-base uppercase tracking-wider flex items-center gap-2">
          <span>🏆</span> Mural de Conquistas
        </h3>
        <span className="bg-amber-500/10 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-lg border border-amber-500/20 dark:border-amber-900/10 shadow-sm">
          {totalDesbloqueadas} / {badges.length} Desbloqueadas
        </span>
      </div>

      {/* Categorias */}
      <div className="space-y-10">
        {categorias.map((cat) => {
          const badgesDaCategoria = badges.filter((b) => b.categoria === cat.id);
          if (badgesDaCategoria.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                {cat.nome}
              </h4>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {badgesDaCategoria.map((badge) => {
                  const percent = Math.min(Math.round((badge.progresso / badge.meta) * 100), 100);

                  return (
                    <motion.div
                      key={badge.id}
                      variants={item}
                      whileHover={badge.desbloqueada ? { y: -4, scale: 1.02, boxShadow: "0 0 25px rgba(245,158,11,0.15)" } : {}}
                      whileTap={badge.desbloqueada ? { scale: 0.98 } : {}}
                      className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 ${
                        badge.desbloqueada
                          ? "bg-white dark:bg-slate-800 border-amber-250 dark:border-amber-500/50 shadow-md cursor-pointer"
                          : "bg-slate-100/50 dark:bg-slate-950/15 border-slate-200/50 dark:border-slate-800 opacity-55 grayscale hover:grayscale-[50%] cursor-not-allowed"
                      }`}
                    >
                      {/* PLAQUETA DE XP RECOMPENSA */}
                      <span
                        className={`absolute -top-2 -right-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm z-10 border ${
                          badge.desbloqueada
                            ? "bg-amber-500 text-white border-amber-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        +{badge.recompensa} XP
                      </span>
                      
                      {!badge.desbloqueada && (
                        <span className="absolute top-3 left-3 text-xs opacity-50 select-none">
                          🔒
                        </span>
                      )}

                      <div
                        className={`text-4.5xl mb-3 select-none ${
                          badge.desbloqueada ? "drop-shadow-md animate-bounce" : ""
                        }`}
                      >
                        {badge.icone}
                      </div>
                      
                      <h5
                        className={`font-display font-black text-xs leading-snug mb-2 ${
                          badge.desbloqueada ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {badge.nome}
                      </h5>

                      <div className="w-full mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 font-mono">
                          <span>PROGRESSO</span>
                          <span>
                            {badge.progresso} / {badge.meta}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              badge.desbloqueada ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
