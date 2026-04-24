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
    // Dispara uns confetes para celebrar a nova versão
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 }, zIndex: 99999 });
    setAnimando(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-all duration-500 transform ${animando ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-9xl opacity-10 rotate-12">🚀</div>
          <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm border border-white/30">
            Atualização Versão 1.2.0
          </span>
          <h2 className="text-2xl font-black text-white mt-4 leading-tight relative z-10">
            Grandes Novidades no Portal!
          </h2>
          <p className="text-blue-100 text-sm mt-2 relative z-10 font-medium">
            O sistema evoluiu e trouxe novos recursos para turbinar a sua jornada.
          </p>
        </div>

        {/* CORPO / LISTA DE NOVIDADES */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
          <div className="space-y-4">
            
            {/* Novidade 1: Barra de Progresso (A mais nova!) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">📊</div>
              <div>
                <h3 className="font-bold text-slate-800">Barra de Progresso de Nível</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Agora você pode acompanhar visualmente o quanto de XP falta para você subir de nível (Bronze, Prata, Ouro...). Acompanhe a barra e chegue ao topo!
                </p>
              </div>
            </div>

            {/* Novidade 2: Ofensiva */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">🔥</div>
              <div>
                <h3 className="font-bold text-slate-800">Ofensiva de Check-in</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Não falte às aulas! Se a sua assiduidade for superior a 90%, o seu check-in diário passa a valer <strong>15 XP</strong> (Em Chamas). Se cair muito, volta para os 10 XP padrão.
                </p>
              </div>
            </div>

            {/* Novidade 3: Extrato de Pix */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">🏦</div>
              <div>
                <h3 className="font-bold text-slate-800">Extrato Bancário do Pix</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Adicionamos um &quot;Extrato&quot; na sua tela de Pix! Acompanhe o histórico exato de quem você recebeu e para quem você enviou os seus preciosos XP.
                </p>
              </div>
            </div>

            {/* Novidade 4: Missões Atrasadas */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">⏳</div>
              <div>
                <h3 className="font-bold text-slate-800">Entregas Atrasadas</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Perdeu o prazo? Agora você pode enviar missões atrasadas para não ficar com zero! Mas atenção: o sistema desconta automaticamente <strong>-1 XP por cada dia de atraso</strong>.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* RODAPÉ */}
        <div className="p-4 bg-white border-t border-slate-200">
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95"
          >
            ENTENDI, VAMOS LÁ! 🚀
          </button>
        </div>
        
      </div>
    </div>
  );
}