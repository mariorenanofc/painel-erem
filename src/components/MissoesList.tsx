/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { Atividade, MissoesListProps } from "../types";
import { motion, AnimatePresence } from "framer-motion";

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
  const [filtroPendentes, setFiltroPendentes] = useState(false);

  const [filtrosAvançadosAbertos, setFiltrosAvançadosAbertos] = useState(false);
  const [missaoPreview, setMissaoPreview] = useState<Atividade | null>(null);

  // Estados dos Acordeões
  const [modulosAbertos, setModulosAbertos] = useState<Record<string, boolean>>({});
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
      <div className="flex flex-col justify-center items-center py-16">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <span className="mt-4 text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide">
          Carregando missões do TrilhaTech...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BARRA DE PESQUISA E FILTROS PRINCIPAIS */}
      <div className="glass-panel-heavy bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xl flex flex-col gap-4 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por título ou palavra-chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
          <select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="cursor-pointer w-full md:w-48 py-2.5 px-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
          >
            <option value="Todas">Todas as Turmas</option>
            {turmasDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* 🔥 BOTAO DE PENDENCIAS RAPIDO */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFiltroPendentes(!filtroPendentes)}
            className={`cursor-pointer px-5 py-2.5 rounded-2xl text-sm font-black border transition-colors whitespace-nowrap ${
              filtroPendentes
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent shadow-md shadow-red-500/20"
                : "bg-white dark:bg-slate-900/40 text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-955/35"
            }`}
          >
            {filtroPendentes ? "🚨 Limpar Filtro" : "🚨 Só Pendentes"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFiltrosAvançadosAbertos(!filtrosAvançadosAbertos)}
            className={`cursor-pointer px-5 py-2.5 rounded-2xl text-sm font-black border transition-colors ${
              filtrosAvançadosAbertos
                ? "bg-slate-800 dark:bg-slate-700 text-white border-transparent"
                : "bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            Filtros ⚙️
          </motion.button>
        </div>

        {/* FILTROS AVANCADOS (Colapsaveis) */}
        <AnimatePresence>
          {filtrosAvançadosAbertos && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/50">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">
                    Tipo de Missão
                  </label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="cursor-pointer w-full py-2 px-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Todos">Todos os Tipos</option>
                    <option value="Projeto">Mini projeto</option>
                    <option value="Quiz">Quiz Interativo</option>
                    <option value="Material">Material de Apoio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">
                    Status de Publicação
                  </label>
                  <select
                    value={filtroStatusPub}
                    onChange={(e) => setFiltroStatusPub(e.target.value)}
                    className="cursor-pointer w-full py-2 px-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Todos">Todos os Status</option>
                    <option value="Publicada">Publicadas</option>
                    <option value="Rascunho">Rascunhos</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LISTAGEM DUPLO ACORDEAO */}
      {Object.keys(arvoreDeMissoes).length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl transition-colors"
        >
          <div className="text-5xl mb-3 opacity-60">📭</div>
          <p className="text-slate-500 dark:text-slate-400 font-black tracking-tight">
            Nenhuma missão encontrada com estes filtros.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {Object.entries(arvoreDeMissoes).map(([nomeModulo, aulas]) => {
            const isModuloAberto =
              filtroPendentes || modulosAbertos[nomeModulo] || false;
            const qtdMissoesModulo = Object.values(aulas).reduce(
              (acc, miss) => acc + miss.length,
              0,
            );

            return (
              <motion.div
                layout="position"
                key={nomeModulo}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-md overflow-hidden transition-all duration-305"
              >
                {/* CABECALHO DO MODULO */}
                <div
                  onClick={() => toggleModulo(nomeModulo)}
                  className="bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 p-4.5 flex justify-between items-center cursor-pointer select-none transition-colors border-b border-slate-200/60 dark:border-slate-850"
                >
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-sm shadow-inner text-blue-600 dark:text-blue-400">
                      📚
                    </span>{" "}
                    {nomeModulo}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black px-3.5 py-1 rounded-full transition-colors border border-slate-300/30 dark:border-slate-700/50">
                      {qtdMissoesModulo} {qtdMissoesModulo === 1 ? "item" : "itens"}
                    </span>
                    <span
                      className={`text-slate-400 font-black text-xs transition-transform duration-350 ${
                        isModuloAberto ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* CORPO DO MODULO (Lista de Aulas) */}
                <AnimatePresence initial={false}>
                  {isModuloAberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="bg-slate-50/40 dark:bg-slate-950/20 flex flex-col overflow-hidden"
                    >
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
                          const isAulaAberta =
                            filtroPendentes || aulasAbertas[aulaChave] || false;

                          return (
                            <div
                              key={aulaChave}
                              className="border-b border-slate-200/60 dark:border-slate-800/40 last:border-0"
                            >
                              {/* CABECALHO DA AULA */}
                              <div
                                onClick={() => toggleAula(aulaChave)}
                                className="p-3.5 pl-6 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 flex justify-between items-center cursor-pointer select-none transition-colors"
                              >
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                                  <span className="text-slate-400 dark:text-slate-500">
                                    📄
                                  </span>{" "}
                                  {nomeAula}
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-slate-450 dark:text-slate-500 font-bold">
                                    {missoes.length} {missoes.length === 1 ? "missão" : "missões"}
                                  </span>
                                  <span
                                    className={`text-slate-400 text-[10px] transition-transform duration-300 ${
                                      isAulaAberta ? "rotate-180" : ""
                                    }`}
                                  >
                                    ▼
                                  </span>
                                </div>
                              </div>

                              {/* CORPO DA AULA (Lista de Missões Compactas) */}
                              <AnimatePresence initial={false}>
                                {isAulaAberta && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-white/40 dark:bg-slate-900/20 p-3 pl-8 space-y-2 border-t border-slate-100/65 dark:border-slate-800/50 shadow-inner overflow-hidden"
                                  >
                                    {missoes.map((ativ) => {
                                      const isRascunho =
                                        ativ.statusPublicacao === "Rascunho";
                                      const qtdPendentes =
                                        (ativ as any).pendentes || 0;

                                      // Estilos temáticos de borda e sombra baseados no tipo
                                      let themeBorder = "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60";
                                      let glowStyle = "";
                                      if (isRascunho) {
                                        themeBorder = "border-amber-200/80 dark:border-amber-800/40 bg-amber-50/10 dark:bg-amber-900/5";
                                      } else if (qtdPendentes > 0) {
                                        themeBorder = "border-red-300/80 dark:border-red-850 bg-red-50/10 dark:bg-red-950/10";
                                        glowStyle = "shadow-[0_0_15px_rgba(239,68,68,0.06)] hover:border-red-450";
                                      } else if (ativ.tipo === "Quiz") {
                                        glowStyle = "hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]";
                                      } else if (ativ.tipo === "Material") {
                                        glowStyle = "hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]";
                                      } else {
                                        glowStyle = "hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]";
                                      }

                                      return (
                                        <motion.div
                                          whileHover={{ y: -1 }}
                                          key={ativ.id}
                                          className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${themeBorder} ${glowStyle}`}
                                        >
                                          <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                              <span
                                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border transition-colors ${
                                                  ativ.tipo === "Quiz"
                                                    ? "bg-amber-100/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
                                                    : ativ.tipo === "Material"
                                                      ? "bg-emerald-100/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                                                      : "bg-blue-100/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30"
                                                }`}
                                              >
                                                {ativ.tipo}
                                              </span>
                                              {isRascunho && (
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-700 dark:bg-slate-600 text-white shadow-sm">
                                                  Rascunho
                                                </span>
                                              )}
                                              {/* BADGE DE PENDÊNCIAS COM PULSO */}
                                              {qtdPendentes > 0 && (
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-sm animate-pulse">
                                                  {qtdPendentes} Para Corrigir
                                                </span>
                                              )}
                                              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-mono">
                                                ID: {ativ.id?.split("-")[1] || ativ.id}
                                              </span>
                                            </div>
                                            <h5
                                              className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                              onClick={() => setMissaoPreview(ativ)}
                                            >
                                              {ativ.titulo}
                                            </h5>
                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-550 dark:text-slate-405 font-semibold">
                                              <span className="text-emerald-600 dark:text-emerald-500 font-black">
                                                ⭐ {ativ.xp} XP
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <span className="opacity-80">👥</span> {ativ.turmaAlvo}
                                              </span>
                                              {ativ.dataLimite && (
                                                <span className="flex items-center gap-1 text-rose-500 dark:text-rose-450 font-bold">
                                                  <span>⏳</span> {ativ.dataLimite}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* BOTOES DE ACAO COMPACTOS */}
                                          <div className="flex gap-1.5 mt-3 md:mt-0 shrink-0 self-end md:self-auto">
                                            <motion.button
                                              whileHover={{ scale: 1.08 }}
                                              whileTap={{ scale: 0.92 }}
                                              onClick={() => setMissaoPreview(ativ)}
                                              className="cursor-pointer p-2.5 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                              title="Visualizar Detalhes"
                                            >
                                              👁️
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ scale: 1.08 }}
                                              whileTap={{ scale: 0.92 }}
                                              onClick={() => onViewEntregas(ativ)}
                                              className="cursor-pointer p-2.5 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-all relative"
                                              title="Corrigir Entregas"
                                            >
                                              📝
                                              {qtdPendentes > 0 && (
                                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                              )}
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ scale: 1.08 }}
                                              whileTap={{ scale: 0.92 }}
                                              onClick={() => onEdit(ativ)}
                                              className="cursor-pointer p-2.5 text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-xl transition-all"
                                              title="Editar Atividade"
                                            >
                                              ✏️
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ scale: 1.08 }}
                                              whileTap={{ scale: 0.92 }}
                                              onClick={() => onDelete(ativ.id!)}
                                              className="cursor-pointer p-2.5 text-red-400 dark:text-red-500 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all"
                                              title="Excluir"
                                            >
                                              🗑️
                                            </motion.button>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL DE PREVIEW MANTIDO COM REDESENHO PREMIUM */}
      <AnimatePresence>
        {missaoPreview && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMissaoPreview(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/5 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10"
            >
              <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center">
                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
                  Detalhes da Missão
                </h3>
                <button
                  onClick={() => setMissaoPreview(null)}
                  className="cursor-pointer text-2xl text-slate-450 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-500 transition-colors leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-850"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto">
                <h2 className="text-xl md:text-2xl font-display font-black text-slate-850 dark:text-slate-50 mb-3 tracking-tight">
                  {missaoPreview.titulo}
                </h2>
                <div className="text-sm text-slate-600 dark:text-slate-350 mb-6 bg-slate-50/50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 whitespace-pre-wrap leading-relaxed">
                  {missaoPreview.descricao}
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMissaoPreview(null)}
                  className="cursor-pointer w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/10"
                >
                  Fechar Visualização
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
