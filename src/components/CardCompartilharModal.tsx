"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { CardCompartilharModalProps } from "../types";

type TemaStory = "ouro" | "cyber" | "aurora";

export default function CardCompartilharModal({
  isOpen,
  onClose,
  formando,
}: CardCompartilharModalProps) {
  const [tema, setTema] = useState<TemaStory>("ouro");
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const urlHall = typeof window !== "undefined"
    ? `${window.location.origin}/hall-da-fama?destaque=${encodeURIComponent(formando.matricula)}`
    : `https://trilhatech.erem.edu.br/hall-da-fama?destaque=${encodeURIComponent(formando.matricula)}`;

  // Download do Story em alta definição (1080x1920)
  const handleBaixarStory = async () => {
    if (!cardRef.current || gerandoImagem) return;
    setGerandoImagem(true);

    try {
      // Pequeno timeout para garantir que fontes e layouts estejam assentados
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3, // Gera ~1080x1920 para Stories em alta definição
        cacheBust: true,
      });

      const nomeLimpo = formando.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const link = document.createElement("a");
      link.download = `trilha-tech-story-${nomeLimpo || "formando"}-${formando.anoFormacao || 2026}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981"],
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Erro ao gerar card de story:", err.message);
      alert("Não foi possível gerar a imagem automaticamente. Tente novamente.");
    } finally {
      setGerandoImagem(false);
    }
  };

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlHall);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // fallback
    }
  };

  // Configurações visuais por tema
  const temaConfig = {
    ouro: {
      nome: "Ouro Cósmico",
      gradienteFundo: "from-slate-950 via-[#181102] to-slate-950",
      borda: "border-amber-400/50",
      brilhoTopo: "from-amber-500/25 via-yellow-500/15 to-transparent",
      textoDestaque: "from-amber-200 via-yellow-400 to-amber-500",
      aureolaAvatar: "from-amber-400 via-yellow-300 to-amber-500",
      badgeTema: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    },
    cyber: {
      nome: "Cyber Neon",
      gradienteFundo: "from-slate-950 via-[#0d0722] to-slate-950",
      borda: "border-fuchsia-400/50",
      brilhoTopo: "from-fuchsia-500/25 via-cyan-500/15 to-transparent",
      textoDestaque: "from-cyan-200 via-fuchsia-300 to-pink-500",
      aureolaAvatar: "from-cyan-400 via-fuchsia-500 to-pink-500",
      badgeTema: "bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300",
    },
    aurora: {
      nome: "Aurora Deep",
      gradienteFundo: "from-slate-950 via-[#031518] to-slate-950",
      borda: "border-emerald-400/50",
      brilhoTopo: "from-emerald-500/25 via-teal-500/15 to-transparent",
      textoDestaque: "from-emerald-200 via-teal-300 to-cyan-400",
      aureolaAvatar: "from-emerald-400 via-teal-300 to-cyan-500",
      badgeTema: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    },
  }[tema];

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(urlHall)}&bgcolor=030712&color=f8fafc`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="relative max-w-4xl w-full bg-slate-900/95 border border-amber-400/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-white my-auto flex flex-col md:flex-row gap-6 items-center md:items-stretch"
        >
          {/* BOTÃO FECHAR */}
          <button
            onClick={onClose}
            className="cursor-pointer absolute top-4 right-4 text-slate-400 hover:text-white text-2xl w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all z-20"
            aria-label="Fechar modal"
          >
            &times;
          </button>

          {/* ========================================================
              LADO ESQUERDO: CONTROLES & PERSONALIZAÇÃO
             ======================================================== */}
          <div className="w-full md:w-80 flex flex-col justify-between space-y-6 pt-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 mb-2">
                <span>📸</span> Card Oficial para Stories
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                Compartilhar Conquista
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Gere um card colecionável no formato 9:16 (Instagram Stories e WhatsApp Status) para celebrar a formatura com sua comunidade.
              </p>

              {/* SELETOR DE TEMAS */}
              <div className="mt-6">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Escolha o Tema Visual
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ouro", "cyber", "aurora"] as TemaStory[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTema(t)}
                      className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center ${tema === t
                          ? "bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md scale-102"
                          : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                        }`}
                    >
                      {t === "ouro" ? "👑 Ouro" : t === "cyber" ? "⚡ Cyber" : "🌌 Aurora"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AÇÕES DE EXPORTAÇÃO */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBaixarStory}
                disabled={gerandoImagem}
                className="cursor-pointer w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{gerandoImagem ? "⏳" : "📥"}</span>
                <span>{gerandoImagem ? "Renderizando Card..." : "Baixar Story (PNG HD)"}</span>
              </motion.button>

              <button
                onClick={handleCopiarLink}
                className="cursor-pointer w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>{copiado ? "✅" : "🔗"}</span>
                <span>{copiado ? "Link Copiado!" : "Copiar Link Público"}</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              LADO DIREITO: PRÉVIA AO VIVO DO STORY (9:16)
             ======================================================== */}
          <div className="flex-1 flex items-center justify-center w-full py-2">
            {/* CONTAINER 9:16 (360x640 preview - exportado a 1080x1920) */}
            <div
              ref={cardRef}
              className={`w-[340px] sm:w-[360px] h-[604px] sm:h-[640px] rounded-3xl relative overflow-hidden bg-gradient-to-b ${temaConfig.gradienteFundo} border-2 ${temaConfig.borda} shadow-2xl p-6 flex flex-col justify-between select-none`}
              style={{
                boxShadow: "0 0 50px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Efeitos Nebulares de Fundo */}
              <div
                className={`absolute top-0 left-0 right-0 h-44 bg-gradient-to-b ${temaConfig.brilhoTopo} blur-2xl pointer-events-none`}
              />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15 mix-blend-overlay pointer-events-none" />

              {/* 1. TOPO DO CARD */}
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 backdrop-blur-md">
                  <span className="text-xs">🎓</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">
                    Trilha Tech • Hall da Fama
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-1">
                  Turma {formando.anoFormacao || 2026}
                </p>
              </div>

              {/* 2. AVATAR CENTRAL & IDENTIDADE */}
              <div className="relative z-10 flex flex-col items-center text-center my-auto">
                <div className="relative mb-3">
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-tr ${temaConfig.aureolaAvatar} blur-md opacity-80 scale-105`}
                  />
                  <img
                    src={formando.avatar}
                    alt={formando.nome}
                    crossOrigin="anonymous"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-amber-300 object-cover relative z-10 bg-slate-950 shadow-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://api.dicebear.com/9.x/bottts/svg?seed=fallback";
                    }}
                  />
                  <div className="absolute -bottom-2 right-1/2 translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                    ⭐ Formando Oficial
                  </div>
                </div>

                <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-tight leading-tight mt-1 line-clamp-1 max-w-[300px]">
                  {formando.nome}
                </h3>

                <p
                  className={`text-xs font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${temaConfig.textoDestaque} mt-1`}
                >
                  {formando.especialidade || "Desenvolvedor de Software"}
                </p>

                {formando.seloHonorifico && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider text-amber-300">
                    {formando.seloHonorifico}
                  </span>
                )}

                {/* TECH STACK PILLS */}
                {formando.techStack && formando.techStack.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-[300px]">
                    {formando.techStack.slice(0, 4).map((tech, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-slate-200 backdrop-blur-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* MÉTRICAS CHAVE */}
                <div className="grid grid-cols-2 gap-2 w-full mt-4 max-w-[280px]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-xs sm:text-sm font-black text-amber-300 block">
                      ⭐ {formando.xpFinal?.toLocaleString("pt-BR") || 0} XP
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                      XP de Carreira
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-xs sm:text-sm font-black text-emerald-400 block">
                      🚀 {formando.projetosConcluidos || 10}+
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                      Projetos Aprovados
                    </span>
                  </div>
                </div>

                {/* FRASE DE FORMATURA */}
                {formando.fraseFormatura && (
                  <div className="mt-3 p-2 bg-white/5 rounded-xl border border-white/5 max-w-[280px]">
                    <p className="text-[10px] text-slate-300 italic line-clamp-2 leading-tight">
                      &ldquo;{formando.fraseFormatura}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* 3. RODAPÉ DE VALIDAÇÃO COM QR CODE */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                    Validação Pública
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-200">
                    trilhatech.erem.edu.br
                  </p>
                  <span className="text-[8px] text-emerald-400 font-bold block mt-0.5">
                    ✓ Autenticidade Registrada
                  </span>
                </div>

                <div className="w-12 h-12 rounded-lg bg-slate-950 p-1 border border-amber-400/40 shrink-0 flex items-center justify-center shadow-md">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Hall da Fama"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

