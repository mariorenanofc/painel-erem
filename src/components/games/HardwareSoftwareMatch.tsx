"use client";
import { fisherYatesShuffle } from "@/src/lib/fisherYates";


import React, { useState, useRef } from "react";
import { Sparkles, Cpu, HardDrive, Layout, Monitor } from "lucide-react";

interface HardwareSoftwareMatchProps {
  onGameOver: (score: number, durationSeconds: number) => void;
  playSound: (type: "click" | "success" | "error") => void;
  perderVida?: () => void;
  soundEnabled: boolean;
}

interface Item {
  name: string;
  category: "entrada" | "saida" | "componente" | "software_sistema" | "software_app";
}

const ITEMS: Item[] = [
  // Entrada
  { name: "Teclado", category: "entrada" },
  { name: "Mouse", category: "entrada" },
  { name: "Microfone", category: "entrada" },
  { name: "Scanner", category: "entrada" },
  { name: "Webcam", category: "entrada" },
  { name: "Joystick", category: "entrada" },
  { name: "Leitor de Código de Barras", category: "entrada" },
  { name: "Leitor Biométrico", category: "entrada" },
  { name: "Mesa Digitalizadora", category: "entrada" },
  { name: "Touchpad", category: "entrada" },

  // Saída
  { name: "Monitor", category: "saida" },
  { name: "Impressora", category: "saida" },
  { name: "Caixa de Som", category: "saida" },
  { name: "Fone de Ouvido", category: "saida" },
  { name: "Projetor de Vídeo", category: "saida" },
  { name: "Óculos VR", category: "saida" },
  { name: "Impressora 3D", category: "saida" },
  { name: "Plotter", category: "saida" },
  { name: "Buzzer", category: "saida" },
  { name: "Headset", category: "saida" },

  // Componente Interno
  { name: "Processador (CPU)", category: "componente" },
  { name: "Memória RAM", category: "componente" },
  { name: "Placa de Vídeo (GPU)", category: "componente" },
  { name: "Placa-Mãe", category: "componente" },
  { name: "SSD NVMe", category: "componente" },
  { name: "Disco Rígido (HD)", category: "componente" },
  { name: "Fonte de Alimentação", category: "componente" },
  { name: "Cooler do Processador", category: "componente" },
  { name: "Placa de Rede", category: "componente" },
  { name: "Dissipador de Calor", category: "componente" },

  // Software de Sistema
  { name: "Windows 11", category: "software_sistema" },
  { name: "Android", category: "software_sistema" },
  { name: "Linux Ubuntu", category: "software_sistema" },
  { name: "macOS", category: "software_sistema" },
  { name: "iOS", category: "software_sistema" },
  { name: "Windows Server", category: "software_sistema" },
  { name: "MS-DOS", category: "software_sistema" },
  { name: "Unix", category: "software_sistema" },
  { name: "FreeBSD", category: "software_sistema" },
  { name: "BIOS/UEFI", category: "software_sistema" },

  // Software Aplicativo
  { name: "WhatsApp", category: "software_app" },
  { name: "Google Chrome", category: "software_app" },
  { name: "Visual Studio Code", category: "software_app" },
  { name: "Microsoft Word", category: "software_app" },
  { name: "Microsoft Excel", category: "software_app" },
  { name: "Microsoft PowerPoint", category: "software_app" },
  { name: "Adobe Photoshop", category: "software_app" },
  { name: "Roblox", category: "software_app" },
  { name: "Discord", category: "software_app" },
  { name: "Spotify", category: "software_app" }
];

export default function HardwareSoftwareMatch({ onGameOver, playSound, perderVida }: HardwareSoftwareMatchProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const isFinishedRef = React.useRef(false);
  
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    if (isFinishedRef) isFinishedRef.current = false;
    playSound("click");
    // Embaralhar e selecionar 10 itens
    const items = fisherYatesShuffle([...ITEMS]).slice(0, 10);
    setShuffledItems(items);
    setCurrentIndex(0);
    setScore(0);
    setIsPlaying(true);
    startTimeRef.current = new Date().getTime();
  };

  const handleCategorySelect = (category: typeof ITEMS[0]["category"]) => {
    if (isFinishedRef.current) return;
    const currentItem = shuffledItems[currentIndex];
    const isCorrect = currentItem.category === category;

    if (isCorrect) {
      playSound("success");
      setScore((prev) => prev + 1000); // 1000 pontos por acerto
    } else {
      playSound("error");
      if (perderVida) perderVida();
    }

    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Concluiu os 10 itens
      const duration = Math.max(1, Math.round((new Date().getTime() - startTimeRef.current) / 1000));
      const finalScore = score + (isCorrect ? 1000 : 0);
      isFinishedRef.current = true;
      onGameOver(finalScore, duration);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
          <Cpu className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Conceitos de Computador</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Identifique a categoria correta para cada item exibido (se é um hardware de entrada/saída, 
          um componente de placa, ou um tipo de software).
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          Iniciar Partida
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentItem = shuffledItems[currentIndex];

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-xl mx-auto w-full">
      {/* Placa de Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6 text-sm text-slate-400">
        <span>Item {currentIndex + 1} de 10</span>
        <span className="font-bold text-yellow-400">Pontos: {score}</span>
      </div>

      {/* Card do Item Exibido */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl mb-6 shadow-lg min-h-[160px] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent pointer-events-none" />
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Classifique o item:</span>
        <h4 className="text-2xl sm:text-3xl font-black text-white bg-slate-950 border border-slate-850 px-6 py-4 rounded-2xl shadow-inner inline-block">
          {currentItem.name}
        </h4>
      </div>

      {/* Grid de Seleção de Categorias */}
      <div className="flex flex-col gap-3">
        {/* HARDWARE CATEGORIES */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCategorySelect("entrada")}
            className="py-3 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-850 text-white flex flex-col items-center gap-1.5 transition-all text-[11px] font-bold active:scale-98"
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>HW: Entrada</span>
          </button>
          
          <button
            onClick={() => handleCategorySelect("saida")}
            className="py-3 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-850 text-white flex flex-col items-center gap-1.5 transition-all text-[11px] font-bold active:scale-98"
          >
            <Monitor className="w-4 h-4 text-emerald-400 rotate-180" />
            <span>HW: Saída</span>
          </button>

          <button
            onClick={() => handleCategorySelect("componente")}
            className="py-3 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-850 text-white flex flex-col items-center gap-1.5 transition-all text-[11px] font-bold active:scale-98"
          >
            <HardDrive className="w-4 h-4 text-pink-400" />
            <span>HW: Interno</span>
          </button>
        </div>

        {/* SOFTWARE CATEGORIES */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCategorySelect("software_sistema")}
            className="py-3.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 text-white flex items-center justify-center gap-2 transition-all text-xs font-bold active:scale-98"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>SW: Sistema Operacional</span>
          </button>
          
          <button
            onClick={() => handleCategorySelect("software_app")}
            className="py-3.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 text-white flex items-center justify-center gap-2 transition-all text-xs font-bold active:scale-98"
          >
            <Layout className="w-4 h-4 text-yellow-400" />
            <span>SW: Aplicativo / Programa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
