"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CertificadoPFT } from "../types";

interface CertificadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificados: CertificadoPFT[];
  nomeAluno?: string;
  certificadoInicialId?: string | null;
}

// Mapeia estilo visual e ícones para cada tecnologia/módulo do PFT
function getModuloVisual(modulo: string) {
  const modLower = (modulo || "").toLowerCase();

  if (modLower.includes("css")) {
    return {
      icone: "🎨",
      sigla: "CSS",
      corBadge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      corGradiente: "from-sky-500 to-blue-600",
      bordaDestaque: "border-sky-500/30",
      categoria: "Design & Estilização Web",
    };
  }
  if (modLower.includes("html") && modLower.includes("avançado")) {
    return {
      icone: "🚀",
      sigla: "HTML+",
      corBadge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      corGradiente: "from-purple-500 to-indigo-600",
      bordaDestaque: "border-purple-500/30",
      categoria: "SEO, Acessibilidade & Otimização",
    };
  }
  if (modLower.includes("html")) {
    return {
      icone: "🌐",
      sigla: "HTML",
      corBadge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      corGradiente: "from-orange-500 to-amber-600",
      bordaDestaque: "border-orange-500/30",
      categoria: "Estrutura Web & Semântica",
    };
  }
  if (modLower.includes("javascript 02") || modLower.includes("estilos, atributos")) {
    return {
      icone: "⚡",
      sigla: "JS-02",
      corBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      corGradiente: "from-amber-500 to-yellow-600",
      bordaDestaque: "border-amber-500/30",
      categoria: "DOM, Eventos & Interatividade",
    };
  }
  if (modLower.includes("javascript")) {
    return {
      icone: "⚡",
      sigla: "JS-01",
      corBadge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      corGradiente: "from-yellow-500 to-amber-600",
      bordaDestaque: "border-yellow-500/30",
      categoria: "Fundamentos de Javascript",
    };
  }
  if (modLower.includes("lógica") || modLower.includes("matemática")) {
    return {
      icone: "🧠",
      sigla: "LOG",
      corBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      corGradiente: "from-emerald-500 to-teal-600",
      bordaDestaque: "border-emerald-500/30",
      categoria: "Lógica & Algoritmos",
    };
  }

  return {
    icone: "📜",
    sigla: "PFT",
    corBadge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    corGradiente: "from-indigo-500 to-purple-600",
    bordaDestaque: "border-indigo-500/30",
    categoria: "Módulo Tecnológico Oficial",
  };
}

export default function CertificadosModal({
  isOpen,
  onClose,
  certificados = [],
  nomeAluno = "Estudante",
  certificadoInicialId = null,
}: CertificadosModalProps) {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [certificadoAtivo, setCertificadoAtivo] = useState<CertificadoPFT | null>(null);
  const [carregandoIframe, setCarregandoIframe] = useState(true);
  const [modoExpandido, setModoExpandido] = useState(false);

  // Sincroniza certificado inicial se fornecido
  useEffect(() => {
    if (certificadoInicialId && certificados.length > 0) {
      const encontrado = certificados.find((c) => c.id === certificadoInicialId);
      if (encontrado) {
        setCertificadoAtivo(encontrado);
        setCarregandoIframe(true);
      }
    } else if (!isOpen) {
      setCertificadoAtivo(null);
      setModoExpandido(false);
    }
  }, [certificadoInicialId, certificados, isOpen]);

  // Reset do loader ao trocar certificado
  useEffect(() => {
    if (certificadoAtivo) {
      setCarregandoIframe(true);
    }
  }, [certificadoAtivo?.id]);

  const copiarLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const indexAtual = certificadoAtivo
    ? certificados.findIndex((c) => c.id === certificadoAtivo.id)
    : -1;

  const navegarCertificado = (direcao: "ant" | "prox") => {
    if (indexAtual === -1 || certificados.length <= 1) return;
    const novoIndex =
      direcao === "ant"
        ? (indexAtual - 1 + certificados.length) % certificados.length
        : (indexAtual + 1) % certificados.length;
    setCertificadoAtivo(certificados[novoIndex]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (certificadoAtivo) {
                setCertificadoAtivo(null);
              } else {
                onClose();
              }
            }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${
              modoExpandido
                ? "max-w-[98vw] h-[95vh]"
                : certificadoAtivo
                ? "max-w-5xl"
                : "max-w-4xl"
            } bg-pft-sand dark:bg-[#08172e] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-auto z-10 flex flex-col transition-all duration-300`}
          >
            {/* ============================================================== */}
            {/* CASO 1: VISUALIZADOR CUSTOMIZADO DO CERTIFICADO DENTRO DO PORTAL */}
            {/* ============================================================== */}
            {certificadoAtivo ? (
              <div className="flex flex-col flex-1 h-full min-h-[580px] md:min-h-[680px] bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-white select-none">
                {/* BARRA SUPERIOR CUSTOMIZADA DO VISUALIZADOR */}
                <div className="p-4 sm:p-5 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
                  {/* Lado Esquerdo: Voltar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setCertificadoAtivo(null)}
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs transition-colors shrink-0"
                      title="Voltar para a lista de certificados"
                    >
                      <span>⬅️</span>
                      <span className="hidden sm:inline">Ver Todos</span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            getModuloVisual(certificadoAtivo.modulo).corBadge
                          }`}
                        >
                          {getModuloVisual(certificadoAtivo.modulo).icone}{" "}
                          {getModuloVisual(certificadoAtivo.modulo).categoria}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden md:inline">
                          Doc Oficial PFT
                        </span>
                      </div>
                      <h3 className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[260px] sm:max-w-md md:max-w-lg mt-0.5">
                        {certificadoAtivo.modulo}
                      </h3>
                    </div>
                  </div>

                  {/* Lado Direito: Ações & Navegação */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Navegação entre certificados */}
                    {certificados.length > 1 && (
                      <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-300 dark:border-white/10 text-xs font-bold mr-1">
                        <button
                          type="button"
                          onClick={() => navegarCertificado("ant")}
                          className="cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Certificado anterior"
                        >
                          ◀
                        </button>
                        <span className="px-2 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                          {indexAtual + 1} / {certificados.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => navegarCertificado("prox")}
                          className="cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Próximo certificado"
                        >
                          ▶
                        </button>
                      </div>
                    )}

                    {/* Baixar PDF */}
                    <a
                      href={certificadoAtivo.urlDownload}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                      title="Baixar arquivo em PDF"
                    >
                      <span>⬇️</span>
                      <span className="hidden md:inline">Baixar PDF</span>
                    </a>

                    {/* Copiar Link */}
                    <button
                      type="button"
                      onClick={() =>
                        copiarLink(certificadoAtivo.id, certificadoAtivo.urlPreview)
                      }
                      className="cursor-pointer p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs transition-colors"
                      title="Copiar link"
                    >
                      {copiadoId === certificadoAtivo.id ? "✅" : "🔗"}
                    </button>

                    {/* Expandir / Encolher */}
                    <button
                      type="button"
                      onClick={() => setModoExpandido(!modoExpandido)}
                      className="cursor-pointer p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs transition-colors hidden sm:block"
                      title={modoExpandido ? "Restaurar tamanho" : "Tela cheia"}
                    >
                      {modoExpandido ? "🗗" : "⛶"}
                    </button>

                    {/* Fechar Modal */}
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer p-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-600 dark:bg-white/10 dark:hover:bg-rose-500/30 dark:hover:text-rose-300 dark:text-slate-300 text-xs transition-colors"
                      title="Fechar"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* MOLDURA PERSONALIZADA DE CERTIFICADO COM VISUALIZAÇÃO INTERNA */}
                <div className="relative flex-1 p-3 sm:p-5 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                  {/* Moldura de Diploma com Efeito Dourado & Sombra */}
                  <div className="relative w-full h-full max-h-[75vh] flex flex-col items-center justify-center rounded-2xl p-1 bg-gradient-to-tr from-amber-500/40 via-orange-500/30 to-blue-500/40 shadow-xl border border-amber-400/30">
                    {/* Borda interna estilizada */}
                    <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-xl overflow-hidden flex flex-col shadow-inner">
                      {/* Marca d'água de cabeçalho da moldura */}
                      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>🎓</span>
                          <span>Certificação Oficial • CESAR School & EREM Barão de Exu</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-600 dark:text-amber-300">
                          <span>⭐</span>
                          <span>{nomeAluno}</span>
                        </div>
                      </div>

                      {/* Container do Iframe / PDF Preview do Drive */}
                      <div className="relative flex-1 w-full h-full bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center">
                        {/* Loader animado */}
                        {carregandoIframe && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/90 backdrop-blur-sm gap-3">
                            <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Renderizando certificado em alta resolução...
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Programa Florescendo Talentos
                            </p>
                          </div>
                        )}

                        {/* Iframe oficial do Google Drive com /preview */}
                        <iframe
                          src={`https://drive.google.com/file/d/${certificadoAtivo.id}/preview`}
                          title={`Certificado - ${certificadoAtivo.modulo}`}
                          className="w-full h-full border-0 rounded-b-xl"
                          allow="autoplay"
                          onLoad={() => setCarregandoIframe(false)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DO VISUALIZADOR */}
                <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✔ Autenticidade Garantida:</span>
                    <span className="truncate max-w-xs sm:max-w-md">
                      Emitido oficialmente pelo PFT / CESAR School
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={certificadoAtivo.urlPreview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Abrir em nova aba</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* CASO 2: LISTA / GRADE DE CERTIFICADOS (MODAL INICIAL) */
              /* ============================================================== */
              <>
                {/* Cabeçalho Oficial PFT */}
                <div className="relative p-6 sm:p-8 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-[#08172e] dark:via-[#0e2442] dark:to-[#08172e] text-white border-b border-orange-400/30 dark:border-white/10">
                  {/* Efeito Glow de Fundo */}
                  <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/10 dark:bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 right-10 w-48 h-48 bg-amber-400/20 dark:bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 dark:bg-gradient-to-tr dark:from-orange-500 dark:via-amber-400 dark:to-orange-600 p-0.5 shadow-lg shadow-orange-950/20 shrink-0 flex items-center justify-center">
                        <div className="w-full h-full bg-orange-600 dark:bg-[#08172e] rounded-[14px] flex items-center justify-center text-3xl">
                          🎓
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 dark:bg-orange-500/20 text-white dark:text-orange-200 border border-white/30 dark:border-orange-400/30">
                            Certificações Oficiais
                          </span>
                          <span className="text-[10px] font-bold text-orange-100 dark:text-slate-200">
                            CESAR School • EREM Barão de Exu
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-1 leading-tight">
                          Meus Certificados PFT
                        </h2>
                        <p className="text-xs sm:text-sm text-orange-100 dark:text-slate-200 mt-0.5">
                          Parabéns, <strong className="text-white">{nomeAluno.split(" ")[0]}</strong>! Clique para visualizar na tela ou baixar suas certificações.
                        </p>
                      </div>
                    </div>

                    {/* Botão Fechar */}
                    <button
                      onClick={onClose}
                      className="cursor-pointer text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-colors shrink-0"
                      aria-label="Fechar"
                    >
                      <span className="text-xl leading-none">✕</span>
                    </button>
                  </div>

                  {/* Barra de Resumo */}
                  <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white dark:text-slate-200">Total de Certificados:</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-white/25 dark:bg-orange-400/20 text-white dark:text-orange-200 font-black border border-white/40 dark:border-orange-400/30">
                        {certificados.length} {certificados.length === 1 ? "Módulo" : "Módulos"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-orange-100 dark:text-slate-300 text-[11px]">
                      <span>🔒</span> Visualização customizada integrada ao portal
                    </div>
                  </div>
                </div>

                {/* Corpo do Modal */}
                <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto">
                  {certificados.length === 0 ? (
                    /* Estado Vazio */
                    <div className="text-center py-12 px-4 max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center text-4xl shadow-inner mb-4">
                        📜
                      </div>
                      <h3 className="font-display font-black text-slate-800 dark:text-white text-lg">
                        Nenhum certificado disponível ainda
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                        Os certificados oficiais são emitidos pelo <strong>Programa Florescendo Talentos (PFT / CESAR School)</strong> após a conclusão e avaliação dos módulos da TrilhaTech.
                      </p>
                      <p className="text-orange-600 dark:text-orange-400 text-xs font-bold mt-4">
                        Continue fazendo suas missões e atividades para conquistar sua certificação! 🚀
                      </p>
                    </div>
                  ) : (
                    /* Grid de Certificados */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificados.map((cert) => {
                        const visual = getModuloVisual(cert.modulo);
                        const estaCopiado = copiadoId === cert.id;

                        return (
                          <motion.div
                            key={cert.id}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="relative bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-200/80 dark:border-white/5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/15 transition-all flex flex-col justify-between"
                          >
                            {/* Topo do Card */}
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <span
                                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${visual.corBadge} flex items-center gap-1.5`}
                                >
                                  <span>{visual.icone}</span>
                                  <span>{visual.categoria}</span>
                                </span>

                                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-900">
                                  PDF
                                </span>
                              </div>

                              <h3 className="font-display font-black text-slate-800 dark:text-white text-base leading-snug line-clamp-2">
                                {cert.modulo}
                              </h3>

                              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-1.5 line-clamp-1">
                                {cert.titulo}
                              </p>
                            </div>

                            {/* Botões de Ação */}
                            <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center gap-2">
                              {/* Visualizar Dentro do Portal */}
                              <button
                                type="button"
                                onClick={() => setCertificadoAtivo(cert)}
                                className="cursor-pointer flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                              >
                                <span>👁️</span>
                                <span>Visualizar no Portal</span>
                              </button>

                              {/* Baixar */}
                              <a
                                href={cert.urlDownload}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="cursor-pointer flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                              >
                                <span>⬇️</span>
                                <span>Baixar PDF</span>
                              </a>

                              {/* Copiar Link */}
                              <button
                                type="button"
                                onClick={() => copiarLink(cert.id, cert.urlPreview)}
                                className="cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-xs"
                                title="Copiar link do certificado"
                              >
                                {estaCopiado ? "✅" : "🔗"}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rodapé Oficial PFT */}
                <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-[#08172e]/80 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <span>
                      Programa Florescendo Talentos — EREM Barão de Exu & CESAR School
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:scale-102 active:scale-98"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
