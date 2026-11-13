"use client";

import React, { useState, useRef } from "react";
import { HelpCircle, BrainCircuit } from "lucide-react";
import perguntasBanco from "./perguntas-banco.json";
import { fisherYatesShuffle } from "@/src/lib/fisherYates";

interface QuizTeoricoProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
  perderVida?: () => void;
}

interface Question {
  id: number;
  theme: string;
  question: string;
  options: string[];
  answer: string;
}

export default function QuizTeoricoInfinito({
  onGameOver,
  playSound,
  perderVida
}: QuizTeoricoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  const isFinishedRef = React.useRef(false);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    if (isFinishedRef) isFinishedRef.current = false;
    playSound("click");
    
    // Sortear 10 perguntas aleatórias do banco usando Fisher-Yates
    const allQ = perguntasBanco.questions;
    const shuffled = fisherYatesShuffle(allQ);
    
    const uniqueQuestions: Question[] = [];
    const seenTexts = new Set<string>();

    for (const q of shuffled) {
      // Remover a string "(Var X)" para identificar a pergunta base real
      const baseText = q.question.replace(/\s*\(Var \d+\)/i, "").trim().toLowerCase();
      if (!seenTexts.has(baseText)) {
        seenTexts.add(baseText);
        // Ocultar a variação e embaralhar as alternativas com Fisher-Yates
        const cleanQuestion = { 
          ...q, 
          question: q.question.replace(/\s*\(Var \d+\)/i, ""),
          options: fisherYatesShuffle([...q.options])
        };
        uniqueQuestions.push(cleanQuestion as Question);
      }
      if (uniqueQuestions.length === 10) break;
    }
    
    setShuffledQuestions(uniqueQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsPlaying(true);
    startTimeRef.current = new Date().getTime();
  };

  const handleOptionClick = (option: string) => {
    if (isFinishedRef.current) return;
    const currentQ = shuffledQuestions[currentIndex];
    const isCorrect = option === currentQ.answer;

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
    } else {
      if (perderVida) perderVida();
    }

    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Fim do jogo
      const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
      const finalScore = score + (isCorrect ? 1000 : 0);
      isFinishedRef.current = true;
      onGameOver(finalScore, duration);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-4 shadow-lg shadow-fuchsia-500/10">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Quiz Teórico Infinito</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-6">
          Teste seus conhecimentos em Hardware, Software, Algoritmos, Python, JS, HTML e CSS.
          O banco contém milhares de perguntas para você praticar!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all flex items-center gap-2 active:scale-95"
        >
          Iniciar Quiz
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentIndex];

  if (!currentQ) return null;

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-xl mx-auto w-full h-full relative z-10">
      {/* Cabeçalho do Quiz */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-6 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/25 text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {currentQ.theme}
          </span>
          <span>Questão {currentIndex + 1} de 10</span>
        </div>
        <span className="font-bold text-orange-600 dark:text-amber-400">Pontos: {score}</span>
      </div>

      {/* Caixa da Pergunta */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 shadow-sm p-6 justify-center text-center min-h-[140px]">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
          {currentQ.question.replace(/\s*\(Var \d+\)/, '')}
        </h2>
      </div>

      {/* Grid de Alternativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(opt)}
            className="py-4 px-4 rounded-xl bg-slate-50 hover:bg-orange-50/70 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 hover:border-orange-500 dark:border-slate-800 dark:hover:border-orange-500/50 text-slate-800 dark:text-white text-center transition-all text-sm font-bold active:scale-98 shadow-sm flex items-center justify-center min-h-[80px] cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
