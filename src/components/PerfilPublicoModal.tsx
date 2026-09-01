"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { calcularBadges } from "../utils/badges";
import { Atividade, PerfilPublicoModalProps, PerfilPublico } from "../types";
import { apiAluno } from "@/src/services/api";

export default function PerfilPublicoModal({
  matriculaAlvo,
  matriculaVisualizador,
  onClose,
}: PerfilPublicoModalProps) {
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
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
    if (curtindo || !perfil || perfil.jaCurtiuHoje) return;
    setCurtindo(true);

    setPerfil(prev => prev ? {
      ...prev,
      matricula: prev.matricula || "",
      totalCurtidas: prev.totalCurtidas + 1,
      jaCurtiuHoje: true,
    } : null);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#ec4899", "#f43f5e", "#ffffff"],
    });

    try {
      await apiAluno.curtirPerfil(matriculaVisualizador, matriculaAlvo);
    } catch (e) {
      // handled
    } finally {
      setCurtindo(false);
    }
  };

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-110 p-4">
        <div className="flex flex-col items-center justify-center p-8 gap-4 bg-white/75 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-3xl shadow-2xl backdrop-blur-md w-72 text-center select-none animate-in scale-in duration-200">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Scanning radar pulses */}
            <motion.span
              animate={{ scale: [1, 2], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className="absolute w-full h-full border border-pink-500/50 rounded-full"
            />
            <motion.span
              animate={{ scale: [1, 2], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.55 }}
              className="absolute w-full h-full border border-purple-500/50 rounded-full"
            />
            {/* Central pulsating avatar placeholder */}
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-4xl relative z-10"
            >
              👤
            </motion.span>
          </div>
          <p className="text-[11px] font-bold text-pink-600 dark:text-pink-400 animate-pulse tracking-widest uppercase mt-1">
            Escaneando Perfil...
          </p>
        </div>
      </div>
    );
  }

  if (!perfil) return null;

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

  const badgesDoAluno = perfil.badges || [];
  const isOuro = badgesDoAluno.some((b: string) => b.includes("Elite Ouro"));
  const isPrata = badgesDoAluno.some((b: string) => b.includes("Elite Prata"));
  const isBronze = badgesDoAluno.some((b: string) =>
    b.includes("Elite Bronze"),
  );

  const badgesExibicao = badgesDoAluno
    .filter(
      (nome: string) =>
        !nome.includes("Elite Ouro") &&
        !nome.includes("Elite Prata") &&
        !nome.includes("Elite Bronze"),
    )
    .filter((nome: string) => !nome.startsWith("VIP-") && !nome.startsWith("BADGE-VIP-"))
    .map((nomeBadge: string) => {
      const nomeLimpo = nomeBadge.replace(/["']/g, "").trim();
      const encontrada = catalogoBadges.find((b) => b.id === nomeLimpo);
      return (
        encontrada || {
          id: nomeLimpo,
          nome: "✨ Conquista Especial",
          icone: "🌟",
          descricao: "Prêmio Exclusivo da Trilha Tech!",
        }
      );
    });

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-110 p-2 md:p-4 animate-in fade-in duration-200 transition-colors">
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel-heavy w-full md:max-w-4xl lg:max-w-5xl max-h-[92vh] rounded-3xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] relative transition-colors duration-300"
      >
        {/* FIXED CLOSE BUTTON AT THE TOP RIGHT */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 text-3xl leading-none text-white hover:text-pink-200 transition-colors z-30 drop-shadow-md"
        >
          &times;
        </motion.button>

        {/* SCROLLABLE INNER WRAPPER FOR BOTH BANNER AND COLUMNS */}
        <div className="overflow-y-auto flex-1 transition-colors duration-300 custom-scrollbar select-none bg-slate-50/40 dark:bg-slate-900/20">
          
          {/* BANNER / HEADER COM GRADIENTE */}
          <div className={`p-6 md:p-8 relative overflow-hidden transition-colors duration-300 ${
            isOuro
              ? "bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.15)]"
              : isPrata
              ? "bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)]"
              : isBronze
              ? "bg-gradient-to-r from-orange-550 via-amber-600 to-orange-500 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.15)]"
              : "bg-gradient-to-r from-indigo-650 via-purple-650 to-pink-650 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-900"
          }`}>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            {/* Height spacer inside the banner to set its volume */}
            <div className="h-20 md:h-28" />
          </div>

          {/* GRID COLUMNS CONTAINER */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start relative -mt-16 md:-mt-24 z-10">
              
              {/* COLUNA ESQUERDA: AVATAR CARD & AÇÕES */}
              <div className="md:col-span-1 flex flex-col items-center">
                
                <div className="glass-panel w-full p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center text-center shadow-lg bg-white/80 dark:bg-slate-950/60 backdrop-blur-md">
                  
                  {/* Profile Large Avatar */}
                  <div className={`w-24 h-24 md:w-28 md:h-28 bg-white/90 dark:bg-slate-900/90 rounded-2xl flex items-center justify-center text-5xl md:text-6xl shadow-md shrink-0 mb-4 transform hover:scale-105 transition-all duration-300 ${
                    isOuro
                      ? "border-4 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse"
                      : isPrata
                      ? "border-4 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]"
                      : isBronze
                      ? "border-4 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                      : "border-2 border-slate-200 dark:border-slate-800"
                  }`}>
                    {avatar}
                  </div>

                  <h2 className="font-display font-black text-xl md:text-2xl text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-1">
                    {perfil.nome}
                  </h2>
                  
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    🏫 {perfil.turma}
                  </p>

                  {/* Patent Highlight Tag */}
                  {isOuro && (
                    <span className="inline-block bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-yellow-400 mb-3">
                      👑 Elite Ouro (Top 1)
                    </span>
                  )}
                  {isPrata && (
                    <span className="inline-block bg-gradient-to-r from-slate-400 to-slate-300 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-slate-300 mb-3">
                      🥈 Elite Prata (Top 2)
                    </span>
                  )}
                  {isBronze && (
                    <span className="inline-block bg-gradient-to-r from-orange-400 to-amber-600 text-orange-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-orange-400 mb-3">
                      🥉 Elite Bronze (Top 3)
                    </span>
                  )}

                  <div className="w-full space-y-2.5 mt-2">
                    <span className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs shadow-inner">
                      🏆 Nível: {perfil.nivel}
                    </span>
                    
                    <span className="flex items-center justify-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-4 py-2 rounded-xl text-pink-600 dark:text-pink-400 font-bold text-xs shadow-inner">
                      ❤️ {perfil.totalCurtidas} Curtidas
                    </span>
                    
                    {perfil.ofensivaDias > 0 && (
                      <span className="flex items-center justify-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl text-orange-600 dark:text-orange-400 font-bold text-xs shadow-inner">
                        🔥 {perfil.ofensivaDias} Dias Ofensiva
                      </span>
                    )}
                  </div>

                  {/* BOTÕES DE INTERAÇÃO SOCIAL */}
                  <div className="w-full space-y-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/60">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCurtir}
                      disabled={perfil.jaCurtiuHoje || curtindo}
                      className={`cursor-pointer flex w-full justify-center items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all border ${
                        perfil.jaCurtiuHoje
                          ? "bg-pink-50 dark:bg-pink-955/20 border-pink-200 dark:border-pink-900/40 text-pink-400 dark:text-pink-600 cursor-not-allowed"
                          : "bg-pink-500 hover:bg-pink-600 border-pink-400 text-white shadow-pink-500/10 hover:shadow-pink-500/20"
                      }`}
                    >
                      <span className={perfil.jaCurtiuHoje ? "" : "animate-pulse"}>❤️</span>
                      {perfil.jaCurtiuHoje ? "Você curtiu hoje!" : "Deixar um Like!"}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("abrirPixRequest", {
                            detail: perfil.matricula,
                          }),
                        );
                        onClose();
                      }}
                      className="cursor-pointer flex w-full justify-center items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all border bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white shadow-emerald-500/10 hover:shadow-emerald-500/20"
                    >
                      <span>💸</span> Enviar Pix de XP
                    </motion.button>
                  </div>

                </div>

              </div>

              {/* COLUNA DIREITA: HALL DA FAMA, STATS & BADGES */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Hall da Fama - Conquistas de Elite */}
                {(isOuro || isPrata || isBronze) && (
                  <div className="animate-in zoom-in-95 duration-500 bg-white/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-sm">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3.5 transition-colors">
                      🥇 Hall da Fama • Conquistas de Elite
                    </h3>

                    <div className="flex flex-col gap-3.5">
                      {isOuro && (
                        <div
                          className="relative overflow-hidden rounded-2xl border-2 border-yellow-400 shadow-[0_10px_20px_rgba(234,179,8,0.4)] transform hover:scale-[1.01] transition-all duration-300"
                          style={{
                            background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)",
                          }}
                        >
                          <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                          <div className="p-4 flex items-center gap-4 relative z-10 bg-white/20 backdrop-blur-sm">
                            <div className="text-4xl drop-shadow-lg font-bold">👑</div>
                            <div className="flex-1">
                              <h4 className="font-display font-black text-yellow-900 text-base tracking-wider uppercase drop-shadow-sm">
                                Top 1 Geral
                              </h4>
                              <p className="text-yellow-850 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                                Campeão do Mês do Trilha Tech
                              </p>
                            </div>
                            <div className="text-right font-black">
                              <span className="bg-yellow-900/80 text-yellow-100 text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest border border-yellow-700/50">
                                Elite Ouro
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {isPrata && (
                        <div
                          className="relative overflow-hidden rounded-2xl border-2 border-slate-400 shadow-[0_10px_20px_rgba(148,163,184,0.3)] transform hover:scale-[1.01] transition-all duration-300"
                          style={{
                            background: "linear-gradient(135deg, #8e9eab, #eef2f3, #8e9eab)",
                          }}
                        >
                          <div className="absolute inset-0 bg-white opacity-40 transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                          <div className="p-4 flex items-center gap-4 relative z-10 bg-white/20 backdrop-blur-sm">
                            <div className="text-4xl drop-shadow-lg">🥈</div>
                            <div className="flex-1">
                              <h4 className="font-display font-black text-slate-800 text-base tracking-wider uppercase drop-shadow-sm">
                                Top 2 Geral
                              </h4>
                              <p className="text-slate-700 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                                Vice-Campeão do Mês
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="bg-slate-800 text-slate-100 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-slate-600">
                                Elite Prata
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {isBronze && (
                        <div
                          className="relative overflow-hidden rounded-2xl border-2 border-orange-500 shadow-[0_10px_20px_rgba(249,115,22,0.3)] transform hover:scale-[1.01] transition-all duration-300"
                          style={{
                            background: "linear-gradient(135deg, #cd7f32, #ffdab9, #b87333)",
                          }}
                        >
                          <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                          <div className="p-4 flex items-center gap-4 relative z-10 bg-white/20 backdrop-blur-sm">
                            <div className="text-4xl drop-shadow-lg">🥉</div>
                            <div className="flex-1">
                              <h4 className="font-display font-black text-orange-950 text-base tracking-wider uppercase drop-shadow-sm">
                                Top 3 Geral
                              </h4>
                              <p className="text-orange-905 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                                Destaque do Mês
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="bg-orange-900/80 text-orange-100 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-orange-700/50">
                                Elite Bronze
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* GRID DE MÉTRICAS E ESTATÍSTICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "XP Total", val: perfil.xpTotal, emoji: "⭐", col: "text-emerald-600 dark:text-emerald-450" },
                    { label: "Módulos/Missões", val: perfil.missoesConcluidas, emoji: "🎯", col: "text-blue-600 dark:text-blue-400" },
                    { label: "Pix Enviado", val: perfil.pixEnviado, emoji: "💸", col: "text-amber-600 dark:text-amber-450" },
                    { label: "Pix Recebido", val: perfil.pixRecebido, emoji: "🤝", col: "text-indigo-600 dark:text-indigo-400" }
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-white/80 dark:bg-slate-950/65 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="text-xl mb-1">{stat.emoji}</div>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className={`text-lg md:text-xl font-black mt-1 ${stat.col}`}>
                        {stat.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CONQUISTAS REGULARES */}
                <div className="bg-white/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-sm">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 transition-colors">
                    🎨 Mural de Conquistas Regular
                  </h3>
                  
                  {badgesExibicao.length === 0 ? (
                    <div className="text-center py-10">
                      <span className="text-4xl opacity-40 mb-2 block">📭</span>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Este aluno ainda não desbloqueou conquistas normais.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {badgesExibicao.map((badge, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white/85 dark:bg-slate-950/65 border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl text-2xl shadow-inner border border-slate-200/50 dark:border-slate-800 shrink-0">
                            {badge.icone}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm leading-tight truncate">
                              {badge.nome}
                            </h4>
                            <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
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

        </div>

      </motion.div>

    </div>
  );
}
