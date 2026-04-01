export default function TrilhaStatsCards({
  totalInscritos,
  totalTurma1Ativos,
  totalTurma2Ativos,
}: {
  totalInscritos: number;
  totalTurma1Ativos: number;
  totalTurma2Ativos: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
        <h3 className="text-sm font-bold text-slate-500 uppercase">Total de Inscritos</h3>
        <p className="text-3xl font-black text-slate-800">{totalInscritos}</p>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
        <h3 className="text-sm font-bold text-slate-500 uppercase">Ativos: Turma 1 (1º Ano)</h3>
        <p className="text-3xl font-black text-slate-800">
          {totalTurma1Ativos} <span className="text-sm font-medium text-slate-400">/ 30 vagas</span>
        </p>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
        <h3 className="text-sm font-bold text-slate-500 uppercase">Ativos: Turma 2 (2º Ano)</h3>
        <p className="text-3xl font-black text-slate-800">
          {totalTurma2Ativos} <span className="text-sm font-medium text-slate-400">/ 30 vagas</span>
        </p>
      </div>
    </div>
  );
}