/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalHeaderProps } from "../types";
import Tooltip from "./ui/Tooltip";

export default function PortalHeader({
  matricula,
  nomeAluno,
  turma,
  nomeProjeto = "Portal Educacional",
  notificacoes,
  onAbrirRanking,
  onAbrirFrequencia,
  onAbrirCalendario,
  onAbrirPerfil,
  onAbrirCertificados,
  totalCertificados = 0,
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
    <header className="bg-white/80 dark:bg-slate-900/40 sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/5 shadow-lg backdrop-blur-md transition-colors duration-300">
      <div className="max-w-[1536px] w-full px-6 lg:px-8 py-3.5 mx-auto flex justify-between items-center relative transition-all duration-300">
        
        {/* LOGO E PROJETO */}
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-md select-none">🚀</span>
          <div>
            <h1 className="font-display font-black text-base leading-tight tracking-tight text-slate-800 dark:text-white">
              {nomeProjeto}
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] font-mono font-bold mt-0.5">
              {matricula}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          
          {/* THEME BUTTON */}
          <Tooltip content={isDarkMode ? "☀️ Modo Claro" : "🌙 Modo Escuro"} position="bottom">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="cursor-pointer p-2 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-yellow-500/30 text-slate-700 dark:text-white rounded-xl transition-all flex items-center justify-center w-10 h-10 shadow-sm"
              aria-label="Alternar tema"
            >
              <span className="text-lg leading-none block select-none">
                {isDarkMode ? "☀️" : "🌙"}
              </span>
            </motion.button>
          </Tooltip>

          {/* CALENDAR QUICK BUTTON */}
          {onAbrirCalendario && (
            <Tooltip content="📅 Calendário & Prazos" position="bottom">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAbrirCalendario}
                className="cursor-pointer p-2 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all flex items-center justify-center w-10 h-10 shadow-sm"
                aria-label="Abrir calendário"
              >
                <span className="text-lg leading-none block select-none">📅</span>
              </motion.button>
            </Tooltip>
          )}

          {/* NOTIFICATION CONTROLLER */}
          <div className="relative" ref={notifRef}>
            <Tooltip content={notificacoesNaoLidas > 0 ? `🔔 ${notificacoesNaoLidas} novidade(s)` : "🔔 Notificações"} position="bottom">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleNotificacoes}
                className="cursor-pointer relative p-2 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-white rounded-xl transition-all flex items-center justify-center w-10 h-10 shadow-sm"
                aria-label="Notificações"
              >
              <span className="text-lg leading-none block select-none">🔔</span>
              {notificacoesNaoLidas > 0 && (
                <span className="absolute top-[-2px] right-[-2px] flex h-4.5 w-4.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-red-500 text-[9px] font-black items-center justify-center text-white border-2 border-white dark:border-slate-900">
                    {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                  </span>
                </span>
              )}
            </motion.button>
          </Tooltip>

            <AnimatePresence>
              {notificacoesAbertas && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/5 overflow-hidden z-50"
                >
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-display font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                      Notificações
                    </h3>
                    <span className="bg-indigo-50 dark:bg-indigo-955/35 text-indigo-650 dark:text-brand-secondary text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border border-indigo-200/30 dark:border-indigo-900/10">
                      Últimas {notificacoes.length}
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
                    {notificacoes.length === 0 ? (
                      <p className="text-center text-slate-400 dark:text-slate-500 text-xs py-8 font-semibold italic">
                        Nenhuma novidade por aqui.
                      </p>
                    ) : (
                      notificacoes.map((notif) => {
                        let iconeNotif = "💸";
                        let corBg = "bg-emerald-500/10 border-emerald-500/20";
                        let corTexto = "text-emerald-600 dark:text-emerald-400";

                        if (notif.tipo === "LIKE") {
                          iconeNotif = "❤️";
                          corBg = "bg-pink-500/10 border-pink-500/20";
                          corTexto = "text-pink-600 dark:text-pink-400";
                        } else if (notif.tipo === "DEVOLVIDA") {
                          iconeNotif = "⚠️";
                          corBg = "bg-red-500/10 border-red-500/20";
                          corTexto = "text-red-650 dark:text-red-400";
                        } else if (notif.tipo === "AVALIADA") {
                          iconeNotif = "⭐";
                          corBg = "bg-amber-500/10 border-amber-500/20";
                          corTexto = "text-amber-600 dark:text-amber-450";
                        }

                        return (
                          <div
                            key={notif.id}
                            className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors flex gap-3 items-start text-left"
                          >
                            <div className={`p-2 rounded-xl shrink-0 text-sm ${corBg} border ${corTexto} flex items-center justify-center`}>
                              {iconeNotif}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal font-semibold">
                                {notif.mensagem}
                              </p>
                              {notif.xp > 0 && (
                                <p className="text-[10px] text-brand-secondary mt-1 font-black uppercase tracking-wider font-mono">
                                  +{notif.xp} XP creditados
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PROFILE CONTROL */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setMenuAberto(!menuAberto);
                setNotificacoesAbertas(false);
              }}
              className="cursor-pointer flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 pr-3.5 rounded-full transition-colors text-slate-700 dark:text-white shadow-sm"
            >
              <div className="bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-black h-8 w-8 rounded-full flex items-center justify-center shadow-inner relative select-none">
                <div className="absolute inset-0 bg-white/10 rounded-full" />
                {primeiroNome.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black leading-tight text-slate-800 dark:text-white">
                  {primeiroNome}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold truncate w-20 mt-0.5">
                  {turma}
                </p>
              </div>
              <span className="text-slate-400 font-bold text-[9px] ml-1">
                ▼
              </span>
            </motion.button>

            <AnimatePresence>
              {menuAberto && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="absolute right-0 mt-3 w-80 sm:w-84 bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden z-50 select-none transition-colors duration-300"
                >
                  {/* CABEÇALHO DO POPOVER COM IDENTIDADE DO ALUNO */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-white dark:from-indigo-950/60 dark:via-slate-900/80 dark:to-slate-950 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white font-black flex items-center justify-center text-xl shadow-inner shrink-0 relative">
                      <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                      {primeiroNome.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">
                        {nomeAluno}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                        Matrícula: {matricula}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-secondary text-[10px] font-bold border border-brand-primary/20 dark:border-brand-primary/30">
                          {turma}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CORPO DO MENU DIVIDIDO EM SEÇÕES */}
                  <div className="p-3 space-y-3">
                    {/* SEÇÃO 1: JORNADA & CONQUISTAS */}
                    <div>
                      <p className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Sua Jornada
                      </p>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            onAbrirPerfil();
                            setMenuAberto(false);
                          }}
                          className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                            👤
                          </span>
                          <span className="flex-1">Meu Perfil Completo</span>
                        </button>

                        <button
                          onClick={() => {
                            onAbrirRanking();
                            setMenuAberto(false);
                          }}
                          className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                            🏆
                          </span>
                          <span className="flex-1">Ranking Geral</span>
                        </button>

                        {onAbrirCertificados && (
                          <button
                            onClick={() => {
                              onAbrirCertificados();
                              setMenuAberto(false);
                            }}
                            className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold bg-emerald-50/60 dark:bg-emerald-500/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/20 rounded-xl transition-all flex items-center justify-between group border border-emerald-200 dark:border-emerald-500/20"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                                📜
                              </span>
                              <span>Certificados Oficiais PFT</span>
                            </div>
                            {totalCertificados > 0 && (
                              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black font-mono shadow-sm">
                                {totalCertificados}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SEÇÃO 2: SALA DE AULA & EXPLORAÇÃO */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                      <p className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Sala & Exploração
                      </p>
                      <div className="space-y-1">
                        {onAbrirCalendario && (
                          <button
                            onClick={() => {
                              onAbrirCalendario();
                              setMenuAberto(false);
                            }}
                            className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all flex items-center gap-3 group"
                          >
                            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                              📅
                            </span>
                            <span className="flex-1">Calendário & Prazos</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onAbrirFrequencia();
                            setMenuAberto(false);
                          }}
                          className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                            📊
                          </span>
                          <span className="flex-1">Frequência Escolar</span>
                        </button>

                        <button
                          onClick={() => {
                            window.location.href = "/hall-da-fama";
                          }}
                          className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-bold hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                            🏛️
                          </span>
                          <span className="flex-1">Hall da Fama</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RODAPÉ DO MENU COM LOGOUT */}
                  <div className="p-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onLogout();
                      }}
                      className="cursor-pointer w-full text-left px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-3 group"
                    >
                      <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                        🚪
                      </span>
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
