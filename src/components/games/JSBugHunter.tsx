"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Bug } from "lucide-react";

interface JSBugHunterProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface BugQuestion {
  lines: string[];
  errorLineIndex: number;
  explanation: string;
}

const QUESTIONS: BugQuestion[] = [
  {
    lines: [
      "let nome = 'Pedro';",
      "if (nome == 'Pedro')", // bug: falta abrir chaves { ou parêntese incorreto? Não, falta chaves {
      "  console.log('Ola');"
    ],
    errorLineIndex: 1,
    explanation: "Falta abrir as chaves '{' na condição if em JavaScript."
  },
  {
    lines: [
      "x = 10",
      "if x == 10", // bug: falta os dois pontos ':'
      "  print('Igual')"
    ],
    errorLineIndex: 1,
    explanation: "Em Python, toda estrutura if deve terminar com dois pontos ':'."
  },
  {
    lines: [
      "funcion somar(a, b) {", // bug: 'funcion' em vez de 'function'
      "  return a + b;",
      "}"
    ],
    errorLineIndex: 0,
    explanation: "A palavra-chave correta em JavaScript é 'function', não 'funcion'."
  },
  {
    lines: [
      "let frutas = ['Uva', 'Maca'];",
      "frutas.apend('Laranja');", // bug: 'apend' em vez de 'push' (ou append em python)
      "console.log(frutas);"
    ],
    errorLineIndex: 1,
    explanation: "Em JavaScript, o método de adicionar elementos no array é 'push()', e não 'apend()'."
  },
  {
    lines: [
      "def saudar(nome)", // bug: falta ':'
      "  print('Oi ' + nome)",
      "saudar('Carlos')"
    ],
    errorLineIndex: 0,
    explanation: "Falta definir os dois pontos ':' ao criar a função 'def saudar(nome):' em Python."
  },
  {
    lines: [
      "let ativo = true;",
      "if (ativo = false) {", // bug: usando atribuição '=' em vez de comparação '===' ou '=='
      "  console.log('Inativo');",
      "}"
    ],
    errorLineIndex: 1,
    explanation: "A atribuição '=' altera o valor. Para comparar, deve-se usar '==' ou '==='."
  },
  {
    lines: [
      "texto = \"Ola Mundo'", // bug: aspas misturadas \" e '
      "print(texto)"
    ],
    errorLineIndex: 0,
    explanation: "As aspas devem coincidir no início e fim da String: use \"...\" ou '...'."
  }
];

export default function JSBugHunter({
  onGameOver,
  playSound
}: JSBugHunterProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<BugQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    playSound("click");
    // Embaralhar e pegar 5 perguntas
    const questions = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setShuffledQuestions(questions);
    setCurrentIndex(0);
    setScore(0);
    setFeedbackMsg("");
    setSelectedLine(null);
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  };

  const handleLineClick = (lineIdx: number) => {
    if (selectedLine !== null) return; // Aguardar feedback anterior sumir

    const currentQ = shuffledQuestions[currentIndex];
    const isCorrect = lineIdx === currentQ.errorLineIndex;

    setSelectedLine(lineIdx);

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
      setFeedbackMsg("Correto! " + currentQ.explanation);
    } else {
      playSound("error");
      setFeedbackMsg("Incorreto. A linha com erro era a " + (currentQ.errorLineIndex + 1) + ". " + currentQ.explanation);
    }

    // Passar para a próxima pergunta após 3 segundos
    setTimeout(() => {
      setSelectedLine(null);
      setFeedbackMsg("");
      
      if (currentIndex < shuffledQuestions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Concluiu todas as 5
        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const finalScore = score + (isCorrect ? 1000 : 0);
        onGameOver(finalScore, duration);
      }
    }, 3200);
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <Bug className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Caçador de Bugs Simples</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Analise o bloco de código de 3 linhas. Uma delas contém um erro de sintaxe ou digitação. 
          Toque diretamente sobre a linha que tem o bug!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-650 text-white font-bold hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center gap-2"
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
        <span>Código {currentIndex + 1} de 5</span>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      <div className="text-center mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Instrução:</span>
        <p className="text-sm text-slate-300 font-medium">Toque sobre a linha que possui o erro de sintaxe.</p>
      </div>

      {/* Editor Interativo de Linhas */}
      <div className="flex-1 flex flex-col justify-center bg-slate-950 border border-slate-850 rounded-2xl mb-6 shadow-inner overflow-hidden p-4 min-h-[160px]">
        <div className="flex flex-col gap-1 font-mono text-sm sm:text-base text-left select-none">
          {currentQ.lines.map((line, idx) => {
            let lineBg = "hover:bg-slate-900 border-transparent";
            
            if (selectedLine !== null) {
              if (idx === currentQ.errorLineIndex) {
                lineBg = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400";
              } else if (idx === selectedLine) {
                lineBg = "bg-rose-950/40 border-rose-500/50 text-rose-400";
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedLine !== null}
                onClick={() => handleLineClick(idx)}
                className={`w-full text-left py-3.5 px-4 rounded-xl border flex items-start gap-4 transition-all ${lineBg}`}
              >
                <span className="text-slate-600 font-bold select-none w-4">{idx + 1}</span>
                <span className="whitespace-pre-wrap break-all flex-1">{line}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Placa de Explicação / Feedback */}
      <div className="min-h-[64px] flex items-center justify-center p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 text-center text-xs font-semibold text-slate-300">
        {feedbackMsg || "Clique em uma linha acima para inspecionar..."}
      </div>
    </div>
  );
}
