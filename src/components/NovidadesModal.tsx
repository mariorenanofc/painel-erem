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
      colors: ["#10b981", "#34d399", "#fbbf24", "#ffffff"],
      zIndex: 99999,
    });
    setAnimando(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-100 p-4 transition-colors duration-300">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border-4 border-emerald-400 dark:border-emerald-600 transition-all duration-500 transform ${animando ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 p-6 text-center relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          <div className="text-5xl animate-bounce mb-2 relative z-10">🌙</div>
          <h2 className="font-black text-2xl text-white uppercase tracking-widest relative z-10 drop-shadow-md">
            Atualização v1.8.0
          </h2>
          <p className="text-emerald-100 text-xs font-black mt-1 relative z-10 tracking-wider">
            O MODO ESCURO E + AGILIDADE!
          </p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto max-h-[60vh] custom-scrollbar transition-colors duration-300">
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 font-medium text-center text-sm mb-4 transition-colors">
              Continuamos a evoluir a plataforma! Vê as novidades desta versão:
            </p>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-950 dark:to-black border-2 border-slate-700 p-5 rounded-xl shadow-md relative overflow-hidden transition-colors duration-300">
              <div className="absolute -right-4 -top-4 text-7xl opacity-20">🌓</div>
              <h3 className="font-black text-white text-sm md:text-base flex items-center gap-2 mb-2 transition-colors">
                <span>🌓</span> Novo Tema Escuro (Dark Mode)
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-3 transition-colors">
                Protege os teus olhos durante as maratonas de estudos! Agora
                podes alternar entre o tema <strong>Claro e Escuro</strong>{" "}
                clicando no botão do Sol/Lua no topo do portal.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl shadow-sm relative transition-colors duration-300">
              <h3 className="font-black text-emerald-900 dark:text-emerald-400 text-sm md:text-base flex items-center gap-2 mb-1 transition-colors">
                <span>⏳</span> Validação em 10 Segundos
              </h3>
              <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed transition-colors">
                Otimizamos o sistema! Agora, o tempo de espera para confirmar a 
                sua entrega e recebimento de XP no Classroom foi reduzido para 
                apenas <strong>10 segundos</strong>. Mais agilidade para você!
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800/50 p-4 rounded-xl shadow-sm relative transition-colors duration-300">
              <h3 className="font-black text-indigo-900 dark:text-indigo-400 text-sm md:text-base flex items-center gap-2 mb-1 transition-colors">
                <span>🗝️</span> Central de Gabaritos
              </h3>
              <p className="text-xs md:text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed transition-colors">
                Acesso rápido às <strong>Resoluções Oficiais e Códigos-Fonte</strong> dos módulos finalizados. Links clicáveis e botão direto para o Classroom!
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <button
            onClick={onClose}
            className="cursor-pointer w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-800 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 text-lg"
          >
            BORA ESTUDAR! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}