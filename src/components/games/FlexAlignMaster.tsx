"use client";
import { fisherYatesShuffle } from "@/src/lib/fisherYates";


import React, { useState, useRef } from "react";
import { Sparkles, LayoutGrid } from "lucide-react";

interface FlexAlignMasterProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  perderVida?: () => void;
  soundEnabled: boolean;
}

type JustifyValue = "flex-start" | "flex-end" | "center" | "space-between" | "space-around";

interface Challenge {
  title: string;
  targetJustify: JustifyValue;
  targetDesc: string;
  targetLayout: React.ReactNode;
}

export default function FlexAlignMaster({ onGameOver, playSound, perderVida }: FlexAlignMasterProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentJustify, setCurrentJustify] = useState<JustifyValue>("flex-start");
  const [score, setScore] = useState(0);
  const isFinishedRef = React.useRef(false);
  const [validated, setValidated] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  const startTimeRef = useRef<number>(0);

  // Definindo os desafios
  const CHALLENGES: Challenge[] = [
    {
      title: "Desafio 1: Agrupar itens no centro",
      targetJustify: "center",
      targetDesc: "Mover os blocos para o centro do container.",
      targetLayout: (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
          </div>
        </div>
      )
    },
    {
      title: "Desafio 2: Empurrar itens para o fim",
      targetJustify: "flex-end",
      targetDesc: "Alinhar todos os blocos no canto direito.",
      targetLayout: (
        <div className="absolute inset-0 flex justify-end items-center pointer-events-none opacity-20 pr-4">
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
          </div>
        </div>
      )
    },
    {
      title: "Desafio 3: Distribuir com espaço máximo",
      targetJustify: "space-between",
      targetDesc: "Espalhar os blocos deixando um na ponta esquerda e outro na ponta direita.",
      targetLayout: (
        <div className="absolute inset-0 flex justify-between items-center pointer-events-none opacity-20 px-4">
          <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
          <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
        </div>
      )
    },
    {
      title: "Desafio 4: Espaçamento igualitário nas bordas",
      targetJustify: "space-around",
      targetDesc: "Distribuir com espaços iguais ao redor de todos os blocos.",
      targetLayout: (
        <div className="absolute inset-0 flex justify-around items-center pointer-events-none opacity-20 px-2">
          <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
          <div className="w-10 h-10 rounded-lg border-2 border-dashed border-white" />
        </div>
      )
    }
  ];

  const [shuffledChallenges, setShuffledChallenges] = useState<Challenge[]>([]);

  const handleStart = () => {
    if (isFinishedRef) isFinishedRef.current = false;
    playSound("click");
    // Embaralhar desafios
    const chufs = fisherYatesShuffle([...CHALLENGES]);
    setShuffledChallenges(chufs);
    setCurrentIndex(0);
    setCurrentJustify("flex-start");
    setScore(0);
    setFeedback("");
    setValidated(false);
    setIsPlaying(true);
    startTimeRef.current = new Date().getTime();
  };

  const handleJustifyClick = (val: JustifyValue) => {
    if (validated) return;
    playSound("click");
    setCurrentJustify(val);
  };

  const handleValidate = () => {
    const currentC = shuffledChallenges[currentIndex];
    const isCorrect = currentJustify === currentC.targetJustify;
    setValidated(true);

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1250); // 1250 por acerto
      setFeedback("Alinhamento Flexbox perfeito!");
    } else {
      playSound("error");
      if (perderVida) perderVida();
      setFeedback(`Incorreto. O alinhamento correto é '${currentC.targetJustify}'.`);
      setCurrentJustify(currentC.targetJustify); // mostra resposta no container
    }

    setTimeout(() => {
      if (currentIndex < shuffledChallenges.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setCurrentJustify("flex-start");
        setValidated(false);
        setFeedback("");
      } else {
        const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
        const finalScore = score + (isCorrect ? 1250 : 0);
        isFinishedRef.current = true;
      onGameOver(finalScore, duration);
      }
    }, 3800);
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Alinhador Flexbox</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Selecione a propriedade de alinhamento CSS `justify-content` para mover os blocos do 
          container até os alvos tracejados!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          Iniciar Partida
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentC = shuffledChallenges[currentIndex];

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-xl mx-auto w-full">
      {/* Placa de Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 text-sm text-slate-400">
        <span>Desafio {currentIndex + 1} de 4</span>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      <div className="text-center mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Alvo Flex:</span>
        <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">{currentC.targetDesc}</h4>
      </div>

      {/* Caixa de Exibição do Flexbox Dinâmico */}
      <div className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl mb-4 relative min-h-[160px] p-4 flex items-center shadow-inner overflow-hidden">
        {/* Marca d'água das coordenadas tracejadas */}
        {currentC.targetLayout}
        
        {/* Elemento de Flexbox dinâmico real */}
        <div 
          className="w-full flex transition-all duration-500 ease-out" 
          style={{ justifyContent: currentJustify }}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white shadow-md">A</div>
          <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center font-bold text-white shadow-md ml-2">B</div>
        </div>
      </div>

      {/* Seletor de Opções CSS */}
      <div className="flex flex-col gap-3 mb-4">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center">Propriedade: justify-content:</span>
        <div className="grid grid-cols-3 gap-2">
          {(["flex-start", "center", "flex-end"] as JustifyValue[]).map((val) => (
            <button
              key={val}
              disabled={validated}
              onClick={() => handleJustifyClick(val)}
              className={`py-2.5 px-2 rounded-xl border text-xs font-mono font-bold transition-all active:scale-98 ${
                currentJustify === val
                  ? "bg-indigo-500 border-indigo-400 text-white shadow-lg"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["space-between", "space-around"] as JustifyValue[]).map((val) => (
            <button
              key={val}
              disabled={validated}
              onClick={() => handleJustifyClick(val)}
              className={`py-2.5 px-2 rounded-xl border text-xs font-mono font-bold transition-all active:scale-98 ${
                currentJustify === val
                  ? "bg-indigo-500 border-indigo-400 text-white shadow-lg"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Placa */}
      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs font-bold text-slate-400">
          {feedback}
        </div>
      )}

      <button
        disabled={validated}
        onClick={handleValidate}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all text-sm disabled:opacity-40 disabled:pointer-events-none active:scale-98"
      >
        Confirmar Alinhamento
      </button>
    </div>
  );
}
