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
  turmasDisponiveis,
  salvando,
  limparFormulario,
  salvarNovaAtividade,
}: FormularioMissaoModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-slate-200">
        {/* CABEÇALHO */}
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

        {/* CORPO DO FORMULÁRIO */}
        <div className="p-6 overflow-y-auto bg-slate-50">
          <form className="space-y-6">
            {/* LINHA 1: TIPO E MÓDULO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TIPO DE MISSÃO */}
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
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />{" "}
                    Projeto (Envio de Link)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 hover:text-amber-500 transition-colors">
                    <input
                      type="radio"
                      value="Quiz"
                      checked={tipo === "Quiz"}
                      onChange={() => setTipo("Quiz")}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                    />{" "}
                    Quiz (Múltipla Escolha)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 hover:text-emerald-500 transition-colors">
                    <input
                      type="radio"
                      value="Material"
                      checked={tipo === "Material"}
                      onChange={() => setTipo("Material")}
                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                    />{" "}
                    Material (Acesso no AVA)
                  </label>
                </div>
              </div>

              {/* MÓDULO COM PREENCHIMENTO AUTOMÁTICO DE TURMA */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-sm flex flex-col justify-center">
                <label className="block text-xs font-bold text-indigo-800 uppercase mb-1 flex items-center gap-2">
                  <span>🗂️</span> Módulo / Tópico no Classroom
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modulo}
                    onChange={(e) => setModulo(e.target.value)}
                    placeholder="Ex: Aula 01"
                    className="w-full bg-white border-2 border-indigo-200 text-slate-800 rounded-lg p-3 font-bold focus:border-indigo-500 outline-none transition-colors"
                  />
                  {/* SELECT AJUDANTE: TURMA DO MÓDULO */}
                  <select
                    className="bg-white border-2 border-indigo-200 rounded-lg p-3 text-sm font-bold text-indigo-600 outline-none w-[140px] shrink-0 cursor-pointer hover:bg-indigo-50"
                    onChange={(e) => {
                      if (e.target.value) {
                        // Pega apenas a parte antes de " - Turma" para evitar duplicações
                        const baseModulo =
                          modulo.split(" - Turma")[0].trim() || "Aula XX";
                        setModulo(`${baseModulo} - ${e.target.value}`);
                        e.target.value = ""; // Reseta o select
                      }
                    }}
                  >
                    <option value="">+ Turma</option>
                    <option value="Turma 01">Turma 01</option>
                    <option value="Turma 02">Turma 02</option>
                    <option value="Turma 03">Turma 03</option>
                    <option value="Turma 04">Turma 04</option>
                  </select>
                </div>
                <p className="text-[10px] text-indigo-600 mt-2 font-medium leading-tight">
                  Dica: Digite &quot;Aula 01&ldquo; e selecione a Turma ao lado para criar
                  o grupo rapidamente.
                </p>
              </div>
            </div>

            {/* LINHA 2: TÍTULO COM PREENCHIMENTO AUTOMÁTICO DO CONTEÚDO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Título da Missão
              </label>
              <div className="flex gap-2">
                {/* SELECT AJUDANTE: TIPO DE CONTEÚDO */}
                <select
                  className="bg-slate-100 border-2 border-slate-200 rounded-lg p-3 text-sm font-bold text-blue-600 outline-none w-[170px] shrink-0 cursor-pointer hover:bg-blue-50"
                  onChange={(e) => {
                    if (e.target.value) {
                      setTitulo(`${e.target.value} - ${titulo}`);
                      e.target.value = ""; // Reseta o select
                    }
                  }}
                >
                  <option value="">+ Adicionar Tipo</option>
                  <option value="Broadcast">Broadcast</option>
                  <option value="Apresentação">Apresentação</option>
                  <option value="Desafio 01">Desafio 01</option>
                  <option value="Desafio 02">Desafio 02</option>
                  <option value="Desafio 03">Desafio 03</option>
                  <option value="Desafio Extra">Desafio Extra</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Mini Projeto">Mini Projeto</option>
                  <option value="Outras">Outras</option>
                </select>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Formulários - Parte 2"
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Use o botão esquerdo para adicionar o tipo de conteúdo (Ex:
                &quot;Desafio 01&ldquo;) direto no título.
              </p>
            </div>

            {/* LINHA 3: DESCRIÇÃO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {tipo === "Quiz"
                  ? "Enunciado da Questão (Aceita código)"
                  : "Instruções Detalhadas"}
              </label>
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que o aluno deve fazer..."
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 font-mono text-sm focus:border-blue-500 outline-none transition-colors"
              ></textarea>
            </div>

            {/* LINHA 4: IMAGEM (OPCIONAL) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                <span>🖼️</span> Link da Imagem de Referência (Opcional)
              </label>
              <input
                type="url"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="https://i.imgur.com/sua-imagem.png"
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            {/* BLOCO EXCLUSIVO: QUIZ */}
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

            {/* LINHA 5: CLASSROOM TRAVA */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                <span>🏫</span> Link da Atividade no Classroom (Opcional)
              </label>
              <input
                type="url"
                value={linkClassroom}
                onChange={(e) => setLinkClassroom(e.target.value)}
                placeholder="https://classroom.google.com/..."
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            {/* LINHA 6: CONFIGURAÇÕES FINAIS (PRAZO, XP E TURMA) */}
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
                  Turma Alvo (Visibilidade)
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

        {/* RODAPÉ E BOTÕES DE AÇÃO */}
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
