import { useState, useMemo } from "react";
import { Atividade } from "../types";

interface MissoesListProps {
  atividades: Atividade[];
  isLoading: boolean;
  turmasDisponiveis: string[];
  onEdit: (ativ: Atividade) => void;
  onDelete: (id: string) => void;
  onViewEntregas: (ativ: Atividade) => void;
}

export default function MissoesList({
  atividades,
  isLoading,
  turmasDisponiveis,
  onEdit,
  onDelete,
  onViewEntregas,
}: MissoesListProps) {
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroPrazo, setFiltroPrazo] = useState("Todas");
  const [filtroStatusPub, setFiltroStatusPub] = useState("Todos"); // <--- NOVO FILTRO RASCUNHO/PUBLICADA

  const [missaoPreview, setMissaoPreview] = useState<Atividade | null>(null);

  const atividadesFiltradas = useMemo(() => {
    const hoje = new Date();
    const hojeTime = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    ).getTime();

    const diaDaSemana = hoje.getDay();
    const diasAteDomingo = diaDaSemana === 0 ? 0 : 7 - diaDaSemana;
    const fimDaSemana = new Date(hojeTime);
    fimDaSemana.setDate(fimDaSemana.getDate() + diasAteDomingo);
    const fimDaSemanaTime = fimDaSemana.getTime();

    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    return atividades.filter((ativ) => {
      const matchBusca = ativ.titulo
        .toLowerCase()
        .includes(busca.toLowerCase());
      if (!matchBusca) return false;

      const matchTurma =
        filtroTurma === "Todas" ||
        ativ.turmaAlvo === "Todas" ||
        ativ.turmaAlvo === filtroTurma;
      if (!matchTurma) return false;

      const matchTipo = filtroTipo === "Todos" || ativ.tipo === filtroTipo;
      if (!matchTipo) return false;

      // Filtro de Rascunho / Publicada
      const statusPub = ativ.statusPublicacao || "Publicada";
      const matchStatusPub =
        filtroStatusPub === "Todos" || statusPub === filtroStatusPub;
      if (!matchStatusPub) return false;

      if (filtroPrazo !== "Todas") {
        if (!ativ.dataLimite) return false;

        const [y, m, d] = ativ.dataLimite.split("-");
        const dataLimiteAtiv = new Date(Number(y), Number(m) - 1, Number(d));
        const ativTime = dataLimiteAtiv.getTime();

        if (filtroPrazo === "Hoje") {
          if (ativTime !== hojeTime) return false;
        } else if (filtroPrazo === "Semana") {
          if (ativTime < hojeTime || ativTime > fimDaSemanaTime) return false;
        } else if (filtroPrazo === "Mes") {
          if (
            dataLimiteAtiv.getMonth() !== mesAtual ||
            dataLimiteAtiv.getFullYear() !== anoAtual
          )
            return false;
        } else if (filtroPrazo === "Atrasadas") {
          if (ativTime < hojeTime) return false;
        }
      }

      return true;
    });
  }, [
    atividades,
    busca,
    filtroTurma,
    filtroTipo,
    filtroPrazo,
    filtroStatusPub,
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-0 mb-4 bg-transparent flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por título..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* NOVO SELECT DE STATUS DE PUBLICAÇÃO */}
          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filtroStatusPub}
              onChange={(e) => setFiltroStatusPub(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-bold shadow-sm"
            >
              <option value="Todos">👁️ Todos os Status</option>
              <option value="Publicada">🚀 Publicadas</option>
              <option value="Rascunho">📝 Rascunhos</option>
            </select>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filtroPrazo}
              onChange={(e) => setFiltroPrazo(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium shadow-sm"
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
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
            >
              <option value="Todas">Todas as Turmas</option>
              {turmasDisponiveis.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border text-slate-800 border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Projeto">Projetos</option>
              <option value="Quiz">Quizzes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 text-sm font-medium">
              Carregando missões...
            </p>
          </div>
        ) : atividadesFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
            <span className="text-5xl mb-4 block opacity-50">📭</span>
            <p className="text-slate-600 font-bold">
              Nenhuma missão encontrada.
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Tente ajustar os filtros acima.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {atividadesFiltradas.map((ativ) => {
              const isRascunho = ativ.statusPublicacao === "Rascunho";

              return (
                <div
                  key={ativ.id}
                  className={`bg-white border ${isRascunho ? "border-yellow-200" : "border-slate-200"} rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 group`}
                >
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        {ativ.id}
                      </span>

                      {/* BADGES DE STATUS DE PUBLICAÇÃO */}
                      {isRascunho ? (
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-yellow-300 shadow-sm animate-pulse">
                          📝 Rascunho
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-blue-300 shadow-sm">
                          🚀 Publicada
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${ativ.tipo === "Quiz" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}
                      >
                        {ativ.tipo}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-200 tracking-wider">
                        ⭐ {ativ.xp} XP
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200">
                        📅 Prazo:{" "}
                        {ativ.dataLimite
                          ? ativ.dataLimite.split("-").reverse().join("/")
                          : "Sem prazo"}
                      </span>
                    </div>
                    <h4
                      className={`font-bold text-lg leading-tight ${isRascunho ? "text-slate-400" : "text-slate-800"}`}
                    >
                      {ativ.titulo}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {ativ.descricao}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between min-w-[160px] gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="flex gap-2 w-full justify-end opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(ativ)}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar Missão"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(ativ.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Missão"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => setMissaoPreview(ativ)}
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
                      >
                        👀 Ver como Aluno
                      </button>
                      <button
                        onClick={() => onViewEntregas(ativ)}
                        className="cursor-pointer w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                      >
                        Ver Entregas
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE PREVIEW */}
      {missaoPreview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-widest text-center py-1">
              Modo de Visualização do Aluno
            </div>

            <div
              className={`p-4 border-b flex justify-between items-center text-white ${missaoPreview.tipo === "Quiz" ? "bg-amber-600" : "bg-blue-600"}`}
            >
              <h2 className="font-bold text-lg">
                🎯 {missaoPreview.tipo}: {missaoPreview.titulo}
              </h2>
              <button
                onClick={() => setMissaoPreview(null)}
                className="cursor-pointer text-2xl leading-none hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex gap-4 mb-4 text-sm font-bold">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded border border-slate-200">
                  ID: {missaoPreview.id}
                </span>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded border border-emerald-200">
                  ⭐ {missaoPreview.xp} XP Possíveis
                </span>
              </div>

              <div className="text-slate-700 whitespace-pre-wrap font-mono text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed shadow-inner">
                {missaoPreview.descricao}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-800 mb-3 uppercase text-sm">
                  Visão do Formulário:
                </h3>

                {missaoPreview.tipo === "Quiz" ? (
                  <div className="space-y-3">
                    {["A", "B", "C", "D"].map((letra) => {
                      const opcaoTexto =
                        missaoPreview[`opcao${letra}` as keyof Atividade];
                      return opcaoTexto ? (
                        <label
                          key={letra}
                          className="flex items-start p-3 rounded-lg border bg-white border-slate-300 cursor-not-allowed opacity-80"
                        >
                          <input type="radio" disabled className="mt-1 mr-3" />
                          <div className="flex-1 overflow-x-auto">
                            <strong className="text-slate-700 mr-2">
                              {letra})
                            </strong>
                            <code className="text-slate-600 font-mono text-xs whitespace-pre-wrap leading-tight">
                              {opcaoTexto}
                            </code>
                          </div>
                        </label>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Cole o link do seu projeto (GitHub, Replit, etc):
                    </label>
                    <input
                      type="url"
                      disabled
                      placeholder="https://..."
                      className="w-full bg-slate-100 border border-slate-300 text-slate-800 rounded p-3 cursor-not-allowed opacity-80"
                    />
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setMissaoPreview(null)}
                    className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"
                  >
                    Fechar Visualização
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
