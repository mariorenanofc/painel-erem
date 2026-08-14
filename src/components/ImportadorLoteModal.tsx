/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TABELA_XP_PADRAO = {
  Material: 7,
  Quiz: 25,
  Projeto: 150,
};

interface CursoClassroom {
  id: string;
  nome: string;
  section: string;
}

interface AtividadeRadar {
  idClassroom: string;
  courseId: string;
  titulo: string;
  descricao: string;
  linkClassroom: string;
  xpRecomendado: number;
  dataLimite: string;
}

interface AtividadeParseada {
  idTemp: string;
  titulo: string;
  tipo: string;
  xp: number;
  selecionado: boolean;
  linkClassroom: string;
  dataLimite: string;
  descricao: string;
  opcaoA?: string;
  resolucaoTyping?: string;
  limiteTempoTyping?: number;
}

interface ImportadorLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  modulosCadastrados: string[];
  turmasDisponiveis: string[];
  onImportar: (
    atividades: AtividadeParseada[],
    modulo: string,
    turma: string,
  ) => Promise<void>;
}

export default function ImportadorLoteModal({
  isOpen,
  onClose,
  modulosCadastrados,
  turmasDisponiveis,
  onImportar,
}: ImportadorLoteModalProps) {
  const [modulo, setModulo] = useState("");
  const [turma, setTurma] = useState("Todas");
  
  const [cursos, setCursos] = useState<CursoClassroom[]>([]);
  const [cursoSelecionado, setCursoSelecionado] = useState("");
  
  const [atividades, setAtividades] = useState<AtividadeParseada[]>([]);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [importando, setImportando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [buscandoCursos, setBuscandoCursos] = useState(false);
  const [erroBuscar, setErroBuscar] = useState("");

  // Zera estados e busca cursos quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setModulo("");
      setTurma("Todas");
      setCursoSelecionado("");
      setAtividades([]);
      setEtapa(1);
      setErroBuscar("");
      buscarCursos();
    }
  }, [isOpen]);

  const buscarCursos = async () => {
    setBuscandoCursos(true);
    setErroBuscar("");
    try {
      const res = await fetch("/api/tutor/sincronizar-ava/radar/cursos");
      const data = await res.json();
      if (data.status === "sucesso") {
        setCursos(data.cursos);
      } else {
        setErroBuscar(data.mensagem || "Erro ao buscar turmas do Classroom.");
      }
    } catch (e: any) {
      setErroBuscar("Falha de comunicação ao buscar turmas.");
    } finally {
      setBuscandoCursos(false);
    }
  };

  const buscarRadar = async () => {
    if (!cursoSelecionado) {
      setErroBuscar("Selecione uma turma do Classroom primeiro.");
      return;
    }
    
    setBuscando(true);
    setErroBuscar("");
    try {
      const res = await fetch("/api/tutor/sincronizar-ava/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cursoSelecionado })
      });
      const data = await res.json();
      
      if (data.status === "sucesso") {
        const parseadas = data.atividades.map((ativ: AtividadeRadar) => {
          let tipoPortal = "Material";
          let xp = ativ.xpRecomendado > 0 ? ativ.xpRecomendado : TABELA_XP_PADRAO.Material;

          const tituloLower = ativ.titulo.toLowerCase();
          if (tituloLower.includes("desafio") || tituloLower.includes("quiz")) {
            tipoPortal = "Quiz";
            if (ativ.xpRecomendado === 100) xp = TABELA_XP_PADRAO.Quiz;
          } else if (tituloLower.includes("projeto") || tituloLower.includes("prática")) {
            tipoPortal = "Projeto";
            if (ativ.xpRecomendado === 100) xp = TABELA_XP_PADRAO.Projeto;
          }

          return {
            idTemp: ativ.idClassroom,
            titulo: ativ.titulo,
            tipo: tipoPortal,
            xp: xp,
            selecionado: true,
            linkClassroom: ativ.linkClassroom,
            dataLimite: ativ.dataLimite,
            descricao: ativ.descricao,
            opcaoA: "",
            resolucaoTyping: "",
            limiteTempoTyping: 0,
          };
        });
        setAtividades(parseadas);
        setEtapa(2);
      } else {
        setErroBuscar(data.mensagem || "Erro desconhecido ao buscar radar.");
      }
    } catch (e: any) {
      setErroBuscar(e.message || "Falha na comunicação com o servidor.");
    } finally {
      setBuscando(false);
    }
  };

  const toggleSelecao = (idTemp: string) => {
    setAtividades((prev) =>
      prev.map((a) =>
        a.idTemp === idTemp ? { ...a, selecionado: !a.selecionado } : a,
      ),
    );
  };

  const atualizarAtividade = (idTemp: string, campo: string, valor: any) => {
    setAtividades((prev) =>
      prev.map((a) => (a.idTemp === idTemp ? { ...a, [campo]: valor } : a))
    );
  };

  const confirmarImportacao = async () => {
    if (!modulo) {
      alert("Por favor, selecione o Módulo da Matriz!");
      return;
    }

    const selecionadas = atividades.filter((a) => a.selecionado);
    if (selecionadas.length === 0) {
      alert("Selecione pelo menos uma atividade para importar.");
      return;
    }

    setImportando(true);
    await onImportar(selecionadas, modulo, turma);
    setImportando(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-950 p-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2.5 tracking-tight">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shadow-inner">
                    📡
                  </span>{" "}
                  Radar do Classroom
                </h2>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mt-1">
                  Encontrando Novas Atividades Publicadas
                </p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
              >
                &times;
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/40 dark:bg-transparent">
              <AnimatePresence mode="wait">
                {etapa === 1 ? (
                  <motion.div
                    key="etapa1"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col max-w-lg mx-auto space-y-6"
                  >
                    <div className="text-center space-y-2 mb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 text-2xl">
                        🔍
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Qual turma você quer escanear?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Selecione a turma do Google Classroom para procurar por atividades que ainda não foram cadastradas no portal.
                      </p>
                    </div>

                    {buscandoCursos ? (
                      <div className="flex flex-col items-center py-4">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-600 animate-spin" />
                        <span className="text-xs text-slate-500 mt-2">Buscando suas turmas no Google...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <select
                            value={cursoSelecionado}
                            onChange={(e) => setCursoSelecionado(e.target.value)}
                            className="cursor-pointer w-full p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold shadow-sm"
                          >
                            <option value="">Selecione uma turma do Google Classroom...</option>
                            {cursos.map((c) => (
                              <option key={c.id} value={c.id}>{c.nome} {c.section ? `(${c.section})` : ""}</option>
                            ))}
                          </select>
                        </div>

                        {erroBuscar && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
                            {erroBuscar}
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={buscarRadar}
                          disabled={!cursoSelecionado || buscando}
                          className="w-full cursor-pointer px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {buscando ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Escaneando Classroom...</>
                          ) : (
                            "Iniciar Escaneamento"
                          )}
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="etapa2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="space-y-2 text-left">
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Módulo da Matriz (Curso) *
                        </label>
                        <select
                          value={modulo}
                          onChange={(e) => setModulo(e.target.value)}
                          className="cursor-pointer w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold"
                        >
                          <option value="">Selecione o Módulo...</option>
                          {modulosCadastrados.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Turma Alvo no Portal *
                        </label>
                        <select
                          value={turma}
                          onChange={(e) => setTurma(e.target.value)}
                          className="cursor-pointer w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold"
                        >
                          <option value="Todas">Todas as Turmas (Padrão)</option>
                          {turmasDisponiveis.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-500/5 dark:bg-blue-955/10 border border-blue-500/20 dark:border-blue-900/30 p-4.5 rounded-3xl flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-black text-blue-900 dark:text-blue-400 text-sm uppercase tracking-wider">
                          Revisão das Atividades
                        </h3>
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mt-1">
                          Encontramos {atividades.length} atividade(s) não mapeada(s) nesta turma.
                        </p>
                      </div>
                      <div className="text-center bg-white/70 dark:bg-slate-950/60 px-5 py-2.5 rounded-2xl border border-blue-500/20 dark:border-blue-900/30 shadow-sm">
                        <span className="text-blue-600 dark:text-blue-450 font-display font-black text-2xl font-mono">
                          {atividades.filter((a) => a.selecionado).length}
                        </span>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">A Importar</p>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                      {atividades.length === 0 && (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400 font-bold">
                          🎉 Nenhuma atividade nova! Tudo já está mapeado para esta turma.
                        </div>
                      )}
                      
                      {atividades.map((ativ) => (
                        <div
                          key={ativ.idTemp}
                          className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                            ativ.selecionado
                              ? "bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-650 shadow-md"
                              : "bg-slate-50/40 dark:bg-slate-950/15 border-slate-200/50 dark:border-slate-800 opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={ativ.selecionado}
                              onChange={() => toggleSelecao(ativ.idTemp)}
                              className="cursor-pointer mt-1 w-5 h-5 text-blue-600 rounded shrink-0 border-slate-300 dark:border-slate-700"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                                {ativ.titulo}
                              </p>
                              {ativ.dataLimite && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Data Limite: {ativ.dataLimite}</p>
                              )}
                            </div>
                          </div>
                          
                          {ativ.selecionado && (
                            <div className="flex flex-col gap-3 ml-9 mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[120px]">
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo</label>
                                  <select 
                                    value={ativ.tipo}
                                    onChange={(e) => atualizarAtividade(ativ.idTemp, 'tipo', e.target.value)}
                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                                  >
                                    <option value="Material">Material</option>
                                    <option value="Quiz">Desafio (Quiz)</option>
                                    <option value="Projeto">Projeto Prático</option>
                                  </select>
                                </div>
                                <div className="w-24">
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">XP</label>
                                  <input 
                                    type="number"
                                    value={ativ.xp}
                                    onChange={(e) => atualizarAtividade(ativ.idTemp, 'xp', parseInt(e.target.value) || 0)}
                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none text-center font-bold"
                                  />
                                </div>
                              </div>
                              
                              {/* ─── CAMPOS ESPECÍFICOS PARA PROJETO ─── */}
                              <AnimatePresence>
                                {ativ.tipo === "Projeto" && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-col gap-3 pt-3 mt-1 border-t border-slate-200 dark:border-slate-700/50"
                                  >
                                    <div className="flex-1">
                                      <label className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">
                                        Link do Template Base (CodePen / Replit)
                                      </label>
                                      <input 
                                        type="url"
                                        placeholder="Opcional. Ex: https://codepen.io/..."
                                        value={ativ.opcaoA || ""}
                                        onChange={(e) => atualizarAtividade(ativ.idTemp, 'opcaoA', e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-950 outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-3">
                                      <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">
                                          Resolução (Código a ser digitado)
                                        </label>
                                        <textarea 
                                          rows={3}
                                          placeholder="Cole aqui o gabarito que o aluno deverá digitar..."
                                          value={ativ.resolucaoTyping || ""}
                                          onChange={(e) => atualizarAtividade(ativ.idTemp, 'resolucaoTyping', e.target.value)}
                                          className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500 custom-scrollbar"
                                        />
                                      </div>
                                      <div className="w-full md:w-32 shrink-0">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">
                                          Tempo (Min)
                                        </label>
                                        <input 
                                          type="number"
                                          placeholder="Ex: 15"
                                          value={ativ.limiteTempoTyping || ""}
                                          onChange={(e) => atualizarAtividade(ativ.idTemp, 'limiteTempoTyping', parseInt(e.target.value) || 0)}
                                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none text-center"
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 bg-white/50 dark:bg-transparent border-t border-slate-200/80 dark:border-slate-800/80 flex justify-between gap-3 shrink-0">
              <div>
                {etapa === 2 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setEtapa(1)}
                    className="cursor-pointer px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    ← Voltar
                  </motion.button>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onClose}
                  className="cursor-pointer px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </motion.button>
                {etapa === 2 && atividades.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={confirmarImportacao}
                    disabled={importando}
                    className="cursor-pointer px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black shadow-lg shadow-blue-500/10 text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {importando ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Importando...</>
                    ) : (
                      "Salvar Importação"
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}