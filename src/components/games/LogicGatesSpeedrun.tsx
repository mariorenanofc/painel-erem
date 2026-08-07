"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, HelpCircle } from "lucide-react";

interface LogicGatesSpeedrunProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface Question {
  statement: string;
  lang: "Python" | "JavaScript";
  correctAnswer: boolean;
}

const QUESTIONS: Question[] = [
  { statement: "5 > 3 and 2 < 1", lang: "Python", correctAnswer: false },
  { statement: "5 > 3 || 2 < 1", lang: "JavaScript", correctAnswer: true },
  { statement: "not (10 == 10)", lang: "Python", correctAnswer: false },
  { statement: "!(4 === 4)", lang: "JavaScript", correctAnswer: false },
  { statement: "8 >= 8 and 4 != 2", lang: "Python", correctAnswer: true },
  { statement: "8 >= 8 && 4 !== 2", lang: "JavaScript", correctAnswer: true },
  { statement: "True or False", lang: "Python", correctAnswer: true },
  { statement: "true && false", lang: "JavaScript", correctAnswer: false },
  { statement: "not False", lang: "Python", correctAnswer: true },
  { statement: "!false", lang: "JavaScript", correctAnswer: true },
  { statement: "3 <= 2 or 5 > 1", lang: "Python", correctAnswer: true },
  { statement: "3 <= 2 || 5 > 1", lang: "JavaScript", correctAnswer: true },
  { statement: "10 != 5 and 3 == 3", lang: "Python", correctAnswer: true },
  { statement: "10 !== 5 && 3 === 3", lang: "JavaScript", correctAnswer: true }
];

export default function LogicGatesSpeedrun({
  onGameOver,
  playSound
}: LogicGatesSpeedrunProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(40); // 40 segundos totais
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const handleStart = () => {
    playSound("click");
    // Selecionar 10 aleatórias
    const questions = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 10);
    setShuffledQuestions(questions);
    setCurrentIndex(0);
    setScore(0);
    setTimeRemaining(40);
    setIsPlaying(true);
    
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.min(40, Math.round((Date.now() - startTimeRef.current) / 1000));
    onGameOver(score, duration);
  };

  const handleAnswer = (answer: boolean) => {
    const currentQ = shuffledQuestions[currentIndex];
    const isCorrect = answer === currentQ.correctAnswer;

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
    } else {
      playSound("error");
    }

    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Concluiu as 10 perguntas
      if (timerRef.current) clearInterval(timerRef.current);
      const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const finalScore = score + (isCorrect ? 1000 : 0);
      onGameOver(finalScore, duration);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Arena Tabela Verdade</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Resolva as operações relacionais e lógicas. Responda rapidamente se a expressão é 
          Verdadeira (True) ou Falsa (False) antes do tempo acabar!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          Iniciar Partida
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentIndex];

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-xl mx-auto w-full">
      {/* Placa de Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {currentQ.lang}
          </span>
          <span>Expressão {currentIndex + 1} de 10</span>
        </div>
        <div className="font-bold flex items-center gap-4">
          <span className="text-yellow-400">Pontos: {score}</span>
          <span className={`${timeRemaining <= 8 ? "text-rose-400 animate-pulse font-extrabold" : "text-white"}`}>Tempo: {timeRemaining}s</span>
        </div>
      </div>

      {/* Caixa do Desafio */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-850 rounded-2xl mb-6 shadow-inner text-center relative overflow-hidden">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3 block">Esta expressão é True ou False?</span>
        <h4 className="text-2xl sm:text-3xl font-mono font-black text-white leading-relaxed select-none">
          {currentQ.statement}
        </h4>
      </div>

      {/* Botões de Aposta */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(true)}
          className="py-4 px-6 rounded-xl bg-emerald-950/20 border border-emerald-900/60 hover:bg-emerald-900/30 text-emerald-400 font-extrabold text-center transition-all text-sm uppercase tracking-wide active:scale-98"
        >
          Verdadeiro (True)
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="py-4 px-6 rounded-xl bg-rose-950/20 border border-rose-900/60 hover:bg-rose-900/30 text-rose-400 font-extrabold text-center transition-all text-sm uppercase tracking-wide active:scale-98"
        >
          Falso (False)
        </button>
      </div>
    </div>
  );
}
