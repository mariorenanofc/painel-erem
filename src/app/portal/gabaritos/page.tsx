/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DadosAluno, Atividade } from "@/src/types";
import PortalHeader from "@/src/components/PortalHeader";
import { apiAluno, apiGeral } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import ThreeInteractiveBg from "@/src/components/ThreeInteractiveBg";
import { motion, AnimatePresence } from "framer-motion";

export default function GabaritosPage() {
  const router = useRouter();
  const { toast } = useToast();

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
      } catch {
        toast("Erro ao carregar configurações da plataforma.", "error", "Erro");
      }
    };
    buscarConfiguracoes();
  }, [router, toast]);

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
        toast(
          "Falha ao descriptografar os gabaritos.",
          "error",
          "Erro de Conexão",
        );
      } finally {
        setCarregando(false);
      }
    };

    carregarGabaritos();
  }, [aluno, toast]);

  const toggleModulo = (nomeModulo: string) => {
    setModulosFechados((prev) => ({
      ...prev,
      [nomeModulo]: !prev[nomeModulo],
    }));
  };

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
      if (
        ocultarConcluidas &&
        (ativ.status === "Avaliado" || ativ.status === "Concluída")
      )
        return;

      const nomeModulo =
        ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Geral";
      if (!modulos[nomeModulo]) modulos[nomeModulo] = {};

      const match = ativ.titulo.match(/Aula\s*(\d+)/i);
      const aulaNum = match ? match[1].padStart(2, "0") : "Extra";
      const aulaLabel = aulaNum === "Extra" ? "Extras" : `AULA ${aulaNum}`;

      if (!modulos[nomeModulo][aulaLabel]) {
        modulos[nomeModulo][aulaLabel] = { outros: [] };
      }

      const lowerTitle = ativ.titulo.toLowerCase();

      const isDesafio1 = /desafio\s*[_|-]?\s*(?:\d+[\.\-])?(1|01)\b/i.test(
        lowerTitle,
      );
      const isDesafio2 = /desafio\s*[_|-]?\s*(?:\d+[\.\-])?(2|02)\b/i.test(
        lowerTitle,
      );

      if (ativ.tipo === "Quiz") {
        if (isDesafio1) {
          modulos[nomeModulo][aulaLabel].desafio1 = ativ;
        } else if (isDesafio2) {
          modulos[nomeModulo][aulaLabel].desafio2 = ativ;
        } else {
          modulos[nomeModulo][aulaLabel].outros.push(ativ);
        }
      } else if (ativ.tipo === "Projeto" || ativ.tipo === "Material") {
        if (!modulos[nomeModulo][aulaLabel].projeto) {
          modulos[nomeModulo][aulaLabel].projeto = ativ;
        } else {
          modulos[nomeModulo][aulaLabel].outros.push(ativ);
        }
      } else {
        modulos[nomeModulo][aulaLabel].outros.push(ativ);
      }
    });

    return modulos;
  }, [atividadesComGabarito, ocultarConcluidas]);

  if (!montado || !aluno) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-300 relative overflow-hidden text-left">
      {/* Three.js interactive custom background */}
      <ThreeInteractiveBg />

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/5 dark:bg-fuchsia-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* PORTAL HEADER CONTAINER */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 pt-6 relative z-50">
        <PortalHeader
          matricula={aluno.matricula}
          nomeAluno={aluno.nome}
          turma={aluno.turma}
          nomeProjeto={nomeProjeto}
          notificacoes={[]}
          onAbrirRanking={() =>
            toast(
              "Volte à sua página inicial para acessar o Ranking da Turma.",
              "info",
              "Aviso",
            )
          }
          onAbrirFrequencia={() =>
            toast(
              "Volte à sua página inicial para ver os relatórios de Frequência.",
              "info",
              "Aviso",
            )
          }
          onAbrirPerfil={() =>
            toast(
              "Volte à sua página inicial para editar o seu Perfil e Avatar.",
              "info",
              "Aviso",
            )
          }
          onLogout={() => {
            localStorage.removeItem("alunoLogado");
            router.push("/portal/login");
          }}
        />

        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mt-8 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/portal")}
              className="cursor-pointer text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              ← Voltar
            </motion.button>
            <div className="text-left">
              <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
                Central de Gabaritos
                <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 dark:border-indigo-900/10 shadow-sm align-middle">
                  Student Vault
                </span>
              </h2>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setOcultarConcluidas(!ocultarConcluidas)}
            className={`cursor-pointer px-5 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all border shadow-md flex items-center gap-2 ${
              ocultarConcluidas
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/35"
                : "bg-slate-900 hover:bg-black text-slate-400 border-white/5"
            }`}
          >
            {ocultarConcluidas
              ? "👁️ Mostrando Apenas Pendentes"
              : "🎯 Ocultar Já Avaliadas"}
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 relative z-10">
        
        {/* WORKFLOW GUIDE */}
        <div className="bg-white/80 dark:bg-slate-900/40 rounded-[2rem] p-6 mb-8 border border-slate-200/60 dark:border-white/5 backdrop-blur-md shadow-lg flex flex-col lg:flex-row items-center gap-6 justify-between">
          <div className="flex items-start gap-4 w-full">
            <div className="text-3xl select-none pt-0.5">📓</div>
            <div className="flex-1">
              <h3 className="font-display font-black text-slate-800 dark:text-white text-base mb-2">
                Guia Rápido de Entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-wider">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
                  <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">
                    Para os Desafios Teóricos:
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed lowercase first-letter:uppercase">
                    Clique na letra correspondente (A, B, C, D) na tabela para ser redirecionado ao Classroom do AVA.
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
                  <strong className="text-amber-550 dark:text-amber-400 block mb-1">
                    Para os Miniprojetos (CodePen):
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed lowercase first-letter:uppercase">
                    Clique no Link Base para criar o seu Fork. Depois, clique no nome da AULA para fazer a entrega no AVA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GABARITOS MATRIX */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="font-bold text-xs uppercase tracking-widest text-slate-400 animate-pulse">
              Descriptografando matrizes...
            </p>
          </div>
        ) : Object.keys(matrizAgrupada).length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/40 p-12 rounded-[2.5rem] border border-slate-200 dark:border-white/5 text-center text-slate-450 dark:text-slate-500 shadow-md flex flex-col items-center select-none">
            <div className="text-5xl mb-4">✨</div>
            <p className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">
              Tudo limpo por aqui!
            </p>
            <p className="text-xs font-semibold mt-1">
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
                    className="bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-lg backdrop-blur-md transition-all"
                  >
                    {/* CABEÇALHO DO MÓDULO */}
                    <div
                      onClick={() => toggleModulo(nomeModulo)}
                      className="bg-slate-50/50 dark:bg-slate-950/20 p-5 flex justify-between items-center cursor-pointer select-none border-b border-slate-200 dark:border-slate-800/80 transition-colors"
                    >
                      <h3 className="font-display font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span>📚</span> {nomeModulo}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                          {totalMissoes} Missões Liberadas
                        </span>
                        <span
                          className={`text-slate-400 dark:text-slate-550 transition-transform ${isFechado ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* TABELA DE MATRIZ GLASS */}
                    {!isFechado && (
                      <div className="overflow-x-auto custom-scrollbar p-4 md:p-6">
                        <table className="w-full border-separate border-spacing-0 min-w-[700px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
                          <thead>
                            <tr className="bg-slate-100/60 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider">
                              <th className="px-4 py-4 w-32 text-center border-b border-slate-250 dark:border-slate-800">
                                AULAS
                              </th>
                              <th
                                className="px-4 py-4 text-center border-b border-slate-250 dark:border-slate-800"
                                colSpan={2}
                              >
                                DESAFIOS
                              </th>
                              <th className="px-4 py-4 text-center border-b border-slate-250 dark:border-slate-800">
                                MINI PROJETO
                              </th>
                              <th className="px-4 py-4 w-32 text-center border-b border-slate-250 dark:border-slate-800">
                                AULA
                              </th>
                            </tr>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 text-[9px] uppercase font-black tracking-wider">
                              <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800"></th>
                              <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 border-r border-slate-200 dark:border-slate-800 w-16 text-center">
                                1
                              </th>
                              <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 border-r border-slate-200 dark:border-slate-800 w-16 text-center">
                                2
                              </th>
                              <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 border-r border-slate-200 dark:border-slate-800 text-center font-black">
                                (CÓDIGO BASE)
                              </th>
                              <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-center font-black">
                                (ENTREGA AVA)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-700 dark:text-slate-300 text-xs divide-y divide-slate-150 dark:divide-slate-850">
                            {aulasEntries.map(([aulaLabel, ativs]) => (
                              <tr
                                key={aulaLabel}
                                className="hover:bg-white/70 dark:hover:bg-slate-900/30 transition-colors"
                              >
                                {/* IDENTIFICADOR DE AULA */}
                                <td className="p-3.5 text-center bg-slate-50/50 dark:bg-slate-950/20 border-r border-slate-200 dark:border-slate-800 font-mono font-black text-slate-500 dark:text-slate-400 text-xs shadow-inner">
                                  {aulaLabel}
                                </td>

                                {/* COLUNA: DESAFIO 1 */}
                                <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 w-24">
                                  {ativs.desafio1 ? (
                                    <motion.a
                                      whileHover={{ scale: 1.1, y: -1 }}
                                      whileTap={{ scale: 0.9 }}
                                      href={ativs.desafio1.linkClassroom || "#"}
                                      target={ativs.desafio1.linkClassroom ? "_blank" : "_self"}
                                      rel="noreferrer"
                                      className={`inline-flex w-8 h-8 items-center justify-center rounded-full font-mono font-black text-sm shadow-sm transition-all cursor-pointer border ${
                                        ativs.desafio1.status === "Avaliado" || ativs.desafio1.status === "Concluída"
                                          ? "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60"
                                          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450 hover:bg-rose-500/20"
                                      }`}
                                      title={ativs.desafio1.linkClassroom ? "Entregar no AVA" : "Sem link do AVA"}
                                    >
                                      {ativs.desafio1.gabarito}
                                    </motion.a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-800 select-none">-</span>
                                  )}
                                </td>

                                {/* COLUNA: DESAFIO 2 */}
                                <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 w-24">
                                  {ativs.desafio2 ? (
                                    <motion.a
                                      whileHover={{ scale: 1.1, y: -1 }}
                                      whileTap={{ scale: 0.9 }}
                                      href={ativs.desafio2.linkClassroom || "#"}
                                      target={ativs.desafio2.linkClassroom ? "_blank" : "_self"}
                                      rel="noreferrer"
                                      className={`inline-flex w-8 h-8 items-center justify-center rounded-full font-mono font-black text-sm shadow-sm transition-all cursor-pointer border ${
                                        ativs.desafio2.status === "Avaliado" || ativs.desafio2.status === "Concluída"
                                          ? "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60"
                                          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450 hover:bg-rose-500/20"
                                      }`}
                                      title={ativs.desafio2.linkClassroom ? "Entregar no AVA" : "Sem link do AVA"}
                                    >
                                      {ativs.desafio2.gabarito}
                                    </motion.a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-800 select-none">-</span>
                                  )}
                                </td>

                                {/* COLUNA: MINI PROJETO */}
                                <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 max-w-[200px]">
                                  {ativs.projeto && ativs.projeto.gabarito ? (
                                    <motion.a
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      href={ativs.projeto.gabarito}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 font-mono font-bold hover:underline truncate transition-all shadow-inner text-[10px] text-center"
                                      title={ativs.projeto.gabarito}
                                    >
                                      {ativs.projeto.gabarito.replace(/^https?:\/\//, "")}
                                    </motion.a>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-800 select-none">-</span>
                                  )}
                                </td>

                                {/* COLUNA: AULA (AÇÃO DE ENTREGA PROJETO) */}
                                <td className="p-3.5 text-center bg-slate-50/50 dark:bg-slate-950/20 font-black text-amber-900 dark:text-amber-500 whitespace-nowrap text-xs shadow-inner">
                                  {ativs.projeto && ativs.projeto.linkClassroom ? (
                                    <motion.a
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      href={ativs.projeto.linkClassroom}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-block px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 transition-all ${
                                        ativs.projeto.status === "Avaliado" || ativs.projeto.status === "Concluída" ? "opacity-40" : ""
                                      }`}
                                      title="Entregar Mini Projeto no Classroom"
                                    >
                                      Enviar AVA
                                    </motion.a>
                                  ) : (
                                    <span className="text-slate-400/50 dark:text-slate-655 font-bold uppercase tracking-wider text-[10px]">
                                      Não Iniciado
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* OUTRAS MISSÕES FORA DA MATRIZ */}
                        {aulasEntries.map(
                          ([_, ativs]) =>
                            ativs.outros.length > 0 && (
                              <div
                                key={`outros-${ativs.outros[0].id}`}
                                className="mt-5 space-y-2.5 text-left"
                              >
                                {ativs.outros.map((extra) => (
                                  <div
                                    key={extra.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/60 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs gap-3"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {extra.tipo}
                                      </span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {extra.titulo}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                      {extra.gabarito && (
                                        <motion.a
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          href={extra.gabarito.startsWith("http") ? extra.gabarito : "#"}
                                          target={extra.gabarito.startsWith("http") ? "_blank" : "_self"}
                                          className="text-center w-full sm:w-auto bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4.5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] transition-colors"
                                        >
                                          {extra.gabarito.startsWith("http") ? "Abrir Material" : `Resp: ${extra.gabarito}`}
                                        </motion.a>
                                      )}
                                      {extra.linkClassroom && (
                                        <motion.a
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          href={extra.linkClassroom}
                                          target="_blank"
                                          className="text-center w-full sm:w-auto bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-brand-secondary px-4.5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] transition-colors"
                                        >
                                          Enviar AVA
                                        </motion.a>
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
