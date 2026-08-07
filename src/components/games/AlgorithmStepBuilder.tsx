"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, MoveRight, HelpCircle } from "lucide-react";

interface AlgorithmStepBuilderProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  soundEnabled: boolean;
}

interface AlgoQuestion {
  title: string;
  steps: string[]; // Ordem correta
}

const QUESTIONS: AlgoQuestion[] = [
  {
    title: "Algoritmo de Média de Notas (Aprovado ou Reprovado)",
    steps: [
      "Receber nota 1 e nota 2",
      "Calcular Media = (nota 1 + nota 2) / 2",
      "Se Media >= 6: Aprovado",
      "Senao: Reprovado"
    ]
  },
  {
    title: "Algoritmo Diário de Ir para a Escola",
    steps: [
      "Acordar e olhar o despertador",
      "Se atrasado: tomar cafe correndo",
      "Senao: tomar cafe com calma",
      "Pegar a mochila e ir para a EREM"
    ]
  },
  {
    title: "Algoritmo de Login no Portal",
    steps: [
      "Digitar a Matricula e Data de Nascimento",
      "Verificar se dados existem no banco",
      "Se cadastrado: redirecionar ao Painel",
      "Senao: exibir erro de autenticacao"
    ]
  },
  {
    title: "Estrutura de Repetição Básica (Contar até 3)",
    steps: [
      "Iniciar Contador = 0",
      "Enquanto Contador < 3: somar 1 ao Contador",
      "Imprimir valor do Contador na tela",
      "Finalizar o loop de execucao"
    ]
  }
];

export default function AlgorithmStepBuilder({
  onGameOver,
  playSound
}: AlgorithmStepBuilderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<AlgoQuestion[]>([]);
  const [availableSteps, setAvailableSteps] = useState<string[]>([]);
  const [placedSteps, setPlacedSteps] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [validated, setValidated] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());

  const handleStart = () => {
    playSound("click");
    // Selecionar 3 perguntas aleatórias
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

  const setupQuestion = (q: AlgoQuestion) => {
    // Embaralhar os blocos
    const shuf = [...q.steps].sort(() => 0.5 - Math.random());
    setAvailableSteps(shuf);
    setPlacedSteps([]);
    setValidated(false);
    setFeedback("");
  };

  const handleAvailableClick = (step: string) => {
    if (validated) return;
    playSound("click");
    setAvailableSteps((prev) => prev.filter((s) => s !== step));
    setPlacedSteps((prev) => [...prev, step]);
  };

  const handlePlacedClick = (step: string) => {
    if (validated) return;
    playSound("click");
    setPlacedSteps((prev) => prev.filter((s) => s !== step));
    setAvailableSteps((prev) => [...prev, step]);
  };

  const handleValidate = () => {
    const currentQ = shuffledQuestions[currentIndex];
    
    // Verificar se todos os blocos foram organizados
    if (placedSteps.length < currentQ.steps.length) {
      playSound("error");
      setFeedback("Você precisa encaixar todos os blocos do fluxograma primeiro!");
      return;
    }

    setValidated(true);
    const isCorrect = JSON.stringify(placedSteps) === JSON.stringify(currentQ.steps);

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1500); // 1500 pontos por fluxograma correto
      setFeedback("Excelente! A lógica está 100% correta.");
    } else {
      playSound("error");
      setFeedback("Incorreto. A ordem correta das etapas foi restaurada.");
      setPlacedSteps(currentQ.steps); // Mostra a ordem correta como gabarito
    }

    setTimeout(() => {
      if (currentIndex < shuffledQuestions.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setupQuestion(shuffledQuestions[nextIdx]);
      } else {
        // Fim do jogo
        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const finalScore = score + (isCorrect ? 1500 : 0);
        onGameOver(finalScore, duration);
      }
    }, 4000);
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ordenador de Fluxograma</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Ordene os blocos lógicos clicando sobre eles para montar a sequência correta de execução 
          do algoritmo.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2"
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
        <span>Fluxograma {currentIndex + 1} de 3</span>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      <div className="text-center mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Desafio do Fluxo:</span>
        <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">{currentQ.title}</h4>
      </div>

      {/* Container 1: Sequência de Passos Montados */}
      <div className="flex-1 flex flex-col gap-2 p-4 bg-slate-950 border border-slate-850 rounded-xl mb-4 min-h-[160px] justify-center">
        {placedSteps.length === 0 ? (
          <div className="text-center text-xs text-slate-600 font-semibold select-none py-8">
            Clique nos blocos abaixo na ordem lógica do fluxo...
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 justify-center">
            {placedSteps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2">
                <button
                  disabled={validated}
                  onClick={() => handlePlacedClick(step)}
                  className={`py-2 px-4 rounded-xl border border-slate-800 text-xs font-bold text-white transition-all max-w-[280px] break-words text-center ${
                    validated 
                      ? (JSON.stringify(placedSteps) === JSON.stringify(currentQ.steps)
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-900 border-slate-800 text-slate-400")
                      : "bg-slate-900 hover:bg-slate-850 hover:border-slate-700"
                  }`}
                >
                  {step}
                </button>
                {idx < placedSteps.length - 1 && (
                  <MoveRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Container 2: Blocos Disponíveis para Clicar */}
      {availableSteps.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-850/50 mb-4 min-h-[50px] items-center">
          {availableSteps.map((step, idx) => (
            <button
              key={idx}
              disabled={validated}
              onClick={() => handleAvailableClick(step)}
              className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 text-white text-xs font-bold text-center transition-all active:scale-98"
            >
              {step}
            </button>
          ))}
        </div>
      )}

      {/* Feedback Placa */}
      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs font-bold text-slate-400">
          {feedback}
        </div>
      )}

      {/* Botão de Validação */}
      <button
        disabled={validated || placedSteps.length === 0}
        onClick={handleValidate}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all text-sm disabled:opacity-40 disabled:pointer-events-none active:scale-98"
      >
        Validar Sequência
      </button>
    </div>
  );
}
