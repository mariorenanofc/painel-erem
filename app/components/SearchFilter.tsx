interface SearchFilterProps {
  turmaSelecionada: string;
  setTurmaSelecionada: (val: string) => void;
  busca: string;
  setBusca: (val: string) => void;
  abrirModalNovoAluno: () => void;
}

export default function SearchFilter({ turmaSelecionada, setTurmaSelecionada, busca, setBusca, abrirModalNovoAluno }: SearchFilterProps) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-end">
      
      {/* Grupo de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Filtrar por Turma</label>
          <select 
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none font-medium"
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

        <div className="w-full md:w-80">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Buscar Aluno</label>
          <input 
            type="text" 
            placeholder="🔍 Nome ou Matrícula..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Botão de Nova Ação */}
      <button 
        onClick={abrirModalNovoAluno}
        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl leading-none">+</span> Cadastrar Aluno
      </button>

    </div>
  );
}