/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiAluno } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";

export interface PerfilAtualizado {
  xpTotal: number;
  nivel: string;
  saldoCarteira: number;
  progressoNivel?: {
    porcentagem: number;
    faltam: number;
    nomeProximo: string;
    isMaximo: boolean;
  };
}

interface LojaRifaModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricula: string;
  saldoCarteira: number;
  onCompraSucesso: (perfil: PerfilAtualizado) => void;
}

export default function LojaRifaModal({
  isOpen,
  onClose,
  matricula,
  saldoCarteira,
  onCompraSucesso,
}: LojaRifaModalProps) {
  const { toast } = useToast();
  const [pacoteSelecionado, setPacoteSelecionado] = useState<string | null>(null);
  const [contratoAceite, setContratoAceite] = useState(false);
  const [comprando, setComprando] = useState(false);

  const limiteGasto = saldoCarteira * 0.60;

  const pacotes = [
    { id: "BRONZE", nome: "Pacote Bronze", bilhetes: 10, preco: 1000, cor: "from-amber-700 to-amber-900", icon: "🥉", glow: "rgba(180,83,9,0.15)" },
    { id: "PRATA", nome: "Pacote Prata", bilhetes: 20, preco: 1800, cor: "from-slate-400 to-slate-600", icon: "🥈", destaque: "10% OFF", glow: "rgba(148,163,184,0.15)" },
    { id: "OURO", nome: "Pacote Ouro", bilhetes: 30, preco: 2500, cor: "from-yellow-400 to-amber-500", icon: "🥇", destaque: "17% OFF", glow: "rgba(245,158,11,0.25)" },
  ];

  const efetuarCompra = async () => {
    if (!pacoteSelecionado) return;
    if (!contratoAceite) return toast("Você precisa aceitar os termos do contrato!", "warning");

    setComprando(true);
    try {
      const data = await apiAluno.comprarRifa(matricula, pacoteSelecionado);
      if (data.status === "sucesso" && data.perfilAtualizado) {
        toast(data.mensagem, "success", "Compra Aprovada! 🎉");
        onCompraSucesso(data.perfilAtualizado); // Atualiza o saldo do aluno na tela
        onClose();
      } else {
        toast(data.mensagem, "error", "Transação Recusada");
      }
    } catch (e) {
      toast("Erro de conexão com a loja.", "error");
    } finally {
      setComprando(false);
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
            className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
          >
            {/* Glow decorativo de fundo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            {/* Header */}
            <div className="bg-slate-950 p-6 text-center relative overflow-hidden shrink-0 border-b border-white/5">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none" />
              <button
                onClick={onClose}
                className="cursor-pointer absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors duration-200 z-20"
              >
                &times;
              </button>

              <h2 className="text-3xl font-display font-black text-white relative z-10 flex items-center justify-center gap-3">
                <span>🛒</span> Loja Trilha Tech
              </h2>
              <p className="text-slate-400 font-medium relative z-10 mt-1.5 text-xs tracking-wide uppercase">
                Troque o seu XP por Bilhetes da Rifa Escolar
              </p>
              
              <div className="mt-4 inline-flex items-center gap-3 bg-brand-primary/10 rounded-2xl px-6 py-2.5 border border-brand-primary/20 relative z-10 shadow-inner">
                <span className="text-[10px] text-brand-secondary font-black uppercase tracking-wider">Saldo Disponível:</span>
                <span className="text-xl font-display font-black text-white font-mono">{saldoCarteira} XP</span>
              </div>
            </div>

            {/* Corpo rolável */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-transparent">
              <AnimatePresence mode="wait">
                {!pacoteSelecionado ? (
                  <motion.div
                    key="vitrine"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-6">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        🛡️ Regra de Segurança: Você só pode comprometer até <span className="text-amber-500 dark:text-amber-400 font-black font-mono">60% do seu saldo ({Math.floor(limiteGasto)} XP)</span> por transação.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {pacotes.map((pct) => {
                        const podeComprar = pct.preco <= limiteGasto;

                        return (
                          <motion.div 
                            key={pct.id}
                            whileHover={podeComprar ? { y: -4, scale: 1.02 } : {}}
                            whileTap={podeComprar ? { scale: 0.98 } : {}}
                            onClick={() => podeComprar && setPacoteSelecionado(pct.id)}
                            style={podeComprar ? { boxShadow: `0 0 30px ${pct.glow}` } : {}}
                            className={`relative rounded-3xl border-2 p-6 text-center transition-all duration-300 ${
                              podeComprar 
                                ? "border-slate-200/50 dark:border-white/5 hover:border-brand-primary/40 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer shadow-md" 
                                : "border-slate-100 dark:border-white/5 opacity-35 bg-slate-50/20 dark:bg-slate-950/10 cursor-not-allowed grayscale"
                            }`}
                          >
                            {pct.destaque && podeComprar && (
                              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md z-20">
                                {pct.destaque}
                              </div>
                            )}
                            
                            <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${pct.cor} flex items-center justify-center text-3xl shadow-inner mb-4 relative`}>
                              <div className="absolute inset-0 bg-white/10 rounded-2xl pointer-events-none" />
                              {pct.icon}
                            </div>
                            
                            <h3 className="font-display font-black text-slate-800 dark:text-white uppercase text-xs tracking-wider">{pct.nome}</h3>
                            <p className="text-3xl font-display font-black text-brand-secondary font-mono my-3">{pct.bilhetes} <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">Tickets</span></p>
                            
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Preço</p>
                              <p className={`font-black font-mono text-sm ${podeComprar ? "text-slate-800 dark:text-white" : "text-rose-500"}`}>
                                {pct.preco} XP
                              </p>
                            </div>

                            {!podeComprar && (
                              <p className="text-[9px] text-rose-500 font-bold mt-4 leading-tight">Excede limite de 60% ou saldo insuficiente</p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex justify-center">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose} 
                        className="cursor-pointer text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
                      >
                        Sair da Loja
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  /* TELA DE CHECKOUT */
                  <motion.div
                    key="checkout"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-md mx-auto py-2"
                  >
                    <button 
                      onClick={() => { setPacoteSelecionado(null); setContratoAceite(false); }}
                      className="text-brand-secondary font-black text-xs uppercase tracking-wider mb-5 hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      ← Voltar aos pacotes
                    </button>

                    <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 mb-5 shadow-inner">
                      <h3 className="font-display font-black text-slate-800 dark:text-white text-base mb-4 text-center border-b border-slate-200 dark:border-slate-800 pb-4 uppercase tracking-wider">
                        Resumo da Compra
                      </h3>
                      
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Pacote Escolhido:</span>
                        <span className="font-black text-slate-800 dark:text-white">{pacotes.find(p => p.id === pacoteSelecionado)?.nome}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Tickets a Receber:</span>
                        <span className="font-black text-brand-secondary">{pacotes.find(p => p.id === pacoteSelecionado)?.bilhetes} Tickets</span>
                      </div>
                      <div className="flex justify-between items-center pt-3.5 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-800 dark:text-white font-black uppercase tracking-wider">Total a Pagar:</span>
                        <span className="font-black text-rose-500 dark:text-rose-455 font-mono text-sm">- {pacotes.find(p => p.id === pacoteSelecionado)?.preco} XP</span>
                      </div>
                    </div>

                    {/* CONTRATO DE CONCORDÂNCIA */}
                    <label className="flex items-start gap-3.5 p-4.5 bg-amber-500/10 dark:bg-amber-955/15 border border-amber-500/20 dark:border-amber-900/30 rounded-2xl cursor-pointer hover:bg-amber-500/15 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={contratoAceite}
                        onChange={(e) => setContratoAceite(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-amber-500 shrink-0 cursor-pointer rounded-lg"
                      />
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                        <strong>Termo de Responsabilidade:</strong> Estou ciente de que esta compra descontará o XP correspondente do meu <strong>Saldo de Carteira</strong>. Esta ação é irreversível, mas <strong>NÃO AFETARÁ</strong> a minha pontuação global nem a minha classificação oficial no Ranking Geral do Projeto.
                      </span>
                    </label>

                    <motion.button
                      whileHover={contratoAceite ? { scale: 1.01 } : {}}
                      whileTap={contratoAceite ? { scale: 0.99 } : {}}
                      onClick={efetuarCompra}
                      disabled={comprando || !contratoAceite}
                      className={`w-full mt-6 py-4 rounded-2xl font-display font-black uppercase tracking-wider text-white transition-all shadow-lg text-xs select-none ${
                        contratoAceite 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 shadow-emerald-500/10 cursor-pointer" 
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-550 cursor-not-allowed shadow-none"
                      }`}
                    >
                      {comprando ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Processando Compra...
                        </div>
                      ) : (
                        "Assinar e Comprar"
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}