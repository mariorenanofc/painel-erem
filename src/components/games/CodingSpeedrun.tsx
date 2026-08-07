"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles } from "lucide-react";

interface CodingSpeedrunProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

const SNIPPETS = [
  { code: 'print("Ola, Estudante")', lang: "Python" },
  { code: "if nota >= 6:", lang: "Python" },
  { code: 'lista.append("item")', lang: "Python" },
  { code: "for i in range(5):", lang: "Python" },
  { code: "const total = 10;", lang: "JavaScript" },
  { code: 'document.getElementById("btn")', lang: "JavaScript" },
  { code: "let ativo = true;", lang: "JavaScript" },
  { code: "def somar(a, b):", lang: "Python" },
  { code: "class Aluno:", lang: "Python" },
  { code: "const [x, setX] = useState(0);", lang: "JavaScript" }
];

export default function CodingSpeedrun({
  onGameOver,
  playSound
}: CodingSpeedrunProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSnippetIndex, setCurrentSnippetIndex] = useState(0);
  const [currentCodeList, setCurrentCodeList] = useState<typeof SNIPPETS>([]);
  const [typedText, setTypedText] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 segundos
  const [totalKeysTyped, setTotalKeysTyped] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Iniciar jogo e selecionar 5 códigos aleatórios
  const handleStart = () => {
    playSound("click");
    
    // Embaralhar e selecionar 5
    const shuffled = [...SNIPPETS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setCurrentCodeList(shuffled);
    setCurrentSnippetIndex(0);
    setTypedText("");
    setTimeRemaining(60);
    setTotalKeysTyped(0);
    setErrorsCount(0);
    setIsPlaying(true);
    
    startTimeRef.current = new Date().getTime();
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.min(60, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
    
    // Calcular pontuação final
    const accuracy = totalKeysTyped > 0 ? Math.max(0, (totalKeysTyped - errorsCount) / totalKeysTyped) : 0;
    const finalScore = Math.round(totalKeysTyped * 10 * accuracy);
    
    onGameOver(finalScore, duration);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const currentCode = currentCodeList[currentSnippetIndex].code;
    
    // Impedir digitação que exceda o tamanho do snippet
    if (inputVal.length > currentCode.length) return;

    setTypedText(inputVal);
    setTotalKeysTyped((prev) => prev + 1);

    // Verificar se o último caractere digitado está incorreto
    const lastCharIndex = inputVal.length - 1;
    if (lastCharIndex >= 0 && inputVal[lastCharIndex] !== currentCode[lastCharIndex]) {
      setErrorsCount((prev) => prev + 1);
      playSound("error");
    } else {
      playSound("click");
    }

    // Se completou a linha atual com sucesso
    if (inputVal === currentCode) {
      playSound("success");
      setTypedText("");
      
      if (currentSnippetIndex < currentCodeList.length - 1) {
        setCurrentSnippetIndex((prev) => prev + 1);
      } else {
        // Concluiu todos os 5 snippets
        if (timerRef.current) clearInterval(timerRef.current);
        const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
        
        const accuracy = totalKeysTyped > 0 ? Math.max(0, (totalKeysTyped - errorsCount) / totalKeysTyped) : 1;
        const finalScore = Math.round(totalKeysTyped * 15 * accuracy) + 1000; // bônus de conclusão
        
        onGameOver(finalScore, duration);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
          <Play className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Digitação Rápida (Coding Speedrun)</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Escreva os códigos exibidos na tela com o máximo de precisão e rapidez. 
          Complete os 5 códigos antes do tempo acabar para ganhar bônus!
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          Iniciar Partida
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentCode = currentCodeList[currentSnippetIndex].code;
  const currentLang = currentCodeList[currentSnippetIndex].lang;

  // Renderizar o código com realce visual dos caracteres digitados
  const renderHighlightedCode = () => {
    return (
      <code className="text-xl sm:text-2xl font-mono tracking-wide break-all block whitespace-pre-wrap select-none leading-relaxed">
        {currentCode.split("").map((char, index) => {
          let color = "text-slate-500";
          if (index < typedText.length) {
            color = typedText[index] === char ? "text-emerald-400" : "text-rose-400 bg-rose-950/40 rounded";
          }
          return (
            <span key={index} className={`${color} transition-all`}>
              {char}
            </span>
          );
        })}
      </code>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-2xl mx-auto w-full">
      {/* Placa de Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {currentLang}
          </span>
          <span>Desafio {currentSnippetIndex + 1} de 5</span>
        </div>
        <div className="font-bold flex items-center gap-1.5">
          Tempo: <span className={`${timeRemaining <= 10 ? "text-rose-400 animate-pulse" : "text-white"}`}>{timeRemaining}s</span>
        </div>
      </div>

      {/* Bloco de Código Target */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/80 border border-slate-850/60 rounded-xl mb-6 min-h-[120px] text-center shadow-inner relative overflow-hidden">
        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-700 pointer-events-none uppercase">
          Visão Geral
        </div>
        {renderHighlightedCode()}
      </div>

      {/* Entrada de Digitação */}
      <div className="w-full flex flex-col gap-2">
        <input
          ref={inputRef}
          type="text"
          value={typedText}
          onChange={handleInputChange}
          className="w-full py-4 px-5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-lg text-center"
          placeholder="Digite o código acima exatamente igual..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="text-[10px] text-slate-500 text-center select-none mt-1">
          Cuidado: Letras maiúsculas, minúsculas, aspas e parênteses devem coincidir perfeitamente.
        </div>
      </div>
    </div>
  );
}
