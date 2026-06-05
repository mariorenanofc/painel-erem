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

  const [gabaritoAberto, setGabaritoAberto] = useState<Atividade | null>(null);

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

  const renderDescricaoComLinks = (texto?: string) => {
    if (!texto) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const partes = texto.split(urlRegex);

    return partes.map((parte, index) => {
      if (parte.match(urlRegex)) {
        return (
          <a
            key={index}
            href={parte}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-black underline break-all bg-emerald-50 dark:bg-emerald-900/30 px-1 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {parte}
          </a>
        );
      }
      return <span key={index}>{parte}</span>;
    });
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
        <div className="max-w-384 w-full mx-auto p-4 md:p-8 flex items-center gap-4">
          <button
            onClick={() => router.push("/portal")}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shadow-sm transition-colors"
          >
            ← Voltar para Missões
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2 transition-colors">
              <span>🗝️</span> Central de Gabaritos e Códigos
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm transition-colors">
              Consulte as respostas, códigos-fonte e materiais de recuperação
              dos módulos finalizados.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-384 w-full mx-auto p-4 md:p-8 mt-4 relative">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 dark:border-emerald-400 mb-4"></div>
            <p className="font-bold text-slate-500 dark:text-slate-400 transition-colors">
              Buscando os pergaminhos do conhecimento...
            </p>
          </div>
        ) : atividadesComGabarito.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center mt-8 transition-colors duration-300">
            <div className="text-6xl mb-4">📭</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300 transition-colors">
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
                      className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors p-4 rounded-xl flex justify-between items-center cursor-pointer mb-3 shadow-sm select-none"
                    >
                      <h3 className="font-black text-emerald-900 dark:text-emerald-400 flex items-center gap-2 text-lg transition-colors">
                        <span>📚</span> {nomeModulo}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full transition-colors">
                          {missoesDoModulo.length}
                        </span>
                        <span
                          className={`text-emerald-600 dark:text-emerald-400 font-bold transition-transform duration-200 ${isFechado ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {!isFechado && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pl-2 md:pl-4 border-l-2 border-emerald-200 dark:border-emerald-800/50 mb-6 animate-in slide-in-from-top-2 transition-colors">
                        {missoesDoModulo.map((ativ) => {
                          return (
                            <div
                              key={ativ.id}
                              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden relative transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/50"
                            >
                              <div className="h-1.5 w-full bg-emerald-500"></div>
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                  <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200 dark:border-slate-700 transition-colors">
                                    {ativ.tipo}
                                  </span>
                                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 font-bold px-2 py-1 rounded transition-colors">
                                    {ativ.id}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4 leading-tight transition-colors">
                                  {ativ.titulo}
                                </h4>

                                <div className="mt-auto pt-2">
                                  <button
                                    onClick={() => setGabaritoAberto(ativ)}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-black py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 transition-colors shadow-sm"
                                  >
                                    <span>📖</span> Abrir Detalhes e Gabarito
                                  </button>
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

        {/* 🔥 MODAL DETALHADO DO GABARITO E CONTEXTO */}
        {gabaritoAberto && (
          <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-emerald-400 dark:border-emerald-600 transition-colors duration-300">
              <div className="p-5 bg-emerald-600 dark:bg-emerald-700 flex justify-between items-center text-white shrink-0 transition-colors">
                <h2 className="font-black text-lg flex items-center gap-2">
                  <span>🗝️</span> Central de Estudo: {gabaritoAberto.tipo}
                </h2>
                <button
                  onClick={() => setGabaritoAberto(null)}
                  className="text-3xl leading-none hover:text-emerald-200 transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 custom-scrollbar transition-colors">
                {/* Cabeçalho da Missão no Modal */}
                <div className="mb-6">
                  <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-2 leading-tight transition-colors">
                    {gabaritoAberto.titulo}
                  </h3>
                  <div className="flex gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors">
                    <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                      Ref: {gabaritoAberto.id}
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                      Módulo: {gabaritoAberto.modulo || "Geral"}
                    </span>
                  </div>
                </div>

                {/* Pergunta / Descrição com Links Ativos */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-colors">
                  <h4 className="font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest mb-3 transition-colors">
                    Enunciado / Instruções Originais:
                  </h4>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed transition-colors">
                    {renderDescricaoComLinks(gabaritoAberto.descricao)}
                  </div>
                </div>

                {/* Alternativas (Se for Quiz) */}
                {gabaritoAberto.tipo === "Quiz" && (
                  <div className="mb-6 space-y-3">
                    {["A", "B", "C", "D"].map((letra) => {
                      const opcaoTexto =
                        gabaritoAberto[`opcao${letra}` as keyof Atividade];
                      return opcaoTexto ? (
                        <div
                          key={letra}
                          className="flex items-start p-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80 cursor-default transition-colors"
                        >
                          <div className="flex-1 overflow-x-auto">
                            <strong className="text-slate-500 dark:text-slate-400 mr-2 transition-colors">
                              {letra})
                            </strong>
                            <code className="text-slate-600 dark:text-slate-300 font-mono text-sm whitespace-pre-wrap leading-tight transition-colors">
                              {opcaoTexto}
                            </code>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Área da Resposta / Gabarito */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/50 shadow-inner mb-6 transition-colors">
                  <h4 className="font-black text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2 uppercase tracking-widest mb-4 transition-colors">
                    <span>💡</span> Resolução / Gabarito Oficial:
                  </h4>

                  {gabaritoAberto.gabarito?.trim().startsWith("http") ? (
                    <div className="text-center py-6">
                      <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-4 transition-colors">
                        O tutor disponibilizou um arquivo externo para esta
                        resolução.
                      </p>
                      <a
                        href={gabaritoAberto.gabarito}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black py-4 px-8 rounded-xl transition-all shadow-md hover:-translate-y-1"
                      >
                        🔗 Abrir Material de Recuperação / Código
                      </a>
                    </div>
                  ) : (
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 overflow-x-auto custom-scrollbar shadow-lg transition-colors">
                      <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                        {renderDescricaoComLinks(gabaritoAberto.gabarito)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Botão de Entrega no Classroom */}
                {gabaritoAberto.linkClassroom && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 p-5 rounded-xl shadow-sm text-center transition-colors">
                    <h4 className="text-amber-800 dark:text-amber-400 font-black text-sm flex items-center justify-center gap-2 mb-2 transition-colors">
                      <span>🏫</span> Registar Entrega no Ambiente Virtual
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-xs font-medium mb-4 transition-colors">
                      Já consultou o gabarito e ajustou o seu material? Registe
                      a sua entrega no Classroom para concluir a missão.
                    </p>
                    <button
                      onClick={() =>
                        window.open(gabaritoAberto.linkClassroom, "_blank")
                      }
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-black py-3 px-8 rounded-lg shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      🚀 Abrir Tarefa no Google Classroom
                    </button>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0 transition-colors">
                <button
                  onClick={() => setGabaritoAberto(null)}
                  className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Fechar Estudo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
