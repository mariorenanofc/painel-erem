"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "IDLE" | "LOADING" | "SUCCESS";

interface OTPCheckInProps {
  onComplete: (otp: string) => Promise<boolean>;
  onCancel: () => void;
}

export default function OTPCheckIn({ onComplete, onCancel }: OTPCheckInProps) {
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCancelRef.current = onCancel;
  }, [onComplete, onCancel]);

  // Gerenciamento das fases automáticas
  useEffect(() => {
    let isMounted = true;
    if (phase === "LOADING") {
      const processCheckIn = async () => {
        const success = await onCompleteRef.current(otp.join(""));
        if (!isMounted) return;
        if (success) {
          setPhase("SUCCESS");
        } else {
          // Fecha o modal imediatamente em caso de falha ou erro
          onCancelRef.current();
        }
      };
      processCheckIn();
    } else if (phase === "SUCCESS") {
      // Mantém o estado de sucesso por 3 segundos e fecha o modal
      const timer = setTimeout(() => {
        if (isMounted) onCancelRef.current();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return () => { isMounted = false; };
  }, [phase, otp]);

  // Gerenciamento de foco automático apenas ao retornar para a fase IDLE
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (phase === "IDLE") {
      const firstEmptyIndex = otp.findIndex((v) => v === "");
      const indexToFocus = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      // Pequeno delay para garantir que a animação de saída/entrada concluiu
      timeout = setTimeout(() => {
        if (inputRefs.current[indexToFocus]) {
          inputRefs.current[indexToFocus]?.focus();
        }
      }, 100);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]); // Dependência de otp removida intencionalmente para não roubar o foco a cada digitação

  // Função para lidar com a digitação
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    // Permite letras e números
    const value = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase(); 
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[value.length - 1]; // Pega sempre o último caractere inserido
    setOtp(newOtp);

    // Avança o foco se não for o último (agora são 6 dígitos, então index < 5)
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // Se for o 6º dígito, remove o foco e inicia o loading
      inputRefs.current[index]?.blur();
      setPhase("LOADING");
    }
  };

  // Função para lidar com colar (Paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!pastedData) return;

    const newOtp = [...otp];
    let lastFilledIndex = 0;
    
    // Preenche as caixas com os caracteres colados
    for (let i = 0; i < 6; i++) {
      if (pastedData[i]) {
        newOtp[i] = pastedData[i];
        lastFilledIndex = i;
      }
    }
    
    setOtp(newOtp);
    
    if (lastFilledIndex < 5) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      inputRefs.current[5]?.blur();
      setPhase("LOADING");
    }
  };

  // Função para lidar com o Backspace
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) {
        // Se o input atual tem valor, apenas o limpa
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Se já está vazio, limpa o anterior e volta o foco
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-950/80 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
      
      {/* Botão de Fechar */}
      {phase === "IDLE" && (
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-500 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="relative flex items-center justify-center w-full h-[100px] mt-4">
        
        {/* SPINNER DO LOADING & CÍRCULO DE SUCESSO (Abraço Magnético) */}
        <AnimatePresence>
          {(phase === "LOADING" || phase === "SUCCESS") && (
            <motion.div
              key="spinner"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
              className="absolute flex items-center justify-center z-0"
            >
              <motion.div
                animate={
                  phase === "LOADING"
                    ? {
                        rotate: 360,
                        borderRadius: "50%",
                        borderWidth: "4px",
                        borderColor: "rgba(59, 130, 246, 0.1)",
                        borderTopColor: "rgba(59, 130, 246, 1)",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                      }
                    : {
                        rotate: 0,
                        borderRadius: "50%",
                        borderWidth: "0px",
                        borderColor: "rgba(0, 0, 0, 0)",
                        backgroundColor: "rgba(34, 197, 94, 1)",
                      }
                }
                transition={
                  phase === "LOADING"
                    ? { repeat: Infinity, duration: 1, ease: "linear" }
                    : { duration: 0.5, type: "spring" }
                }
                className="w-24 h-24 flex items-center justify-center shadow-lg relative"
              />
              
              {/* ÍCONE DE SUCESSO (Surge no fim) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence>
                  {phase === "SUCCESS" && (
                    <motion.svg
                      key="icon"
                      className="w-12 h-12 text-white drop-shadow-md z-20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AS LETRAS (Renderização Contínua) */}
        <motion.div
          className="flex gap-2 sm:gap-3 absolute z-10"
        >
          {otp.map((digit, index) => {
            // Cálculo do deslize horizontal para agrupar as letras no centro perfeitamente
            const translateX = phase === "IDLE" ? 0 : (2.5 - index) * 36;
            
            return (
              <motion.input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="text"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                animate={{
                  x: translateX,
                  backgroundColor: phase === "IDLE" ? "rgba(15, 23, 42, 1)" : "rgba(0, 0, 0, 0)",
                  borderColor: phase === "IDLE" ? "rgba(30, 41, 59, 1)" : "rgba(0, 0, 0, 0)",
                  color: phase === "IDLE" ? "rgba(255, 255, 255, 1)" : "rgba(96, 165, 250, 1)",
                  scale: phase === "SUCCESS" ? 0 : 1,
                  opacity: phase === "SUCCESS" ? 0 : 1
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl text-center text-xl sm:text-2xl font-black shadow-inner outline-none focus:border-blue-500 focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/20 placeholder-slate-700 pointer-events-auto"
                style={{ borderWidth: "2px" }}
                placeholder="-"
                disabled={phase !== "IDLE"}
              />
            );
          })}
        </motion.div>

      </div>
      
      {/* Texto de Status Inferior */}
      <div className="mt-8 text-center h-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium"
          >
            {phase === "IDLE" && <span className="text-slate-400">Insira o código da lousa</span>}
            {phase === "LOADING" && <span className="text-blue-400 animate-pulse">Verificando credenciais...</span>}
            {phase === "SUCCESS" && <span className="text-green-400 font-bold">Check-in aprovado!</span>}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
