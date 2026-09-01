import { motion } from "framer-motion";

export default function TrilhaStatsCards({
  totalInscritos,
  totalTurma1Ativos,
  totalTurma2Ativos,
}: {
  totalInscritos: number;
  totalTurma1Ativos: number;
  totalTurma2Ativos: number;
}) {
  const percentTurma1 = Math.min(Math.round((totalTurma1Ativos / 30) * 100), 100);
  const percentTurma2 = Math.min(Math.round((totalTurma2Ativos / 30) * 100), 100);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      {/* CARD 1: TOTAL INSCRITOS */}
      <motion.div
        variants={item}
        whileHover={{ y: -4, scale: 1.01 }}
        className="bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2rem] shadow-md border border-slate-200/60 dark:border-white/5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="text-xs">👥</span> Total de Inscritos
          </h3>
          <p className="text-4xl font-display font-black text-slate-800 dark:text-white font-mono mt-1">
            {totalInscritos}
          </p>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Mapeados no Trilha Tech
        </div>
      </motion.div>

      {/* CARD 2: TURMA 1 */}
      <motion.div
        variants={item}
        whileHover={{ y: -4, scale: 1.01 }}
        className="bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2rem] shadow-md border border-slate-200/60 dark:border-white/5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="text-xs">🏫</span> Ativos: Turma 1 (1º Ano)
          </h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-display font-black text-slate-800 dark:text-white font-mono">
              {totalTurma1Ativos}
            </span>
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase font-mono">
              / 30 Vagas
            </span>
          </div>
        </div>
        <div className="mt-5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentTurma1}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              className={`h-1.5 rounded-full ${
                percentTurma1 >= 90 ? "bg-rose-500" : percentTurma1 >= 75 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">
            Ocupação: <span className="font-mono">{percentTurma1}%</span>
          </p>
        </div>
      </motion.div>

      {/* CARD 3: TURMA 2 */}
      <motion.div
        variants={item}
        whileHover={{ y: -4, scale: 1.01 }}
        className="bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2rem] shadow-md border border-slate-200/60 dark:border-white/5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="text-xs">🏫</span> Ativos: Turma 2 (2º Ano)
          </h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-display font-black text-slate-800 dark:text-white font-mono">
              {totalTurma2Ativos}
            </span>
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase font-mono">
              / 30 Vagas
            </span>
          </div>
        </div>
        <div className="mt-5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentTurma2}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              className={`h-1.5 rounded-full ${
                percentTurma2 >= 90 ? "bg-rose-500" : percentTurma2 >= 75 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">
            Ocupação: <span className="font-mono">{percentTurma2}%</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}