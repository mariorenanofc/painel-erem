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
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end">
      
      <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full flex-1 items-start md:items-end">
        <div className="w-full md:flex-1 md:min-w-[200px] lg:max-w-xs">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Buscar
          </label>
          <input
            type="text"
            placeholder="🔍 Nome ou Matrícula..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48 shrink-0">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Turma
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          >
            <option value="">Todas as Turmas</option>
            <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
            <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
          </select>
        </div>
        
        <div className="w-full md:w-48 shrink-0">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Status
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="Ativo">🟢 Ativos</option>
            <option value="Inscrito">🔵 Inscritos</option>
            <option value="Reserva">🟡 Reservas</option>
            <option value="Desistente">🔴 Desistentes</option>
          </select>
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-3 h-auto md:h-10 mb-1 mt-2 md:mt-0">
          <label className="flex items-center gap-2 cursor-pointer text-amber-500 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 hover:text-amber-600 transition-colors text-sm font-bold shrink-0">
            <input
              type="checkbox"
              checked={mostrarComObs}
              onChange={(e) => setMostrarComObs(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            ⚠️ Com pendências/obs
          </label>

          {setMostrarSemWhats && (
            <label className="flex items-center gap-2 cursor-pointer text-red-500 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 hover:text-red-700 transition-colors text-sm font-bold shrink-0">
              <input
                type="checkbox"
                checked={mostrarSemWhats}
                onChange={(e) => setMostrarSemWhats(e.target.checked)}
                className="rounded border-slate-300 text-red-500 focus:ring-red-500 w-4 h-4 cursor-pointer"
              />
              ❌ Sem WhatsApp
            </label>
          )}
        </div>
      </div>
      
      <div className="w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
        <button
          onClick={exportarListaFrequencia}
          className="cursor-pointer w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
        >
          📄 Baixar Chamada
        </button>
      </div>
    </div>
  );
}