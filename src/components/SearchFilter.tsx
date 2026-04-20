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
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end">
      
      <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full xl:w-auto flex-1 items-start md:items-end">
        <div className="w-full md:flex-1 md:min-w-[200px] lg:max-w-xs">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Filtrar por Turma</label>
          <select 
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-medium transition-all"
            value={turmaSelecionada}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
          >
            <option value="">🏫 Todas as Turmas</option>
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

        <div className="w-full md:flex-1 md:min-w-[220px] lg:max-w-sm">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Buscar Aluno</label>
          <input 
            type="text" 
            placeholder="🔍 Nome ou Matrícula..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-3 h-auto md:h-10 mb-1 mt-2 md:mt-0">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
              checked={mostrarSemEmail}
              onChange={(e) => setMostrarSemEmail(e.target.checked)}
            />
            <span className="text-sm font-bold text-slate-600 select-none">Apenas Sem Email</span>
          </label>

          {setMostrarComObs && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-amber-500 text-sm font-bold shrink-0">
              <input
                type="checkbox"
                checked={mostrarComObs}
                onChange={(e) => setMostrarComObs(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              ⚠️ Com pendências/obs
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 shrink-0 mt-4 xl:mt-0">
        <button 
          onClick={exportarDados}
          className="cursor-pointer w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-lg shadow-sm border border-slate-300 transition-colors flex items-center justify-center gap-2"
        >
           Exportar/Baixar
        </button>
        <button 
          onClick={abrirModalNovoAluno}
          className="cursor-pointer w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Cadastrar
        </button>
      </div>

    </div>
  );
}