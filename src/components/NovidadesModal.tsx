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
            {!markdown ? (
              <p className="text-center italic opacity-70">Nenhuma novidade registrada no momento.</p>
            ) : (
              markdown.split(/(?=### )/g).map((parte, index) => {
                if (!parte.startsWith("### ")) {
                  return (
                    <div key={index} className="px-1 prose prose-slate dark:prose-invert prose-sm md:prose-base prose-a:text-pink-500 font-medium text-slate-600 dark:text-slate-300 text-center leading-relaxed mb-4 max-w-none">
                      <ReactMarkdown>{parte}</ReactMarkdown>
                    </div>
                  );
                }

                // Definir estilos baseados no índice para variar o visual
                let cardClass = "";
                let headingClass = "";
                let pClass = "";

                if (index % 3 === 1) {
                  cardClass = "bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-md border border-indigo-400 relative overflow-hidden";
                  headingClass = "font-display font-black text-white text-sm md:text-base flex items-center gap-2 mb-2 m-0";
                  pClass = "text-xs md:text-sm text-indigo-50 leading-relaxed font-medium m-0";
                } else if (index % 3 === 2) {
                  cardClass = "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/15 dark:to-emerald-900/10 border border-emerald-250 dark:border-emerald-900/30 p-4.5 rounded-2xl shadow-sm";
                  headingClass = "font-display font-black text-emerald-900 dark:text-emerald-400 text-sm md:text-base flex items-center gap-2 mb-1.5 m-0";
                  pClass = "text-xs md:text-sm text-emerald-800 dark:text-emerald-350 leading-relaxed font-medium m-0";
                } else {
                  cardClass = "bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm";
                  headingClass = "font-display font-black text-slate-800 dark:text-slate-200 text-sm md:text-base flex items-center gap-2 mb-1.5 m-0";
                  pClass = "text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium m-0";
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    className={cardClass}
                  >
                    <ReactMarkdown
                      components={{
                        h3: ({ node, ...props }) => <h3 className={headingClass} {...props} />,
                        p: ({ node, ...props }) => <p className={pClass} {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold opacity-100" {...props} />
                      }}
                    >
                      {parte}
                    </ReactMarkdown>
                  </motion.div>
                );
              })
            )}
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