/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TABELA_XP_PADRAO = {
  Material: 10,
  Quiz: 50,
  Projeto: 100,
};

interface AtividadeParseada {
  idTemp: string;
  titulo: string;
  tipo: string;
  xp: number;
  isRascunho: boolean;
  selecionado: boolean;
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
  const [textoBruto, setTextoBruto] = useState("");
  const [modulo, setModulo] = useState("");
  const [turma, setTurma] = useState("Todas");
  const [atividades, setAtividades] = useState<AtividadeParseada[]>([]);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [importando, setImportando] = useState(false);

  const analisarTexto = () => {
    if (!modulo) {
      alert("Por favor, selecione o Módulo (Matriz) primeiro!");
      return;
    }

    const linhas = textoBruto
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const encontradas: AtividadeParseada[] = [];

    // Tentar auto-detectar a Turma baseada no texto colado
    const textoCompleto = textoBruto.toUpperCase();
    for (const t of turmasDisponiveis) {
      if (textoCompleto.includes(t.toUpperCase())) {
        setTurma(t);
        break;
      }
    }

    // Loop de Leitura do Texto
    for (let index = 0; index < linhas.length; index++) {
      const linha = linhas[index];

      // Padrão de entrada do Classroom: "Aula 01 - Apresentação (Assunto...)"
      // Aceita: "Aula 1", "Aula 01", "Aula 10", etc.
      const matchAula = linha.match(/^Aula\s*(\d+)\s*-\s*(.*)/i);
      if (matchAula) {
        const numAula = matchAula[1].length === 1 ? `0${matchAula[1]}` : matchAula[1];
        const resto = matchAula[2].trim();

        // Detecta se a linha de baixo é "Rascunho"
        const proximaLinha = linhas[index + 1] ? linhas[index + 1].trim() : "";
        const isRascunho = proximaLinha.toLowerCase() === "rascunho";

        // Mapeamento de tipo e assunto do Classroom
        // Ex: "Desafio 1.1 (Primeiros Passos)" ou "Apresentação (O que é JS?)"
        const matchDetalhes = resto.match(/^(Desafio|Mini Projeto|Material de Apoio|Apresentação|Broadcast|Feedback)\s*([\d.]+)?\s*\((.*)\)/i);

        let tipoOriginal = "Material";
        let assunto = resto;

        if (matchDetalhes) {
          tipoOriginal = matchDetalhes[1].trim();
          assunto = matchDetalhes[3].trim();
        }

        // Traduz para as nomenclaturas do painel-erem
        let tipoPortal = "Material";
        let xp = TABELA_XP_PADRAO.Material;
        let nomeFormatado = tipoOriginal;

        const nomeLower = tipoOriginal.toLowerCase();
        if (nomeLower.includes("desafio")) {
          tipoPortal = "Quiz";
          xp = TABELA_XP_PADRAO.Quiz;
          nomeFormatado = "Desafio 1"; // Mantém no padrão simplificado se necessário
        } else if (nomeLower.includes("projeto")) {
          tipoPortal = "Projeto";
          xp = TABELA_XP_PADRAO.Projeto;
          nomeFormatado = "Mini projeto";
        } else {
          tipoPortal = "Material";
          xp = TABELA_XP_PADRAO.Material;

          if (nomeLower.includes("apoio"))
            nomeFormatado = "Materiais de Apoio";
          else if (nomeLower.includes("feedback"))
            nomeFormatado = "Feedback da Aula";
          else if (nomeLower.includes("broadcast"))
            nomeFormatado = "Broadcast";
          else if (
            nomeLower.includes("apresentação") ||
            nomeLower.includes("apresentacao")
          )
            nomeFormatado = "Apresentação";
        }

        const tituloFinal = `[Aula ${numAula}] ${nomeFormatado} (${assunto})`;

        encontradas.push({
          idTemp: Math.random().toString(36).substring(7),
          titulo: tituloFinal,
          tipo: tipoPortal,
          xp: xp,
          isRascunho,
          selecionado: isRascunho,
        });
      }
    }

    if (encontradas.length === 0) {
      alert(
        "Nenhuma atividade no padrão do Classroom foi encontrada. Tem a certeza que copiou corretamente?",
      );
      return;
    }

    setAtividades(encontradas);
    setEtapa(2);
  };

  const toggleSelecao = (idTemp: string) => {
    setAtividades((prev) =>
      prev.map((a) =>
        a.idTemp === idTemp ? { ...a, selecionado: !a.selecionado } : a,
      ),
    );
  };

  const confirmarImportacao = async () => {
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
            className="glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
          >
            {/* Glow decorativo de fundo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-950 p-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2.5 tracking-tight">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shadow-inner">
                    ⚡
                  </span>{" "}
                  Automação de Rascunhos (Classroom)
                </h2>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mt-1">
                  Importador Inteligente em Lote
                </p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
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
                    className="space-y-6"
                  >
                    {/* Bento Row 1: Turma e Módulo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-left">
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Módulo da Matriz (Curso)
                        </label>
                        <div className="relative">
                          <select
                            value={modulo}
                            onChange={(e) => setModulo(e.target.value)}
                            className="cursor-pointer w-full p-3.5 pr-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm appearance-none shadow-sm font-bold"
                          >
                            <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Selecione o Módulo...</option>
                            {modulosCadastrados.map((m) => (
                              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                                {m}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                            ▼
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Turma Alvo
                        </label>
                        <div className="relative">
                          <select
                            value={turma}
                            onChange={(e) => setTurma(e.target.value)}
                            className="cursor-pointer w-full p-3.5 pr-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm appearance-none shadow-sm font-bold"
                          >
                            <option value="Todas" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todas as Turmas</option>
                            {turmasDisponiveis.map((t) => (
                              <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                                {t}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                            ▼
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bento Row 2: Textarea input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Cole o texto cru do Google Classroom aqui:
                        </label>
                        <span className="text-[10px] text-blue-650 dark:text-blue-400 font-black bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-xl shadow-sm">
                          💡 CTRL+A, CTRL+C na aba &ldquo;Atividades&rdquo;
                        </span>
                      </div>
                      <textarea
                        rows={8}
                        value={textoBruto}
                        onChange={(e) => setTextoBruto(e.target.value)}
                        placeholder="Exemplo:&#10;Aula 01 - Apresentação (História do JS)&#10;Rascunho&#10;Aula 01 - Desafio 1.1 (História do JS)"
                        className="w-full p-4.5 font-mono text-xs border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 rounded-2xl outline-none focus:border-blue-500 resize-none transition-all shadow-inner leading-relaxed"
                      />
                    </div>

                    {/* Analisar Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={analisarTexto}
                      className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 select-none"
                    >
                      🤖 Analisar e Formatar Textos
                  </motion.button>
                  </motion.div>
                ) : (
                  /* ETAPA 2: REVISÃO DE ESTRUTURA */
                  <motion.div
                    key="etapa2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="bg-blue-500/5 dark:bg-blue-955/10 border border-blue-500/20 dark:border-blue-900/30 p-4.5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                      <div>
                        <h3 className="font-display font-black text-blue-900 dark:text-blue-400 text-sm uppercase tracking-wider">
                          Revisão de Estrutura
                        </h3>
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mt-1">
                          Verifique se os títulos estão no padrão <strong>[Aula XX] Tipo (Assunto)</strong>. O sistema selecionou apenas as atividades identificadas como rascunho por padrão.
                        </p>
                      </div>
                      <div className="text-center bg-white/70 dark:bg-slate-950/60 px-5 py-2.5 rounded-2xl border border-blue-500/20 dark:border-blue-900/30 shadow-sm shrink-0 min-w-[100px]">
                        <span className="text-blue-600 dark:text-blue-450 font-display font-black text-2xl font-mono">
                          {atividades.filter((a) => a.selecionado).length}
                        </span>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          A Importar
                        </p>
                      </div>
                    </div>

                    {/* Grid list de atividades parseadas */}
                    <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-2 custom-scrollbar">
                      {atividades.map((ativ) => (
                        <label
                          key={ativ.idTemp}
                          className={`flex items-start gap-4 p-4.5 rounded-2xl border cursor-pointer transition-all duration-355 shadow-sm hover:translate-x-0.5 ${
                            ativ.selecionado
                              ? "bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-650 shadow-md"
                              : "bg-slate-50/40 dark:bg-slate-950/15 border-slate-200/50 dark:border-slate-800 opacity-60 hover:opacity-85"
                          }`}
                        >
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
                            <div className="flex flex-wrap gap-2 mt-2.5">
                              <span className="text-[9px] font-black tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-lg uppercase border border-slate-200 dark:border-slate-800 transition-colors">
                                {ativ.tipo}
                              </span>
                              <span className="text-[9px] font-black tracking-widest bg-emerald-100/90 dark:bg-emerald-955/35 text-emerald-700 dark:text-emerald-450 px-2.5 py-0.5 rounded-lg uppercase border border-emerald-250/30 dark:border-emerald-900/10 transition-colors">
                                ⭐ {ativ.xp} XP
                              </span>
                              {!ativ.isRascunho && (
                                <span className="text-[9px] font-black tracking-widest bg-amber-100/90 dark:bg-amber-955/35 text-amber-700 dark:text-amber-450 px-2.5 py-0.5 rounded-lg uppercase border border-amber-250/30 dark:border-amber-900/10 transition-colors">
                                  Já Postada
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-5 bg-white/50 dark:bg-transparent border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap gap-3 justify-between shrink-0">
              <div>
                {etapa === 2 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEtapa(1)}
                    className="cursor-pointer px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none"
                  >
                    ← Voltar e Editar
                  </motion.button>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onClose}
                  className="cursor-pointer px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none"
                >
                  Fechar
                </motion.button>
                {etapa === 2 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={confirmarImportacao}
                    disabled={importando}
                    className="cursor-pointer px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black shadow-lg shadow-blue-500/10 text-xs uppercase tracking-wider transition-all select-none disabled:opacity-50"
                  >
                    {importando ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Importando...
                      </div>
                    ) : (
                      "Confirmar Importação"
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