/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { calcularBadges } from "../utils/badges";
import { Atividade } from "../types";
import { apiAluno } from "@/src/services/api";

interface PerfilPublicoModalProps {
  matriculaAlvo: string;
  matriculaVisualizador: string;
  onClose: () => void;
}

export default function PerfilPublicoModal({
  matriculaAlvo,
  matriculaVisualizador,
  onClose,
}: PerfilPublicoModalProps) {
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [curtindo, setCurtindo] = useState(false);

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const data = await apiAluno.buscarPerfilPublico(
          matriculaVisualizador,
          matriculaAlvo,
        );

        if (data.status === "sucesso") {
          setPerfil(data.perfil);
        }
      } catch (e) {
        console.error("Erro ao buscar perfil público");
      } finally {
        setCarregando(false);
      }
    };
    buscarPerfil();
  }, [matriculaAlvo, matriculaVisualizador]);

  const handleCurtir = async () => {
    if (curtindo || perfil.jaCurtiuHoje) return;
    setCurtindo(true);

    setPerfil({
      ...perfil,
      totalCurtidas: perfil.totalCurtidas + 1,
      jaCurtiuHoje: true,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#ec4899", "#f43f5e", "#ffffff"],
    });

    try {
      await apiAluno.curtirPerfil(matriculaVisualizador, matriculaAlvo);
    } catch (e) {
    } finally {
      setCurtindo(false);
    }
  };

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pink-500"></div>
      </div>
    );
  }

  if (!perfil) return null;

  // Avatar sempre será o emoji correto escolhido pelo aluno
  const avatar =
    perfil.avatar && perfil.avatar !== "avatar-padrao" ? perfil.avatar : "👨‍💻";

  const dummyAtivs = Array.from({ length: 300 }).map((_, i) => ({
    id: `DUMMY-${i}`,
    status: "Avaliado",
    xpGanho: 10,
    statusPrazo: "No Prazo",
  })) as Atividade[];

  const catalogoBadges = calcularBadges({
    atividades: dummyAtivs,
    xpTotal: 999999,
    xpDoado: 999999,
    xpRecebido: 999999,
    totalCheckins: 99999,
    whatsappConfirmado: true,
    aniversarioResgatado: true,
    totalCurtidas: 999999,
  });

  // ===== SISTEMA DE PLACAS VIP (BASEADO NO BD CORRETO) =====
  const badgesDoAluno = perfil.badges || [];

  // Busca se o aluno tem a placa na aba entregas
  const isOuro = badgesDoAluno.some((b: string) => b.includes("Elite Ouro"));
  const isPrata = badgesDoAluno.some((b: string) => b.includes("Elite Prata"));
  const isBronze = badgesDoAluno.some((b: string) =>
    b.includes("Elite Bronze"),
  );

  // Remove as placas VIP da lista de badges normais
  const badgesExibicao = badgesDoAluno
    .filter(
      (nome: string) =>
        !nome.includes("Elite Ouro") &&
        !nome.includes("Elite Prata") &&
        !nome.includes("Elite Bronze"),
    )
    .map((nomeBadge: string) => {
      const nomeLimpo = nomeBadge.replace(/["']/g, "").trim();
      const encontrada = catalogoBadges.find((b) => b.nome === nomeLimpo);
      return (
        encontrada || {
          id: nomeLimpo,
          nome: nomeLimpo,
          icone: "🏆",
          descricao: "Conquista especial do Trilha Tech!",
        }
      );
    });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20 relative">
        <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-6 md:p-8 relative overflow-hidden shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-3xl leading-none text-white hover:text-pink-200 transition-colors z-20"
          >
            &times;
          </button>

          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full border-4 border-white flex items-center justify-center text-6xl md:text-7xl shadow-xl backdrop-blur-sm shrink-0 transform hover:scale-105 transition-all">
              {avatar}
            </div>

            <div className="flex-1 text-center md:text-left flex flex-col justify-center">
              <h2 className="font-black text-2xl md:text-3xl text-white tracking-tight">
                {perfil.nome}
              </h2>
              <p className="text-pink-100 font-bold text-sm tracking-widest uppercase mt-1">
                {perfil.turma}
              </p>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-white font-bold text-xs backdrop-blur-sm border border-white/30 shadow-inner">
                  🏆 Nível: {perfil.nivel}
                </span>
                <span className="inline-block bg-pink-500/80 px-4 py-1.5 rounded-full text-white font-bold text-xs backdrop-blur-sm border border-pink-400 shadow-inner">
                  ❤️ {perfil.totalCurtidas} Curtidas
                </span>
                {perfil.ofensivaDias > 0 && (
                  <span className="inline-block bg-orange-500/80 px-4 py-1.5 rounded-full text-white font-bold text-xs backdrop-blur-sm border border-orange-400 shadow-inner">
                    🔥 {perfil.ofensivaDias} Dias de Ofensiva.
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 mt-4 md:mt-0 flex flex-col items-center justify-center gap-3">
              <button
                onClick={handleCurtir}
                disabled={perfil.jaCurtiuHoje || curtindo}
                className={`flex w-full justify-center items-center gap-2 px-6 py-3 rounded-full font-black shadow-lg transition-all border-2 ${perfil.jaCurtiuHoje ? "bg-pink-50 border-pink-200 text-pink-400 cursor-not-allowed" : "bg-pink-500 border-pink-400 text-white hover:bg-pink-600 hover:scale-105 active:scale-95"}`}
              >
                <span
                  className={`text-xl ${perfil.jaCurtiuHoje ? "" : "animate-pulse"}`}
                >
                  ❤️
                </span>
                {perfil.jaCurtiuHoje ? "Você curtiu hoje!" : "Deixar um Like!"}
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("abrirPixRequest", {
                      detail: perfil.matricula,
                    }),
                  );
                  onClose();
                }}
                className="flex w-full justify-center items-center gap-2 px-6 py-3 rounded-full font-black shadow-lg transition-all border-2 bg-gradient-to-r from-emerald-400 to-teal-500 border-emerald-300 text-white hover:from-emerald-500 hover:to-teal-600 hover:scale-105 active:scale-95"
              >
                <span className="text-xl">💸</span>
                Enviar Pix de XP
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
          {/* SESSÃO VIP: PLACAS DE ELITE MENSAL */}
          {(isOuro || isPrata || isBronze) && (
            <div className="mb-8 animate-in zoom-in duration-500">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                Hall da Fama - Conquistas de Elite
              </h3>

              <div className="flex flex-col gap-4">
                {isOuro && (
                  <div
                    className="relative overflow-hidden rounded-2xl border-2 border-yellow-400 shadow-[0_10px_20px_rgba(234,179,8,0.4)] transform hover:scale-105 transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    <div className="p-4 flex items-center gap-4 relative z-10 bg-white/20 backdrop-blur-sm">
                      <div className="text-5xl drop-shadow-lg">👑</div>
                      <div className="flex-1">
                        <h4 className="font-black text-yellow-900 text-xl tracking-wider uppercase drop-shadow-sm">
                          Top 1 Geral
                        </h4>
                        <p className="text-yellow-800 font-bold text-xs uppercase tracking-widest">
                          Campeão do Mês
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-yellow-900/80 text-yellow-100 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest border border-yellow-700/50">
                          Elite Ouro
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isPrata && (
                  <div
                    className="relative overflow-hidden rounded-2xl border-2 border-slate-400 shadow-[0_10px_20px_rgba(148,163,184,0.4)] transform hover:scale-105 transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, #8e9eab, #eef2f3, #8e9eab)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-40 transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    <div className="p-4 flex items-center gap-4 relative z-10 bg-white/20 backdrop-blur-sm">
                      <div className="text-5xl drop-shadow-lg">🥈</div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-xl tracking-wider uppercase drop-shadow-sm">
                          Top 2 Geral
                        </h4>
                        <p className="text-slate-700 font-bold text-xs uppercase tracking-widest">
                          Vice-Campeão do Mês
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-slate-800 text-slate-100 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest border border-slate-600">
                          Elite Prata
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isBronze && (
                  <div
                    className="relative overflow-hidden rounded-2xl border-2 border-orange-500 shadow-[0_10px_20px_rgba(249,115,22,0.4)] transform hover:scale-105 transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, #cd7f32, #ffdab9, #b87333)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    <div className="p-4 flex items-center gap-4 relative z-10 bg-white/20 backdrop-blur-sm">
                      <div className="text-5xl drop-shadow-lg">🥉</div>
                      <div className="flex-1">
                        <h4 className="font-black text-orange-950 text-xl tracking-wider uppercase drop-shadow-sm">
                          Top 3 Geral
                        </h4>
                        <p className="text-orange-900 font-bold text-xs uppercase tracking-widest">
                          Destaque do Mês
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-orange-900/80 text-orange-100 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest border border-orange-700/50">
                          Elite Bronze
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">⭐</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                XP Total
              </p>
              <p className="text-xl md:text-2xl font-black text-emerald-600">
                {perfil.xpTotal}
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Missões Feitas
              </p>
              <p className="text-xl md:text-2xl font-black text-blue-600">
                {perfil.missoesConcluidas}
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">💸</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Pix Enviado
              </p>
              <p className="text-xl md:text-2xl font-black text-amber-500">
                {perfil.pixEnviado}
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">🤝</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Pix Recebido
              </p>
              <p className="text-xl md:text-2xl font-black text-indigo-500">
                {perfil.pixRecebido}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
              Conquistas Regulares
            </h3>
            {badgesExibicao.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl opacity-40 mb-2 block">📭</span>
                <p className="text-sm text-slate-500 font-medium">
                  Este aluno não tem outras conquistas exibíveis.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badgesExibicao.map((badge: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="bg-white p-2 rounded-lg text-2xl shadow-sm border border-amber-100 shrink-0">
                      {badge.icone}
                    </div>
                    <div>
                      <h4 className="font-black text-amber-900 text-sm leading-tight">
                        {badge.nome}
                      </h4>
                      <p className="text-[10px] font-bold text-amber-700/80 mt-0.5 line-clamp-2">
                        {badge.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
