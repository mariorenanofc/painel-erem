"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { AlunoRankingTutor } from "../types";
import { useToast } from "@/src/contexts/ToastContext";

interface FechamentoCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmasDisponiveis: string[];
}

interface AlunoTop10 extends AlunoRankingTutor {
  posicao: number;
  xpBonus: number;
}

const REGRAS_XP = {
  semanal: { top1: 0, top2_3: 20, top4_10: 10 },
  mensal: { top1: 30, top2_3: 80, top4_10: 40 },
};

export default function FechamentoCicloModal({
  isOpen,
  onClose,
  turmasDisponiveis,
}: FechamentoCicloModalProps) {
  const { toast } = useToast();

  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<"semanal" | "mensal">("semanal");
  const [turma, setTurma] = useState<string>(turmasDisponiveis[0] || "Todas");

  const [carregando, setCarregando] = useState(false);
  const [processandoXP, setProcessandoXP] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [top10, setTop10] = useState<AlunoTop10[]>([]);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEtapa(1);
      setTop10([]);
      setMensagemWhatsApp("");
    }
  }, [isOpen]);

  const carregarTop10 = async () => {
    if (!turma || turma === "Todas") {
      toast("Selecione uma turma específica!", "warning", "Atenção");
      return;
    }

    setCarregando(true);
    try {
      const data = await apiTutor.buscarRanking(tipo);
      if (data.status === "sucesso") {
        const rankingTurma = data.ranking.filter(
          (a: AlunoRankingTutor) => a.turma === turma,
        );
        const dezPrimeiros: AlunoTop10[] = rankingTurma
          .slice(0, 10)
          .map((aluno: AlunoRankingTutor, index: number) => {
            const posicao = index + 1;
            let xpBonus = 0;

            if (posicao === 1) xpBonus = REGRAS_XP[tipo].top1;
            else if (posicao >= 2 && posicao <= 3)
              xpBonus = REGRAS_XP[tipo].top2_3;
            else if (posicao >= 4 && posicao <= 10)
              xpBonus = REGRAS_XP[tipo].top4_10;

            return { ...aluno, posicao, xpBonus };
          });

        setTop10(dezPrimeiros);
        gerarTextoWhatsApp(dezPrimeiros);
        setEtapa(2);
      }
    } catch {
      toast("Erro ao buscar o ranking.", "error", "Falha na Rede");
    } finally {
      setCarregando(false);
    }
  };

  const gerarTextoWhatsApp = (lista: AlunoTop10[]) => {
    const tituloTipo = tipo === "mensal" ? "MENSAL" : "SEMANAL";
    const palavraTempo = tipo === "mensal" ? "do mês" : "da semana";
    const getAvatar = (a?: string) => (a && a !== "avatar-padrao" ? a : "👨‍💻");

    let text = `🏆 *RANKING ${tituloTipo} FECHADO – ${turma.toUpperCase()}!* 🏆\n\n`;
    text += `Fala, galera! O momento mais aguardado chegou para vocês também! O sistema finalizou a contagem e fechou a nossa classificação geral ${palavraTempo}. Aqui não é só sobre ir bem em um laboratório isolado, é sobre *consistência, foco e muita entrega*! 🔥💻\n\n`;
    text += `Os números estão absurdos! Confiram os gigantes que dominaram e estão no topo:\n\n`;

    const t1 = lista[0];
    if (t1) {
      text += `🥇 *A GRANDE CAMPEÃ(O) DA ${tituloTipo}:*\n`;
      text += `${getAvatar(t1.avatar)} *1º ${t1.nome.toUpperCase()}* — ${t1.xp} XP\n`;
      text += `*(Aplaude de pé! 👏 Uma campanha impecável e garantiu o topo absoluto!)*\n\n`;
    }

    const podioElite = lista.slice(1, 3);
    if (podioElite.length > 0) {
      text += `🥈 *O PÓDIO DE ELITE:*\n`;
      podioElite.forEach((a) => {
        text += `* ${getAvatar(a.avatar)} *${a.posicao}º ${a.nome.toUpperCase()}* — ${a.xp} XP\n`;
      });
      text += `*(Que disputa, meus amigos! A constância de vocês foi surreal. Parabéns!)*\n\n`;
    }

    const outros = lista.slice(3, 10);
    if (outros.length > 0) {
      text += `🎖️ *TOP 10 ${tituloTipo}:*\n`;
      text += `Palmas para os alunos que se mantiveram firmes e formam a elite:\n\n`;
      outros.forEach((a) => {
        text += `* ${getAvatar(a.avatar)} *${a.posicao}º ${a.nome.toUpperCase()}* — ${a.xp} XP\n`;
      });
      text += `\n`;
    }

    text += `🚀 *RECADO PARA TODOS:*\n`;
    text += `Estar nesse Top 10 significa que vocês estão com tudo na briga pelo nosso *Ranking Geral e o prêmio final*! Se o seu nome não apareceu hoje, lembre-se: um novo ciclo se inicia, o jogo reseta para a contagem ${tipo} e é a sua chance de disparar nas métricas!\n\n`;
    text += `Descansem, comemorem seus resultados e bora com tudo para o próximo ciclo! 💪💻🔥`;

    setMensagemWhatsApp(text);
  };

  const gerarTextoComIA = async () => {
    setGerandoIA(true);
    try {
      const data = await apiTutor.gerarMensagemIA(top10, turma, tipo);
      if (data.status === "sucesso") {
        setMensagemWhatsApp(data.mensagem);
        toast("A IA reescreveu a mensagem com sucesso!", "success", "Mensagem Gerada ✨");
      } else {
        toast(data.mensagem || "Erro ao gerar com IA.", "error", "Falha na IA");
      }
    } catch {
      toast("Erro de conexão ao gerar com IA.", "error", "Falha na Rede");
    } finally {
      setGerandoIA(false);
    }
  };

  const aplicarPremicoesEFinalizar = async () => {
    if (
      !confirm(
        "Isso irá depositar o XP na conta de todos os alunos da lista! Confirmar?",
      )
    )
      return;

    setProcessandoXP(true);
    let erros = 0;

    for (const aluno of top10) {
      if (aluno.xpBonus > 0) {
        try {
          await apiTutor.injetarXP(
            aluno.matricula,
            aluno.xpBonus,
            `Premiação Top 10 - Ranking ${tipo === "mensal" ? "Mensal" : "Semanal"}`,
          );
        } catch {
          erros++;
        }
      }
    }

    setProcessandoXP(false);

    if (erros > 0) {
      toast(`Finalizado com ${erros} erro(s).`, "warning", "Atenção");
    } else {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.3 } });
      toast(
        "O XP foi injetado com sucesso e o ranking foi fechado.",
        "success",
        "Ciclo Fechado! 🎉",
      );
    }
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(mensagemWhatsApp);
    toast(
      "O relatório foi copiado e está pronto para colar no WhatsApp!",
      "info",
      "Copiado!",
    );
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
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
          >
            {/* Glow decorativo de fundo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 dark:from-amber-600 dark:to-red-800 p-6 flex justify-between items-center text-white shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-display font-black text-xl flex items-center gap-2.5 tracking-tight">
                  <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base shadow-inner">
                    🏆
                  </span>{" "}
                  Fechamento de Ciclo
                </h2>
                <p className="text-amber-100 text-xs mt-1.5 font-semibold tracking-wider uppercase opacity-90">
                  Geração Automática de XP e Relatórios
                </p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-colors duration-200"
              >
                &times;
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/40 dark:bg-transparent">
              <AnimatePresence mode="wait">
                {etapa === 1 ? (
                  <motion.div
                    key="etapa1"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 max-w-lg mx-auto py-6"
                  >
                    {/* Alerta Inicial */}
                    <div className="bg-amber-50/50 dark:bg-amber-955/15 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 text-center">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">
                        Selecione os parâmetros do ciclo. O sistema mapeará os 10 melhores da turma e preparará o depósito automático dos XPs de forma instantânea!
                      </p>
                    </div>

                    {/* Campo 1: Tipo de Ciclo */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        1. Qual ciclo estamos fechando?
                      </label>
                      <div className="flex gap-3 bg-slate-100/50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setTipo("semanal")}
                          className={`cursor-pointer flex-1 py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all select-none ${
                            tipo === "semanal"
                              ? "bg-amber-500 text-white shadow-md"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          Semanal
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipo("mensal")}
                          className={`cursor-pointer flex-1 py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all select-none ${
                            tipo === "mensal"
                              ? "bg-amber-500 text-white shadow-md"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          Mensal
                        </button>
                      </div>
                    </div>

                    {/* Campo 2: Selecionar Turma */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        2. De qual Turma?
                      </label>
                      <div className="relative">
                        <select
                          value={turma}
                          onChange={(e) => setTurma(e.target.value)}
                          className="cursor-pointer w-full p-4 pr-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:border-amber-500 dark:focus:border-amber-550 font-bold text-sm transition-all shadow-sm appearance-none"
                        >
                          {turmasDisponiveis.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Botão de Enviar */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={carregarTop10}
                      disabled={carregando}
                      className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 select-none disabled:opacity-50 mt-4"
                    >
                      {carregando ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white animate-spin" />
                          Processando Classificação...
                        </>
                      ) : (
                        "Gerar Dados do Fechamento 🚀"
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="etapa2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* Coluna Esquerda: Ganhadores e Ações */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-slate-100/65 dark:bg-slate-950/50 p-4 px-5 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-display font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">
                          Os Vencedores ({tipo})
                        </h3>
                        <span className="bg-amber-100/90 dark:bg-amber-955/30 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-200/35 dark:border-amber-900/10">
                          Top 10 Geral
                        </span>
                      </div>

                      <div className="overflow-y-auto max-h-[48vh] p-3 space-y-2 custom-scrollbar">
                        {top10.length === 0 ? (
                          <p className="text-center text-slate-400 dark:text-slate-500 italic py-8">
                            Nenhum aluno encontrado para os critérios.
                          </p>
                        ) : (
                          top10.map((aluno) => {
                            const isTop1 = aluno.posicao === 1;
                            const isTop23 = aluno.posicao === 2 || aluno.posicao === 3;

                            return (
                              <div
                                key={aluno.matricula}
                                className={`flex justify-between items-center p-3.5 rounded-2xl border transition-all duration-300 ${
                                  isTop1
                                    ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                                    : isTop23
                                      ? "bg-slate-100/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-400"
                                      : "bg-white/50 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Posição Badge */}
                                  <span
                                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shadow-inner ${
                                      isTop1
                                        ? "bg-amber-400 text-amber-950 font-sans"
                                        : isTop23
                                          ? "bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    {aluno.posicao}º
                                  </span>

                                  {/* Avatar */}
                                  <span className="text-2xl select-none">
                                    {aluno.avatar && aluno.avatar !== "avatar-padrao"
                                      ? aluno.avatar
                                      : "👨‍💻"}
                                  </span>

                                  <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                                      {aluno.nome}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold font-mono mt-0.5">
                                      {aluno.xp} XP Atual
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  {aluno.xpBonus > 0 ? (
                                    <span className="bg-emerald-100/80 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 font-black px-2.5 py-1 rounded-xl text-[10px] border border-emerald-250/30 dark:border-emerald-900/10">
                                      +{aluno.xpBonus} XP
                                    </span>
                                  ) : (
                                    <span className="bg-amber-100/90 dark:bg-amber-955/45 text-amber-700 dark:text-amber-400 font-black px-2.5 py-1 rounded-xl text-[10px] border border-amber-250/30 dark:border-amber-900/10">
                                      Brinde Físico 🎁
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Botão de Confirmação */}
                      <div className="p-4 bg-white/50 dark:bg-transparent border-t border-slate-200/80 dark:border-slate-800 mt-auto">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={aplicarPremicoesEFinalizar}
                          disabled={processandoXP}
                          className="cursor-pointer w-full bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider select-none"
                        >
                          {processandoXP ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-emerald-350 border-t-white animate-spin" />
                              Depositando prêmios...
                            </>
                          ) : (
                            "💸 Injetar XP nas Contas"
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Coluna Direita: Relatório WhatsApp */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-inner flex flex-col relative min-h-[300px]">
                      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center bg-white/40 dark:bg-transparent">
                        <h3 className="font-display font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider text-xs flex items-center gap-2">
                          <span>💬</span> Mensagem do WhatsApp
                        </h3>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={gerarTextoComIA}
                            disabled={gerandoIA || top10.length === 0}
                            className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {gerandoIA ? (
                              <>
                                <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                GERANDO...
                              </>
                            ) : (
                              "✨ Reescrever com IA"
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={copiarTexto}
                            className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            Copiar
                          </motion.button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        value={mensagemWhatsApp}
                        className="w-full h-full min-h-[320px] lg:min-h-0 lg:flex-1 p-5 bg-transparent text-xs text-slate-600 dark:text-slate-400 font-mono resize-none focus:outline-none custom-scrollbar leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rodapé fixo do Modal */}
            {etapa === 2 && (
              <div className="p-5 border-t border-slate-200/80 dark:border-slate-800 bg-white/30 dark:bg-transparent flex justify-start shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEtapa(1)}
                  className="cursor-pointer px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ← Voltar e Refazer
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
