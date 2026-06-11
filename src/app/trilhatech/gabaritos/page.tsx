/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import { apiTutor } from "@/src/services/api";
import { Atividade } from "@/src/types";

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

  // ESTADOS PARA ORGANIZAÇÃO DE MÓDULOS
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [modulosFechados, setModulosFechados] = useState<
    Record<string, boolean>
  >({});

  // O nosso "Cofre" de edições (Guarda só o que foi alterado para enviar ao servidor)
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

          // Inicializa o estado com os valores que vieram do banco
          const estadoInicial: Record<string, any> = {};
          data.atividades.forEach((ativ: any) => {
            estadoInicial[ativ.id] = {
              gabarito: ativ.gabarito || "",
              linkClassroom: ativ.linkClassroom || "",
              gabaritoLiberado: ativ.gabaritoLiberado || false,
            };
          });
          setEdicoes(estadoInicial);
        }
      } catch (e) {
        alert("Erro ao buscar as atividades.");
      } finally {
        setCarregando(false);
      }
    };

    carregarAtividades();
  }, [nomeUsuario]);

  // Função para atualizar um campo específico de uma atividade no nosso "Cofre" local
  const handleChange = (id: string, campo: string, valor: any) => {
    setEdicoes((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor },
    }));
  };

  // 🔥 NOVA FUNÇÃO: Alterna a visibilidade de todas as missões de um módulo de uma só vez
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
    // Transforma o nosso Cofre (Objeto) num Array para enviar para o backend
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
      alert("❌ Erro ao tentar salvar em lote.");
    } finally {
      setSalvando(false);
    }
  };

  // LEITURA AUTOMÁTICA DOS MÓDULOS DISPONÍVEIS
  const modulosDisponiveis = useMemo(() => {
    const mods = new Set(
      atividades.map((a) =>
        a.modulo && a.modulo.trim() !== "" ? a.modulo : "Sem Módulo Definido",
      ),
    );
    return Array.from(mods).sort();
  }, [atividades]);

  // AGRUPAMENTO COM FILTRO EXCLUSIVO PARA DESAFIOS E MINIPROJETOS
  const modulosAgrupados = useMemo(() => {
    const grupos: Record<string, Atividade[]> = {};
    atividades.forEach((ativ) => {
      const lowerTitle = ativ.titulo.toLowerCase();

      // BARREIRA DE FILTRAGEM: Só passam Desafios e Projetos
      const isDesafio = lowerTitle.includes("desafio") || ativ.tipo === "Quiz";
      const isProjeto =
        lowerTitle.includes("projeto") || ativ.tipo === "Projeto";

      if (!isDesafio && !isProjeto) return;

      if (busca && !lowerTitle.includes(busca.toLowerCase())) return;

      const mod =
        ativ.modulo && ativ.modulo.trim() !== ""
          ? ativ.modulo
          : "Sem Módulo Definido";

      // Aplica o filtro de módulo selecionado no dropdown
      if (filtroModulo !== "Todos" && mod !== filtroModulo) return;

      if (!grupos[mod]) grupos[mod] = [];
      grupos[mod].push(ativ);
    });

    // Ordenar alfabeticamente para a "Aula 01" aparecer antes da "Aula 02"
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300">
      {/* HEADER FIXO PARA SALVAR RAPIDAMENTE */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-[1536px] w-full mx-auto px-4 lg:px-8 py-3">
          <Header
            carregando={carregando}
            nomeUsuario={nomeUsuario}
            onLogout={() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            }}
          />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4 mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/trilhatech/aulas")}
                className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ← Voltar
              </button>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 border-l-4 border-emerald-600 pl-3">
                Edição em Lote (Gabaritos e AVA)
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <select
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
              >
                <option value="Todos">Todos os Módulos</option>
                {modulosDisponiveis.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar missão..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                onClick={salvarTudo}
                disabled={salvando || carregando}
                className="cursor-pointer w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                {salvando ? "Salvando..." : "💾 Salvar Tudo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1536px] w-full mx-auto px-4 lg:px-8 mt-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl mb-6 flex gap-4 items-center">
          <div className="text-3xl">💡</div>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
            <strong>Foco Total:</strong> O sistema está a exibir{" "}
            <strong>apenas Desafios e Projetos</strong>, ignorando materiais e
            missões extras. Use{" "}
            <kbd className="bg-emerald-200 dark:bg-emerald-800 px-1 rounded">
              Tab
            </kbd>{" "}
            para navegar rápido entre os campos!
          </p>
        </div>

        {carregando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600"></div>
          </div>
        ) : Object.keys(modulosAgrupados).length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            Nenhuma atividade encontrada para este filtro.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(modulosAgrupados).map(([modulo, ativs]) => {
              const isFechado = modulosFechados[modulo] || false;

              // Verifica se TODAS as missões deste módulo estão liberadas atualmente no cofre (state)
              const todosLiberados = ativs.every(
                (a) => edicoes[a.id!]?.gabaritoLiberado,
              );

              return (
                <div
                  key={modulo}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300"
                >
                  <div
                    onClick={() => toggleModulo(modulo)}
                    className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer select-none transition-colors gap-3 md:gap-0"
                  >
                    <h3 className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-sm flex items-center gap-2">
                      <span>📚</span> {modulo}
                    </h3>

                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                      {/* 🔥 O BOTÃO DE AÇÃO EM MASSA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Impede que o módulo feche ao clicar no botão
                          toggleTodosDoModulo(ativs, !todosLiberados);
                        }}
                        className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 border ${
                          todosLiberados
                            ? "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                            : "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                        }`}
                      >
                        {todosLiberados
                          ? "🚫 Ocultar Todos"
                          : "✅ Liberar Todos"}
                      </button>

                      <span className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
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
                    <div className="overflow-x-auto animate-in slide-in-from-top-2">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3 w-1/4">Missão</th>
                            <th className="p-3 w-1/4">
                              Gabarito / Código Base
                            </th>
                            <th className="p-3 w-1/4">Link de Entrega (AVA)</th>
                            <th className="p-3 w-32 text-center">Liberado?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
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
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                              >
                                {/* NOME E TIPO */}
                                <td className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                      {ativ.id?.split("-")[1] || ativ.id}
                                    </span>
                                    <span
                                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${isQuiz ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 dark:border-amber-800/50" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200 dark:border-blue-800/50"}`}
                                    >
                                      {ativ.tipo}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                                    {ativ.titulo}
                                  </p>
                                </td>

                                {/* INPUT GABARITO */}
                                <td className="p-3">
                                  <input
                                    type="text"
                                    placeholder={
                                      isQuiz
                                        ? "Ex: A, B, C, D"
                                        : "https://codepen.io/..."
                                    }
                                    value={edicao.gabarito}
                                    onChange={(e) =>
                                      handleChange(
                                        ativ.id!,
                                        "gabarito",
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 transition-colors ${isQuiz ? "font-bold text-center border-slate-300 dark:border-slate-600 focus:ring-emerald-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" : "font-mono border-slate-300 dark:border-slate-600 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300"}`}
                                  />
                                </td>

                                {/* INPUT LINK AVA */}
                                <td className="p-3">
                                  <input
                                    type="text"
                                    placeholder="https://classroom.google.com/..."
                                    value={edicao.linkClassroom}
                                    onChange={(e) =>
                                      handleChange(
                                        ativ.id!,
                                        "linkClassroom",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                  />
                                </td>

                                {/* TOGGLE VISIBILIDADE */}
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() =>
                                      handleChange(
                                        ativ.id!,
                                        "gabaritoLiberado",
                                        !edicao.gabaritoLiberado,
                                      )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${edicao.gabaritoLiberado ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${edicao.gabaritoLiberado ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                  </button>
                                  <div className="mt-1 text-[9px] font-bold uppercase text-slate-400">
                                    {edicao.gabaritoLiberado
                                      ? "Visível"
                                      : "Oculto"}
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
