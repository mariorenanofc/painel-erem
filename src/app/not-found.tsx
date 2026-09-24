"use client";

import React, { useEffect, useState } from "react";
import { TerminalSquare, Home, MoveLeft, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NotFound() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animação de matriz caindo (simulação leve)
  const columns = Array.from({ length: 20 });

  return (
    <div className="min-h-screen bg-[#030108] flex items-center justify-center p-6 font-sans relative overflow-hidden text-slate-200 perspective-1000">
      
      {/* ═══ EFEITO MATRIZ / GRADE AO FUNDO ═══ */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex justify-between overflow-hidden">
        {columns.map((_, i) => (
          <motion.div
            key={i}
            className="w-px h-full bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent"
            initial={{ y: -1000 }}
            animate={{ y: 1000 }}
            transition={{
              repeat: Infinity,
              duration: 3 + (i % 7) * 0.8,
              delay: (i * 0.7) % 5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* ═══ GLOW SENSÍVEL AO MOUSE ═══ */}
      <motion.div 
        className="absolute w-[800px] h-[800px] bg-fuchsia-600/15 rounded-full blur-[120px] pointer-events-none"
        animate={{
          x: mousePosition.x * 10,
          y: mousePosition.y * 10,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
      />

      <motion.div 
        className="absolute w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"
        animate={{
          x: mousePosition.x * -15,
          y: mousePosition.y * -15,
        }}
        transition={{ type: "spring", damping: 40, stiffness: 40 }}
      />

      {/* ═══ PAINEL CENTRAL FLUTUANTE ═══ */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          transformStyle: "preserve-3d",
        }}
        className="bg-[#0c0618]/60 backdrop-blur-2xl border border-fuchsia-500/20 rounded-3xl md:rounded-[3rem] p-8 sm:p-10 md:p-16 max-w-2xl w-full text-center shadow-[0_0_80px_rgba(217,70,239,0.1)] relative z-10 flex flex-col items-center mx-4"
      >
        
        {/* ÍCONE FLUTUANTE COM ROTAÇÃO 3D */}
        <motion.div 
          animate={{ 
            y: [-10, 10, -10],
            rotateZ: [-5, 5, -5]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1a0b2e] to-[#0c0618] border border-fuchsia-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(217,70,239,0.4)] relative"
        >
          <div className="absolute inset-0 rounded-3xl bg-fuchsia-400/20 animate-ping opacity-20"></div>
          <Cpu size={48} className="text-fuchsia-400 drop-shadow-[0_0_10px_#d946ef]" />
        </motion.div>

        {/* TEXTO 404 COM EFEITO GLITCH (Simulado com Framer Motion) */}
        <div className="relative mb-2">
          <motion.h1 
            className="text-7xl sm:text-8xl md:text-[9rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 tracking-tighter drop-shadow-2xl leading-none"
            animate={{
              textShadow: [
                "0px 0px 0px rgba(217,70,239,0)",
                "4px 0px 10px rgba(217,70,239,0.8)",
                "-4px 0px 10px rgba(99,102,241,0.8)",
                "0px 0px 0px rgba(217,70,239,0)"
              ],
              x: [0, -2, 2, -1, 0],
            }}
            transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          >
            404
          </motion.h1>
          {/* Sombra dupla para efeito 3D */}
          <h1 className="absolute top-0 left-0 text-7xl sm:text-8xl md:text-[9rem] font-black text-fuchsia-500/20 tracking-tighter leading-none -z-10 translate-x-2 translate-y-2 blur-sm">
            404
          </h1>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-widest text-white mb-6"
        >
          FALHA NO <span className="text-fuchsia-400">ESPAÇO-TEMPO</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-slate-400 font-mono text-sm md:text-base mb-12 max-w-md mx-auto leading-relaxed border-l-2 border-fuchsia-500/50 pl-4 text-left"
        >
          A rota solicitada desintegrou-se no hiperespaço do servidor. Não há missões, aulas ou artefatos de código neste quadrante.
        </motion.p>

        {/* BOTÕES COM HOVER SURREAL */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center perspective-1000"
        >
          <button 
            onClick={() => router.back()}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0c0618] border border-slate-700 hover:border-fuchsia-500 text-slate-400 hover:text-white font-black uppercase tracking-widest text-xs transition-all w-full sm:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            <MoveLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Abortar
          </button>
          
          <button 
            onClick={() => router.push('/portal')}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs transition-all w-full sm:w-auto overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_40px_rgba(217,70,239,0.8)]"
          >
            {/* Efeito Sweep Brilhante */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            
            <Home size={16} className="group-hover:scale-110 transition-transform" />
            Retornar ao Portal
          </button>
        </motion.div>
      </motion.div>
      
      {/* ═══ TERMINAL DEPURADOR AO FUNDO ═══ */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute bottom-8 left-8 hidden lg:block font-mono text-[10px] md:text-xs text-fuchsia-500/80 bg-[#0a0414]/80 p-4 rounded-xl border border-fuchsia-900/30 backdrop-blur-sm"
      >
        <p className="text-slate-500 mb-1">{"// SYSTEM LOG"}</p>
        <p>➜  <span className="text-indigo-400">~</span> <span className="text-emerald-400">execute</span> route_protocol</p>
        <p className="text-red-400 mt-1">[ERROR] STATUS 404: Route Not Found.</p>
        <p className="text-slate-400 mt-1">Initiating fallback protocol...</p>
        <p className="mt-1 flex items-center gap-1">
          ➜  <span className="text-indigo-400">~</span> <span className="w-2 h-4 bg-fuchsia-500 animate-pulse inline-block"></span>
        </p>
      </motion.div>

    </div>
  );
}
