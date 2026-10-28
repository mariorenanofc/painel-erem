/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import PerfilPublicoModal from "@/src/components/PerfilPublicoModal";
import { apiAluno } from "@/src/services/api";
import { obterInfoBadge } from "@/src/utils/badges";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Veterano {
  matricula: string;
  nome: string;
  avatar: string;
  badges: string[];
  anoFormacao: number;
  xpFinal: number;
  nivelFinal: string;
  apelido?: string;
  especialidade?: string;
  fraseFormatura?: string;
  techStack?: string[];
  destaque?: string;
  parecerTutor?: string;
  projetoDestaque?: {
    titulo: string;
    descricao: string;
    linkDeploy?: string;
    linkGithub?: string;
    aprovadoPeloTutor: boolean;
  };
  projetosConcluidos?: number;
  totalAplausos?: number;
}

interface DadosSessaoAluno {
  matricula: string;
  nome: string;
}

function obterDadosAlunoConectado(): DadosSessaoAluno {
  if (typeof window === "undefined") return { matricula: "", nome: "" };
  try {
    const salvo = localStorage.getItem("alunoLogado");
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (parsed && typeof parsed === "object") {
        const mat = String(parsed.matricula || "").trim();
        const nome = String(parsed.nome || "").trim();
        if (mat) {
          return { matricula: mat, nome };
        }
      }
    }
  } catch {}

  const matFallback = (
    localStorage.getItem("matriculaAluno") ||
    localStorage.getItem("matricula") ||
    ""
  ).trim();

  const nomeFallback = (
    localStorage.getItem("usuarioLogado") ||
    localStorage.getItem("nomeAluno") ||
    ""
  ).trim();

  return {
    matricula: matFallback,
    nome: nomeFallback,
  };
}

export default function HallDaFamaPage() {
  const { data, isLoading, mutate } = useSWR<{ status: string; veteranos: Veterano[] }>("/api/alunos/veteranos", fetcher, {
    revalidateOnFocus: true,
  });

  const [perfilAberto, setPerfilAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroAba, setFiltroAba] = useState<"TODOS" | "OURO" | "FULLSTACK">("TODOS");
  const [aplausosMap, setAplausosMap] = useState<Record<string, number>>({});
  const [aplaudindoMatricula, setAplaudindoMatricula] = useState<string | null>(null);
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: "sucesso" | "aviso" | "info" } | null>(null);

  const [alunoConectado, setAlunoConectado] = useState<DadosSessaoAluno>({ matricula: "", nome: "" });

  useEffect(() => {
    const sessao = obterDadosAlunoConectado();
    setAlunoConectado(sessao);
  }, []);

  const matriculaVisualizador = alunoConectado.matricula;
  const estaConectado = Boolean(
    matriculaVisualizador &&
    matriculaVisualizador !== "00000" &&
    matriculaVisualizador !== "visitante"
  );

  const mostrarToast = (mensagem: string, tipo: "sucesso" | "aviso" | "info" = "sucesso") => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const veteranosReais: Veterano[] = data?.status === "sucesso" && Array.isArray(data.veteranos) ? data.veteranos : [];
  const baseVeteranos = veteranosReais;

  // Filtragem e busca
  const veteranosFiltrados = baseVeteranos.filter((vet) => {
    const matchBusca = 
      vet.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (vet.apelido && vet.apelido.toLowerCase().includes(busca.toLowerCase())) ||
      (vet.especialidade && vet.especialidade.toLowerCase().includes(busca.toLowerCase())) ||
      (vet.techStack && vet.techStack.some(t => t.toLowerCase().includes(busca.toLowerCase())));

    if (!matchBusca) return false;

    if (filtroAba === "OURO") {
      return (vet.badges || []).some(b => b.includes("Ouro") || b.includes("Top 1") || b.includes("Prata") || b.includes("Bronze"));
    }
    if (filtroAba === "FULLSTACK") {
      return (vet.especialidade || "").toLowerCase().includes("fullstack") || (vet.techStack || []).includes("React");
    }
    return true;
  });

  const veteranosOrdenados = [...veteranosFiltrados].sort((a, b) => b.xpFinal - a.xpFinal);

  // Ação de aplauso/parabenização com confetes e validação diária no banco
  const handleAplaudir = async (matricula: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Re-checar dados da sessão diretamente do localStorage para garantir valor atualizado
    const sessaoAtual = obterDadosAlunoConectado();
    const matriculaRemetente = sessaoAtual.matricula || matriculaVisualizador;
    const logado = Boolean(
      matriculaRemetente &&
      matriculaRemetente !== "00000" &&
      matriculaRemetente !== "visitante"
    );

    // 1. Visitante deslogado -> Abrir convite amigável para login
    if (!logado) {
      setModalLoginAberto(true);
      return;
    }

    // 2. Não pode aplaudir a si mesmo
    if (matriculaRemetente === matricula) {
      mostrarToast("Você não pode aplaudir seu próprio memorial!", "aviso");
      return;
    }

    try {
      setAplaudindoMatricula(matricula);
      const res = await apiAluno.aplaudirHallDaFama(matricula, matriculaRemetente);

      if (res.status === "sucesso") {
        const totalAtualizado = typeof res.totalAplausos === "number" ? res.totalAplausos : ((aplausosMap[matricula] || 0) + 1);
        setAplausosMap((prev) => ({
          ...prev,
          [matricula]: totalAtualizado
        }));

        confetti({
          particleCount: 55,
          spread: 80,
          origin: { y: 0.65 },
          colors: ["#fbbf24", "#f59e0b", "#ec4899", "#8b5cf6", "#ffffff"]
        });
        mostrarToast("Aplauso diário computado com sucesso! 👏", "sucesso");
        mutate();
      } else if (res.status === "ja_aplaudiu") {
        mostrarToast(res.mensagem || "Você já aplaudiu esta Lenda hoje! Volte amanhã.", "info");
      } else if (res.requerLogin) {
        setModalLoginAberto(true);
      } else {
        mostrarToast(res.mensagem || "Não foi possível registrar o aplauso.", "aviso");
      }
    } catch (err: unknown) {
      const error = err as Error;
      mostrarToast("Erro ao aplaudir: " + error.message, "aviso");
    } finally {
      setAplaudindoMatricula(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-x-hidden selection:bg-amber-400 selection:text-black">
      {/* Luzes Nebulares Cósmicas de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-amber-500/15 via-purple-600/10 to-transparent blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[550px] h-[550px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-amber-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Toast Flutuante de Notificação */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 backdrop-blur-xl ${
              toast.tipo === "sucesso"
                ? "bg-emerald-500/90 text-white border-emerald-400"
                : toast.tipo === "info"
                ? "bg-amber-500/90 text-slate-950 border-amber-300"
                : "bg-red-500/90 text-white border-red-400"
            }`}
          >
            <span>{toast.tipo === "sucesso" ? "👏" : toast.tipo === "info" ? "⏳" : "⚠️"}</span>
            <span>{toast.mensagem}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegação Superior */}
      <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/portal"
            className="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 hover:shadow-[0_0_15px_rgba(251,191,36,0.25)]"
          >
            <span className="text-amber-400 group-hover:-translate-x-1 transition-transform">&larr;</span>
            <span>Voltar ao Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            {estaConectado ? (
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 hidden sm:flex items-center gap-1.5">
                <span>👤</span>
                <span className="max-w-[180px] truncate">{alunoConectado.nome || `Matrícula: ${matriculaVisualizador}`}</span>
              </span>
            ) : (
              <Link
                href="/portal/login"
                className="text-xs font-bold text-amber-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-amber-400/50 hidden sm:flex items-center gap-1.5 transition-colors"
              >
                <span>🔑</span>
                <span>Conectar para Aplaudir</span>
              </Link>
            )}

            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
              <span>🎓</span>
              <span>Dados Oficiais</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10">
        {/* ========================================================
            HERO HEADER: SANTUÁRIO DAS LENDAS FORMADAS
           ======================================================== */}
        <header className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 rounded-full text-xs font-black uppercase tracking-widest text-amber-300 mb-4 shadow-[0_0_25px_rgba(251,191,36,0.25)]"
          >
            <span>🎓</span> Conclusão de Curso &bull; Obras &bull; Conquistas
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 uppercase tracking-tight filter drop-shadow-[0_0_30px_rgba(251,191,36,0.35)] leading-tight">
            Hall da Fama
          </h1>

          <p className="text-base md:text-lg text-slate-300 font-medium mt-3 leading-relaxed">
            As lendas que concluíram com louvor o curso da <strong className="text-amber-300">Trilha Tech</strong>. Conheça suas especialidades, conquistas eternas e projetos que marcaram nossa história.
          </p>

          {/* PLACAR DE HONRA GLOBAL (STATS) */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8 max-w-2xl mx-auto">
            <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent">
              <span className="text-2xl md:text-3xl font-black text-amber-300 block">
                {baseVeteranos.length}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lendas Formadas
              </span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent">
              <span className="text-2xl md:text-3xl font-black text-purple-300 block">
                83+
              </span>
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Projetos Entregues
              </span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent">
              <span className="text-2xl md:text-3xl font-black text-emerald-300 block">
                100%
              </span>
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Devs Qualificados
              </span>
            </div>
          </div>
        </header>

        {/* BARRA DE FILTROS & PESQUISA */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setFiltroAba("TODOS")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filtroAba === "TODOS"
                  ? "bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              🌟 Todas as Lendas
            </button>
            <button
              onClick={() => setFiltroAba("OURO")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filtroAba === "OURO"
                  ? "bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              🏆 Destaques de Honra
            </button>
            <button
              onClick={() => setFiltroAba("FULLSTACK")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filtroAba === "FULLSTACK"
                  ? "bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              💻 Especialistas Fullstack
            </button>
          </div>

          <div className="w-full md:w-72 relative">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou tecnologia..."
              className="w-full bg-slate-900/90 border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            GRID DE CARDS LENDÁRIOS (COLLECTOR CARDS)
           ======================================================== */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-14 h-14 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-amber-400 font-bold uppercase tracking-widest text-xs">
              Abrindo os Portões do Templo...
            </p>
          </div>
        ) : veteranosOrdenados.length === 0 ? (
          <div className="text-center py-24 glass-panel border-white/10 rounded-3xl p-8 max-w-lg mx-auto">
            <span className="text-5xl block mb-3">{baseVeteranos.length === 0 ? "🏛️" : "🔍"}</span>
            <h3 className="text-xl font-bold text-slate-300">
              {baseVeteranos.length === 0
                ? "Santuário em Curadoria pelo Mestre"
                : "Nenhuma lenda encontrada"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {baseVeteranos.length === 0
                ? "Os memoriais de formatura estão passando pela revisão oficial do Tutor e serão publicados em breve."
                : "Tente redefinir a busca ou alternar para a aba \"Todas as Lendas\"."}
            </p>
            {baseVeteranos.length > 0 && (
              <button
                onClick={() => { setBusca(""); setFiltroAba("TODOS"); }}
                className="mt-5 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {veteranosOrdenados.map((vet, idx) => {
                const totalAplausos = aplausosMap[vet.matricula] !== undefined
                  ? aplausosMap[vet.matricula]
                  : (vet.totalAplausos ?? 0);

                return (
                  <motion.div
                    key={vet.matricula}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => setPerfilAberto(vet.matricula)}
                    className="group cursor-pointer relative glass-panel bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950 border border-white/10 hover:border-amber-400/60 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_35px_rgba(251,191,36,0.2)] flex flex-col justify-between overflow-hidden"
                  >
                    {/* Efeito Glow Interno */}
                    <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 group-hover:bg-amber-500/15 rounded-full blur-2xl pointer-events-none transition-all" />

                    <div>
                      {/* Topo do Card: Badge de Turma e Especialidade */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                          <span>🎓</span> Turma {vet.anoFormacao}
                        </span>

                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <span>⭐</span> {vet.nivelFinal}
                        </span>
                      </div>

                      {/* Header do Formando com Avatar e Auréola */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 blur-sm group-hover:scale-110 transition-transform opacity-75" />
                          <img
                            src={vet.avatar}
                            alt={vet.nome}
                            className="w-16 h-16 rounded-full border-2 border-amber-300 object-cover relative z-10 bg-slate-950 shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://api.dicebear.com/9.x/bottts/svg?seed=fallback";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-black text-base text-white group-hover:text-amber-200 transition-colors line-clamp-1 leading-snug">
                            {vet.nome}
                          </h3>
                          <p className="text-xs font-bold text-amber-400/90 truncate mt-0.5">
                            {vet.especialidade || vet.apelido || "Desenvolvedor de Software"}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {vet.projetosConcluidos || 10} projetos validados
                          </span>
                        </div>
                      </div>

                      {/* Frase / Citação da Lenda (Apenas se o aluno salvou sua própria reflexão) */}
                      {Boolean(vet.fraseFormatura && vet.fraseFormatura.trim().length > 0) && (
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 mb-4 relative">
                          <span className="text-amber-400/60 font-serif text-lg leading-none absolute top-1.5 left-2">&ldquo;</span>
                          <p className="text-xs text-slate-300 italic pl-3 leading-relaxed">
                            {vet.fraseFormatura}
                          </p>
                        </div>
                      )}

                      {/* Palavra do Mestre / Parecer Oficial do Tutor */}
                      {Boolean(vet.parecerTutor && vet.parecerTutor.trim().length > 0) && (
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/25 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1 mb-1">
                            <span>🛡️</span> Palavra do Mestre
                          </span>
                          <p className="text-xs text-amber-100/90 leading-relaxed">
                            {vet.parecerTutor}
                          </p>
                        </div>
                      )}

                      {/* Projeto de Conclusão Aprovado pelo Tutor */}
                      {Boolean(vet.projetoDestaque?.titulo && vet.projetoDestaque?.aprovadoPeloTutor) && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 bg-slate-950/70 rounded-2xl border border-emerald-500/30 mb-4"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <span>🚀</span> Projeto Aprovado
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">
                            {vet.projetoDestaque?.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {vet.projetoDestaque?.linkDeploy && (
                              <a
                                href={vet.projetoDestaque.linkDeploy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                              >
                                🌐 Ver Projeto
                              </a>
                            )}
                            {vet.projetoDestaque?.linkGithub && (
                              <a
                                href={vet.projetoDestaque.linkGithub}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
                              >
                                💻 Código
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stack de Tecnologias Dominadas (Apenas se aprovado em testes técnicos) */}
                      {vet.techStack && vet.techStack.length > 0 && (
                        <div className="mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Tecnologias de Domínio
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {vet.techStack.map((tech, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conquistas Memoráveis com Nomes e Ícones Oficiais do Catálogo */}
                      {(() => {
                        const badgesVisiveis = (vet.badges || [])
                          .filter((b) => !b.startsWith("VIP-") && !b.startsWith("BADGE-VIP-"))
                          .map((b) => obterInfoBadge(b));

                        if (badgesVisiveis.length === 0) return null;

                        return (
                          <div className="mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Conquistas Memoráveis
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {badgesVisiveis.slice(0, 3).map((badgeInfo, i) => (
                                <span
                                  key={i}
                                  title={badgeInfo.descricao}
                                  className="text-[10px] font-black bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm"
                                >
                                  <span>{badgeInfo.icone}</span>
                                  <span>{badgeInfo.nome}</span>
                                </span>
                              ))}
                              {badgesVisiveis.length > 3 && (
                                <span
                                  title={badgesVisiveis.slice(3).map((b) => `${b.icone} ${b.nome}`).join(", ")}
                                  className="text-[10px] font-bold bg-white/5 text-slate-400 px-2 py-1 rounded-lg flex items-center"
                                >
                                  +{badgesVisiveis.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Rodapé do Card: Pontuação & Botão de Aplausos */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          XP da Carreira
                        </span>
                        <span className="text-base font-black text-amber-300">
                          {vet.xpFinal.toLocaleString()} XP
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={aplaudindoMatricula === vet.matricula}
                        onClick={(e) => handleAplaudir(vet.matricula, e)}
                        className="cursor-pointer px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all disabled:opacity-50"
                        title={estaConectado ? "Aplaudir a conquista deste formando (1 por dia)" : "Conecte-se com sua matrícula para aplaudir"}
                      >
                        <span>👏</span>
                        <span>{totalAplausos}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ========================================================
            SEÇÃO INFORMATIVA: COMO ENTRAR NO HALL DA FAMA
           ======================================================== */}
        <section className="mt-16 glass-panel bg-gradient-to-r from-amber-500/10 via-purple-950/20 to-slate-900 border border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-xs font-black text-amber-300 mb-2 border border-amber-500/30">
                <span>⚡</span> Para os Alunos Atuais
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Como Gravar Seu Nome no Hall da Fama?
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                O Hall da Fama é o destino final de quem conclui a formação da Trilha Tech. Para conquistar sua vaga eterna entre as lendas, cumpra os pilares de formatura:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-xl block mb-1">🎯</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">1. Concluir os Módulos</h4>
                  <p className="text-xs text-slate-400 mt-1">Completar 100% das missões e trilhas do curso.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-xl block mb-1">⚡</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">2. Nível de Mestre</h4>
                  <p className="text-xs text-slate-400 mt-1">Alcançar o status lendário e alta frequência nas aulas.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-xl block mb-1">💼</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">3. Projeto de Conclusão</h4>
                  <p className="text-xs text-slate-400 mt-1">Apresentar seu software final e receber o certificado oficial.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Perfil do Aluno */}
      {perfilAberto && (
        <PerfilPublicoModal
          matriculaVisualizador={matriculaVisualizador}
          matriculaAlvo={perfilAberto}
          onClose={() => setPerfilAberto(null)}
        />
      )}

      {/* Modal Amigável para Visitantes Deslogados */}
      <AnimatePresence>
        {modalLoginAberto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel-heavy bg-slate-900 border border-amber-400/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl mx-auto mb-4">
                👏
              </div>

              <h3 className="text-xl font-black text-white">
                Deseja Aplaudir Nossas Lendas?
              </h3>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                A visualização do Hall da Fama é <strong className="text-amber-300">100% pública e aberta a todos</strong>! Porém, para computar seu aplauso diário com sua assinatura oficial de aluno, você precisa estar conectado ao portal.
              </p>

              <div className="pt-6 flex flex-col gap-2.5">
                <Link
                  href="/portal/login"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:brightness-105"
                >
                  🔑 Entrar no Portal com Minha Matrícula
                </Link>

                <button
                  type="button"
                  onClick={() => setModalLoginAberto(false)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Continuar Apenas Visualizando
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
