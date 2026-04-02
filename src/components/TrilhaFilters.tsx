import { TrilhaFiltersProps } from '@/src/types';

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
}: TrilhaFiltersProps) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-end">
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 items-end">
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Buscar
          </label>
          <input
            type="text"
            placeholder="🔍 Nome ou Matrícula..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Turma
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          >
            <option value="">Todas as Turmas</option>
            <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
            <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Status
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

        {/* CHECKBOX: COM OBSERVAÇÕES */}
        <div className="w-full md:w-auto flex items-center h-10 mb-1">
          <label className="flex items-center gap-2 cursor-pointer text-amber-400 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100  hover:text-amber-600 transition-colors">
            <input
              type="checkbox"
              checked={mostrarComObs}
              onChange={(e) => setMostrarComObs(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            ⚠️ Com pendências/obs
          </label>
        </div>
      </div>
      <div className="w-full md:w-auto">
        <button
          onClick={exportarListaFrequencia}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
        >
          📄 Baixar Chamada
        </button>
      </div>
    </div>
  );
}
