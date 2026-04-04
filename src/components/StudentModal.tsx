import { useState } from "react";
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
  <div className="flex flex-col border-b border-slate-200 pb-2.5">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}:
    </span>
    {isLink && value && value !== "Sem email" && value !== "Não encontrado" ? (
      <a
        href={
          type === "tel" ? `tel:${value.replace(/\D/g, "")}` : `mailto:${value}`
        }
        className="text-emerald-700 font-semibold hover:underline text-sm md:text-base wrap-break-word"
      >
        {value}
      </a>
    ) : (
      <span
        className={`font-semibold text-slate-800 text-sm md:text-base wrap-break-word ${!value || value === "Sem email" ? "text-slate-400 italic" : ""}`}
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
  // Começa como false por padrão. A lógica de "novo cadastro" vai forçar o formulário a aparecer mais embaixo.
  const [modoEdicaoAtivo, setModoEdicaoAtivo] = useState(false);

  // Variável derivada: O modo de edição do formulário só aparece se:
  // 1. For um cadastro NOVO (!isEditing)
  // OU
  // 2. O usuário clicou no botão de editar (modoEdicaoAtivo for true)
  const mostrarFormulario = !isEditing || modoEdicaoAtivo;
  const [turmaCursoSelecionada, setTurmaCursoSelecionada] = useState(""); // <-- NOVO
  const [inscrevendo, setInscrevendo] = useState(false); // <-- NOVO

  // Função que será chamada ao clicar no botão
  const handleInscricao = async () => {
    if (inscreverNoTrilha) {
      setInscrevendo(true);
      await inscreverNoTrilha(formData.matricula, turmaCursoSelecionada);
      setInscrevendo(false);
      setTurmaCursoSelecionada(""); // Limpa após inscrever
    }
  };

  if (!isOpen) return null;

  const fecharEResetar = () => {
    setModoEdicaoAtivo(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-300">
      {/* Container Principal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Cabeçalho Fixo */}
        <div className="bg-slate-50 px-4 md:px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
            {!isEditing && "✨ Cadastrar Novo Aluno"}
            {isEditing && mostrarFormulario && "✏️ Editando Dados do Aluno"}
            {isEditing &&
              !mostrarFormulario &&
              "📄 Visualizando Dados do Aluno"}
          </h2>
          <button
            onClick={fecharEResetar}
            className="text-slate-400 hover:text-red-500 transition-colors text-2xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Corpo com Rolagem (Scroll) */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* ==========================================
              MODO VISUALIZAÇÃO (TELA LIMPA)
              ========================================== */}
          {!mostrarFormulario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DataDisplay label="Nome Completo" value={formData.nome} />
              <DataDisplay label="Matrícula" value={formData.matricula} />
              <DataDisplay
                label="Data de Nasc."
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

              {/* --- LÓGICA BLINDADA DO TRILHA TECH --- */}
              {formData.statusTrilha ? (
                /* 1. SE O ALUNO JÁ TEM STATUS: Mostra o resumo */
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🚀 Participação no Projeto Trilha Tech</h3>
                  <div className="flex flex-col sm:flex-row gap-4 mb-2">
                    <p className="text-sm font-semibold text-slate-800"><span className="text-slate-500 font-normal">Turma:</span> {formData.turmaTrilha}</p>
                    <p className="text-sm font-semibold text-slate-800"><span className="text-slate-500 font-normal">Status Atual:</span> {formData.statusTrilha}</p>
                  </div>
                  
                  {/* --- NOVO: PAINEL DE APROVAÇÃO DA GESTÃO --- */}
                  {/* Só aparece se o aluno estiver "Inscrito" e se a função existir (para não aparecer no painel do Tutor) */}
                  {formData.statusTrilha === "Inscrito" && mudarStatusTrilha && (
                    <div className="mt-4 pt-4 border-t border-blue-200 flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded border  shadow-sm">
                      <p className="text-sm text-slate-600 font-medium mb-2 sm:mb-0 sm:mr-auto flex items-center gap-2">
                        <span>⏳</span> Avaliação Escolar Pendente:
                      </p>
                      <button 
                        onClick={() => mudarStatusTrilha(formData.matricula, 'Ativo')} 
                        disabled={salvando}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm"
                      >
                        ✅ Aprovar (Tornar Ativo)
                      </button>
                      <button 
                        onClick={() => mudarStatusTrilha(formData.matricula, 'Desclassificado')} 
                        disabled={salvando}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm"
                      >
                        ❌ Desclassificar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* 2. SE NÃO TEM STATUS: Mostra a caixa de Inscrição (apenas se o aluno já existir no banco -> isEditing) */
                isEditing && (
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200 mt-2 animate-in fade-in">
                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
                      🎓 Inscrever no Projeto Trilha Tech
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                          Escolha a Turma do Curso:
                        </label>
                        <select
                          value={turmaCursoSelecionada}
                          onChange={(e) =>
                            setTurmaCursoSelecionada(e.target.value)
                          }
                          className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-sm"
                        >
                          <option value="">Selecione a turma...</option>
                          <option value="Turma 1 - 1º Ano">
                            Turma 1 - 1º Ano
                          </option>
                          <option value="Turma 2 - 2º Ano">
                            Turma 2 - 2º Ano
                          </option>
                        </select>
                      </div>
                      <button
                        onClick={handleInscricao}
                        disabled={!turmaCursoSelecionada || inscrevendo}
                        className={`w-full sm:w-auto px-6 py-2 rounded-lg text-white font-bold text-sm transition-all shadow-sm ${!turmaCursoSelecionada || inscrevendo ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"}`}
                      >
                        {inscrevendo
                          ? "⏳ Processando..."
                          : "✅ Confirmar Inscrição"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ==========================================
              MODO EDIÇÃO (O SEU FORMULÁRIO COM OS INPUTS)
              ========================================== */}
          {mostrarFormulario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
              {/* Coluna 1 */}
              <div className="space-y-4 md:space-y-5">
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    MATRÍCULA: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="matricula"
                    value={formData.matricula}
                    onChange={handleChange}
                    readOnly={isEditing}
                    className={`border-b-2 p-2 focus:outline-none font-medium text-sm md:text-base ${isEditing ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-700"}`}
                    placeholder="Ex: 1234567"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    NOME COMPLETO: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 font-medium text-sm md:text-base"
                    placeholder="Nome do aluno..."
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    DATA DE NASC:
                  </label>
                  <input
                    type="date"
                    name="dataNasc"
                    value={formData.dataNasc}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    TELEFONE DO ALUNO: (Único)
                  </label>
                  <input
                    type="tel"
                    name="telefoneAluno"
                    value={formData.telefoneAluno}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base"
                    placeholder="(87) 9XXXX-XXXX"
                  />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4 md:space-y-5">
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    TURMA: <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="turma"
                    value={formData.turma}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 font-medium text-sm md:text-base"
                  >
                    <option value="">Selecione a turma...</option>
                    <option value="1º ANO A">1º ANO A</option>
                    <option value="1º ANO B">1º ANO B</option>
                    <option value="1º ANO C">1º ANO C</option>
                    <option value="1º ANO D">1º ANO D</option>
                    <option value="2º ANO A">2º ANO A</option>
                    <option value="2º ANO B">2º ANO B</option>
                    <option value="2º ANO C">2º ANO C</option>
                    <option value="3º ANO A">3º ANO A</option>
                    <option value="3º ANO B">3º ANO B</option>
                    <option value="3º ANO C">3º ANO C</option>
                    <option value="3º ANO D">3º ANO D</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    EMAIL INSTITUCIONAL: (Único)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base"
                    placeholder="aluno@educacao.pe.gov.br"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    TELEFONE DO RESPONSÁVEL:
                  </label>
                  <input
                    type="tel"
                    name="telefoneResponsavel"
                    value={formData.telefoneResponsavel}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base"
                    placeholder="(87) 9XXXX-XXXX"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">
                    OBSERVAÇÕES:
                  </label>
                  <input
                    type="text"
                    name="obs"
                    value={formData.obs}
                    onChange={handleChange}
                    className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base"
                    placeholder="Anotações extras..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="bg-slate-50 px-4 md:px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3 shrink-0">
          {/* BOTÕES DO MODO VISUALIZAÇÃO */}
          {!mostrarFormulario && (
            <>
              <button
                onClick={fecharEResetar}
                className="w-full md:w-auto px-6 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                Sair
              </button>
              {isEditing && (
                <button
                  onClick={() => setModoEdicaoAtivo(true)}
                  className="w-full md:w-auto px-8 py-2.5 rounded-lg text-white font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  ✏️ Editar Dados
                </button>
              )}
            </>
          )}

          {/* BOTÕES DO MODO EDIÇÃO (Quando destravado) */}
          {mostrarFormulario && (
            <>
              {isEditing && (
                <button
                  onClick={() => setModoEdicaoAtivo(false)}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-200 transition-colors order-2 md:order-1"
                  disabled={salvando}
                >
                  Cancelar Edição
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={fecharEResetar}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-200 transition-colors order-2 md:order-1"
                  disabled={salvando}
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={salvarAluno}
                disabled={salvando}
                className={`w-full md:w-auto px-8 py-2.5 rounded-lg text-white font-bold shadow-md transition-all order-1 md:order-2 ${salvando ? "bg-emerald-400 cursor-not-allowed flex items-center justify-center gap-2" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"}`}
              >
                {salvando ? "⏳ Salvando..." : "Confirmar e Salvar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
