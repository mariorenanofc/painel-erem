/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GestaoFrequenciaModalProps } from "../types";

export default function GestaoFrequenciaModal(props: GestaoFrequenciaModalProps) {
  if (!props.isOpen) return null;

  const totalPresentes = props.dadosFreqHoje.filter((a) => a.presenteHoje).length;
  const totalFaltantes = props.dadosFreqHoje.length - totalPresentes;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={props.onClose}
          className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative z-10"
        >
          {/* Glow decorativo de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-650 to-emerald-850 dark:from-emerald-700 dark:to-teal-900 p-5 px-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2 tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm shadow-inner">
                  📍
                </span>{" "}
                Gestão de Frequência
              </h2>

              {/* Aba selector slide */}
              <div className="flex bg-emerald-950/40 dark:bg-slate-950/40 rounded-2xl p-1 border border-white/5">
                <button
                  onClick={() => props.setAbaDiario("mensal")}
                  className={`cursor-pointer px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                    props.abaDiario === "mensal"
                      ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-md"
                      : "text-emerald-100 hover:text-white dark:hover:text-emerald-250"
                  }`}
                >
                  Visão Mensal
                </button>
                <button
                  onClick={() => props.setAbaDiario("hoje")}
                  className={`cursor-pointer px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                    props.abaDiario === "hoje"
                      ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-md"
                      : "text-emerald-100 hover:text-white dark:hover:text-emerald-250"
                  }`}
                >
                  Frequência de Hoje
                </button>
              </div>
            </div>
            <button
              onClick={props.onClose}
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
            >
              &times;
            </button>
          </div>

          {/* Filtros / Barra Superior */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors shrink-0">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <select
                  value={props.turmaDiario}
                  onChange={(e) => props.setTurmaDiario(e.target.value)}
                  className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-8 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all appearance-none shadow-sm"
                >
                  <option value="Turma 1 - 1º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 1 - 1º Ano</option>
                  <option value="Turma 2 - 2º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 2 - 2º Ano</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px]">
                  ▼
                </div>
              </div>

              {props.abaDiario === "mensal" && (
                <>
                  <div className="relative">
                    <select
                      value={props.mesDiario}
                      onChange={(e) => props.setMesDiario(e.target.value)}
                      className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-8 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all appearance-none shadow-sm"
                    >
                      <option value="1" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Janeiro</option>
                      <option value="2" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Fevereiro</option>
                      <option value="3" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Março</option>
                      <option value="4" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Abril</option>
                      <option value="5" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Maio</option>
                      <option value="6" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Junho</option>
                      <option value="7" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Julho</option>
                      <option value="8" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Agosto</option>
                      <option value="9" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Setembro</option>
                      <option value="10" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Outubro</option>
                      <option value="11" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Novembro</option>
                      <option value="12" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Dezembro</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px]">
                      ▼
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={props.anoDiario}
                      onChange={(e) => props.setAnoDiario(e.target.value)}
                      className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-8 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all appearance-none shadow-sm"
                    >
                      <option value={new Date().getFullYear()} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {new Date().getFullYear()}
                      </option>
                      <option value={new Date().getFullYear() + 1} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {new Date().getFullYear() + 1}
                      </option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px]">
                      ▼
                    </div>
                  </div>
                </>
              )}
            </div>

            {props.abaDiario === "mensal" ? (
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 bg-white/50 dark:bg-slate-950/20 px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-sm transition-colors">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-500/80"></span>{" "}
                  Presente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 dark:bg-red-500/80"></span>{" "}
                  Falta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-550/80"></span>{" "}
                  Justificada
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => props.setFiltroStatusHoje("Todos")}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm select-none ${
                      props.filtroStatusHoje === "Todos"
                        ? "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800"
                        : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Todos ({props.dadosFreqHoje.length})
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => props.setFiltroStatusHoje("Presentes")}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm select-none ${
                      props.filtroStatusHoje === "Presentes"
                        ? "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800"
                        : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Presentes ({totalPresentes})
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => props.setFiltroStatusHoje("Faltantes")}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm select-none ${
                      props.filtroStatusHoje === "Faltantes"
                        ? "bg-red-650 dark:bg-red-700 text-white border-red-700 dark:border-red-800"
                        : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Faltantes ({totalFaltantes})
                  </motion.button>
                </div>
                <div className="flex gap-2.5 items-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-slate-200 dark:border-slate-800 transition-colors">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Ordenar:
                  </label>
                  <div className="relative">
                    <select
                      value={props.ordenacaoFreq}
                      onChange={(e) =>
                        props.setOrdenacaoFreq(e.target.value as "alfabetica" | "mais_faltas")
                      }
                      className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-8 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all appearance-none shadow-sm"
                    >
                       <option value="alfabetica" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ordem Alfabética</option>
                       <option value="mais_faltas" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Mais Faltas</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[9px]">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Corpo do Diário de Presença */}
          <div className="p-0 flex-1 overflow-auto relative custom-scrollbar bg-white/40 dark:bg-transparent">
            <AnimatePresence mode="wait">
              {props.abaDiario === "mensal" ? (
                props.carregandoFreq ? (
                  <motion.div
                    key="loadMensal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-24 opacity-60"
                  >
                    <div className="relative w-10 h-10 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                    </div>
                    <p className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">
                      Processando Diário de Classe...
                    </p>
                  </motion.div>
                ) : props.diasComAula.length === 0 ? (
                  <motion.p
                    key="emptyMensal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-slate-400 dark:text-slate-500 italic py-16"
                  >
                    Nenhuma aula registrada para esta turma neste mês.
                  </motion.p>
                ) : (
                  <motion.table
                    key="tabelaMensal"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full text-left text-xs border-separate border-spacing-0"
                  >
                    <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider sticky top-0 z-20 shadow-sm">
                      <tr>
                        <th className="px-5 py-3.5 border-b border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-100/90 dark:bg-slate-950 z-30 min-w-[240px] transition-colors">
                          Nome do Aluno
                        </th>
                        {props.diasComAula.map((dia) => (
                          <th
                            key={dia}
                            className="px-2 py-3.5 border-b border-slate-200 dark:border-slate-800 text-center min-w-[64px] transition-colors"
                            title={`Dia ${dia}`}
                          >
                            <div className="mx-auto text-slate-700 dark:text-slate-300 font-mono font-black">
                              Dia {dia}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white/40 dark:bg-slate-900/10 divide-y divide-slate-100 dark:divide-slate-800">
                      {props.alunosDiario.map((aluno) => (
                        <tr
                          key={aluno.matricula}
                          className="hover:bg-white/90 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="px-5 py-3 border-b border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 z-10 font-bold text-slate-800 dark:text-slate-100 transition-colors">
                            <div className="truncate w-[200px]">{aluno.nome}</div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal font-mono mt-0.5">
                              {aluno.matricula}
                            </span>
                          </td>
                          {props.diasComAula.map((dia) => {
                            const infoDia = aluno.frequencia[dia];
                            return (
                              <td
                                key={dia}
                                className="px-2 py-2 border-b border-slate-200/50 dark:border-slate-800 text-center transition-colors"
                              >
                                {infoDia?.status === "presente" && (
                                  <div
                                    className="w-7 h-7 mx-auto bg-emerald-100/90 dark:bg-emerald-955/45 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-black text-[10px] border border-emerald-200/30 dark:border-emerald-900/10 shadow-sm"
                                    title="Presente"
                                  >
                                    P
                                  </div>
                                )}
                                {infoDia?.status === "falta" && (
                                  <motion.div
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      props.setModalJustificativaAberto({
                                        matricula: aluno.matricula,
                                        nome: aluno.nome,
                                        dia: dia,
                                        idFalta: infoDia?.idFalta,
                                      })
                                    }
                                    className="w-7 h-7 mx-auto bg-rose-100/90 dark:bg-rose-955/45 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center font-black text-[10px] cursor-pointer border border-rose-250/30 dark:border-rose-900/10 shadow-sm hover:brightness-110"
                                    title="Falta - Clique para justificar"
                                  >
                                    F
                                  </motion.div>
                                )}
                                {infoDia?.status === "justificada" && (
                                  <motion.div
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      props.setModalJustificativaAberto({
                                        matricula: aluno.matricula,
                                        nome: aluno.nome,
                                        dia: dia,
                                        idFalta: infoDia?.idFalta,
                                      })
                                    }
                                    className="w-7 h-7 mx-auto bg-amber-100/90 dark:bg-amber-955/45 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-black text-[10px] cursor-pointer border border-amber-250/30 dark:border-amber-900/10 shadow-sm hover:brightness-110"
                                    title={`Justificada: ${infoDia?.justificativa || "Sem observação"} - Clique para editar`}
                                  >
                                    J
                                  </motion.div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </motion.table>
                )
              ) : props.carregandoFreqHoje ? (
                <motion.div
                  key="loadHoje"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 opacity-60"
                >
                  <div className="relative w-10 h-10 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                  </div>
                  <p className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">
                    Buscando frequência escolar de hoje...
                  </p>
                </motion.div>
              ) : (
                <motion.table
                  key="tabelaHoje"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left text-xs border-collapse"
                >
                  <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
                        Aluno
                      </th>
                      <th className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-center">
                        Status Hoje
                      </th>
                      <th className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-center">
                        Faltas Acumuladas
                      </th>
                      <th className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-center">
                        % Presença
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/40 dark:bg-slate-900/10 divide-y divide-slate-100 dark:divide-slate-800">
                    {props.freqHojeFiltrada.map((aluno) => {
                      const taxaPresenca =
                        props.totalAulasTurma > 0
                          ? Math.round((aluno.presencasTotais / props.totalAulasTurma) * 100)
                          : 100;
                      return (
                        <tr
                          key={aluno.matricula}
                          className="hover:bg-white/90 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-800 dark:text-white text-sm">
                              {aluno.nome}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {aluno.matricula}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {aluno.presenteHoje ? (
                              <span className="bg-emerald-100/90 dark:bg-emerald-955/35 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-emerald-250/30 dark:border-emerald-900/10 shadow-sm">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>{" "}
                                Presente ({aluno.horaHoje})
                              </span>
                            ) : (
                              <span className="bg-rose-100/90 dark:bg-rose-955/35 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-rose-250/30 dark:border-rose-900/10 shadow-sm">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 dark:bg-red-400"></span>{" "}
                                Faltou
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`font-black text-base font-mono transition-colors ${
                                aluno.faltasTotais >= 3 ? "text-rose-500 dark:text-rose-455 animate-pulse" : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {aluno.faltasTotais}
                            </span>
                            <span className="text-[10px] font-black font-mono text-slate-400 dark:text-slate-500 ml-1">
                              / {props.totalAulasTurma}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 max-w-[100px] mx-auto mt-1 overflow-hidden shadow-inner">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  taxaPresenca >= 75 ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${taxaPresenca}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-black font-mono text-slate-500 dark:text-slate-400 mt-1.5 block">
                              {taxaPresenca}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {props.freqHojeFiltrada.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider"
                        >
                          Nenhum aluno encontrado para este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </motion.table>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Justification sub-modal */}
      <AnimatePresence>
        {props.modalJustificativaAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Inner Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => props.setModalJustificativaAberto(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Sub-modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 border border-slate-200 dark:border-white/5 relative z-10 flex flex-col"
            >
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <span>📝</span> Justificar Falta
              </h3>
              <p className="text-[11px] font-semibold text-slate-550 dark:text-slate-400 leading-relaxed mb-4">
                Aluno: <strong className="text-slate-800 dark:text-slate-200 font-black">{props.modalJustificativaAberto.nome}</strong> <br />
                Data da Falta: <strong className="text-slate-800 dark:text-slate-200 font-mono font-black">{String(props.modalJustificativaAberto.dia).padStart(2, "0")}/{String(props.mesDiario).padStart(2, "0")}</strong>
              </p>
              
              <textarea
                rows={3}
                value={props.textoJustificativa}
                onChange={(e) => props.setTextoJustificativa(e.target.value)}
                placeholder="Digite o motivo da justificativa (ex: Atestado médico entregue)"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500 mb-4 resize-none shadow-sm transition-all"
              />

              <div className="flex gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => props.setModalJustificativaAberto(null)}
                  className="cursor-pointer flex-1 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all select-none"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={props.salvarJustificativa}
                  className="cursor-pointer flex-1 py-3 text-xs font-black uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl shadow-md shadow-amber-500/10 transition-all select-none"
                >
                  Salvar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
