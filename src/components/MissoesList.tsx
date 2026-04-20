import { useState, useMemo } from "react";
import { Atividade } from "../types";

interface MissoesListProps {
  atividades: Atividade[];
  isLoading: boolean;
  turmasDisponiveis: string[];
  onEdit: (ativ: Atividade) => void;
  onDelete: (id: string) => void;
  onViewEntregas: (ativ: Atividade) => void;
  onViewRanking: () => void;
  onViewFrequencia: () => void;
  onNavigateAnalytics: () => void;
}

export default function MissoesList({
  atividades,
  isLoading,
  turmasDisponiveis,
  onEdit,
  onDelete,
  onViewEntregas,
  onViewRanking,
  onViewFrequencia,
  onNavigateAnalytics,
}: MissoesListProps) {
  // Estados Locais dos Filtros
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroPrazo, setFiltroPrazo] = useState("Todas");

  // Lógica inteligente de filtragem (Executada localmente para ser ultra rápida)
  const atividadesFiltradas = useMemo(() => {
    const hoje = new Date();
    const hojeTime = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    
    // Fim da semana (Domingo)
    const diaDaSemana = hoje.getDay();
    const diasAteDomingo = diaDaSemana === 0 ? 0 : 7 - diaDaSemana;
    const fimDaSemana = new Date(hojeTime);
    fimDaSemana.setDate(fimDaSemana.getDate() + diasAteDomingo);
    const fimDaSemanaTime = fimDaSemana.getTime();

    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    return atividades.filter((ativ) => {
      // 1. Filtro de Busca
      const matchBusca = ativ.titulo.toLowerCase().includes(busca.toLowerCase());
      if (!matchBusca) return false;

      // 2. Filtro de Turma
      const matchTurma = filtroTurma === "Todas" || ativ.turmaAlvo === "Todas" || ativ.turmaAlvo === filtroTurma;
      if (!matchTurma) return false;

      // 3. Filtro de Tipo
      const matchTipo = filtroTipo === "Todos" || ativ.tipo === filtroTipo;
      if (!matchTipo) return false;

      // 4. Filtro de Prazo (Data Limite)
      if (filtroPrazo !== "Todas") {
        if (!ativ.dataLimite) return false;

        const [y, m, d] = ativ.dataLimite.split('-');
        const dataLimiteAtiv = new Date(Number(y), Number(m) - 1, Number(d));
        const ativTime = dataLimiteAtiv.getTime();

        if (filtroPrazo === "Hoje") {
          if (ativTime !== hojeTime) return false;
        } else if (filtroPrazo === "Semana") {
          if (ativTime < hojeTime || ativTime > fimDaSemanaTime) return false;
        } else if (filtroPrazo === "Mes") {
          if (dataLimiteAtiv.getMonth() !== mesAtual || dataLimiteAtiv.getFullYear() !== anoAtual) return false;
        } else if (filtroPrazo === "Atrasadas") {
          if (ativTime >= hojeTime) return false;
        }
      }

      return true;
    });
  }, [atividades, busca, filtroTurma, filtroTipo, filtroPrazo]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      {/* CABEÇALHO E BOTÕES RÁPIDOS */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>📚</span> Missões Publicadas
          </h3>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button onClick={onViewRanking} className="flex-1 xl:flex-none bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex justify-center items-center gap-2">
              <span>🏆</span> Ranking
            </button>
            <button onClick={onViewFrequencia} className="flex-1 xl:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex justify-center items-center gap-2">
              <span>📍</span> Frequência
            </button>
            <button onClick={onNavigateAnalytics} className="flex-1 xl:flex-none bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex justify-center items-center gap-2">
              <span>📈</span> Analytics
            </button>
          </div>
        </div>

        {/* ÁREA DE FILTROS (Responsiva com flex-wrap) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por título..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filtroPrazo}
              onChange={(e) => setFiltroPrazo(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium"
            >
              <option value="Todas">🗓️ Todos os Prazos</option>
              <option value="Hoje">⚠️ Vence Hoje</option>
              <option value="Semana">📅 Vence nesta Semana</option>
              <option value="Mes">📆 Vence neste Mês</option>
              <option value="Atrasadas">❌ Prazos Encerrados</option>
            </select>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
            >
              <option value="Todas">Todas as Turmas</option>
              {turmasDisponiveis.map(turma => (
                <option key={turma} value={turma}>{turma}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Projeto">Projetos</option>
              <option value="Quiz">Quizzes</option>
            </select>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE ATIVIDADES */}
      <div className="p-5 h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 text-sm font-medium">Carregando missões...</p>
          </div>
        ) : atividadesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <span className="text-4xl mb-3 block">📭</span>
            <p className="text-slate-500 font-medium">Nenhuma missão encontrada para estes filtros.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atividadesFiltradas.map((ativ) => (
              <div
                key={ativ.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4 group"
              >
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {ativ.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${ativ.tipo === "Quiz" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                      {ativ.tipo}
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                      ⭐ {ativ.xp} XP
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-slate-500 bg-slate-100 border border-slate-200">
                      📅 Prazo: {ativ.dataLimite ? ativ.dataLimite.split('-').reverse().join('/') : "Sem prazo"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">{ativ.titulo}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{ativ.descricao}</p>
                </div>
                
                <div className="flex flex-col items-end justify-between min-w-[140px] gap-3">
                  <div className="flex gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(ativ)}
                      className="p-2 text-slate-400 hover:text-amber-500 bg-white rounded shadow-sm border border-slate-200 transition-colors"
                      title="Editar Missão"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(ativ.id)}
                      className="p-2 text-slate-400 hover:text-red-500 bg-white rounded shadow-sm border border-slate-200 transition-colors"
                      title="Excluir Missão"
                    >
                      🗑️
                    </button>
                  </div>
                  <button
                    onClick={() => onViewEntregas(ativ)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 px-4 rounded shadow-md transition-all active:scale-95"
                  >
                    Ver Entregas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}