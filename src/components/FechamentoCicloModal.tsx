"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import { CicloHistoricoItem } from "../types";
import { getRankingKeys, getCicloAnteriorKeys } from "@/src/lib/dateUtils";

interface FechamentoCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmasDisponiveis: string[];
}

export default function FechamentoCicloModal({
  isOpen,
  onClose,
  turmasDisponiveis,
}: FechamentoCicloModalProps) {
  const { toast } = useToast();

  const [tipo, setTipo] = useState<"semanal" | "mensal">("mensal");
  const [periodo, setPeriodo] = useState<"atual" | "anterior">("anterior");
  const [abaMensagem, setAbaMensagem] = useState<"turma1" | "turma2" | "geral">("turma1");

  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [estornando, setEstornando] = useState(false);
  const [cicloData, setCicloData] = useState<CicloHistoricoItem | null>(null);

  // Determinar a chave do período selecionado
  const obterChavePeriodo = (): string => {
    const dataHoje = new Date();
    if (periodo === "atual") {
      const { semanaKey, mesKey } = getRankingKeys(dataHoje);
      return tipo === "mensal" ? mesKey : semanaKey;
    } else {
      const { mesAnteriorKey, semanaAnteriorKey } = getCicloAnteriorKeys(dataHoje);
      return tipo === "mensal" ? mesAnteriorKey : semanaAnteriorKey;
    }
  };

  const chaveAtual = obterChavePeriodo();
  const cicloId = `${tipo}_${chaveAtual}`;

  useEffect(() => {
    if (isOpen) {
      verificarCiclo();
    }
  }, [isOpen, tipo, periodo]);

  const verificarCiclo = async () => {
    setCarregando(true);
    try {
      const res = await apiTutor.listarHistoricoCiclos();
      if (res.status === "sucesso" && Array.isArray(res.historico)) {
        const encontrado = res.historico.find((c: CicloHistoricoItem) => c.id === cicloId);
        setCicloData(encontrado || null);
      }
    } catch {
      toast("Não foi possível verificar o histórico de ciclos.", "error", "Falha de Rede");
    } finally {
      setCarregando(false);
    }
  };

  const executarFechamento = async () => {
    if (!confirm(`Confirma o fechamento e lançamento de bônus do ciclo ${cicloId}? Os pontos serão depositados no perfil dos alunos.`)) {
      return;
    }

    setProcessando(true);
    try {
      const autor = typeof window !== "undefined" ? localStorage.getItem("usuarioLogado") || "Tutor" : "Tutor";
      const res = await apiTutor.fecharCicloManual(tipo, chaveAtual, `tutor:${autor}`);

      if (res.status === "sucesso") {
        confetti({ particleCount: 180, spread: 80, origin: { y: 0.3 } });
        toast(res.mensagem, "success", "Ciclo Fechado! 🎉");
        setCicloData(res.ciclo || null);
      } else if (res.status === "aviso") {
        toast(res.mensagem, "warning", "Atenção");
        if (res.ciclo) setCicloData(res.ciclo);
      } else {
        toast(res.mensagem || "Erro ao processar fechamento.", "error", "Falha");
      }
    } catch {
      toast("Erro de conexão ao processar o ciclo.", "error", "Falha na Rede");
    } finally {
      setProcessando(false);
    }
  };

  const estornarCiclo = async () => {
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja estornar todos os bônus do ciclo ${cicloId}? Esta ação irá deduzir os pontos creditados das contas dos alunos.`)) {
      return;
    }

    setEstornando(true);
    try {
      const autor = typeof window !== "undefined" ? localStorage.getItem("usuarioLogado") || "Tutor" : "Tutor";
      const res = await apiTutor.estornarCiclo(cicloId, `tutor:${autor}`);

      if (res.status === "sucesso") {
        toast(res.mensagem, "success", "Ciclo Estornado!");
        verificarCiclo();
      } else {
        toast(res.mensagem || "Erro ao estornar ciclo.", "error", "Erro");
      }
    } catch {
      toast("Erro de conexão ao processar estorno.", "error", "Falha");
    } finally {
      setEstornando(false);
    }
  };

  const copiarMensagem = (texto: string) => {
    if (!texto) {
      toast("Mensagem indisponível para cópia.", "warning", "Vazio");
      return;
    }
    navigator.clipboard.writeText(texto);
    toast("Mensagem copiada e pronta para colar no WhatsApp!", "info", "Copiado!");
  };

  const getMensagemAtiva = (): string => {
    if (!cicloData?.mensagens) return "";
    if (abaMensagem === "turma1") return cicloData.mensagens.turma1;
    if (abaMensagem === "turma2") return cicloData.mensagens.turma2;
    return cicloData.mensagens.geral;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop com Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Top Bar */}
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <span className="text-2xl select-none">🏆</span>
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Fechamento & Auditoria de Ciclos
                    {cicloData?.status === "FECHADO" && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/20">
                        ✅ Pago / Concluído
                      </span>
                    )}
                    {cicloData?.status === "ESTORNADO" && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/20">
                        ⚠️ Estornado
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apuração de pontuações, lançamento idempotente de XP e mensagens formatadas para grupos.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Controles de Período e Tipo */}
            <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
              {/* Tipo: Semanal vs Mensal */}
              <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                <button
                  onClick={() => setTipo("mensal")}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    tipo === "mensal"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  🏆 Mensal
                </button>
                <button
                  onClick={() => setTipo("semanal")}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    tipo === "semanal"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  🗓️ Semanal
                </button>
              </div>

              {/* Período: Atual vs Anterior (Retroativo) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período:</span>
                <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => setPeriodo("anterior")}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      periodo === "anterior"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    ⏮️ Ciclo Anterior ({chaveAtual})
                  </button>
                  <button
                    onClick={() => setPeriodo("atual")}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      periodo === "atual"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    ▶️ Ciclo Atual em Curso
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {carregando ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Consultando histórico do ciclo {cicloId}...
                  </p>
                </div>
              ) : cicloData && cicloData.status === "FECHADO" ? (
                /* CICLO JÁ FECHADO: Exibir Auditoria e Mensagens Prontas */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Coluna Esquerda: Auditoria de Alunos Premiados */}
                  <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-display font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                          🎖️ Alunos Premiados ({cicloData.premiados.length})
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Fechado por {cicloData.fechadoPor} em {new Date(cicloData.dataFechamento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <button
                        onClick={estornarCiclo}
                        disabled={estornando}
                        className="cursor-pointer text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 px-2.5 py-1 rounded-xl transition-all disabled:opacity-50"
                      >
                        {estornando ? "Estornando..." : "Estornar Ciclo"}
                      </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
                      {cicloData.premiados.map((item, idx) => (
                        <div
                          key={`${item.matricula}-${idx}`}
                          className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] text-slate-400 w-5">
                              {item.posicao}º
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[170px]">
                                {item.nome}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {item.turma.includes("1") ? "1º Ano" : "2º Ano"} • {item.xpAcumulado} XP
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            +{item.xpBonus} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coluna Direita: Abas de Mensagens WhatsApp Prontas */}
                  <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col">
                    {/* Seletor de Aba de Mensagem */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3 mb-4">
                      <div className="flex gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl">
                        <button
                          onClick={() => setAbaMensagem("turma1")}
                          className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            abaMensagem === "turma1"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          🟢 Turma 1
                        </button>
                        <button
                          onClick={() => setAbaMensagem("turma2")}
                          className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            abaMensagem === "turma2"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          🔵 Turma 2
                        </button>
                        <button
                          onClick={() => setAbaMensagem("geral")}
                          className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            abaMensagem === "geral"
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          🌐 Geral
                        </button>
                      </div>

                      <button
                        onClick={() => copiarMensagem(getMensagemAtiva())}
                        className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase px-3 py-1.5 rounded-xl shadow-sm hover:scale-105 transition-all flex items-center gap-1.5"
                      >
                        📋 Copiar Mensagem
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={getMensagemAtiva()}
                      className="w-full flex-1 min-h-[340px] p-4 bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                /* CICLO PENDENTE: Botão de Ação para Fechar */
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl shadow-inner">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-800 dark:text-white">
                      Ciclo {cicloId} Pronto para Fechamento
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Ao clicar no botão abaixo, o sistema apurará as pontuações oficiais dos alunos, aplicará as regras de bonificação configuradas e gerará os relatórios prontos para divulgação.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={executarFechamento}
                    disabled={processando}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/25 text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {processando ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Processando Fechamento...
                      </>
                    ) : (
                      "🚀 Fechar Ciclo e Creditar Bônus do Top 10"
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
