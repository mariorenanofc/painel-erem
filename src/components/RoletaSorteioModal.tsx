/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";

interface RoletaSorteioModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmasDisponiveis: string[];
}

export default function RoletaSorteioModal({
  isOpen,
  onClose,
  turmasDisponiveis,
}: RoletaSorteioModalProps) {
  const { toast } = useToast();
  const [turmaSelecionada, setTurmaSelecionada] = useState(turmasDisponiveis[0] || "");
  const [sorteando, setSorteando] = useState(false);
  const [nomeAnimado, setNomeAnimado] = useState("?????");
  const [vencedor, setVencedor] = useState<{ nome: string; matricula: string; bilhete: string } | null>(null);

  // Efeito visual de roleta girando
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (sorteando) {
      const nomesFalsos = ["CARREGANDO...", "MISTURANDO BILHETES...", "GIRANDO A ROLETA...", "QUEM SERÁ?", "CRUZEM OS DEDOS!"];
      let i = 0;
      intervalo = setInterval(() => {
        setNomeAnimado(nomesFalsos[i % nomesFalsos.length]);
        i++;
      }, 150);
    }
    return () => clearInterval(intervalo);
  }, [sorteando]);

  const iniciarSorteio = async () => {
    if (!turmaSelecionada) return toast("Selecione uma turma primeiro!", "warning");
    
    setVencedor(null);
    setSorteando(true);

    const TOKEN_SEGURANCA = "TrilhaTech_Seguranca_Total_2026";

    try {
      // Pequeno delay artificial para dar emoção à roleta (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2200));

      const data = await apiTutor.sortearRifa(turmaSelecionada, TOKEN_SEGURANCA);

      if (data.status === "sucesso" && data.ganhador) {
        setVencedor(data.ganhador);
        toast("Temos um vencedor!", "success", "Sorteio Realizado");
      } else {
        toast(data.mensagem || "Erro ao realizar o sorteio.", "error");
      }
    } catch (e) {
      toast("Falha na comunicação com o servidor.", "error");
    } finally {
      setSorteando(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-lg overflow-hidden flex flex-col relative z-10"
          >
            {/* Glow decorativo de fundo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            {/* Confetes no background se houver vencedor */}
            {vencedor && (
              <div className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.12] bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTkxY2Z5d2hqaHlhYnlwM3J4cGpqYmY1eTVtYWpsdTV6bTVvYnM4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aCvd8Mvh7V9Cj4Q/giphy.gif')] bg-cover mix-blend-screen z-0"></div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="cursor-pointer absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xl transition-all duration-200 z-20 shadow-sm"
            >
              &times;
            </button>

            <div className="p-8 relative z-10 text-center flex flex-col items-center">
              <motion.div
                animate={sorteando ? { scale: [1, 1.2, 1], rotate: [0, 360, 0] } : {}}
                transition={sorteando ? { repeat: Infinity, duration: 1.5 } : {}}
                className="text-6xl mb-4 select-none"
              >
                🎰
              </motion.div>
              
              <h3 className="text-3xl font-display font-black text-slate-800 dark:text-slate-100 mb-1.5 uppercase tracking-wider">
                Sorteio Trilha Tech
              </h3>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">
                Prémio: <span className="text-emerald-500 dark:text-emerald-400 font-bold font-mono">R$ 50,00</span>
              </p>

              {/* State 1: Before Draw */}
              {!vencedor && !sorteando && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 w-full"
                >
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Escolha a Turma para o Sorteio
                    </label>
                    <div className="relative">
                      <select
                        value={turmaSelecionada}
                        onChange={(e) => setTurmaSelecionada(e.target.value)}
                        className="cursor-pointer w-full p-4 pr-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:border-amber-500 font-bold text-sm transition-all shadow-sm appearance-none"
                      >
                        {turmasDisponiveis.map((t, idx) => (
                          <option key={idx} value={t}>{t}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={onClose}
                      className="cursor-pointer flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={iniciarSorteio}
                      className="cursor-pointer flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 text-xs uppercase tracking-wider transition-all"
                    >
                      Girar Roleta!
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* State 2: Spinning */}
              {sorteando && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-10 border border-dashed border-amber-500/30 rounded-3xl bg-amber-500/5 dark:bg-amber-500/3 w-full"
                >
                  <div className="relative w-12 h-12 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tracking-widest uppercase animate-pulse px-4">
                    {nomeAnimado}
                  </h2>
                </motion.div>
              )}

              {/* State 3: Winner revealed */}
              {vencedor && !sorteando && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="inline-block bg-emerald-100/90 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-emerald-250/30 dark:border-emerald-900/10">
                    🎉 O Vencedor é... 🎉
                  </div>
                  
                  <h2 className="text-3xl font-display font-black text-slate-800 dark:text-white mb-2 leading-tight">
                    {vencedor.nome}
                  </h2>

                  {/* Retro ticket layout (as defined in MeusBilhetesModal style guide) */}
                  <div className="relative bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 p-6 rounded-2xl mt-5 shadow-inner w-full max-w-sm">
                    {/* Lateral cutout punches */}
                    <div className="absolute left-[-11px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 z-10 pointer-events-none" />
                    <div className="absolute right-[-11px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 z-10 pointer-events-none" />
                    
                    <div className="space-y-2 text-left relative z-20">
                      <p className="text-xs font-bold text-slate-450 dark:text-slate-500">
                        Matrícula: <span className="text-slate-800 dark:text-slate-200 font-mono font-bold ml-1">{vencedor.matricula}</span>
                      </p>
                      <div className="border-t border-dashed border-slate-250 dark:border-slate-800 my-3" />
                      <p className="text-xs font-bold text-slate-450 dark:text-slate-500">
                        Bilhete Premiado: <span className="text-indigo-600 dark:text-indigo-400 font-black ml-1 font-mono text-sm">{vencedor.bilhete}</span>
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onClose}
                    className="cursor-pointer w-full mt-7 bg-emerald-500 hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/10 uppercase tracking-widest text-xs select-none"
                  >
                    Concluir Sorteio
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}