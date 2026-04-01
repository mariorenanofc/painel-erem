import { Aluno } from "@/src/types";

interface TrilhaTableProps {
  alunosFiltrados: Aluno[];
  atualizandoMatricula: string | null;
  mudarStatus: (matricula: string, novoStatus: string) => void;
  abrirModalVisualizacao: (aluno: Aluno) => void;
}

export default function TrilhaTable({
  alunosFiltrados,
  atualizandoMatricula,
  mudarStatus,
  abrirModalVisualizacao,
}: TrilhaTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">📋 Gerenciamento de Vagas</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-800 text-white text-xs md:text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Nome do Aluno</th>
              <th className="p-4 font-semibold">Matrícula</th>
              <th className="p-4 font-semibold">Turma do Curso</th>
              <th className="p-4 font-semibold">Status Atual</th>
              <th className="p-4 font-semibold text-center">Ações de Gestão</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 text-sm">
            {alunosFiltrados.length > 0 ? (
              alunosFiltrados.map((aluno, index) => (
                <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-4 font-medium">{aluno.nome}</td>
                  <td className="p-4 font-mono text-emerald-600">{aluno.matricula}</td>
                  <td className="p-4 font-semibold text-slate-600">{aluno.turmaTrilha}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        aluno.statusTrilha === "Ativo" ? "bg-emerald-100 text-emerald-700" :
                        aluno.statusTrilha === "Reserva" ? "bg-amber-100 text-amber-700" :
                        aluno.statusTrilha === "Inscrito" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {aluno.statusTrilha}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => abrirModalVisualizacao(aluno)}
                        className="text-xl hover:scale-125 hover:text-blue-600 transition-all"
                        title="Ver Contatos do Aluno"
                      >
                        👁️
                      </button>

                      {atualizandoMatricula === aluno.matricula ? (
                        <span className="text-slate-400 font-bold text-xs animate-pulse">Atualizando...</span>
                      ) : (
                        <select
                          className="bg-white border border-slate-300 text-slate-700 text-xs rounded p-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm w-[150px]"
                          value=""
                          onChange={(e) => mudarStatus(aluno.matricula, e.target.value)}
                        >
                          <option value="" disabled>Mudar Status...</option>
                          <option value="Ativo">✅ Promover a Ativo</option>
                          <option value="Reserva">⏳ Mover para Reserva</option>
                          <option value="Desistente">❌ Marcar Desistente</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                  Nenhum aluno encontrado com estes filtros...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}