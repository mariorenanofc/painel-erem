"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiAluno } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import { Volume2, VolumeX, X, Trophy, RefreshCw, Zap, Shield } from "lucide-react";

// Sintetizador Chiptune nativo para efeitos retro de áudio
export function playChiptuneSound(type: "click" | "success" | "error") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Evita crashes por bloqueio de autoplay do navegador
  }
}

interface JogosLayoutProps {
  title: string;
  description: string;
  tipoJogo: string;
  onClose: () => void;
  aluno: { nome: string; matricula: string };
  children: (props: { 
    onGameOver: (score: number, durationSeconds: number) => void; 
    playSound: (type: "click" | "success" | "error") => void;
    soundEnabled: boolean;
  }) => React.ReactNode;
}

export default function JogosLayout({
  title,
  description,
  tipoJogo,
  onClose,
  aluno,
  children
}: JogosLayoutProps) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<"playing" | "gameover">("playing");
  const [score, setScore] = useState(0);
  const [xpGanho, setXpGanho] = useState(0);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const tempoInicioRef = useRef<number>(Date.now());

  // 1. Bloquear copiar, colar, cortar e menu de contexto (Botão direito)
  useEffect(() => {
    const handleDisable = (e: Event) => e.preventDefault();
    
    document.addEventListener("copy", handleDisable);
    document.addEventListener("cut", handleDisable);
    document.addEventListener("paste", handleDisable);
    document.addEventListener("contextmenu", handleDisable);
    
    return () => {
      document.removeEventListener("copy", handleDisable);
      document.removeEventListener("cut", handleDisable);
      document.removeEventListener("paste", handleDisable);
      document.removeEventListener("contextmenu", handleDisable);
    };
  }, []);

  const handlePlaySound = (type: "click" | "success" | "error") => {
    if (soundEnabled) {
      playChiptuneSound(type);
    }
  };

  const handleGameOver = async (finalScore: number, durationSeconds: number) => {
    setScore(finalScore);
    setDuration(durationSeconds);
    setGameState("gameover");
    handlePlaySound("success");
    
    setSaving(true);
    setSaveMessage("Processando pontuação com segurança...");
    
    try {
      const res = await apiAluno.salvarPontuacaoJogo(
        aluno.matricula,
        tipoJogo,
        finalScore,
        durationSeconds,
        tempoInicioRef.current
      );
      
      if (res.status === "sucesso") {
        setXpGanho(res.xpGanho || 0);
        setSaveMessage(res.mensagem || `Pontuação salva! +${res.xpGanho} XP adicionado.`);
        toast(res.mensagem || "Pontuação enviada com sucesso!", "success");
      } else {
        setSaveMessage(res.mensagem || "Não foi possível resgatar XP nesta partida.");
        toast(res.mensagem || "Limite diário atingido ou erro de pontuação.", "warning");
      }
    } catch {
      setSaveMessage("Erro de conexão com o servidor ao salvar score.");
      toast("Falha na rede ao salvar pontuação.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    tempoInicioRef.current = Date.now();
    setGameState("playing");
    setScore(0);
    setXpGanho(0);
    setDuration(0);
    setSaveMessage("");
    handlePlaySound("click");
  };

  // Marca d'água diagonal repetida sutil (com nome e matrícula) para inibir prints de colas
  const renderWatermark = () => {
    const watermarkText = `${aluno.nome.split(" ")[0]} - ${aluno.matricula}`;
    return (
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-6 gap-4 overflow-hidden pointer-events-none select-none opacity-[0.025] z-[9999]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center text-[10px] sm:text-xs font-mono text-white transform -rotate-30 whitespace-nowrap">
            {watermarkText}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full min-h-[500px] flex flex-col bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl overflow-hidden shadow-2xl">
      {renderWatermark()}
      
      {/* Cabeçalho do Contêiner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-4 gap-4 z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">{description}</p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Controle de Som */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
            title={soundEnabled ? "Mutar Áudio" : "Ativar Áudio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          {/* Indicador de Segurança */}
          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 flex items-center gap-1.5 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proteção Ativa</span>
          </div>

          {/* Fechar Jogo */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 hover:bg-red-900/30 transition-all ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo Principal (Canvas do Jogo ou Game Over) */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[350px] z-10">
        <AnimatePresence mode="wait">
          {gameState === "playing" ? (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full h-full flex flex-col"
            >
              {children({ onGameOver: handleGameOver, playSound: handlePlaySound, soundEnabled })}
            </motion.div>
          ) : (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center shadow-xl relative"
            >
              {/* Círculo do Recorde */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
                <Trophy className="w-10 h-10 text-white animate-bounce" />
              </div>
              
              <h3 className="text-2xl font-extrabold text-white mb-1">Fim de Jogo!</h3>
              <p className="text-slate-400 text-sm mb-6">Sua pontuação foi registrada no painel.</p>
              
              {/* Placa de Estatísticas */}
              <div className="w-full grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Pontos</span>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1">{score}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">XP Conquistado</span>
                  <div className="text-xl sm:text-2xl font-black text-yellow-400 mt-1 flex items-center justify-center gap-1">
                    <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    +{xpGanho}
                  </div>
                </div>
              </div>

              {/* Status do Salvamento / Anti-Cheat */}
              <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800/50 mb-8 text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span>{saveMessage}</span>
                  </>
                ) : (
                  <span>{saveMessage}</span>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-850 hover:text-white transition-all text-sm"
                >
                  Voltar para Lista
                </button>
                <button
                  onClick={handleRestart}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Jogar Novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
