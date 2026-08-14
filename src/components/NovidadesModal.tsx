/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface NovidadesModalProps {
  onClose: () => void;
  versao?: string;
  markdown?: string;
}

export default function NovidadesModal({ onClose, versao = "2.0.0", markdown = "" }: NovidadesModalProps) {
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
              Atualização {versao}
            </h2>
            <p className="text-indigo-150 text-[10px] font-black mt-1.5 relative z-10 tracking-widest uppercase opacity-90">
              Novidades Gamificadas da Plataforma
            </p>
          </div>

          {/* Conteúdo rolável */}
          <div className="p-6 md:p-8 overflow-y-auto max-h-[55vh] custom-scrollbar bg-white/40 dark:bg-transparent space-y-5">
            <div className="prose prose-slate dark:prose-invert prose-sm md:prose-base prose-headings:font-black prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400 prose-a:text-pink-500 max-w-none">
              {markdown ? (
                <ReactMarkdown>{markdown}</ReactMarkdown>
              ) : (
                <p className="text-center italic opacity-70">Nenhuma novidade registrada no momento.</p>
              )}
            </div>
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