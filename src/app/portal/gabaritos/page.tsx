/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DadosAluno, Atividade } from "@/src/types";
import PortalHeader from "@/src/components/PortalHeader";
import { apiAluno, apiGeral } from "@/src/services/api";

export default function GabaritosPage() {
  const router = useRouter();
  const [montado, setMontado] = useState(false);
  const [aluno, setAluno] = useState<DadosAluno | null>(null);
  const [nomeProjeto, setNomeProjeto] = useState("Portal Educacional");

  const [carregando, setCarregando] = useState(true);
  const [atividadesComGabarito, setAtividadesComGabarito] = useState<
    Atividade[]
  >([]);
  const [modulosFechados, setModulosFechados] = useState<
    Record<string, boolean>
  >({});

  // 🔥 O SEGREDO DO NOTION: Filtro para focar apenas no que falta fazer
  const [ocultarConcluidas, setOcultarConcluidas] = useState(true);

  useEffect(() => {
    setMontado(true);
    const salvo = localStorage.getItem("alunoLogado");
    if (!salvo) {
      router.push("/portal/login");
    } else {
      setAluno(JSON.parse(salvo));
    }

    const buscarConfiguracoes = async () => {
      try {
        const data = await apiGeral.buscarConfiguracoes();
        if (data.status === "sucesso")
          setNomeProjeto(
            data.configuracoes.nomeProjeto || "Portal Educacional",
          );
      } catch {}
    };
    buscarConfiguracoes();
  }, [router]);

  useEffect(() => {
    if (!aluno) return;

    const carregarGabaritos = async () => {
      try {
        const data = await apiAluno.carregarPortal(aluno.matricula);
        if (data.status === "sucesso") {
          // Pega apenas as missões que o Tutor liberou o gabarito (gabaritoLiberado = true no BD)
          const filtradas = data.atividades.filter(
            (ativ: Atividade) => ativ.gabarito && ativ.gabarito.trim() !== "",
          );
          setAtividadesComGabarito(filtradas);
        }
      } catch (e) {
        console.error("Erro ao carregar gabaritos");
      } finally {
        setCarregando(false);
      }
    };

    carregarGabaritos();
  }, [aluno]);

  const toggleModulo = (nomeModulo: string) => {
    setModulosFechados((prev) => ({
      ...prev,
      [nomeModulo]: !prev[nomeModulo],
    }));
  };

  // Agrupamento em Matriz
  const matrizAgrupada = useMemo(() => {
    const grupos: Record<string, Atividade[]> = {};

    atividadesComGabarito.forEach((ativ) => {
      // Filtro de Foco
      if (
        ocultarConcluidas &&
        (ativ.status === "Avaliado" || ativ.status === "Concluída")
      )
        return;

      const nomeModulo =
        ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Geral";
      if (!grupos[nomeModulo]) grupos[nomeModulo] = [];
      grupos[nomeModulo].push(ativ);
    });

    return grupos;
  }, [atividadesComGabarito, ocultarConcluidas]);

  const isUrl = (str: string) => {
    return (
      str.trim().startsWith("http://") || str.trim().startsWith("https://")
    );
  };

  if (!montado || !aluno) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-12 transition-colors duration-300">
      <PortalHeader
        matricula={aluno.matricula}
        nomeAluno={aluno.nome}
        turma={aluno.turma}
        nomeProjeto={nomeProjeto}
        notificacoes={[]}
        onAbrirRanking={() => {}}
        onAbrirFrequencia={() => {}}
        onAbrirPerfil={() => {}}
        onLogout={() => {}}
      />

      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1536px] w-full mx-auto p-4 md:p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/portal")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
            <h2 className="text-xl md:text-2xl font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <span>🗝️</span> Central de Recuperação
            </h2>
          </div>

          <button
            onClick={() => setOcultarConcluidas(!ocultarConcluidas)}
            className={`cursor-pointer px-4 py-2 text-sm rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm ${ocultarConcluidas ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            {ocultarConcluidas ? "👁️ Ocultando Concluídas" : "🎯 Mostrar Tudo"}
          </button>
        </div>
      </div>

      <div className="max-w-[1536px] w-full mx-auto p-4 md:p-8 mt-2">
        {/* 🔥 GUIA DE WORKFLOW COMPACTO (Inspirado no Notion) */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-md border-l-4 border-amber-500 transition-colors">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📓</div>
            <div>
              <h3 className="text-white font-black text-lg">
                Guia Rápido de Entrega (CodePen)
              </h3>
              <p className="text-amber-100 text-sm font-medium">
                1. Abra o Código Base &rarr; 2. Faça o Fork (Login
                Institucional) &rarr; 3. Desenvolva &rarr; 4. Envie o Link no
                AVA.
              </p>
            </div>
          </div>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-600 dark:border-emerald-400 mb-4"></div>
            <p className="font-bold text-slate-500 dark:text-slate-400">
              Carregando a matriz de dados...
            </p>
          </div>
        ) : Object.keys(matrizAgrupada).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center">
            <div className="text-6xl mb-4">✨</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">
              Tudo limpo por aqui!
            </p>
            <p className="text-sm">
              Você não tem pendências nesta visão ou o tutor ainda não liberou
              os gabaritos.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(matrizAgrupada)
              .sort(([modA], [modB]) =>
                modA === "Geral"
                  ? 1
                  : modB === "Geral"
                    ? -1
                    : modA.localeCompare(modB),
              )
              .map(([nomeModulo, missoes]) => {
                const isFechado = modulosFechados[nomeModulo] || false;

                return (
                  <div
                    key={nomeModulo}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-300"
                  >
                    {/* CABEÇALHO DO MÓDULO */}
                    <div
                      onClick={() => toggleModulo(nomeModulo)}
                      className="bg-emerald-50/80 dark:bg-emerald-900/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors p-4 flex justify-between items-center cursor-pointer select-none border-b border-slate-100 dark:border-slate-800"
                    >
                      <h3 className="font-black text-emerald-900 dark:text-emerald-400 flex items-center gap-2 text-lg">
                        <span>📚</span> {nomeModulo}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                          {missoes.length} Missões
                        </span>
                        <span
                          className={`text-emerald-600 dark:text-emerald-400 font-bold transition-transform ${isFechado ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* 🔥 MATRIZ DE DADOS (Inspirada na Lousa) */}
                    {!isFechado && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                              <th className="p-4 font-black">Missão / Aula</th>
                              <th className="p-4 font-black text-center w-32">
                                Status
                              </th>
                              <th className="p-4 font-black text-center w-48">
                                Material Base
                              </th>
                              <th className="p-4 font-black text-center w-48">
                                Ação
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {missoes.map((ativ) => {
                              const isQuiz = ativ.tipo === "Quiz";
                              const isConcluido =
                                ativ.status === "Avaliado" ||
                                ativ.status === "Concluída";
                              const temLinkMaterial =
                                ativ.gabarito && isUrl(ativ.gabarito);

                              return (
                                <tr
                                  key={ativ.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                                >
                                  {/* COLUNA 1: IDENTIFICAÇÃO */}
                                  <td className="p-4">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                          {ativ.id?.split("-")[1] || ativ.id}
                                        </span>
                                        <span
                                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${isQuiz ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 dark:border-amber-800" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200 dark:border-blue-800"}`}
                                        >
                                          {ativ.tipo}
                                        </span>
                                      </div>
                                      <strong className="text-sm text-slate-800 dark:text-slate-200 leading-tight">
                                        {ativ.titulo}
                                      </strong>
                                    </div>
                                  </td>

                                  {/* COLUNA 2: STATUS */}
                                  <td className="p-4 text-center">
                                    {isConcluido ? (
                                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
                                        ✅ Entregue
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded text-xs font-bold border border-amber-200 dark:border-amber-800/50 animate-pulse">
                                        ⏳ Pendente
                                      </span>
                                    )}
                                  </td>

                                  {/* COLUNA 3: GABARITO OU CÓDIGO */}
                                  <td className="p-4 text-center">
                                    {isQuiz ? (
                                      <span className="inline-block bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-black px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-lg shadow-sm">
                                        {ativ.gabarito}
                                      </span>
                                    ) : temLinkMaterial ? (
                                      <a
                                        href={ativ.gabarito}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white w-full px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                      >
                                        <span>📦</span> Abrir Código
                                      </a>
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        Sem Link Base
                                      </span>
                                    )}
                                  </td>

                                  {/* COLUNA 4: AÇÃO AVA */}
                                  <td className="p-4 text-center">
                                    {ativ.linkClassroom ? (
                                      <a
                                        href={ativ.linkClassroom}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-600 text-white w-full px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors shadow-sm"
                                      >
                                        <span>🏫</span> Enviar no AVA
                                      </a>
                                    ) : (
                                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                        {isQuiz ? "Avaliação Automática" : "-"}
                                      </span>
                                    )}
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
