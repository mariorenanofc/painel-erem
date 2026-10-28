/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemorialFormatura } from "@/src/types";

interface AlunoCuradoriaItem {
  matricula: string;
  nome: string;
  turmaTrilha: string;
  statusTrilha: string;
  avatar: string;
  xpAtual: number;
  nivelAtual: string;
  badges: string[];
  temRascunho: boolean;
  memorial: MemorialFormatura;
}

interface CuradoriaHallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const SUGESTOES_ESPECIALIDADE = [
  "Arquiteto(a) de Sistemas & Fullstack",
  "Especialista em IA & Algoritmos",
  "Engenheiro(a) de Software & UI/UX",
  "Desenvolvedor(a) Front-End & Web",
  "Especialista em Lógica & Back-End",
  "Líder Técnico & Inovação Digital"
];

const SUGESTOES_SELOS = [
  "👑 Top Honra • Excelência Técnica",
  "🔥 Guardião da Presença & Disciplina",
  "🚀 Projeto Destaque de Inovação",
  "⚔️ Mestre em Resolução de Problemas",
  "💎 Destaque em Evolução & Superação",
  "🏅 Lenda Oficial da Trilha Tech"
];

export default function CuradoriaHallModal({
  isOpen,
  onClose,
  onSaved
}: CuradoriaHallModalProps) {
  const [candidatos, setCandidatos] = useState<AlunoCuradoriaItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendentes" | "publicados">("todos");
  const [matriculaSelecionada, setMatriculaSelecionada] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Estados do formulário de curadoria do aluno selecionado
  const [especialidadeOficial, setEspecialidadeOficial] = useState("");
  const [seloHonorifico, setSeloHonorifico] = useState("");
  const [parecerTutor, setParecerTutor] = useState("");
  const [aprovadoProjeto, setAprovadoProjeto] = useState(false);
  const [publicadoNoHall, setPublicadoNoHall] = useState(false);
  const [graduarComoVeterano, setGraduarComoVeterano] = useState(false);
  const [anoFormacao, setAnoFormacao] = useState<number>(new Date().getFullYear());

  const carregarCandidatos = async () => {
    setCarregando(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/tutor/memorial/curadoria");
      const json = await res.json();
      if (json.status === "sucesso" && Array.isArray(json.candidatos)) {
        const lista = json.candidatos as AlunoCuradoriaItem[];
        setCandidatos(lista);
        if (lista.length > 0 && !matriculaSelecionada) {
          selecionarAluno(lista[0]);
        } else if (matriculaSelecionada) {
          const atualizado = lista.find(c => c.matricula === matriculaSelecionada);
          if (atualizado) selecionarAluno(atualizado);
        }
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      setFeedbackMsg({ tipo: "erro", texto: "Erro ao carregar memoriais: " + err.message });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarCandidatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selecionarAluno = (item: AlunoCuradoriaItem) => {
    setMatriculaSelecionada(item.matricula);
    setEspecialidadeOficial(
      item.memorial.especialidadeOficial && item.memorial.especialidadeOficial !== "Aguardando Avaliação do Tutor"
        ? item.memorial.especialidadeOficial
        : "Desenvolvedor(a) Fullstack"
    );
    setSeloHonorifico(item.memorial.seloHonorifico || "🏅 Lenda Oficial da Trilha Tech");
    setParecerTutor(item.memorial.parecerTutor || "");
    setAprovadoProjeto(Boolean(item.memorial.projetoDestaque?.aprovadoPeloTutor));
    setPublicadoNoHall(Boolean(item.memorial.publicadoNoHall));
    setGraduarComoVeterano(item.statusTrilha === "Veterano");
    setAnoFormacao(item.memorial.anoFormacao || new Date().getFullYear());
    setFeedbackMsg(null);
  };

  const alunoAtual = useMemo(() => {
    return candidatos.find(c => c.matricula === matriculaSelecionada) || null;
  }, [candidatos, matriculaSelecionada]);

  const candidatosFiltrados = useMemo(() => {
    return candidatos.filter(c => {
      const matchBusca =
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.matricula.includes(busca);
      if (!matchBusca) return false;
      if (filtroStatus === "pendentes") return c.temRascunho && !c.memorial.publicadoNoHall;
      if (filtroStatus === "publicados") return c.memorial.publicadoNoHall;
      return true;
    });
  }, [candidatos, busca, filtroStatus]);

  const salvarCuradoria = async () => {
    if (!alunoAtual) return;
    setSalvando(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/tutor/memorial/curadoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricula: alunoAtual.matricula,
          especialidadeOficial,
          seloHonorifico,
          parecerTutor,
          aprovadoProjeto,
          publicadoNoHall,
          graduarComoVeterano,
          anoFormacao
        })
      });

      const json = await res.json();
      if (json.status === "sucesso") {
        setFeedbackMsg({ tipo: "sucesso", texto: json.mensagem || "Curadoria salva com sucesso!" });
        // Atualiza localmente o candidato na lista sem precisar reler 75 docs do Firestore
        setCandidatos(prev =>
          prev.map(item =>
            item.matricula === alunoAtual.matricula
              ? {
                  ...item,
                  statusTrilha: json.statusTrilha || item.statusTrilha,
                  memorial: {
                    ...item.memorial,
                    ...(json.memorial || {}),
                    especialidadeOficial,
                    seloHonorifico,
                    parecerTutor,
                    publicadoNoHall,
                    anoFormacao,
                    projetoDestaque: {
                      ...item.memorial.projetoDestaque,
                      aprovadoPeloTutor: aprovadoProjeto
                    }
                  }
                }
              : item
          )
        );
        if (onSaved) onSaved();
      } else {
        setFeedbackMsg({ tipo: "erro", texto: json.mensagem || "Falha ao salvar curadoria." });
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      setFeedbackMsg({ tipo: "erro", texto: "Erro de rede: " + err.message });
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  const totalPublicados = candidatos.filter(c => c.memorial.publicadoNoHall).length;
  const totalPendentes = candidatos.filter(c => c.temRascunho && !c.memorial.publicadoNoHall).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/20 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* HEADER DO MODAL */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
                🏛️
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  Curadoria do Hall da Fama
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                    Santuário de Formandos
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Revise submissões de TCC, atribua títulos honoríficos e publique os formandos na vitrine pública.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="/hall-da-fama"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <span>✨</span> Ver Hall Público
              </a>
              <button
                onClick={onClose}
                className="cursor-pointer w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 text-slate-500 flex items-center justify-center font-black transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* CORPO DIVIDIDO: LISTA ESQUERDA + CURADORIA DIREITA */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* COLUNA ESQUERDA: LISTA DE CANDIDATOS */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-950/40">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou matrícula..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setFiltroStatus("todos")}
                    className={`cursor-pointer py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      filtroStatus === "todos"
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Todos ({candidatos.length})
                  </button>
                  <button
                    onClick={() => setFiltroStatus("pendentes")}
                    className={`cursor-pointer py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      filtroStatus === "pendentes"
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Revisar ({totalPendentes})
                  </button>
                  <button
                    onClick={() => setFiltroStatus("publicados")}
                    className={`cursor-pointer py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      filtroStatus === "publicados"
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    No Hall ({totalPublicados})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {carregando ? (
                  <div className="py-16 text-center text-xs font-bold text-slate-400 animate-pulse">
                    Carregando formandos e memoriais...
                  </div>
                ) : candidatosFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-xs font-semibold text-slate-400 px-4">
                    Nenhum estudante encontrado para este filtro.
                  </div>
                ) : (
                  candidatosFiltrados.map(item => {
                    const selecionado = item.matricula === matriculaSelecionada;
                    return (
                      <button
                        key={item.matricula}
                        onClick={() => selecionarAluno(item)}
                        className={`cursor-pointer w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                          selecionado
                            ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
                            : "bg-white dark:bg-slate-900/70 border-slate-200/70 dark:border-slate-800/80 hover:border-amber-500/30"
                        }`}
                      >
                        <img
                          src={item.avatar}
                          alt={item.nome}
                          className="w-11 h-11 rounded-xl object-cover border border-amber-500/30 bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {item.nome}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Mat: {item.matricula} • {item.xpAtual.toLocaleString("pt-BR")} XP
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {item.memorial.publicadoNoHall ? (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                ✅ Publicado
                              </span>
                            ) : item.temRascunho ? (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                ⏳ Enviou Rascunho
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500">
                                Sem Rascunho
                              </span>
                            )}
                            {item.statusTrilha === "Veterano" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-500 dark:text-purple-300 border border-purple-500/30">
                                🎓 Veterano
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: DETALHES DO RASCUNHO E FORMULÁRIO DO MESTRE */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
              {!alunoAtual ? (
                <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">
                  Selecione um formando na lista ao lado para iniciar a curadoria.
                </div>
              ) : (
                <>
                  {/* CABEÇALHO DO ALUNO SELECIONADO */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={alunoAtual.avatar}
                        alt={alunoAtual.nome}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 bg-slate-800"
                      />
                      <div>
                        <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white">
                          {alunoAtual.nome}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Matrícula: <span className="text-amber-500 font-bold">{alunoAtual.matricula}</span> •{" "}
                          {alunoAtual.turmaTrilha} • Status:{" "}
                          <span className="font-bold text-slate-700 dark:text-slate-200">{alunoAtual.statusTrilha}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            ⚡ {alunoAtual.xpAtual.toLocaleString("pt-BR")} XP ({alunoAtual.nivelAtual})
                          </span>
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                            👏 {alunoAtual.memorial.totalAplausos || 0} Aplausos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 1: O QUE O ALUNO SUBMETEU (SOMENTE LEITURA / AUDITORIA) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Frase e Certificações */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <span>💬</span> Frase de Formatura & Certificações Tech
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800 italic text-xs text-slate-600 dark:text-slate-300">
                        {alunoAtual.memorial.fraseFormatura
                          ? `"${alunoAtual.memorial.fraseFormatura}"`
                          : "O aluno ainda não redigiu sua frase de formatura."}
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">
                          Tecnologias Certificadas (Quiz Nota ≥ 7.0):
                        </p>
                        {alunoAtual.memorial.certificacoesTech && alunoAtual.memorial.certificacoesTech.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {alunoAtual.memorial.certificacoesTech.map(cert => (
                              <span
                                key={cert.tech}
                                className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                                  cert.aprovado
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                }`}
                              >
                                {cert.tech}: Nota {cert.nota}/10 ({cert.tentativas}x)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Nenhum teste técnico realizado ainda.</p>
                        )}
                      </div>
                    </div>

                    {/* Projeto de Conclusão / TCC */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <span>🚀</span> Projeto de Conclusão (TCC Submetido)
                      </h4>
                      {alunoAtual.memorial.projetoDestaque?.titulo ? (
                        <div className="space-y-2">
                          <p className="text-sm font-black text-slate-800 dark:text-white">
                            {alunoAtual.memorial.projetoDestaque.titulo}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {alunoAtual.memorial.projetoDestaque.descricao || "Sem descrição informada."}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {alunoAtual.memorial.projetoDestaque.linkDeploy && (
                              <a
                                href={alunoAtual.memorial.projetoDestaque.linkDeploy}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[11px] font-black flex items-center gap-1"
                              >
                                🌐 Testar Deploy
                              </a>
                            )}
                            {alunoAtual.memorial.projetoDestaque.linkGithub && (
                              <a
                                href={alunoAtual.memorial.projetoDestaque.linkGithub}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:brightness-110 text-slate-700 dark:text-slate-200 text-[11px] font-black flex items-center gap-1"
                              >
                                💻 Repositório GitHub
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-4">
                          O aluno ainda não cadastrou um projeto de conclusão no perfil.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO 2: CURADORIA EXCLUSIVA DO TUTOR */}
                  <div className="p-5 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <span>🛡️</span> Curadoria Oficial do Mestre (Exclusivo Tutor)
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Ano de Formação:</label>
                        <input
                          type="number"
                          value={anoFormacao}
                          onChange={e => setAnoFormacao(Number(e.target.value) || 2026)}
                          className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-center"
                        />
                      </div>
                    </div>

                    {/* Especialidade Oficial */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        1. Especialidade Oficial (Título Profissional no Card)
                      </label>
                      <input
                        type="text"
                        value={especialidadeOficial}
                        onChange={e => setEspecialidadeOficial(e.target.value)}
                        placeholder="Ex: Arquiteto(a) de Sistemas & Fullstack"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {SUGESTOES_ESPECIALIDADE.map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setEspecialidadeOficial(sug)}
                            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 text-slate-600 dark:text-slate-300 transition-all"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selo Honorífico */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        2. Selo Honorífico de Destaque
                      </label>
                      <input
                        type="text"
                        value={seloHonorifico}
                        onChange={e => setSeloHonorifico(e.target.value)}
                        placeholder="Ex: 👑 Top Honra • Destaque em Superação"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {SUGESTOES_SELOS.map(selo => (
                          <button
                            key={selo}
                            type="button"
                            onClick={() => setSeloHonorifico(selo)}
                            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 text-slate-600 dark:text-slate-300 transition-all"
                          >
                            + {selo}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Parecer do Tutor / Palavra do Mestre */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        3. Palavra do Mestre (Parecer e Homenagem Oficial)
                      </label>
                      <textarea
                        rows={3}
                        value={parecerTutor}
                        onChange={e => setParecerTutor(e.target.value)}
                        placeholder="Escreva uma mensagem de reconhecimento sobre a trajetória deste aluno na Trilha Tech..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    {/* Chaves de Aprovação e Publicação */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <label className="cursor-pointer p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={aprovadoProjeto}
                          onChange={e => setAprovadoProjeto(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">Aprovar Projeto TCC</p>
                          <p className="text-[10px] text-slate-400">Valida o link do projeto no card</p>
                        </div>
                      </label>

                      <label className="cursor-pointer p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={graduarComoVeterano}
                          onChange={e => setGraduarComoVeterano(e.target.checked)}
                          className="w-4 h-4 accent-purple-500 rounded"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">Graduar: Veterano</p>
                          <p className="text-[10px] text-slate-400">Encerra ciclo (retira do ranking ativo)</p>
                        </div>
                      </label>

                      <label className="cursor-pointer p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={publicadoNoHall}
                          onChange={e => setPublicadoNoHall(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                        <div>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            Publicar no Hall
                          </p>
                          <p className="text-[10px] text-slate-400">Visível na vitrine pública</p>
                        </div>
                      </label>
                    </div>

                    {feedbackMsg && (
                      <div
                        className={`p-3.5 rounded-xl text-xs font-bold border ${
                          feedbackMsg.tipo === "sucesso"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-500 border-rose-500/30"
                        }`}
                      >
                        {feedbackMsg.tipo === "sucesso" ? "✅ " : "⚠️ "}
                        {feedbackMsg.texto}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={salvarCuradoria}
                        className="cursor-pointer px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
                      >
                        {salvando ? "Salvando Curadoria..." : "💾 Salvar Curadoria & Publicação"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

