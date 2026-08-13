"use client";

import React, { useState, useRef } from "react";
import { Sparkles } from "lucide-react";

interface CSSSelectorHunterProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface Question {
  html: string;
  targetDesc: string;
  correct: string;
  options: string[];
}

function generateCSSQuestion(): Question {
  const templateType = Math.floor(Math.random() * 5);
  const classes = ["destaque", "alerta", "cartao", "texto", "info", "legenda", "ativo", "principal"];
  const ids = ["container", "menu", "alvo", "principal", "cadastro", "galeria", "topo", "rodape"];

  const randClass = classes[Math.floor(Math.random() * classes.length)];
  const randId = ids[Math.floor(Math.random() * ids.length)];

  let html = "";
  let targetDesc = "";
  let correct = "";
  let options: string[] = [];

  if (templateType === 0) {
    html = `<div id="${randId}">\n  <p className="${randClass}">Alvo</p>\n</div>`;
    targetDesc = `O parágrafo com a classe "${randClass}"`;
    correct = `.${randClass}`;
    options = [correct, `#${randClass}`, randClass, `div${randClass}`];
  } else if (templateType === 1) {
    html = `<div id="${randId}">\n  <a href="#">Link</a>\n</div>`;
    targetDesc = `O link dentro da div com ID "${randId}"`;
    correct = `#${randId} a`;
    options = [correct, `.${randId} a`, `a #${randId}`, `${randId} > a`];
  } else if (templateType === 2) {
    html = `<ul>\n  <li>Item 1</li>\n  <li id="${randId}">Item 2</li>\n</ul>`;
    targetDesc = `O segundo item da lista com o ID "${randId}"`;
    correct = `#${randId}`;
    options = [correct, `.${randId}`, `li .${randId}`, `ul li.${randId}`];
  } else if (templateType === 3) {
    html = `<div className="${randClass}">\n  <h1>Titulo</h1>\n</div>`;
    targetDesc = `O título h1 dentro da div com a classe "${randClass}"`;
    correct = `.${randClass} h1`;
    options = [correct, `#${randClass} h1`, `h1.${randClass}`, `${randClass} > h1`];
  } else {
    html = `<main>\n  <section id="${randId}">\n    <p>Alvo</p>\n  </section>\n</main>`;
    targetDesc = `O parágrafo dentro da section com ID "${randId}"`;
    correct = `#${randId} p`;
    options = [correct, `.${randId} p`, `section p`, `main ${randId} p`];
  }

  return { html, targetDesc, correct, options };
}

export default function CSSSelectorHunter({
  onGameOver,
  playSound
}: CSSSelectorHunterProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const isFinishedRef = React.useRef(false);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    if (isFinishedRef) isFinishedRef.current = false;
    playSound("click");
    // Gerar 5 questões procedurais
    const qList: Question[] = [];
    for (let i = 0; i < 5; i++) {
      qList.push(generateCSSQuestion());
    }
    setShuffledQuestions(qList);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsPlaying(true);
    
    // Configurar opções para a primeira pergunta
    setupQuestion(qList[0]);
    startTimeRef.current = new Date().getTime();
  };

  const setupQuestion = (q: Question) => {
    // Embaralhar as alternativas
    const opts = [...q.options].sort(() => 0.5 - Math.random());
    setCurrentOptions(opts);
  };

  const handleOptionClick = (option: string) => {
    if (isFinishedRef.current) return;
    const currentQ = shuffledQuestions[currentQuestionIndex];
    const isCorrect = option === currentQ.correct;

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
    } else {
      playSound("error");
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setupQuestion(shuffledQuestions[nextIndex]);
    } else {
      // Concluiu as 5 perguntas
      const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
      // Bônus proporcional aos acertos
      const finalScore = score + (isCorrect ? 1000 : 0);
      isFinishedRef.current = true;
      onGameOver(finalScore, duration);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Mestre dos Seletores CSS</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Observe a estrutura HTML e o elemento alvo destacado. Escolha o seletor CSS correto 
          para selecionar o alvo correspondente.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          Iniciar Partida
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentQuestionIndex];

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-xl mx-auto w-full">
      {/* Placa de Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6 text-sm text-slate-400">
        <span>Desafio {currentQuestionIndex + 1} de 5</span>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      {/* Instruções do Alvo */}
      <div className="mb-4 text-center">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Selecione:</span>
        <h4 className="text-base sm:text-lg font-bold text-white bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl inline-block max-w-full">
          {currentQ.targetDesc}
        </h4>
      </div>

      {/* Editor HTML Simplificado */}
      <div className="flex-1 flex flex-col bg-slate-950/80 border border-slate-850/60 rounded-xl mb-6 shadow-inner relative overflow-hidden p-4 min-h-[160px] justify-center">
        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-700 pointer-events-none uppercase">
          Efetivo HTML
        </div>
        <pre className="text-left font-mono text-sm text-slate-400 whitespace-pre-wrap select-none leading-relaxed">
          {currentQ.html}
        </pre>
      </div>

      {/* Grid de Opções */}
      <div className="grid grid-cols-2 gap-3">
        {currentOptions.map((opt, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(opt)}
            className="py-4 px-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 text-white font-mono text-center transition-all shadow-md focus:outline-none text-sm font-semibold active:scale-98"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
