/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderProps } from "../types";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Header({
  carregando,
  nomeUsuario,
  onLogout,
}: HeaderProps) {
  const pathname = usePathname();

  const destinoLink = pathname !== "/" ? "/" : "/trilhatech";
  const textoLink = pathname !== "/" ? "Página Inicial" : "Painel Gestão";
  const iconeLink = pathname !== "/" ? "🏠" : "⚙️";

  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const temaSalvo = localStorage.getItem("temaPortal");
    if (
      temaSalvo === "dark" ||
      (!temaSalvo && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTema("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTema("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTema = () => {
    if (tema === "light") {
      setTema("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("temaPortal", "dark");
    } else {
      setTema("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("temaPortal", "light");
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/40 p-4.5 rounded-[2rem] shadow-lg flex justify-between items-center mb-8 border border-slate-200/60 dark:border-white/5 relative z-20 backdrop-blur-md">
      {/* LOGO E TÍTULO CLICÁVEIS */}
      <Link
        href={destinoLink}
        className="flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-300 relative">
          <div className="absolute inset-0 bg-white/10 rounded-2xl" />
          🎓
        </div>
        <div>
          <h1 className="font-display font-black text-base leading-none tracking-tight text-slate-800 dark:text-white">
            Portal Educacional
          </h1>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">
            Plataforma Gamificada
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {carregando && (
          <div className="relative w-5 h-5 opacity-70">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-primary animate-spin" />
          </div>
        )}

        {nomeUsuario && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">
                Conectado como
              </p>
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{nomeUsuario}</p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* TEMA TOGGLE BUTTON */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTema}
                className="cursor-pointer bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-yellow-500/30 text-slate-700 dark:text-white p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10 shadow-sm"
                title={tema === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
              >
                <span className="text-lg leading-none select-none">
                  {tema === "light" ? "🌙" : "☀️"}
                </span>
              </motion.button>

              {/* DYNAMIC ACTION BUTTON */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={destinoLink}
                  className="cursor-pointer bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-brand-primary/80 border border-slate-200/80 dark:border-slate-800 hover:border-brand-primary/30 text-slate-700 dark:text-white p-2 px-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm text-xs font-black uppercase tracking-wider h-10 select-none"
                  title={textoLink}
                >
                  <span className="hidden sm:block">
                    {textoLink}
                  </span>
                  <span className="text-base leading-none">{iconeLink}</span>
                </Link>
              </motion.div>

              {/* LOGOUT BUTTON */}
              {onLogout && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onLogout();
                  }}
                  className="cursor-pointer bg-slate-50 dark:bg-slate-950/60 hover:bg-rose-500/10 dark:hover:bg-red-500/80 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500/30 text-rose-600 dark:text-white p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10 shadow-sm"
                  title="Sair do Sistema"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
