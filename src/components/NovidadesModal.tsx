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
          <div className="absolute -top-10 -right-10 text-9xl opacity-10 rotate-12">
            🚀
          </div>
          <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm border border-white/30">
            Atualização Versão 1.3.0
          </span>
          <h2 className="text-2xl font-black text-white mt-4 leading-tight relative z-10">
            O Trilha Tech virou Rede Social!
          </h2>
          <p className="text-blue-100 text-sm mt-2 relative z-10 font-medium">
            Novos recursos sociais e de ranqueamento para deixar a sua jornada
            ainda mais épica.
          </p>
        </div>

        {/* CORPO / LISTA DE NOVIDADES */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
          <div className="space-y-4">
            {/* Novidade 1: Perfil Público */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">👀</div>
              <div>
                <h3 className="font-bold text-slate-800">
                  Perfis Públicos (Vitrine)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Curioso para saber como o 1º lugar do ranking conseguiu tanto
                  XP? Agora você pode{" "}
                  <strong>clicar no nome de qualquer colega</strong> no Ranking
                  para espiar o perfil, avatar, estatísticas e o mural de
                  conquistas dele!
                </p>
              </div>
            </div>

            {/* Novidade 2: Curtidas e Badges de Influenciador */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="text-3xl shrink-0">❤️</div>
              <div>
                <h3 className="font-bold text-slate-800">
                  Curtidas e Popularidade
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mostre apoio aos seus amigos deixando um &quot;Like&ldquo; no perfil
                  deles (limite de 1 vez por dia). Quem acumular muitas curtidas
                  desbloqueia as novas Badges exclusivas de{" "}
                  <strong>Influenciador Digital</strong>!
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
                  seu &ldquo;foguinho&quot; de dias consecutivos. Se faltar, a contagem
                  volta para zero.
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
            ENTENDI, VAMOS EXPLORAR! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
