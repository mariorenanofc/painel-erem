"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CertificadoPFT } from "../types";

interface CertificadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificados: CertificadoPFT[];
  nomeAluno?: string;
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
      categoria: "Design & Estilização Web",
    };
  }
  if (modLower.includes("html") && modLower.includes("avançado")) {
    return {
      icone: "🚀",
      sigla: "HTML+",
      corBadge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      corGradiente: "from-purple-500 to-indigo-600",
      categoria: "SEO, Acessibilidade & Otimização",
    };
  }
  if (modLower.includes("html")) {
    return {
      icone: "🌐",
      sigla: "HTML",
      corBadge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      corGradiente: "from-orange-500 to-amber-600",
      categoria: "Estrutura Web & Semântica",
    };
  }
  if (modLower.includes("javascript 02") || modLower.includes("estilos, atributos")) {
    return {
      icone: "⚡",
      sigla: "JS-02",
      corBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      corGradiente: "from-amber-500 to-yellow-600",
      categoria: "DOM, Eventos & Interatividade",
    };
  }
  if (modLower.includes("javascript")) {
    return {
      icone: "⚡",
      sigla: "JS-01",
      corBadge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      corGradiente: "from-yellow-500 to-amber-600",
      categoria: "Fundamentos de Javascript",
    };
  }
  if (modLower.includes("lógica") || modLower.includes("matemática")) {
    return {
      icone: "🧠",
      sigla: "LOG",
      corBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      corGradiente: "from-emerald-500 to-teal-600",
      categoria: "Lógica & Algoritmos",
    };
  }

  return {
    icone: "📜",
    sigla: "PFT",
    corBadge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    corGradiente: "from-indigo-500 to-purple-600",
    categoria: "Módulo Tecnológico Oficial",
  };
}

export default function CertificadosModal({
  isOpen,
  onClose,
  certificados = [],
  nomeAluno = "Estudante",
}: CertificadosModalProps) {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const copiarLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-auto z-10"
          >
            {/* Cabeçalho */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white border-b border-white/10">
              {/* Efeito Glow de Fundo */}
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 shrink-0 flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950/70 rounded-[14px] flex items-center justify-center text-3xl">
                      🎓
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Certificações Oficiais
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        CESAR School • EREM Barão de Exu
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-1 leading-tight">
                      Meus Certificados PFT
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      Parabéns, <strong className="text-white">{nomeAluno.split(" ")[0]}</strong>! Aqui estão suas conquistas e certificados por módulo concluído.
                    </p>
                  </div>
                </div>

                {/* Botão Fechar */}
                <button
                  onClick={onClose}
                  className="cursor-pointer text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Fechar"
                >
                  <span className="text-xl leading-none">✕</span>
                </button>
              </div>

              {/* Barra de Resumo */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300">Total de Certificados:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-black border border-emerald-400/30">
                    {certificados.length} {certificados.length === 1 ? "Módulo" : "Módulos"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>🔒</span> Documentos em PDF assinados pelo Programa Florescendo Talentos
                </div>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto">
              {certificados.length === 0 ? (
                /* Estado Vazio */
                <div className="text-center py-12 px-4 max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 flex items-center justify-center text-4xl shadow-inner mb-4">
                    📜
                  </div>
                  <h3 className="font-display font-black text-slate-800 dark:text-white text-lg">
                    Nenhum certificado disponível ainda
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    Os certificados oficiais são emitidos pelo <strong>Programa Florescendo Talentos (PFT / CESAR School)</strong> após a conclusão e avaliação dos módulos da TrilhaTech.
                  </p>
                  <p className="text-indigo-600 dark:text-brand-secondary text-xs font-bold mt-4">
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
                          {/* Visualizar */}
                          <a
                            href={cert.urlPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                          >
                            <span>👁️</span>
                            <span>Visualizar</span>
                          </a>

                          {/* Baixar */}
                          <a
                            href={cert.urlDownload}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="cursor-pointer flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                          >
                            <span>⬇️</span>
                            <span>Baixar PDF</span>
                          </a>

                          {/* Copiar Link */}
                          <button
                            type="button"
                            onClick={() => copiarLink(cert.id, cert.urlPreview)}
                            className="cursor-pointer p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-xs"
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

            {/* Rodapé */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-base">🏛️</span>
                <span>
                  Programa Florescendo Talentos — EREM Barão de Exu & CESAR School
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

