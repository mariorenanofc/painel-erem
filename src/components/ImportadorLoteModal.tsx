"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  estadoClassroom?: string;
  creationTime?: string;
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
  estadoClassroom?: string;
  statusPublicacao?: string;
  creationTime?: string;
  aulaNumero?: number;
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

const extrairNumeroAula = (titulo: string): number => {
  const m = String(titulo).match(/aula\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 9999;
};

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

  // Novos controles de organização e filtragem para listas grandes
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "PUBLISHED" | "DRAFT">("TODOS");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [ordenacao, setOrdenacao] = useState<"aula_asc" | "aula_desc" | "recentes">("aula_asc");
  const [modoCompacto, setModoCompacto] = useState(true);
  const [idExpandido, setIdExpandido] = useState<string | null>(null);

  // Zera estados e busca cursos quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setModulo("");
      setTurma("Todas");
      setCursoSelecionado("");
      setAtividades([]);
      setEtapa(1);
      setErroBuscar("");
      setFiltroEstado("TODOS");
      setBuscaTexto("");
      setOrdenacao("aula_asc");
      setModoCompacto(true);
      setIdExpandido(null);
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
    } catch {
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
        body: JSON.stringify({ courseId: cursoSelecionado }),
      });
      const data = await res.json();

      if (data.status === "sucesso") {
        const parseadas: AtividadeParseada[] = data.atividades.map((ativ: AtividadeRadar) => {
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

          const isDraft = ativ.estadoClassroom === "DRAFT";
          return {
            idTemp: ativ.idClassroom,
            titulo: ativ.titulo,
            tipo: tipoPortal,
            xp: xp,
            // Por segurança, pré-seleciona apenas as Publicadas; Rascunhos vêm desmarcados até o tutor escolher!
            selecionado: !isDraft,
            linkClassroom: ativ.linkClassroom,
            dataLimite: ativ.dataLimite,
            descricao: ativ.descricao,
            opcaoA: "",
            resolucaoTyping: "",
            limiteTempoTyping: 0,
            estadoClassroom: ativ.estadoClassroom || "PUBLISHED",
            statusPublicacao: isDraft ? "Rascunho" : "Publicada",
            creationTime: ativ.creationTime || "",
            aulaNumero: extrairNumeroAula(ativ.titulo),
          };
        });
        setAtividades(parseadas);
        // Se só houver rascunhos, foca na aba TODOS; se houver publicadas, mostra todas organizadas
        setEtapa(2);
      } else {
        setErroBuscar(data.mensagem || "Erro desconhecido ao buscar radar.");
      }
    } catch (error: unknown) {
      const err = error as Error;
      setErroBuscar(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setBuscando(false);
    }
  };

  const contadores = useMemo(() => {
    const total = atividades.length;
    const publicadas = atividades.filter((a) => a.estadoClassroom !== "DRAFT").length;
    const rascunhos = atividades.filter((a) => a.estadoClassroom === "DRAFT").length;
    const selecionadas = atividades.filter((a) => a.selecionado).length;
    return { total, publicadas, rascunhos, selecionadas };
  }, [atividades]);

  const atividadesFiltradas = useMemo(() => {
    let lista = [...atividades];

    if (filtroEstado === "PUBLISHED") {
      lista = lista.filter((a) => a.estadoClassroom !== "DRAFT");
    } else if (filtroEstado === "DRAFT") {
      lista = lista.filter((a) => a.estadoClassroom === "DRAFT");
    }

    if (buscaTexto.trim()) {
      const termo = buscaTexto.toLowerCase().trim();
      lista = lista.filter((a) => a.titulo.toLowerCase().includes(termo));
    }

    lista.sort((a, b) => {
      if (ordenacao === "aula_asc") {
        const diff = (a.aulaNumero ?? 9999) - (b.aulaNumero ?? 9999);
        if (diff !== 0) return diff;
        return a.titulo.localeCompare(b.titulo, "pt-BR", { numeric: true });
      }
      if (ordenacao === "aula_desc") {
        const diff = (b.aulaNumero ?? 0) - (a.aulaNumero ?? 0);
        if (diff !== 0) return diff;
        return b.titulo.localeCompare(a.titulo, "pt-BR", { numeric: true });
      }
      return new Date(b.creationTime || 0).getTime() - new Date(a.creationTime || 0).getTime();
    });

    return lista;
  }, [atividades, filtroEstado, buscaTexto, ordenacao]);

  const toggleSelecao = (idTemp: string) => {
    setAtividades((prev) =>
      prev.map((a) =>
        a.idTemp === idTemp ? { ...a, selecionado: !a.selecionado } : a,
      ),
    );
  };

  const selecionarVisiveis = (marcar: boolean) => {
    const idsVisiveis = new Set(atividadesFiltradas.map((a) => a.idTemp));
    setAtividades((prev) =>
      prev.map((a) => (idsVisiveis.has(a.idTemp) ? { ...a, selecionado: marcar } : a)),
    );
  };

  const atualizarAtividade = (idTemp: string, campo: string, valor: string | number | boolean) => {
    setAtividades((prev) =>
      prev.map((a) => (a.idTemp === idTemp ? { ...a, [campo]: valor } : a)),
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
            className={`glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-slate-200/80 dark:border-white/5 w-full overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${etapa === 2 ? "max-w-[95vw] h-[95vh]" : "max-w-4xl max-h-[90vh]"}`}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            <div className="bg-linear-to-r from-blue-600 via-indigo-700 to-indigo-950 p-5 md:p-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
              <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2.5 tracking-tight">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shadow-inner">
                    📡
                  </span>{" "}
                  Radar do Classroom
                </h2>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mt-1">
                  Escaneando Atividades Publicadas e Rascunhos do Curso
                </p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
              >
                &times;
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white/40 dark:bg-transparent">
              <AnimatePresence mode="wait">
                {etapa === 1 ? (
                  <motion.div
                    key="etapa1"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col max-w-lg mx-auto space-y-6 py-4"
                  >
                    <div className="text-center space-y-2 mb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 text-2xl">
                        🔍
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                        Qual turma você quer escanear?
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Selecione a turma do Google Classroom para procurar por atividades (publicadas ou em rascunho) que ainda não foram cadastradas no portal.
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
                              <option key={c.id} value={c.id}>
                                {c.nome} {c.section ? `(${c.section})` : ""}
                              </option>
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
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                              Escaneando Classroom...
                            </>
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
                    className="flex flex-col lg:flex-row gap-5 h-full"
                  >
                    {/* Left Sidebar */}
                    <div className="w-full lg:w-[28%] xl:w-[25%] flex flex-col gap-4 shrink-0">
                      <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-1.5 text-left">
                          <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Módulo da Matriz (Curso) *
                          </label>
                          <select
                            value={modulo}
                            onChange={(e) => setModulo(e.target.value)}
                            className="cursor-pointer w-full p-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold shadow-sm"
                          >
                            <option value="">Selecione o Módulo...</option>
                            {modulosCadastrados.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Turma Alvo no Portal *
                          </label>
                          <select
                            value={turma}
                            onChange={(e) => setTurma(e.target.value)}
                            className="cursor-pointer w-full p-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold shadow-sm"
                          >
                            <option value="Todas">Todas as Turmas (Padrão)</option>
                            {turmasDisponiveis.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="bg-blue-500/5 dark:bg-blue-955/10 border border-blue-500/20 dark:border-blue-900/30 p-4 rounded-3xl flex flex-col justify-between items-center text-center gap-3">
                        <div>
                          <h3 className="font-display font-black text-blue-900 dark:text-blue-400 text-xs uppercase tracking-wider">
                            Resumo do Escaneamento
                          </h3>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                            {contadores.publicadas} Publicada(s) • {contadores.rascunhos} Rascunho(s)
                          </p>
                        </div>
                        <div className="w-full text-center bg-white/70 dark:bg-slate-950/60 px-4 py-3 rounded-2xl border border-blue-500/20 dark:border-blue-900/30 shadow-sm">
                          <span className="text-blue-600 dark:text-blue-400 font-display font-black text-3xl font-mono">
                            {contadores.selecionadas}
                          </span>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                            Selecionadas p/ Importar
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          💡 <strong>Dica:</strong> Rascunhos vêm desmarcados por padrão para evitar importação acidental. Use a busca ou as abas ao lado para marcar apenas as aulas desejadas.
                        </p>
                      </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="w-full lg:w-[72%] xl:w-[75%] flex flex-col min-h-[45vh] bg-white/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 overflow-hidden relative">
                      {/* Barra de Ferramentas de Filtragem, Busca e Seleção em Massa */}
                      <div className="flex flex-col gap-2.5 pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {/* Abas de Status */}
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setFiltroEstado("TODOS")}
                              className={`cursor-pointer px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                                filtroEstado === "TODOS"
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              Todas ({contadores.total})
                            </button>
                            <button
                              type="button"
                              onClick={() => setFiltroEstado("PUBLISHED")}
                              className={`cursor-pointer px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                                filtroEstado === "PUBLISHED"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              ✅ Publicadas ({contadores.publicadas})
                            </button>
                            <button
                              type="button"
                              onClick={() => setFiltroEstado("DRAFT")}
                              className={`cursor-pointer px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                                filtroEstado === "DRAFT"
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              📝 Rascunhos ({contadores.rascunhos})
                            </button>
                          </div>

                          {/* Botões de Ação em Massa na Lista Filtrada */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => selecionarVisiveis(true)}
                              className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              ☑️ Marcar Visíveis ({atividadesFiltradas.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => selecionarVisiveis(false)}
                              className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              ⬜ Desmarcar Visíveis
                            </button>
                            <button
                              type="button"
                              onClick={() => setModoCompacto((v) => !v)}
                              className={`cursor-pointer px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                modoCompacto
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                              title="Alternar entre lista compacta e cartões detalhados"
                            >
                              {modoCompacto ? "📐 Visão Compacta" : "🗂️ Visão Expandida"}
                            </button>
                          </div>
                        </div>

                        {/* Busca por Texto + Ordenação */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={buscaTexto}
                              onChange={(e) => setBuscaTexto(e.target.value)}
                              placeholder="🔎 Filtrar por nome ou número da aula (ex: Aula 39, Desafio, Projeto)..."
                              className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                            />
                            {buscaTexto && (
                              <button
                                type="button"
                                onClick={() => setBuscaTexto("")}
                                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                          <select
                            value={ordenacao}
                            onChange={(e) =>
                              setOrdenacao(e.target.value as "aula_asc" | "aula_desc" | "recentes")
                            }
                            className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                          >
                            <option value="aula_asc">🔢 Ordem: Aula 1 → 99</option>
                            <option value="aula_desc">🔢 Ordem: Aula 99 → 1</option>
                            <option value="recentes">🕒 Mais Recentes no AVA</option>
                          </select>
                        </div>
                      </div>

                      {/* Lista de Atividades */}
                      <div className="overflow-y-auto custom-scrollbar pr-1 flex-1 space-y-2">
                        {atividadesFiltradas.length === 0 && (
                          <div className="text-center py-10 text-slate-500 dark:text-slate-400 font-bold text-sm">
                            Nenhuma atividade encontrada para este filtro.
                          </div>
                        )}

                        {atividadesFiltradas.map((ativ) => {
                          const mostrarDetalhes =
                            ativ.selecionado && (!modoCompacto || idExpandido === ativ.idTemp || ativ.tipo === "Projeto");

                          return (
                            <div
                              key={ativ.idTemp}
                              className={`flex flex-col rounded-2xl border transition-all duration-200 ${
                                ativ.selecionado
                                  ? "bg-white dark:bg-slate-800/90 border-blue-400 dark:border-blue-600 shadow-sm"
                                  : "bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/60 dark:border-slate-800/80 opacity-75 hover:opacity-100"
                              } ${modoCompacto ? "p-3" : "p-4"}`}
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={ativ.selecionado}
                                  onChange={() => toggleSelecao(ativ.idTemp)}
                                  className="cursor-pointer w-4 h-4 text-blue-600 rounded shrink-0 border-slate-300 dark:border-slate-700"
                                />

                                <div
                                  onClick={() => toggleSelecao(ativ.idTemp)}
                                  className="flex-1 min-w-[200px] cursor-pointer"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm leading-snug">
                                      {ativ.titulo}
                                    </p>
                                    {ativ.estadoClassroom === "DRAFT" ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
                                        📝 Rascunho AVA
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50">
                                        ✅ Publicada AVA
                                      </span>
                                    )}
                                    {ativ.dataLimite && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                        • Limite: {ativ.dataLimite}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Controles Inline Rápidos quando selecionada */}
                                {ativ.selecionado && (
                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <select
                                      value={ativ.tipo}
                                      onChange={(e) => atualizarAtividade(ativ.idTemp, "tipo", e.target.value)}
                                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                                      title="Tipo de Missão"
                                    >
                                      <option value="Material">📘 Material</option>
                                      <option value="Quiz">⚡ Desafio (Quiz)</option>
                                      <option value="Projeto">💻 Projeto Prático</option>
                                    </select>

                                    <select
                                      value={ativ.statusPublicacao || "Publicada"}
                                      onChange={(e) =>
                                        atualizarAtividade(ativ.idTemp, "statusPublicacao", e.target.value)
                                      }
                                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                                      title="Status no Portal"
                                    >
                                      <option value="Publicada">🚀 Publicar no Portal</option>
                                      <option value="Rascunho">📝 Salvar Rascunho</option>
                                    </select>

                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase">XP</span>
                                      <input
                                        type="number"
                                        value={ativ.xp}
                                        onChange={(e) =>
                                          atualizarAtividade(ativ.idTemp, "xp", parseInt(e.target.value) || 0)
                                        }
                                        className="w-12 text-xs bg-transparent outline-none text-center font-black text-blue-600 dark:text-blue-400"
                                      />
                                    </div>

                                    {ativ.tipo === "Projeto" && modoCompacto && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setIdExpandido(idExpandido === ativ.idTemp ? null : ativ.idTemp)
                                        }
                                        className="cursor-pointer px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase"
                                      >
                                        {idExpandido === ativ.idTemp ? "▲ Ocultar Código" : "⚙️ Config. Typing"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Campos extras de Projeto (CodingPractice / Template) */}
                              <AnimatePresence>
                                {mostrarDetalhes && ativ.tipo === "Projeto" && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-col gap-3 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700/50 ml-7"
                                  >
                                    <div className="flex-1">
                                      <label className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">
                                        Link do Template Base (CodePen / Replit)
                                      </label>
                                      <input
                                        type="url"
                                        placeholder="Opcional. Ex: https://codepen.io/..."
                                        value={ativ.opcaoA || ""}
                                        onChange={(e) =>
                                          atualizarAtividade(ativ.idTemp, "opcaoA", e.target.value)
                                        }
                                        className="w-full text-xs p-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-950 outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-3">
                                      <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">
                                          Resolução (Código a ser digitado no CodingPractice)
                                        </label>
                                        <textarea
                                          rows={2}
                                          placeholder="Cole aqui o gabarito que o aluno deverá digitar (ou edite depois no painel)..."
                                          value={ativ.resolucaoTyping || ""}
                                          onChange={(e) =>
                                            atualizarAtividade(ativ.idTemp, "resolucaoTyping", e.target.value)
                                          }
                                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500 custom-scrollbar"
                                        />
                                      </div>
                                      <div className="w-full md:w-28 shrink-0">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">
                                          Tempo (Min)
                                        </label>
                                        <input
                                          type="number"
                                          placeholder="Ex: 15"
                                          value={ativ.limiteTempoTyping || ""}
                                          onChange={(e) =>
                                            atualizarAtividade(
                                              ativ.idTemp,
                                              "limiteTempoTyping",
                                              parseInt(e.target.value) || 0,
                                            )
                                          }
                                          className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none text-center"
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 md:p-5 bg-white/50 dark:bg-transparent border-t border-slate-200/80 dark:border-slate-800/80 flex justify-between gap-3 shrink-0">
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
                    disabled={importando || contadores.selecionadas === 0}
                    className="cursor-pointer px-8 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black shadow-lg shadow-blue-500/10 text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {importando ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                        Importando ({contadores.selecionadas})...
                      </>
                    ) : (
                      `Salvar Importação (${contadores.selecionadas})`
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
