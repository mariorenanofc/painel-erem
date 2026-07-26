"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrilhaTechLoader() {
  const [statusIndex, setStatusIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const statusLogs = [
    "Iniciando conexão segura...",
    "Buscando credenciais do Google Sheets...",
    "Sincronizando perfil e XP do aluno...",
    "Carregando missões e desafios do banco...",
    "Calculando ranking da turma...",
    "Pronto! Acessando portal..."
  ];

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev < statusLogs.length - 1 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden select-none transition-colors duration-300">
      
      {/* Background glowing cyber orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[80px] pointer-events-none animate-pulse" />

      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        
        {/* Animated Rocket & Orbit */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-indigo-500/20 dark:border-indigo-500/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-2 border border-dotted border-cyan-500/15 dark:border-cyan-500/20 rounded-full"
          />
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="text-5xl relative z-10"
          >
            🚀
          </motion.span>
        </div>

        {/* Loading text with glowing liquid gradient fill */}
        <div className="mb-2">
          <h1 className="text-4xl font-display font-black tracking-wider uppercase text-loading-fill select-none filter drop-shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            Trilha Tech
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-6">
          Escola de Programação Web
        </p>

        {/* Custom loading bar with rocket flying */}
        <div className="relative w-64 h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden mb-6 border border-slate-300/40 dark:border-white/5">
          {/* Active filler bar */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.2, ease: "easeInOut", repeat: Infinity }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full"
          />
        </div>

        {/* Terminal Compilation Logs */}
        <div className="bg-slate-100/90 dark:bg-slate-950/40 dark:bg-slate-950/50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800/80 rounded-xl p-4 w-72 text-left font-mono text-[10px] text-slate-600 dark:text-slate-400 min-h-[75px] shadow-lg relative overflow-hidden backdrop-blur-sm transition-all duration-300">
          <div className="absolute top-2 right-3 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-500/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500/60" />
          </div>
          
          <div className="text-slate-400 dark:text-slate-500 mb-1 flex justify-between">
            <span>Terminal Core v1.2</span>
            <span className="animate-pulse text-indigo-600 dark:text-green-500 font-bold">● RUNNING</span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={statusIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="text-indigo-600 dark:text-cyan-400 font-bold dark:font-semibold"
            >
              <span className="text-slate-400 dark:text-slate-600 font-bold">&gt;</span> {statusLogs[statusIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
