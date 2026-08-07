"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, Layout, HelpCircle } from "lucide-react";

interface HTMLStructurerProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface StructQuestion {
  title: string;
  correctSequence: string[];
}

const QUESTIONS: StructQuestion[] = [
  {
    title: "Monte a estrutura básica externa de um site HTML",
    correctSequence: ["<html>", "<head>", "</head>", "<body>", "</body>", "</html>"]
  },
  {
    title: "Monte um Link Semântico apontando para o Google",
    correctSequence: ['<a href="https://google.com">', "Acessar o site", "</a>"]
  },
  {
    title: "Crie uma Lista Não Ordenada com 2 Itens",
    correctSequence: ["<ul>", "<li>Item 1</li>", "<li>Item 2</li>", "</ul>"]
  },
  {
    title: "Monte um Título e um Parágrafo agrupados",
    correctSequence: ["<div>", "<h1>Titulo</h1>", "<p>Texto</p>", "</div>"]
  }
];

export default function HTMLStructurer({
  onGameOver,
  playSound
}: HTMLStructurerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<StructQuestion[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [placedBlocks, setPlacedBlocks] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [validated, setValidated] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  const startTimeRef = useRef<number>(Date.now());

  const handleStart = () => {
    playSound("click");
    // Selecionar 3 aleatórias
    const questions = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 3);
    setShuffledQuestions(questions);
    setCurrentIndex(0);
    setScore(0);
    setFeedback("");
    setValidated(false);
    setIsPlaying(true);
    
    setupQuestion(questions[0]);
    startTimeRef.current = Date.now();
  };

  const setupQuestion = (q: StructQuestion) => {
    // Embaralhar blocos
    const shuf = [...q.correctSequence].sort(() => 0.5 - Math.random());
    setAvailableBlocks(shuf);
    setPlacedBlocks([]);
    setValidated(false);
    setFeedback("");
  };

  const handleAvailableClick = (block: string) => {
    if (validated) return;
    playSound("click");
    setAvailableBlocks((prev) => prev.filter((b) => b !== block));
    setPlacedBlocks((prev) => [...prev, block]);
  };

  const handlePlacedClick = (block: string) => {
    if (validated) return;
    playSound("click");
    setPlacedBlocks((prev) => prev.filter((b) => b !== block));
    setAvailableBlocks((prev) => [...prev, block]);
  };

  const handleValidate = () => {
    const currentQ = shuffledQuestions[currentIndex];
    
    if (placedBlocks.length < currentQ.correctSequence.length) {
      playSound("error");
      setFeedback("Selecione todas as tags para montar o quebra-cabeça HTML!");
      return;
    }

    setValidated(true);
    const isCorrect = JSON.stringify(placedBlocks) === JSON.stringify(currentQ.correctSequence);

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1500); // 1500 por acerto
      setFeedback("HTML estruturado corretamente!");
    } else {
      playSound("error");
      setFeedback("Incorreto. A estrutura HTML semântica foi exibida.");
      setPlacedBlocks(currentQ.correctSequence); // gabarito
    }

    setTimeout(() => {
      if (currentIndex < shuffledQuestions.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setupQuestion(shuffledQuestions[nextIdx]);
      } else {
        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const finalScore = score + (isCorrect ? 1500 : 0);
        onGameOver(finalScore, duration);
      }
    }, 4000);
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4">
          <Layout className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Quebra-Cabeça HTML</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Coloque as tags HTML na ordem hierárquica e semântica correta clicando nos blocos abaixo. 
          Cuidado com a ordem de abertura e fechamento das tags!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all flex items-center gap-2"
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
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 text-sm text-slate-400">
        <span>Desafio {currentIndex + 1} de 3</span>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      <div className="text-center mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Desafio do Código:</span>
        <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">{currentQ.title}</h4>
      </div>

      {/* Container de Tags Montadas */}
      <div className="flex-1 flex flex-col gap-2 p-5 bg-slate-950 border border-slate-850 rounded-xl mb-4 min-h-[160px] justify-center">
        {placedBlocks.length === 0 ? (
          <div className="text-center text-xs text-slate-600 font-semibold select-none py-8">
            Monte a hierarquia clicando nas tags de baixo...
          </div>
        ) : (
          <div className="flex flex-col gap-1 font-mono text-xs sm:text-sm text-left select-none max-w-xs mx-auto w-full">
            {placedBlocks.map((block, idx) => {
              // Recuar tags aninhadas visualmente para simular identação
              const isClosed = block.startsWith("</") || block.endsWith("</html>") || block.endsWith("</body>") || block.endsWith("</head>") || block.endsWith("</ul>") || block.endsWith("</div>");
              const isChild = idx > 0 && idx < placedBlocks.length - 1 && !isClosed;
              const indent = isChild ? "pl-4 text-sky-400" : "text-white";

              return (
                <button
                  key={idx}
                  disabled={validated}
                  onClick={() => handlePlacedClick(block)}
                  className={`text-left font-bold transition-all py-1 px-2 rounded hover:bg-slate-900 ${indent}`}
                >
                  {block}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Blocos Disponíveis */}
      {availableBlocks.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-850/50 mb-4 min-h-[50px] items-center">
          {availableBlocks.map((block, idx) => (
            <button
              key={idx}
              disabled={validated}
              onClick={() => handleAvailableClick(block)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 hover:bg-slate-850 text-white font-mono text-xs font-bold text-center transition-all active:scale-98"
            >
              {block}
            </button>
          ))}
        </div>
      )}

      {/* Placa de Feedback */}
      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs font-bold text-slate-400">
          {feedback}
        </div>
      )}

      <button
        disabled={validated || placedBlocks.length === 0}
        onClick={handleValidate}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all text-sm disabled:opacity-40 disabled:pointer-events-none active:scale-98"
      >
        Validar Estrutura
      </button>
    </div>
  );
}
