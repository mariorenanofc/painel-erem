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
    if (theme === "hacker") return "text-green-500/85 font-normal italic";
    if (theme === "cyberpunk") return "text-purple-400/75 font-normal italic";
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
    if (theme === "cyberpunk") return "text-yellow-350 font-bold";
    return "text-amber-350 font-medium";
  }

  // 3. Numbers
  if (/[0-9]/.test(char)) {
    if (theme === "hacker") return "text-green-300 font-mono";
    if (theme === "cyberpunk") return "text-cyan-300 font-mono";
    return "text-cyan-455 font-mono";
  }

  // 4. Operators and Brackets
  if (/[+\-*/%&|=!<>?:~^{}[\]()]/.test(char)) {
    if (theme === "hacker") return "text-green-400 font-bold";
    if (theme === "cyberpunk") return "text-fuchsia-455 font-bold";
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
    if (theme === "cyberpunk") return "text-pink-500 font-extrabold";
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
    if (theme === "hacker") return "text-emerald-355";
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

// Mapeador de teclas físicas ABNT2 com dupla função
const dualKeyMap: Record<string, { shift: string; base: string }> = {
  "1": { base: "1", shift: "!" },
  "2": { base: "2", shift: "@" },
  "3": { base: "3", shift: "#" },
  "4": { base: "4", shift: "$" },
  "5": { base: "5", shift: "%" },
  "6": { base: "6", shift: "¨" },
  "7": { base: "7", shift: "&" },
  "8": { base: "8", shift: "*" },
  "9": { base: "9", shift: "(" },
  "0": { base: "0", shift: ")" },
  "-": { base: "-", shift: "_" },
  "=": { base: "=", shift: "+" },
  "´": { base: "´", shift: "`" },
  "[": { base: "[", shift: "{" },
  "]": { base: "]", shift: "}" },
  "\\": { base: "\\", shift: "|" },
  ";": { base: ";", shift: ":" },
  "'": { base: "'", shift: "\"" },
  ",": { base: ",", shift: "<" },
  ".": { base: ".", shift: ">" },
  "/": { base: "/", shift: "?" },
};

// Decomposições de acentos mortos (dead keys) para letras combinadas em português
const deadKeyAccentDecompositions: Record<string, Record<string, string>> = {
  "`": {
    "à": "a", "è": "e", "ì": "i", "ò": "o", "ù": "u",
    "À": "A", "È": "E", "Ì": "I", "Ò": "O", "Ù": "U"
  },
  "~": {
    "ã": "a", "õ": "o", "ñ": "n",
    "Ã": "A", "Õ": "O", "Ñ": "N"
  },
  "^": {
    "â": "a", "ê": "e", "î": "i", "ô": "o", "û": "u",
    "Â": "A", "Ê": "E", "Î": "I", "Ô": "O", "Û": "U"
  },
  "´": {
    "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
    "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U"
  }
};

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
  } catch (error: unknown) {
    const err = error as Error;
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
  const totalSecondsAllowed = timeLimitMinutes * 60;

  // Controle de estado
  const [iniciado, setIniciado] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Teclado virtual
  const [tecladoMinimizado, setTecladoMinimizado] = useState(false);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState<"vscode" | "hacker" | "cyberpunk">("vscode");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [errorsCount, setErrorsCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitMinutes * 60);
  const [extraSecondsUsed, setExtraSecondsUsed] = useState(0);
  const [inputFoco, setInputFoco] = useState(true);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [classroomAberto, setClassroomAberto] = useState(false);

  // Monitor de Altura da Janela para Layouts Responsivos Integrados
  const [windowHeight, setWindowHeight] = useState(800);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

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
        if (parsed.iniciado && parsed.codeLength === targetCode.length && parsed.currentIndex > 0) {
          setHasSavedProgress(true);
        }
      } catch (error: unknown) {
        const e = error as Error;
        console.error(e);
      }
    }
  }, [missaoAberta.id, targetCode.length]);

  // Efeito para salvar progresso dinamicamente
  useEffect(() => {
    if (!iniciado || completed || pausado) return;
    const saveKey = `coding_practice_${missaoAberta.id}`;
    const state = {
      currentIndex,
      errorsCount,
      secondsRemaining,
      extraSecondsUsed,
      iniciado: true,
      codeLength: targetCode.length
    };
    localStorage.setItem(saveKey, JSON.stringify(state));
  }, [currentIndex, errorsCount, secondsRemaining, extraSecondsUsed, iniciado, completed, pausado, missaoAberta.id, targetCode.length]);

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

  const elapsedSeconds = totalSecondsAllowed - secondsRemaining + extraSecondsUsed;
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = elapsedMinutes > 0.05 ? Math.round((currentIndex / 5) / elapsedMinutes) : 0;

  // Calcular XP Atual
  const extraMinutes = Math.floor(extraSecondsUsed / 60);
  const xpDescontoErros = errorsCount;
  const xpDescontoTempo = extraMinutes * 5;
  const floorXP = Math.ceil(maxXP * 0.1); // Piso mínimo de 10%
  const currentXP = Math.max(floorXP, maxXP - xpDescontoErros - xpDescontoTempo);

  // ⚡ AUTO-SAVE DE FUNDO PARA EVITAR ABANDONO SEM XP
  const hasAutoSaved = useRef(false);
  useEffect(() => {
    if (completed && !hasAutoSaved.current) {
      hasAutoSaved.current = true;
      const usr = JSON.parse(localStorage.getItem("usuario") || "{}");
      if (usr.matricula) {
        // Envia silenciosamente para o backend. 
        // O backend foi ajustado para aceitar atualizações de Typing se estiver "aguardando validação".
        fetch("/api/alunos/enviar-missao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matricula: usr.matricula,
            idAtividade: missaoAberta.id,
            resposta: targetCode,
            xpGanho: currentXP
          })
        }).catch(console.error);
      }
    }
  }, [completed, currentXP, missaoAberta.id, targetCode]);

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
    let isMatch = false;
    let advanceCount = 0;

    // 1. Tenta correspondência exata para múltiplos caracteres (ex: crase + tecla não-combinável -> `c)
    let matchCount = 0;
    while (
      matchCount < typed.length &&
      currentIndex + matchCount < targetCode.length &&
      typed[matchCount] === targetCode[currentIndex + matchCount]
    ) {
      matchCount++;
    }

    if (matchCount > 0) {
      isMatch = true;
      advanceCount = matchCount;
    } 
    // 2. Lógica inteligente para tratar dead keys combinadas (ex: crase + a -> à)
    else if (typed.length === 1) {
      if (typed === expectedChar) {
        isMatch = true;
        advanceCount = 1;
      } else if (deadKeyAccentDecompositions[expectedChar]) {
        const decompMap = deadKeyAccentDecompositions[expectedChar];
        if (decompMap[typed]) {
          const baseLetter = decompMap[typed];
          const nextExpectedChar = targetCode[currentIndex + 1] || "";
          if (nextExpectedChar === baseLetter) {
            isMatch = true;
            advanceCount = 2; // Avança o acento e a letra combinada
          } else {
            isMatch = true;
            advanceCount = 1; // Avança apenas o acento
          }
        }
      }
    }

    if (isMatch) {
      // ACERTO
      playSynthesizedSound("correct", muted);
      const nextIndex = currentIndex + advanceCount;
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
    setCodigoCopiado(true);
    alert("Código copiado com sucesso! Prontinho para colar na sua plataforma.");
  };

  // Submeter a entrega de XP
  const handleFinalizar = async () => {
    const saveKey = `coding_practice_${missaoAberta.id}`;
    localStorage.removeItem(saveKey);
    await onEnviar(targetCode, currentXP);
  };

  // CONFIGURAÇÕES VISUAIS PREMIUM COM BASE NOS TEMAS E IDENTIDADE TRILHATECH
  const themeClasses = {
    vscode: {
      bg: "bg-[#0b0f19]", // Cosmic Dark Blue
      textUntyped: "text-slate-400/45 font-normal dark:text-slate-400/40", // Destaque aumentado (Mais legível)
      gutterBorder: "border-slate-850",
      gutterText: "text-slate-650",
      statusBar: "bg-[#0d1424] border-slate-800/80 shadow-md",
      keyboardBg: "bg-[#0a0d16] border-slate-900/60 shadow-[0_0_20px_rgba(99,102,241,0.06)]",
      keyboardKeyBg: "bg-slate-900/85 border-slate-800 hover:text-white text-slate-400 hover:bg-slate-800 transition-all",
      cursorClass: "bg-indigo-550/45 text-white border-b-2 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
      highlightClass: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-indigo-400 scale-105 shadow-md shadow-indigo-500/30 animate-pulse font-black",
      mainBorderGlow: "border-slate-850 shadow-[0_0_30px_rgba(99,102,241,0.04)]"
    },
    hacker: {
      bg: "bg-[#010401]", // Matrix Dark Black
      textUntyped: "text-green-500/35 font-mono", // Destaque aumentado (Verde hacker legível)
      gutterBorder: "border-green-950/60",
      gutterText: "text-green-800",
      statusBar: "bg-black border-green-950/40 shadow-[0_0_15px_rgba(34,197,94,0.05)]",
      keyboardBg: "bg-[#020502] border-green-950/40 shadow-[0_0_25px_rgba(34,197,94,0.08)]",
      keyboardKeyBg: "bg-black border-green-950/40 hover:text-green-400 text-green-600 hover:bg-green-950/10 transition-all",
      cursorClass: "bg-green-500/30 text-green-300 border-b-2 border-green-500 shadow-[0_0_8px_#22c55e]",
      highlightClass: "bg-gradient-to-r from-green-500 to-emerald-600 text-black border-green-400 scale-105 shadow-[0_0_15px_rgba(34,197,94,0.6)] font-black",
      mainBorderGlow: "border-green-955 shadow-[0_0_35px_rgba(34,197,94,0.05)]"
    },
    cyberpunk: {
      bg: "bg-[#0c0515]", // Neon Synthwave Purple
      textUntyped: "text-fuchsia-400/35 font-mono", // Destaque aumentado (Lilás legível)
      gutterBorder: "border-fuchsia-950/50",
      gutterText: "text-purple-900",
      statusBar: "bg-black border-fuchsia-950/30 shadow-[0_0_15px_rgba(217,70,239,0.05)]",
      keyboardBg: "bg-[#0f0719] border-fuchsia-950/35 shadow-[0_0_25px_rgba(217,70,239,0.08)]",
      keyboardKeyBg: "bg-zinc-950 border-fuchsia-950/20 hover:text-fuchsia-400 text-fuchsia-500 hover:bg-fuchsia-950/10 transition-all",
      cursorClass: "bg-fuchsia-500/30 text-fuchsia-300 border-b-2 border-fuchsia-500 shadow-[0_0_8px_#d946ef]",
      highlightClass: "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white border-fuchsia-400 scale-105 shadow-[0_0_15px_rgba(217,70,239,0.6)] font-black",
      mainBorderGlow: "border-fuchsia-950/50 shadow-[0_0_35px_rgba(217,70,239,0.05)]"
    }
  };

  const activeStyle = themeClasses[theme];

  // CONFIGURAÇÕES DE ALTURA DE VIEWPORT PARA CORRIGIR CORTE DO TECLADO EM TELA COM ZOOM / LAPTOPS
  const compactMode = windowHeight < 720;
  const microMode = windowHeight < 640;

  const statusBarPadding = microMode ? "p-2 gap-2" : compactMode ? "p-2.5 gap-2" : "p-4 gap-4";
  const alertPadding = compactMode ? "px-4 py-1 text-[11px]" : "px-5 py-3";
  const codeAreaPadding = microMode ? "p-3 min-h-[120px]" : compactMode ? "p-4 min-h-[150px]" : "p-6 min-h-[250px]";
  const codeAreaMargin = microMode ? "mx-2 my-1.5" : compactMode ? "mx-3 my-2" : "mx-4 my-3.5";

  // Dimensões responsivas dos botões do teclado virtual
  let keySizeClass = "w-8 h-8 md:w-9 md:h-9";
  let tabWidthClass = "w-12 h-8 md:w-14 md:h-9 text-[9px]";
  let enterWidthClass = "w-14 h-8 md:w-16 md:h-9 text-[9px]";
  let spaceHeightClass = "flex-1 h-8 md:h-9 text-[9px]";
  let keyboardPadding = "p-4";

  if (microMode) {
    keySizeClass = "w-6 h-6 md:w-6.5 md:h-6.5 text-[8px]";
    tabWidthClass = "w-9 h-6 md:w-10 md:h-6.5 text-[8px]";
    enterWidthClass = "w-10 h-6 md:w-11 md:h-6.5 text-[8px]";
    spaceHeightClass = "flex-1 h-6 md:h-6.5 text-[8px]";
    keyboardPadding = "p-2";
  } else if (compactMode) {
    keySizeClass = "w-7 h-7 md:w-7.5 md:h-7.5 text-[8.5px]";
    tabWidthClass = "w-10 h-7 md:w-12 md:h-7.5 text-[8.5px]";
    enterWidthClass = "w-12 h-7 md:w-13 md:h-7.5 text-[8.5px]";
    spaceHeightClass = "flex-1 h-7 md:h-7.5 text-[8.5px]";
    keyboardPadding = "p-3";
  }

  // CARD DE BOAS-VINDAS / RECOMEÇAR
  if (!iniciado) {
    const totalLines = targetCode.split("\n").length;
    const welcomePadding = compactMode ? "p-5 max-w-sm" : "p-8 max-w-md";
    const welcomeMargin = compactMode ? "mb-4" : "mb-8";
    
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-950 items-center justify-center p-6 select-none">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-slate-900 border border-slate-800/80 ${welcomePadding} rounded-3xl w-full text-center shadow-2xl relative overflow-hidden`}
        >
          {/* Luz Trilhatech Neon no Topo */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className={`${compactMode ? "text-3xl mb-2" : "text-5xl mb-4"} animate-bounce`}>⚡</div>
          <h2 className={`font-display font-black ${compactMode ? "text-lg" : "text-2xl"} text-slate-100 uppercase tracking-wide mb-2`}>
            {missaoAberta.titulo}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {missaoAberta.descricao || "Pratique digitação rápida de código e ganhe XP de recompensa!"}
          </p>

          <div className={`bg-slate-950/70 border border-slate-850 p-4.5 rounded-2xl ${welcomeMargin} flex flex-col gap-2.5 text-left text-xs font-semibold text-slate-300`}>
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
                        if (parsed.currentIndex !== undefined && parsed.codeLength === targetCode.length) {
                          setCurrentIndex(parsed.currentIndex);
                          if (parsed.errorsCount !== undefined) setErrorsCount(parsed.errorsCount);
                          if (parsed.secondsRemaining !== undefined) setSecondsRemaining(parsed.secondsRemaining);
                          if (parsed.extraSecondsUsed !== undefined) setExtraSecondsUsed(parsed.extraSecondsUsed);
                        }
                        setIniciado(true);
                      } catch (error: unknown) {
                        const e = error as Error;
                        console.error(e);
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
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
              >
                Começar Desafio
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-slate-805 hover:bg-slate-750 text-slate-400 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer border-none"
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
      
      {/* ═══ BARRA DE STATUS SUPERIOR PREMIUM (GRADIENTS TRILHATECH) ═══ */}
      <div className={`flex flex-wrap items-center justify-between ${statusBarPadding} border-b ${activeStyle.statusBar} transition-colors duration-300 shrink-0 select-none`}>
        <div className="flex flex-wrap gap-2.5">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-300 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(99,102,241,0.15)] flex items-center">
            Recompensa: <span className="text-sm text-pink-400 font-black ml-1.5">{currentXP} XP</span>
          </div>
          <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 text-red-400 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.15)] flex items-center">
            Erros: <span className="font-mono font-black ml-1.5">{errorsCount}</span>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-350 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)] flex items-center">
            Acurácia: <span className="font-mono font-black ml-1.5">{accuracy}%</span>
          </div>
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-300 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(6,182,212,0.15)] flex items-center">
            Velocidade: <span className="font-mono font-black ml-1.5">{wpm} WPM</span>
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
            <div className="bg-slate-800/90 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-black font-mono border border-slate-700/40">
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
        <div className={`${alertPadding} bg-amber-500/10 border-b border-amber-500/20 text-amber-300 font-medium flex items-center justify-between shrink-0 select-none`}>
          <p className="leading-relaxed flex items-center gap-2">
            <span>⚠️</span> 
            <strong>Atenção ao teclado:</strong> Use o layout <strong>Português (ABNT2)</strong> para evitar erros involuntários em teclas como <code>ç</code>, <code>;</code>, <code>{"{"}</code> e <code>{"}"}</code>.
          </p>
        </div>
      )}

      {/* ═══ ÁREA DE DIGITAÇÃO DE CÓDIGO (NESTED BOX PREMIUM ESTILO TRILHATECH) ═══ */}
      <div 
        onClick={resetFoco}
        className={`flex-1 ${codeAreaPadding} overflow-auto text-slate-100 font-mono text-sm leading-relaxed relative select-none cursor-text custom-scrollbar border ${codeAreaMargin} rounded-2xl transition-all duration-300 ${activeStyle.mainBorderGlow}`}
      >
        {/* TEXTAREA OCULTA COM POSITION FIXED (EVITA SCROLL JUMPING DO BROWSER) */}
        <textarea
          ref={inputRef}
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
          <div className="absolute inset-0 bg-slate-955/90 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in duration-200">
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
                      className = getSyntaxHighlightClass(char, absIdx, targetCode, theme);
                    } else if (isCurrent) {
                      className = inputFoco 
                        ? `${activeStyle.cursorClass} animate-pulse font-black opacity-100`
                        : "text-indigo-400 underline font-black opacity-90";
                    } else {
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

      {/* ═══ TECLADO VIRTUAL GLASSMORPHIC RESPONSIVO ═══ */}
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
          if (keyLabel === "SHIFT") return;
          
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
          <div className={`${keyboardPadding} border-t ${activeStyle.keyboardBg} transition-colors duration-300 shrink-0 select-none`}>
            <div className="flex flex-col gap-2.5 max-w-xl mx-auto">
              
              {/* Notificação visual do próximo caractere */}
              <div className="flex items-center justify-between px-1 mb-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <span>Próxima tecla:</span>
                  <motion.span 
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-405 px-2 py-0.5 rounded font-mono font-black shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                  >
                    {expectedKeyName}
                  </motion.span>
                  {isUppercaseExpected && (
                    <span className="text-[9px] text-pink-400 font-black animate-pulse uppercase font-sans">
                      (SHIFT ATIVO)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setTecladoMinimizado(true)}
                  className="text-[9px] font-bold text-slate-500 hover:text-white bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-sans border-none"
                >
                  Ocultar Teclado ⬇️
                </button>
              </div>

              {/* Layout Teclado Virtual Estilizado */}
              <div className="flex flex-col gap-1.5 font-mono font-bold text-center">
                {keyboardRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {row.map((keyLabel) => {
                      const dual = dualKeyMap[keyLabel];
                      const isShiftKey = keyLabel === "SHIFT";
                      const isHighlighted = (highlightKey === keyLabel) || (isShiftKey && isExpectedShifted);
                      
                      let widthClass = keySizeClass;
                      if (keyLabel === "TAB") widthClass = tabWidthClass;
                      if (keyLabel === "ENTER") widthClass = enterWidthClass;
                      if (isShiftKey) widthClass = enterWidthClass;
                      if (keyLabel === "SPACE") widthClass = spaceHeightClass;

                      let content: React.ReactNode;
                      
                      if (dual) {
                        const isShiftedActive = expectedChar === dual.shift;
                        const isBaseActive = expectedChar === dual.base;
                        const isAnyActive = isShiftedActive || isBaseActive;
                        
                        // Se a tela estiver muito pequena (microMode), renderiza apenas 1 caractere dinamicamente para não encavalar
                        if (microMode) {
                          content = (
                            <span className={isAnyActive && isHighlighted ? "text-white font-black scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,1)]" : "text-slate-400 font-bold"}>
                              {isShiftedActive ? dual.shift : dual.base}
                            </span>
                          );
                        } else {
                          content = (
                            <div className="flex flex-col items-center justify-between h-full py-0.5 leading-none w-full select-none">
                              <span className={`text-[8.5px] md:text-[9px] transition-all ${
                                isShiftedActive && isHighlighted 
                                  ? "text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,1)] font-extrabold" 
                                  : "text-slate-500/70 font-normal"
                              }`}>
                                {dual.shift}
                              </span>
                              <span className={`text-[10px] md:text-[10.5px] transition-all ${
                                isBaseActive && isHighlighted 
                                  ? "text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,1)] font-extrabold" 
                                  : "text-slate-400 font-bold"
                              }`}>
                                {dual.base}
                              </span>
                            </div>
                          );
                        }
                      } else {
                        const isLetter = keyLabel.length === 1 && /[A-Z]/.test(keyLabel);
                        const displayLabel = isLetter 
                          ? (isUppercaseExpected ? keyLabel : keyLabel.toLowerCase()) 
                          : (keyLabel === "SPACE" ? "ESPAÇO" : keyLabel);
                        content = <span>{displayLabel}</span>;
                      }

                      return (
                        <button
                          key={keyLabel}
                          type="button"
                          onClick={() => handleVirtualKeyClick(keyLabel)}
                          className={`rounded-xl border text-center transition-all duration-150 flex items-center justify-center cursor-pointer select-none ${widthClass} ${
                            isHighlighted
                              ? `${activeStyle.highlightClass}`
                              : `${activeStyle.keyboardKeyBg} shadow-sm shadow-black/35`
                          }`}
                        >
                          {content}
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
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all cursor-pointer border-none active:scale-95 shadow-lg shadow-purple-500/20 font-sans"
          >
            ⌨️ Mostrar Teclado Virtual
          </button>
        </div>
      )}

      {/* ═══ TELA DE PAUSA PREMIUM (GRADIENTS TRILHATECH) ═══ */}
      {pausado && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 z-20 animate-in fade-in duration-200 select-none">
          <div className="text-center p-8 bg-slate-900 border border-slate-800/80 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden font-sans">
            {/* Linha Neon Superior */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
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
                <span className="font-bold font-mono text-cyan-450">{wpm} WPM</span>
              </div>
              <div className="flex justify-between items-center font-sans">
                <span>Tempo restante:</span>
                <span className="font-bold font-mono text-pink-400">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <button 
              onClick={() => { setPausado(false); resetFoco(); }}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg hover:brightness-110 active:scale-95 cursor-pointer border-none"
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
            className="absolute inset-0 bg-slate-955/95 backdrop-blur-md flex items-center justify-center p-5 z-25 select-none font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel-heavy w-full max-w-md p-6 text-center text-white border border-slate-800 rounded-3xl shadow-2xl bg-slate-900 relative overflow-hidden"
            >
              {/* Linha Neon Superior */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <span className="text-5xl block mb-3 animate-bounce">🏆</span>
              <h3 className="font-display font-black text-xl md:text-2xl uppercase tracking-wider text-emerald-455 mb-2">Desafio Concluído!</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed font-sans">Você digitou o Mini Projeto com precisão de sintaxe e indentação!</p>

              {/* Box de Pontuação */}
              {(() => {
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

              {/* Box de Instruções Progressivas de Entrega */}
              <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl mb-6 text-left space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center mb-1">
                  📋 Guia de Entrega Obrigatório
                </span>

                {/* Passo 1: Copiar Código */}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${codigoCopiado ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                    {codigoCopiado ? "✔" : "1"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white">Copiar código resolvido</p>
                    <p className="text-[10px] text-slate-400 font-medium">Copie sua digitação para a área de transferência.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none ${codigoCopiado ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"}`}
                  >
                    {codigoCopiado ? "Copiado!" : "Copiar"}
                  </motion.button>
                </div>

                {/* Passo 2: Colar no CodePen/IDE (se houver) */}
                {missaoAberta.opcaoA && (
                  <div className={`flex items-center gap-3 transition-opacity duration-300 ${codigoCopiado ? "opacity-100" : "opacity-40"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${editorAberto ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                      {editorAberto ? "✔" : "2"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white">Praticar no CodePen / IDE</p>
                      <p className="text-[10px] text-slate-400 font-medium">Cole o código no template base para ver funcionar.</p>
                    </div>
                    <motion.button
                      whileHover={codigoCopiado ? { scale: 1.05 } : {}}
                      whileTap={codigoCopiado ? { scale: 0.95 } : {}}
                      disabled={!codigoCopiado}
                      onClick={() => {
                        window.open(missaoAberta.opcaoA, "_blank");
                        setEditorAberto(true);
                      }}
                      className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none ${editorAberto ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:bg-slate-800 disabled:text-slate-500"}`}
                    >
                      {editorAberto ? "Aberto!" : "Abrir"}
                    </motion.button>
                  </div>
                )}

                {/* Passo 3: Entregar no Google Classroom (se houver) */}
                {missaoAberta.linkClassroom && (
                  <div className={`flex items-center gap-3 transition-opacity duration-300 ${
                    codigoCopiado && (!missaoAberta.opcaoA || editorAberto) ? "opacity-100" : "opacity-40"
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${classroomAberto ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                      {classroomAberto ? "✔" : missaoAberta.opcaoA ? "3" : "2"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white">Anexar e enviar no Classroom</p>
                      <p className="text-[10px] text-slate-400 font-medium">Entre na tarefa e anexe o link do seu projeto.</p>
                    </div>
                    <motion.button
                      whileHover={codigoCopiado && (!missaoAberta.opcaoA || editorAberto) ? { scale: 1.05 } : {}}
                      whileTap={codigoCopiado && (!missaoAberta.opcaoA || editorAberto) ? { scale: 0.95 } : {}}
                      disabled={!codigoCopiado || (!!missaoAberta.opcaoA && !editorAberto)}
                      onClick={() => {
                        window.open(missaoAberta.linkClassroom, "_blank");
                        setClassroomAberto(true);
                      }}
                      className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none ${classroomAberto ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-gradient-to-r from-pink-500 to-rose-500 text-white disabled:bg-slate-800 disabled:text-slate-500"}`}
                    >
                      {classroomAberto ? "Aberto!" : "Entregar"}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Botões de Ação Finais */}
              <div className="flex gap-3 font-sans">
                <button
                  onClick={onClose}
                  disabled={enviando}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
                >
                  Fechar
                </button>
                {(() => {
                  const passosConcluidos = codigoCopiado && 
                    (!missaoAberta.opcaoA || editorAberto) && 
                    (!missaoAberta.linkClassroom || classroomAberto);

                  return (
                    <button
                      onClick={handleFinalizar}
                      disabled={enviando || !passosConcluidos}
                      className={`flex-2 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg border-none ${
                        passosConcluidos 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20 cursor-pointer" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-55 shadow-none"
                      }`}
                    >
                      {enviando ? "Processando..." : "Resgatar XP Recompensa"}
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
