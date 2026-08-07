"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, Terminal } from "lucide-react";

interface OutputPredictorProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface Question {
  code: string;
  lang: "Python" | "JavaScript";
  correctAnswer: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    code: "x = 5\ny = '10'\nprint(x + int(y))",
    lang: "Python",
    correctAnswer: "15",
    options: ["15", "510", "Error", "5"]
  },
  {
    code: "let a = '5';\nlet b = 5;\nconsole.log(a + b);",
    lang: "JavaScript",
    correctAnswer: "55",
    options: ["55", "10", "undefined", "Error"]
  },
  {
    code: "texto = 'EREM'\nprint(len(texto))",
    lang: "Python",
    correctAnswer: "4",
    options: ["4", "5", "0", "None"]
  },
  {
    code: "let total = 10;\ntotal += 5;\nconsole.log(total);",
    lang: "JavaScript",
    correctAnswer: "15",
    options: ["15", "10", "5", "105"]
  },
  {
    code: "lista = [10, 20]\nlista.append(30)\nprint(len(lista))",
    lang: "Python",
    correctAnswer: "3",
    options: ["3", "2", "30", "1"]
  },
  {
    code: "let x = 10;\nlet y = 3;\nconsole.log(x % y);",
    lang: "JavaScript",
    correctAnswer: "1",
    options: ["1", "3", "0", "3.33"]
  },
  {
    code: "texto = 'Python'\nprint(texto.lower())",
    lang: "Python",
    correctAnswer: "python",
    options: ["python", "PYTHON", "Python", "py"]
  }
];

export default function OutputPredictor({
  onGameOver,
  playSound
}: OutputPredictorProps) {
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
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
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
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
          <Terminal className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Detetive do Console</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Analise a execução do código de 2 a 3 linhas e descubra qual será o resultado exato 
          impresso no console/tela!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold hover:shadow-lg hover:shadow-teal-500/20 transition-all flex items-center gap-2"
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
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">O que este código exibe?</span>
      </div>

      {/* Caixa do Terminal */}
      <div className="flex-1 flex flex-col bg-slate-950 border border-slate-850 rounded-2xl mb-6 shadow-inner overflow-hidden p-6 min-h-[140px] justify-center relative">
        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-700 pointer-events-none uppercase">
          Terminal Console
        </div>
        <pre className="text-left font-mono text-sm sm:text-base text-slate-350 whitespace-pre-wrap select-none leading-relaxed">
          {currentQ.code}
        </pre>
      </div>

      {/* Grid de Alternativas */}
      <div className="grid grid-cols-2 gap-3">
        {currentOptions.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick(opt)}
            className="py-4 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 text-white font-mono text-center transition-all text-sm font-semibold active:scale-98"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
