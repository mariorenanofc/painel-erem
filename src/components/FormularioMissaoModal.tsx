"use client";

import React from "react";

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
  modulosCadastrados,
  turmasDisponiveis,
  salvando,
  limparFormulario,
  salvarNovaAtividade,
}: FormularioMissaoModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="bg-slate-800 dark:bg-slate-950 p-4 flex justify-between items-center text-white shrink-0 transition-colors duration-300">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>📝</span>{" "}
            {idEditando
              ? `Editando Missão: ${idEditando}`
              : "Criar Nova Missão"}
          </h2>
          <button
            onClick={limparFormulario}
            className="cursor-pointer text-2xl hover:text-red-400 dark:hover:text-red-500 transition-colors leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 custom-scrollbar transition-colors duration-300">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 transition-colors">
                  Tipo de Sistema
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <input
                      type="radio"
                      value="Projeto"
                      checked={tipo === "Projeto"}
                      onChange={() => setTipo("Projeto")}
                      className="cursor-pointer w-4 h-4 text-blue-600 dark:text-blue-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    />{" "}
                    Projeto (Envio de Link)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                    <input
                      type="radio"
                      value="Quiz"
                      checked={tipo === "Quiz"}
                      onChange={() => setTipo("Quiz")}
                      className="cursor-pointer w-4 h-4 text-amber-500 dark:text-amber-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    />{" "}
                    Quiz (Múltipla Escolha)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                    <input
                      type="radio"
                      value="Material"
                      checked={tipo === "Material"}
                      onChange={() => setTipo("Material")}
                      className="cursor-pointer w-4 h-4 text-emerald-500 dark:text-emerald-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    />{" "}
                    Material (Acesso no AVA)
                  </label>
                </div>
              </div>

              {/* 🔥 O NOVO CAMPO DE SELEÇÃO DA MATRIZ INSTRUCIONAL */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50 shadow-sm flex flex-col justify-center transition-colors">
                <label className="block text-xs font-black text-indigo-800 dark:text-indigo-400 uppercase mb-2 flex items-center gap-2 transition-colors">
                  <span>🗂️</span> Módulo da Matriz Instrucional
                </label>
                {modulosCadastrados.length > 0 ? (
                  <select
                    value={modulo}
                    onChange={(e) => setModulo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border-2 border-indigo-300 dark:border-indigo-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 font-bold focus:border-indigo-600 dark:focus:border-indigo-500 outline-none transition-colors cursor-pointer shadow-sm"
                  >
                    <option value="">Selecione o Nano Módulo...</option>
                    {modulosCadastrados.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800/50 text-sm font-bold flex items-center gap-2 transition-colors">
                    <span>⚠️</span> Nenhuma matriz cadastrada na aba
                    controle_modulos!
                  </div>
                )}
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-2 font-medium transition-colors">
                  As turmas e o acesso serão validados automaticamente pelo
                  sistema.
                </p>
              </div>
            </div>

            <div>
              {/* 🔥 NOVO GERADOR INTELIGENTE DE TÍTULOS COM ETIQUETA DE AULA */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 transition-colors">
                  Título da Missão (Com Etiqueta de Aula)
                </label>

                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="flex items-center bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors shrink-0">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 transition-colors">
                      AULA Nº
                    </span>
                    <input
                      type="number"
                      placeholder="Ex: 1"
                      className="w-16 p-2 text-sm font-black text-blue-600 dark:text-blue-400 bg-transparent outline-none text-center transition-colors"
                      onBlur={(e) => {
                        const num = e.target.value;
                        if (!num) return;
                        const formatado = num.length === 1 ? `0${num}` : num;
                        const prefixo = `[Aula ${formatado}] `;
                        const tituloLimpo = titulo.replace(
                          /^\[Aula \d+\]\s*/,
                          "",
                        );
                        setTitulo(prefixo + tituloLimpo);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <select
                    className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none shrink-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onChange={(e) => {
                      if (e.target.value) {
                        const tipoEtiq = `${e.target.value} - `;
                        const matchAula = titulo.match(
                          /^(\[Aula \d+\]\s*)(.*)/,
                        );
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
                    <option value="">+ Adicionar Tipo</option>
                    <option value="Apresentação">Apresentação</option>
                    <option value="Broadcast">Broadcast</option>
                    <option value="Desafio_1">Desafio 1</option>
                    <option value="Desafio_2">Desafio 2</option>
                    <option value="Desafio_3">Desafio 3</option>
                    <option value="feedback">Feedback</option>
                    <option value="Mini Projeto">Mini Projeto</option>
                    <option value="Material de Apoio">Material de Apoio</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: [Aula 01] Desafio - Variáveis e Tipos"
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                Instruções Detalhadas
              </label>
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que o aluno deve fazer..."
                className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 font-mono text-sm focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
              ></textarea>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl shadow-sm transition-colors">
              <label className="block text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase mb-2 flex items-center gap-2 transition-colors">
                <span>🗝️</span> Gabarito / Material de Recuperação (Opcional)
              </label>
              <textarea
                rows={2}
                value={gabarito}
                onChange={(e) => setGabarito(e.target.value)}
                placeholder="Cole o link do Colab, CodePen, ou digite a resposta correta aqui."
                className="w-full bg-white dark:bg-slate-950 border-2 border-emerald-200 dark:border-emerald-800/50 text-slate-800 dark:text-slate-100 rounded-lg p-3 font-mono text-sm focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors"
              ></textarea>
              <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800/50 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/40 mt-3 transition-colors shadow-sm">
                <input
                  type="checkbox"
                  checked={gabaritoLiberado}
                  onChange={(e) => setGabaritoLiberado(e.target.checked)}
                  className="cursor-pointer w-5 h-5 text-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-400 rounded shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300 transition-colors">
                  Liberar acesso ao Gabarito para os Alunos (Fica visível na
                  Central deles)
                </span>
              </label>
            </div>

            {tipo === "Quiz" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-4 shadow-sm transition-colors">
                <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm uppercase mb-2 transition-colors">
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
                      <span className="font-black text-amber-600 dark:text-amber-500 mt-2 transition-colors">
                        {alt.label})
                      </span>
                      <textarea
                        rows={2}
                        value={alt.val}
                        onChange={(e) => alt.set(e.target.value)}
                        placeholder={`Texto da opção ${alt.label}`}
                        className="w-full border-2 border-amber-200 dark:border-amber-800/50 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-100 font-mono focus:border-amber-500 dark:focus:border-amber-400 outline-none bg-white dark:bg-slate-950 transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-amber-200 dark:border-amber-800/50 flex items-center gap-4 transition-colors">
                  <label className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase transition-colors">
                    Resposta Correta:
                  </label>
                  <select
                    value={respostaCorreta}
                    onChange={(e) => setRespostaCorreta(e.target.value)}
                    className="cursor-pointer border-2 border-amber-300 dark:border-amber-700 rounded-lg p-2 font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950 outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
                  >
                    <option value="A">Alternativa A</option>
                    <option value="B">Alternativa B</option>
                    <option value="C">Alternativa C</option>
                    <option value="D">Alternativa D</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2 transition-colors">
                  <span>🖼️</span> Link da Imagem
                </label>
                <input
                  type="url"
                  value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  placeholder="https://i.imgur.com/..."
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2 transition-colors">
                  <span>🏫</span> Link do Classroom
                </label>
                <input
                  type="url"
                  value={linkClassroom}
                  onChange={(e) => setLinkClassroom(e.target.value)}
                  placeholder="https://classroom.google.com/..."
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                  Data Limite
                </label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                  XP da Missão
                </label>
                <input
                  type="number"
                  value={xp}
                  onChange={(e) => setXp(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 rounded-lg p-3 font-black outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                  Turma Alvo
                </label>
                <select
                  value={turmaAlvo}
                  onChange={(e) => setTurmaAlvo(e.target.value)}
                  className="cursor-pointer w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                >
                  <option value="Todas">Todas as Turmas</option>
                  {turmasDisponiveis.map((turma) => (
                    <option key={turma} value={turma}>
                      {turma}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 justify-end shrink-0 transition-colors duration-300">
          <button
            type="button"
            onClick={limparFormulario}
            className="cursor-pointer px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(e) => salvarNovaAtividade(e, "Rascunho")}
            disabled={salvando}
            className="cursor-pointer px-6 py-3 rounded-xl font-bold bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-500 border border-yellow-300 dark:border-yellow-700 transition-colors shadow-sm disabled:opacity-50"
          >
            📝 Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={(e) => salvarNovaAtividade(e, "Publicada")}
            disabled={salvando}
            className={`cursor-pointer px-8 py-3 rounded-xl text-white font-black shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-400 dark:disabled:bg-slate-700 ${idEditando ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"}`}
          >
            {salvando
              ? "Processando..."
              : idEditando
                ? "Atualizar Missão"
                : "🚀 Publicar Missão"}
          </button>
        </div>
      </div>
    </div>
  );
}
