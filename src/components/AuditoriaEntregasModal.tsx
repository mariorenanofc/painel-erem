"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Atividade } from "../types";

export interface ItemAuditoria {
  idEntrega: string;
  matricula: string;
  nomeAluno: string;
  turma: string;
  dataEnvio: number;
  dataEnvioFormatada: string;
  status: string;
  xpAtual: number;
  xpEsperado: number;
  atrasado: boolean;
  diasAtraso: number;
  motivoAtraso?: string;
  jaPontuado: boolean;
  aptoPontuar: boolean;
  feedback?: string;
}

interface AuditoriaEntregasModalProps {
  isOpen: boolean;
  onClose: () => void;
  missao: Atividade | null;
  onSuccess?: () => void;
}

export default function AuditoriaEntregasModal({
  isOpen,
  onClose,
  missao,
  onSuccess,
}: AuditoriaEntregasModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [itens, setItens] = useState<ItemAuditoria[]>([]);
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [abaFiltro, setAbaFiltro] = useState<"aptos" | "atrasados" | "pontuados" | "todos">("aptos");
  const [busca, setBusca] = useState("");
  const [xpCustom, setXpCustom] = useState<number>(0);

  useEffect(() => {
    if (isOpen && missao?.id) {
      setXpCustom(Number(missao.xp) || 0);
      carregarAuditoria(missao.id);
    } else {
      setItens([]);
      setSelecionados({});
      setBusca("");
    }
  }, [isOpen, missao?.id]);

  const carregarAuditoria = async (idAtividade: string) => {
    setCarregando(true);
    try {
      const res = await fetch(`/api/tutor/auditoria-entregas?idAtividade=${encodeURIComponent(idAtividade)}`);
      const data = await res.json();
      if (data.status === "sucesso" && Array.isArray(data.entregas)) {
        setItens(data.entregas);
        // Pré-selecionar os que estão aptos a pontuar
        const sel: Record<string, boolean> = {};
        data.entregas.forEach((item: ItemAuditoria) => {
          if (item.aptoPontuar) {
            sel[item.matricula] = true;
          }
        });
        setSelecionados(sel);
      }
    } catch (err: unknown) {
      console.error("Erro ao auditar entregas:", err);
    } finally {
      setCarregando(false);
    }
  };

  const itensFiltrados = useMemo(() => {
    return itens.filter((i) => {
      const matchBusca =
        !busca ||
        i.nomeAluno.toLowerCase().includes(busca.toLowerCase()) ||
        i.matricula.includes(busca) ||
        i.turma.toLowerCase().includes(busca.toLowerCase());

      if (!matchBusca) return false;

      if (abaFiltro === "aptos") return i.aptoPontuar;
      if (abaFiltro === "atrasados") return i.atrasado && !i.jaPontuado;
      if (abaFiltro === "pontuados") return i.jaPontuado;
      return true;
    });
  }, [itens, abaFiltro, busca]);

  const toggleSelect = (matricula: string) => {
    setSelecionados((prev) => ({
      ...prev,
      [matricula]: !prev[matricula],
    }));
  };

  const toggleSelectTodosVisiveis = () => {
    const todosMarcados = itensFiltrados.every((i) => !!selecionados[i.matricula]);
    setSelecionados((prev) => {
      const next = { ...prev };
      itensFiltrados.forEach((i) => {
        next[i.matricula] = !todosMarcados;
      });
      return next;
    });
  };

  const qtdSelecionadosTotal = useMemo(() => {
    return Object.values(selecionados).filter(Boolean).length;
  }, [selecionados]);

  const salvarAuditoria = async () => {
    if (!missao?.id) return;
    const matriculasAlvo = Object.keys(selecionados).filter((m) => selecionados[m]);

    if (matriculasAlvo.length === 0) {
      alert("Selecione pelo menos um estudante para creditar o XP.");
      return;
    }

    const confirmar = confirm(
      `Confirma a concessão de +${xpCustom} XP para os ${matriculasAlvo.length} estudante(s) selecionado(s)?\n\nEssa ação atualizará as entregas, perfis e rankings com segurança.`
    );
    if (!confirmar) return;

    setProcessando(true);
    try {
      const res = await fetch("/api/tutor/auditoria-entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idAtividade: missao.id,
          matriculas: matriculasAlvo,
          valorXp: xpCustom,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert(data.mensagem || "XP creditado com sucesso!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(data.mensagem || "Erro ao creditar XP.");
      }
    } catch (err: unknown) {
      alert("Falha de conexão ao processar auditoria.");
    } finally {
      setProcessando(false);
    }
  };

  if (!isOpen || !missao) return null;

  const totalAptos = itens.filter((i) => i.aptoPontuar).length;
  const totalAtrasados = itens.filter((i) => i.atrasado && !i.jaPontuado).length;
  const totalPontuados = itens.filter((i) => i.jaPontuado).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Container */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  🛡️ Auditoria Pedagógica de Entregas
                </span>
                <h3 className="font-display font-black text-lg sm:text-xl text-white mt-1.5 flex items-center gap-2">
                  <span>{missao.titulo}</span>
                </h3>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Módulo: <strong className="text-white">{missao.modulo || "Geral"}</strong> | Prazo Limite:{" "}
                  <strong className="text-white">{missao.dataLimite || "Sem prazo"}</strong> | XP Base:{" "}
                  <strong className="text-amber-300">+{missao.xp} XP</strong>
                </p>
              </div>

              <button
                onClick={onClose}
                className="cursor-pointer text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Abas de Filtro e Resumo */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => setAbaFiltro("aptos")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  abaFiltro === "aptos"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                <span>✅ Aptos a Pontuar</span>
                <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalAptos}
                </span>
              </button>

              <button
                onClick={() => setAbaFiltro("atrasados")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  abaFiltro === "atrasados"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                <span>⚠️ Fora do Prazo (Atrasados)</span>
                <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalAtrasados}
                </span>
              </button>

              <button
                onClick={() => setAbaFiltro("pontuados")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  abaFiltro === "pontuados"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                <span>🔒 Já Pontuados</span>
                <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalPontuados}
                </span>
              </button>

              <button
                onClick={() => setAbaFiltro("todos")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  abaFiltro === "todos"
                    ? "bg-slate-700 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                <span>Todos ({itens.length})</span>
              </button>
            </div>
          </div>

          {/* Barra de Ações Rápidas & Pesquisa */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Filtrar por nome do aluno, turma ou matrícula..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full text-xs border border-slate-250 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectTodosVisiveis}
                className="cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
              >
                {itensFiltrados.every((i) => !!selecionados[i.matricula])
                  ? "Desmarcar Todos Desta Aba"
                  : "Marcar Todos Desta Aba"}
              </button>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500">XP a Atribuir:</span>
                <input
                  type="number"
                  value={xpCustom}
                  onChange={(e) => setXpCustom(Number(e.target.value))}
                  className="w-14 font-mono font-black text-xs text-center border-b border-indigo-500 bg-transparent text-emerald-600 dark:text-emerald-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Listagem de Entregas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-white dark:bg-slate-900/50">
            {carregando ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <span className="animate-spin text-3xl">🔄</span>
                <p className="text-xs font-bold">Auditando entregas e prazos do Google Classroom...</p>
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <span className="text-4xl mb-3 select-none">📭</span>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Nenhuma entrega encontrada nesta visualização.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Mude os filtros de aba ou faça uma busca diferente.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {itensFiltrados.map((item) => {
                  const isChecked = !!selecionados[item.matricula];

                  return (
                    <div
                      key={item.idEntrega}
                      onClick={() => toggleSelect(item.matricula)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isChecked
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-600 shadow-sm"
                          : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // controlado pelo container
                          className="mt-1 sm:mt-0 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                              {item.nomeAluno}
                            </h4>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500">
                              {item.matricula}
                            </span>
                            {item.turma && (
                              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded">
                                {item.turma}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                            <span>🕒 Enviado em: <strong className="text-slate-600 dark:text-slate-300">{item.dataEnvioFormatada}</strong></span>
                            {item.atrasado && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/20">
                                ⚠️ Atrasado (+{item.diasAtraso}d)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Status Atual</span>
                          <span
                            className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                              item.jaPontuado
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : item.atrasado
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {item.xpAtual > 0 ? `${item.xpAtual} XP` : "0 XP (Pendente)"}
                          </span>
                        </div>

                        {isChecked && (
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            +{xpCustom} XP
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rodapé de Ações */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              <strong>{qtdSelecionadosTotal}</strong> estudante(s) selecionado(s) para pontuar (+{xpCustom} XP cada).
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={salvarAuditoria}
                disabled={processando || qtdSelecionadosTotal === 0}
                className="cursor-pointer flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {processando ? (
                  <>
                    <span className="animate-spin">🔄</span> Processando...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Confirmar e Creditar XP ({qtdSelecionadosTotal})
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

