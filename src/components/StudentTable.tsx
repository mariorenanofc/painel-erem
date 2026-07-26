import { useState } from "react";
import { motion } from "framer-motion";
import { formatarDataTabela } from "../utils/formatters";
import { StudentTableProps } from "../types";

const EmailCell = ({ email }: { email?: string }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar email: ", err);
    }
  };

  return (
    <div className="flex items-center gap-2 group max-w-[200px] md:max-w-none">
      <span className="truncate">{email || "Sem email"}</span>
      {email && email !== "Sem email" && (
        <button
          onClick={copiarEmail}
          title={copiado ? "Copiado!" : "Copiar e-mail"}
          className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
        >
          {copiado ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default function StudentTable({ alunosFiltrados, preencherEdicao }: StudentTableProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/40 rounded-[2rem] shadow-lg border border-slate-200/60 dark:border-white/5 backdrop-blur-md overflow-hidden">
      <div className="p-4 px-6 border-b border-slate-200/80 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
        Total de alunos nesta visualização: <strong className="text-slate-800 dark:text-white font-mono">{alunosFiltrados.length}</strong>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-950 text-slate-500 dark:text-slate-455 text-[10px] uppercase font-black tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Nome</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Data de Nasc.</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Matrícula</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Email</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Turma</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300 text-xs divide-y divide-slate-150 dark:divide-slate-850">
            {alunosFiltrados.length > 0 ? (
              alunosFiltrados.map((aluno, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/80 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-150">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span>{aluno.nome}</span>
                        {aluno.obs && aluno.obs.trim() !== "" && (
                          <span
                            title={`Aviso/Pendência: ${aluno.obs}`}
                            className="cursor-help hover:scale-110 transition-transform text-sm select-none"
                          >
                            ⚠️
                          </span>
                        )}
                      </div>

                      {aluno.statusTrilha && (
                        <span className={`inline-flex items-center gap-1.5 mt-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                          aluno.statusTrilha === "Ativo"
                            ? "bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-900/15"
                            : aluno.statusTrilha === "Reserva"
                              ? "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/30 dark:border-amber-900/15"
                              : aluno.statusTrilha === "Inscrito"
                                ? "bg-blue-100/80 dark:bg-blue-955/40 text-blue-700 dark:text-blue-400 border-blue-200/30 dark:border-blue-900/15"
                                : "bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-450 border-slate-200/50 dark:border-slate-800"
                        }`}>
                          🚀 Trilha Tech: {aluno.statusTrilha}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {formatarDataTabela(aluno.dataNasc)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-450">
                    {aluno.matricula}
                  </td>
                  <td className="px-6 py-4">
                    <EmailCell email={aluno.email} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {aluno.turma}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => preencherEdicao(aluno)}
                      className="cursor-pointer text-emerald-600 dark:text-emerald-450 font-black uppercase text-[10px] tracking-wider hover:underline flex items-center gap-1.5 mx-auto bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                    >
                      <span>📄</span> Visualizar
                    </motion.button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider text-xs"
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