"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import PftBackgroundPattern from "@/src/components/PftBackgroundPattern";
import HeroIsometricWorkspace3D from "@/src/components/HeroIsometricWorkspace3D";

interface LandingPageProps {
  onLoginTutor: () => void;
}

type TabVitrine = "portal" | "arcade" | "tutor" | "certificados";

export default function LandingPage({ onLoginTutor }: LandingPageProps) {
  const [montado, setMontado] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<TabVitrine>("portal");
  const [pausarAutoPlay, setPausarAutoPlay] = useState(false);
  const progressoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  // Autoplay da vitrine interativa (troca suave a cada 6 segundos)
  useEffect(() => {
    if (pausarAutoPlay) return;

    const tabs: TabVitrine[] = ["portal", "arcade", "tutor", "certificados"];
    const interval = setInterval(() => {
      setTabAtiva((prev) => {
        const idx = tabs.indexOf(prev);
        return tabs[(idx + 1) % tabs.length];
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [pausarAutoPlay]);

  if (!montado) return null;

  // Variantes de animação de scroll suave
  const scrollFadeIn: Variants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-pft-sand dark:bg-pft-navy-deep text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white transition-colors duration-300">
      {/* Grafismo Oficial de Circuitos e Trilhas Tubulares do PFT */}
      <PftBackgroundPattern />

      {/* Blobs de Atmosfera e Iluminação Cósmica PFT */}
      <div className="fixed top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none opacity-60 dark:opacity-25 z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[65vw] h-[65vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none opacity-60 dark:opacity-30 z-0" />
      <div className="fixed top-[35%] right-[10%] w-[35vw] h-[35vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none opacity-50 dark:opacity-20 z-0" />

      {/* ═══ NAVBAR INSTITUCIONAL PFT ═══ */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-[#08172e]/85 border-b border-slate-200/80 dark:border-white/10 transition-colors">
        <nav className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-14 xl:px-20 h-20 md:h-24 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 via-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/25 shrink-0 transform hover:rotate-6 transition-transform">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl md:text-2xl tracking-tight text-slate-900 dark:text-white">
                  TrilhaTech
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                  PFT
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
                CESAR School • EREM Barão de Exu
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 md:gap-5"
          >
            <button
              onClick={onLoginTutor}
              className="cursor-pointer text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
            >
              🔒 Acesso do Tutor
            </button>
            <button
              onClick={() => (window.location.href = "/portal")}
              className="cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>🎮</span>
              <span>Portal do Aluno</span>
            </button>
          </motion.div>
        </nav>
      </header>

      {/* ═══ CONTEÚDO PRINCIPAL (100% PROPORCIONAL EM TELAS DESKTOP) ═══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center max-w-[1720px] mx-auto w-full px-4 sm:px-8 lg:px-14 xl:px-20 pt-6 md:pt-12 pb-28">
        
        {/* ─── 1. HERO SECTION (SPLIT SCREEN DESKTOP COM ESTAÇÃO 3D ISOMÉTRICA) ─── */}
        <section className="w-full relative pt-4 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            
            {/* COLUNA ESQUERDA: HEADLINE, CONTEXTO, CTAS & MÉTRICAS (PROPORÇÃO GENEROSA) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7 xl:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-7 z-10"
            >
              {/* Tag Badge Institucional */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-[#0e2442]/90 border border-orange-200 dark:border-orange-500/35 text-orange-700 dark:text-orange-300 text-xs font-black uppercase tracking-wider shadow-sm backdrop-blur-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span>Programa Florescendo Talentos (PFT)</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  CESAR School
                </span>
              </div>

              {/* Título Monumental Proporcional */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl 2xl:text-[5rem] font-display font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
                Educação Tecnológica,{" "}
                <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-blue-700 dark:from-orange-400 dark:via-amber-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Código & Gamificação
                </span>{" "}
                em Uma Plataforma Única.
              </h1>

              {/* Subtítulo Descritivo com Largura Confortável */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                O ecossistema oficial da TrilhaTech conecta estudantes da rede pública estadual ao universo profissional de desenvolvimento de software através de missões interativas, miniprojetos práticos e acompanhamento pedagógico em tempo real.
              </p>

              {/* Ações Primárias do Hero */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
                <button
                  onClick={() => (window.location.href = "/portal")}
                  className="cursor-pointer bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white px-9 py-4.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
                >
                  <span className="text-lg">🚀</span>
                  <span>Acessar Ambiente do Aluno</span>
                </button>
                
                <button
                  onClick={() => (window.location.href = "/hall-da-fama")}
                  className="cursor-pointer bg-white dark:bg-[#0e2442] hover:bg-slate-50 dark:hover:bg-[#132f54] text-slate-800 dark:text-white px-8 py-4.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-md hover:shadow-lg border border-slate-200 dark:border-white/10 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
                >
                  <span className="text-lg">🏆</span>
                  <span>Hall da Fama (Veteranos)</span>
                </button>
              </div>

              {/* Faixa de Métricas Rápidas Integradas ao Hero */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 w-full max-w-2xl">
                {[
                  { valor: "+300", label: "Alunos Ativos", icone: "👨‍💻", cor: "text-orange-500" },
                  { valor: "10", label: "Minijogos Arcade", icone: "🕹️", cor: "text-blue-500" },
                  { valor: "98%", label: "Frequência Média", icone: "📈", cor: "text-emerald-500" },
                  { valor: "100%", label: "Certificação Oficial", icone: "📜", cor: "text-amber-500" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0e2442]/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm shadow-sm flex flex-col items-start"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>{item.icone}</span>
                      <span className={`font-black font-display text-base sm:text-lg ${item.cor}`}>
                        {item.valor}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* COLUNA DIREITA: ESTAÇÃO 3D ISOMÉTRICA DE PROGRAMAÇÃO (REPRODUZINDO A ARTE) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              className="lg:col-span-5 xl:col-span-5 relative w-full flex items-center justify-center"
            >
              {/* Efeito Glow Volumétrico em volta da Estação 3D */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500/20 via-purple-600/25 to-blue-600/20 rounded-[3rem] blur-3xl pointer-events-none" />
              
              <div className="relative w-full rounded-[2.5rem] bg-gradient-to-b from-slate-900/40 via-purple-950/30 to-slate-950/60 dark:from-[#0e2442]/80 dark:via-[#08172e] dark:to-[#08172e] border border-orange-500/25 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
                
                {/* Header Holográfico com Tags de Tecnologia */}
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-300 bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-black text-white uppercase tracking-wider text-[10px]">
                      PFT LIVE WORKSPACE 3D
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-orange-400">
                    <span>⚡ CESAR Tech Lab</span>
                  </div>
                </div>

                {/* Cena 3D Interativa do Laptop + Café + Pads Flutuantes */}
                <div className="w-full h-[400px] sm:h-[480px] lg:h-[520px] xl:h-[580px] relative">
                  <HeroIsometricWorkspace3D />
                </div>

                {/* Barra Inferior com Status da Compilação Holográfica */}
                <div className="px-5 py-3 border-t border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-emerald-400">● Compilação Ativa:</span>
                    <span className="text-slate-200">TypeScript 5 • React 19 • CSS3</span>
                  </div>
                  <div className="text-orange-400 font-bold">
                    ☕ 100% Código & Autonomia
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── VITRINE DINÂMICA PANORÂMICA DE TELAS ATUALIZADAS PFT ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8, ease: "easeOut" }}
            onMouseEnter={() => setPausarAutoPlay(true)}
            onMouseLeave={() => setPausarAutoPlay(false)}
            className="w-full max-w-[1600px] mt-16 md:mt-24 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 shadow-2xl shadow-orange-500/10 backdrop-blur-md relative z-10"
          >
            {/* Barra de Janela do Navegador com Abas Interativas */}
            <div className="bg-slate-100/90 dark:bg-[#08172e] px-4 py-3 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>

              {/* Seletor de Abas de Demonstração (Cores 100% PFT) */}
              <div className="flex items-center bg-white/70 dark:bg-[#0e2442] rounded-xl p-1 border border-slate-200 dark:border-white/5 text-xs font-bold gap-1 shadow-inner">
                {[
                  { id: "portal", label: "🎮 Portal Gamificado" },
                  { id: "arcade", label: "🕹️ Arcade Educativo" },
                  { id: "tutor", label: "📊 Cockpit Docente" },
                  { id: "certificados", label: "📜 Certificados & Hall" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTabAtiva(item.id as TabVitrine);
                      setPausarAutoPlay(true);
                    }}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-[11px] sm:text-xs font-bold ${
                      tabAtiva === item.id
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>⚡</span>
                <span>Ambiente Ativo</span>
              </div>
            </div>

            {/* Conteúdo Dinâmico com Transição Suave (Cross-Fade) */}
            <div className="p-4 sm:p-6 md:p-8 min-h-[380px] sm:min-h-[460px] flex items-center justify-center bg-slate-50/50 dark:bg-[#08172e]/50">
              <AnimatePresence mode="wait">
                {tabAtiva === "portal" && (
                  <motion.div
                    key="portal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.45 }}
                    className="w-full space-y-4 text-left"
                  >
                    {/* Cockpit do Estudante */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-md">
                          <div className="w-full h-full bg-[#08172e] rounded-[14px] flex items-center justify-center text-2xl">
                            👨‍💻
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                              Mario Renan
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              3º TDS B
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                            Nível 8 • Desenvolvedor Front-end Pleno
                          </p>
                        </div>
                      </div>

                      {/* Métricas do Aluno */}
                      <div className="flex items-center gap-3 sm:gap-6">
                        <div className="text-center px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                            Ofensiva
                          </span>
                          <span className="text-base font-black text-orange-600 dark:text-orange-400">
                            🔥 14 Dias
                          </span>
                        </div>
                        <div className="text-center px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                            Carteira XP
                          </span>
                          <span className="text-base font-black text-amber-600 dark:text-amber-400">
                            ⭐ 5.420 XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cards de Aulas e Missões */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                            Miniprojeto
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
                            Aula 24 - Animações CSS & Keyframes
                          </h4>
                        </div>
                        <button className="mt-4 w-full py-2 rounded-xl bg-pft-orange hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all">
                          Abrir Atividade (145 XP)
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Quiz Teórico
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
                            Aula 24 - Desafio de Seletores
                          </h4>
                        </div>
                        <button className="mt-4 w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700">
                          Ver Detalhes ✓
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Material Didático
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
                            Apresentação de Apoio: Flexbox
                          </h4>
                        </div>
                        <button className="mt-4 w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700">
                          Ver Detalhes ✓
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tabAtiva === "arcade" && (
                  <motion.div
                    key="arcade"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.45 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                      <div>
                        <h3 className="font-display font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                          🕹️ Arcade Curricular PFT (10 Minijogos)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Fixação de conteúdo prático valendo até +25 XP diários.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs">
                        ❤️❤️❤️ 12/12 Vidas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm">
                        <span className="text-2xl">🎨</span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
                          Mestre dos Seletores
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Descubra o seletor CSS correto para formatar a tag HTML alvo.
                        </p>
                        <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs">
                          Jogar Agora
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm">
                        <span className="text-2xl">🐛</span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
                          Caçador de Bugs
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Inspecione o bloco e encontre o erro sintático de digitação.
                        </p>
                        <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs">
                          Jogar Agora
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm">
                        <span className="text-2xl">⌨️</span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
                          Digitação Veloz
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Desenvolva agilidade e precisão digitando códigos reais em JS/Python.
                        </p>
                        <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs">
                          Jogar Agora
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tabAtiva === "tutor" && (
                  <motion.div
                    key="tutor"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.45 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          Cockpit Docente
                        </span>
                        <h3 className="font-display font-black text-lg text-slate-900 dark:text-white mt-1">
                          Gestão de Turmas & Presença Inteligente
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black shadow-md flex items-center gap-1.5">
                          <span>🔑 Senha OTP:</span>
                          <span className="font-mono text-sm tracking-widest">849 201</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Assiduidade Geral</span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          94.8%
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Check-in eletrônico autenticado em sala.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Sincronia AVA</span>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                          100% Lote
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Google Classroom API sincronizado.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Radar de Risco</span>
                        <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                          0 Alunos
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Acompanhamento ativo e preventivo.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tabAtiva === "certificados" && (
                  <motion.div
                    key="certificados"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.45 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-blue-900 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                            Certificação Oficial PFT
                          </span>
                          <span className="text-xs text-slate-200">CESAR School</span>
                        </div>
                        <h3 className="font-display font-black text-xl text-white mt-1">
                          Módulo 01: Desenvolvimento Web & Algoritmos
                        </h3>
                        <p className="text-xs text-slate-200 mt-0.5">
                          Autenticidade garantida e verificação integrada à plataforma.
                        </p>
                      </div>
                      <button className="px-5 py-2.5 rounded-xl bg-white text-orange-600 font-black text-xs uppercase tracking-wider shadow-md hover:bg-slate-100 transition-all shrink-0">
                        Visualizar Certificado 🎓
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🏛️</span>
                        <div>
                          <h4 className="font-display font-black text-sm text-slate-800 dark:text-white">
                            Hall da Fama dos Formandos & Veteranos
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Vitrine pública para celebrar os concluintes de cada ciclo letivo.
                          </p>
                        </div>
                      </div>
                      <a
                        href="/hall-da-fama"
                        className="text-xs font-black text-orange-600 dark:text-orange-400 hover:underline shrink-0"
                      >
                        Acessar Santuário ↗
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* ─── 2. FAIXA DE IMPACTO / QUICK STATS PANORÂMICA ─── */}
        <section className="w-full max-w-[1600px] mt-20 md:mt-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icone: "🎯",
                titulo: "Metodologias Ativas",
                desc: "Desafios práticos, lógica e desenvolvimento web moderno.",
                corBorda: "hover:border-orange-500",
                corBadge: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
              },
              {
                icone: "⚡",
                titulo: "Tempo Real",
                desc: "Feedback instantâneo, check-in digital e pontuação por mérito.",
                corBorda: "hover:border-blue-500",
                corBadge: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
              },
              {
                icone: "📜",
                titulo: "Certificação Oficial",
                desc: "Emissão pelo Programa Florescendo Talentos & CESAR School.",
                corBorda: "hover:border-emerald-500",
                corBadge: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
              },
              {
                icone: "🎓",
                titulo: "Hall da Fama",
                desc: "Santuário público para eternizar a trajetória dos veteranos.",
                corBorda: "hover:border-amber-500",
                corBadge: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={scrollFadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3, margin: "0px 0px -80px 0px" }}
                className={`p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-[#0e2442]/70 border border-slate-200 dark:border-white/10 ${stat.corBorda} shadow-sm hover:shadow-xl transition-all hover:-translate-y-1.5 backdrop-blur-sm flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{stat.icone}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${stat.corBadge}`}>
                      PFT
                    </span>
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900 dark:text-white mb-2">
                    {stat.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {stat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── 3. SEÇÃO: AS RAÍZES DO PROJETO (PFT & CESAR SCHOOL) ─── */}
        <section className="mt-28 md:mt-36 w-full max-w-[1600px]">
          <motion.div
            variants={scrollFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
            className="p-8 sm:p-12 lg:p-16 rounded-[2.5rem] bg-gradient-to-br from-white via-orange-50/40 to-white dark:from-[#0e2442] dark:via-[#08172e] dark:to-[#0e2442] border border-orange-200/80 dark:border-orange-500/20 shadow-xl shadow-orange-500/5 backdrop-blur-md relative overflow-hidden"
          >
            {/* Efeito Glow Interno */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-center relative z-10">
              <div className="lg:col-span-8 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider">
                  <span>🌱</span>
                  <span>A Origem do Projeto</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white leading-tight">
                  Construído para o Programa Florescendo Talentos
                </h2>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg font-medium">
                  Uma iniciativa educacional pioneira do <strong>CESAR</strong> (Centro de Estudos e Sistemas Avançados do Recife) para qualificar jovens e adultos da rede pública estadual na área de <em>Operador de Computador com Ênfase em Desenvolvimento de Sistemas Web</em>.
                </p>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg font-medium">
                  Com o Portal TrilhaTech, o fluxo de submissão de atividades, controle de frequência e motivação dos alunos foi 100% digitalizado, substituindo planilhas manuais por um ecossistema autônomo, transparente e gamificado.
                </p>

                <div className="pt-2 flex flex-wrap gap-3.5">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/10">
                    🏛️ CESAR School
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/10">
                    🏫 EREM Barão de Exu
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 text-orange-700 dark:text-orange-300 text-xs sm:text-sm font-black border border-orange-500/25">
                    ✨ TrilhaTech PFT
                  </span>
                </div>
              </div>

              {/* Card Gráfico de Integração */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#08172e] border border-slate-200 dark:border-white/15 shadow-xl shadow-orange-500/10 flex flex-col items-center text-center max-w-md w-full relative group">
                  <div className="w-28 h-28 rounded-2xl bg-[#faf9f0] p-3 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-orange-200/60 mb-6 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    <Image
                      src="/logo-pft.png"
                      alt="Logo Florescendo Talentos"
                      width={112}
                      height={112}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                    Programa Florescendo Talentos
                  </h3>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest mt-1.5">
                    CESAR School • EREM Barão de Exu
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">
                    Formando talentos e abrindo caminhos para o mercado de tecnologia de Pernambuco e do Brasil.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── 4. SEÇÃO: A JORNADA DO ESTUDANTE ─── */}
        <section className="mt-28 md:mt-36 w-full max-w-[1600px] text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-center">
            <motion.div
              variants={scrollFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                <span>🎒</span>
                <span>Experiência do Estudante</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white leading-tight">
                Metodologias Ativas & Aprendizado por Mérito
              </h2>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg font-medium">
                Cada aluno possui um perfil vivo que evolui a cada linha de código entregue. O painel estimula a constância diária (ofensiva), recompensa a pontualidade e oferece recursos interativos para fixação pedagógica.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e2442]/60 border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl shrink-0 font-black">
                    🕹️
                  </div>
                  <div>
                    <h4 className="font-display font-black text-base text-slate-900 dark:text-white">
                      Arcade Educativo com 10 Minijogos Curriculares
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Prática rápida de seletores CSS, lógica de programação, lógica booleana e detecção de bugs.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e2442]/60 border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shrink-0 font-black">
                    ⌨️
                  </div>
                  <div>
                    <h4 className="font-display font-black text-base text-slate-900 dark:text-white">
                      Treinador de Digitação de Código Real
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Miniprojetos práticos onde o aluno digita sintaxe HTML/CSS/JS e desenvolve agilidade motora.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e2442]/60 border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0 font-black">
                    🏅
                  </div>
                  <div>
                    <h4 className="font-display font-black text-base text-slate-900 dark:text-white">
                      Badges, Conquistas & Certificados Verificáveis
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Reconhecimento oficial dos módulos concluídos com visualização integrada e download de PDF.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Showcase Fiel do Perfil do Aluno (Em Código com Design PFT) */}
            <motion.div
              variants={scrollFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
              className="lg:col-span-6 p-7 sm:p-9 lg:p-10 rounded-3xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-xl shadow-blue-500/10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl shadow-md text-white">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                      Evolução de Competências
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Trilha Pedagógica PFT</p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  98% de Frequência
                </span>
              </div>

              {/* Badges de Honra */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: "⚡", nome: "Lógica Ninja", cor: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
                  { emoji: "🎨", nome: "Mestre CSS", cor: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
                  { emoji: "🚀", nome: "Entrega Flash", cor: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
                ].map((b, i) => (
                  <div key={i} className={`p-3.5 rounded-2xl border text-center ${b.cor}`}>
                    <span className="text-2xl block mb-1.5">{b.emoji}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider block">{b.nome}</span>
                  </div>
                ))}
              </div>

              {/* Barra de Progresso do Curso */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                  <span>Módulo Atual: JavaScript Interativo</span>
                  <span className="text-orange-600 dark:text-orange-400">85% Concluído</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full w-[85%]" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 5. SEÇÃO: O COCKPIT DO TUTOR ─── */}
        <section className="mt-28 md:mt-36 w-full max-w-[1600px] text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-center">
            {/* Showcase Fiel do Painel Docente */}
            <motion.div
              variants={scrollFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
              className="lg:col-span-6 p-7 sm:p-9 lg:p-10 rounded-3xl bg-white dark:bg-[#0e2442] border border-slate-200 dark:border-white/10 shadow-xl shadow-emerald-500/10 order-2 lg:order-1 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                      Registro de Frequência Diária
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Turma 3º TDS B • Presença</p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs">
                  Aula ao Vivo
                </span>
              </div>

              {/* Lista Rápida de Alunos */}
              <div className="space-y-2.5">
                {[
                  { nome: "Mario Renan", status: "Presente (OTP)", cor: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                  { nome: "Lucas Silva", status: "Presente (OTP)", cor: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                  { nome: "Ana Beatriz", status: "Presente (OTP)", cor: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{a.nome}</span>
                    <span className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-lg border ${a.cor}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center justify-between">
                <span>Total de Presentes: 28 Alunos</span>
                <span>Auditado ✔</span>
              </div>
            </motion.div>

            <motion.div
              variants={scrollFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
              className="lg:col-span-6 space-y-6 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
                <span>📊</span>
                <span>Controle Docente</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white leading-tight">
                Gestão Ágil, Auditoria & Presença Digital
              </h2>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg font-medium">
                Desenvolvido para eliminar o fardo burocrático da docência. O tutor gerencia notas, frequência diária por OTP rotativo, sincronização em lote com o Google Classroom e métricas de desempenho em poucos cliques.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5">
                  <span className="text-emerald-500 font-black text-xl">✔</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white text-sm sm:text-base">
                      Chamada Inteligente via OTP:
                    </strong>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Senha de 6 dígitos projetada no telão para check-in imediato dos alunos na sala.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="text-emerald-500 font-black text-xl">✔</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white text-sm sm:text-base">
                      Sincronização em Lote com Classroom:
                    </strong>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Busca automatizada de turmas e devolução de notas com validação direta no AVA.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="text-emerald-500 font-black text-xl">✔</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white text-sm sm:text-base">
                      Radar de Frequência & Alunos em Risco:
                    </strong>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Identificação precoce de ausências para ação preventiva com a coordenação escolar.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 6. SEÇÃO: MISSÃO INSTITUCIONAL PANORÂMICA ─── */}
        <section className="mt-28 md:mt-36 w-full max-w-[1600px] text-center">
          <motion.div
            variants={scrollFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
            className="p-8 sm:p-14 lg:p-20 rounded-[2.5rem] bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-600/10 border border-orange-300/40 dark:border-white/10 shadow-lg relative overflow-hidden backdrop-blur-sm"
          >
            <div className="w-20 h-20 rounded-3xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
              🏛️
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white mb-6">
              Missão Institucional & Filosofia
            </h2>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg lg:text-xl font-medium max-w-4xl mx-auto">
              Nossa missão transcende a nota em boletim: capacitamos educadores com ferramentas que otimizam o tempo letivo e inspiramos os jovens da rede pública a transitarem de meros consumidores para <strong>autores e criadores de suas próprias soluções tecnológicas</strong>.
            </p>

            <div className="mt-10 pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-center gap-8 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>CESAR School</span>
              <span>•</span>
              <span>EREM Barão de Exu</span>
              <span>•</span>
              <span>Projeto Florescendo Talentos</span>
            </div>
          </motion.div>
        </section>

        {/* ─── 7. BANNER FINAL: CHAMADA PARA AÇÃO (CTA) ─── */}
        <section className="mt-24 md:mt-36 w-full max-w-[1600px]">
          <motion.div
            variants={scrollFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
            className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-blue-900 text-white shadow-2xl shadow-orange-500/25 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden"
          >
            {/* Efeitos Decorativos de Fundo */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-60 h-60 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 text-center lg:text-left space-y-3 max-w-3xl">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-orange-200 bg-white/15 px-3.5 py-1.5 rounded-full border border-white/20">
                Acesso Imediato
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black leading-tight">
                Pronto para iniciar sua jornada tecnológica?
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                Faça login com sua matrícula e acompanhe sua evolução na TrilhaTech agora mesmo.
              </p>
            </div>

            <div className="relative z-10 shrink-0 w-full lg:w-auto">
              <button
                onClick={() => (window.location.href = "/portal")}
                className="cursor-pointer w-full lg:w-auto px-10 py-5 rounded-2xl bg-white hover:bg-slate-100 text-orange-600 hover:text-orange-700 font-display font-black text-sm uppercase tracking-wider shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                🎮 Entrar no Portal do Aluno
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ═══ FOOTER INSTITUCIONAL PFT ═══ */}
      <footer className="relative z-20 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#08172e]/50 backdrop-blur-md py-10 mt-auto text-center">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-14 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>🚀</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Portal TrilhaTech • Programa Florescendo Talentos
            </span>
          </div>
          <div>
            Parceria Oficial <strong>CESAR School</strong> & <strong>EREM Barão de Exu</strong>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
