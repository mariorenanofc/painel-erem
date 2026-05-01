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
    // Dispara confetes com cores de Ouro, Prata e Bronze
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.3 },
      colors: ["#fbbf24", "#94a3b8", "#f97316", "#ffffff"],
      zIndex: 99999,
    });
    setAnimando(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border-4 border-yellow-400 transition-all duration-500 transform ${animando ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          <div className="text-5xl animate-bounce mb-2 relative z-10">👑</div>
          <h2 className="font-black text-2xl text-white uppercase tracking-widest relative z-10 drop-shadow-md">
            Atualização v1.6.0
          </h2>
          <p className="text-yellow-100 text-xs font-black mt-1 relative z-10 tracking-wider">
            O HALL DA FAMA CHEGOU!
          </p>
        </div>

        {/* CORPO / LISTA DE NOVIDADES */}
        <div className="p-6 bg-slate-50 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            
            <p className="text-slate-600 font-medium text-center text-sm mb-4">
              A competição subiu de nível! Descubra as novas recompensas para os melhores alunos da escola.
            </p>

            {/* NOVIDADE 1: PLACAS DE ELITE (O GRANDE DESTAQUE) */}
            <div className="bg-gradient-to-br from-yellow-100 to-amber-50 border-2 border-yellow-300 p-5 rounded-xl shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-7xl opacity-20">🏆</div>
              <h3 className="font-black text-yellow-900 text-sm md:text-base flex items-center gap-2 mb-2">
                <span>👑</span> Placas de Elite (Troféu Rotativo)
              </h3>
              <p className="text-xs md:text-sm text-yellow-800 leading-relaxed mb-3">
                Os alunos que terminarem o mês no <strong>Top 1, Top 2 e Top 3 Geral da Escola</strong> receberão as lendárias Placas 3D Metálicas de Elite Ouro, Prata e Bronze no seu perfil!
              </p>
              <div className="bg-white/60 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-900 font-bold">
                  ⚠️ Cuidado: O Troféu é rotativo! Se no mês seguinte você perder a sua posição no pódio, a placa será transferida para o novo campeão, e você receberá uma <em>Badge de Legado</em> para provar que já foi da Elite.
                </p>
              </div>
            </div>

            {/* NOVIDADE 2: MATERIAIS DE APOIO */}
            <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-xl shadow-sm relative overflow-hidden">
              <h3 className="font-black text-blue-800 text-sm md:text-base flex items-center gap-2 mb-1">
                <span>📖</span> Missões de &quot;Material&quot; (XP Fácil!)
              </h3>
              <p className="text-xs md:text-sm text-blue-700 leading-relaxed">
                Ganhe XP apenas por <strong>consumir conteúdos</strong> (PDFs, vídeos) no Classroom! Quando vir uma missão do tipo <span className="bg-blue-200 px-1 rounded font-bold">Material</span>, acesse o link, marque a caixinha de honestidade e resgate os seus XP na hora!
              </p>
            </div>

            {/* NOVIDADE 3: GOD MODE */}
            <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
              <h3 className="font-black text-slate-700 text-sm md:text-base flex items-center gap-2 mb-1">
                <span>⚡</span> O Olho do Mestre
              </h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Lembrete: O Tutor possui o <strong>God Mode</strong> e pode injetar bônus de XP por boas ações ou aplicar punições severas (-100 XP) por trapaças (ex: uso de IA nas atividades).
              </p>
            </div>

          </div>
        </div>

        {/* RODAPÉ */}
        <div className="p-4 bg-white border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 text-lg"
          >
            VOU LUTAR PELO TOP 1!
          </button>
        </div>
      </div>
    </div>
  );
}