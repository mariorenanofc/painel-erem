/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { apiAluno } from "@/src/services/api";
import { MemorialFormatura, CertificacaoTech, QuestaoTechPublica } from "@/src/types";

interface MemorialTabProps {
  matricula: string;
  nomeAluno: string;
  turma: string;
}

interface TechDisponivel {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  badge: string;
  totalQuestoes: number;
}

// Opções de Avatares Temáticos de Formatura / Dev
const AVATARES_FORMATURA = [
  { id: "dev-robot-gold", url: "https://api.dicebear.com/9.x/bottts/svg?seed=GraduationGold&colors=amber,yellow", label: "Robô de Ouro" },
  { id: "dev-robot-cyber", url: "https://api.dicebear.com/9.x/bottts/svg?seed=CyberLenda&colors=cyan,purple", label: "Cyber Lenda" },
  { id: "dev-robot-elite", url: "https://api.dicebear.com/9.x/bottts/svg?seed=TechMaster&colors=indigo,emerald", label: "Mestre Tech" },
  { id: "dev-scholar-1", url: "https://api.dicebear.com/9.x/bottts/svg?seed=OtavioBenedito", label: "Dev Supremo" },
  { id: "dev-scholar-2", url: "https://api.dicebear.com/9.x/bottts/svg?seed=KellyAlencar", label: "Arquiteta de Redes" },
  { id: "dev-scholar-3", url: "https://api.dicebear.com/9.x/bottts/svg?seed=BrenoSilva", label: "Líder em IA" },
];

export default function MemorialTab({ matricula, nomeAluno, turma }: MemorialTabProps) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Dados do Memorial
  const [fraseFormatura, setFraseFormatura] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoCustomizadaInput, setFotoCustomizadaInput] = useState("");
  const [tituloProjeto, setTituloProjeto] = useState("");
  const [descricaoProjeto, setDescricaoProjeto] = useState("");
  const [linkDeploy, setLinkDeploy] = useState("");
  const [linkGithub, setLinkGithub] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [publicadoNoHall, setPublicadoNoHall] = useState(false);
  const [especialidadeOficial, setEspecialidadeOficial] = useState("");
  const [seloHonorifico, setSeloHonorifico] = useState("");
  const [totalAplausos, setTotalAplausos] = useState(0);

  // Certificações e Tecnologias
  const [tecnologias, setTecnologias] = useState<TechDisponivel[]>([]);
  const [certificacoes, setCertificacoes] = useState<CertificacaoTech[]>([]);
  const [techStackAprovada, setTechStackAprovada] = useState<string[]>([]);

  // Estado do Questionário (Modal de Teste)
  const [modalTesteAberto, setModalTesteAberto] = useState(false);
  const [techEmTeste, setTechEmTeste] = useState<TechDisponivel | null>(null);
  const [questoesTeste, setQuestoesTeste] = useState<QuestaoTechPublica[]>([]);
  const [questaoAtualIdx, setQuestaoAtualIdx] = useState(0);
  const [respostasTeste, setRespostasTeste] = useState<Record<number, number>>({});
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    aprovado: boolean;
    nota: number;
    acertos: number;
    total: number;
    mensagem: string;
    badgeConcedida: string | null;
  } | null>(null);

  // Carregar dados do Memorial ao montar
  useEffect(() => {
    let montado = true;

    async function carregarDados() {
      try {
        setCarregando(true);
        const res = await apiAluno.buscarMemorial(matricula);
        if (!montado) return;

        if (res.status === "sucesso") {
          const mem = res.memorial as MemorialFormatura;
          setFraseFormatura(mem.fraseFormatura || "");
          setFotoUrl(mem.fotoUrl || "");
          setFotoCustomizadaInput(mem.fotoUrl || "");
          setLinkedinUrl(mem.linkedinUrl || "");
          setGithubUrl(mem.githubUrl || "");
          setPublicadoNoHall(Boolean(mem.publicadoNoHall));
          setEspecialidadeOficial(mem.especialidadeOficial || "");
          setSeloHonorifico(mem.seloHonorifico || "");
          setTotalAplausos(mem.totalAplausos || 0);

          if (mem.projetoDestaque) {
            setTituloProjeto(mem.projetoDestaque.titulo || "");
            setDescricaoProjeto(mem.projetoDestaque.descricao || "");
            setLinkDeploy(mem.projetoDestaque.linkDeploy || "");
            setLinkGithub(mem.projetoDestaque.linkGithub || "");
          }

          if (Array.isArray(mem.certificacoesTech)) {
            setCertificacoes(mem.certificacoesTech);
          }
          if (Array.isArray(mem.techStack)) {
            setTechStackAprovada(mem.techStack);
          }
          if (Array.isArray(res.tecnologiasDisponiveis)) {
            setTecnologias(res.tecnologiasDisponiveis);
          }
        }
      } catch (err: unknown) {
        console.error("Erro ao carregar memorial:", err);
      } finally {
        if (montado) setCarregando(false);
      }
    }

    if (matricula) {
      carregarDados();
    }

    return () => {
      montado = false;
    };
  }, [matricula]);

  // Salvar Dados Básicos do Memorial
  const handleSalvarMemorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setMensagemSucesso(null);
      setMensagemErro(null);

      const res = await apiAluno.salvarMemorial({
        matricula,
        fraseFormatura,
        fotoUrl: fotoUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        projetoDestaque: {
          titulo: tituloProjeto.trim(),
          descricao: descricaoProjeto.trim(),
          linkDeploy: linkDeploy.trim(),
          linkGithub: linkGithub.trim()
        }
      });

      if (res.status === "sucesso") {
        setMensagemSucesso("Memorial e foto do perfil salvos com sucesso!");
        setTimeout(() => setMensagemSucesso(null), 4000);
      } else {
        setMensagemErro(res.mensagem || "Erro ao salvar memorial.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMensagemErro("Erro ao salvar: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  // Abrir Modal de Teste Teórico de uma Linguagem
  const handleIniciarTeste = async (tech: TechDisponivel) => {
    try {
      setTechEmTeste(tech);
      setQuestoesTeste([]);
      setQuestaoAtualIdx(0);
      setRespostasTeste({});
      setResultadoTeste(null);
      setModalTesteAberto(true);

      const res = await apiAluno.buscarPerguntasTech(tech.id);
      if (res.status === "sucesso" && Array.isArray(res.questoes)) {
        setQuestoesTeste(res.questoes);
      } else {
        alert("Não foi possível carregar as perguntas desta tecnologia.");
        setModalTesteAberto(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Erro ao carregar questionário:", error.message);
      alert("Erro ao carregar questionário: " + error.message);
      setModalTesteAberto(false);
    }
  };

  // Submeter Respostas do Teste para Validação no Servidor
  const handleEnviarRespostas = async () => {
    if (!techEmTeste) return;
    try {
      setEnviandoTeste(true);
      const res = await apiAluno.submeterTesteTech(matricula, techEmTeste.id, respostasTeste);

      if (res.status === "sucesso") {
        setResultadoTeste({
          aprovado: res.aprovado,
          nota: res.nota,
          acertos: res.acertos,
          total: res.totalQuestoes,
          mensagem: res.mensagem,
          badgeConcedida: res.badgeConcedida
        });

        if (Array.isArray(res.certificacoes)) {
          setCertificacoes(res.certificacoes);
        }
        if (Array.isArray(res.techStack)) {
          setTechStackAprovada(res.techStack);
        }

        // Se aprovado com nota >= 7, explode confetes!
        if (res.aprovado) {
          confetti({
            particleCount: 70,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#10b981", "#fbbf24", "#6366f1", "#ffffff"]
          });
        }
      } else {
        alert(res.mensagem || "Erro ao avaliar respostas.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("Erro ao submeter teste: " + error.message);
    } finally {
      setEnviandoTeste(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando dados do Memorial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* STATUS DO MEMORIAL NO HALL DA FAMA */}
      <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-sm text-slate-800 dark:text-amber-200">
                Santuário de Formatura • {turma}
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                publicadoNoHall 
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40" 
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
              }`}>
                {publicadoNoHall ? "✨ Publicado no Hall da Fama" : "⏳ Em Curadoria"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {especialidadeOficial || "Aguardando homologação da especialidade pelo Tutor."}
              </span>
              {seloHonorifico && (
                <span className="text-[10px] font-black text-amber-500 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  🏆 {seloHonorifico}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
            <span>👏</span>
            <span>{totalAplausos} Aplausos Recebidos</span>
          </span>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
          <span>✅</span> {mensagemSucesso}
        </div>
      )}

      {mensagemErro && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs rounded-xl font-bold flex items-center gap-2">
          <span>⚠️</span> {mensagemErro}
        </div>
      )}

      {/* FORMULÁRIO DO MEMORIAL */}
      <form onSubmit={handleSalvarMemorial} className="space-y-6">
        {/* SEÇÃO 1: FOTO DO PERFIL DO MEMORIAL */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <span>📸</span> Foto Oficial de Formatura & Card
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Escolha a foto que será eternizada no seu Collector Card no Hall da Fama.
              </p>
            </div>

            {/* Preview da foto */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-950 shadow-md">
                <img
                  src={fotoUrl || "https://api.dicebear.com/9.x/bottts/svg?seed=" + matricula}
                  alt={nomeAluno}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://api.dicebear.com/9.x/bottts/svg?seed=fallback";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Galeria de Avatares Temáticos */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Opção 1: Avatares Estilizados Trilha Tech
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {AVATARES_FORMATURA.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => {
                    setFotoUrl(av.url);
                    setFotoCustomizadaInput(av.url);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    fotoUrl === av.url
                      ? "border-amber-400 bg-amber-500/15 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-amber-400/50 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <img src={av.url} alt={av.label} className="w-10 h-10 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate w-full text-center">
                    {av.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Opção de URL Externa de Foto */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Opção 2: Ou insira um link direto de foto (GitHub, LinkedIn, Imgur, etc.)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={fotoCustomizadaInput}
                onChange={(e) => setFotoCustomizadaInput(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  if (fotoCustomizadaInput.trim()) {
                    setFotoUrl(fotoCustomizadaInput.trim());
                  }
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Aplicar Foto
              </button>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: FRASE DE FORMATURA E REDES SOCIAIS */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <span>💬</span> Frase de Formatura & Redes
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Sua Frase Eterna (Citação no Card)
            </label>
            <textarea
              value={fraseFormatura}
              onChange={(e) => setFraseFormatura(e.target.value)}
              maxLength={180}
              rows={2}
              placeholder="Ex: Codar é transformar ideias abstratas em impacto real no mundo."
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
            />
            <span className="text-[10px] text-slate-400 block text-right mt-0.5">
              {fraseFormatura.length}/180 caracteres
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                LinkedIn (URL)
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/seuperfil"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                GitHub (URL)
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/seuperfil"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: PROJETO DE CONCLUSÃO / TCC */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <span>🚀</span> Projeto de Conclusão de Curso (TCC)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apresente sua principal aplicação desenvolvida durante o curso para os visitantes do Hall da Fama testarem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Título do Projeto
              </label>
              <input
                type="text"
                value={tituloProjeto}
                onChange={(e) => setTituloProjeto(e.target.value)}
                placeholder="Ex: Portal Educacional Gamificado com Next.js"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Descrição Curta
              </label>
              <textarea
                value={descricaoProjeto}
                onChange={(e) => setDescricaoProjeto(e.target.value)}
                rows={2}
                placeholder="Explique o problema que o software resolve e as tecnologias utilizadas..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Link do Deploy / Aplicação Online
              </label>
              <input
                type="url"
                value={linkDeploy}
                onChange={(e) => setLinkDeploy(e.target.value)}
                placeholder="https://meuprojeto.vercel.app"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Repositório de Código (GitHub)
              </label>
              <input
                type="url"
                value={linkGithub}
                onChange={(e) => setLinkGithub(e.target.value)}
                placeholder="https://github.com/aluno/meuprojeto"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR ALTERAÇÕES GERAIS */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={salvando}
            className="cursor-pointer px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {salvando ? "Salvando..." : "Salvar Dados do Memorial"}
          </motion.button>
        </div>
      </form>

      {/* =========================================================================
          SEÇÃO 4: LINGUAGENS DE DOMÍNIO & QUESTIONÁRIOS DE AVALIAÇÃO (NOTA >= 7)
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <span>⚡</span> Tecnologias de Domínio & Badges de Destaque
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Para ostentar cada tecnologia no seu card oficial, você deve realizar o questionário técnico de 10 questões e obter <strong className="text-amber-500">nota &ge; 7.0</strong>.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              {techStackAprovada.length} de {tecnologias.length} Aprovadas
            </span>
          </div>
        </div>

        {/* Grid de Tecnologias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {tecnologias.map((tech) => {
            const cert = certificacoes.find(c => c.tech.toLowerCase() === tech.id.toLowerCase());
            const aprovado = cert ? cert.aprovado : false;
            const nota = cert ? cert.nota : null;

            return (
              <div
                key={tech.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  aprovado
                    ? "bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent border-emerald-500/40 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{tech.icone}</span>
                    {aprovado ? (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        ⭐ Nota {nota}/10 • Aprovado
                      </span>
                    ) : nota !== null ? (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
                        Nota {nota}/10 (Necessário &ge; 7)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        Não avaliado
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                    {tech.nome}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {tech.descricao}
                  </p>

                  {aprovado && (
                    <div className="mb-3 px-2 py-1 bg-amber-400/15 border border-amber-400/30 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">
                      {tech.badge}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleIniciarTeste(tech)}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    aprovado
                      ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-105 text-slate-950 shadow-sm"
                  }`}
                >
                  {aprovado ? "Refazer Prova (Melhorar Nota)" : "📝 Fazer Teste Teórico (10 Questões)"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MODAL INTERATIVO: QUESTIONÁRIO TÉCNICO (10 QUESTÕES)
         ========================================================================= */}
      <AnimatePresence>
        {modalTesteAberto && techEmTeste && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel-heavy bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white shadow-2xl relative"
            >
              {/* Topo do Modal */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{techEmTeste.icone}</span>
                  <div>
                    <h3 className="font-display font-black text-lg text-amber-300">
                      Avaliação Oficial de {techEmTeste.nome}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Critério de aprovação: 7 ou mais acertos de 10 (&ge; 70%)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalTesteAberto(false)}
                  className="text-slate-400 hover:text-white text-2xl leading-none cursor-pointer p-1"
                >
                  &times;
                </button>
              </div>

              {/* TELA DE RESULTADO APÓS SUBMISSÃO */}
              {resultadoTeste ? (
                <div className="py-6 text-center space-y-4">
                  <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl border-2 ${
                    resultadoTeste.aprovado
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                      : "bg-amber-500/20 border-amber-400 text-amber-300"
                  }`}>
                    {resultadoTeste.aprovado ? "🏆" : "📚"}
                  </div>

                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Resultado da Avaliação
                    </span>
                    <h3 className="text-2xl font-black mt-1">
                      {resultadoTeste.aprovado ? "Parabéns, Desenvolvedor!" : "Continue Praticando!"}
                    </h3>
                    <p className="text-3xl font-black text-amber-400 mt-2">
                      Nota {resultadoTeste.nota} / 10
                    </p>
                    <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                      {resultadoTeste.mensagem}
                    </p>
                  </div>

                  {resultadoTeste.aprovado && resultadoTeste.badgeConcedida && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl inline-block">
                      <span className="text-xs font-bold text-amber-400 block mb-1">
                        Selo de Domínio Conquistado para o Hall da Fama:
                      </span>
                      <span className="text-sm font-black text-white">
                        {resultadoTeste.badgeConcedida}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      onClick={() => setModalTesteAberto(false)}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                    {!resultadoTeste.aprovado && (
                      <button
                        onClick={() => handleIniciarTeste(techEmTeste)}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                </div>
              ) : questoesTeste.length > 0 ? (
                /* EXIBIÇÃO DAS 10 QUESTÕES */
                <div className="space-y-6">
                  {/* Barra de Progresso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Questão {questaoAtualIdx + 1} de {questoesTeste.length}</span>
                      <span>{Object.keys(respostasTeste).length} respondidas</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                        style={{ width: `${((questaoAtualIdx + 1) / questoesTeste.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Card da Questão Atual */}
                  {(() => {
                    const questaoAtual = questoesTeste[questaoAtualIdx];
                    if (!questaoAtual) return null;

                    return (
                      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md">
                          Questão #{questaoAtual.id}
                        </span>

                        <h4 className="text-sm md:text-base font-bold text-white leading-snug">
                          {questaoAtual.pergunta}
                        </h4>

                        <div className="space-y-2 pt-2">
                          {questaoAtual.opcoes.map((opcao, optIdx) => {
                            const selecionada = respostasTeste[questaoAtual.id] === optIdx;

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => {
                                  setRespostasTeste(prev => ({
                                    ...prev,
                                    [questaoAtual.id]: optIdx
                                  }));
                                }}
                                className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer flex items-start gap-3 ${
                                  selecionada
                                    ? "bg-amber-500/20 border-amber-400 text-white font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                                    : "bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/20"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  selecionada ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-400"
                                }`}>
                                  {["A", "B", "C", "D"][optIdx]}
                                </span>
                                <span>{opcao}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navegação entre Questões e Botão de Finalizar */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={questaoAtualIdx === 0}
                      onClick={() => setQuestaoAtualIdx(prev => prev - 1)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      &larr; Anterior
                    </button>

                    <div className="flex gap-1.5 overflow-x-auto max-w-[200px] px-2">
                      {questoesTeste.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setQuestaoAtualIdx(i)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            i === questaoAtualIdx
                              ? "bg-amber-400 text-slate-950 font-black scale-110"
                              : respostasTeste[questoesTeste[i].id] !== undefined
                              ? "bg-emerald-500/30 text-emerald-300"
                              : "bg-white/5 text-slate-500"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    {questaoAtualIdx < questoesTeste.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setQuestaoAtualIdx(prev => prev + 1)}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Próxima &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={enviandoTeste || Object.keys(respostasTeste).length < questoesTeste.length}
                        onClick={handleEnviarRespostas}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        {enviandoTeste ? "Corrigindo Prova..." : "Concluir e Avaliar"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Carregando banco de questões...
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
