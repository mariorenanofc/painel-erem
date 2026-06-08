/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { Atividade, MissoesListProps } from "../types";

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
  const [filtroStatusPub, setFiltroStatusPub] = useState("Todos");
  const [filtroPendentes, setFiltroPendentes] = useState(false); // 🔥 NOVO ESTADO DE PENDÊNCIAS

  const [filtrosAvançadosAbertos, setFiltrosAvançadosAbertos] = useState(false);
  const [missaoPreview, setMissaoPreview] = useState<Atividade | null>(null);

  // Estados dos Acordeões
  const [modulosAbertos, setModulosAbertos] = useState<Record<string, boolean>>(
    {},
  );
  const [aulasAbertas, setAulasAbertas] = useState<Record<string, boolean>>({});

  const toggleModulo = (mod: string) => {
    setModulosAbertos((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  const toggleAula = (aulaChave: string) => {
    setAulasAbertas((prev) => ({ ...prev, [aulaChave]: !prev[aulaChave] }));
  };

  const atividadesFiltradas = useMemo(() => {
    return atividades.filter((ativ) => {
      const matchBusca = ativ.titulo
        .toLowerCase()
        .includes(busca.toLowerCase());
      const matchTurma =
        filtroTurma === "Todas" ||
        ativ.turmaAlvo === "Todas" ||
        ativ.turmaAlvo === filtroTurma;
      const matchTipo = filtroTipo === "Todos" || ativ.tipo === filtroTipo;
      const matchStatus =
        filtroStatusPub === "Todos" ||
        ativ.statusPublicacao === filtroStatusPub;

      // 🔥 LÓGICA DO FILTRO DE PENDÊNCIAS
      const qtdPendentes = (ativ as any).pendentes || 0;
      const matchPendentes = filtroPendentes ? qtdPendentes > 0 : true;

      return (
        matchBusca && matchTurma && matchTipo && matchStatus && matchPendentes
      );
    });
  }, [
    atividades,
    busca,
    filtroTurma,
    filtroTipo,
    filtroStatusPub,
    filtroPendentes,
  ]);

  // Agrupamento Duplo: Módulo -> Aula -> Missões
  const arvoreDeMissoes = useMemo(() => {
    const arvore: Record<string, Record<string, Atividade[]>> = {};

    atividadesFiltradas.forEach((ativ) => {
      const modulo =
        ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Módulo Geral";

      // Extrai "Aula 01" do título "[Aula 01] Desafio..."
      const match = ativ.titulo.match(/^\[(Aula\s*\d+)\]/i);
      const aula = match ? match[1] : "Outras Atividades";

      if (!arvore[modulo]) arvore[modulo] = {};
      if (!arvore[modulo][aula]) arvore[modulo][aula] = [];

      arvore[modulo][aula].push(ativ);
    });

    return arvore;
  }, [atividadesFiltradas]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span className="ml-3 text-slate-500 dark:text-slate-400 font-medium">
          Carregando missões...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE PESQUISA E FILTROS PRINCIPAIS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por título ou palavra-chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="cursor-pointer w-full md:w-48 py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
          >
            <option value="Todas">Todas as Turmas</option>
            {turmasDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* 🔥 NOVO BOTÃO DE PENDÊNCIAS RÁPIDO */}
          <button
            onClick={() => setFiltroPendentes(!filtroPendentes)}
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold border transition-colors whitespace-nowrap ${filtroPendentes ? "bg-red-500 dark:bg-red-600 text-white border-red-600 dark:border-red-500 shadow-inner" : "bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
          >
            {filtroPendentes ? "🚨 Limpar Filtro" : "🚨 Só Pendentes"}
          </button>

          <button
            onClick={() => setFiltrosAvançadosAbertos(!filtrosAvançadosAbertos)}
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${filtrosAvançadosAbertos ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            Filtros ⚙️
          </button>
        </div>

        {/* FILTROS AVANÇADOS (Colapsáveis) */}
        {filtrosAvançadosAbertos && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in transition-colors">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                Tipo de Missão
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="cursor-pointer w-full py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 transition-colors"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="Projeto">Projeto Prático</option>
                <option value="Quiz">Quiz Interativo</option>
                <option value="Material">Material de Apoio</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                Status de Publicação
              </label>
              <select
                value={filtroStatusPub}
                onChange={(e) => setFiltroStatusPub(e.target.value)}
                className="cursor-pointer w-full py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 transition-colors"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Publicada">Publicadas</option>
                <option value="Rascunho">Rascunhos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* LISTAGEM DUPLO ACORDEÃO */}
      {Object.keys(arvoreDeMissoes).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
          <div className="text-4xl mb-2 opacity-50">📭</div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Nenhuma missão encontrada com estes filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(arvoreDeMissoes).map(([nomeModulo, aulas]) => {
            // 🔥 AUTO-EXPANSÃO: Se o filtro de pendentes estiver ativo, abre tudo automaticamente!
            const isModuloAberto =
              filtroPendentes || modulosAbertos[nomeModulo] || false;
            const qtdMissoesModulo = Object.values(aulas).reduce(
              (acc, miss) => acc + miss.length,
              0,
            );

            return (
              <div
                key={nomeModulo}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* CABEÇALHO DO MÓDULO */}
                <div
                  onClick={() => toggleModulo(nomeModulo)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 p-4 flex justify-between items-center cursor-pointer select-none transition-colors border-b border-slate-200 dark:border-slate-700"
                >
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">📚</span>{" "}
                    {nomeModulo}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full transition-colors">
                      {qtdMissoesModulo} itens
                    </span>
                    <span
                      className={`text-slate-500 dark:text-slate-400 font-bold transition-transform ${isModuloAberto ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* CORPO DO MÓDULO (Lista de Aulas) */}
                {isModuloAberto && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 flex flex-col transition-colors">
                    {Object.entries(aulas)
                      .sort(([a], [b]) =>
                        a === "Outras Atividades"
                          ? 1
                          : b === "Outras Atividades"
                            ? -1
                            : a.localeCompare(b),
                      )
                      .map(([nomeAula, missoes]) => {
                        const aulaChave = `${nomeModulo}-${nomeAula}`;
                        // 🔥 AUTO-EXPANSÃO DAS AULAS
                        const isAulaAberta =
                          filtroPendentes || aulasAbertas[aulaChave] || false;

                        return (
                          <div
                            key={aulaChave}
                            className="border-b border-slate-200 dark:border-slate-800/50 last:border-0"
                          >
                            {/* CABEÇALHO DA AULA */}
                            <div
                              onClick={() => toggleAula(aulaChave)}
                              className="p-3 pl-6 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex justify-between items-center cursor-pointer select-none transition-colors"
                            >
                              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-md flex items-center gap-2">
                                <span className="text-slate-400 dark:text-slate-500">
                                  📄
                                </span>{" "}
                                {nomeAula}
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                  {missoes.length} missoes
                                </span>
                                <span
                                  className={`text-slate-400 dark:text-slate-500 text-xs transition-transform ${isAulaAberta ? "rotate-180" : ""}`}
                                >
                                  ▼
                                </span>
                              </div>
                            </div>

                            {/* CORPO DA AULA (Lista de Missões Compactas) */}
                            {isAulaAberta && (
                              <div className="bg-white dark:bg-slate-900 p-2 pl-8 space-y-2 border-t border-slate-100 dark:border-slate-800 shadow-inner transition-colors">
                                {missoes.map((ativ) => {
                                  const isRascunho =
                                    ativ.statusPublicacao === "Rascunho";
                                  const qtdPendentes =
                                    (ativ as any).pendentes || 0;

                                  return (
                                    <div
                                      key={ativ.id}
                                      className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md ${isRascunho ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10" : qtdPendentes > 0 ? "border-red-200 dark:border-red-800/50 bg-red-50/10 dark:bg-red-900/10 hover:border-red-400" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500"}`}
                                    >
                                      <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-colors ${ativ.tipo === "Quiz" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-800/50" : ativ.tipo === "Material" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800/50" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-500 border-blue-200 dark:border-blue-800/50"}`}
                                          >
                                            {ativ.tipo}
                                          </span>
                                          {isRascunho && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-700 dark:bg-slate-600 text-white shadow-sm transition-colors">
                                              Rascunho
                                            </span>
                                          )}
                                          {/* 🔥 BADGE DE PENDÊNCIAS COM ANIMAÇÃO */}
                                          {qtdPendentes > 0 && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 shadow-sm animate-pulse transition-colors">
                                              {qtdPendentes} Para Corrigir
                                            </span>
                                          )}
                                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                            ID:{" "}
                                            {ativ.id?.split("-")[1] || ativ.id}
                                          </span>
                                        </div>
                                        <h5
                                          className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                          onClick={() => setMissaoPreview(ativ)}
                                        >
                                          {ativ.titulo}
                                        </h5>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium transition-colors">
                                          <span className="text-emerald-600 dark:text-emerald-500 font-bold">
                                            ⭐ {ativ.xp} XP
                                          </span>
                                          <span>👥 {ativ.turmaAlvo}</span>
                                          {ativ.dataLimite && (
                                            <span>⏳ {ativ.dataLimite}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* BOTÕES DE AÇÃO COMPACTOS */}
                                      <div className="flex gap-2 mt-3 md:mt-0 shrink-0">
                                        <button
                                          onClick={() => setMissaoPreview(ativ)}
                                          className="cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                          title="Visualizar Detalhes"
                                        >
                                          👁️
                                        </button>
                                        <button
                                          onClick={() => onViewEntregas(ativ)}
                                          className="cursor-pointer p-2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors relative"
                                          title="Corrigir Entregas"
                                        >
                                          📝
                                          {qtdPendentes > 0 && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                                          )}
                                        </button>
                                        <button
                                          onClick={() => onEdit(ativ)}
                                          className="cursor-pointer p-2 text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                                          title="Editar Atividade"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => onDelete(ativ.id!)}
                                          className="cursor-pointer p-2 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                          title="Excluir"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE PREVIEW MANTIDO INTACTO COM DARK MODE */}
      {missaoPreview && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center transition-colors">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                Detalhes da Missão
              </h3>
              <button
                onClick={() => setMissaoPreview(null)}
                className="cursor-pointer text-2xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-500 transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 transition-colors">
                {missaoPreview.titulo}
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-wrap transition-colors">
                {missaoPreview.descricao}
              </div>
              <button
                onClick={() => setMissaoPreview(null)}
                className="cursor-pointer w-full py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
