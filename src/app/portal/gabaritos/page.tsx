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

  // 🔥 Filtro de Foco: Mostrar tudo ou apenas pendentes
  const [ocultarConcluidas, setOcultarConcluidas] = useState(false);

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
          // Apenas missões que possuem gabarito liberado
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

  // 🔥 O ALGORITMO MÁGICO CORRIGIDO (Parser Inteligente e Flexível)
  const matrizAgrupada = useMemo(() => {
    const modulos: Record<
      string,
      Record<
        string,
        {
          desafio1?: Atividade;
          desafio2?: Atividade;
          projeto?: Atividade;
          outros: Atividade[];
        }
      >
    > = {};

    atividadesComGabarito.forEach((ativ) => {
      // Filtro de Pendências
      if (
        ocultarConcluidas &&
        (ativ.status === "Avaliado" || ativ.status === "Concluída")
      )
        return;

      const nomeModulo =
        ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Geral";
      if (!modulos[nomeModulo]) modulos[nomeModulo] = {};

      // 1. Extrai o número da aula (ex: "01", "02") do título da missão
      const match = ativ.titulo.match(/Aula\s*(\d+)/i);
      const aulaNum = match ? match[1].padStart(2, "0") : "Extra";
      const aulaLabel = aulaNum === "Extra" ? "Extras" : `AULA ${aulaNum}`;

      if (!modulos[nomeModulo][aulaLabel]) {
        modulos[nomeModulo][aulaLabel] = { outros: [] };
      }

      // 2. O PARSER FLEXÍVEL: Encontra o tipo exato da missão
      const lowerTitle = ativ.titulo.toLowerCase();

      // Expressão Regular para "Desafio 1", "Desafio_1", "Desafio_ 1", "Desafio 01"
      const isDesafio1 = /desafio\s*[_|-]?\s*(?:\d+[\.\-])?(1|01)\b/i.test(lowerTitle);
      const isDesafio2 = /desafio\s*[_|-]?\s*(?:\d+[\.\-])?(2|02)\b/i.test(lowerTitle);

      if (ativ.tipo === "Quiz") {
        if (isDesafio1) {
          modulos[nomeModulo][aulaLabel].desafio1 = ativ;
        } else if (isDesafio2) {
          modulos[nomeModulo][aulaLabel].desafio2 = ativ;
        } else {
          modulos[nomeModulo][aulaLabel].outros.push(ativ); // Quizzes extras
        }
      } else if (ativ.tipo === "Projeto" || ativ.tipo === "Material") {
        // Encaixa na coluna "Mini Projeto"
        if (!modulos[nomeModulo][aulaLabel].projeto) {
          modulos[nomeModulo][aulaLabel].projeto = ativ;
        } else {
          modulos[nomeModulo][aulaLabel].outros.push(ativ); // Projetos extras
        }
      } else {
        modulos[nomeModulo][aulaLabel].outros.push(ativ);
      }
    });

    return modulos;
  }, [atividadesComGabarito, ocultarConcluidas]);

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
        <div className="max-w-384 w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

          {/* BOTÃO DE FOCO (PENDÊNCIAS) */}
          <button
            onClick={() => setOcultarConcluidas(!ocultarConcluidas)}
            className={`cursor-pointer px-4 py-2 text-sm rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm ${ocultarConcluidas ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            {ocultarConcluidas
              ? "👁️ Mostrando Apenas Pendentes"
              : "🎯 Ocultar Já Avaliadas"}
          </button>
        </div>
      </div>

      <div className="max-w-384 w-full mx-auto p-4 md:p-8 mt-2">
        {/* 🔥 GUIA DE WORKFLOW COMPACTO (Inspirado no seu Notion) */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-md border-l-4 border-amber-500 transition-colors">
          <div className="flex items-center gap-4 w-full">
            <div className="text-4xl shrink-0">📓</div>
            <div className="flex-1">
              <h3 className="text-white font-black text-lg mb-2">
                Guia Rápido de Entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <strong className="text-emerald-400 block mb-1">
                    Para os Desafios Teóricos:
                  </strong>
                  <p className="text-slate-300">
                    Clique na <strong>letra correspondente (A, B, C, D)</strong>{" "}
                    na tabela para ser redirecionado imediatamente para o link
                    de entrega do AVA.
                  </p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <strong className="text-amber-400 block mb-1">
                    Para os Miniprojetos (CodePen):
                  </strong>
                  <p className="text-slate-300">
                    Clique no Link Base para criar o seu <strong>Fork</strong>.
                    Depois, clique no nome da{" "}
                    <strong className="text-amber-400">AULA</strong> na última
                    coluna para entregar o link final no AVA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-600 dark:border-emerald-400 mb-4"></div>
            <p className="font-bold text-slate-500 dark:text-slate-400">
              Descriptografando matrizes...
            </p>
          </div>
        ) : Object.keys(matrizAgrupada).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center">
            <div className="text-6xl mb-4">✨</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">
              Tudo limpo por aqui!
            </p>
            <p className="text-sm">
              Nenhum gabarito pendente ou liberado nesta visão.
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
              .map(([nomeModulo, aulasObj]) => {
                const isFechado = modulosFechados[nomeModulo] || false;
                const aulasEntries = Object.entries(aulasObj).sort(
                  ([a], [b]) =>
                    a === "Extras"
                      ? 1
                      : b === "Extras"
                        ? -1
                        : a.localeCompare(b),
                );

                // Calcula total de missões reais dentro do módulo para a badge
                const totalMissoes = aulasEntries.reduce((acc, [_, ativs]) => {
                  return (
                    acc +
                    (ativs.desafio1 ? 1 : 0) +
                    (ativs.desafio2 ? 1 : 0) +
                    (ativs.projeto ? 1 : 0) +
                    ativs.outros.length
                  );
                }, 0);

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
                          {totalMissoes} Missões Liberadas
                        </span>
                        <span
                          className={`text-emerald-600 dark:text-emerald-400 font-bold transition-transform ${isFechado ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* 🔥 A MATRIZ (REPLICA EXATA DA PLANILHA E LOUSA) */}
                    {!isFechado && (
                      <div className="overflow-x-auto p-4 md:p-6">
                        <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 min-w-175 shadow-sm rounded-lg overflow-hidden">
                          <thead>
                            {/* LINHA DE CABEÇALHO PRIMÁRIO */}
                            <tr className="bg-blue-200/60 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300">
                              <th className="border border-slate-300 dark:border-slate-700 p-3 w-32 text-center font-black">
                                AULAS
                              </th>
                              <th
                                className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black"
                                colSpan={2}
                              >
                                DESAFIO
                              </th>
                              <th className="border border-slate-300 dark:border-slate-700 p-3 text-center font-black">
                                MINI PROJETO
                              </th>
                              <th className="border border-slate-300 dark:border-slate-700 p-3 w-32 text-center font-black">
                                AULA
                              </th>
                            </tr>
                            {/* LINHA SUB-CABEÇALHO */}
                            <tr className="bg-blue-100/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs">
                              <th className="border border-slate-300 dark:border-slate-700 p-2 text-center"></th>
                              <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-16 font-bold">
                                1
                              </th>
                              <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-16 font-bold">
                                2
                              </th>
                              <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-medium opacity-80">
                                (CÓDIGO BASE)
                              </th>
                              <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-medium opacity-80">
                                (ENTREGA AVA)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {aulasEntries.map(([aulaLabel, ativs]) => (
                              <tr
                                key={aulaLabel}
                                className="bg-emerald-50/40 dark:bg-emerald-900/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
                              >
                                {/* COLUNA: AULAS (Identificador em Amarelo) */}
                                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center bg-amber-100/60 dark:bg-amber-900/20 font-black text-amber-900 dark:text-amber-500 whitespace-nowrap text-xs shadow-inner">
                                  {aulaLabel}
                                </td>

                                {/* COLUNA: DESAFIO 1 (BOTÃO A, B, C, D) */}
                                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">
                                  {ativs.desafio1 ? (
                                    <a
                                      href={ativs.desafio1.linkClassroom || "#"}
                                      target={
                                        ativs.desafio1.linkClassroom
                                          ? "_blank"
                                          : "_self"
                                      }
                                      rel="noreferrer"
                                      className={`inline-block w-8 h-8 leading-8 text-center rounded font-black shadow-sm transition-all cursor-pointer hover:-translate-y-0.5 ${ativs.desafio1.status === "Avaliado" || ativs.desafio1.status === "Concluída" ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-50" : "bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 hover:ring-2 hover:ring-red-400"}`}
                                      title={
                                        ativs.desafio1.linkClassroom
                                          ? "Entregar no AVA"
                                          : "Sem link do AVA"
                                      }
                                    >
                                      {ativs.desafio1.gabarito}
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* COLUNA: DESAFIO 2 (BOTÃO A, B, C, D) */}
                                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">
                                  {ativs.desafio2 ? (
                                    <a
                                      href={ativs.desafio2.linkClassroom || "#"}
                                      target={
                                        ativs.desafio2.linkClassroom
                                          ? "_blank"
                                          : "_self"
                                      }
                                      rel="noreferrer"
                                      className={`inline-block w-8 h-8 leading-8 text-center rounded font-black shadow-sm transition-all cursor-pointer hover:-translate-y-0.5 ${ativs.desafio2.status === "Avaliado" || ativs.desafio2.status === "Concluída" ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-50" : "bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 hover:ring-2 hover:ring-red-400"}`}
                                      title={
                                        ativs.desafio2.linkClassroom
                                          ? "Entregar no AVA"
                                          : "Sem link do AVA"
                                      }
                                    >
                                      {ativs.desafio2.gabarito}
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* COLUNA: MINI PROJETO (LINK CÓDIGO/NOTION) */}
                                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center text-xs">
                                  {ativs.projeto && ativs.projeto.gabarito ? (
                                    <a
                                      href={ativs.projeto.gabarito}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 font-mono font-bold hover:underline truncate max-w-50 md:max-w-xs transition-colors shadow-sm"
                                      title={ativs.projeto.gabarito}
                                    >
                                      {ativs.projeto.gabarito.replace(
                                        /^https?:\/\//,
                                        "",
                                      )}
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* COLUNA: AULA (AÇÃO DE ENTREGA PROJETO) */}
                                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center bg-amber-100/60 dark:bg-amber-900/20 font-black text-amber-900 dark:text-amber-500 whitespace-nowrap text-xs shadow-inner">
                                  {ativs.projeto &&
                                  ativs.projeto.linkClassroom ? (
                                    <a
                                      href={ativs.projeto.linkClassroom}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`hover:underline cursor-pointer ${ativs.projeto.status === "Avaliado" || ativs.projeto.status === "Concluída" ? "opacity-40" : "hover:text-blue-600 dark:hover:text-blue-400"}`}
                                      title="Entregar Mini Projeto no AVA"
                                    >
                                      {aulaLabel}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400/50 dark:text-slate-600">
                                      {aulaLabel}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* RENDERIZA MISSÕES FORA DO PADRÃO (Para evitar perda de dados) */}
                        {aulasEntries.map(
                          ([_, ativs]) =>
                            ativs.outros.length > 0 && (
                              <div
                                key={`outros-${ativs.outros[0].id}`}
                                className="mt-4 space-y-2"
                              >
                                {ativs.outros.map((extra) => (
                                  <div
                                    key={extra.id}
                                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase">
                                        {extra.tipo}
                                      </span>
                                      <span className="font-bold text-slate-700 dark:text-slate-200">
                                        {extra.titulo}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      {extra.gabarito && (
                                        <a
                                          href={
                                            extra.gabarito.startsWith("http")
                                              ? extra.gabarito
                                              : "#"
                                          }
                                          target={
                                            extra.gabarito.startsWith("http")
                                              ? "_blank"
                                              : "_self"
                                          }
                                          className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                        >
                                          {extra.gabarito.startsWith("http")
                                            ? "Abrir Material"
                                            : `Resp: ${extra.gabarito}`}
                                        </a>
                                      )}
                                      {extra.linkClassroom && (
                                        <a
                                          href={extra.linkClassroom}
                                          target="_blank"
                                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                        >
                                          Enviar AVA
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ),
                        )}
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
