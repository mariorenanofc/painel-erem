/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderProps } from "../types";
import { useState, useEffect } from "react";

export default function Header({
  carregando,
  nomeUsuario,
  onLogout,
}: HeaderProps) {
  // Lemos a URL atual da página
  const pathname = usePathname();

  // Verifica se NÃO ESTÁ na página inicial
  const destinoLink = pathname !== "/" ? "/" : "/trilhatech";
  const textoLink = pathname !== "/" ? "Página Inicial" : "Painel Gestão";
  const iconeLink = pathname !== "/" ? "🏠" : "⚙️";

  // 🔥 ESTADO DO TEMA (Light / Dark)
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
    <header className="glass-panel text-slate-800 dark:text-white p-4 rounded-2xl shadow-xl flex justify-between items-center mb-6 transition-colors duration-300 border border-slate-200 dark:border-white/10 relative z-20">
      {/* LOGO E TÍTULO CLICÁVEIS */}
      <Link
        href={destinoLink}
        className="flex items-center gap-3 hover:opacity-85 transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-300">
          🎓
        </div>
        <div>
          <h1 className="font-display font-black text-lg leading-none tracking-tight text-slate-800 dark:text-white dark:text-neon-glow">
            Portal Educacional
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Plataforma Gamificada
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {carregando && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary opacity-70"></div>
        )}

        {nomeUsuario && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                Conectado como
              </p>
              <p className="font-bold text-sm text-slate-850 dark:text-slate-100">{nomeUsuario}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* 🔥 BOTÃO TOGGLE DE TEMA */}
              <button
                onClick={toggleTema}
                className="cursor-pointer bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-yellow-500/30 dark:hover:border-yellow-400/30 text-slate-700 dark:text-white p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10 active:scale-95"
                title={
                  tema === "light"
                    ? "Mudar para Modo Escuro"
                    : "Mudar para Modo Claro"
                }
              >
                <span className="text-lg leading-none">
                  {tema === "light" ? "🌙" : "☀️"}
                </span>
              </button>

              {/* BOTÃO DINÂMICO (Muda dependendo da página) */}
              <Link
                href={destinoLink}
                className="cursor-pointer bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-brand-primary/80 border border-slate-200 dark:border-white/5 hover:border-brand-primary/30 text-slate-700 dark:text-white p-2 rounded-xl transition-all flex items-center gap-2 active:scale-95"
                title={textoLink}
              >
                <span className="text-sm hidden sm:block font-bold pl-1">
                  {textoLink}
                </span>
                <span className="text-lg leading-none">{iconeLink}</span>
              </Link>

              {/* BOTÃO DE SAIR */}
              {onLogout && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onLogout();
                  }}
                  className="cursor-pointer bg-slate-100 dark:bg-slate-955/60 dark:bg-slate-950/60 hover:bg-red-500/10 dark:hover:bg-red-500/80 border border-slate-200 dark:border-white/5 hover:border-red-500/30 text-red-600 dark:text-white p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10 active:scale-95"
                  title="Sair do Sistema"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
