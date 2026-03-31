import { useState } from 'react';
import { formatarDataTabela } from "../utils/formatters";
import { StudentTableProps } from "../types";



const EmailCell = ({ email }: { email?: string }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000); // Reseta o estado após 2 segundos
    } catch (err) {
      console.error("Erro ao copiar email: ", err);
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="whitespace-nowrap">{email}</span>
      <button
        onClick={copiarEmail}
        title={copiado ? "Copiado!" : "Copiar e-mail"}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        {copiado ? (
          // Ícone de Check (Sucesso)
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          // Ícone de Copiar (Duas folhinhas)
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  );
};

export default function StudentTable({
  alunosFiltrados,
  preencherEdicao,
}: StudentTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Contêiner que permite o scroll horizontal no celular */}
      <div className="overflow-x-auto">
        <div
          className="p-3 md:p-4 font-medium text-xs md:text-sm text-black">
          Total de alunos nesta visualização:{" "}
                <strong>{alunosFiltrados.length}</strong>
        </div>
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
                    <EmailCell email={aluno.email} />
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
        </table>
      </div>
    </div>
  );
}
