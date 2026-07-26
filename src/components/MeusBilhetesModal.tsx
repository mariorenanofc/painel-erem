/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { apiAluno } from "@/src/services/api";
import { motion, AnimatePresence } from "framer-motion";

interface MeusBilhetesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricula: string;
}

interface Bilhete {
  id: string;
  data: string;
  status: string;
  ciclo: string;
}

export default function MeusBilhetesModal({ isOpen, onClose, matricula }: MeusBilhetesModalProps) {
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [loading, setLoading] = useState(true);
  const [bilheteSelecionado, setBilheteSelecionado] = useState<Bilhete | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiAluno.buscarMeusBilhetes(matricula).then((data) => {
        if (data.status === "sucesso") setBilhetes(data.bilhetes);
        setLoading(false);
      });
    } else {
      setBilheteSelecionado(null);
    }
  }, [isOpen, matricula]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2rem] p-6 md:p-8 max-w-lg w-full border border-slate-200/80 dark:border-white/5 shadow-2xl relative overflow-hidden z-10"
      >
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        <AnimatePresence mode="wait">
          {bilheteSelecionado ? (
            /* DETALHES DO BILHETE (ESTILO RETRO TICKET PREMIUM) */
            <motion.div
              key="detalhes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              <button
                onClick={() => setBilheteSelecionado(null)}
                className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-350 font-black mb-5 flex items-center gap-1 cursor-pointer text-sm select-none"
              >
                <span>←</span> Voltar para a lista
              </button>

              {/* Card Retro Ticket */}
              <div className="bg-slate-50/50 dark:bg-slate-950/40 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/80 text-center relative shadow-inner overflow-hidden">
                <div className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest mb-2">
                  Bilhete de Sorteio
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white font-mono mb-6 tracking-wider">
                  #{bilheteSelecionado.id.split("-").pop()}
                </h2>

                {/* Linha serrilhada de ticket */}
                <div className="relative my-6">
                  <div className="absolute left-[-2rem] top-[-8px] w-4 h-4 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-white/5 rounded-full z-10" />
                  <div className="absolute right-[-2rem] top-[-8px] w-4 h-4 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-white/5 rounded-full z-10" />
                  <div className="border-t-2 border-dashed border-slate-200/80 dark:border-slate-800 w-full" />
                </div>

                <div className="space-y-4 text-left pt-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-450 font-bold">Status</span>
                    <span
                      className={`font-black px-3 py-1 rounded-full text-xs border ${
                        bilheteSelecionado.status === "ATIVO"
                          ? "bg-emerald-100/80 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30"
                          : "bg-amber-100/80 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 border-amber-250 dark:border-amber-900/30"
                      }`}
                    >
                      {bilheteSelecionado.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-450 font-bold">Data da Compra</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {bilheteSelecionado.data}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-450 font-bold">ID Transação</span>
                    <span className="text-xs font-mono text-slate-400 select-all dark:text-slate-500">
                      {bilheteSelecionado.id}
                    </span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-indigo-500/10 rounded-2xl text-xs font-bold text-indigo-650 dark:text-indigo-400 border border-indigo-500/20">
                  🎫 Este bilhete está a concorrer ao prémio de R$ 50,00!
                </div>
              </div>
            </motion.div>
          ) : (
            /* GRID DE LISTAGEM */
            <motion.div
              key="lista"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white tracking-tight">
                  Meus Bilhetes
                </h2>
                <p className="text-slate-500 dark:text-slate-450 text-sm mt-1 font-medium">
                  Toque num ticket para ver detalhes
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto pr-1.5 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col justify-center items-center py-16">
                    <div className="relative w-8 h-8 mb-3">
                      <div className="absolute inset-0 rounded-full border-3 border-slate-200 dark:border-slate-800" />
                      <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-indigo-500 animate-spin" />
                    </div>
                    <span className="text-slate-450 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Buscando bilhetes...
                    </span>
                  </div>
                ) : bilhetes.length === 0 ? (
                  <div className="text-center py-16 opacity-60">
                    <div className="text-4xl mb-3">🎫</div>
                    <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                      Nenhum bilhete ainda.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Vá até a Loja e garanta seus cupons de sorteio!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-1">
                    {bilhetes.map((b, idx) => (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={b.id}
                        onClick={() => setBilheteSelecionado(b)}
                        className={`group relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all cursor-pointer select-none ${
                          b.status === "ATIVO"
                            ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase opacity-60 tracking-wider">Nº</span>
                        <span className="text-base font-black font-mono mt-0.5">
                          {Number(b.id.split("-").pop()) + 1}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé fixo do Modal */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all select-none shadow-md"
          >
            Fechar Painel
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}