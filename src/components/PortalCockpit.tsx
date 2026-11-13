"use client";

import { motion } from "framer-motion";
import { PortalCockpitProps } from "../types";
import Tooltip from "./ui/Tooltip";

export default function PortalCockpit({
  nomeAluno,
  missoesPendentes,
  ofensivaDias,
  checkinRealizado,
  nivelSistema,
  xpTotalSistema,
  totalCertificados,
  progressoNivel,
  onFazerCheckin,
  onAbrirPix,
  onAbrirGabaritos,
  onAbrirJogos,
  onAbrirArena,
  onAbrirRifa,
  onAbrirBilhetes,
  onAbrirRegulamento,
  onAbrirCertificados,
}: PortalCockpitProps) {
  const primeiroNome = nomeAluno ? nomeAluno.split(" ")[0] : "Estudante";

  return (
    <div className="max-w-[1536px] w-full mx-auto p-4 md:p-8 mt-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* ========================================================= */}
        {/* LADO ESQUERDO: SAUDAÇÃO & DOCK DE AÇÕES COM SUPORTE LIGHT/DARK */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 relative overflow-hidden bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col justify-between group transition-colors duration-300">
          {/* Luz de fundo sutil (Ambient Glow) */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Cabeçalho de Boas-Vindas */}
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                Bem-vindo,{" "}
                <span className="text-orange-600 dark:text-orange-400">
                  {primeiroNome}
                </span>
                !
              </h2>

              {ofensivaDias > 0 && (
                <Tooltip content="🔥 Sequência de dias ativos no Trilha Tech" position="bottom">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-black uppercase tracking-wider border border-orange-300 dark:border-orange-500/30 shadow-xs cursor-help">
                    <span className="text-sm animate-pulse">🔥</span>
                    <span>{ofensivaDias} Dias de Ofensiva</span>
                  </div>
                </Tooltip>
              )}
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 flex items-center gap-2 font-medium">
              <span>
                Você tem{" "}
                <strong className="text-orange-600 dark:text-orange-400 font-bold">
                  {missoesPendentes} missões pendentes
                </strong>
                .
              </span>
            </p>
          </div>

          {/* DOCK DE AÇÕES COM DESIGN MODERNO E SUPORTE LIGHT/DARK */}
          <div className="mt-8 space-y-3 relative z-10">
            {/* FILEIRA 1: ESTUDOS & SALA DE AULA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Check-in Diário */}
              <motion.button
                whileHover={checkinRealizado ? {} : { scale: 1.02 }}
                whileTap={checkinRealizado ? {} : { scale: 0.98 }}
                onClick={onFazerCheckin}
                disabled={checkinRealizado}
                className={`cursor-pointer group/btn relative overflow-hidden rounded-2xl p-4 text-left transition-all border flex items-center gap-3.5 ${
                  checkinRealizado
                    ? "bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-emerald-500/20 opacity-80 cursor-default"
                    : "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-amber-500/5 hover:from-amber-500/20 hover:to-orange-500/15 border-amber-300 dark:border-amber-500/30 hover:border-amber-400 shadow-xs shadow-amber-500/10"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                    checkinRealizado
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                      : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 shadow-xs group-hover/btn:scale-105"
                  }`}
                >
                  {checkinRealizado ? "✅" : "🔥"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    {checkinRealizado ? "Presença Feita" : "Check-in Diário"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                    {checkinRealizado ? "Confirmado hoje" : "Garantir XP do dia"}
                  </p>
                </div>
              </motion.button>

              {/* 2. Google Classroom */}
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://classroom.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative overflow-hidden bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-2xl p-4 text-left transition-all border border-slate-200 dark:border-white/10 hover:border-orange-400/50 dark:hover:border-orange-500/40 shadow-xs flex items-center gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 group-hover/btn:scale-105 transition-all shadow-xs">
                  🏫
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Classroom
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                    Salas & Atividades
                  </p>
                </div>
              </motion.a>

              {/* 3. Gabaritos Oficiais */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAbrirGabaritos}
                className="cursor-pointer group/btn relative overflow-hidden bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-2xl p-4 text-left transition-all border border-slate-200 dark:border-white/10 hover:border-orange-400/50 dark:hover:border-orange-500/40 shadow-xs flex items-center gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0 group-hover/btn:scale-105 transition-all shadow-xs">
                  🗝️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Gabaritos
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                    Resoluções liberadas
                  </p>
                </div>
              </motion.button>
            </div>

            {/* FILEIRA 2: GAMIFICAÇÃO & SOCIAL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 4. Central de Jogos & Duelos (Unificado) */}
              <div className="relative overflow-hidden bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-2xl p-4 transition-all border border-slate-200 dark:border-white/10 hover:border-purple-400/50 dark:hover:border-purple-500/40 shadow-xs flex items-center justify-between gap-3 group/arcade">
                <div
                  onClick={onAbrirJogos}
                  className="cursor-pointer flex items-center gap-3.5 min-w-0 flex-1"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/25 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 group-hover/arcade:scale-105 transition-all shadow-xs">
                    🎮
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      Jogos & Quiz
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                      Arcade de XP
                    </p>
                  </div>
                </div>

                {/* Atalho para Arena 1v1 */}
                <Tooltip content="⚔️ Arena 1v1 em Tempo Real" position="top">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAbrirArena}
                    className="cursor-pointer p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/35 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-bold transition-all shrink-0"
                    aria-label="Abrir Arena 1v1"
                  >
                    ⚔️
                  </motion.button>
                </Tooltip>
              </div>

              {/* 5. Pix de XP */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAbrirPix}
                className="cursor-pointer group/btn relative overflow-hidden bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-2xl p-4 text-left transition-all border border-slate-200 dark:border-white/10 hover:border-emerald-400/50 dark:hover:border-emerald-500/40 shadow-xs flex items-center gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 group-hover/btn:scale-105 transition-all shadow-xs">
                  💸
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Pix de XP
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                    Enviar para colegas
                  </p>
                </div>
              </motion.button>

              {/* 6. Sorteios & Rifas */}
              <div className="relative overflow-hidden bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-2xl p-4 transition-all border border-slate-200 dark:border-white/10 hover:border-fuchsia-400/50 dark:hover:border-fuchsia-500/40 shadow-xs flex flex-col justify-between group/rifa">
                <div
                  onClick={onAbrirRifa}
                  className="cursor-pointer flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-500/15 border border-fuchsia-200 dark:border-fuchsia-500/25 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center text-xl shrink-0 group-hover/rifa:scale-105 transition-all shadow-sm">
                    🎟️
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      Loja & Rifas
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                      Prêmios do Ciclo
                    </p>
                  </div>
                </div>

                {/* Sub-links discretos */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-white/5 text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                  <button
                    type="button"
                    onClick={onAbrirBilhetes}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white hover:underline transition-colors"
                  >
                    Meus Bilhetes
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onAbrirRegulamento}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white hover:underline transition-colors"
                  >
                    Regras
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LADO DIREITO: CARDS DE STATUS MODERNOS & BARRA DE NÍVEL   */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* GRID COM 3 CARDS COMPACTOS COM DESIGN GLASS LIGHT/DARK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* Card 1: Nível Atual */}
            <div className="relative overflow-hidden bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-orange-400/40 transition-all flex flex-col justify-between shadow-xs dark:shadow-md group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Nível Atual
                </span>
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-base shadow-xs">
                  🎓
                </div>
              </div>
              <p className="text-sm sm:text-base font-display font-black text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                {nivelSistema}
              </p>
            </div>

            {/* Card 2: Saldo XP */}
            <div className="relative overflow-hidden bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between shadow-xs dark:shadow-md group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  XP Acumulado
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base shadow-xs">
                  ⭐
                </div>
              </div>
              <p className="text-lg sm:text-xl font-display font-black text-orange-600 dark:text-orange-400 truncate">
                {xpTotalSistema.toLocaleString("pt-BR")}
              </p>
            </div>

            {/* Card 3: Selo de Certificados PFT */}
            <Tooltip content="📜 Abrir e baixar certificados oficiais do PFT" position="top" className="w-full">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAbrirCertificados}
                className={`w-full cursor-pointer relative overflow-hidden backdrop-blur-xl p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-xs dark:shadow-md group ${
                  totalCertificados > 0
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400 shadow-xs"
                    : "bg-white/90 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Certificados
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shadow-xs">
                    📜
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-display font-black text-slate-800 dark:text-white truncate">
                    {totalCertificados} Concluído{totalCertificados === 1 ? "" : "s"}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 mt-0.5">
                    Ver no Portal ➔
                  </span>
                </div>
              </motion.div>
            </Tooltip>
          </div>

          {/* CARD DE PROGRESSO DE NÍVEL REFINADO */}
          <div className="relative overflow-hidden bg-white/90 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200 dark:border-white/10 w-full flex-1 flex flex-col justify-center shadow-xs dark:shadow-md transition-colors duration-300">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              <span>Progresso de Evolução</span>
              <span className="text-orange-600 dark:text-orange-400 font-mono px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 font-bold">
                {progressoNivel.isMaximo
                  ? "Nível Máximo!"
                  : `Rumo ao ${progressoNivel.nomeProximo}`}
              </span>
            </div>

            {/* Trilha de Progresso com Brilho Neon */}
            <div className="w-full bg-slate-100 dark:bg-slate-950/90 rounded-full h-3.5 mb-3 overflow-hidden shadow-inner border border-slate-200 dark:border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressoNivel.porcentagem}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 h-full rounded-full relative shadow-xs"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse rounded-full" />
              </motion.div>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
              {progressoNivel.isMaximo ? (
                "🏆 Você alcançou o topo supremo do Trilha Tech!"
              ) : (
                <>
                  Faltam{" "}
                  <strong className="text-orange-600 dark:text-orange-400 font-black font-mono">
                    {progressoNivel.faltam.toLocaleString("pt-BR")} XP
                  </strong>{" "}
                  para o próximo nível! 🚀
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
