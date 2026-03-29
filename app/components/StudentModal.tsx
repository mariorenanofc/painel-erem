import { ChangeEvent } from "react";

interface StudentFormData {
  matricula: string;
  nome: string;
  dataNasc: string;
  turma: string;
  email: string;
  obs: string;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: StudentFormData;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  salvarAluno: () => void;
  salvando: boolean;
  isEditing: boolean;
}

export default function StudentModal({ isOpen, onClose, formData, handleChange, salvarAluno, salvando, isEditing }: StudentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      
      {/* Container Principal do Modal com max-h e flex-col */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Cabeçalho Fixo */}
        <div className="bg-slate-50 px-4 md:px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">
            {isEditing ? '✏️ Editar Aluno' : '✨ Cadastrar Novo Aluno'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Corpo com Rolagem (Scroll) */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-4 md:space-y-5">
              <div className="flex flex-col">
                <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">MATRÍCULA: <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="matricula" 
                  value={formData.matricula} 
                  onChange={handleChange} 
                  readOnly={isEditing}
                  className={`border-b-2 p-2 focus:outline-none font-medium text-sm md:text-base ${isEditing ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-700'}`} 
                  placeholder="Ex: 1234567" 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">NOME COMPLETO: <span className="text-red-500">*</span></label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 font-medium text-sm md:text-base" placeholder="Nome do aluno..." />
              </div>
              <div className="flex flex-col">
                <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">DATA DE NASC:</label>
                <input type="date" name="dataNasc" value={formData.dataNasc} onChange={handleChange} className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base" />
              </div>
            </div>

            <div className="space-y-4 md:space-y-5">
              <div className="flex flex-col">
                <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">TURMA: <span className="text-red-500">*</span></label>
                <select name="turma" value={formData.turma} onChange={handleChange} className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 font-medium text-sm md:text-base">
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
                <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">EMAIL INSTITUCIONAL:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base" placeholder="aluno@educacao.pe.gov.br" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs md:text-sm font-bold text-slate-600 mb-1">OBSERVAÇÕES:</label>
                <input type="text" name="obs" value={formData.obs} onChange={handleChange} className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700 text-sm md:text-base" placeholder="Anotações extras..." />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="bg-slate-50 px-4 md:px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-200 transition-colors order-2 md:order-1"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button 
            onClick={salvarAluno} 
            disabled={salvando}
            className={`w-full md:w-auto px-8 py-2.5 rounded-lg text-white font-bold shadow-md transition-all order-1 md:order-2 ${salvando ? 'bg-emerald-400 cursor-not-allowed flex items-center justify-center gap-2' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5'}`}
          >
            {salvando ? '⏳ Salvando...' : 'Confirmar e Salvar'}
          </button>
        </div>

      </div>
    </div>
  );
}