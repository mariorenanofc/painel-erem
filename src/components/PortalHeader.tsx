/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useRef, useEffect } from "react";
import { PortalHeaderProps } from "../types";

export default function PortalHeader({
  matricula,
  nomeAluno,
  turma,
  nomeProjeto = "Portal Educacional",
  notificacoes,
  onAbrirRanking,
  onAbrirFrequencia,
  onAbrirPerfil,
  onLogout,
}: PortalHeaderProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [ultimoVisto, setUltimoVisto] = useState<number>(0);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setMenuAberto(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node))
        setNotificacoesAbertas(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const salvo = localStorage.getItem(`notif_vistas_${matricula}`);
    if (salvo) setUltimoVisto(Number(salvo));
  }, [matricula]);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const primeiroNome = nomeAluno.split(" ")[0];
  const notificacoesNaoLidas = notificacoes.filter(
    (n) => n.tempo > ultimoVisto,
  ).length;

  const toggleNotificacoes = () => {
    const abrindo = !notificacoesAbertas;
    setNotificacoesAbertas(abrindo);
    setMenuAberto(false);

    if (abrindo && notificacoes.length > 0) {
      const maisRecente = notificacoes[0].tempo;
      setUltimoVisto(maisRecente);
      localStorage.setItem(`notif_vistas_${matricula}`, maisRecente.toString());
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-950/70 backdrop-blur-md text-slate-800 dark:text-white p-4 shadow-lg sticky top-0 z-40 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-[1536px] w-full px-4 lg:px-8 mx-auto flex justify-between items-center relative transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-md">🚀</span>
          <div>
            <h1 className="font-display font-black text-lg leading-tight tracking-tight text-slate-800 dark:text-white dark:text-neon-glow">
              {nomeProjeto}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-widest transition-colors duration-300">
              {matricula}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="cursor-pointer p-2 text-slate-600 dark:text-slate-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60"
            title={
              isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"
            }
          >
            <span className="text-xl leading-none block">
              {isDarkMode ? "☀️" : "🌙"}
            </span>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotificacoes}
              className="cursor-pointer relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <span className="text-2xl leading-none block">🔔</span>
              {notificacoesNaoLidas > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black items-center justify-center text-white border-2 border-white dark:border-slate-900">
                    {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                  </span>
                </span>
              )}
            </button>

            {notificacoesAbertas && (
              <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 transition-colors duration-300">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center transition-colors duration-300">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    Notificações
                  </h3>
                  <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-brand-secondary text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/30">
                    Últimas {notificacoes.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">
                      Nenhuma novidade por aqui.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {notificacoes.map((notif) => {
                        let iconeNotif = "💸";
                        let corBg = "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/20";
                        let corTexto = "text-emerald-600 dark:text-emerald-400";

                        if (notif.tipo === "LIKE") {
                          iconeNotif = "❤️";
                          corBg = "bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/20";
                          corTexto = "text-pink-600 dark:text-pink-400";
                        } else if (notif.tipo === "DEVOLVIDA") {
                          iconeNotif = "⚠️";
                          corBg = "bg-red-50 dark:bg-red-955/40 border border-red-200 dark:border-red-900/20";
                          corTexto = "text-red-600 dark:text-red-400";
                        } else if (notif.tipo === "AVALIADA") {
                          iconeNotif = "⭐";
                          corBg = "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/20";
                          corTexto = "text-amber-600 dark:text-amber-400";
                        }

                        return (
                          <div
                            key={notif.id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex gap-3 items-start"
                          >
                            <div
                              className={`${corBg} p-2 rounded-full shrink-0 text-sm ${corTexto} transition-colors`}
                            >
                              {iconeNotif}
                            </div>
                            <div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                                {notif.mensagem}
                              </p>
                              {notif.xp > 0 && (
                                <p className="text-[10px] text-brand-secondary mt-1 font-bold">
                                  +{notif.xp} XP creditados
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setMenuAberto(!menuAberto);
                setNotificacoesAbertas(false);
              }}
              className="cursor-pointer flex items-center gap-2 bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-900/60 p-1.5 pr-3 rounded-full transition-colors border border-slate-200 dark:border-white/5 text-slate-700 dark:text-white"
            >
              <div className="bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-black h-8 w-8 rounded-full flex items-center justify-center shadow-inner">
                {primeiroNome.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-tight text-slate-800 dark:text-white">
                  {primeiroNome}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate w-20 transition-colors">
                  {turma}
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                ▼
              </span>
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 transition-colors duration-300">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      onAbrirPerfil();
                      setMenuAberto(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>👤</span> Meu Perfil
                  </button>
                  <button
                    onClick={() => {
                      onAbrirRanking();
                      setMenuAberto(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>🏆</span> Ranking
                  </button>
                  <button
                    onClick={() => {
                      onAbrirFrequencia();
                      setMenuAberto(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>📊</span> Frequência
                  </button>
                </div>
                <div className="border-t border-slate-100 dark:border-white/5 p-2 transition-colors duration-300">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onLogout();
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2.5 text-sm text-red-500 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>🚪</span> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
