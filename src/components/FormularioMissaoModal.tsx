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
  modulosCadastrados: string[]; // 🔥 NOVA PROPRIEDADE AQUI
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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-slate-200">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>📝</span>{" "}
            {idEditando
              ? `Editando Missão: ${idEditando}`
              : "Criar Nova Missão"}
          </h2>
          <button
            onClick={limparFormulario}
            className="text-2xl hover:text-red-400 transition-colors leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 custom-scrollbar">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">
                  Tipo de Sistema
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 hover:text-blue-600 transition-colors">
                    <input
                      type="radio"
                      value="Projeto"
                      checked={tipo === "Projeto"}
                      onChange={() => setTipo("Projeto")}
                      className="w-4 h-4 text-blue-600"
                    />{" "}
                    Projeto (Envio de Link)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 hover:text-amber-500 transition-colors">
                    <input
                      type="radio"
                      value="Quiz"
                      checked={tipo === "Quiz"}
                      onChange={() => setTipo("Quiz")}
                      className="w-4 h-4 text-amber-500"
                    />{" "}
                    Quiz (Múltipla Escolha)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 hover:text-emerald-500 transition-colors">
                    <input
                      type="radio"
                      value="Material"
                      checked={tipo === "Material"}
                      onChange={() => setTipo("Material")}
                      className="w-4 h-4 text-emerald-500"
                    />{" "}
                    Material (Acesso no AVA)
                  </label>
                </div>
              </div>

              {/* 🔥 O NOVO CAMPO DE SELEÇÃO DA MATRIZ INSTRUCIONAL */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-sm flex flex-col justify-center">
                <label className="block text-xs font-black text-indigo-800 uppercase mb-2 flex items-center gap-2">
                  <span>🗂️</span> Módulo da Matriz Instrucional
                </label>
                {modulosCadastrados.length > 0 ? (
                  <select
                    value={modulo}
                    onChange={(e) => setModulo(e.target.value)}
                    className="w-full bg-white border-2 border-indigo-300 text-slate-800 rounded-lg p-3 font-bold focus:border-indigo-600 outline-none transition-colors cursor-pointer shadow-sm"
                  >
                    <option value="">Selecione o Nano Módulo...</option>
                    {modulosCadastrados.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm font-bold flex items-center gap-2">
                    <span>⚠️</span> Nenhuma matriz cadastrada na aba
                    controle_modulos!
                  </div>
                )}
                <p className="text-[10px] text-indigo-600 mt-2 font-medium">
                  As turmas e o acesso serão validados automaticamente pelo
                  sistema.
                </p>
              </div>
            </div>

            <div>
              {/* 🔥 NOVO GERADOR INTELIGENTE DE TÍTULOS COM ETIQUETA DE AULA */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Título da Missão (Com Etiqueta de Aula)
                </label>

                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="flex items-center bg-white border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors shrink-0">
                    <span className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 border-r border-slate-200">
                      AULA Nº
                    </span>
                    <input
                      type="number"
                      placeholder="Ex: 1"
                      className="w-16 p-2 text-sm font-black text-blue-600 outline-none text-center"
                      onBlur={(e) => {
                        const num = e.target.value;
                        if (!num) return;
                        const formatado = num.length === 1 ? `0${num}` : num;
                        const prefixo = `[Aula ${formatado}] `;
                        // Substitui se já tiver uma etiqueta, ou adiciona no início
                        const tituloLimpo = titulo.replace(
                          /^\[Aula \d+\]\s*/,
                          "",
                        );
                        setTitulo(prefixo + tituloLimpo);
                        e.target.value = ""; // Limpa após usar
                      }}
                    />
                  </div>

                  <select
                    className="bg-white border-2 border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-600 outline-none shrink-0 cursor-pointer hover:bg-slate-50"
                    onChange={(e) => {
                      if (e.target.value) {
                        const tipoEtiq = `${e.target.value} - `;
                        // Tenta colocar o tipo logo após a etiqueta de Aula (se existir)
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
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Instruções Detalhadas
              </label>
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que o aluno deve fazer..."
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 font-mono text-sm focus:border-blue-500 outline-none transition-colors"
              ></textarea>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
              <label className="block text-xs font-black text-emerald-800 uppercase mb-2 flex items-center gap-2">
                <span>🗝️</span> Gabarito / Material de Recuperação (Opcional)
              </label>
              <textarea
                rows={2}
                value={gabarito}
                onChange={(e) => setGabarito(e.target.value)}
                placeholder="Cole o link do Colab, CodePen, ou digite a resposta correta aqui."
                className="w-full bg-white border-2 border-emerald-200 text-slate-800 rounded-lg p-3 font-mono text-sm focus:border-emerald-500 outline-none transition-colors"
              ></textarea>
              <label className="flex items-center gap-3 p-3 bg-white border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-50 mt-3 transition-colors shadow-sm">
                <input
                  type="checkbox"
                  checked={gabaritoLiberado}
                  onChange={(e) => setGabaritoLiberado(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer shrink-0"
                />
                <span className="text-sm font-bold text-emerald-900">
                  Liberar acesso ao Gabarito para os Alunos (Fica visível na
                  Central deles)
                </span>
              </label>
            </div>

            {tipo === "Quiz" && (
              <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 space-y-4 shadow-sm">
                <h3 className="font-bold text-amber-800 text-sm uppercase mb-2">
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
                      <span className="font-black text-amber-600 mt-2">
                        {alt.label})
                      </span>
                      <textarea
                        rows={2}
                        value={alt.val}
                        onChange={(e) => alt.set(e.target.value)}
                        placeholder={`Texto da opção ${alt.label}`}
                        className="w-full border-2 border-amber-200 rounded-lg p-2 text-sm text-slate-800 font-mono focus:border-amber-500 outline-none bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-amber-200 flex items-center gap-4">
                  <label className="text-sm font-bold text-amber-800 uppercase">
                    Resposta Correta:
                  </label>
                  <select
                    value={respostaCorreta}
                    onChange={(e) => setRespostaCorreta(e.target.value)}
                    className="border-2 border-amber-300 rounded-lg p-2 font-black text-emerald-600 bg-white outline-none cursor-pointer focus:border-emerald-500"
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                  <span>🖼️</span> Link da Imagem
                </label>
                <input
                  type="url"
                  value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  placeholder="https://i.imgur.com/..."
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                  <span>🏫</span> Link do Classroom
                </label>
                <input
                  type="url"
                  value={linkClassroom}
                  onChange={(e) => setLinkClassroom(e.target.value)}
                  placeholder="https://classroom.google.com/..."
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Data Limite
                </label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  XP da Missão
                </label>
                <input
                  type="number"
                  value={xp}
                  onChange={(e) => setXp(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 text-emerald-700 rounded-lg p-3 font-black outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Turma Alvo
                </label>
                <select
                  value={turmaAlvo}
                  onChange={(e) => setTurmaAlvo(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:border-blue-500 cursor-pointer"
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

        <div className="p-4 bg-white flex flex-wrap gap-3 justify-end border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={limparFormulario}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(e) => salvarNovaAtividade(e, "Rascunho")}
            disabled={salvando}
            className="px-6 py-3 rounded-xl font-bold bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 transition-colors shadow-sm"
          >
            📝 Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={(e) => salvarNovaAtividade(e, "Publicada")}
            disabled={salvando}
            className={`px-8 py-3 rounded-xl text-white font-black shadow-md transition-all active:scale-95 disabled:bg-slate-400 ${idEditando ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
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
