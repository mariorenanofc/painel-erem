import { motion } from "framer-motion";
import { TrilhaFiltersProps } from "@/src/types/index";

export default function TrilhaFilters({
  busca,
  setBusca,
  filtroTurma,
  setFiltroTurma,
  filtroStatus,
  setFiltroStatus,
  exportarListaFrequencia,
  mostrarComObs,
  setMostrarComObs,
  mostrarSemWhats,
  setMostrarSemWhats,
}: TrilhaFiltersProps & {
  mostrarSemWhats?: boolean;
  setMostrarSemWhats?: (val: boolean) => void;
}) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2.5rem] shadow-lg border border-slate-200/60 dark:border-white/5 backdrop-blur-md mb-8 flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-end">
      
      <div className="flex flex-col md:flex-row flex-wrap gap-5 w-full flex-1 items-start md:items-end">
        {/* Search */}
        <div className="w-full md:flex-1 md:min-w-[200px] lg:max-w-xs space-y-1.5 text-left">
          <label className="block text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest">
            Buscar Aluno
          </label>
          <input
            type="text"
            placeholder="🔍 Nome ou Matrícula..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all text-sm shadow-sm placeholder:text-slate-400"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        
        {/* Turma */}
        <div className="w-full md:w-52 shrink-0 space-y-1.5 text-left">
          <label className="block text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest">
            Turma
          </label>
          <div className="relative">
            <select
              className="cursor-pointer w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-205 rounded-xl p-3.5 pr-10 focus:border-blue-550 outline-none transition-all text-sm appearance-none shadow-sm font-bold"
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todas as Turmas</option>
              <option value="Turma 1 - 1º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 1 - 1º Ano</option>
              <option value="Turma 2 - 2º Ano" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Turma 2 - 2º Ano</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
              ▼
            </div>
          </div>
        </div>
        
        {/* Status */}
        <div className="w-full md:w-52 shrink-0 space-y-1.5 text-left">
          <label className="block text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest">
            Status
          </label>
          <div className="relative">
            <select
              className="cursor-pointer w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-205 rounded-xl p-3.5 pr-10 focus:border-blue-550 outline-none transition-all text-sm appearance-none shadow-sm font-bold"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todos os Status</option>
              <option value="Ativo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🟢 Ativos</option>
              <option value="Inscrito" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🔵 Inscritos</option>
              <option value="Reserva" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🟡 Reservas</option>
              <option value="Desistente" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🔴 Desistentes</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Checkbox filters */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3.5 h-auto md:h-12 mb-1 mt-2.5 md:mt-0">
          <label className="flex items-center gap-2.5 cursor-pointer text-amber-600 dark:text-amber-500 bg-white/70 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-950 transition-colors text-xs font-black uppercase tracking-wider shrink-0 shadow-sm">
            <input
              type="checkbox"
              checked={mostrarComObs}
              onChange={(e) => setMostrarComObs(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 w-4.5 h-4.5 cursor-pointer bg-slate-100 dark:bg-slate-900"
            />
            ⚠️ Com Obs
          </label>

          {setMostrarSemWhats && (
            <label className="flex items-center gap-2.5 cursor-pointer text-rose-500 bg-white/70 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-950 transition-colors text-xs font-black uppercase tracking-wider shrink-0 shadow-sm">
              <input
                type="checkbox"
                checked={mostrarSemWhats}
                onChange={(e) => setMostrarSemWhats(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-rose-500 focus:ring-rose-500 w-4.5 h-4.5 cursor-pointer bg-slate-100 dark:bg-slate-900"
              />
              ❌ Sem Whats
            </label>
          )}
        </div>
      </div>
      
      {/* Export button */}
      <div className="w-full xl:w-auto shrink-0 mt-2 xl:mt-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportarListaFrequencia}
          className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          📄 Baixar Chamada
        </motion.button>
      </div>
    </div>
  );
}