import { formatarDataTabela } from "@/utils/formatters";
import { Aluno } from "@/types";

interface StudentTableProps {
  alunosFiltrados: Aluno[];
  preencherEdicao: (aluno: Aluno) => void;
}

export default function StudentTable({
  alunosFiltrados,
  preencherEdicao,
}: StudentTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Contêiner que permite o scroll horizontal no celular */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-250">
          <thead>
            <tr className="bg-slate-800 text-white text-xs md:text-sm uppercase tracking-wider">
              <th className="p-3 md:p-4 font-semibold whitespace-nowrap">
                Nome
              </th>
              <th className="p-3 md:p-4 font-semibold whitespace-nowrap">
                Data de Nasc.
              </th>
              <th className="p-3 md:p-4 font-semibold whitespace-nowrap">
                Matrícula
              </th>
              <th className="p-3 md:p-4 font-semibold whitespace-nowrap">
                Email
              </th>
              <th className="p-3 md:p-4 font-semibold whitespace-nowrap">
                Turma
              </th>
              <th className="p-3 md:p-4 font-semibold whitespace-nowrap text-center">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-700 text-sm">
            {alunosFiltrados.length > 0 ? (
              alunosFiltrados.map((aluno, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-200 hover:bg-slate-100 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="p-3 md:p-4 font-medium">{aluno.nome}</td>
                  <td className="p-3 md:p-4 text-slate-500 whitespace-nowrap">
                    {formatarDataTabela(aluno.dataNasc)}
                  </td>
                  <td className="p-3 md:p-4 font-mono text-emerald-600 whitespace-nowrap">
                    {aluno.matricula}
                  </td>
                  <td className="p-3 md:p-4">
                    {aluno.email ? (
                      <span className="whitespace-nowrap">{aluno.email}</span>
                    ) : (
                      <span className="text-slate-400 italic">Sem email</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 whitespace-nowrap">
                    <span className="bg-slate-200 px-2 py-1 rounded text-xs font-bold">
                      {aluno.turma}
                    </span>
                  </td>
                  <td className="p-3 md:p-4 whitespace-nowrap text-center">
                    {/* --- MUDOU: Texto e Estilo do Botão --- */}
                    <button
                      onClick={() => preencherEdicao(aluno)}
                      className="text-emerald-700 font-bold hover:text-emerald-900 hover:underline transition-colors flex items-center gap-1.5 mx-auto"
                    >
                      <span>📄</span> Visualizar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-500 font-medium"
                >
                  Nenhum aluno encontrado...
                </td>
              </tr>
            )}
          </tbody>
          {/* Mostra quantidade total de alunos filtrados no final */}
          <tfoot>
            <tr className="bg-slate-50 text-slate-600">
              <td
                colSpan={6}
                className="p-3 md:p-4 font-medium text-xs md:text-sm"
              >
                Total de alunos nesta visualização:{" "}
                <strong>{alunosFiltrados.length}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
