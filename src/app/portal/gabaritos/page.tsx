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
      } catch (e) {}
    };
    buscarConfiguracoes();
  }, [router]);

  useEffect(() => {
    if (!aluno) return;

    const carregarGabaritos = async () => {
      try {
        const data = await apiAluno.carregarPortal(aluno.matricula);
        if (data.status === "sucesso") {
          // Filtra SOMENTE as missões que possuem algum texto/link de gabarito salvo pelo Tutor
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

  const gabaritosAgrupados = useMemo(() => {
    return atividadesComGabarito.reduce(
      (grupos, ativ) => {
        const nomeModulo =
          ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Geral";
        if (!grupos[nomeModulo]) grupos[nomeModulo] = [];
        grupos[nomeModulo].push(ativ);
        return grupos;
      },
      {} as Record<string, Atividade[]>,
    );
  }, [atividadesComGabarito]);

  if (!montado || !aluno) return null;

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-12">
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

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1536px] w-full mx-auto p-4 md:p-8 flex items-center gap-4">
          <button
            onClick={() => router.push("/portal")}
            className="text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm transition-colors"
          >
            ← Voltar para Missões
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-emerald-800 flex items-center gap-2">
              <span>🗝️</span> Central de Gabaritos e Códigos
            </h2>
            <p className="text-slate-500 mt-1 font-medium text-sm">
              Consulte as respostas, códigos-fonte e materiais de recuperação
              dos módulos finalizados.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1536px] w-full mx-auto p-4 md:p-8 mt-4">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mb-4"></div>
            <p className="font-bold text-slate-500">
              Buscando os pergaminhos do conhecimento...
            </p>
          </div>
        ) : atividadesComGabarito.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm flex flex-col items-center mt-8">
            <div className="text-6xl mb-4">📭</div>
            <p className="font-bold text-lg text-slate-700">
              O Tutor ainda não disponibilizou nenhum gabarito.
            </p>
            <p className="text-sm">
              Continue focando nas suas missões atuais. Os gabaritos aparecerão
              aqui no final dos módulos!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(gabaritosAgrupados)
              .sort(([modA], [modB]) => {
                if (modA === "Geral") return 1;
                if (modB === "Geral") return -1;
                return modA.localeCompare(modB);
              })
              .map(([nomeModulo, missoesDoModulo]) => {
                const isFechado = modulosFechados[nomeModulo] || false;

                return (
                  <div key={nomeModulo} className="flex flex-col">
                    <div
                      onClick={() => toggleModulo(nomeModulo)}
                      className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors p-4 rounded-xl flex justify-between items-center cursor-pointer mb-3 shadow-sm select-none"
                    >
                      <h3 className="font-black text-emerald-900 flex items-center gap-2 text-lg">
                        <span>📚</span> {nomeModulo}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-200 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full">
                          {missoesDoModulo.length}
                        </span>
                        <span
                          className={`text-emerald-600 font-bold transition-transform duration-200 ${isFechado ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {!isFechado && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pl-2 md:pl-4 border-l-2 border-emerald-200 mb-6 animate-in slide-in-from-top-2">
                        {missoesDoModulo.map((ativ) => {
                          const isLink = ativ.gabarito
                            ?.trim()
                            .startsWith("http");

                          return (
                            <div
                              key={ativ.id}
                              className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative"
                            >
                              <div className="h-1.5 w-full bg-emerald-500"></div>
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                                    {ativ.tipo}
                                  </span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">
                                    {ativ.id}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">
                                  {ativ.titulo}
                                </h4>

                                <div className="mt-auto pt-4">
                                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <h5 className="font-black text-slate-600 text-xs uppercase tracking-wider mb-3">
                                      Resolução / Código:
                                    </h5>

                                    {isLink ? (
                                      <a
                                        href={ativ.gabarito}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm"
                                      >
                                        🔗 Acessar Material
                                      </a>
                                    ) : (
                                      <div className="max-h-40 overflow-y-auto bg-slate-800 rounded-lg p-3 custom-scrollbar">
                                        <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                                          {ativ.gabarito}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
    </main>
  );
}
