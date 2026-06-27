/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface NovidadesModalProps {
  onClose: () => void;
}

export default function NovidadesModal({ onClose }: NovidadesModalProps) {
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.3 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#ffffff"],
      zIndex: 99999,
    });
    setAnimando(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-colors duration-300">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border-4 border-indigo-500 dark:border-indigo-600 transition-all duration-500 transform ${animando ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 p-6 text-center relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          <div className="text-5xl animate-bounce mb-2 relative z-10">🛒</div>
          <h2 className="font-black text-2xl text-white uppercase tracking-widest relative z-10 drop-shadow-md">
            Atualização v1.9.0
          </h2>
          <p className="text-indigo-100 text-xs font-black mt-1 relative z-10 tracking-wider">
            A ECONOMIA DO TRILHA TECH CHEGOU!
          </p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto max-h-[60vh] custom-scrollbar transition-colors duration-300">
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 font-medium text-center text-sm mb-4 transition-colors">
              Prepare o seu XP! A nossa nova economia virtual está ativa:
            </p>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl shadow-md relative overflow-hidden transition-colors duration-300 border border-indigo-400">
              <h3 className="font-black text-white text-sm md:text-base flex items-center gap-2 mb-2">
                <span>🛒</span> Loja Trilha Tech
              </h3>
              <p className="text-xs md:text-sm text-indigo-50 leading-relaxed">
                Agora você pode gastar o seu XP acumulado! Troque os seus pontos por 
                bilhetes exclusivos da nossa rifa e aumente as suas chances.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl shadow-sm">
              <h3 className="font-black text-emerald-900 dark:text-emerald-400 text-sm md:text-base flex items-center gap-2 mb-1">
                <span>🎟️</span> Sorteio de R$ 50,00
              </h3>
              <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Participe do nosso sorteio oficial! Quanto mais bilhetes você garantir, 
                mais perto você estará do prémio de <strong>R$ 50,00</strong>.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
              <h3 className="font-black text-slate-700 dark:text-slate-200 text-sm md:text-base flex items-center gap-2 mb-1">
                <span>📋</span> Gestão de Bilhetes
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Acesse o novo botão <strong>&ldquo;Ver Meus Bilhetes&quot;</strong> no Dashboard. 
                Agora você tem uma área exclusiva para conferir cada número sorteado 
                que você adquiriu.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <button
            onClick={onClose}
            className="cursor-pointer w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 text-lg"
          >
            VOU À LOJA! 🛍️
          </button>
        </div>
      </div>
    </div>
  );
}