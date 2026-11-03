"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Atividade } from "@/src/types";
import { getFeriadosAno } from "@/src/lib/feriadosUtils";

/**
 * Normaliza qualquer formato de data (DD/MM/YYYY, YYYY-MM-DD, ISO com hora) para YYYY-MM-DD
 */
function extrairDataIso(valor: unknown): string {
  if (!valor) return "";
  const str = String(valor).trim();
  if (!str) return "";

  // Se já for YYYY-MM-DD (com ou sem horário após espaço ou T)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Se for DD/MM/YYYY (com ou sem horário após espaço)
  if (str.includes("/")) {
    const semHora = str.split(/\s+/)[0];
    const partes = semHora.split("/");
    if (partes.length === 3) {
      const d = partes[0].padStart(2, "0");
      const m = partes[1].padStart(2, "0");
      let y = partes[2];
      if (y.length === 2) y = `20${y}`;
      if (y.length === 4) return `${y}-${m}-${d}`;
    }
  }

  // Se for DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return "";
}

export interface CalendarioEvento {
  id: string;
  titulo: string;
  data: string; // "YYYY-MM-DD"
  tipo: "aula" | "prazo" | "ciclo_semanal" | "ciclo_mensal" | "feriado" | "recesso";
  descricao?: string;
  xp?: number;
  badge?: string;
  modulo?: string;
  statusEntrega?: string;
}

interface CalendarioOficialProps {
  isOpen: boolean;
  onClose: () => void;
  atividades?: Atividade[];
  diasAulas?: string[]; // "DD/MM/YYYY" ou "YYYY-MM-DD"
  turmaNome?: string;
  diaFechamentoSemanal?: number; // 0 = Domingo, 1 = Segunda, etc.
}

export default function CalendarioOficial({
  isOpen,
  onClose,
  atividades = [],
  diasAulas = [],
  turmaNome = "Geral",
  diaFechamentoSemanal = 0 // Padrão: Domingo
}: CalendarioOficialProps) {
  // Data de hoje calculada no fuso horário local do navegador (Brasil)
  const hoje = new Date();
  const dataHojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const [dataVisualizada, setDataVisualizada] = useState(new Date());
  const [visao, setVisao] = useState<"mes" | "lista">("mes");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "prazos" | "aulas" | "ciclos" | "feriados">("todos");
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(dataHojeIso);

  const ano = dataVisualizada.getFullYear();
  const mes = dataVisualizada.getMonth(); // 0 a 11

  // Navegar meses
  const mudarMes = (offset: number) => {
    const novaData = new Date(ano, mes + offset, 1);
    setDataVisualizada(novaData);
    if (novaData.getFullYear() === hoje.getFullYear() && novaData.getMonth() === hoje.getMonth()) {
      setDiaSelecionado(dataHojeIso);
    } else {
      setDiaSelecionado(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, "0")}-01`);
    }
  };

  // Mapear eventos a partir das atividades, aulas, ciclos e feriados
  const eventosMap = useMemo(() => {
    const map: Record<string, CalendarioEvento[]> = {};

    const adicionarEvento = (dataIso: string, evento: CalendarioEvento) => {
      if (!map[dataIso]) map[dataIso] = [];
      map[dataIso].push(evento);
    };

    // 1. Feriados Nacionais, Estaduais (PE) e Recessos Escolares da SEE-PE
    const feriados = getFeriadosAno(ano);
    feriados.forEach((f, idx) => {
      adicionarEvento(f.dataIso, {
        id: `feriado-${idx}-${f.dataIso}`,
        titulo: f.nome,
        data: f.dataIso,
        tipo: f.tipo === "nacional" || f.tipo === "estadual_pe" ? "feriado" : "recesso",
        descricao: f.descricao,
        badge: f.badge || (f.tipo === "escolar_pe" ? "🏖️ Recesso SEE-PE" : "🏖️ Feriado")
      });
    });

    // 2. Prazos e Conteúdos das Atividades (Mapeamento Robusto)
    atividades.forEach((ativ) => {
      const ativRec = ativ as unknown as Record<string, unknown>;
      const rawData = ativ.dataLimite || ativRec.prazo || ativRec.dataEntrega || ativRec.data;
      const dataIso = extrairDataIso(rawData);

      if (dataIso) {
        const statusText = ativ.status === "Aprovada" || ativ.status === "Devolvida" || ativ.status === "Pendente"
          ? ativ.status
          : "Aguardando envio";

        adicionarEvento(dataIso, {
          id: `ativ-${ativ.id}`,
          titulo: ativ.titulo,
          data: dataIso,
          tipo: "prazo",
          descricao: ativ.descricao ? ativ.descricao.slice(0, 90) + "..." : `Entrega da missão (${ativ.xp} XP)`,
          xp: Number(ativ.xp) || 0,
          badge: "⏰ Prazo",
          modulo: ativ.tipo || "Missão",
          statusEntrega: statusText
        });
      }
    });

    // 3. Dias de Aulas Presenciais
    diasAulas.forEach((diaStr, idx) => {
      const dataIso = extrairDataIso(diaStr);

      if (dataIso) {
        adicionarEvento(dataIso, {
          id: `aula-${idx}-${dataIso}`,
          titulo: "Aula TrilhaTech (Laboratório)",
          data: dataIso,
          tipo: "aula",
          descricao: "Encontro presencial, prática de código e presença escolar",
          badge: "💻 Aula"
        });
      }
    });

    // 4. Fechamento Semanal (Todos os dias configurados no mês, ex: Domingos)
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    for (let d = 1; d <= totalDiasMes; d++) {
      const dt = new Date(ano, mes, d);
      if (dt.getDay() === diaFechamentoSemanal) {
        const dIso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        adicionarEvento(dIso, {
          id: `fechamento-semanal-${dIso}`,
          titulo: "Resultado & Fechamento Semanal",
          data: dIso,
          tipo: "ciclo_semanal",
          descricao: "Apuração das pontuações da semana e premiação do Top 10",
          badge: "⚡ Fechamento Semanal"
        });
      }
    }

    // 5. Fechamento Mensal (Último dia do mês)
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
    const dataIsoFimMes = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(ultimoDiaMes).padStart(2, "0")}`;
    adicionarEvento(dataIsoFimMes, {
      id: `fechamento-mensal-${mes}`,
      titulo: "Resultado Oficial do Ranking Mensal",
      data: dataIsoFimMes,
      tipo: "ciclo_mensal",
      descricao: "Congelamento geral de pontuações, divulgação e bônus da elite mensal",
      badge: "🏆 Fechamento Mensal"
    });

    return map;
  }, [ano, mes, atividades, diasAulas, diaFechamentoSemanal]);

  // Filtragem dos eventos conforme categoria selecionada
  const filtrarEvento = (ev: CalendarioEvento): boolean => {
    if (filtroTipo === "todos") return true;
    if (filtroTipo === "prazos") return ev.tipo === "prazo";
    if (filtroTipo === "aulas") return ev.tipo === "aula";
    if (filtroTipo === "ciclos") return ev.tipo === "ciclo_semanal" || ev.tipo === "ciclo_mensal";
    if (filtroTipo === "feriados") return ev.tipo === "feriado" || ev.tipo === "recesso";
    return true;
  };

  // Montar Grid do Mês
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const diasArray: Array<{ dia: number; dataIso: string; isOutroMes?: boolean }> = [];
  for (let i = 0; i < primeiroDiaSemana; i++) {
    diasArray.push({ dia: 0, dataIso: "", isOutroMes: true });
  }
  for (let d = 1; d <= totalDiasMes; d++) {
    const dataIso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    diasArray.push({ dia: d, dataIso });
  }

  const nomeMesExtenso = dataVisualizada.toLocaleString("pt-BR", { month: "long" });

  const eventosDoDiaSelecionado = diaSelecionado
    ? (eventosMap[diaSelecionado] || []).filter(filtrarEvento)
    : [];

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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <span className="text-2xl select-none">📅</span>
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Calendário & Cronograma Escolar
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/20">
                      {turmaNome}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhe aulas, prazos de entrega, feriados nacionais e os dias oficiais de apuração dos rankings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl mr-2">
                  <button
                    onClick={() => setVisao("mes")}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      visao === "mes" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setVisao("lista")}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      visao === "lista" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Lista de Prazos
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-Header: Navegação Mensal e Filtros por Categoria */}
            <div className="px-6 py-3 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => mudarMes(-1)}
                  className="cursor-pointer p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-colors"
                >
                  ◀
                </button>
                <h3 className="font-display font-black text-sm text-slate-800 dark:text-white capitalize">
                  {nomeMesExtenso} de {ano}
                </h3>
                <button
                  onClick={() => mudarMes(1)}
                  className="cursor-pointer p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-colors"
                >
                  ▶
                </button>
              </div>

              {/* Botões de Filtro Rápido */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                <button
                  onClick={() => setFiltroTipo("todos")}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg transition-all ${
                    filtroTipo === "todos" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroTipo("aulas")}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filtroTipo === "aulas" ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  💻 Aulas
                </button>
                <button
                  onClick={() => setFiltroTipo("prazos")}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filtroTipo === "prazos" ? "bg-amber-600 text-white" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  ⏰ Prazos
                </button>
                <button
                  onClick={() => setFiltroTipo("ciclos")}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filtroTipo === "ciclos" ? "bg-indigo-600 text-white" : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400"
                  }`}
                >
                  🏆 Fechamentos
                </button>
                <button
                  onClick={() => setFiltroTipo("feriados")}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filtroTipo === "feriados" ? "bg-rose-600 text-white" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  🏖️ Feriados
                </button>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {visao === "mes" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Grid do Mês */}
                  <div className="lg:col-span-8 space-y-2">
                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                        <span key={d} className="text-[11px] font-black uppercase text-slate-400">
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Células de Dias */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {diasArray.map((item, index) => {
                        if (item.isOutroMes) {
                          return <div key={`empty-${index}`} className="h-20 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10 opacity-30" />;
                        }

                        const eventosDoDia = (eventosMap[item.dataIso] || [])
                          .filter(filtrarEvento)
                          .sort((a, b) => {
                            const peso: Record<string, number> = { prazo: 1, aula: 2, feriado: 3, recesso: 4, ciclo_semanal: 5, ciclo_mensal: 6 };
                            return (peso[a.tipo] || 99) - (peso[b.tipo] || 99);
                          });
                        const isHoje = item.dataIso === dataHojeIso;
                        const isSelecionado = item.dataIso === diaSelecionado;

                        return (
                          <div
                            key={item.dataIso}
                            onClick={() => setDiaSelecionado(item.dataIso)}
                            className={`cursor-pointer min-h-[88px] p-2 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                              isSelecionado
                                ? "bg-indigo-500/10 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                                : isHoje
                                ? "bg-amber-500/10 border-amber-500/40"
                                : "bg-white dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span
                                className={`text-xs font-mono font-bold ${
                                  isHoje
                                    ? "bg-amber-500 text-white px-1.5 py-0.5 rounded-lg"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {item.dia}
                              </span>
                              {eventosDoDia.length > 0 && (
                                <span className="text-[10px] font-black text-indigo-500">
                                  {eventosDoDia.length}
                                </span>
                              )}
                            </div>

                            {/* Pílulas de eventos */}
                            <div className="space-y-0.5 overflow-hidden">
                              {eventosDoDia.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                                    ev.tipo === "aula"
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                      : ev.tipo === "prazo"
                                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                      : ev.tipo === "feriado"
                                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                                      : ev.tipo === "recesso"
                                      ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300"
                                      : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                  }`}
                                >
                                  {ev.titulo}
                                </div>
                              ))}
                              {eventosDoDia.length > 3 && (
                                <span className="text-[8px] font-bold text-slate-400 block text-right">
                                  +{eventosDoDia.length - 3} mais
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalhes do Dia Selecionado */}
                  <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col">
                    <h4 className="font-display font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider mb-3">
                      📌 {diaSelecionado === dataHojeIso ? "Eventos de Hoje" : "Eventos do Dia"} {diaSelecionado ? `(${new Date(diaSelecionado + "T12:00:00").toLocaleDateString("pt-BR")})` : ""}
                    </h4>

                    {eventosDoDiaSelecionado.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                        <span className="text-3xl mb-2 select-none">🏖️</span>
                        Nenhum evento registrado para esta data.
                      </div>
                    ) : (
                      <div className="space-y-2.5 overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
                        {eventosDoDiaSelecionado.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  ev.tipo === "aula"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : ev.tipo === "prazo"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                    : ev.tipo === "feriado"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                    : ev.tipo === "recesso"
                                    ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300"
                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                }`}
                              >
                                {ev.badge || ev.tipo}
                              </span>
                              {ev.xp ? (
                                <span className="font-mono font-bold text-xs text-emerald-500">
                                  +{ev.xp} XP
                                </span>
                              ) : null}
                            </div>
                            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-snug">
                              {ev.titulo}
                            </h5>
                            {ev.modulo && (
                              <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                                {ev.modulo}
                              </span>
                            )}
                            {ev.statusEntrega && (
                              <p className="text-[10px] text-slate-500 font-semibold">
                                Status da entrega: <span className="font-bold">{ev.statusEntrega}</span>
                              </p>
                            )}
                            {ev.descricao && (
                              <p className="text-[11px] text-slate-400">
                                {ev.descricao}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* VISÃO EM LISTA (CRONOGRAMA DE PRAZOS) */
                <div className="space-y-3 max-w-3xl mx-auto">
                  <h4 className="font-display font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider mb-2">
                    ⏳ Todos os Prazos e Eventos do Mês ({nomeMesExtenso})
                  </h4>
                  {Object.keys(eventosMap).sort().map((dataKey) => {
                    if (!dataKey.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`)) return null;
                    const evs = (eventosMap[dataKey] || []).filter(filtrarEvento);
                    if (evs.length === 0) return null;

                    return (
                      <div key={dataKey} className="flex gap-4 items-start p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl font-mono text-center min-w-[65px]">
                          <span className="block text-xl font-black text-slate-800 dark:text-white leading-none">
                            {dataKey.split("-")[2]}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 block">
                            {new Date(dataKey + "T12:00:00").toLocaleString("pt-BR", { weekday: "short" })}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          {evs.map((e) => (
                            <div key={e.id} className="flex justify-between items-start gap-2 border-b border-slate-100 dark:border-slate-700/40 last:border-0 pb-1.5 last:pb-0">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                      e.tipo === "aula"
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : e.tipo === "prazo"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                        : e.tipo === "feriado"
                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                        : e.tipo === "recesso"
                                        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300"
                                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                    }`}
                                  >
                                    {e.badge || e.tipo}
                                  </span>
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                    {e.titulo}
                                  </span>
                                </div>
                                {e.descricao && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">{e.descricao}</p>
                                )}
                              </div>
                              {e.xp ? (
                                <span className="text-xs font-mono font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md shrink-0">
                                  +{e.xp} XP
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
