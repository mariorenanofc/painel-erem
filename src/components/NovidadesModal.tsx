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
    // Dispara confetes com cores temáticas da nova atualização (Verde Esmeralda)
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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border-4 border-emerald-400 transition-all duration-500 transform ${animando ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          <div className="text-5xl animate-bounce mb-2 relative z-10">📖</div>
          <h2 className="font-black text-2xl text-white uppercase tracking-widest relative z-10 drop-shadow-md">
            Atualização v1.7.0
          </h2>
          <p className="text-emerald-100 text-xs font-black mt-1 relative z-10 tracking-wider">
            A CENTRAL DE ESTUDOS CHEGOU!
          </p>
        </div>

        {/* CORPO / LISTA DE NOVIDADES */}
        <div className="p-6 bg-slate-50 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="space-y-4">
            <p className="text-slate-600 font-medium text-center text-sm mb-4">
              Preparámos ferramentas incríveis para turbinar a sua aprendizagem
              e facilitar as entregas!
            </p>

            {/* NOVIDADE 1: CENTRAL DE GABARITOS */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-5 rounded-xl shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-7xl opacity-10">
                🗝️
              </div>
              <h3 className="font-black text-emerald-900 text-sm md:text-base flex items-center gap-2 mb-2">
                <span>🗝️</span> Nova Central de Gabaritos
              </h3>
              <p className="text-xs md:text-sm text-emerald-800 leading-relaxed mb-3">
                Agora tens um Hub exclusivo para consultar as{" "}
                <strong>Resoluções Oficiais e Códigos-Fonte</strong> dos módulos
                passados! Ao abrir um gabarito, irás rever o enunciado original,
                as alternativas e a resposta detalhada.
              </p>
              <div className="bg-white/70 p-3 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-900 font-bold">
                  💡 Dica: O botão da Central está na tua tela inicial, mas os
                  gabaritos só aparecem quando o Tutor os liberar!
                </p>
              </div>
            </div>

            {/* NOVIDADE 2: LINKS MÁGICOS */}
            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
              <h3 className="font-black text-blue-800 text-sm md:text-base flex items-center gap-2 mb-1">
                <span>🔗</span> Links Mágicos e Interativos
              </h3>
              <p className="text-xs md:text-sm text-blue-700 leading-relaxed">
                Sabemos que o bloqueio de texto impedia copiar os links de
                apoio. Problema resolvido! Qualquer link adicionado pelo Tutor
                nas instruções da missão ou no gabarito transforma-se agora num{" "}
                <strong>botão clicável instantâneo</strong>.
              </p>
            </div>

            {/* NOVIDADE 3: ATALHO CLASSROOM */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
              <h3 className="font-black text-amber-800 text-sm md:text-base flex items-center gap-2 mb-1">
                <span>🏫</span> Atalho Direto para o AVA
              </h3>
              <p className="text-xs md:text-sm text-amber-700 leading-relaxed">
                Estudou o gabarito e percebeu onde errou no seu projeto? A nova
                tela de estudos tem um botão que o leva{" "}
                <strong>
                  diretamente para a atividade oficial do Google Classroom
                </strong>{" "}
                para anexar o seu material!
              </p>
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="p-4 bg-white border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 text-lg"
          >
            BORA ESTUDAR! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
