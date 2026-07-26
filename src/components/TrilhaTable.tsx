import { Aluno } from "@/src/types";
import { motion } from "framer-motion";

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
    <div className="bg-white/80 dark:bg-slate-900/40 rounded-[2rem] shadow-lg border border-slate-200/60 dark:border-white/5 backdrop-blur-md overflow-hidden">
      <div className="p-6 border-b border-slate-200/80 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
        <h2 className="font-display font-black text-slate-800 dark:text-white text-base uppercase tracking-wider flex items-center gap-2">
          <span>📋</span> Gerenciamento de Vagas
        </h2>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-950 text-slate-500 dark:text-slate-455 text-[10px] uppercase font-black tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Nome do Aluno</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Matrícula</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Turma do Curso</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850">Status Atual</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-850 text-center">Ações de Gestão</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300 text-xs divide-y divide-slate-150 dark:divide-slate-850">
            {alunosFiltrados.length > 0 ? (
              alunosFiltrados.map((aluno, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/80 dark:hover:bg-slate-900/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-150">
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
                    <div className="mt-1.5">
                      {aluno.whatsapp ? (
                        <span className="bg-emerald-100/90 dark:bg-emerald-955/35 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-emerald-250/20 dark:border-emerald-900/10 flex items-center gap-1 w-max">
                          <span className="text-xs">📱</span> No Grupo
                        </span>
                      ) : (
                        <span className="bg-rose-100/90 dark:bg-rose-955/35 text-rose-700 dark:text-rose-450 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-rose-250/20 dark:border-rose-900/10 flex items-center gap-1 w-max">
                          <span className="text-xs">❌</span> Sem WhatsApp
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-450">
                    {aluno.matricula}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">
                    {aluno.turmaTrilha}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                        aluno.statusTrilha === "Ativo"
                          ? "bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-900/15"
                          : aluno.statusTrilha === "Reserva"
                            ? "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/30 dark:border-amber-900/15"
                            : aluno.statusTrilha === "Inscrito"
                              ? "bg-blue-100/80 dark:bg-blue-955/40 text-blue-700 dark:text-blue-400 border-blue-200/30 dark:border-blue-900/15"
                              : "bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-450 border-slate-200/50 dark:border-slate-800"
                      }`}
                    >
                      {aluno.statusTrilha}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => abrirModalVisualizacao(aluno)}
                        className="text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer select-none"
                        title="Ver Contatos do Aluno"
                      >
                        👁️
                      </motion.button>

                      {atualizandoMatricula === aluno.matricula ? (
                        <span className="text-slate-400 font-bold text-xs animate-pulse">
                          Atualizando...
                        </span>
                      ) : (
                        <div className="relative">
                          <select
                            className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl p-2 pr-8 focus:outline-none focus:border-emerald-500 shadow-sm appearance-none min-w-[150px]"
                            value=""
                            onChange={(e) => mudarStatus(aluno.matricula, e.target.value)}
                          >
                            <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600">
                              Mudar Status...
                            </option>
                            <option value="Ativo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                              ✅ Promover a Ativo
                            </option>
                            <option value="Reserva" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                              ⏳ Mover para Reserva
                            </option>
                            <option value="Desistente" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                              ❌ Marcar Desistente
                            </option>
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[9px]">
                            ▼
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider text-xs"
                >
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
