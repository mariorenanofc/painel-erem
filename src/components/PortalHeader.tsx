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
    <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-40">
      {/* 🔥 A MÁGICA AQUI: Mudamos de max-w-5xl para max-w-[1536px] e adicionamos px-4 lg:px-8 */}
      <div className="max-w-[1536px] w-full px-4 lg:px-8 mx-auto flex justify-between items-center relative transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-md">🚀</span>
          <div>
            <h1 className="font-black text-lg leading-tight tracking-tight">
              {nomeProjeto}
            </h1>
            <p className="text-blue-300 text-[10px] font-mono uppercase tracking-widest">
              {matricula}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotificacoes}
              className="relative p-2 text-blue-200 hover:text-white transition-colors"
            >
              <span className="text-2xl">🔔</span>
              {notificacoesNaoLidas > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black items-center justify-center text-white border-2 border-blue-900">
                    {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                  </span>
                </span>
              )}
            </button>

            {notificacoesAbertas && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-sm">
                    Notificações
                  </h3>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Últimas {notificacoes.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-6">
                      Nenhuma novidade por aqui.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notificacoes.map((notif) => {
                        let iconeNotif = "💸";
                        let corBg = "bg-emerald-100";
                        let corTexto = "text-emerald-600";

                        if (notif.tipo === "LIKE") {
                          iconeNotif = "❤️";
                          corBg = "bg-pink-100";
                          corTexto = "text-pink-600";
                        } else if (notif.tipo === "DEVOLVIDA") {
                          iconeNotif = "⚠️";
                          corBg = "bg-red-100";
                          corTexto = "text-red-600";
                        } else if (notif.tipo === "AVALIADA") {
                          iconeNotif = "⭐";
                          corBg = "bg-amber-100";
                          corTexto = "text-amber-600";
                        }

                        return (
                          <div
                            key={notif.id}
                            className="p-3 hover:bg-slate-50 transition-colors flex gap-3 items-start"
                          >
                            <div
                              className={`${corBg} p-2 rounded-full shrink-0 text-sm ${corTexto}`}
                            >
                              {iconeNotif}
                            </div>
                            <div>
                              <p className="text-xs text-slate-700 leading-tight">
                                {notif.mensagem}
                              </p>
                              {notif.xp > 0 && (
                                <p className="text-[10px] text-slate-400 mt-1 font-bold">
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
              className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 p-1.5 pr-3 rounded-full transition-colors border border-blue-700/50"
            >
              <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-black h-8 w-8 rounded-full flex items-center justify-center shadow-inner">
                {primeiroNome.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-tight">
                  {primeiroNome}
                </p>
                <p className="text-[9px] text-blue-300 font-medium truncate w-20">
                  {turma}
                </p>
              </div>
              <span className="text-xs text-blue-300 ml-1">▼</span>
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      onAbrirPerfil();
                      setMenuAberto(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 font-medium hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>👤</span> Meu Perfil
                  </button>
                  <button
                    onClick={() => {
                      onAbrirRanking();
                      setMenuAberto(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 font-medium hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>🏆</span> Leaderboard
                  </button>
                  <button
                    onClick={() => {
                      onAbrirFrequencia();
                      setMenuAberto(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 font-medium hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>📊</span> Frequência
                  </button>
                </div>
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
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
