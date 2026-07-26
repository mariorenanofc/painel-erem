import { motion } from "framer-motion";
import { SearchFilterProps } from "../types";

export default function SearchFilter({ 
  turmaSelecionada, 
  setTurmaSelecionada, 
  busca, 
  setBusca, 
  mostrarSemEmail,
  setMostrarSemEmail,
  mostrarComObs,
  setMostrarComObs,
  abrirModalNovoAluno,
  exportarDados 
}: SearchFilterProps) {
  
  return (
    <div className="bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2.5rem] shadow-lg border border-slate-200/60 dark:border-white/5 backdrop-blur-md mb-8 flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-end">
      
      <div className="flex flex-col md:flex-row flex-wrap gap-5 w-full xl:w-auto flex-1 items-start md:items-end">
        {/* Turma Dropdown */}
        <div className="w-full md:flex-1 md:min-w-[200px] lg:max-w-xs space-y-1.5 text-left">
          <label className="block text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest">
            Filtrar por Turma
          </label>
          <div className="relative">
            <select 
              className="cursor-pointer w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-205 rounded-xl p-3.5 pr-10 focus:border-blue-500 outline-none transition-all text-sm appearance-none shadow-sm font-bold"
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🏫 Todas as Turmas</option>
              <option value="1º ANO A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO A</option>
              <option value="1º ANO B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO B</option>
              <option value="1º ANO C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO C</option>
              <option value="1º ANO D" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">1º ANO D</option>
              <option value="2º ANO A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">2º ANO A</option>
              <option value="2º ANO B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">2º ANO B</option>
              <option value="2º ANO C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">2º ANO C</option>
              <option value="3º ANO A" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO A</option>
              <option value="3º ANO B" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO B</option>
              <option value="3º ANO C" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO C</option>
              <option value="3º ANO D" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">3º ANO D</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="w-full md:flex-1 md:min-w-[220px] lg:max-w-sm space-y-1.5 text-left">
          <label className="block text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest">
            Buscar Aluno
          </label>
          <input 
            type="text" 
            placeholder="🔍 Nome ou Matrícula..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all text-sm shadow-sm placeholder:text-slate-400"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Checkboxes */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3.5 h-auto md:h-12 mb-1 mt-2.5 md:mt-0">
          <label className="flex items-center gap-2.5 cursor-pointer bg-white/70 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-950 transition-colors text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 shrink-0 shadow-sm">
            <input 
              type="checkbox" 
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer bg-slate-100 dark:bg-slate-900"
              checked={mostrarSemEmail}
              onChange={(e) => setMostrarSemEmail(e.target.checked)}
            />
            <span className="select-none">Sem Email</span>
          </label>

          {setMostrarComObs && (
            <label className="flex items-center gap-2.5 cursor-pointer text-amber-600 dark:text-amber-500 bg-white/70 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-950 transition-colors text-xs font-black uppercase tracking-wider shrink-0 shadow-sm">
              <input
                type="checkbox"
                checked={mostrarComObs}
                onChange={(e) => setMostrarComObs(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 w-4.5 h-4.5 cursor-pointer bg-slate-100 dark:bg-slate-900"
              />
              ⚠️ Com Obs
            </label>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3.5 shrink-0 mt-2 xl:mt-0">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportarDados}
          className="cursor-pointer w-full sm:w-auto bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-black py-3.5 px-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          📄 Exportar Dados
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={abrirModalNovoAluno}
          className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-110 text-white font-black py-3.5 px-7 rounded-2xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          <span className="text-sm leading-none">+</span> Cadastrar Aluno
        </motion.button>
      </div>

    </div>
  );
}