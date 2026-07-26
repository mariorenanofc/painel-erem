"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudentModalProps } from "../types";

// --- Função utilitária para renderizar os dados bonitos no modo VISUALIZAÇÃO ---
const DataDisplay = ({
  label,
  value,
  isLink = false,
  type = "text",
}: {
  label: string;
  value: string;
  isLink?: boolean;
  type?: "text" | "tel" | "mailto";
}) => (
  <div className="flex flex-col bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-800">
    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
      {label}
    </span>
    {isLink && value && value !== "Sem email" && value !== "Não encontrado" ? (
      <a
        href={type === "tel" ? `tel:${value.replace(/\D/g, "")}` : `mailto:${value}`}
        className="text-emerald-700 dark:text-emerald-450 font-black hover:underline text-sm md:text-base break-all"
      >
        {value}
      </a>
    ) : (
      <span
        className={`font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base break-all ${
          !value || value === "Sem email" ? "text-slate-450 italic font-normal" : ""
        }`}
      >
        {value || `Não informado`}
      </span>
    )}
  </div>
);

export default function StudentModal({
  isOpen,
  onClose,
  formData,
  handleChange,
  salvarAluno,
  salvando,
  isEditing,
  inscreverNoTrilha,
  mudarStatusTrilha,
}: StudentModalProps) {
  // --- Estado para controlar se o usuário ativou a edição manualmente ---
  const [modoEdicaoAtivo, setModoEdicaoAtivo] = useState(false);

  const mostrarFormulario = !isEditing || modoEdicaoAtivo;
  const [turmaCursoSelecionada, setTurmaCursoSelecionada] = useState("");
  const [inscrevendo, setInscrevendo] = useState(false);

  const handleInscricao = async () => {
    if (inscreverNoTrilha) {
      setInscrevendo(true);
      await inscreverNoTrilha(formData.matricula, turmaCursoSelecionada);
      setInscrevendo(false);
      setTurmaCursoSelecionada("");
    }
  };

  if (!isOpen) return null;

  const fecharEResetar = () => {
    setModoEdicaoAtivo(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fecharEResetar}
          className="absolute inset-0 bg-slate-955/65 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
        >
          {/* Glow decorativo de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-955 p-6 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2.5 tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shadow-inner">
                  👤
                </span>{" "}
                {!isEditing && "Cadastrar Novo Aluno"}
                {isEditing && mostrarFormulario && "Editando Dados do Aluno"}
                {isEditing && !mostrarFormulario && "Visualizando Dados do Aluno"}
              </h2>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mt-1">
                Ficha Cadastral e Projetos
              </p>
            </div>
            <button
              onClick={fecharEResetar}
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
            >
              &times;
            </button>
          </div>

          {/* Corpo com Rolagem */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/40 dark:bg-transparent">
            <AnimatePresence mode="wait">
              {!mostrarFormulario ? (
                /* MODO VISUALIZAÇÃO */
                <motion.div
                  key="visualizacao"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DataDisplay label="Nome Completo" value={formData.nome} />
                    <DataDisplay label="Matrícula" value={formData.matricula} />
                    <DataDisplay
                      label="Data de Nascimento"
                      value={
                        formData.dataNasc
                          ? formData.dataNasc.split("-").reverse().join("/")
                          : ""
                      }
                    />
                    <DataDisplay label="Turma" value={formData.turma} />
                    <DataDisplay
                      label="Email Institucional"
                      value={formData.email}
                      isLink
                      type="mailto"
                    />
                    <DataDisplay
                      label="Telefone Aluno"
                      value={formData.telefoneAluno}
                      isLink
                      type="tel"
                    />
                    <DataDisplay
                      label="Telefone Responsável"
                      value={formData.telefoneResponsavel}
                      isLink
                      type="tel"
                    />
                    <DataDisplay label="Observações" value={formData.obs} />
                  </div>

                  {/* Lógica Trilha Tech */}
                  {formData.statusTrilha ? (
                    <div className="bg-slate-50/70 dark:bg-slate-950/30 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-850 mt-2 shadow-inner">
                      <h3 className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-3">
                        🚀 Participação no Projeto Trilha Tech
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-5 mb-4">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-slate-450 dark:text-slate-500 font-normal">Turma do Projeto:</span>{" "}
                          {formData.turmaTrilha}
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="text-slate-450 dark:text-slate-500 font-normal">Status Atual:</span>{" "}
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                            formData.statusTrilha === "Ativo"
                              ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400"
                              : formData.statusTrilha === "Inscrito"
                                ? "bg-amber-100 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400"
                                : "bg-red-100 dark:bg-red-955/35 text-red-700 dark:text-red-400"
                          }`}>
                            {formData.statusTrilha}
                          </span>
                        </p>
                      </div>

                      {/* Painel de Aprovação da Gestão */}
                      {formData.statusTrilha === "Inscrito" && mudarStatusTrilha && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2 sm:mb-0 sm:mr-auto flex items-center gap-2">
                            <span>⏳</span> Avaliação Escolar Pendente:
                          </p>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => mudarStatusTrilha(formData.matricula, "Ativo")}
                              disabled={salvando}
                              className="cursor-pointer flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10"
                            >
                              ✅ Aprovar
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => mudarStatusTrilha(formData.matricula, "Desclassificado")}
                              disabled={salvando}
                              className="cursor-pointer flex-1 sm:flex-initial bg-red-650 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-500/10"
                            >
                              ❌ Desclassificar
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Inscrição */
                    isEditing && (
                      <div className="bg-blue-500/5 dark:bg-blue-955/10 p-5 rounded-3xl border border-blue-500/20 dark:border-blue-900/30 mt-2 shadow-inner">
                        <h3 className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3">
                          🎓 Inscrever no Projeto Trilha Tech
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="flex-1 w-full space-y-1.5 text-left">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Escolha a Turma do Curso:
                            </label>
                            <div className="relative">
                              <select
                                value={turmaCursoSelecionada}
                                onChange={(e) => setTurmaCursoSelecionada(e.target.value)}
                                className="cursor-pointer w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-250 rounded-xl p-3 pr-10 font-bold focus:border-blue-550 outline-none transition-all text-sm appearance-none shadow-sm"
                              >
                                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Selecione a turma...</option>
                                <option value="Turma 1 - 1º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 1 - 1º Ano</option>
                                <option value="Turma 2 - 2º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 2 - 2º Ano</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                                ▼
                              </div>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleInscricao}
                            disabled={!turmaCursoSelecionada || inscrevendo}
                            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider transition-all shadow-md select-none ${
                              !turmaCursoSelecionada || inscrevendo
                                ? "bg-slate-250 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                                : "bg-blue-600 hover:brightness-110 shadow-blue-500/10"
                            }`}
                          >
                            {inscrevendo ? "⏳ Processando..." : "✅ Confirmar Inscrição"}
                          </motion.button>
                        </div>
                      </div>
                    )
                  )}
                </motion.div>
              ) : (
                /* MODO EDIÇÃO */
                <motion.div
                  key="edicao"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Coluna Esquerda */}
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Matrícula <span className="text-red-500 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        name="matricula"
                        value={formData.matricula}
                        onChange={handleChange}
                        readOnly={isEditing}
                        className={`border border-slate-250 dark:border-slate-800 p-3.5 rounded-2xl outline-none font-bold text-sm shadow-sm transition-all ${
                          isEditing
                            ? "bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-605 cursor-not-allowed shadow-none font-mono"
                            : "bg-white dark:bg-slate-950 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                        }`}
                        placeholder="Ex: 1234567"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Nome Completo <span className="text-red-500 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all"
                        placeholder="Nome do aluno..."
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        name="dataNasc"
                        value={formData.dataNasc}
                        onChange={handleChange}
                        className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Telefone do Aluno
                      </label>
                      <input
                        type="tel"
                        name="telefoneAluno"
                        value={formData.telefoneAluno}
                        onChange={handleChange}
                        className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all font-mono"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Turma <span className="text-red-500 font-black">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="turma"
                          value={formData.turma}
                          onChange={handleChange}
                          className="cursor-pointer w-full bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-800 p-3.5 pr-10 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all appearance-none"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Selecione a turma...</option>
                          <option value="1º ANO A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO A</option>
                          <option value="1º ANO B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO B</option>
                          <option value="1º ANO C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO C</option>
                          <option value="1º ANO D" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO D</option>
                          <option value="2º ANO A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">2º ANO A</option>
                          <option value="2º ANO B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">2º ANO B</option>
                          <option value="2º ANO C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">2º ANO C</option>
                          <option value="3º ANO A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO A</option>
                          <option value="3º ANO B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO B</option>
                          <option value="3º ANO C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO C</option>
                          <option value="3º ANO D" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO D</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Email Institucional
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all"
                        placeholder="aluno@educacao.pe.gov.br"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Telefone do Responsável
                      </label>
                      <input
                        type="tel"
                        name="telefoneResponsavel"
                        value={formData.telefoneResponsavel}
                        onChange={handleChange}
                        className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all font-mono"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Observações
                      </label>
                      <input
                        type="text"
                        name="obs"
                        value={formData.obs}
                        onChange={handleChange}
                        className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold shadow-sm transition-all"
                        placeholder="Anotações extras..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rodapé Fixo */}
          <div className="p-5 bg-white/50 dark:bg-transparent border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap gap-3 justify-end shrink-0">
            {/* BOTÕES DO MODO VISUALIZAÇÃO */}
            {!mostrarFormulario && (
              <>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={fecharEResetar}
                  className="cursor-pointer px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none"
                >
                  Sair
                </motion.button>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setModoEdicaoAtivo(true)}
                    className="cursor-pointer px-7 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-lg bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10 transition-all select-none flex items-center justify-center gap-1.5"
                  >
                    ✏️ Editar Dados
                  </motion.button>
                )}
              </>
            )}

            {/* BOTÕES DO MODO EDIÇÃO */}
            {mostrarFormulario && (
              <>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setModoEdicaoAtivo(false)}
                    className="cursor-pointer px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none order-2 md:order-1"
                    disabled={salvando}
                  >
                    Cancelar Edição
                  </motion.button>
                )}
                {!isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={fecharEResetar}
                    className="cursor-pointer px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none order-2 md:order-1"
                    disabled={salvando}
                  >
                    Cancelar
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={salvarAluno}
                  disabled={salvando}
                  className="cursor-pointer px-7 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-lg bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10 transition-all select-none order-1 md:order-2"
                >
                  {salvando ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    "Confirmar e Salvar"
                  )}
                </motion.button>
              </>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
