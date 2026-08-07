"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiAluno } from "@/src/services/api";
import { X, Trophy, Zap, Gamepad2, BrainCircuit } from "lucide-react";
import JogosLayout from "./games/JogosLayout";

// Importar os 10 mini-jogos
import CodingSpeedrun from "./games/CodingSpeedrun";
import CSSSelectorHunter from "./games/CSSSelectorHunter";
import HardwareSoftwareMatch from "./games/HardwareSoftwareMatch";
import JSBugHunter from "./games/JSBugHunter";
import AlgorithmStepBuilder from "./games/AlgorithmStepBuilder";
import LogicGatesSpeedrun from "./games/LogicGatesSpeedrun";
import OutputPredictor from "./games/OutputPredictor";
import HTMLStructurer from "./games/HTMLStructurer";
import FlexAlignMaster from "./games/FlexAlignMaster";
import ArrayOperations from "./games/ArrayOperations";

interface JogosModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: { nome: string; matricula: string };
  onXpUpdate: () => void; // Para atualizar o XP no portal principal
}

interface GameDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  component: React.ComponentType<{
    onGameOver: (score: number, durationSeconds: number) => void;
    playSound: (type: "click" | "success" | "error") => void;
    soundEnabled: boolean;
  }>;
}

const GAMES: GameDefinition[] = [
  {
    id: "CodingSpeedrun",
    title: "Digitação Veloz",
    description: "Pratique agilidade de escrita digitando sintaxe rápida de código.",
    emoji: "⌨️",
    color: "from-blue-600 to-indigo-600 border-blue-500/20",
    component: CodingSpeedrun
  },
  {
    id: "CSSSelectorHunter",
    title: "Mestre dos Seletores",
    description: "Escolha o seletor CSS correto para formatar o elemento HTML alvo.",
    emoji: "🎨",
    color: "from-purple-600 to-pink-650 border-purple-500/20",
    component: CSSSelectorHunter
  },
  {
    id: "HardwareSoftwareMatch",
    title: "Componentes de PC",
    description: "Classifique cartões entre Hardware (entrada/saída) e Software.",
    emoji: "🔌",
    color: "from-cyan-600 to-blue-600 border-cyan-500/20",
    component: HardwareSoftwareMatch
  },
  {
    id: "JSBugHunter",
    title: "Caçador de Bugs",
    description: "Encontre o erro sintático de iniciante na linha do código.",
    emoji: "🐛",
    color: "from-rose-600 to-red-650 border-rose-500/20",
    component: JSBugHunter
  },
  {
    id: "AlgorithmStepBuilder",
    title: "Ordenador de Fluxograma",
    description: "Organize etapas de lógica para criar a sequência de um algoritmo.",
    emoji: "📊",
    color: "from-amber-600 to-orange-600 border-amber-500/20",
    component: AlgorithmStepBuilder
  },
  {
    id: "LogicGatesSpeedrun",
    title: "Tabela Verdade",
    description: "Responda se as expressões lógicas (AND/OR/NOT) são True ou False.",
    emoji: "⚖️",
    color: "from-indigo-600 to-violet-650 border-indigo-500/20",
    component: LogicGatesSpeedrun
  },
  {
    id: "OutputPredictor",
    title: "Detetive do Console",
    description: "Decifre o resultado exato que será impresso pelas variáveis.",
    emoji: "💻",
    color: "from-teal-600 to-emerald-650 border-teal-500/20",
    component: OutputPredictor
  },
  {
    id: "HTMLStructurer",
    title: "Quebra-Cabeça HTML",
    description: "Ordene as tags de abertura e fechamento na hierarquia correta.",
    emoji: "🧱",
    color: "from-orange-600 to-amber-650 border-orange-500/20",
    component: HTMLStructurer
  },
  {
    id: "FlexAlignMaster",
    title: "Alinhamento Flexbox",
    description: "Selecione propriedades Flexbox para mover elementos sobre os alvos.",
    emoji: "📐",
    color: "from-sky-600 to-indigo-650 border-sky-500/20",
    component: FlexAlignMaster
  },
  {
    id: "ArrayOperations",
    title: "Desafio de Listas",
    description: "Preveja o resultado final de listas após adicionar ou remover itens.",
    emoji: "📦",
    color: "from-violet-600 to-purple-650 border-violet-500/20",
    component: ArrayOperations
  }
];

export default function JogosModal({
  isOpen,
  onClose,
  aluno,
  onXpUpdate
}: JogosModalProps) {
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);
  const [xpGanhoHoje, setXpGanhoHoje] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const carregarProgressoXp = async () => {
    if (!aluno) return;
    setLoadingStats(true);
    try {
      const res = await apiAluno.buscarJogosStatus(aluno.matricula);
      if (res.status === "sucesso") {
        setXpGanhoHoje(res.xpGanhoHoje || 0);
      }
    } catch {
      console.warn("Falha ao obter status de limite de XP de jogos.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarProgressoXp();
      setActiveGame(null);
    }
  }, [isOpen]);

  const handleGameFinished = () => {
    carregarProgressoXp();
    onXpUpdate(); // Notificar portal principal para recarregar XP total
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Overlay Escuro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!activeGame) onClose();
          }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Janela Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
        >
          {/* Corpo do Modal: Se não houver jogo ativo, renderiza catálogo. Se houver, renderiza jogo */}
          {activeGame ? (
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <JogosLayout
                title={activeGame.title}
                description={activeGame.description}
                tipoJogo={activeGame.id}
                aluno={aluno}
                onClose={() => {
                  setActiveGame(null);
                  handleGameFinished();
                }}
                children={(gameProps) => {
                  const GameComponent = activeGame.component;
                  return (
                    <GameComponent
                      onGameOver={(score, duration) => {
                        gameProps.onGameOver(score, duration);
                      }}
                      playSound={gameProps.playSound}
                      soundEnabled={gameProps.soundEnabled}
                    />
                  );
                }}
              />
            </div>
          ) : (
            <>
              {/* Cabeçalho do Catálogo */}
              <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Gamepad2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                      Arcade Educativo EREM
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">Jogue minijogos curriculares para ganhar XP extra!</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo do Catálogo */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Placa do Progresso de Limite Diário (25 XP) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-slate-900 to-indigo-950/20 border border-purple-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 self-start md:self-center">
                    <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Recompensas Diárias</h4>
                      <p className="text-xs text-slate-400 font-medium">Cada 1.000 pontos marcados nos jogos garantem +1 XP.</p>
                    </div>
                  </div>
                  
                  {/* Barra de Progresso do Teto Diário */}
                  <div className="w-full md:w-64 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">XP de hoje</span>
                      <span className="text-yellow-400">{xpGanhoHoje} / 25 XP</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800/80 p-0.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xpGanhoHoje / 25) * 100}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 shadow-md shadow-yellow-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid dos Cards de Jogos */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-500 mb-4 flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    Catálogo de Minijogos ({GAMES.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GAMES.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-850/80 flex gap-4 transition-all relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />
                        
                        {/* Efeito Neon de Hover */}
                        <div className="absolute -inset-px bg-gradient-to-r from-transparent via-purple-500/0 to-transparent group-hover:via-purple-500/10 transition-all pointer-events-none rounded-2xl" />

                        {/* Emoji/Ícone */}
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-all">
                          {game.emoji}
                        </div>

                        {/* Texto descritivo e Ação */}
                        <div className="flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
                              {game.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 leading-normal font-medium">
                              {game.description}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setActiveGame(game);
                            }}
                            className="self-start text-[10px] uppercase font-bold tracking-wider text-purple-400 hover:text-white px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 border border-purple-500/20 hover:border-purple-500 transition-all active:scale-95"
                          >
                            Jogar Agora
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
