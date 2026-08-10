"use client";

import React, { useState, useRef } from "react";
import { HelpCircle, BrainCircuit } from "lucide-react";
import perguntasBanco from "./perguntas-banco.json";

interface QuizTeoricoProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
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
  playSound
}: QuizTeoricoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    playSound("click");
    
    // Sortear 10 perguntas aleatórias do banco garantindo textos base únicos
    const allQ = perguntasBanco.questions;
    const shuffled = [...allQ].sort(() => 0.5 - Math.random());
    
    const uniqueQuestions: Question[] = [];
    const seenTexts = new Set<string>();

    for (const q of shuffled) {
      // Remover a string "(Var X)" para identificar a pergunta base real
      const baseText = q.question.replace(/\s*\(Var \d+\)/i, "").trim().toLowerCase();
      if (!seenTexts.has(baseText)) {
        seenTexts.add(baseText);
        // Ocultar a variação no texto final exibido para o aluno
        const cleanQuestion = { ...q, question: q.question.replace(/\s*\(Var \d+\)/i, "") };
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
    const currentQ = shuffledQuestions[currentIndex];
    const isCorrect = option === currentQ.answer;

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
    } else {
      playSound("error");
    }

    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Fim do jogo
      const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
      const finalScore = score + (isCorrect ? 1000 : 0);
      onGameOver(finalScore, duration);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-4 shadow-lg shadow-fuchsia-500/10">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Quiz Teórico Infinito</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Teste seus conhecimentos em Hardware, Software, Algoritmos, Python, JS, HTML e CSS.
          O banco contém milhares de perguntas para você praticar!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all flex items-center gap-2 active:scale-95"
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
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">
            {currentQ.theme}
          </span>
          <span>Questão {currentIndex + 1} de 10</span>
        </div>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      {/* Caixa da Pergunta */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl mb-6 shadow-inner p-6 justify-center text-center min-h-[140px]">
        <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {currentQ.question.replace(/\s*\(Var \d+\)/, '')}
        </h2>
      </div>

      {/* Grid de Alternativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(opt)}
            className="py-4 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-fuchsia-500/50 hover:bg-slate-900 text-white text-center transition-all text-sm font-medium active:scale-98 shadow-sm flex items-center justify-center min-h-[80px]"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
