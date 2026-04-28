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
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.3 },
      zIndex: 99999,
    });
    setAnimando(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-all duration-500 transform ${animando ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          <div className="text-5xl animate-bounce mb-2 relative z-10">🚀</div>
          <h2 className="font-black text-2xl text-white relative z-10">
            Novidades na Área!
          </h2>
          <p className="text-blue-100 text-sm font-medium mt-1 relative z-10">
            A plataforma Trilha Tech acabou de ser atualizada com mecânicas
            incríveis.
          </p>
        </div>

        {/* CORPO / LISTA DE NOVIDADES */}
        <div className="p-6 bg-slate-50 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {/* Novidade 1: Pix Escolar e Perfil */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">💸</div>
              <div>
                <h3 className="font-bold text-slate-800">
                  Pix de XP para Toda a Escola!
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  O sistema financeiro foi expandido! Agora você pode transferir
                  XP para{" "}
                  <strong>qualquer colega, independente da turma</strong>. Além
                  disso, você pode ir no Ranking, abrir o{" "}
                  <strong>Perfil do Colega</strong> e enviar um Pix diretamente
                  por lá com apenas um clique!
                </p>
              </div>
            </div>

            {/* Novidade 2: Avatares e Curtidas */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">❤️</div>
              <div>
                <h3 className="font-bold text-slate-800">
                  Rede Social e Likes
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Agora você pode visitar o perfil dos seus colegas no Ranking,
                  ver as conquistas deles e deixar um <strong>Like (❤️)</strong>{" "}
                  no perfil deles (limite de 1 vez por dia). Quem acumular
                  muitas curtidas desbloqueia novas Badges exclusivas!
                </p>
              </div>
            </div>

            {/* Novidade 3: Ofensiva (Streak) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">🔥</div>
              <div>
                <h3 className="font-bold text-slate-800">
                  Ofensiva de Aulas (Streak)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  O sistema agora rastreia a sua assiduidade de forma rigorosa!
                  Mantenha a sua sequência de aulas sem faltar para ostentar o
                  seu &ldquo;foguinho&quot; de dias consecutivos. Se faltar, a
                  contagem volta para zero.
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
            ENTENDI, VAMOS LÁ!
          </button>
        </div>
      </div>
    </div>
  );
}
