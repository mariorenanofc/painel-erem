"use client";

import { NovaConquistaModalProps } from "../types";
import { motion, AnimatePresence } from "framer-motion";

export default function NovaConquistaModal({
  badge,
  loading,
  onResgatar,
}: NovaConquistaModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        {/* Backdrop animado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/20"
        />

        {/* Card do Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.2)] w-full max-w-sm overflow-hidden flex flex-col text-center border border-white/10 relative z-10"
        >
          {/* Top border decorativa com gradiente dourado/fúcsia */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-pink-500" />
          
          <div className="absolute top-2 left-0 w-full h-40 bg-gradient-to-b from-amber-200/20 dark:from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="p-8 relative z-10 flex flex-col items-center">
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6 bg-amber-100/80 dark:bg-amber-900/40 px-4 py-1.5 rounded-full shadow-sm ring-1 ring-amber-500/20"
            >
              🎉 Nova Conquista Desbloqueada!
            </motion.p>
            
            {/* Ícone da conquista com animação de flutuação premium */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: [0, -10, 0],
              }}
              transition={{
                scale: { type: "spring", damping: 10, delay: 0.2 },
                y: {
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                  delay: 0.5,
                },
              }}
              className="text-7xl mb-6 select-none filter drop-shadow-[0_10px_15px_rgba(245,158,11,0.3)]"
            >
              {badge.icone}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display font-black text-2xl text-slate-800 dark:text-slate-50 mb-2 tracking-tight"
            >
              {badge.nome}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-slate-500 dark:text-slate-450 mb-6 leading-relaxed px-2 font-medium"
            >
              {badge.descricao}
            </motion.p>

            {/* Container da recompensa estilizado em glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 w-full rounded-2xl p-4 mb-8 shadow-inner backdrop-blur-sm"
            >
              <p className="text-[10px] text-amber-700 dark:text-amber-450 font-black uppercase tracking-wider mb-1">
                Recompensa da Conquista
              </p>
              <p className="text-3xl font-black bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 bg-clip-text text-transparent dark:from-amber-400 dark:to-yellow-300 drop-shadow-sm font-mono">
                +{badge.recompensa} XP
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onResgatar(badge)}
              disabled={loading}
              className="cursor-pointer w-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-pink-500 hover:from-amber-600 hover:to-pink-650 text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-widest transition-all disabled:opacity-50 disabled:transform-none select-none"
            >
              {loading ? "Processando..." : "🏆 Resgatar Recompensa"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
