/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  DadosAluno,
  Atividade,
  PerfilAluno,
  FrequenciaHistorico,
  DadosFrequencia,
  Notificacao,
} from "@/src/types";

import { calcularBadges, Badge } from "@/src/utils/badges";
import PixModal from "@/src/components/PixModal";
import RankingModal from "@/src/components/RankingModal";
import PortalHeader from "@/src/components/PortalHeader";
import PerfilModal from "@/src/components/PerfilModal";
import NovaConquistaModal from "@/src/components/NovaConquistaModal";
import NovidadesModal from "@/src/components/NovidadesModal";
import ResponderMissaoModal from "@/src/components/ResponderMissaoModal";
import { apiAluno, apiGeral } from "@/src/services/api";

const subscribe = (callback: () => void) => {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return () => {};
};

const getSnapshot = () =>
  typeof window !== "undefined" ? localStorage.getItem("alunoLogado") : null;
const getServerSnapshot = () => null;

export default function PortalDashboard() {
  const router = useRouter();

  const [montado, setMontado] = useState(false);
  const dadosSalvos = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const aluno: DadosAluno | null = useMemo(() => {
    return dadosSalvos ? JSON.parse(dadosSalvos) : null;
  }, [dadosSalvos]);

  // ================= ESTADOS =================
  const [progressoNivel, setProgressoNivel] = useState({
    porcentagem: 0,
    faltam: 0,
    nomeProximo: "Bronze",
    isMaximo: false,
  });
  const [nomeProjeto, setNomeProjeto] = useState("Portal Educacional");
  const [carregandoPortal, setCarregandoPortal] = useState(true);
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  const [cursoSelecionado, setCursoSelecionado] = useState<string | null>(null);
  const [aulasFechadas, setAulasFechadas] = useState<Record<string, boolean>>(
    {},
  );

  const [xpTotalSistema, setXpTotalSistema] = useState(0);
  const [nivelSistema, setNivelSistema] = useState("Iniciante");
  const [avatarSistema, setAvatarSistema] = useState("avatar-padrao");
  const [curtidasSistema, setCurtidasSistema] = useState(0);
  const [ofensivaDias, setOfensivaDias] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [taxaPresenca, setTaxaPresenca] = useState(100);
  const [estatisticas, setEstatisticas] = useState({
    xpDoado: 0,
    xpRecebido: 0,
    totalCheckins: 0,
  });

  const [badgesResgatadas, setBadgesResgatadas] = useState<string[]>([]);
  const [novasConquistas, setNovasConquistas] = useState<Badge[]>([]);
  const [resgatandoBadge, setResgatandoBadge] = useState(false);

  const [abaAtividade, setAbaAtividade] = useState<
    "Pendentes" | "Atrasadas" | "Concluidas"
  >("Pendentes");
  const [buscaAtividade, setBuscaAtividade] = useState("");

  const [fazendoCheckin, setFazendoCheckin] = useState(false);
  const [checkinRealizado, setCheckinRealizado] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");

  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [zapConfirmado, setZapConfirmado] = useState(true);
  const [zapLink, setZapLink] = useState("");
  const [confirmandoZap, setConfirmandoZap] = useState(false);

  const [perfilAberto, setPerfilAberto] = useState(false);
  const [dadosPerfil, setDadosPerfil] = useState<PerfilAluno | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [modalFrequenciaAberto, setModalFrequenciaAberto] = useState(false);
  const [carregandoFrequencia, setCarregandoFrequencia] = useState(false);
  const [dadosFrequencia, setDadosFrequencia] =
    useState<DadosFrequencia | null>(null);

  const [modalPresenteAberto, setModalPresenteAberto] = useState(false);
  const [resgatandoPresente, setResgatandoPresente] = useState(false);

  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [alvoPix, setAlvoPix] = useState<string | null>(null);
  const [rankingAberto, setRankingAberto] = useState(false);

  const VERSAO_ATUALIZACAO = "1.8.1";
  const [modalNovidadesAberto, setModalNovidadesAberto] = useState(false);

  // ================= EFEITOS =================
  useEffect(() => {
    const handleAbrirPixEvent = (e: CustomEvent) => {
      setAlvoPix(e.detail);
      setModalPixAberto(true);
    };
    window.addEventListener(
      "abrirPixRequest",
      handleAbrirPixEvent as EventListener,
    );
    return () =>
      window.removeEventListener(
        "abrirPixRequest",
        handleAbrirPixEvent as EventListener,
      );
  }, []);

  const carregarPortal = useCallback(async () => {
    if (!aluno) return;
    try {
      const data = await apiAluno.carregarPortal(aluno.matricula);
      if (data.status === "sucesso") {
        setXpTotalSistema(data.xpTotal);
        if (data.progressoNivel) setProgressoNivel(data.progressoNivel);
        setNivelSistema(data.nivel);
        if (data.avatar) setAvatarSistema(data.avatar);
        if (data.totalCurtidas !== undefined)
          setCurtidasSistema(data.totalCurtidas);
        if (data.ofensivaDias !== undefined) setOfensivaDias(data.ofensivaDias);
        setZapConfirmado(data.whatsapp.confirmado);
        setZapLink(data.whatsapp.link);
        setAtividades(data.atividades);
        setNotificacoes(data.notificacoes || []);
        setBadgesResgatadas(data.badgesResgatadas || []);
        if (data.taxaPresenca !== undefined) setTaxaPresenca(data.taxaPresenca);
        if (data.stats) setEstatisticas(data.stats);
        if (data.aniversario.isAniversario && !data.aniversario.jaResgatado)
          setModalPresenteAberto(true);
      }
    } catch (e) {
      console.error("Erro ao carregar o portal.");
    } finally {
      setCarregandoPortal(false);
    }
  }, [aluno]);

  useEffect(() => {
    setMontado(true);
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
  }, []);

  useEffect(() => {
    if (montado && dadosSalvos === null) router.push("/portal/login");
    else if (montado && aluno) {
      carregarPortal();
      const dataHoje = new Date().toLocaleDateString("pt-BR");
      const ultimoCheckin = localStorage.getItem(`checkin_${aluno.matricula}`);
      if (ultimoCheckin === dataHoje) setCheckinRealizado(true);

      const versaoLida = localStorage.getItem(`novidades_${aluno.matricula}`);
      if (versaoLida !== VERSAO_ATUALIZACAO) {
        setModalNovidadesAberto(true);
      }
    }
  }, [montado, aluno, carregarPortal, router, dadosSalvos]);

  useEffect(() => {
    if (novasConquistas.length > 0)
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.5 },
        zIndex: 99999,
      });
  }, [novasConquistas.length]);

  useEffect(() => {
    if (modalPresenteAberto)
      confetti({
        particleCount: 250,
        spread: 100,
        origin: { y: 0.4 },
        zIndex: 99999,
        colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
      });
  }, [modalPresenteAberto]);

  useEffect(() => {
    if (!montado || !aluno || carregandoPortal) return;

    const dadosBadges = {
      atividades: atividades,
      xpTotal: xpTotalSistema,
      xpDoado: estatisticas.xpDoado,
      xpRecebido: estatisticas.xpRecebido,
      totalCheckins: estatisticas.totalCheckins,
      whatsappConfirmado: zapConfirmado,
      aniversarioResgatado: false,
      totalCurtidas: curtidasSistema,
    };
    const badgesAtuais = calcularBadges(dadosBadges);
    const badgesDesbloqueadas = badgesAtuais.filter((b) => b.desbloqueada);

    const novas = badgesDesbloqueadas.filter(
      (b) => !badgesResgatadas.includes(b.id),
    );

    if (novas.length > 0) {
      setNovasConquistas((prev) => {
        const filaReal = [...prev];
        novas.forEach((n) => {
          if (!filaReal.some((p) => p.id === n.id)) filaReal.push(n);
        });
        return filaReal;
      });
    }
  }, [
    montado,
    aluno,
    carregandoPortal,
    atividades,
    xpTotalSistema,
    estatisticas,
    zapConfirmado,
    badgesResgatadas,
    curtidasSistema,
  ]);

  // ================= FUNÇÕES DE AÇÃO =================
  const resgatarRecompensaBadge = async (badge: Badge) => {
    if (!aluno) return;
    setResgatandoBadge(true);
    try {
      const data = await apiAluno.resgatarBadge(
        aluno.matricula,
        badge.id,
        badge.recompensa,
        badge.nome,
      );
      if (data.status === "sucesso") {
        setNovasConquistas((prev) => prev.slice(1));
        carregarPortal();
      } else {
        alert("⚠️ " + data.mensagem);
        setNovasConquistas((prev) => prev.slice(1));
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setResgatandoBadge(false);
    }
  };

  const confirmarEntradaGrupo = async () => {
    if (!aluno) return;
    setConfirmandoZap(true);
    try {
      const data = await apiAluno.confirmarWhatsapp(aluno.matricula);
      if (data.status === "sucesso") {
        setZapConfirmado(true);
        alert("✅ Perfeito! Agora você não perde nenhum aviso.");
      }
    } catch {
    } finally {
      setConfirmandoZap(false);
    }
  };

  const fazerLogout = () => {
    localStorage.removeItem("alunoLogado");
    router.push("/portal/login");
  };

  const enviarMissao = async (respostaFinal: string) => {
    if (!aluno || !missaoAberta) return;
    setEnviando(true);
    try {
      const data = await apiAluno.enviarMissao(
        aluno.matricula,
        missaoAberta.id,
        respostaFinal,
      );
      if (data.status === "sucesso") {
        alert("✅ " + data.mensagem);
        setMissaoAberta(null);
        carregarPortal();
      } else alert("⚠️ " + data.mensagem);
    } catch {
      alert("❌ Erro.");
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aluno) return;
    if (!senhaDigitada.trim()) return alert("Digite a senha da lousa!");
    setFazendoCheckin(true);
    try {
      const data = await apiAluno.fazerCheckin(aluno.matricula, senhaDigitada);
      const dataHoje = new Date().toLocaleDateString("pt-BR");

      if (data.status === "sucesso") {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.7 },
          zIndex: 99999,
          colors: ["#10b981", "#34d399", "#ffffff"],
        });
        alert("🎉 " + data.mensagem);
        localStorage.setItem(`checkin_${aluno.matricula}`, dataHoje);
        setCheckinRealizado(true);
        setModalSenhaAberto(false);
        setSenhaDigitada("");
        carregarPortal();
      } else {
        alert("⚠️ " + data.mensagem);
        if (data.mensagem.includes("já garantiu")) {
          localStorage.setItem(`checkin_${aluno.matricula}`, dataHoje);
          setCheckinRealizado(true);
          setModalSenhaAberto(false);
        }
      }
    } catch {
      alert("❌ Erro ao tentar registar a presença.");
    } finally {
      setFazendoCheckin(false);
    }
  };

  const abrirPerfil = async () => {
    if (!aluno) return;
    setPerfilAberto(true);
    setCarregandoPerfil(true);
    try {
      const data = await apiAluno.buscarPerfil(aluno.matricula);
      if (data.status === "sucesso") setDadosPerfil(data.perfil);
      else alert("⚠️ " + data.mensagem);
    } catch {
    } finally {
      setCarregandoPerfil(false);
    }
  };

  const salvarPerfil = async (dadosAtualizados: PerfilAluno) => {
    if (!dadosAtualizados) return;
    setSalvandoPerfil(true);
    try {
      const data = await apiAluno.atualizarContatos(
        dadosAtualizados.matricula,
        dadosAtualizados.turma,
        dadosAtualizados.telefoneAluno,
        dadosAtualizados.telefoneResponsavel,
      );
      if (data.status === "sucesso") {
        alert("✅ Salvo!");
        setPerfilAberto(false);
      } else alert("⚠️ " + data.mensagem);
    } catch {
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const abrirMinhaFrequencia = async () => {
    if (!aluno) return;
    setModalFrequenciaAberto(true);
    setCarregandoFrequencia(true);
    try {
      const data = await apiAluno.minhaFrequencia(aluno.matricula);
      if (data.status === "sucesso") setDadosFrequencia(data);
    } catch {
    } finally {
      setCarregandoFrequencia(false);
    }
  };

  const resgatarPresente = async () => {
    if (!aluno) return;
    setResgatandoPresente(true);
    try {
      const data = await apiAluno.resgatarAniversario(aluno.matricula);
      if (data.status === "sucesso") {
        setModalPresenteAberto(false);
        carregarPortal();
      } else alert("⚠️ " + data.mensagem);
    } catch {
    } finally {
      setResgatandoPresente(false);
    }
  };

  const salvarNovoAvatar = async (emoji: string) => {
    if (!aluno) return;
    setAvatarSistema(emoji);
    try {
      await apiAluno.salvarAvatar(aluno.matricula, emoji);
    } catch {}
  };

  const toggleAula = (nomeAula: string) => {
    setAulasFechadas((prev) => ({ ...prev, [nomeAula]: !prev[nomeAula] }));
  };

// ================= CÁLCULOS E FILTROS =================
  const missoesPendentes = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    // 🔥 IGNORA SE O MÓDULO ESTIVER ENCERRADO OU FECHADO
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";
    if (stMod === "encerrado" || stMod === "em breve") return false;
    
    return st === "pendente" || st === "devolvida";
  }).length;

  const qtdPendentes = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";
    if (stMod === "encerrado" || stMod === "em breve") return false;
    
    return (st === "pendente" || st === "devolvida") && a.statusPrazo !== "Atrasada";
  }).length;

  const qtdAtrasadas = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";
    if (stMod === "encerrado" || stMod === "em breve") return false;
    
    return (st === "pendente" || st === "devolvida") && a.statusPrazo === "Atrasada";
  }).length;

  const qtdConcluidas = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    return st !== "pendente" && st !== "devolvida";
  }).length;

  const atividadesFiltradas = atividades.filter((a) => {
    const matchBusca = a.titulo.toLowerCase().includes(buscaAtividade.toLowerCase());
    if (!matchBusca) return false;

    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";

    if (abaAtividade === "Pendentes") {
      if (stMod === "encerrado" || stMod === "em breve") return false;
      return (st === "pendente" || st === "devolvida") && a.statusPrazo !== "Atrasada";
    }
    if (abaAtividade === "Atrasadas") {
      if (stMod === "encerrado" || stMod === "em breve") return false;
      return (st === "pendente" || st === "devolvida") && a.statusPrazo === "Atrasada";
    }
    if (abaAtividade === "Concluidas") return st !== "pendente" && st !== "devolvida";
    return true;
  });

  // 🔥 MOTOR DE CURSOS
  const trilhasDeEstudo = useMemo(() => {
    const grupos: Record<
      string,
      {
        status: string;
        todasMissoes: Atividade[];
        missoesFiltradas: Atividade[];
        concluidas: number;
        xpTotal: number;
      }
    > = {};

    atividades.forEach((ativ) => {
      const nomeMod =
        ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Módulo Geral";
      if (!grupos[nomeMod]) {
        grupos[nomeMod] = {
          status: (ativ as any).statusModulo || "Aberto",
          todasMissoes: [],
          missoesFiltradas: [],
          concluidas: 0,
          xpTotal: 0,
        };
      }

      grupos[nomeMod].todasMissoes.push(ativ);
      grupos[nomeMod].xpTotal += Number(ativ.xp) || 0;

      const st = ativ.status?.toLowerCase();
      if (
        st === "avaliado" ||
        st === "avaliada" ||
        st === "aguardando correção"
      ) {
        grupos[nomeMod].concluidas++;
      }
    });

    atividadesFiltradas.forEach((ativ) => {
      const nomeMod =
        ativ.modulo && ativ.modulo.trim() !== "" ? ativ.modulo : "Módulo Geral";
      if (grupos[nomeMod]) {
        grupos[nomeMod].missoesFiltradas.push(ativ);
      }
    });

    return grupos;
  }, [atividades, atividadesFiltradas]);

  const abrirMissaoEspecial = (ativ: Atividade, statusCurso: string) => {
    const missaoAjustada = { ...ativ };
    if (statusCurso.toLowerCase() === "encerrado") {
      missaoAjustada.dataLimite = "01/01/2000";
    }
    setMissaoAberta(missaoAjustada);
  };

  // 🔥 MOTOR DE TEMAS DE LINGUAGEM
  const getTemaCurso = (nomeCurso: string) => {
    const n = nomeCurso.toLowerCase();
    if (n.includes("python"))
      return { bg: "from-blue-600 to-cyan-500", icon: "🐍" };
    if (n.includes("javascript") || n.includes("js"))
      return { bg: "from-amber-400 to-orange-500", icon: "🟨" };
    if (n.includes("html"))
      return { bg: "from-orange-500 to-rose-500", icon: "🌐" };
    if (n.includes("css"))
      return { bg: "from-indigo-500 to-blue-500", icon: "🎨" };
    return { bg: "from-slate-700 to-slate-800", icon: "💻" };
  };

  // ================= RENDERIZAÇÃO =================
  if (!montado || !aluno || carregandoPortal)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">
          Carregando seu progresso...
        </p>
      </div>
    );

  return (
    <main
      className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors duration-300"
      
    >
      {/* MODAIS GLOBAIS */}
      {modalPixAberto && (
        <PixModal
          aluno={aluno}
          alunoAlvoInicial={alvoPix}
          onClose={() => {
            setModalPixAberto(false);
            setAlvoPix(null);
          }}
          onSuccess={carregarPortal}
        />
      )}
      {rankingAberto && (
        <RankingModal aluno={aluno} onClose={() => setRankingAberto(false)} />
      )}
      {novasConquistas.length > 0 && (
        <NovaConquistaModal
          badge={novasConquistas[0]}
          loading={resgatandoBadge}
          onResgatar={resgatarRecompensaBadge}
        />
      )}
      {modalNovidadesAberto && (
        <NovidadesModal
          onClose={() => {
            if (aluno)
              localStorage.setItem(
                `novidades_${aluno.matricula}`,
                VERSAO_ATUALIZACAO,
              );
            setModalNovidadesAberto(false);
          }}
        />
      )}

      {missaoAberta && (
        <ResponderMissaoModal
          missaoAberta={missaoAberta}
          onClose={() => setMissaoAberta(null)}
          onEnviar={enviarMissao}
          enviando={enviando}
          respostaInicial={missaoAberta.respostaEnviada || ""}
        />
      )}

      <div className="relative z-10">
        <PortalHeader
          matricula={aluno.matricula}
          nomeAluno={aluno.nome}
          turma={aluno.turma}
          nomeProjeto={nomeProjeto}
          notificacoes={notificacoes}
          onAbrirRanking={() => setRankingAberto(true)}
          onAbrirFrequencia={abrirMinhaFrequencia}
          onAbrirPerfil={abrirPerfil}
          onLogout={fazerLogout}
        />
      </div>

      {/* AVISO DO WHATSAPP */}
      {!zapConfirmado && zapLink && (
        <div className="bg-emerald-600 dark:bg-emerald-900 text-white p-4 shadow-inner flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top transition-colors duration-300">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">💬</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Você ainda não está no nosso WhatsApp!
              </h3>
              <p className="text-emerald-100 dark:text-emerald-200 text-sm">
                É obrigatório entrar no grupo da sua turma para receber avisos e
                não perder missões.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <a
              href={zapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-emerald-800 text-emerald-800 dark:text-white font-black py-2 px-6 rounded-lg text-center flex-1 md:flex-none shadow hover:bg-emerald-50 dark:hover:bg-emerald-700 transition-colors"
            >
              1. Entrar no Grupo
            </a>
            <button
              onClick={confirmarEntradaGrupo}
              disabled={confirmandoZap}
              className="cursor-pointer bg-emerald-900 hover:bg-emerald-950 dark:bg-emerald-950 dark:hover:bg-black text-white font-bold py-2 px-6 rounded-lg shadow transition-colors disabled:opacity-50 flex-1 md:flex-none"
            >
              {confirmandoZap ? "..." : "2. Já Entrei!"}
            </button>
          </div>
        </div>
      )}

      {/* BOAS-VINDAS E STATUS DO ALUNO */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-384 w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 transition-colors duration-300">
              Bem-vindo, {aluno.nome.split(" ")[0]}!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 lg:justify-start justify-center transition-colors duration-300">
              <span>
                Você tem{" "}
                <strong className="text-amber-600 dark:text-amber-500">
                  {missoesPendentes} missões pendentes
                </strong>
                .
              </span>
              {ofensivaDias > 0 && (
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center gap-1 shadow-sm transition-colors duration-300">
                  🔥 {ofensivaDias} Dias de Ofensiva
                </span>
              )}
            </p>

            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3 w-full">
              <a
                href="https://classroom.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                <span className="text-lg">🏫</span>{" "}
                <span className="text-sm">Classroom</span>
              </a>
              <button
                onClick={() => {
                  setModalPixAberto(true);
                  setAlvoPix(null);
                }}
                className="cursor-pointer inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 border border-emerald-400 dark:border-emerald-500 whitespace-nowrap"
              >
                <span className="text-lg">💸</span>{" "}
                <span className="text-sm">Pix de XP</span>
              </button>
              <button
                onClick={() => setModalSenhaAberto(true)}
                disabled={checkinRealizado}
                className={`cursor-pointer inline-flex items-center justify-center gap-2 font-bold py-3 px-5 rounded-xl shadow-sm transition-all whitespace-nowrap ${checkinRealizado ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700" : taxaPresenca >= 90 ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none animate-pulse shadow-orange-200 dark:shadow-none" : "bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5"}`}
              >
                {checkinRealizado ? (
                  <>
                    <span className="text-lg">✅</span>
                    <span className="text-sm">Presença Confirmada</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">
                      {taxaPresenca >= 90
                        ? "🔥"
                        : taxaPresenca >= 75
                          ? "⚡"
                          : "📍"}
                    </span>
                    <span className="text-sm">
                      Fazer Check-in (+
                      {taxaPresenca >= 90
                        ? 15
                        : taxaPresenca >= 75
                          ? 12
                          : 10}{" "}
                      XP)
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={() => router.push("/portal/gabaritos")}
                className="cursor-pointer inline-flex items-center justify-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 text-indigo-800 dark:text-indigo-300 font-bold py-3 px-5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 border border-indigo-300 dark:border-indigo-700/50 whitespace-nowrap"
              >
                <span className="text-lg">🗝️</span>{" "}
                <span className="text-sm">Gabaritos e Códigos</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-105 shrink-0 mt-6 lg:mt-0 gap-4">
            <div className="flex flex-row gap-3 w-full justify-center lg:justify-end">
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3 w-1/2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-full text-xl shrink-0">
                  🎓
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Nível Atual
                  </p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-400 leading-none">
                    {nivelSistema}
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center gap-3 w-1/2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="bg-emerald-200/50 dark:bg-emerald-800/50 p-2.5 rounded-full text-xl shrink-0">
                  ⭐
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                    Seu XP Total
                  </p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-500 leading-none">
                    {xpTotalSistema} XP
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 w-full">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                <span>Progresso</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {progressoNivel.isMaximo
                    ? "Nível Máximo!"
                    : `Rumo ao ${progressoNivel.nomeProximo}`}
                </span>
              </div>
              <div className="w-full bg-slate-200/70 dark:bg-slate-700/50 rounded-full h-3 mb-2.5 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressoNivel.porcentagem}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center">
                {progressoNivel.isMaximo ? (
                  "🏆 Você alcançou o topo do Trilha Tech!"
                ) : (
                  <>
                    Faltam{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400 font-black">
                      {progressoNivel.faltam} XP
                    </strong>{" "}
                    para subir de nível! 🚀
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE CURSOS E MISSÕES */}
      <div className="max-w-384 mx-auto p-4 md:p-8 mt-4 backdrop-blur-sm bg-white/80 dark:bg-slate-950/80 transition-colors duration-300">
        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors duration-300">
            🎯 Suas Missões e Cursos
          </h3>
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={buscaAtividade}
              onChange={(e) => setBuscaAtividade(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors duration-300"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <button
            onClick={() => setAbaAtividade("Pendentes")}
            className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border ${abaAtividade === "Pendentes" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 border-amber-300 dark:border-amber-700 shadow-sm scale-105" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            ⏳ No Prazo ({qtdPendentes})
          </button>
          <button
            onClick={() => setAbaAtividade("Atrasadas")}
            className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border ${abaAtividade === "Atrasadas" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-500 border-red-300 dark:border-red-700 shadow-sm scale-105" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            🚨 Atrasadas ({qtdAtrasadas})
          </button>
          <button
            onClick={() => setAbaAtividade("Concluidas")}
            className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all border ${abaAtividade === "Concluidas" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-500 border-emerald-300 dark:border-emerald-700 shadow-sm scale-105" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            ✅ Concluídas ({qtdConcluidas})
          </button>
        </div>

        {atividadesFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center animate-in fade-in transition-colors duration-300">
            <div className="text-5xl opacity-50 mb-3 animate-bounce">📭</div>
            <p className="font-bold">
              Nenhuma missão encontrada para esta categoria.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            {!cursoSelecionado ? (
              // ================= TELA 1: GALERIA DE CURSOS =================
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 transition-colors duration-300">
                  <span>🎓</span> Suas Trilhas de Estudo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {Object.entries(trilhasDeEstudo).map(([nomeCurso, info]) => {
                    if (info.missoesFiltradas.length === 0) return null;

                    const statusStr = info.status.toLowerCase();
                    const isTrancado = statusStr === "em breve";
                    const isEncerrado = statusStr === "encerrado";
                    const isRecuperacao =
                      statusStr === "recuperação" ||
                      statusStr === "recuperacao";
                    const progressoPct =
                      info.todasMissoes.length === 0
                        ? 0
                        : Math.round(
                            (info.concluidas / info.todasMissoes.length) * 100,
                          );

                    // 🔥 OBTÉM O TEMA VISUAL DO CURSO
                    const tema = getTemaCurso(nomeCurso);

                    let selo = (
                      <span className="bg-white/90 dark:bg-slate-900/90 text-blue-800 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm">
                        🟢 Aberto
                      </span>
                    );
                    let corFiltro = "";

                    if (isTrancado) {
                      corFiltro =
                        "grayscale-[80%] opacity-80 cursor-not-allowed";
                      selo = (
                        <span className="bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm">
                          🔒 Em Breve
                        </span>
                      );
                    } else if (isEncerrado) {
                      corFiltro =
                        "grayscale-[30%] opacity-90 cursor-pointer hover:-translate-y-1 hover:shadow-lg";
                      selo = (
                        <span className="bg-red-600 dark:bg-red-900/80 text-white dark:text-red-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm border dark:border-red-500/50">
                          🔴 Encerrado
                        </span>
                      );
                    } else if (isRecuperacao) {
                      corFiltro =
                        "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-amber-400 hover:ring-offset-2 dark:hover:ring-offset-slate-900";
                      selo = (
                        <span className="bg-amber-400 dark:bg-amber-900/80 text-amber-900 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm border dark:border-amber-500/50 animate-pulse">
                          🟡 Recuperação
                        </span>
                      );
                    } else {
                      // Curso Aberto Normal
                      corFiltro =
                        "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 dark:hover:ring-offset-slate-900";
                    }

                    return (
                      <div
                        key={nomeCurso}
                        onClick={() =>
                          !isTrancado && setCursoSelecionado(nomeCurso)
                        }
                        className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col group overflow-hidden transition-all duration-300 ${corFiltro}`}
                      >
                        {/* 🌟 BANNER SUPERIOR COM TEMA */}
                        <div
                          className={`h-36 bg-gradient-to-br ${tema.bg} relative overflow-hidden flex items-center justify-center shrink-0`}
                        >
                          {/* Textura de Fundo Tech */}
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>

                          <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                            {tema.icon}
                          </span>

                          <div className="absolute top-3 right-3 z-10">
                            {selo}
                          </div>
                        </div>

                        {/* INFORMAÇÕES INFERIORES */}
                        <div className="p-5 flex-1 flex flex-col">
                          <h4
                            className={`font-black text-lg leading-tight mb-2 ${isTrancado ? "text-slate-500 dark:text-slate-600" : "text-slate-800 dark:text-slate-100"}`}
                          >
                            {nomeCurso}
                          </h4>

                          <div className="mt-auto pt-4">
                            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                              <span>Progresso do Módulo</span>
                              <span>{progressoPct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${progressoPct === 100 ? "bg-emerald-500" : isTrancado ? "bg-slate-400 dark:bg-slate-600" : "bg-blue-500"}`}
                                style={{ width: `${progressoPct}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <span>
                                {info.concluidas} / {info.todasMissoes.length}{" "}
                                Aulas
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                                ⭐ {info.xpTotal} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // ================= TELA 2: LISTA DE MISSÕES DO CURSO COM SANFONA DE AULAS =================
              <div className="animate-in slide-in-from-right-8 duration-300">
                <button
                  onClick={() => setCursoSelecionado(null)}
                  className="cursor-pointer mb-6 inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all hover:-translate-x-1"
                >
                  <span>←</span> Voltar para Trilhas
                </button>

                {/* 🌟 CABEÇALHO DO CURSO COM TEMA */}
                <div
                  className={`rounded-3xl p-6 md:p-10 mb-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${getTemaCurso(cursoSelecionado).bg} animate-in zoom-in-95 duration-500 border border-white/10`}
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute top-0 right-0 opacity-20 text-9xl transform translate-x-4 -translate-y-4">
                    {getTemaCurso(cursoSelecionado).icon}
                  </div>

                  <div className="relative z-10">
                    <span className="bg-white/20 backdrop-blur-sm text-white border border-white/30 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4 inline-block shadow-sm">
                      Módulo Atual
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-md">
                      {cursoSelecionado}
                    </h2>
                    <p className="text-white/80 font-medium text-sm md:text-base">
                      {trilhasDeEstudo[cursoSelecionado].concluidas} de{" "}
                      {trilhasDeEstudo[cursoSelecionado].todasMissoes.length}{" "}
                      missões concluídas no total.
                    </p>

                    {trilhasDeEstudo[cursoSelecionado].status.toLowerCase() ===
                      "encerrado" && (
                      <div className="mt-6 bg-red-900/50 backdrop-blur-md border border-red-500/50 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                        <span className="text-xl">🔴</span>
                        <div>
                          <h4 className="font-black text-red-100 text-sm">
                            Este Módulo foi Encerrado!
                          </h4>
                          <p className="text-red-200/80 text-xs mt-1">
                            O prazo final expirou. Você pode visualizar o
                            conteúdo e acessar a Central de Gabaritos para
                            revisão, mas envios de atividades estão bloqueados.
                          </p>
                        </div>
                      </div>
                    )}
                    {trilhasDeEstudo[cursoSelecionado].status
                      .toLowerCase()
                      .includes("recupera") && (
                      <div className="mt-6 bg-amber-900/50 backdrop-blur-md border border-amber-500/50 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                        <span className="text-xl animate-pulse">🟡</span>
                        <div>
                          <h4 className="font-black text-amber-100 text-sm">
                            Semana de Recuperação!
                          </h4>
                          <p className="text-amber-200/80 text-xs mt-1">
                            O módulo já acabou, mas o professor concedeu um
                            prazo extra. Envie suas missões pendentes o mais
                            rápido possível!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {trilhasDeEstudo[cursoSelecionado].missoesFiltradas.length ===
                0 ? (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-sm flex flex-col items-center">
                    <div className="text-4xl opacity-50 mb-3">📭</div>
                    <p className="font-bold">
                      Nenhuma missão nesta aba (Pendentes/Concluídas).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 🔥 AGRUPAMENTO POR AULA */}
                    {Object.entries(
                      trilhasDeEstudo[cursoSelecionado].missoesFiltradas.reduce(
                        (acc, ativ) => {
                          const match = ativ.titulo.match(/^\[(Aula\s*\d+)\]/i);
                          const aula = match ? match[1] : "Outras Atividades";
                          if (!acc[aula]) acc[aula] = [];
                          acc[aula].push(ativ);
                          return acc;
                        },
                        {} as Record<string, Atividade[]>,
                      ),
                    )
                      .sort(([aulaA], [aulaB]) => {
                        if (aulaA === "Outras Atividades") return 1;
                        if (aulaB === "Outras Atividades") return -1;
                        return aulaA.localeCompare(aulaB);
                      })
                      .map(([nomeAula, missoesDaAula]) => {
                        const isAulaFechada = aulasFechadas[nomeAula] || false;

                        return (
                          <div
                            key={nomeAula}
                            className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div
                              onClick={() => toggleAula(nomeAula)}
                              className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex justify-between items-center cursor-pointer transition-colors"
                            >
                              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 text-lg">
                                <span className="text-2xl">
                                  {getTemaCurso(cursoSelecionado).icon}
                                </span>{" "}
                                {nomeAula}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                  {missoesDaAula.length}{" "}
                                  {missoesDaAula.length === 1
                                    ? "item"
                                    : "itens"}
                                </span>
                                <span
                                  className={`text-slate-400 dark:text-slate-500 font-bold transition-transform duration-300 ${isAulaFechada ? "" : "rotate-180"}`}
                                >
                                  ▼
                                </span>
                              </div>
                            </div>

                            {!isAulaFechada && (
                              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                {missoesDaAula.map((ativ) => {
                                  const st = ativ.status?.toLowerCase().trim();
                                  const isConcluida =
                                    st === "avaliado" ||
                                    st === "avaliada" ||
                                    st === "aguardando correção";
                                  const isDevolvida = st === "devolvida";

                                  return (
                                    <div
                                      key={ativ.id}
                                      className={`bg-white dark:bg-slate-800 rounded-2xl border-2 shadow-sm flex flex-col overflow-hidden relative transition-all hover:shadow-xl hover:-translate-y-1 ${isConcluida ? "border-emerald-200 dark:border-emerald-500/30" : isDevolvida ? "border-red-300 dark:border-red-500/50" : "border-slate-200 dark:border-slate-700 dark:hover:border-slate-500"}`}
                                    >
                                      <div
                                        className={`h-2 w-full ${isConcluida ? "bg-emerald-500" : isDevolvida ? "bg-red-500" : ativ.tipo === "Quiz" ? "bg-amber-400" : ativ.tipo === "Material" ? "bg-emerald-400" : "bg-blue-500"}`}
                                      ></div>
                                      <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                          <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200 dark:border-slate-700 shadow-sm">
                                            {ativ.tipo}
                                          </span>
                                          <span className="text-[10px] bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                                            ID: {ativ.id.replace("ATIV-", "")}
                                          </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-3 leading-tight line-clamp-2">
                                          {ativ.titulo}
                                        </h4>
                                        <div className="mt-auto pt-4 space-y-3">
                                          {isConcluida ? (
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex justify-between items-center shadow-inner">
                                              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                                                <span className="text-base">
                                                  ✅
                                                </span>{" "}
                                                Concluída
                                              </span>
                                              <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-black px-2 py-1 rounded uppercase shadow-sm">
                                                ⭐ {ativ.xpGanho || ativ.xp} XP
                                              </span>
                                            </div>
                                          ) : isDevolvida ? (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3 shadow-inner">
                                              <span className="text-red-700 dark:text-red-400 font-bold text-xs flex items-center gap-1.5">
                                                <span className="text-base">
                                                  ⚠️
                                                </span>{" "}
                                                Devolvida - Refazer!
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex justify-between items-center shadow-inner">
                                              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5">
                                                <span className="text-base">
                                                  ⏳
                                                </span>{" "}
                                                Pendente
                                              </span>
                                              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-1 rounded uppercase shadow-sm">
                                                ⭐ {ativ.xp} XP
                                              </span>
                                            </div>
                                          )}
                                          <button
                                            onClick={() =>
                                              abrirMissaoEspecial(
                                                ativ,
                                                trilhasDeEstudo[
                                                  cursoSelecionado
                                                ].status,
                                              )
                                            }
                                            className={`cursor-pointer w-full text-white text-sm font-black py-3.5 rounded-xl transition-all active:scale-95 shadow-md ${isConcluida ? "bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600" : isDevolvida ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                                          >
                                            {isConcluida
                                              ? "Ver Detalhes"
                                              : "Abrir Atividade"}
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* OUTROS MODAIS DA PÁGINA */}
      {perfilAberto && (
        <PerfilModal
          dadosPerfil={dadosPerfil}
          ofensivaDias={ofensivaDias}
          carregando={carregandoPerfil}
          salvando={salvandoPerfil}
          onClose={() => setPerfilAberto(false)}
          setDadosPerfil={setDadosPerfil}
          onSalvar={salvarPerfil}
          avatarAtual={avatarSistema}
          totalCurtidas={curtidasSistema}
          onSalvarAvatar={salvarNovoAvatar}
          dadosBadges={{
            atividades: atividades,
            xpTotal: xpTotalSistema,
            xpDoado: estatisticas.xpDoado,
            xpRecebido: estatisticas.xpRecebido,
            totalCheckins: estatisticas.totalCheckins,
            whatsappConfirmado: zapConfirmado,
            aniversarioResgatado: false,
            totalCurtidas: curtidasSistema,
          }}
        />
      )}

      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 w-full max-w-sm overflow-hidden flex flex-col p-6 text-center select-text transition-colors duration-300">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">
              Presença em Sala
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Digite a senha que o tutor escreveu na lousa para garantir os seus
              10 XP.
            </p>
            <form onSubmit={confirmarCheckin}>
              <input
                type="text"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value.toUpperCase())}
                placeholder="SENHA DA LOUSA"
                className="w-full text-center text-2xl font-black font-mono border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 mb-4 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none uppercase tracking-widest text-slate-800 dark:text-slate-100 transition-colors duration-300"
                autoFocus
              />
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setModalSenhaAberto(false)}
                  className="cursor-pointer flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={fazendoCheckin}
                  className="cursor-pointer flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:bg-emerald-400 dark:disabled:bg-emerald-800"
                >
                  {fazendoCheckin ? "Validando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalFrequenciaAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300">
            <div className="bg-indigo-600 dark:bg-indigo-800 p-4 flex justify-between items-center text-white transition-colors duration-300">
              <h2 className="font-black text-lg md:text-xl flex items-center gap-2">
                <span>📊</span> Meu Desempenho e Frequência
              </h2>
              <button
                onClick={() => setModalFrequenciaAberto(false)}
                className="cursor-pointer text-3xl leading-none hover:text-indigo-200"
              >
                &times;
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
              {carregandoFrequencia ? (
                <div className="flex flex-col justify-center items-center py-16 opacity-60">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 dark:border-indigo-400 mb-4"></div>
                  <p className="font-bold text-slate-600 dark:text-slate-400">
                    Buscando seu histórico...
                  </p>
                </div>
              ) : dadosFrequencia ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Aulas Totais
                      </p>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-200">
                        {dadosFrequencia.totalAulas}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Presenças
                      </p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {dadosFrequencia.totalPresencas}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Faltas
                      </p>
                      <p className="text-2xl font-black text-red-500 dark:text-red-400">
                        {dadosFrequencia.totalFaltas}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Sua Taxa
                      </p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        {dadosFrequencia.taxa}%
                      </p>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-xl font-medium shadow-inner text-sm md:text-base border ${dadosFrequencia.taxa >= 90 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50" : dadosFrequencia.taxa >= 75 ? "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50" : dadosFrequencia.taxa >= 60 ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50 font-bold"}`}
                  >
                    {dadosFrequencia.mensagem}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b dark:border-slate-700 pb-2">
                      Histórico Resumido de Aulas
                    </h3>
                    {dadosFrequencia.historico.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                        Ainda não há registros de presença para a sua turma.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {dadosFrequencia.historico.map(
                          (reg: FrequenciaHistorico, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg flex justify-between items-center shadow-sm transition-colors"
                            >
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                {reg.data.slice(0, 5)}
                              </span>
                              {reg.status === "presente" && (
                                <span
                                  className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded"
                                  title="Presente"
                                >
                                  P
                                </span>
                              )}
                              {reg.status === "justificada" && (
                                <span
                                  className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded"
                                  title="Falta Justificada"
                                >
                                  J
                                </span>
                              )}
                              {reg.status === "falta" && (
                                <span
                                  className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-[10px] font-black px-1.5 py-0.5 rounded"
                                  title="Falta"
                                >
                                  F
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-red-500 dark:text-red-400 py-8 font-bold">
                  Erro ao carregar dados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRESENTE DE ANIVERSÁRIO */}
      {modalPresenteAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center border-4 border-amber-400 dark:border-amber-600 relative transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-200/50 dark:from-amber-900/30 to-transparent"></div>
            <div className="p-8 relative z-10">
              <div className="text-7xl animate-bounce mb-4 drop-shadow-md">
                🎁
              </div>
              <h2 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-2 uppercase text-amber-600 dark:text-amber-500">
                Feliz Aniversário!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-6">
                Parabéns, <strong>{aluno?.nome.split(" ")[0]}</strong>! Hoje é o
                seu dia especial. Como presente do Tutor, você ganhou{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  100 XP
                </strong>{" "}
                para turbinar o seu nível!
              </p>
              <button
                onClick={resgatarPresente}
                disabled={resgatandoPresente}
                className="cursor-pointer w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 cursor-pointer"
              >
                {resgatandoPresente
                  ? "Abrindo Presente..."
                  : "RESGATAR MEU PRESENTE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
