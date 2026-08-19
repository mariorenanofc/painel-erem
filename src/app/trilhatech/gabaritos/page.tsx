"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import { apiTutor } from "@/src/services/api";
import { Atividade } from "@/src/types";
import { motion } from "framer-motion";

export default function GestaoGabaritosLotePage() {
  const router = useRouter();
  const [nomeUsuario] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioLogado") || ""
      : "",
  );
  const [montado, setMontado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [busca, setBusca] = useState("");

  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [modulosFechados, setModulosFechados] = useState<
    Record<string, boolean>
  >({});

  const [edicoes, setEdicoes] = useState<
    Record<
      string,
      { gabarito: string; linkClassroom: string; gabaritoLiberado: boolean }
    >
  >({});

  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) {
      window.location.href = "/";
      return;
    }

    const carregarAtividades = async () => {
      try {
        const data = await apiTutor.buscarTodasAtividades("Todas", "Todos");
        if (data.status === "sucesso") {
          setAtividades(data.atividades);

          const estadoInicial: Record<string, { gabarito: string; linkClassroom: string; gabaritoLiberado: boolean }> = {};
          data.atividades.forEach((ativ: Atividade) => {
            estadoInicial[ativ.id] = {
              gabarito: ativ.gabarito || "",
              linkClassroom: ativ.linkClassroom || "",
              gabaritoLiberado: ativ.gabaritoLiberado || false,
            };
          });
          setEdicoes(estadoInicial);
        }
      } catch (e) {
        console.error(e);
        alert("Erro ao buscar as atividades.");
      } finally {
        setCarregando(false);
      }
    };

    carregarAtividades();
  }, [nomeUsuario]);

  const handleChange = (id: string, campo: string, valor: string | boolean) => {
    setEdicoes((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor },
    }));
  };

  const toggleTodosDoModulo = (
    atividadesDoModulo: Atividade[],
    novoStatus: boolean,
  ) => {
    setEdicoes((prev) => {
      const novasEdicoes = { ...prev };
      atividadesDoModulo.forEach((ativ) => {
        if (ativ.id) {
          novasEdicoes[ativ.id] = {
            ...novasEdicoes[ativ.id],
            gabaritoLiberado: novoStatus,
          };
        }
      });
      return novasEdicoes;
    });
  };

  const salvarTudo = async () => {
    setSalvando(true);
    const atualizacoesArray = Object.keys(edicoes).map((id) => ({
      id,
      gabarito: edicoes[id].gabarito,
      linkClassroom: edicoes[id].linkClassroom,
      gabaritoLiberado: edicoes[id].gabaritoLiberado,
    }));

    try {
      const res = await apiTutor.salvarGabaritosLote(atualizacoesArray);
      if (res.status === "sucesso") {
        alert("✅ Todos os gabaritos e links foram atualizados com sucesso!");
      } else {
        alert("⚠️ " + res.mensagem);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Erro ao tentar salvar em lote.");
    } finally {
      setSalvando(false);
    }
  };

  const modulosDisponiveis = useMemo(() => {
    const mods = new Set(
      atividades.map((a) =>
        a.modulo && a.modulo.trim() !== "" ? a.modulo : "Sem Módulo Definido",
      ),
    );
    return Array.from(mods).sort();
  }, [atividades]);

  const modulosAgrupados = useMemo(() => {
    const grupos: Record<string, Atividade[]> = {};
    atividades.forEach((ativ) => {
      const lowerTitle = ativ.titulo.toLowerCase();

      const isDesafio = lowerTitle.includes("desafio") || ativ.tipo === "Quiz";
      const isProjeto =
        lowerTitle.includes("projeto") || ativ.tipo === "Projeto";

      if (!isDesafio && !isProjeto) return;

      if (busca && !lowerTitle.includes(busca.toLowerCase())) return;

      const mod =
        ativ.modulo && ativ.modulo.trim() !== ""
          ? ativ.modulo
          : "Sem Módulo Definido";

      if (filtroModulo !== "Todos" && mod !== filtroModulo) return;

      if (!grupos[mod]) grupos[mod] = [];
      grupos[mod].push(ativ);
    });

    Object.keys(grupos).forEach((mod) => {
      grupos[mod].sort((a, b) => a.titulo.localeCompare(b.titulo));
    });

    return grupos;
  }, [atividades, busca, filtroModulo]);

  const toggleModulo = (nomeModulo: string) => {
    setModulosFechados((prev) => ({
      ...prev,
      [nomeModulo]: !prev[nomeModulo],
    }));
  };

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"></div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-teal-500/5 dark:bg-teal-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* HEADER E CONTROLES DE BUSCA */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 pt-6 relative z-10">
        <Header
          carregando={carregando}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            fetch("/api/action-proxy", { method: "POST", body: JSON.stringify({ action: "logout" }) }).then(() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            });
          }}
        />

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 mt-8 mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/trilhatech/aulas")}
              className="cursor-pointer text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              ← Voltar
            </motion.button>
            <div className="text-left">
              <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
                Edição em Lote
                <span className="text-[9px] font-black tracking-widest uppercase bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 dark:border-emerald-900/10 shadow-sm align-middle">
                  Gabaritos & AVA
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full xl:w-auto">
            {/* Filtro Módulo */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="cursor-pointer w-full sm:w-auto px-4 py-3.5 pr-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:border-emerald-500 appearance-none shadow-sm"
              >
                <option value="Todos" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todos os Módulos</option>
                {modulosDisponiveis.map((mod) => (
                  <option key={mod} value={mod} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {mod}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[9px]">
                ▼
              </div>
            </div>

            {/* Input Busca */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Buscar missão..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-sm placeholder:text-slate-400"
              />
            </div>

            {/* Salvar Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={salvarTudo}
              disabled={salvando || carregando}
              className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50 text-xs uppercase tracking-wider shrink-0"
            >
              {salvando ? "Salvando..." : "💾 Salvar Tudo"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* CORPO DE ITENS */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 mt-6 relative z-10">
        <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-900/10 p-4.5 rounded-[1.5rem] mb-6 flex gap-4 items-center shadow-sm">
          <div className="text-2xl select-none">💡</div>
          <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold leading-normal uppercase tracking-wider">
            <strong>Foco Total:</strong> O sistema está a exibir{" "}
            <strong>apenas Desafios e Projetos</strong>. Use{" "}
            <kbd className="bg-emerald-500/15 dark:bg-emerald-950/40 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono">
              Tab
            </kbd>{" "}
            para navegar rápido entre os campos!
          </p>
        </div>

        {carregando ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : Object.keys(modulosAgrupados).length === 0 ? (
          <div className="text-center py-20 text-slate-450 dark:text-slate-500 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] font-black uppercase tracking-wider text-xs shadow-md">
            Nenhuma atividade encontrada para este filtro.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(modulosAgrupados).map(([modulo, ativs]) => {
              const isFechado = modulosFechados[modulo] || false;

              const todosLiberados = ativs.every(
                (a) => edicoes[a.id!]?.gabaritoLiberado,
              );

              return (
                <div
                  key={modulo}
                  className="bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] shadow-lg border border-slate-200/60 dark:border-white/5 overflow-hidden transition-all duration-300 backdrop-blur-md"
                >
                  {/* Modulo Header */}
                  <div
                    onClick={() => toggleModulo(modulo)}
                    className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer select-none transition-colors gap-3 md:gap-0"
                  >
                    <h3 className="font-display font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                      <span>📚</span> {modulo}
                    </h3>

                    <div className="flex items-center justify-between md:justify-end gap-3.5 w-full md:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodosDoModulo(ativs, !todosLiberados);
                        }}
                        className={`cursor-pointer px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 border ${
                          todosLiberados
                            ? "bg-slate-100 dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {todosLiberados ? "🚫 Ocultar Todos" : "✅ Liberar Todos"}
                      </motion.button>

                      <span className="bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {ativs.length} itens
                      </span>
                      <span
                        className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isFechado ? "rotate-180" : ""}`}
                      >
                        ▼
                      </span>
                    </div>
                  </div>

                  {!isFechado && (
                    <div className="overflow-x-auto custom-scrollbar animate-in slide-in-from-top-2">
                      <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-450 text-[10px] uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 w-1/4">Missão</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 w-1/4">Gabarito / Código Base</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 w-1/4">Link de Entrega (AVA)</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 w-32 text-center">Liberado?</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-350 text-xs divide-y divide-slate-150 dark:divide-slate-850">
                          {ativs.map((ativ) => {
                            const edicao = edicoes[ativ.id!] || {
                              gabarito: "",
                              linkClassroom: "",
                              gabaritoLiberado: false,
                            };
                            const isQuiz = ativ.tipo === "Quiz";

                            return (
                              <tr
                                key={ativ.id}
                                className="hover:bg-white/80 dark:hover:bg-slate-900/30 transition-colors"
                              >
                                {/* NOME E TIPO */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[9px] font-mono font-bold text-slate-450 dark:text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                      {ativ.id?.split("-")[1] || ativ.id}
                                    </span>
                                    <span
                                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                        isQuiz
                                          ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-450"
                                          : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-brand-secondary"
                                      }`}
                                    >
                                      {ativ.tipo}
                                    </span>
                                  </div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                                    {ativ.titulo}
                                  </p>
                                </td>

                                {/* INPUT GABARITO */}
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    placeholder={isQuiz ? "Ex: A, B, C, D" : "https://codepen.io/..."}
                                    value={edicao.gabarito}
                                    onChange={(e) => handleChange(ativ.id!, "gabarito", e.target.value)}
                                    className={`w-full p-2.5 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-all ${
                                      isQuiz
                                        ? "font-mono font-black text-center bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:border-emerald-500"
                                        : "font-mono bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 focus:border-blue-500"
                                    }`}
                                  />
                                </td>

                                {/* INPUT LINK AVA */}
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    placeholder="https://classroom.google.com/..."
                                    value={edicao.linkClassroom}
                                    onChange={(e) => handleChange(ativ.id!, "linkClassroom", e.target.value)}
                                    className="w-full p-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-350 font-mono outline-none focus:border-indigo-500 transition-all"
                                  />
                                </td>

                                {/* TOGGLE VISIBILIDADE */}
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleChange(ativ.id!, "gabaritoLiberado", !edicao.gabaritoLiberado)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${edicao.gabaritoLiberado ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${edicao.gabaritoLiberado ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                  </button>
                                  <div className="mt-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    {edicao.gabaritoLiberado ? "Visível" : "Oculto"}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
