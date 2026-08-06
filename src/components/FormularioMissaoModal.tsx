/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormularioMissaoModalProps {
  idEditando: string | null;
  titulo: string;
  setTitulo: (val: string) => void;
  descricao: string;
  setDescricao: (val: string) => void;
  dataLimite: string;
  setDataLimite: (val: string) => void;
  xp: string;
  setXp: (val: string) => void;
  turmaAlvo: string;
  setTurmaAlvo: (val: string) => void;
  tipo: string;
  setTipo: (val: string) => void;
  opcaoA: string;
  setOpcaoA: (val: string) => void;
  opcaoB: string;
  setOpcaoB: (val: string) => void;
  opcaoC: string;
  setOpcaoC: (val: string) => void;
  opcaoD: string;
  setOpcaoD: (val: string) => void;
  respostaCorreta: string;
  setRespostaCorreta: (val: string) => void;
  linkClassroom: string;
  setLinkClassroom: (val: string) => void;
  imagemUrl: string;
  setImagemUrl: (val: string) => void;
  modulo: string;
  setModulo: (val: string) => void;
  gabarito: string;
  setGabarito: (val: string) => void;
  gabaritoLiberado: boolean;
  setGabaritoLiberado: (val: boolean) => void;
  resolucaoTyping: string;
  setResolucaoTyping: (val: string) => void;
  limiteTempoTyping: number;
  setLimiteTempoTyping: (val: number) => void;
  modulosCadastrados: string[];
  turmasDisponiveis: string[];
  salvando: boolean;
  limparFormulario: () => void;
  salvarNovaAtividade: (e: React.MouseEvent, statusAcao: string) => void;
}

export default function FormularioMissaoModal({
  idEditando,
  titulo,
  setTitulo,
  descricao,
  setDescricao,
  dataLimite,
  setDataLimite,
  xp,
  setXp,
  turmaAlvo,
  setTurmaAlvo,
  tipo,
  setTipo,
  opcaoA,
  setOpcaoA,
  opcaoB,
  setOpcaoB,
  opcaoC,
  setOpcaoC,
  opcaoD,
  setOpcaoD,
  respostaCorreta,
  setRespostaCorreta,
  linkClassroom,
  setLinkClassroom,
  imagemUrl,
  setImagemUrl,
  modulo,
  setModulo,
  gabarito,
  setGabarito,
  gabaritoLiberado,
  setGabaritoLiberado,
  resolucaoTyping,
  setResolucaoTyping,
  limiteTempoTyping,
  setLimiteTempoTyping,
  modulosCadastrados,
  turmasDisponiveis,
  salvando,
  limparFormulario,
  salvarNovaAtividade,
}: FormularioMissaoModalProps) {
  React.useEffect(() => {
    if (!dataLimite) {
      const hoje = new Date();
      const yyyy = hoje.getFullYear();
      const mm = String(hoje.getMonth() + 1).padStart(2, "0");
      const dd = String(hoje.getDate()).padStart(2, "0");
      setDataLimite(`${yyyy}-${mm}-${dd}`);
    }
  }, [dataLimite, setDataLimite]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={limparFormulario}
          className="absolute inset-0 bg-slate-955/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className={`glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] border border-slate-200/80 dark:border-white/5 w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${
            idEditando 
              ? "shadow-[0_0_50px_rgba(245,158,11,0.15)]" 
              : "shadow-[0_0_50px_rgba(59,130,246,0.15)]"
          }`}
        >
          {/* Glow decorativo de fundo */}
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none ${
            idEditando ? "bg-amber-500/10 dark:bg-amber-500/5" : "bg-blue-500/10 dark:bg-blue-500/5"
          }`} />

          {/* Header */}
          <div className={`p-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5 ${
            idEditando 
              ? "bg-gradient-to-r from-amber-550 via-orange-550 to-amber-700" 
              : "bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-955"
          }`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2.5 tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shadow-inner">
                  📝
                </span>{" "}
                {idEditando ? `Editando Missão: ${idEditando}` : "Criar Nova Missão"}
              </h2>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mt-1">
                Formulário da Matriz e Atividades
              </p>
            </div>
            <button
              onClick={limparFormulario}
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm border-none"
            >
              &times;
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 md:p-7 overflow-y-auto custom-scrollbar flex-1 bg-white/40 dark:bg-transparent">
            <form className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 align-start">
              
              {/* COLUNA ESQUERDA: Informações de Conteúdo (Lg: col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Bento Row 2: Título com etiquetas dinâmicas */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Título da Missão & Aula
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors shadow-sm shrink-0">
                      <span className="bg-slate-100/80 dark:bg-slate-800 px-3 py-2.5 text-xs font-black text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        AULA Nº
                      </span>
                      <input
                        type="number"
                        placeholder="Ex: 1"
                        className="w-16 p-2 text-sm font-black text-blue-650 dark:text-blue-400 bg-transparent outline-none text-center border-none"
                        onBlur={(e) => {
                          const num = e.target.value;
                          if (!num) return;
                          const formatado = num.length === 1 ? `0${num}` : num;
                          const prefixo = `[Aula ${formatado}] `;
                          const tituloLimpo = titulo.replace(/^\[Aula \d+\]\s*/, "");
                          setTitulo(prefixo + tituloLimpo);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    <div className="relative">
                      <select
                        className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pr-10 text-xs font-black text-slate-600 dark:text-slate-300 outline-none shrink-0 appearance-none shadow-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            const tipoEtiq = `${e.target.value} - `;
                            const matchAula = titulo.match(/^(\[Aula \d+\]\s*)(.*)/);
                            if (matchAula) {
                              setTitulo(
                                `${matchAula[1]}${tipoEtiq}${matchAula[2].replace(/^(Desafio|Mini Projeto|Material de Apoio|Apresentação) - /, "")}`,
                              );
                            } else {
                              setTitulo(
                                `${tipoEtiq}${titulo.replace(/^(Desafio|Mini Projeto|Material de Apoio|Apresentação) - /, "")}`,
                              );
                            }
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">+ Adicionar Tipo</option>
                        <option value="Apresentação" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Apresentação</option>
                        <option value="Broadcast" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Broadcast</option>
                        <option value="Desafio_1" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Desafio 1</option>
                        <option value="Desafio_2" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Desafio 2</option>
                        <option value="Desafio_3" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Desafio 3</option>
                        <option value="feedback" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Feedback</option>
                        <option value="Mini Projeto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Mini Projeto</option>
                        <option value="Material de Apoio" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Material de Apoio</option>
                        <option value="outros" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Outros</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: [Aula 01] Desafio - Variáveis e Tipos"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-sm shadow-sm"
                  />
                </div>

                {/* Descrição / Instruções */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Instruções Detalhadas da Missão
                  </label>
                  <textarea
                    rows={6}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva detalhadamente o que o aluno deve realizar..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-4 font-mono text-xs focus:border-blue-500 outline-none transition-all shadow-sm leading-relaxed"
                  />
                </div>

                {/* Bento Row 3: Gabarito e Material de Apoio (Cor Verde) */}
                <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 dark:border-emerald-900/30 p-5 rounded-3xl space-y-4">
                  <label className="block text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>🗝️</span> Gabarito / Material de Recuperação (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={gabarito}
                    onChange={(e) => setGabarito(e.target.value)}
                    placeholder="Cole o link do Colab, CodePen, ou digite as instruções de resolução."
                    className="w-full bg-white dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-900/30 text-slate-800 dark:text-slate-100 rounded-2xl p-4 font-mono text-xs focus:border-emerald-500 outline-none transition-all shadow-sm"
                  />
                  
                  <label className="flex items-center gap-3.5 p-4 bg-white/70 dark:bg-slate-950/60 border border-emerald-500/20 dark:border-emerald-900/30 rounded-2xl cursor-pointer hover:bg-white dark:hover:bg-slate-950 transition-colors shadow-sm">
                    <input
                      type="checkbox"
                      checked={gabaritoLiberado}
                      onChange={(e) => setGabaritoLiberado(e.target.checked)}
                      className="cursor-pointer w-5 h-5 text-emerald-600 focus:ring-emerald-500 rounded shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-350 transition-colors">
                      Liberar acesso ao Gabarito para os Alunos (Fica visível na Central deles)
                    </span>
                  </label>
                </div>

                {/* Bento Row 4: Se for QUIZ */}
                {tipo === "Quiz" && (
                  <div className="bg-amber-500/5 dark:bg-amber-955/10 p-5 rounded-3xl border border-amber-500/25 dark:border-amber-900/30 space-y-4 shadow-sm">
                    <h3 className="font-display font-black text-amber-800 dark:text-amber-400 text-xs uppercase tracking-wider mb-2">
                      Alternativas do Quiz
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "A", val: opcaoA, set: setOpcaoA },
                        { label: "B", val: opcaoB, set: setOpcaoB },
                        { label: "C", val: opcaoC, set: setOpcaoC },
                        { label: "D", val: opcaoD, set: setOpcaoD },
                      ].map((alt) => (
                        <div key={alt.label} className="flex gap-2 items-start">
                          <span className="font-black text-amber-600 dark:text-amber-500 mt-3.5 text-sm select-none">
                            {alt.label})
                          </span>
                          <textarea
                            rows={2}
                            value={alt.val}
                            onChange={(e) => alt.set(e.target.value)}
                            placeholder={`Texto da opção ${alt.label}`}
                            className="w-full border border-amber-500/20 dark:border-amber-900/20 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:border-amber-500 outline-none bg-white dark:bg-slate-950 shadow-sm leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-amber-500/20 dark:border-amber-900/20 flex items-center gap-4">
                      <label className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">
                        Resposta Correta:
                      </label>
                      <div className="relative">
                        <select
                          value={respostaCorreta}
                          onChange={(e) => setRespostaCorreta(e.target.value)}
                          className="cursor-pointer border border-amber-500/30 dark:border-amber-900/55 rounded-xl p-2.5 pr-8 font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950 outline-none focus:border-emerald-500 transition-all text-xs appearance-none"
                        >
                          <option value="A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Alternativa A</option>
                          <option value="B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Alternativa B</option>
                          <option value="C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Alternativa C</option>
                          <option value="D" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Alternativa D</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 font-bold text-[9px]">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* COLUNA DIREITA: Metadados, Configurações e Links (Lg: col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Tipo & Módulo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-1">
                  
                  {/* Tipo de Atividade */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                      Tipo de Missão
                    </label>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors">
                        <input
                          type="radio"
                          value="Projeto"
                          checked={tipo === "Projeto"}
                          onChange={() => setTipo("Projeto")}
                          className="cursor-pointer w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-700 rounded-full"
                        />
                        Projeto (Link)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors">
                        <input
                          type="radio"
                          value="Quiz"
                          checked={tipo === "Quiz"}
                          onChange={() => setTipo("Quiz")}
                          className="cursor-pointer w-5 h-5 text-amber-500 border-slate-300 dark:border-slate-700 rounded-full"
                        />
                        Quiz (Escolha)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-colors">
                        <input
                          type="radio"
                          value="Material"
                          checked={tipo === "Material"}
                          onChange={() => setTipo("Material")}
                          className="cursor-pointer w-5 h-5 text-emerald-500 border-slate-300 dark:border-slate-700 rounded-full"
                        />
                        Material (Apoio)
                      </label>
                    </div>
                  </div>

                  {/* Seleção do Módulo */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span>🗂️</span> Módulo da Matriz
                    </label>
                    {modulosCadastrados.length > 0 ? (
                      <div className="relative">
                        <select
                          value={modulo}
                          onChange={(e) => setModulo(e.target.value)}
                          className="cursor-pointer w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3 pr-10 font-bold focus:border-indigo-500 outline-none transition-all text-sm appearance-none shadow-sm"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Selecione...</option>
                          {modulosCadastrados.map((mod) => (
                            <option key={mod} value={mod} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                              {mod}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2">
                        <span>⚠️</span> Sem matriz cadastrada!
                      </div>
                    )}
                  </div>

                </div>

                {/* Configurações Gerais (Data Limite, XP, Turma) */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-display font-black text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">
                    ⚙️ Configurações Gerais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:grid-cols-1 xl:grid-cols-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Data Limite
                      </label>
                      <input
                        type="date"
                        value={dataLimite}
                        onChange={(e) => setDataLimite(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 outline-none focus:border-blue-500 transition-all text-xs shadow-sm cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        XP Recompensa
                      </label>
                      <input
                        type="number"
                        value={xp}
                        onChange={(e) => setXp(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono rounded-2xl p-3 font-black outline-none focus:border-emerald-500 transition-all text-xs shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Turma Alvo
                      </label>
                      <div className="relative">
                        <select
                          value={turmaAlvo}
                          onChange={(e) => setTurmaAlvo(e.target.value)}
                          className="cursor-pointer w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 pr-8 outline-none focus:border-blue-500 transition-all text-xs shadow-sm appearance-none"
                        >
                          <option value="Todas" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todas</option>
                          {turmasDisponiveis.map((turma) => (
                            <option key={turma} value={turma} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                              {turma}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bento Row 5: Links e Configurações */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-display font-black text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">
                    🔗 Links & Recursos
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <span>🖼️</span> Link da Imagem
                      </label>
                      <input
                        type="url"
                        value={imagemUrl}
                        onChange={(e) => setImagemUrl(e.target.value)}
                        placeholder="https://i.imgur.com/..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 focus:border-blue-500 outline-none transition-all text-xs shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <span>🏫</span> Link do Classroom
                      </label>
                      <input
                        type="url"
                        value={linkClassroom}
                        onChange={(e) => setLinkClassroom(e.target.value)}
                        placeholder="https://classroom.google.com/..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 focus:border-blue-500 outline-none transition-all text-xs shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Link do Template Base (Sempre visível para Projeto/Material, não Quiz) */}
                  {tipo !== "Quiz" && (
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>⚡</span> Link do Template Base (CodePen / Replit / IDE)
                      </label>
                      <input
                        type="url"
                        value={opcaoA}
                        onChange={(e) => setOpcaoA(e.target.value)}
                        placeholder="https://codepen.io/... (Link base para colar o código)"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3.5 focus:border-indigo-500 outline-none transition-all text-xs shadow-sm font-mono"
                      />
                      <span className="text-[9px] font-medium text-slate-400 block mt-1 leading-normal">
                        * O aluno utilizará este link para abrir o editor e colar o código copiado do portal.
                      </span>
                    </div>
                  )}
                </div>

                {/* Bento Row 7: Treino de Digitação (Opcional, visível apenas para Projeto/Material) */}
                {tipo !== "Quiz" && (
                  <div className="bg-indigo-500/5 dark:bg-indigo-955/20 border border-indigo-500/25 dark:border-indigo-900/30 p-5 rounded-3xl space-y-4 shadow-sm">
                    <h3 className="font-display font-black text-indigo-800 dark:text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>⌨️</span> Treino de Digitação (Opcional)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Insira o código que o aluno deve digitar. Isso transforma a entrega em um teste de digitação monitorado.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Resolução Esperada (Código a ser digitado)
                        </label>
                        <textarea
                          rows={4}
                          value={resolucaoTyping}
                          onChange={(e) => setResolucaoTyping(e.target.value)}
                          placeholder="Ex: const total = preco * quantidade;"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-4 font-mono text-xs focus:border-blue-500 outline-none transition-all shadow-sm leading-relaxed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Limite de Tempo (Minutos)
                        </label>
                        <input
                          type="number"
                          value={limiteTempoTyping === 0 ? "" : limiteTempoTyping}
                          onChange={(e) => setLimiteTempoTyping(Number(e.target.value) || 0)}
                          placeholder="Ex: 15 (0 ou vazio para sem limite)"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all text-xs shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-5 bg-white/50 dark:bg-transparent border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap gap-3 justify-end shrink-0 relative z-10">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={limparFormulario}
              className="cursor-pointer px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-none"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={(e) => salvarNovaAtividade(e, "Rascunho")}
              disabled={salvando}
              className="cursor-pointer px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-550 border border-amber-500/20 transition-all shadow-sm disabled:opacity-50"
            >
              📝 Salvar Rascunho
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={(e) => salvarNovaAtividade(e, "Publicada")}
              disabled={salvando}
              className={`cursor-pointer px-8 py-3 rounded-2xl text-white font-black shadow-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:bg-slate-400 dark:disabled:bg-slate-700 border-none ${
                idEditando 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/10" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/10"
              }`}
            >
              {salvando ? (
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Processando...
                </div>
              ) : idEditando ? (
                "Atualizar Missão"
              ) : (
                "🚀 Publicar Missão"
              )}
            </motion.button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
