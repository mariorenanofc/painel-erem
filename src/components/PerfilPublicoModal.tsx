/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { calcularBadges } from "../utils/badges";
import { Atividade } from "../types";

interface PerfilPublicoModalProps {
  matriculaAlvo: string;
  matriculaVisualizador: string;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PerfilPublicoModal({
  matriculaAlvo,
  matriculaVisualizador,
  onClose,
}: PerfilPublicoModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [curtindo, setCurtindo] = useState(false);

  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "buscar_perfil_publico",
            matriculaAlvo: matriculaAlvo,
            matriculaVisualizador: matriculaVisualizador,
          }),
        });
        const data = await res.json();
        if (data.status === "sucesso") {
          setPerfil(data.perfil);
        }
      } catch (e) {
        console.error("Erro ao buscar perfil público");
      } finally {
        setCarregando(false);
      }
    };
    if (GOOGLE_API_URL) buscarPerfil();
  }, [GOOGLE_API_URL, matriculaAlvo, matriculaVisualizador]);

  const handleCurtir = async () => {
    if (curtindo || perfil.jaCurtiuHoje) return;
    setCurtindo(true);

    // Efeito visual imediato e confetes 🎉
    setPerfil({
      ...perfil,
      totalCurtidas: perfil.totalCurtidas + 1,
      jaCurtiuHoje: true,
    });
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#ec4899", "#f43f5e", "#ffffff"],
    });

    try {
      await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "curtir_perfil",
          matriculaRemetente: matriculaVisualizador,
          matriculaDestinatario: matriculaAlvo,
        }),
      });
    } catch (e) {
      // Falha silenciosa ou aviso
    } finally {
      setCurtindo(false);
    }
  };

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pink-500"></div>
      </div>
    );
  }

  if (!perfil) return null;

  const avatar =
    perfil.avatar && perfil.avatar !== "avatar-padrao" ? perfil.avatar : "👨‍💻";

  // --- TRUQUE MÁGICO PARA RECUPERAR ÍCONES E DESCRIÇÕES DAS BADGES ---
  // Geramos um catálogo de todas as badges passando valores máximos
  const dummyAtivs = Array.from({ length: 300 }).map((_, i) => ({
    id: `DUMMY-${i}`,
    status: "Avaliado",
    xpGanho: 10,
    statusPrazo: "No Prazo",
  })) as Atividade[];

  const catalogoBadges = calcularBadges({
    atividades: dummyAtivs,
    xpTotal: 999999,
    xpDoado: 999999,
    xpRecebido: 999999,
    totalCheckins: 99999,
    whatsappConfirmado: true,
    aniversarioResgatado: true,
    totalCurtidas: 999999,
  });

  // Mapeamos as strings vindas do banco para os objetos ricos do catálogo
  const badgesExibicao = (perfil.badges || []).map((nomeBadge: string) => {
    const encontrada = catalogoBadges.find((b) => b.nome === nomeBadge);
    return (
      encontrada || {
        id: nomeBadge,
        nome: nomeBadge,
        icone: "🏆",
        descricao: "Conquista especial do Trilha Tech!",
      }
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      {/* MUDANÇA 1: max-w-3xl para ficar largo e bonito no Desktop */}
      <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20 relative">
        {/* CABEÇALHO DO PERFIL */}
        <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-6 md:p-8 relative overflow-hidden shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-3xl leading-none text-white hover:text-pink-200 transition-colors z-20"
          >
            &times;
          </button>

          {/* Efeitos de fundo */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

          {/* MUDANÇA 2: flex-col no mobile, flex-row no Desktop. Acaba com o overlap! */}
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Maior */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full border-4 border-white flex items-center justify-center text-6xl md:text-7xl shadow-xl backdrop-blur-sm shrink-0 transform hover:scale-105 transition-all">
              {avatar}
            </div>

            {/* Infos do Aluno */}
            <div className="flex-1 text-center md:text-left flex flex-col justify-center">
              <h2 className="font-black text-2xl md:text-3xl text-white tracking-tight">
                {perfil.nome}
              </h2>
              <p className="text-pink-100 font-bold text-sm tracking-widest uppercase mt-1">
                {perfil.turma}
              </p>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-white font-bold text-xs backdrop-blur-sm border border-white/30 shadow-inner">
                  🏆 Nível: {perfil.nivel}
                </span>
                {/* A NOVA BADGE DE CURTIDAS AQUI 👇 */}
                <span className="inline-block bg-pink-500/80 px-4 py-1.5 rounded-full text-white font-bold text-xs backdrop-blur-sm border border-pink-400 shadow-inner">
                  ❤️ {perfil.totalCurtidas} Curtidas
                </span>
                {perfil.ofensivaDias > 0 && (
                  <span className="inline-block bg-orange-500/80 px-4 py-1.5 rounded-full text-white font-bold text-xs backdrop-blur-sm border border-orange-400 shadow-inner">
                    🔥 {perfil.ofensivaDias} Dias de Ofensiva.
                  </span>
                )}
              </div>
            </div>

            {/* MUDANÇA 3: O Botão Curtir agora é um elemento natural do layout (lado direito no desktop) */}
            <div className="shrink-0 mt-2 md:mt-0 flex items-center md:h-32">
              <button
                onClick={handleCurtir}
                disabled={perfil.jaCurtiuHoje || curtindo}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-black shadow-lg transition-all border-2 ${perfil.jaCurtiuHoje ? "bg-pink-50 border-pink-200 text-pink-400 cursor-not-allowed" : "bg-pink-500 border-pink-400 text-white hover:bg-pink-600 hover:scale-105 active:scale-95"}`}
              >
                <span className={`text-xl ${perfil.jaCurtiuHoje ? "" : "animate-pulse"}`}>
                  ❤️
                </span>
                {perfil.jaCurtiuHoje ? "Você curtiu hoje!" : "Deixar um Like!"}
              </button>
            </div>
          </div>
        </div>

        {/* CORPO: ESTATÍSTICAS E BADGES */}
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
          {/* MUDANÇA 4: Grid 2x2 no mobile e 4 colunas no Desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">⭐</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                XP Total
              </p>
              <p className="text-xl md:text-2xl font-black text-emerald-600">
                {perfil.xpTotal}
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Missões Feitas
              </p>
              <p className="text-xl md:text-2xl font-black text-blue-600">
                {perfil.missoesConcluidas}
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">💸</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Pix Enviado
              </p>
              <p className="text-xl md:text-2xl font-black text-amber-500">
                {perfil.pixEnviado}
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="text-2xl mb-1">🤝</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Pix Recebido
              </p>
              <p className="text-xl md:text-2xl font-black text-indigo-500">
                {perfil.pixRecebido}
              </p>
            </div>
          </div>

          {/* MUDANÇA 5: O Mural maravilhoso com Cards de Badges */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
              Mural de Conquistas
            </h3>
            {badgesExibicao.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl opacity-40 mb-2 block">📭</span>
                <p className="text-sm text-slate-500 font-medium">
                  Este aluno ainda não tem conquistas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badgesExibicao.map((badge: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="bg-white p-2 rounded-lg text-2xl shadow-sm border border-amber-100 shrink-0">
                      {badge.icone}
                    </div>
                    <div>
                      <h4 className="font-black text-amber-900 text-sm leading-tight">
                        {badge.nome}
                      </h4>
                      <p className="text-[10px] font-bold text-amber-700/80 mt-0.5 line-clamp-2">
                        {badge.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
