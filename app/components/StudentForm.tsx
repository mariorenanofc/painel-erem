import { Aluno } from "@/types";

interface StudentFormProps {
  formData: Aluno;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  salvarAluno: () => void;
  salvando: boolean;
}

export default function StudentForm({
  formData,
  handleChange,
  salvarAluno,
  salvando,
}: StudentFormProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 lg:col-span-2">
      <h2 className="text-lg font-bold text-slate-700 mb-6 border-b pb-2">
        Cadastrar ou Editar Aluno
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-600 mb-1">
              MATRÍCULA:
            </label>
            <input
              type="text"
              name="matricula"
              value={formData.matricula}
              onChange={handleChange}
              className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700"
              placeholder="Obrigatório..."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-600 mb-1">
              NOME COMPLETO:
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700"
              placeholder="Obrigatório..."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-600 mb-1">
              DATA DE NASC:
            </label>
            <input
              type="date"
              name="dataNasc"
              value={formData.dataNasc}
              onChange={handleChange}
              className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-600 mb-1">
              EMAIL INSTITUCIONAL:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700"
              placeholder="aluno@educacao.pe.gov.br"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-600 mb-1">
              TURMA:
            </label>
            <select
              name="turma"
              value={formData.turma}
              onChange={handleChange}
              className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700"
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
            <label className="text-sm font-semibold text-slate-600 mb-1">
              OBSERVAÇÕES:
            </label>
            <input
              type="text"
              name="obs"
              value={formData.obs}
              onChange={handleChange}
              className="bg-slate-50 border-b-2 border-slate-300 p-2 focus:border-emerald-600 focus:outline-none text-slate-700"
              placeholder="Anotações extras..."
            />
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={salvarAluno}
          disabled={salvando}
          className={`text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all ${salvando ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"}`}
        >
          {salvando ? "Salvando..." : "Salvar Aluno"}
        </button>
      </div>
    </div>
  );
}
