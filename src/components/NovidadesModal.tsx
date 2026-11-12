/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface NovidadesModalProps {
  onClose: () => void;
  versao?: string;
  markdown?: string;
}

interface ItemNovidade {
  texto: string;
}

interface SlideNovidade {
  id: string;
  icone: string;
  badge: string;
  badgeCor: string;
  titulo: string;
  subtitulo: string;
  itens: ItemNovidade[];
}

// Remove formatação bruta de markdown (como **, *, `, #) de títulos
function limparTextoMarkdown(str: string): string {
  return str
    .replace(/^#+\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .trim();
}

// Extrai emoji inicial se houver
function extrairEmoji(str: string): { emoji: string; texto: string } {
  const match = str.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
  if (match) {
    const emoji = match[0];
    const texto = str.slice(emoji.length).trim();
    return { emoji, texto };
  }
  return { emoji: "🚀", texto: str };
}

export const SLIDES_PADRAO_V2_2: SlideNovidade[] = [
  {
    id: "aniversarios-calendario",
    icone: "🎂",
    badge: "Calendário & Comunidade",
    badgeCor: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    titulo: "Aniversariantes no Calendário Escolar",
    subtitulo: "Acompanhe as datas especiais de todos os colegas diretamente no cronograma",
    itens: [
      { texto: "🎂 **Mural de Aniversários:** Veja os aniversariantes do dia e do mês integrados ao cronograma de aulas e prazos." },
      { texto: "🔒 **Privacidade Respeitada:** Exibição elegante com Primeiro Nome e Último Sobrenome, sem expor dados sensíveis ou turmas." },
      { texto: "⚡ **Filtro Rápido:** Novo botão de filtro '🎂 Aniversários' para localizar celebrações em um clique." }
    ]
  },
  {
    id: "coding-practice",
    icone: "📱",
    badge: "Coding Practice",
    badgeCor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    titulo: "Blindagem Mobile para Smartphones",
    subtitulo: "Pratique código no celular sem erros involuntários de digitação",
    itens: [
      { texto: "🛡️ **Anti-Shift Inteligente:** O teclado do celular não força mais maiúsculas acidentais em código." },
      { texto: "⚡ **Barra de Símbolos:** Atalhos rápidos de toque para `Tab`, `{`, `}`, `(`, `)`, `;`, `=`, etc." },
      { texto: "⌨️ **Sem Perder Foco:** Toque nos símbolos na tela sem que o teclado virtual do celular feche." }
    ]
  },
  {
    id: "hall-da-fama",
    icone: "🏛️",
    badge: "Hall da Fama",
    badgeCor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    titulo: "Santuário dos Veteranos & Stories 9:16",
    subtitulo: "Celebre os formandos e compartilhe conquistas em alta resolução",
    itens: [
      { texto: "📸 **Cards para Story (9:16):** Exporte imagens em alta definição para Instagram e WhatsApp com QR Code dinâmico." },
      { texto: "🏛️ **Vitrine de Veteranos:** Conheça os formandos oficiais com memorial, stack, projetos e certificações." },
      { texto: "🌗 **Contraste Perfeito:** Visual 100% calibrado para leitura nítida em modo claro e escuro." }
    ]
  }
];

export default function NovidadesModal({
  onClose,
  versao = "v2.2.1",
  markdown = ""
}: NovidadesModalProps) {
  const [slideAtual, setSlideAtual] = useState(0);

  // Converte markdown inteligente em slides enxutos ou usa os slides padrão
  const slides: SlideNovidade[] = useMemo(() => {
    if (!markdown || !markdown.trim()) {
      return SLIDES_PADRAO_V2_2;
    }

    // Normaliza divisões de seções (divide por cabeçalhos ### ou divisores ---)
    let blocosBrutos = markdown.split(/(?:^|\n)(?:---|(?=###\s*))/g).map((b) => b.trim()).filter(Boolean);

    // Se houver apenas 1 bloco grande com vários ### internos, divide por ###
    if (blocosBrutos.length <= 1 && markdown.includes("###")) {
      blocosBrutos = markdown.split(/(?=###\s*)/g).map((b) => b.trim()).filter(Boolean);
    }

    if (blocosBrutos.length === 0) {
      return SLIDES_PADRAO_V2_2;
    }

    const resultado: SlideNovidade[] = [];

    blocosBrutos.forEach((bloco, idx) => {
      const linhas = bloco.split("\n").map((l) => l.trim()).filter(Boolean);
      if (linhas.length === 0) return;

      // Procura linha de título (começando com ### ou a primeira linha)
      const indiceTitulo = linhas.findIndex((l) => l.startsWith("###"));
      let linhaTitulo = indiceTitulo !== -1 ? linhas[indiceTitulo] : linhas[0];
      linhaTitulo = linhaTitulo.replace(/^###\s*/, "").trim();

      let { emoji, texto: tituloPuro } = extrairEmoji(limparTextoMarkdown(linhaTitulo));

      // Blindagem contra títulos que na verdade são parágrafos longos (> 55 caracteres)
      let subtituloPersonalizado = "Confira as melhorias implementadas na plataforma";
      if (tituloPuro.length > 55) {
        subtituloPersonalizado = tituloPuro.slice(0, 110) + "...";
        tituloPuro = `Novidade #${idx + 1}`;
      }

      // As demais linhas viram itens curtos
      const itensLinhas = linhas
        .filter((_, i) => i !== (indiceTitulo !== -1 ? indiceTitulo : 0))
        .map((l) => l.replace(/^[*•-]\s*/, "").trim())
        .filter((l) => l.length > 0 && !l.startsWith("###"))
        .slice(0, 4); // Limita a no máximo 4 itens para nunca poluir a tela

      resultado.push({
        id: `slide-${idx}`,
        icone: emoji,
        badge: `Novidade ${idx + 1}`,
        badgeCor: idx === 0 ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : idx === 1 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        titulo: tituloPuro || `Novidade #${idx + 1}`,
        subtitulo: subtituloPersonalizado,
        itens: itensLinhas.length > 0 ? itensLinhas.map((t) => ({ texto: t })) : [{ texto: "Melhorias gerais de estabilidade e interface." }]
      });
    });

    return resultado.length > 0 ? resultado : SLIDES_PADRAO_V2_2;
  }, [markdown]);

  const totalSlides = slides.length;
  const slide = slides[slideAtual] || slides[0];

  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.3 },
      colors: ["#6366f1", "#a855f7", "#fbbf24", "#10b981", "#ffffff"],
      zIndex: 99999
    });
  }, []);

  const avancar = () => {
    if (slideAtual < totalSlides - 1) {
      setSlideAtual((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const voltar = () => {
    if (slideAtual > 0) {
      setSlideAtual((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 selection:bg-indigo-500 selection:text-white">
        {/* Backdrop com desfoque profundo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Container Compacto e Elegante */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.2rem] shadow-[0_0_50px_rgba(99,102,241,0.22)] border border-slate-200/90 dark:border-white/10 w-full max-w-lg overflow-hidden flex flex-col relative z-10"
        >
          {/* Header Superior Limpo com Gradiente */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 text-center relative overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100 bg-white/20 px-3 py-0.5 rounded-full border border-white/25">
                🚀 Atualização {versao}
              </span>

              {/* Botão Fechar */}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Stepper / Indicador de Telas */}
            <div className="flex items-center justify-center gap-1.5 relative z-10">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSlideAtual(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === slideAtual ? "w-7 bg-white shadow-xs" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  title={`Ir para novidade ${idx + 1}`}
                />
              ))}
            </div>

            <p className="text-white/80 text-[10px] font-bold mt-2 relative z-10 uppercase tracking-widest">
              Passo {slideAtual + 1} de {totalSlides}
            </p>
          </div>

          {/* Conteúdo Dinâmico do Slide */}
          <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.18 }}
                className="space-y-3.5"
              >
                {/* Ícone e Título Principal (Totalmente Sem Asteriscos) */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200/50 dark:border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {slide.icone}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border mb-1 ${slide.badgeCor}`}>
                      {slide.badge}
                    </span>
                    <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-snug truncate">
                      {slide.titulo}
                    </h3>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {slide.subtitulo}
                </p>

                {/* Lista de Tópicos Objetivos */}
                <div className="space-y-2 pt-1">
                  {slide.itens.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal flex items-start gap-2.5"
                    >
                      <span className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0 text-sm">✦</span>
                      <div className="flex-1">
                        <ReactMarkdown
                          components={{
                            strong: ({ ...props }) => (
                              <strong className="font-bold text-slate-900 dark:text-white" {...props} />
                            ),
                            code: ({ ...props }) => (
                              <code className="bg-slate-200/80 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-mono text-indigo-600 dark:text-indigo-300 font-semibold" {...props} />
                            )
                          }}
                        >
                          {item.texto}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rodapé Fixo com Navegação */}
          <div className="px-5 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={voltar}
              disabled={slideAtual === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                slideAtual === 0
                  ? "opacity-0 pointer-events-none"
                  : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              <span>←</span>
              <span>Anterior</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={avancar}
              className="cursor-pointer px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 uppercase tracking-wider flex items-center gap-2 select-none"
            >
              <span>{slideAtual === totalSlides - 1 ? "🎉 Entendido!" : "Próxima"}</span>
              <span>{slideAtual === totalSlides - 1 ? "🚀" : "→"}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
