"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import ReactMarkdown from "react-markdown";

interface LancamentoNovidadesModalProps {
  onClose: () => void;
}

export default function LancamentoNovidadesModal({ onClose }: LancamentoNovidadesModalProps) {
  const { toast } = useToast();
  const [rascunho, setRascunho] = useState("");
  const [versao, setVersao] = useState("");
  const [markdownGerado, setMarkdownGerado] = useState("");
  const [isGerando, setIsGerando] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);

  const handleGerarIA = async () => {
    if (!rascunho.trim()) {
      toast("Digite um rascunho antes de gerar!", "error", "Erro");
      return;
    }
    setIsGerando(true);
    try {
      const res = await apiTutor.gerarNovidadesIA(rascunho);
      if (res.status === "sucesso") {
        setMarkdownGerado(res.mensagem);
        toast("Markdown gerado com sucesso!", "success", "Sucesso");
      } else {
        toast(res.mensagem || "Erro ao gerar markdown.", "error", "Erro");
      }
    } catch (error) {
      console.error(error);
      toast("Falha ao comunicar com a IA.", "error", "Erro");
    } finally {
      setIsGerando(false);
    }
  };

  const handleSalvar = async () => {
    if (!markdownGerado.trim() || !versao.trim()) {
      toast("Gere o markdown e defina a versão antes de salvar.", "error", "Erro");
      return;
    }
    setIsSalvando(true);
    try {
      const payload = {
        NOVIDADES_MARKDOWN: markdownGerado,
        VERSAO_NOVIDADES: versao,
      };
      const res = await apiTutor.salvarConfiguracoes(payload);
      if (res.status === "sucesso") {
        toast("Novidades publicadas para os alunos!", "success", "Sucesso");
        onClose();
      } else {
        toast(res.mensagem || "Erro ao salvar novidades.", "error", "Erro");
      }
    } catch (error) {
      console.error(error);
      toast("Erro ao salvar.", "error", "Erro");
    } finally {
      setIsSalvando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>🚀</span> Lançar Atualização (Patch Notes)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Deixe a IA gamificar as novidades da plataforma.
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Esquerda: Inputs */}
            <div className="w-full md:w-1/2 p-6 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Versão (Ex: v2.1.0)
                  </label>
                  <input
                    type="text"
                    value={versao}
                    onChange={(e) => setVersao(e.target.value)}
                    placeholder="v2.1.0"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    O que mudou? (Rascunho bruto)
                  </label>
                  <textarea
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    rows={5}
                    placeholder="Ex: Arrumei o bug do XP que não somava direito. Adicionei a IA no gerador de ranking do whatsapp. O painel está mais rápido."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleGerarIA}
                  disabled={isGerando || !rascunho}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGerando ? (
                    <span className="animate-spin text-xl">⏳</span>
                  ) : (
                    <span>✨</span>
                  )}
                  {isGerando ? "Gerando Gamificação..." : "Gerar Markdown com IA"}
                </button>
              </div>
            </div>

            {/* Direita: Preview */}
            <div className="w-full md:w-1/2 p-6 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/30">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Preview Visual (Para os Alunos)
              </label>
              <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 custom-scrollbar prose prose-slate dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-a:text-indigo-500 max-w-none">
                {markdownGerado ? (
                  <ReactMarkdown>{markdownGerado}</ReactMarkdown>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-center italic">
                    A pré-visualização aparecerá aqui...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button
              onClick={handleSalvar}
              disabled={isSalvando || !markdownGerado || !versao}
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {isSalvando ? "Publicando..." : "Publicar Novidades 🚀"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
