/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface NovidadesModalProps {
  onClose: () => void;
}

export default function NovidadesModal({ onClose }: NovidadesModalProps) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.3 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#ffffff"],
      zIndex: 99999,
    });
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] border border-slate-200/80 dark:border-white/5 w-full max-w-lg overflow-hidden flex flex-col relative z-10"
        >
          {/* Header do Modal com Gradiente */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 p-7 text-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15 mix-blend-overlay" />
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, delay: 0.15 }}
              className="text-5xl mb-3 relative z-10 select-none"
            >
              🚀
            </motion.div>
            <h2 className="font-display font-black text-2xl text-white uppercase tracking-widest relative z-10 drop-shadow-md">
              Atualização v2.0.0
            </h2>
            <p className="text-indigo-150 text-[10px] font-black mt-1.5 relative z-10 tracking-widest uppercase opacity-90">
              A Nova Era Visual do Trilha Tech
            </p>
          </div>

          {/* Conteúdo rolável */}
          <div className="p-6 md:p-8 overflow-y-auto max-h-[55vh] custom-scrollbar bg-white/40 dark:bg-transparent space-y-5">
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-center text-sm mb-4 leading-relaxed">
              Preparamos uma reformulação completa na interface da plataforma com o novo padrão **Aurora UI & Glassmorphism**. Confira as principais novidades:
            </p>

            {/* Novidade 1: Nova Interface Premium */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-md border border-indigo-400 relative overflow-hidden"
            >
              <h3 className="font-display font-black text-white text-sm md:text-base flex items-center gap-2 mb-2">
                <span>🎨</span> Visual Premium Redesenhado
              </h3>
              <p className="text-xs md:text-sm text-indigo-50 leading-relaxed font-medium">
                Interface com painéis flutuantes translúcidos de alto contraste, fundos interativos de constelação e micro-interações fluidas no dashboard e configurações de perfil.
              </p>
            </motion.div>

            {/* Novidade 2: Trilha de Aprendizado */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/15 dark:to-emerald-900/10 border border-emerald-250 dark:border-emerald-900/30 p-4.5 rounded-2xl shadow-sm"
            >
              <h3 className="font-display font-black text-emerald-900 dark:text-emerald-400 text-sm md:text-base flex items-center gap-2 mb-1.5">
                <span>🗺️</span> Modo Trilha de Aprendizado
              </h3>
              <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-350 leading-relaxed font-medium">
                Mude a visualização das atividades das aulas em tempo real! Escolha entre a tradicional Grade ou uma inovadora **Trilha de Aprendizado** com nós interativos conectados.
              </p>
            </motion.div>

            {/* Novidade 3: Notificações Toast Gamificadas */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm"
            >
              <h3 className="font-display font-black text-slate-800 dark:text-slate-200 text-sm md:text-base flex items-center gap-2 mb-1.5">
                <span>🚨</span> Feedbacks e Toasts Animados
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Novo sistema de avisos flutuantes integrados à sua gamificação com glows coloridos de acordo com o tipo de retorno (Quiz Correto, Recompensas, Erros ou Avisos).
              </p>
            </motion.div>

            {/* Novidade 4: Bento Modais e Sorteios */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm"
            >
              <h3 className="font-display font-black text-slate-800 dark:text-slate-200 text-sm md:text-base flex items-center gap-2 mb-1.5">
                <span>🎫</span> Pix de XP e Bilhetes Bento Grid
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Os modais de **Pix de XP**, **Frequência** e **Meus Bilhetes** foram organizados no formato Bento, trazendo relatórios visuais limpos e maior rapidez nas transações.
              </p>
            </motion.div>
          </div>

          {/* Rodapé fixo do Modal */}
          <div className="p-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/30 dark:bg-transparent shrink-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="cursor-pointer w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/10 uppercase tracking-widest text-sm select-none"
            >
              ACESSAR NOVAS FUNÇÕES! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}