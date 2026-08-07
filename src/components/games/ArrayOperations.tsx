"use client";

import React, { useState, useRef } from "react";
import { Sparkles, HelpCircle } from "lucide-react";

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

function generateArrayQuestion(): Question {
  const lang = Math.random() > 0.5 ? "Python" : "JavaScript";
  const itemsPool = [
    ["Maca", "Uva"],
    ["Lapis", "Caneta"],
    ["HTML", "CSS"],
    ["Pedro", "Ana"],
    ["Python", "Java"],
    ["Mouse", "Teclado"]
  ];
  const itemToAddPool = ["Laranja", "Borracha", "JS", "Luiz", "C++", "Monitor"];

  const initialArr = [...itemsPool[Math.floor(Math.random() * itemsPool.length)]];
  const initialStr = "[" + initialArr.map(x => `'${x}'`).join(", ") + "]";

  let operation = "";
  let correctAnswerArr = [...initialArr];

  if (lang === "JavaScript") {
    const opType = ["push", "pop", "shift", "unshift"][Math.floor(Math.random() * 4)];
    const targetItem = itemToAddPool[Math.floor(Math.random() * itemToAddPool.length)];

    if (opType === "push") {
      operation = `lista.push('${targetItem}')`;
      correctAnswerArr.push(targetItem);
    } else if (opType === "pop") {
      operation = `lista.pop()`;
      correctAnswerArr.pop();
    } else if (opType === "shift") {
      operation = `lista.shift()`;
      correctAnswerArr.shift();
    } else if (opType === "unshift") {
      operation = `lista.unshift('${targetItem}')`;
      correctAnswerArr.unshift(targetItem);
    }
  } else {
    // Python
    const opType = ["append", "pop", "remove", "insert"][Math.floor(Math.random() * 4)];
    const targetItem = itemToAddPool[Math.floor(Math.random() * itemToAddPool.length)];

    if (opType === "append") {
      operation = `lista.append('${targetItem}')`;
      correctAnswerArr.push(targetItem);
    } else if (opType === "pop") {
      operation = `lista.pop()`;
      correctAnswerArr.pop();
    } else if (opType === "remove") {
      const itemToRemove = initialArr[0];
      operation = `lista.remove('${itemToRemove}')`;
      correctAnswerArr = correctAnswerArr.filter(x => x !== itemToRemove);
    } else if (opType === "insert") {
      operation = `lista.insert(1, '${targetItem}')`;
      correctAnswerArr.splice(1, 0, targetItem);
    }
  }

  const correctAnswer = "[" + correctAnswerArr.map(x => `'${x}'`).join(", ") + "]";

  const optionsSet = new Set<string>();
  optionsSet.add(correctAnswer);

  const formatArr = (arr: string[]) => "[" + arr.map(x => `'${x}'`).join(", ") + "]";

  if (correctAnswerArr.length > 0) {
    const shuffled = [...correctAnswerArr].reverse();
    optionsSet.add(formatArr(shuffled));
  }
  optionsSet.add(initialStr);
  optionsSet.add("[]");
  const oppositeArr = [...initialArr];
  if (oppositeArr.length > 0) {
    oppositeArr.splice(0, 0, "Item");
    optionsSet.add(formatArr(oppositeArr));
  }

  while (optionsSet.size < 4) {
    optionsSet.add(formatArr([initialArr[0] || "Item", "Erro"]));
  }

  const options = Array.from(optionsSet);

  return {
    initial: initialStr,
    operation,
    lang,
    correctAnswer,
    options
  };
}

export default function ArrayOperations({
  onGameOver,
  playSound
}: ArrayOperationsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    playSound("click");
    // Gerar 5 questões procedurais
    const questions: Question[] = [];
    for (let i = 0; i < 5; i++) {
      questions.push(generateArrayQuestion());
    }
    setShuffledQuestions(questions);
    setCurrentIndex(0);
    setScore(0);
    setIsPlaying(true);
    setupQuestion(questions[0]);
    startTimeRef.current = new Date().getTime();
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
      const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
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
