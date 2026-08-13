"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Terminal } from "lucide-react";

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

function generateOutputQuestion(): Question {
  const templateType = Math.floor(Math.random() * 6);
  const varNames = [["x", "y"], ["a", "b"], ["num1", "num2"], ["total", "valor"]][Math.floor(Math.random() * 4)];
  const wordsPool = ["EREM", "Python", "Portal", "Escola", "Trilha", "Codigo", "Tech"];

  let code = "";
  let lang: "Python" | "JavaScript" = "Python";
  let correctAnswer = "";
  let options: string[] = [];

  if (templateType === 0) {
    lang = "Python";
    const num1 = Math.floor(Math.random() * 15) + 1;
    const num2 = Math.floor(Math.random() * 15) + 1;
    const isStringConcatenation = Math.random() > 0.5;

    if (isStringConcatenation) {
      code = `${varNames[0]} = '${num1}'\n${varNames[1]} = '${num2}'\nprint(${varNames[0]} + ${varNames[1]})`;
      correctAnswer = `${num1}${num2}`;
      options = [correctAnswer, String(num1 + num2), "Error", `${num1} + ${num2}`];
    } else {
      code = `${varNames[0]} = ${num1}\n${varNames[1]} = '${num2}'\nprint(${varNames[0]} + int(${varNames[1]}))`;
      correctAnswer = String(num1 + num2);
      options = [correctAnswer, `${num1}${num2}`, "Error", String(num1)];
    }
  } else if (templateType === 1) {
    lang = "JavaScript";
    const num1 = Math.floor(Math.random() * 15) + 1;
    const num2 = Math.floor(Math.random() * 15) + 1;
    const isString = Math.random() > 0.5;

    if (isString) {
      code = `let ${varNames[0]} = '${num1}';\nlet ${varNames[1]} = ${num2};\nconsole.log(${varNames[0]} + ${varNames[1]});`;
      correctAnswer = `${num1}${num2}`;
      options = [correctAnswer, String(num1 + num2), "Error", "undefined"];
    } else {
      code = `let ${varNames[0]} = ${num1};\nlet ${varNames[1]} = ${num2};\nconsole.log(${varNames[0]} + ${varNames[1]});`;
      correctAnswer = String(num1 + num2);
      options = [correctAnswer, `${num1}${num2}`, "Error", "NaN"];
    }
  } else if (templateType === 2) {
    lang = "Python";
    const word = wordsPool[Math.floor(Math.random() * wordsPool.length)];
    code = `texto = '${word}'\nprint(len(texto))`;
    correctAnswer = String(word.length);
    options = [correctAnswer, String(word.length + 1), "0", "None"];
  } else if (templateType === 3) {
    lang = "JavaScript";
    const num1 = Math.floor(Math.random() * 20) + 5;
    const num2 = Math.floor(Math.random() * 10) + 1;
    code = `let total = ${num1};\ntotal += ${num2};\nconsole.log(total);`;
    correctAnswer = String(num1 + num2);
    options = [correctAnswer, String(num1), String(num2), `${num1}${num2}`];
  } else if (templateType === 4) {
    lang = "JavaScript";
    const num1 = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
    const num2 = [3, 4, 6, 7][Math.floor(Math.random() * 4)];
    code = `let x = ${num1};\nlet y = ${num2};\nconsole.log(x % y);`;
    correctAnswer = String(num1 % num2);
    options = [correctAnswer, String(Math.floor(num1 / num2)), "0", String((num1 / num2).toFixed(2))];
  } else {
    lang = "Python";
    const word = wordsPool[Math.floor(Math.random() * wordsPool.length)];
    const isUpper = Math.random() > 0.5;
    if (isUpper) {
      code = `texto = '${word}'\nprint(texto.upper())`;
      correctAnswer = word.toUpperCase();
      options = [correctAnswer, word.toLowerCase(), word, "Error"];
    } else {
      code = `texto = '${word}'\nprint(texto.lower())`;
      correctAnswer = word.toLowerCase();
      options = [correctAnswer, word.toUpperCase(), word, "Error"];
    }
  }

  const uniqueOptions = Array.from(new Set(options));
  while (uniqueOptions.length < 4) {
    uniqueOptions.push(String(Math.floor(Math.random() * 100)));
  }

  return {
    code,
    lang,
    correctAnswer,
    options: uniqueOptions
  };
}

export default function OutputPredictor({
  onGameOver,
  playSound
}: OutputPredictorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const isFinishedRef = React.useRef(false);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    if (isFinishedRef) isFinishedRef.current = false;
    playSound("click");
    // Gerar 5 questões procedurais
    const questions: Question[] = [];
    for (let i = 0; i < 5; i++) {
      questions.push(generateOutputQuestion());
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
    if (isFinishedRef.current) return;
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
      const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
      const finalScore = score + (isCorrect ? 1000 : 0);
      isFinishedRef.current = true;
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
