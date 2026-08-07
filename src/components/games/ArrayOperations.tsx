"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, HelpCircle } from "lucide-react";

interface ArrayOperationsProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface Question {
  initial: string;
  operation: string;
  lang: "Python" | "JavaScript";
  correctAnswer: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    initial: "['Maca', 'Uva']",
    operation: "lista.append('Laranja')",
    lang: "Python",
    correctAnswer: "['Maca', 'Uva', 'Laranja']",
    options: ["['Maca', 'Uva', 'Laranja']", "['Laranja', 'Maca', 'Uva']", "['Maca', 'Laranja']", "['Uva', 'Laranja']"]
  },
  {
    initial: "['Lapis', 'Caneta']",
    operation: "lista.push('Borracha')",
    lang: "JavaScript",
    correctAnswer: "['Lapis', 'Caneta', 'Borracha']",
    options: ["['Lapis', 'Caneta', 'Borracha']", "['Borracha', 'Lapis', 'Caneta']", "['Caneta', 'Borracha']", "['Lapis', 'Borracha']"]
  },
  {
    initial: "['HTML', 'CSS', 'JS']",
    operation: "lista.pop()",
    lang: "JavaScript",
    correctAnswer: "['HTML', 'CSS']",
    options: ["['HTML', 'CSS']", "['CSS', 'JS']", "['HTML', 'JS']", "['JS']"]
  },
  {
    initial: "['Pedro', 'Ana', 'Luiz']",
    operation: "lista.remove('Ana')",
    lang: "Python",
    correctAnswer: "['Pedro', 'Luiz']",
    options: ["['Pedro', 'Luiz']", "['Ana', 'Luiz']", "['Pedro', 'Ana']", "[]"]
  },
  {
    initial: "['Uva', 'Banana']",
    operation: "lista.insert(1, 'Maca')",
    lang: "Python",
    correctAnswer: "['Uva', 'Maca', 'Banana']",
    options: ["['Uva', 'Maca', 'Banana']", "['Maca', 'Uva', 'Banana']", "['Uva', 'Banana', 'Maca']", "['Maca']"]
  },
  {
    initial: "['Java', 'Python']",
    operation: "lista.unshift('C++')",
    lang: "JavaScript",
    correctAnswer: "['C++', 'Java', 'Python']",
    options: ["['C++', 'Java', 'Python']", "['Java', 'Python', 'C++']", "['C++', 'Python']", "['Java', 'C++']"]
  },
  {
    initial: "[10, 20, 30]",
    operation: "lista.shift()",
    lang: "JavaScript",
    correctAnswer: "[20, 30]",
    options: ["[20, 30]", "[10, 20]", "[10, 30]", "[30]"]
  }
];

export default function ArrayOperations({
  onGameOver,
  playSound
}: ArrayOperationsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  
  const startTimeRef = useRef<number>(Date.now());

  const handleStart = () => {
    playSound("click");
    // Embaralhar e selecionar 5
    const questions = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setShuffledQuestions(questions);
    setCurrentIndex(0);
    setScore(0);
    setIsPlaying(true);
    setupQuestion(questions[0]);
    startTimeRef.current = Date.now();
  };

  const setupQuestion = (q: Question) => {
    const opts = [...q.options].sort(() => 0.5 - Math.random());
    setCurrentOptions(opts);
  };

  const handleOptionClick = (option: string) => {
    const currentQ = shuffledQuestions[currentIndex];
    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 por acerto
    } else {
      playSound("error");
    }

    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupQuestion(shuffledQuestions[nextIdx]);
    } else {
      // Fim do jogo
      const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const finalScore = score + (isCorrect ? 1000 : 0);
      onGameOver(finalScore, duration);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Desafio de Listas</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Observe a lista inicial e a operação (método) executado sobre ela. Descubra qual 
          será a lista resultante final!
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
          <span>Desafio {currentIndex + 1} de 5</span>
        </div>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      <div className="text-center mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Qual o resultado da operação?</span>
      </div>

      {/* Caixa do Código */}
      <div className="flex-1 flex flex-col bg-slate-950 border border-slate-850 rounded-2xl mb-6 shadow-inner overflow-hidden p-6 min-h-[140px] justify-center relative">
        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-700 pointer-events-none uppercase">
          List Engine
        </div>
        <div className="text-left font-mono text-sm sm:text-base leading-relaxed flex flex-col gap-2">
          <div>
            <span className="text-slate-500"># Lista inicial</span>
            <div className="text-white">lista = {currentQ.initial}</div>
          </div>
          <div>
            <span className="text-slate-500"># Operação</span>
            <div className="text-yellow-400">{currentQ.operation}</div>
          </div>
        </div>
      </div>

      {/* Grid de Alternativas */}
      <div className="grid grid-cols-2 gap-3">
        {currentOptions.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(opt)}
            className="py-4 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 text-white font-mono text-center transition-all text-sm font-semibold active:scale-98"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
