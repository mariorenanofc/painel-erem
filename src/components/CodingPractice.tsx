"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Atividade } from "@/src/types";

interface CodingPracticeProps {
  missaoAberta: Atividade;
  onClose: () => void;
  onEnviar: (respostaFinal: string, xpCalculado: number) => Promise<void>;
  enviando: boolean;
}

interface LineChar {
  char: string;
  absIdx: number;
}

interface TargetCodeLine {
  lineIdx: number;
  chars: LineChar[];
}


export interface CachedAtividade {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: number;
  tipo: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  respostaCorreta?: string;
  linkClassroom: string;
  imageUrl: string;
  modulo: string;
  gabarito: string;
  gabaritoLiberado: boolean;
  resolucaoTyping: string;
  limiteTempoTyping: number;
  turmaAlvo: string;
}

// 🔥 FUNÇÃO DE HIGHLIGHT SINTÁTICO PARA IDE PREMIUM COM SUPORTE A TEMAS CUSTOMIZADOS
function getSyntaxHighlightClass(char: string, absIdx: number, code: string, theme: "vscode" | "hacker" | "cyberpunk"): string {
  // 1. Comments
  let isComment = false;
  for (let i = absIdx; i >= 0; i--) {
    if (code[i] === "\n") break;
    if (i > 0 && code[i-1] === "/" && code[i] === "/") {
      isComment = true;
      break;
    }
  }
  
  if (isComment) {
    if (theme === "hacker") return "text-green-800 font-normal opacity-80";
    if (theme === "cyberpunk") return "text-pink-900/60 font-normal opacity-70";
    return "text-slate-500/80 font-normal";
  }

  // 2. Strings
  let isString = false;
  let quoteChar = "";
  for (let i = 0; i < absIdx; i++) {
    if ((code[i] === '"' || code[i] === "'" || code[i] === "`") && (i === 0 || code[i-1] !== "\\")) {
      if (quoteChar === "") {
        quoteChar = code[i];
      } else if (quoteChar === code[i]) {
        quoteChar = "";
      }
    }
  }
  if (quoteChar !== "") isString = true;

  if (isString) {
    if (theme === "hacker") return "text-emerald-400 font-bold";
    if (theme === "cyberpunk") return "text-yellow-300 font-bold";
    return "text-amber-350 font-medium";
  }

  // 3. Numbers
  if (/[0-9]/.test(char)) {
    if (theme === "hacker") return "text-green-300 font-mono";
    if (theme === "cyberpunk") return "text-cyan-300 font-mono";
    return "text-cyan-400 font-mono";
  }

  // 4. Operators and Brackets
  if (/[+\-*/%&|=!<>?:~^{}[\]()]/.test(char)) {
    if (theme === "hacker") return "text-green-400 font-bold";
    if (theme === "cyberpunk") return "text-fuchsia-400 font-bold";
    return "text-pink-400 font-semibold";
  }

  // 5. Keywords
  let word = "";
  let wordStart = absIdx;
  while (wordStart > 0 && /[a-zA-Z0-9_$]/.test(code[wordStart - 1])) {
    wordStart--;
  }
  let wordEnd = absIdx;
  while (wordEnd < code.length && /[a-zA-Z0-9_$]/.test(code[wordEnd])) {
    wordEnd++;
  }
  word = code.slice(wordStart, wordEnd);

  const keywords = [
    "const", "let", "var", "function", "return", "if", "else", "for", "while", 
    "class", "import", "export", "true", "false", "null", "undefined", "new", 
    "this", "default", "from", "async", "await", "try", "catch", "finally"
  ];

  if (keywords.includes(word)) {
    if (theme === "hacker") return "text-emerald-500 font-extrabold";
    if (theme === "cyberpunk") return "text-pink-450 font-extrabold";
    return "text-blue-400 font-bold";
  }

  // 6. Functions (words followed by a parenthesis)
  let nextIdx = wordEnd;
  while (nextIdx < code.length && /\s/.test(code[nextIdx])) {
    nextIdx++;
  }
  if (code[nextIdx] === "(") {
    if (theme === "hacker") return "text-green-200 font-semibold";
    if (theme === "cyberpunk") return "text-cyan-200 font-semibold";
    return "text-yellow-300 font-semibold";
  }

  // 7. HTML/CSS tags
  let isHtmlTag = false;
  let angleCount = 0;
  for (let i = 0; i < absIdx; i++) {
    if (code[i] === "<") angleCount++;
    else if (code[i] === ">") angleCount--;
  }
  if (angleCount > 0) isHtmlTag = true;
  if (isHtmlTag) {
    if (theme === "hacker") return "text-emerald-350";
    if (theme === "cyberpunk") return "text-teal-300";
    return "text-teal-400";
  }

  if (theme === "hacker") return "text-green-450";
  if (theme === "cyberpunk") return "text-fuchsia-350";
  return "text-slate-200";
}

// Checa se o caractere exige tecla Shift no layout ABNT2
function requiresShift(char: string): boolean {
  if (!char) return false;
  if (char !== char.toLowerCase() && /[a-zA-Z]/.test(char)) return true;
  const shiftChars = ['"', '!', '@', '#', '$', '%', '¨', '&', '*', '(', ')', '_', '+', '`', '{', '}', '|', ':', '<', '>', '?'];
  return shiftChars.includes(char);
}

// 🔥 WEB AUDIO API SYNTHESIZER FOR CLICK-CLACK MECHANICAL KEYBOARD SOUNDS
function playSynthesizedSound(type: "correct" | "error", muted: boolean) {
  if (muted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "correct") {
      // Tactile Mechanical click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } else {
      // Low tone warning buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(125, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    }
  } catch (err) {
    console.error("Synthesizer sound blocked or unsupported", err);
  }
}

export default function CodingPractice({
  missaoAberta,
  onClose,
  onEnviar,
  enviando,
}: CodingPracticeProps) {
  const targetCode = missaoAberta.resolucaoTyping || "";
  const timeLimitMinutes = Number(missaoAberta.limiteTempoTyping) || 15;
  const maxXP = Number(missaoAberta.xp) || 200;

  // Estados do Treino
  const [iniciado, setIniciado] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tecladoMinimizado, setTecladoMinimizado] = useState(false);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState<"vscode" | "hacker" | "cyberpunk">("vscode");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitMinutes * 60);
  const [extraSecondsUsed, setExtraSecondsUsed] = useState(0);
  const [inputFoco, setInputFoco] = useState(true);

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // CONSTRUÇÃO E MAPEAMENTO DA ESTRUTURA DE LINHAS (ESTILO IDE)
  let absoluteCharIndex = 0;
  const targetCodeLines: TargetCodeLine[] = targetCode.split("\n").map((lineText, lineIdx) => {
    const lineChars: LineChar[] = [];
    
    for (let i = 0; i < lineText.length; i++) {
      lineChars.push({
        char: lineText[i],
        absIdx: absoluteCharIndex++
      });
    }
    
    const isLastLine = lineIdx === targetCode.split("\n").length - 1;
    if (!isLastLine) {
      lineChars.push({
        char: "\n",
        absIdx: absoluteCharIndex++
      });
    }
    
    return {
      lineIdx: lineIdx + 1,
      chars: lineChars
    };
  });


  // Refs de controle de tela e cursor
  const lastErrorIndexRef = useRef<number>(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSpanRef = useRef<HTMLSpanElement>(null);

  // Efeito para checar progresso salvo no localStorage no mount
  useEffect(() => {
    const saveKey = `coding_practice_${missaoAberta.id}`;
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.iniciado && parsed.currentIndex > 0) {
          setHasSavedProgress(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [missaoAberta.id]);

  // Efeito para salvar progresso dinamicamente
  useEffect(() => {
    if (!iniciado || completed || pausado) return;
    const saveKey = `coding_practice_${missaoAberta.id}`;
    const state = {
      currentIndex,
      errorsCount,
      secondsRemaining,
      extraSecondsUsed,
      iniciado: true
    };
    localStorage.setItem(saveKey, JSON.stringify(state));
  }, [currentIndex, errorsCount, secondsRemaining, extraSecondsUsed, iniciado, completed, pausado, missaoAberta.id]);

  // Efeito para limpar localStorage na conclusão
  useEffect(() => {
    if (completed) {
      const saveKey = `coding_practice_${missaoAberta.id}`;
      localStorage.removeItem(saveKey);
    }
  }, [completed, missaoAberta.id]);

  // Efeito do Cronômetro
  useEffect(() => {
    if (!iniciado || completed || pausado) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          setExtraSecondsUsed((extra) => extra + 1);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [iniciado, completed, pausado]);

  // Efeito para auto-scrolar até o cursor de digitação de forma instantânea e leve
  useEffect(() => {
    if (iniciado && !pausado && currentSpanRef.current) {
      currentSpanRef.current.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [currentIndex, iniciado, pausado]);

  // Foco inicial
  useEffect(() => {
    if (iniciado && !pausado && inputRef.current) {
      inputRef.current.focus();
    }
  }, [iniciado, pausado]);

  // Recarrega o foco caso o usuário clique na área de digitação
  const resetFoco = () => {
    if (iniciado && !pausado && inputRef.current) {
      inputRef.current.focus();
      setInputFoco(true);
    }
  };

  // Calcular métricas adicionais (Acurácia & WPM)
  const accuracy = currentIndex === 0 
    ? 100 
    : Math.max(0, Math.round(((currentIndex - errorsCount) / currentIndex) * 100));

  const totalSecondsAllowed = timeLimitMinutes * 60;
  const elapsedSeconds = totalSecondsAllowed - secondsRemaining + extraSecondsUsed;
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = elapsedMinutes > 0.05 ? Math.round((currentIndex / 5) / elapsedMinutes) : 0;

  // Calcular XP Atual
  const extraMinutes = Math.floor(extraSecondsUsed / 60);
  const xpDescontoErros = errorsCount;
  const xpDescontoTempo = extraMinutes * 5;
  const floorXP = Math.ceil(maxXP * 0.1); // Piso mínimo de 10%
  const currentXP = Math.max(floorXP, maxXP - xpDescontoErros - xpDescontoTempo);

  // Obter tecla esperada atual
  const expectedChar = targetCode[currentIndex] || "";
  
  // Checar se o espaço atual é indentação
  let isExpectedSpaceIndentation = false;
  if (expectedChar === " ") {
    let isIndentation = true;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (targetCode[i] === "\n") break;
      if (targetCode[i] !== " ") {
        isIndentation = false;
        break;
      }
    }
    let spaceCount = 0;
    while (currentIndex + spaceCount < targetCode.length && targetCode[currentIndex + spaceCount] === " ") {
      spaceCount++;
    }
    if (isIndentation || spaceCount >= 2) {
      isExpectedSpaceIndentation = true;
    }
  }

  let expectedKeyName = expectedChar;
  if (expectedChar === "\n") expectedKeyName = "Enter";
  else if (expectedChar === "\t") expectedKeyName = "Tab";
  else if (expectedChar === " ") {
    expectedKeyName = isExpectedSpaceIndentation ? "Tab" : "Espaço";
  }

  // Se o caractere atual precisa de shift, adicionamos um guia visual no topo
  if (requiresShift(expectedChar) && expectedChar !== "\n" && expectedChar !== "\t") {
    expectedKeyName = `SHIFT + ${expectedChar.toUpperCase()}`;
  }

  // handleInput captura caracteres finais processados (inclui crases, acentos e caracteres complexos)
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!val) return;

    // Reseta o input oculto instantaneamente
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (completed || pausado) return;

    const typed = val;

    if (typed === expectedChar) {
      // ACERTO
      playSynthesizedSound("correct", muted);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (nextIndex >= targetCode.length) {
        setCompleted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      // ERRO
      playSynthesizedSound("error", muted);
      setShakeTrigger((prev) => prev + 1);
      if (lastErrorIndexRef.current !== currentIndex) {
        setErrorsCount((prev) => prev + 1);
        lastErrorIndexRef.current = currentIndex;
      }
    }
  };

  // handleKeyDown lida apenas com ações de controle de layout e teclas especiais (Enter, Tab e Backspace)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (completed || pausado) {
      e.preventDefault();
      return;
    }

    const key = e.key;

    // Desabilitar Backspace para impedir que o aluno apague o código correto
    if (key === "Backspace") {
      e.preventDefault();
      return;
    }

    // Desabilitar comportamento padrão do TAB para não mudar o foco do elemento
    if (key === "Tab") {
      e.preventDefault();
      
      // Caso 1: Próximo caractere é literalmente um TAB
      if (expectedChar === "\t") {
        playSynthesizedSound("correct", muted);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        if (nextIndex >= targetCode.length) {
          setCompleted(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        return;
      }
      
      // Caso 2: Próximo caractere é espaço, e é indentação
      if (expectedChar === " ") {
        let isIndentation = true;
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (targetCode[i] === "\n") break;
          if (targetCode[i] !== " ") {
            isIndentation = false;
            break;
          }
        }
        
        let spaceCount = 0;
        while (currentIndex + spaceCount < targetCode.length && targetCode[currentIndex + spaceCount] === " ") {
          spaceCount++;
        }
        
        if (isIndentation || spaceCount >= 2) {
          playSynthesizedSound("correct", muted);
          const nextIndex = currentIndex + spaceCount;
          setCurrentIndex(nextIndex);
          if (nextIndex >= targetCode.length) {
            setCompleted(true);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          return;
        }
      }
      
      // Erro se apertou TAB fora do lugar correto
      playSynthesizedSound("error", muted);
      setShakeTrigger((prev) => prev + 1);
      if (lastErrorIndexRef.current !== currentIndex) {
        setErrorsCount((prev) => prev + 1);
        lastErrorIndexRef.current = currentIndex;
      }
      return;
    }

    // Enter é capturado diretamente
    if (key === "Enter") {
      e.preventDefault();
      if (expectedChar === "\n") {
        playSynthesizedSound("correct", muted);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        if (nextIndex >= targetCode.length) {
          setCompleted(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } else {
        playSynthesizedSound("error", muted);
        setShakeTrigger((prev) => prev + 1);
        if (lastErrorIndexRef.current !== currentIndex) {
          setErrorsCount((prev) => prev + 1);
          lastErrorIndexRef.current = currentIndex;
        }
      }
      return;
    }
  };

  // Botões Virtuais
  const handleVirtualKeyPress = (char: string) => {
    if (completed || pausado) return;
    
    if (char === expectedChar) {
      playSynthesizedSound("correct", muted);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (nextIndex >= targetCode.length) {
        setCompleted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      playSynthesizedSound("error", muted);
      setShakeTrigger((prev) => prev + 1);
      if (lastErrorIndexRef.current !== currentIndex) {
        setErrorsCount((prev) => prev + 1);
        lastErrorIndexRef.current = currentIndex;
      }
    }
    resetFoco();
  };

  // Copiar código concluído
  const handleCopy = () => {
    navigator.clipboard.writeText(targetCode);
    alert("Código copiado com sucesso! Prontinho para colar na sua plataforma.");
  };

  // Submeter a entrega de XP
  const handleFinalizar = async () => {
    const saveKey = `coding_practice_${missaoAberta.id}`;
    localStorage.removeItem(saveKey);
    await onEnviar(targetCode, currentXP);
  };

  // CONFIGURAÇÕES VISUAIS COM BASE NOS TEMAS DA "IDE VIRTUAL"
  const themeClasses = {
    vscode: {
      bg: "bg-slate-950",
      textUntyped: "text-slate-650 font-normal dark:text-slate-600/70 opacity-60",
      gutterBorder: "border-slate-900",
      gutterText: "text-slate-700",
      statusBar: "bg-slate-900 border-slate-900",
      keyboardBg: "bg-slate-950 border-slate-900",
      keyboardKeyBg: "bg-slate-900 border-slate-850 hover:text-white text-slate-500",
      expectedBorder: "border-indigo-400",
      cursorClass: "bg-indigo-550/45 text-white border-b-2 border-indigo-400",
    },
    hacker: {
      bg: "bg-black",
      textUntyped: "text-green-950/70 font-mono opacity-50",
      gutterBorder: "border-green-950/40",
      gutterText: "text-green-900",
      statusBar: "bg-black border-green-950/30",
      keyboardBg: "bg-black border-green-950/30",
      keyboardKeyBg: "bg-black border-green-950/40 hover:text-green-400 text-green-700",
      expectedBorder: "border-green-500",
      cursorClass: "bg-green-500/30 text-green-300 border-b-2 border-green-500 shadow-[0_0_8px_#22c55e]",
    },
    cyberpunk: {
      bg: "bg-zinc-950",
      textUntyped: "text-purple-900/60 font-mono opacity-50",
      gutterBorder: "border-fuchsia-950/40",
      gutterText: "text-fuchsia-700",
      statusBar: "bg-zinc-950 border-fuchsia-950/30",
      keyboardBg: "bg-zinc-950 border-fuchsia-950/30",
      keyboardKeyBg: "bg-zinc-900 border-fuchsia-950/20 hover:text-fuchsia-400 text-fuchsia-750",
      expectedBorder: "border-fuchsia-500",
      cursorClass: "bg-fuchsia-500/30 text-fuchsia-300 border-b-2 border-fuchsia-500 shadow-[0_0_8px_#d946ef]",
    }
  };

  const activeStyle = themeClasses[theme];

  // CARD DE BOAS-VINDAS / RECOMEÇAR
  if (!iniciado) {
    const totalLines = targetCode.split("\n").length;
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-950 items-center justify-center p-6 select-none">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
        >
          <div className="text-5xl mb-4 animate-bounce">⚡</div>
          <h2 className="font-display font-black text-2xl text-slate-100 uppercase tracking-wide mb-2">
            {missaoAberta.titulo}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {missaoAberta.descricao || "Pratique digitação rápida de código e ganhe XP de recompensa!"}
          </p>

          <div className="bg-slate-955 border border-slate-800 p-4.5 rounded-2xl mb-8 flex flex-col gap-2.5 text-left text-xs font-semibold text-slate-350">
            <div className="flex justify-between items-center">
              <span>Total de Linhas:</span>
              <span className="font-bold font-mono text-indigo-400">{totalLines}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tempo Limite:</span>
              <span className="font-bold font-mono text-pink-400">{timeLimitMinutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Recompensa Máxima:</span>
              <span className="font-bold text-emerald-400">{maxXP} XP</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {hasSavedProgress ? (
              <>
                <button
                  onClick={() => {
                    const saveKey = `coding_practice_${missaoAberta.id}`;
                    const saved = localStorage.getItem(saveKey);
                    if (saved) {
                      try {
                        const parsed = JSON.parse(saved);
                        if (parsed.currentIndex !== undefined) setCurrentIndex(parsed.currentIndex);
                        if (parsed.errorsCount !== undefined) setErrorsCount(parsed.errorsCount);
                        if (parsed.secondsRemaining !== undefined) setSecondsRemaining(parsed.secondsRemaining);
                        if (parsed.extraSecondsUsed !== undefined) setExtraSecondsUsed(parsed.extraSecondsUsed);
                        setIniciado(true);
                      } catch (e) {
                        setIniciado(true);
                      }
                    } else {
                      setIniciado(true);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                >
                  Continuar de onde parei
                </button>
                <button
                  onClick={() => {
                    const saveKey = `coding_practice_${missaoAberta.id}`;
                    localStorage.removeItem(saveKey);
                    setCurrentIndex(0);
                    setErrorsCount(0);
                    setSecondsRemaining(timeLimitMinutes * 60);
                    setExtraSecondsUsed(0);
                    setIniciado(true);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer border-none"
                >
                  Recomeçar do zero
                </button>
              </>
            ) : (
              <button
                onClick={() => setIniciado(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
              >
                Começar Desafio
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer border-none"
            >
              Voltar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 h-full min-h-0 ${activeStyle.bg} transition-colors duration-300 relative`} ref={containerRef}>
      
      {/* ═══ BARRA DE STATUS SUPERIOR ═══ */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 border-b ${activeStyle.statusBar} transition-colors duration-300 shrink-0 select-none`}>
        <div className="flex flex-wrap gap-2.5">
          <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/20 text-xs font-black uppercase tracking-wider">
            Recompensa: <span className="text-sm text-pink-500">{currentXP} XP</span>
          </div>
          <div className="bg-slate-800/60 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-black uppercase tracking-wider">
            Erros: <span className="text-red-500 font-mono font-bold">{errorsCount}</span>
          </div>

          {/* GAUGES ADICIONAIS: ACURÁCIA & WPM */}
          <div className="bg-slate-800/60 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-black uppercase tracking-wider">
            Acurácia: <span className="text-emerald-400 font-mono font-bold">{accuracy}%</span>
          </div>
          <div className="bg-slate-800/60 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-black uppercase tracking-wider">
            Velocidade: <span className="text-cyan-400 font-mono font-bold">{wpm} WPM</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* MUTE CONTROLLER */}
          <button
            onClick={() => setMuted((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-350 border border-slate-700/50 cursor-pointer active:scale-95 transition-all text-xs"
            title={muted ? "Ativar som" : "Desativar som"}
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {/* THEME CONTROLLER */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "vscode" | "hacker" | "cyberpunk")}
            className="bg-slate-850 border border-slate-700/50 text-slate-300 text-xs font-black px-2.5 py-1.5 rounded-xl outline-none cursor-pointer hover:bg-slate-800 transition-colors"
          >
            <option value="vscode">VS Code Dark</option>
            <option value="hacker">Hacker Neon</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>

          {secondsRemaining > 0 ? (
            <div className="bg-slate-800/90 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-black font-mono">
              ⏱️ {formatTime(secondsRemaining)}
            </div>
          ) : (
            <div className="bg-red-950/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-black font-mono animate-pulse border border-red-900/30">
              🚨 Excedido (+{formatTime(extraSecondsUsed)})
            </div>
          )}

          <button
            onClick={() => setPausado(true)}
            className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-700/50 cursor-pointer transition-all active:scale-95"
          >
            ⏸️ Pausar
          </button>
        </div>
      </div>

      {/* ═══ ALERTA DE TECLADO ABNT2 E CONFIGURAÇÕES ═══ */}
      {!completed && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 text-amber-300 text-xs font-medium flex items-center justify-between shrink-0 select-none">
          <p className="leading-relaxed flex items-center gap-2">
            <span>⚠️</span> 
            <strong>Atenção ao teclado:</strong> Use o layout <strong>Português (ABNT2)</strong> para evitar erros involuntários em teclas como <code>ç</code>, <code>;</code>, <code>{"{"}</code> e <code>{"}"}</code>.
          </p>
        </div>
      )}

      {/* ═══ ÁREA DE DIGITAÇÃO DE CÓDIGO (ESTILO IDE DE DESENVOLVIMENTO) ═══ */}
      <div 
        onClick={resetFoco}
        className="flex-1 p-6 overflow-auto text-slate-105 font-mono text-sm leading-relaxed relative select-none cursor-text custom-scrollbar min-h-[250px]"
      >
        {/* TEXTAREA OCULTA COM POSITION FIXED (EVITA SCROLL JUMPING DO BROWSER) */}
        <textarea
          ref={inputRef}
          value=""
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={() => setInputFoco(false)}
          onFocus={() => setInputFoco(true)}
          className="fixed opacity-0 pointer-events-none w-0 h-0"
          autoFocus
          disabled={completed || enviando || pausado}
          onPaste={(e) => {
            e.preventDefault();
            alert("⚠️ Não vale colar o código! Digite caractere por caractere.");
          }}
        />

        {/* Efeito visual de foco perdido */}
        {!inputFoco && !completed && !pausado && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in duration-200">
            <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xs shadow-xl">
              <span className="text-3xl block mb-2">⌨️</span>
              <h4 className="font-black uppercase tracking-wider text-xs text-slate-200 mb-1">Foco Perdido</h4>
              <p className="text-[11px] text-slate-400 leading-snug mb-3">Clique aqui na caixa de texto do código para reativar o seu teclado.</p>
              <button 
                onClick={resetFoco}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all border-none cursor-pointer"
              >
                Reativar Foco
              </button>
            </div>
          </div>
        )}

        {/* Linhas de Código propostas com Gutter e Destaques Visuais (Inclinado para tema e Shake Animation no Erro) */}
        <motion.div 
          key={`code-container-${shakeTrigger}`}
          initial={shakeTrigger > 0 ? { x: -6 } : { x: 0 }}
          animate={shakeTrigger > 0 ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col font-mono text-sm leading-normal select-none"
        >
          {targetCodeLines.map((line) => {
            return (
              <div key={line.lineIdx} className="flex hover:bg-slate-900/10 px-1 border-l-2 border-transparent hover:border-indigo-500/20 transition-all">
                {/* Gutter Genuíno (Números de Linha) */}
                <div className={`w-10 select-none text-right pr-4 ${activeStyle.gutterText} font-mono text-xs border-r ${activeStyle.gutterBorder} shrink-0`}>
                  {line.lineIdx}
                </div>
                {/* Conteúdo com destaque visual invertido */}
                <div className="pl-4 whitespace-pre break-all flex-1 tracking-wide">
                  {line.chars.map(({ char, absIdx }) => {
                    let className = "";
                    let charLabel = char;

                    if (char === "\n") charLabel = "↵\n"; // Guia visual do Enter
                    if (char === "\t") charLabel = "⇥   "; // Guia visual do Tab

                    const isTyped = absIdx < currentIndex;
                    const isCurrent = absIdx === currentIndex;

                    if (isTyped) {
                      // O código digitado acende em cores sintáticas específicas do tema
                      className = getSyntaxHighlightClass(char, absIdx, targetCode, theme);
                    } else if (isCurrent) {
                      // Indicador piscante do cursor atual
                      className = inputFoco 
                        ? `${activeStyle.cursorClass} animate-pulse font-black opacity-100`
                        : "text-indigo-400 underline font-black opacity-90";
                    } else {
                      // Código não digitado fica cinza-escorregadio (Estilo desativado customizado por tema)
                      className = activeStyle.textUntyped;
                    }

                    return (
                      <span 
                        key={absIdx} 
                        className={className}
                        ref={isCurrent ? currentSpanRef : undefined}
                      >
                        {charLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* ═══ TECLADO VIRTUAL E TECLAS DE ATALHO DE APOIO ═══ */}
      {!completed && !tecladoMinimizado && (() => {
        const getHighlightKey = (char: string): string => {
          if (!char) return "";
          
          if (char === " ") {
            if (isExpectedSpaceIndentation) return "TAB";
            return "SPACE";
          }
          
          const c = char.toUpperCase();
          if (c === "\n") return "ENTER";
          if (c === "\t") return "TAB";
          if (c === "{" || c === "[") return "[";
          if (c === "}" || c === "]") return "]";
          if (c === "(" || c === "9") return "9";
          if (c === ")" || c === "0") return "0";
          if (c === "<" || c === ",") return ",";
          if (c === ">" || c === ".") return ".";
          if (c === ":" || c === ";") return ";";
          if (c === '"' || c === "'") return "'";
          if (c === "_" || c === "-") return "-";
          if (c === "+" || c === "=") return "=";
          if (c === "`" || c === "´") return "´";
          return c;
        };

        const highlightKey = getHighlightKey(expectedChar);
        const isExpectedShifted = requiresShift(expectedChar);

        const keyboardRows = [
          ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
          ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "´", "[", "]", "\\"],
          ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ENTER"],
          ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "SPACE"]
        ];

        const handleVirtualKeyClick = (keyLabel: string) => {
          if (keyLabel === "SHIFT") return; // Apenas visual
          
          // Lógica especial de clique virtual no TAB quando espaço de indentação é esperado
          if (keyLabel === "TAB" && expectedChar === " ") {
            let isIndentation = true;
            for (let i = currentIndex - 1; i >= 0; i--) {
              if (targetCode[i] === "\n") break;
              if (targetCode[i] !== " ") {
                isIndentation = false;
                break;
              }
            }
            
            let spaceCount = 0;
            while (currentIndex + spaceCount < targetCode.length && targetCode[currentIndex + spaceCount] === " ") {
              spaceCount++;
            }
            
            if (isIndentation || spaceCount >= 2) {
              playSynthesizedSound("correct", muted);
              const nextIndex = currentIndex + spaceCount;
              setCurrentIndex(nextIndex);
              if (nextIndex >= targetCode.length) {
                setCompleted(true);
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              }
              resetFoco();
              return;
            }
          }

          let char = keyLabel.toLowerCase();
          if (keyLabel === "ENTER") char = "\n";
          else if (keyLabel === "TAB") char = "\t";
          else if (keyLabel === "SPACE") char = " ";
          
          if (expectedChar.toUpperCase() === keyLabel) {
            char = expectedChar;
          } else if (keyLabel === "[" && (expectedChar === "{" || expectedChar === "[")) {
            char = expectedChar;
          } else if (keyLabel === "]" && (expectedChar === "}" || expectedChar === "]")) {
            char = expectedChar;
          } else if (keyLabel === "9" && (expectedChar === "(" || expectedChar === "9")) {
            char = expectedChar;
          } else if (keyLabel === "0" && (expectedChar === ")" || expectedChar === "0")) {
            char = expectedChar;
          } else if (keyLabel === "," && (expectedChar === "<" || expectedChar === ",")) {
            char = expectedChar;
          } else if (keyLabel === "." && (expectedChar === ">" || expectedChar === ".")) {
            char = expectedChar;
          } else if (keyLabel === ";" && (expectedChar === ":" || expectedChar === ";")) {
            char = expectedChar;
          } else if (keyLabel === "'" && (expectedChar === '"' || expectedChar === "'")) {
            char = expectedChar;
          } else if (keyLabel === "-" && (expectedChar === "_" || expectedChar === "-")) {
            char = expectedChar;
          } else if (keyLabel === "=" && (expectedChar === "+" || expectedChar === "=")) {
            char = expectedChar;
          } else if (keyLabel === "´" && (expectedChar === "`" || expectedChar === "´")) {
            char = expectedChar;
          }
          
          handleVirtualKeyPress(char);
        };

        const isLetterExpected = expectedChar && /[a-zA-Z]/.test(expectedChar);
        const isUppercaseExpected = isLetterExpected && expectedChar === expectedChar.toUpperCase();

        return (
          <div className={`p-4 border-t ${activeStyle.keyboardBg} transition-colors duration-300 shrink-0 select-none`}>
            <div className="flex flex-col gap-2.5 max-w-xl mx-auto">
              
              {/* Notificação visual do próximo caractere */}
              <div className="flex items-center justify-between px-1 mb-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <span>Próxima tecla:</span>
                  <motion.span 
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 px-2 py-0.5 rounded font-mono font-black"
                  >
                    {expectedKeyName}
                  </motion.span>
                  {isUppercaseExpected && (
                    <span className="text-[9px] text-amber-400 font-black animate-pulse uppercase font-sans">
                      (SHIFT ATIVO)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setTecladoMinimizado(true)}
                  className="text-[9px] font-bold text-slate-500 hover:text-white bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-sans border-none"
                >
                  Ocultar Teclado ⬇️
                </button>
              </div>

              {/* Layout Teclado Virtual Estilizado */}
              <div className="flex flex-col gap-1.5 font-mono text-[10px] md:text-xs font-bold text-center">
                {keyboardRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {row.map((keyLabel) => {
                      const isShiftKey = keyLabel === "SHIFT";
                      const isHighlighted = (highlightKey === keyLabel) || (isShiftKey && isExpectedShifted);
                      
                      let widthClass = "w-8 h-8 md:w-9 md:h-9";
                      if (keyLabel === "TAB") widthClass = "w-12 h-8 md:w-14 md:h-9 text-[9px]";
                      if (keyLabel === "ENTER") widthClass = "w-14 h-8 md:w-16 md:h-9 text-[9px]";
                      if (isShiftKey) widthClass = "w-14 h-8 md:w-16 md:h-9 text-[9px]";
                      if (keyLabel === "SPACE") widthClass = "flex-1 h-8 md:h-9 text-[9px]";

                      // Transforma em minúsculas caso o caractere seja minúsculo
                      const isLetter = keyLabel.length === 1 && /[A-Z]/.test(keyLabel);
                      const displayLabel = isLetter 
                        ? (isUppercaseExpected ? keyLabel : keyLabel.toLowerCase()) 
                        : (keyLabel === "SPACE" ? "ESPAÇO" : keyLabel);

                      return (
                        <button
                          key={keyLabel}
                          type="button"
                          onClick={() => handleVirtualKeyClick(keyLabel)}
                          className={`rounded-lg border text-center transition-all duration-100 flex items-center justify-center cursor-pointer select-none ${widthClass} ${
                            isHighlighted
                              ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-indigo-400 scale-105 shadow-md shadow-indigo-500/30 animate-pulse font-black"
                              : `${activeStyle.keyboardKeyBg}`
                          }`}
                        >
                          {displayLabel}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ TECLADO MINIMIZADO FLOAT ═══ */}
      {tecladoMinimizado && !completed && (
        <div className="bg-slate-950 p-3.5 border-t border-slate-900 text-center shrink-0 select-none animate-in slide-in-from-bottom duration-250">
          <button
            onClick={() => {
              setTecladoMinimizado(false);
              resetFoco();
            }}
            className="bg-indigo-600 hover:bg-indigo-550 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all cursor-pointer border-none active:scale-95 shadow-md font-sans"
          >
            ⌨️ Mostrar Teclado Virtual
          </button>
        </div>
      )}

      {/* ═══ TELA DE PAUSA ═══ */}
      {pausado && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 z-20 animate-in fade-in duration-200 select-none">
          <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl font-sans">
            <span className="text-4xl block mb-3 animate-pulse">⏸️</span>
            <h3 className="font-display font-black text-lg uppercase tracking-wider text-slate-100 mb-4">Treino Pausado</h3>
            
            <div className="bg-slate-955 border border-slate-800 p-4.5 rounded-2xl mb-6 flex flex-col gap-2 text-left text-xs font-semibold text-slate-350">
              <div className="flex justify-between items-center font-sans">
                <span>Linhas digitadas:</span>
                <span className="font-bold font-mono text-indigo-400">
                  {Math.round((currentIndex / targetCode.length) * targetCode.split("\n").length)} / {targetCode.split("\n").length}
                </span>
              </div>
              <div className="flex justify-between items-center font-sans">
                <span>Erros cometidos:</span>
                <span className="font-bold font-mono text-red-400">{errorsCount}</span>
              </div>
              <div className="flex justify-between items-center font-sans">
                <span>Acurácia Média:</span>
                <span className="font-bold font-mono text-emerald-450">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center font-sans">
                <span>Velocidade de Digitação:</span>
                <span className="font-bold font-mono text-cyan-400">{wpm} WPM</span>
              </div>
              <div className="flex justify-between items-center font-sans">
                <span>Tempo restante:</span>
                <span className="font-bold font-mono text-pink-400">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <button 
              onClick={() => { setPausado(false); resetFoco(); }}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border-none"
            >
              Retomar Desafio
            </button>
          </div>
        </div>
      )}

      {/* ═══ TELA DE VITÓRIA (CONCLUÍDO COM SUCESSO) ═══ */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 z-25 select-none font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel-heavy w-full max-w-md p-6 text-center text-white border border-white/10 rounded-3xl shadow-2xl bg-slate-900"
            >
              <span className="text-5xl block mb-3 animate-bounce">🏆</span>
              <h3 className="font-display font-black text-xl md:text-2xl uppercase tracking-wider text-emerald-400 mb-2">Desafio Concluído!</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed font-sans">Você digitou o Mini Projeto com precisão cirúrgica de sintaxe e indentação!</p>

              {/* Box de Pontuação */}
              {(() => {
                const totalSecondsAllowed = timeLimitMinutes * 60;
                const timeTakenSeconds = secondsRemaining > 0 
                  ? totalSecondsAllowed - secondsRemaining 
                  : totalSecondsAllowed + extraSecondsUsed;
                return (
                  <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl mb-6 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seu Desempenho</span>
                    <span className="text-3xl font-black text-pink-500">{currentXP} XP</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Velocidade: <strong className="text-white font-mono">{wpm} WPM</strong> | 
                      Acurácia: <strong className="text-white font-mono">{accuracy}%</strong> | 
                      Erros: <strong className="text-white font-mono">{errorsCount}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Tempo Gasto: <strong className="text-white font-mono">{formatTime(timeTakenSeconds)}</strong>
                    </span>
                    {extraSecondsUsed > 0 && (
                      <span className="text-[10px] text-red-400 font-medium font-mono">
                        (Tempo limite excedido em +{formatTime(extraSecondsUsed)})
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Botões de Ação */}
              <div className="flex flex-col gap-3 font-sans">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  className="cursor-pointer w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  📋 Copiar Código Resolvido
                </motion.button>

                {missaoAberta.linkClassroom && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(missaoAberta.linkClassroom, "_blank")}
                    className="cursor-pointer w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-black py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider border-none"
                  >
                    🚀 Abrir Editor da Aula ({missaoAberta.linkClassroom.includes("codepen") ? "CodePen" : "Plataforma"})
                  </motion.button>
                )}

                <div className="h-px bg-slate-800 my-2" />

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    disabled={enviando}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleFinalizar}
                    disabled={enviando}
                    className="flex-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 cursor-pointer border-none"
                  >
                    {enviando ? "Processando..." : "Resgatar XP Recompensa"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
