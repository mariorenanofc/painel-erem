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

const QUESTIONS: Question[] = [
  {
    html: '<div id="container">\n  <p className="texto">Alvo</p>\n</div>',
    targetDesc: 'O parágrafo com a classe "texto"',
    correct: ".texto",
    options: [".texto", "#texto", "texto", "divtexto"]
  },
  {
    html: '<div id="menu">\n  <a href="#">Link</a>\n</div>',
    targetDesc: 'O link dentro da div com ID "menu"',
    correct: "#menu a",
    options: ["#menu a", ".menu a", "a #menu", "menu > a"]
  },
  {
    html: '<ul>\n  <li>Item 1</li>\n  <li id="alvo">Item 2</li>\n</ul>',
    targetDesc: 'O segundo item da lista com o ID "alvo"',
    correct: "#alvo",
    options: ["#alvo", ".alvo", "li .alvo", "ul li.alvo"]
  },
  {
    html: '<div className="cartao">\n  <h1>Titulo</h1>\n</div>',
    targetDesc: 'O título h1 dentro da div com a classe "cartao"',
    correct: ".cartao h1",
    options: [".cartao h1", "#cartao h1", "h1.cartao", "cartao > h1"]
  },
  {
    html: '<div>\n  <span>Texto comum</span>\n  <span className="destaque">Alvo</span>\n</div>',
    targetDesc: 'O elemento span que possui a classe "destaque"',
    correct: "span.destaque",
    options: ["span.destaque", "span .destaque", "span#destaque", "#destaque span"]
  },
  {
    html: '<main>\n  <section id="topo">\n    <p>Alvo</p>\n  </section>\n</main>',
    targetDesc: 'O parágrafo dentro da section com ID "topo"',
    correct: "#topo p",
    options: ["#topo p", ".topo p", "section p", "main topo p"]
  },
  {
    html: '<footer className="rodape">\n  <p>Alvo</p>\n</footer>',
    targetDesc: 'O parágrafo dentro do footer com a classe "rodape"',
    correct: ".rodape p",
    options: [".rodape p", "#rodape p", "footer p.rodape", "rodape > p"]
  }
];

export default function CSSSelectorHunter({
  onGameOver,
  playSound
}: CSSSelectorHunterProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    playSound("click");
    // Embaralhar perguntas e selecionar 5
    const qList = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setShuffledQuestions(qList);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsPlaying(true);
    
    // Configurar opções para a primeira pergunta
    setupQuestion(qList[0]);
    startTimeRef.current = Date.now();
  };

  const setupQuestion = (q: Question) => {
    // Embaralhar as alternativas
    const opts = [...q.options].sort(() => 0.5 - Math.random());
    setCurrentOptions(opts);
  };

  const handleOptionClick = (option: string) => {
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
      const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      // Bônus proporcional aos acertos
      const finalScore = score + (isCorrect ? 1000 : 0);
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
