/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { apiTutor } from "@/src/services/api";
import { AlunoRankingTutor } from "../types";

interface FechamentoCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmasDisponiveis: string[];
}

// ⚙️ REGRAS DE NEGÓCIO DE PREMIAÇÃO
const REGRAS_XP = {
  semanal: { top1: 0, top2_3: 20, top4_10: 10 },
  mensal: { top1: 30, top2_3: 80, top4_10: 40 },
};

export default function FechamentoCicloModal({
  isOpen,
  onClose,
  turmasDisponiveis,
}: FechamentoCicloModalProps) {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<"semanal" | "mensal">("semanal");
  const [turma, setTurma] = useState<string>(turmasDisponiveis[0] || "Todas");

  const [carregando, setCarregando] = useState(false);
  const [processandoXP, setProcessandoXP] = useState(false);
  const [top10, setTop10] = useState<any[]>([]);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEtapa(1);
      setTop10([]);
      setMensagemWhatsApp("");
    }
  }, [isOpen]);

  const carregarTop10 = async () => {
    if (!turma || turma === "Todas")
      return alert("Selecione uma turma específica!");

    setCarregando(true);
    try {
      const data = await apiTutor.buscarRanking(tipo);
      if (data.status === "sucesso") {
        // Filtra pela turma e pega os 10 primeiros
        const rankingTurma = data.ranking.filter(
          (a: AlunoRankingTutor) => a.turma === turma,
        );
        const dezPrimeiros = rankingTurma
          .slice(0, 10)
          .map((aluno: any, index: number) => {
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
      alert("Erro ao buscar o ranking.");
    } finally {
      setCarregando(false);
    }
  };

  const gerarTextoWhatsApp = (lista: any[]) => {
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
      alert(`Finalizado com ${erros} erro(s).`);
    } else {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.3 } });
      alert("🎉 XP INJETADO COM SUCESSO! O Ranking foi fechado.");
    }
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(mensagemWhatsApp);
    alert("Texto copiado para a área de transferência!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="font-black text-2xl flex items-center gap-2">
              <span>🏆</span> Fechamento de Ciclo
            </h2>
            <p className="text-amber-100 text-xs mt-1 font-bold tracking-widest uppercase">
              Geração Automática de XP e Relatório
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-4xl leading-none hover:text-amber-200 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {etapa === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 max-w-lg mx-auto py-10">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50 transition-colors">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400 text-center transition-colors">
                  Selecione os parâmetros abaixo. O sistema irá capturar os 10
                  melhores da turma e preparar o depósito automático dos XPs!
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-2 transition-colors">
                  1. Qual ciclo estamos fechando?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipo("semanal")}
                    className={`cursor-pointer flex-1 py-3 rounded-xl font-black transition-all border-2 ${tipo === "semanal" ? "bg-amber-500 text-white border-amber-600 shadow-md scale-105" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                  >
                    SEMANAL
                  </button>
                  <button
                    onClick={() => setTipo("mensal")}
                    className={`cursor-pointer flex-1 py-3 rounded-xl font-black transition-all border-2 ${tipo === "mensal" ? "bg-amber-500 text-white border-amber-600 shadow-md scale-105" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                  >
                    MENSAL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-2 transition-colors">
                  2. De qual Turma?
                </label>
                <select
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  className="cursor-pointer w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-amber-500 dark:focus:border-amber-500 font-bold text-sm transition-colors"
                >
                  {turmasDisponiveis.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={carregarTop10}
                disabled={carregando}
                className="cursor-pointer w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg mt-4 disabled:opacity-50"
              >
                {carregando ? "Calculando..." : "GERAR DADOS DO FECHAMENTO 🚀"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
              {/* COLUNA ESQUERDA: LISTA E XP */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors">
                <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors">
                  <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm transition-colors">
                    Os Vencedores ({tipo})
                  </h3>
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 text-[10px] font-black px-2 py-1 rounded transition-colors">
                    Top 10
                  </span>
                </div>
                <div className="overflow-y-auto max-h-[50vh] p-2 custom-scrollbar">
                  {top10.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 p-6 transition-colors">
                      Nenhum aluno encontado.
                    </p>
                  ) : (
                    top10.map((aluno) => (
                      <div
                        key={aluno.matricula}
                        className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-400 dark:text-slate-500 w-5 transition-colors">
                            {aluno.posicao}º
                          </span>
                          <span className="text-xl">
                            {aluno.avatar && aluno.avatar !== "avatar-padrao"
                              ? aluno.avatar
                              : "👨‍💻"}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight transition-colors">
                              {aluno.nome}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold transition-colors">
                              {aluno.xp} XP Atual
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {aluno.xpBonus > 0 ? (
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black px-2 py-1 rounded text-xs animate-pulse transition-colors">
                              +{aluno.xpBonus} XP
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded text-[10px] transition-colors">
                              Brinde Físico 🎁
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto transition-colors">
                  <button
                    onClick={aplicarPremicoesEFinalizar}
                    disabled={processandoXP}
                    className="cursor-pointer w-full bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {processandoXP
                      ? "💸 Injetando nas contas..."
                      : "💸 INJETAR XP NAS CONTAS AGORA"}
                  </button>
                </div>
              </div>

              {/* COLUNA DIREITA: WHATSAPP COPY */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col relative transition-colors">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
                  <h3 className="font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-sm flex items-center gap-2 transition-colors">
                    <span>💬</span> Mensagem do WhatsApp
                  </h3>
                  <button
                    onClick={copiarTexto}
                    className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    Copiar Texto
                  </button>
                </div>
                <textarea
                  readOnly
                  value={mensagemWhatsApp}
                  className="w-full h-full min-h-75 p-5 bg-transparent text-sm text-slate-700 dark:text-slate-300 font-mono resize-none focus:outline-none custom-scrollbar leading-relaxed transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {etapa === 2 && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
            <button
              onClick={() => setEtapa(1)}
              className="cursor-pointer px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ← Voltar e Refazer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
