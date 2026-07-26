/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
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
import LojaRifaModal from "@/src/components/LojaRifaModal";
import MeusBilhetesModal from "@/src/components/MeusBilhetesModal";
import { apiAluno, apiGeral } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import ThreeInteractiveBg from "@/src/components/ThreeInteractiveBg";
import TrilhaTechLoader from "@/src/components/TrilhaTechLoader";

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
  const { toast } = useToast();

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
  const [modoVisualizacao, setModoVisualizacao] = useState<"grade" | "trilha">("grade");
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
  const [lojaAberta, setLojaAberta] = useState(false);
  const [saldoCarteira, setSaldoCarteira] = useState(0); // 🔥 Novo estado
  const [modalBilhetesAberto, setModalBilhetesAberto] = useState(false);

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

  const VERSAO_ATUALIZACAO = "1.9.0";
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
        // 🔥 ATUALIZE O SALDO AQUI
        setSaldoCarteira(data.saldoCarteira || 0);
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
        // 🔥 TOAST GAMIFICADO PARA RECOMPENSA
        toast(
          `+${badge.recompensa} XP Resgatado!`,
          "reward",
          "Conquista Épica!",
        );
        setNovasConquistas((prev) => prev.slice(1));
        carregarPortal();
      } else {
        toast(data.mensagem, "warning", "Ops!");
        setNovasConquistas((prev) => prev.slice(1));
      }
    } catch {
      toast("Erro de conexão ao resgatar conquista.", "error", "Erro");
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
        toast(
          "Perfeito! Agora você não perde nenhum aviso.",
          "success",
          "WhatsApp Confirmado!",
        );
      }
    } catch {
      toast("Erro ao confirmar entrada no grupo.", "error", "Erro de Conexão");
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
        // 🔥 LÓGICA INTELIGENTE DE FEEDBACK PARA QUIZ VS PROJETO
        if (data.mensagem.includes("Resposta errada")) {
          toast(data.mensagem, "quiz_wrong", "Quase lá...");
        } else if (data.mensagem.includes("Resposta correta")) {
          toast(data.mensagem, "quiz_correct", "Na Mosca!");
        } else {
          toast(data.mensagem, "success", "Missão Enviada!");
        }

        setMissaoAberta(null);
        carregarPortal();
      } else {
        toast(data.mensagem, "warning", "Atenção!");
      }
    } catch {
      toast("Erro ao tentar enviar a missão.", "error", "Falha na Rede");
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aluno) return;
    if (!senhaDigitada.trim()) {
      toast("Digite a senha da lousa!", "warning", "Senha Inválida");
      return;
    }
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
        toast(data.mensagem, "success", "Presença Garantida!");
        localStorage.setItem(`checkin_${aluno.matricula}`, dataHoje);
        setCheckinRealizado(true);
        setModalSenhaAberto(false);
        setSenhaDigitada("");
        carregarPortal();
      } else {
        toast(data.mensagem, "warning", "Não foi possível");
        if (data.mensagem.includes("já garantiu")) {
          localStorage.setItem(`checkin_${aluno.matricula}`, dataHoje);
          setCheckinRealizado(true);
          setModalSenhaAberto(false);
        }
      }
    } catch {
      toast("Erro ao tentar registar a presença.", "error", "Falha de Conexão");
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
      if (data.status === "sucesso") {
        setDadosPerfil(data.perfil);
      } else {
        toast(data.mensagem, "warning", "Ops!");
      }
    } catch {
      toast("Erro ao abrir perfil.", "error", "Erro");
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
        toast(
          "Seus dados foram atualizados com sucesso.",
          "success",
          "Perfil Salvo!",
        );
        setPerfilAberto(false);
      } else {
        toast(data.mensagem, "warning", "Atenção");
      }
    } catch {
      toast("Erro ao tentar salvar perfil.", "error", "Erro de Rede");
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
      toast("Erro ao carregar frequência.", "error", "Falha");
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
        toast(
          "Presente resgatado! Parabéns pelo seu dia!",
          "reward",
          "Feliz Aniversário!",
        );
        setModalPresenteAberto(false);
        carregarPortal();
      } else {
        toast(data.mensagem, "warning", "Ops!");
      }
    } catch {
      toast("Erro ao tentar resgatar o presente.", "error", "Falha");
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
  const atividadesAguardandoValidacao = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "";
    return st === "aguardando validação" || st === "aguardando validacao";
  });

  const missoesPendentes = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";
    if (stMod === "encerrado" || stMod === "em breve") return false;

    return st === "pendente" || st === "devolvida";
  }).length;

  const qtdPendentes = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";
    if (stMod === "encerrado" || stMod === "em breve") return false;

    return (
      (st === "pendente" || st === "devolvida") && a.statusPrazo !== "Atrasada"
    );
  }).length;

  const qtdAtrasadas = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";
    if (stMod === "encerrado" || stMod === "em breve") return false;

    return (
      (st === "pendente" || st === "devolvida") && a.statusPrazo === "Atrasada"
    );
  }).length;

  const qtdConcluidas = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    return st !== "pendente" && st !== "devolvida" && st !== "aguardando validação" && st !== "aguardando validacao";
  }).length;

  const atividadesFiltradas = atividades.filter((a) => {
    const matchBusca = a.titulo
      .toLowerCase()
      .includes(buscaAtividade.toLowerCase());
    if (!matchBusca) return false;

    const st = a.status?.toLowerCase().trim() || "pendente";
    const stMod = (a as any).statusModulo?.toLowerCase() || "aberto";

    if (abaAtividade === "Pendentes") {
      if (stMod === "encerrado" || stMod === "em breve") return false;
      return (
        (st === "pendente" || st === "devolvida") &&
        a.statusPrazo !== "Atrasada"
      );
    }
    if (abaAtividade === "Atrasadas") {
      if (stMod === "encerrado" || stMod === "em breve") return false;
      return (
        (st === "pendente" || st === "devolvida") &&
        a.statusPrazo === "Atrasada"
      );
    }
    if (abaAtividade === "Concluidas")
      return st !== "pendente" && st !== "devolvida" && st !== "aguardando validação" && st !== "aguardando validacao";
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
    return <TrilhaTechLoader />;

  return (
    <main className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-300 overflow-hidden">
      {/* Three.js interactive custom background */}
      <ThreeInteractiveBg />

      {/* Ambient glowing blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[50vw] h-[50vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[30vw] h-[30vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none" />

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

      {aluno && (
        <LojaRifaModal
          isOpen={lojaAberta}
          onClose={() => setLojaAberta(false)}
          matricula={aluno.matricula}
          saldoCarteira={saldoCarteira}
          onCompraSucesso={carregarPortal} // 🔥 CHAMA A SUA FUNÇÃO LOCAL
        />
      )}

      {aluno && (
        <MeusBilhetesModal
          isOpen={modalBilhetesAberto}
          onClose={() => setModalBilhetesAberto(false)}
          matricula={aluno.matricula}
        />
      )}

      <div className="relative z-30">
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
        <div className="bg-emerald-950/40 backdrop-blur-md text-white p-4 shadow-lg border-b border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">💬</span>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                Você ainda não está no nosso WhatsApp!
              </h3>
              <p className="text-emerald-300 text-sm">
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
              className="bg-emerald-500 text-white font-black py-2 px-6 rounded-xl text-center flex-1 md:flex-none shadow hover:brightness-110 transition-all active:scale-95"
            >
              1. Entrar no Grupo
            </a>
            <button
              onClick={confirmarEntradaGrupo}
              disabled={confirmandoZap}
              className="cursor-pointer bg-slate-900 border border-slate-800 text-white font-bold py-2 px-6 rounded-xl shadow transition-all hover:bg-slate-800 disabled:opacity-50 flex-1 md:flex-none active:scale-95"
            >
              {confirmandoZap ? "..." : "2. Já Entrei!"}
            </button>
          </div>
        </div>
      )}

      {/* BOAS-VINDAS E STATUS DO ALUNO */}
      <div className="max-w-[1536px] w-full mx-auto p-4 md:p-8 mt-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          {/* Lado Esquerdo: Perfil e Botões */}
          <div className="lg:col-span-7 glass-panel p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between border border-white/10">
            <div>
              <h2 className="text-3xl font-display font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                Bem-vindo, {aluno.nome.split(" ")[0]}!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                <span>
                  Você tem{" "}
                  <strong className="text-amber-600 dark:text-amber-500 font-bold">
                    {missoesPendentes} missões pendentes
                  </strong>
                  .
                </span>
                {ofensivaDias > 0 && (
                  <span className="bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900/40 flex items-center gap-1 shadow-sm">
                    🔥 {ofensivaDias} Dias de Ofensiva
                  </span>
                )}
              </p>
            </div>

            {/* Container Principal dos Botões */}
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="https://classroom.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-900/60 text-slate-800 dark:text-white font-bold py-3.5 px-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-md transition-colors"
                >
                  <span className="text-lg">🏫</span>{" "}
                  <span className="text-xs uppercase tracking-wider">Classroom</span>
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setModalPixAberto(true);
                    setAlvoPix(null);
                  }}
                  className="cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl shadow-md"
                >
                  <span className="text-lg">💸</span>{" "}
                  <span className="text-xs uppercase tracking-wider">Pix de XP</span>
                </motion.button>

                <motion.button
                  whileHover={checkinRealizado ? {} : { scale: 1.03 }}
                  whileTap={checkinRealizado ? {} : { scale: 0.97 }}
                  onClick={() => setModalSenhaAberto(true)}
                  disabled={checkinRealizado}
                  className={`cursor-pointer flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl shadow-md ${checkinRealizado ? "bg-slate-100 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5" : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110"}`}
                >
                  <span className="text-lg">
                    {checkinRealizado ? "✅" : "🔥"}
                  </span>
                  <span className="text-xs uppercase tracking-wider">
                    {checkinRealizado ? "Feito" : "Check-in"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/portal/gabaritos")}
                  className="cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-brand-secondary font-bold py-3.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-900/30 shadow-md"
                >
                  <span className="text-lg">🗝️</span>{" "}
                  <span className="text-xs uppercase tracking-wider">Gabaritos</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setModalBilhetesAberto(true)}
                  className="cursor-pointer flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-950/40 dark:bg-slate-950/45 hover:bg-slate-200 dark:hover:bg-slate-900/45 text-slate-800 dark:text-slate-300 font-bold py-3.5 rounded-xl border border-slate-200 dark:border-white/5"
                >
                  <span>🎟️</span> Meus Bilhetes
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLojaAberta(true)}
                  className="cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:brightness-110 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  <span>🛒</span> Comprar Bilhetes
                </motion.button>
              </div>
            </div>
          </div>

          {/* Lado Direito: Estatísticas de Nível e XP */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
            <div className="flex flex-row gap-4 w-full">
              <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 w-1/2 border border-white/10 hover:border-brand-primary/40 transition-colors">
                <div className="bg-brand-primary/20 text-brand-secondary p-3 rounded-xl text-2xl shrink-0 shadow-inner">
                  🎓
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Nível Atual
                  </p>
                  <p className="text-2xl font-display font-black text-brand-primary dark:text-brand-secondary">
                    {nivelSistema}
                  </p>
                </div>
              </div>
              
              <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 w-1/2 border border-white/10 hover:border-brand-primary/40 transition-colors">
                <div className="bg-emerald-950/30 text-emerald-400 p-3 rounded-xl text-2xl shrink-0 shadow-inner">
                  ⭐
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Seu XP Total
                  </p>
                  <p className="text-2xl font-display font-black text-emerald-400">
                    {xpTotalSistema}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/10 w-full flex-1 flex flex-col justify-center">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                <span>Progresso</span>
                <span className="text-brand-secondary">
                  {progressoNivel.isMaximo
                    ? "Nível Máximo!"
                    : `Rumo ao ${progressoNivel.nomeProximo}`}
                </span>
              </div>
              
              <div className="w-full bg-slate-950/50 rounded-full h-3.5 mb-3 overflow-hidden shadow-inner border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressoNivel.porcentagem}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-secondary h-full rounded-full relative"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/15 animate-pulse"></div>
                </motion.div>
              </div>
              
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                {progressoNivel.isMaximo ? (
                  "🏆 Você alcançou o topo do Trilha Tech!"
                ) : (
                  <>
                    Faltam{" "}
                    <strong className="text-brand-primary dark:text-brand-secondary font-black">
                      {progressoNivel.faltam} XP
                    </strong>{" "}
                    para subir de nível! 🚀
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SEÇÃO: ATIVIDADES AGUARDANDO VALIDAÇÃO */}
      {atividadesAguardandoValidacao.length > 0 && (
        <div className="max-w-[1536px] w-full mx-auto px-4 md:px-8 mt-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 shadow-xl">
            <h3 className="text-lg font-display font-black text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-4">
              <span>⏳</span> Atividades Enviadas mas Não Validadas ({atividadesAguardandoValidacao.length})
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mb-4">
              Estas missões foram entregues no Portal, mas ainda precisam ser validadas no Google Classroom.
              Enquanto não forem validadas, o XP correspondente não será creditado. Se a atividade for validada com atraso,
              descontos de XP serão aplicados regressivamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atividadesAguardandoValidacao.map((ativ) => (
                <div 
                  key={ativ.id} 
                  className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-amber-500/30 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all"></div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                      {ativ.tipo}
                    </span>
                    <h4 className="font-display font-bold text-sm text-slate-805 dark:text-white mt-2 leading-tight">
                      {ativ.titulo}
                    </h4>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 line-clamp-2">
                      {ativ.descricao}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">XP Estimado: <strong className="text-slate-300">{ativ.xp}</strong></span>
                    <span className="text-amber-500 font-bold animate-pulse flex items-center gap-1">
                      <span>⚠️</span> Pendente no AVA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE CURSOS E MISSÕES */}
      <div className="max-w-[1536px] w-full mx-auto mt-8 relative z-10">
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-xl font-display font-black text-slate-800 dark:text-white flex items-center gap-2">
              🎯 Suas Missões e Trilhas
            </h3>
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Pesquisar missão..."
                value={buscaAtividade}
                onChange={(e) => setBuscaAtividade(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700/60 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-inner transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
            <button
              onClick={() => setAbaAtividade("Pendentes")}
              className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border ${abaAtividade === "Pendentes" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10 scale-102" : "bg-slate-100 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white"}`}
            >
              ⏳ No Prazo ({qtdPendentes})
            </button>
            <button
              onClick={() => setAbaAtividade("Atrasadas")}
              className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border ${abaAtividade === "Atrasadas" ? "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40 shadow-lg shadow-red-500/10 scale-102" : "bg-slate-100 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white"}`}
            >
              🚨 Atrasadas ({qtdAtrasadas})
            </button>
            <button
              onClick={() => setAbaAtividade("Concluidas")}
              className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border ${abaAtividade === "Concluidas" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10 scale-102" : "bg-slate-100 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white"}`}
            >
              ✅ Concluídas ({qtdConcluidas})
            </button>
          </div>

          {atividadesFiltradas.length === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-950/40 p-12 rounded-2xl border border-slate-200 dark:border-white/5 text-center text-slate-500 dark:text-slate-400 shadow-inner flex flex-col items-center animate-in fade-in">
              <div className="text-5xl opacity-40 mb-3 animate-bounce">📭</div>
              <p className="font-bold font-display text-sm uppercase tracking-wide">
                Nenhuma missão encontrada para esta categoria.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              {!cursoSelecionado ? (
                // ================= TELA 1: GALERIA DE CURSOS =================
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-display font-black text-2xl text-slate-800 dark:text-white mb-6 flex items-center gap-2">
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

                      const tema = getTemaCurso(nomeCurso);

                      let selo = (
                        <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-sm">
                          🟢 Aberto
                        </span>
                      );
                      let corFiltro = "";

                      if (isTrancado) {
                        corFiltro =
                          "grayscale-[80%] opacity-80 cursor-not-allowed";
                        selo = (
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-sm border border-slate-700">
                            🔒 Em Breve
                          </span>
                        );
                      } else if (isEncerrado) {
                        corFiltro =
                          "grayscale-[30%] opacity-90 cursor-pointer hover:border-red-500/30";
                        selo = (
                          <span className="bg-red-500/20 text-red-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-sm border border-red-500/40">
                            🔴 Encerrado
                          </span>
                        );
                      } else if (isRecuperacao) {
                        corFiltro =
                          "cursor-pointer hover:ring-2 hover:ring-amber-500/50 hover:border-amber-500/40";
                        selo = (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-sm border border-amber-500/40 animate-pulse">
                            🟡 Recuperação
                          </span>
                        );
                      } else {
                        corFiltro =
                          "cursor-pointer hover:ring-2 hover:ring-brand-primary/50 hover:border-brand-primary/40";
                      }

                      return (
                        <motion.div
                          whileHover={isTrancado ? {} : { y: -4, scale: 1.02 }}
                          whileTap={isTrancado ? {} : { scale: 0.98 }}
                          key={nomeCurso}
                          onClick={() =>
                            !isTrancado && setCursoSelecionado(nomeCurso)
                          }
                          className={`glass-panel rounded-2xl border border-white/10 shadow-md flex flex-col group overflow-hidden transition-all duration-300 ${corFiltro}`}
                        >
                          {/* 🌟 BANNER SUPERIOR COM TEMA */}
                          <div
                            className={`h-36 bg-gradient-to-br ${tema.bg} relative overflow-hidden flex items-center justify-center shrink-0`}
                          >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>

                            <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-md">
                              {tema.icon}
                            </span>

                            <div className="absolute top-3 right-3 z-10">
                              {selo}
                            </div>
                          </div>

                          {/* INFORMAÇÕES INFERIORES */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <h4
                              className={`font-display font-black text-lg leading-tight mb-4 ${isTrancado ? "text-slate-500" : "text-white"}`}
                            >
                              {nomeCurso}
                            </h4>

                            <div className="mt-auto">
                              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                                <span>Progresso da Trilha</span>
                                <span>{progressoPct}%</span>
                              </div>
                              <div className="w-full bg-slate-950/50 border border-white/5 rounded-full h-2.5 overflow-hidden shadow-inner">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${progressoPct === 100 ? "bg-emerald-500" : isTrancado ? "bg-slate-600" : "bg-brand-primary"}`}
                                  style={{ width: `${progressoPct}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>
                                  {info.concluidas} / {info.todasMissoes.length}{" "}
                                  Aulas
                                </span>
                                <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/30">
                                  ⭐ {info.xpTotal} XP
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // ================= TELA 2: LISTA DE MISSÕES DO CURSO COM SANFONA DE AULAS =================
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <button
                    onClick={() => setCursoSelecionado(null)}
                    className="cursor-pointer mb-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950/60 hover:bg-slate-900/60 border border-white/5 shadow-sm text-slate-300 font-bold rounded-xl transition-all hover:-translate-x-1 active:scale-95"
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

                      {/* Alternador de Visualização Premium */}
                      <div className="mt-6 flex bg-slate-950/80 backdrop-blur-md border border-white/5 p-1 rounded-2xl w-fit relative z-20">
                        <button
                          type="button"
                          onClick={() => setModoVisualizacao("grade")}
                          className={`cursor-pointer px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            modoVisualizacao === "grade"
                              ? "bg-gradient-to-r from-blue-500 to-indigo-650 text-white shadow-md shadow-blue-500/20"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          🗂️ Grade
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoVisualizacao("trilha")}
                          className={`cursor-pointer px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            modoVisualizacao === "trilha"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          🗺️ Trilha
                        </button>
                      </div>
 
                      {trilhasDeEstudo[cursoSelecionado].status.toLowerCase() ===
                        "encerrado" && (
                        <div className="mt-6 bg-red-950/40 backdrop-blur-md border border-red-500/30 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                          <span className="text-xl">🔴</span>
                          <div>
                            <h4 className="font-black text-red-200 text-sm">
                              Este Módulo foi Encerrado!
                            </h4>
                            <p className="text-red-300/80 text-xs mt-1">
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
                        <div className="mt-6 bg-amber-950/40 backdrop-blur-md border border-amber-500/30 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                          <span className="text-xl animate-pulse">🟡</span>
                          <div>
                            <h4 className="font-black text-amber-200 text-sm">
                              Semana de Recuperação!
                            </h4>
                            <p className="text-amber-300/80 text-xs mt-1">
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
                    <div className="bg-slate-950/40 p-8 rounded-2xl border border-white/5 text-center text-slate-400 shadow-inner flex flex-col items-center">
                      <div className="text-4xl opacity-40 mb-3">📭</div>
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
                              className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden shadow-md"
                            >
                              <div
                                onClick={() => toggleAula(nomeAula)}
                                className="bg-slate-950/50 hover:bg-slate-900/50 border-b border-white/5 p-5 flex justify-between items-center cursor-pointer transition-colors"
                              >
                                <h3 className="font-display font-black text-white flex items-center gap-3 text-lg">
                                  <span className="text-2xl">
                                    {getTemaCurso(cursoSelecionado).icon}
                                  </span>{" "}
                                  {nomeAula}
                                </h3>
                                <div className="flex items-center gap-3">
                                  <span className="bg-slate-900 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/5">
                                    {missoesDaAula.length}{" "}
                                    {missoesDaAula.length === 1
                                      ? "item"
                                      : "itens"}
                                  </span>
                                  <span
                                    className={`text-slate-400 font-bold transition-transform duration-300 ${isAulaFechada ? "" : "rotate-180"}`}
                                  >
                                    ▼
                                  </span>
                                </div>
                              </div>

                              {!isAulaFechada && (
                                modoVisualizacao === "grade" ? (
                                  <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                    {missoesDaAula.map((ativ) => {
                                      const st = ativ.status?.toLowerCase().trim();
                                      const isConcluida =
                                        st === "avaliado" ||
                                        st === "avaliada" ||
                                        st === "aguardando correção";
                                      const isDevolvida = st === "devolvida";
                                      const isAguardandoValidacao = st === "aguardando validação" || st === "aguardando validacao";

                                      return (
                                        <div
                                          key={ativ.id}
                                          className={`bg-slate-950/60 rounded-2xl border shadow-sm flex flex-col overflow-hidden relative transition-all hover:shadow-xl hover:-translate-y-1 ${isConcluida ? "border-emerald-500/20" : isAguardandoValidacao ? "border-amber-500/30 shadow-amber-500/5" : isDevolvida ? "border-red-500/30" : "border-white/5 hover:border-brand-primary/30"}`}
                                        >
                                          <div
                                            className={`h-2 w-full ${isConcluida ? "bg-emerald-500" : isAguardandoValidacao ? "bg-amber-500" : isDevolvida ? "bg-red-500" : ativ.tipo === "Quiz" ? "bg-amber-400" : ativ.tipo === "Material" ? "bg-emerald-400" : "bg-brand-primary"}`}
                                          ></div>
                                          <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                              <span className="bg-slate-900 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/5 shadow-sm">
                                                {ativ.tipo}
                                              </span>
                                              <span className="text-[10px] bg-slate-900/50 text-slate-500 font-bold px-2 py-1 rounded border border-white/5">
                                                ID: {ativ.id.replace("ATIV-", "")}
                                              </span>
                                            </div>
                                            <h4 className="font-bold text-white text-lg mb-3 leading-tight line-clamp-2">
                                              {ativ.titulo}
                                            </h4>
                                            <div className="mt-auto pt-4 space-y-3">
                                              {isConcluida ? (
                                                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex justify-between items-center">
                                                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                                                    <span className="text-base">
                                                      ✅
                                                    </span>{" "}
                                                    Concluída
                                                  </span>
                                                  <span className="bg-emerald-900 text-emerald-300 text-[10px] font-black px-2 py-1 rounded uppercase shadow-sm">
                                                    ⭐ {ativ.xpGanho || ativ.xp} XP
                                                  </span>
                                                </div>
                                              ) : isAguardandoValidacao ? (
                                                <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex justify-between items-center">
                                                  <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                                                    <span className="text-base">
                                                      ⏳
                                                    </span>{" "}
                                                    Em Validação
                                                  </span>
                                                  <span className="bg-amber-900/40 text-amber-300 text-[10px] font-black px-2 py-1 rounded uppercase shadow-sm">
                                                    Pendente
                                                  </span>
                                                </div>
                                              ) : isDevolvida ? (
                                                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 flex justify-between items-center">
                                                  <span className="text-red-400 font-bold text-xs flex items-center gap-1.5">
                                                    <span className="text-base">
                                                      ⚠️
                                                    </span>{" "}
                                                    Devolvida
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                                                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                                                    <span className="text-base">
                                                      ⏳
                                                    </span>{" "}
                                                    Pendente
                                                  </span>
                                                  <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2 py-1 rounded uppercase shadow-sm">
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
                                                className={`cursor-pointer w-full text-white text-sm font-black py-3 px-4 rounded-xl transition-all active:scale-95 shadow-md ${isConcluida ? "bg-slate-800 hover:bg-slate-700" : isAguardandoValidacao ? "bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30" : isDevolvida ? "bg-red-500 hover:bg-red-600" : "bg-brand-primary hover:bg-indigo-600"}`}
                                              >
                                                {isConcluida || isAguardandoValidacao
                                                  ? "Ver Detalhes"
                                                  : "Abrir Atividade"}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  /* TRILHA DE APRENDIZADO (TIMELINE) */
                                  <div className="p-6 md:p-10 relative flex flex-col items-center w-full min-h-[250px] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                    {/* Linha vertical conectora centralizada */}
                                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/30 via-teal-500/30 to-emerald-500/30 transform md:-translate-x-1/2" />
                                    
                                    <div className="w-full space-y-10 relative z-10">
                                      {missoesDaAula.map((ativ, index) => {
                                        const st = ativ.status?.toLowerCase().trim();
                                        const isConcluida =
                                          st === "avaliado" ||
                                          st === "avaliada" ||
                                          st === "aguardando correção";
                                        const isDevolvida = st === "devolvida";
                                        const isAguardandoValidacao = st === "aguardando validação" || st === "aguardando validacao";

                                        // Determina se fica à esquerda ou direita no desktop
                                        const isLeft = index % 2 === 0;

                                        return (
                                          <div
                                            key={ativ.id}
                                            className={`relative flex flex-col md:flex-row md:items-center w-full ${
                                              isLeft ? "md:justify-start" : "md:justify-end"
                                            }`}
                                          >
                                            {/* Nó da linha do tempo com animação de pulso */}
                                            <div
                                              className={`absolute left-8 md:left-1/2 w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-base font-black bg-slate-900 border-2 z-20 transform -translate-x-1/2 shadow-lg transition-transform duration-300 hover:scale-110 ${
                                                isConcluida
                                                  ? "border-emerald-500 text-emerald-405 shadow-emerald-500/10"
                                                  : isAguardandoValidacao
                                                    ? "border-amber-500 text-amber-400 shadow-amber-500/10 animate-pulse"
                                                    : isDevolvida
                                                      ? "border-red-500 text-red-400 shadow-red-500/10 animate-pulse"
                                                      : ativ.tipo === "Quiz"
                                                        ? "border-amber-400 text-amber-400 shadow-amber-400/10"
                                                        : ativ.tipo === "Material"
                                                          ? "border-emerald-450 text-emerald-400 shadow-emerald-450/10"
                                                          : "border-brand-primary text-brand-primary shadow-brand-primary/10"
                                              }`}
                                            >
                                              {isConcluida ? "✓" : isAguardandoValidacao ? "⏳" : isDevolvida ? "!" : ativ.tipo === "Quiz" ? "🎯" : ativ.tipo === "Material" ? "📚" : "🚀"}
                                            </div>

                                            {/* Card da atividade */}
                                            <div
                                              className={`ml-16 md:ml-0 w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] bg-slate-950/60 backdrop-blur-md rounded-3xl border shadow-md transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                                                isConcluida
                                                  ? "border-emerald-500/20"
                                                  : isAguardandoValidacao
                                                    ? "border-amber-500/30"
                                                    : isDevolvida
                                                      ? "border-red-500/30"
                                                      : ativ.tipo === "Quiz"
                                                        ? "border-amber-500/10 hover:border-amber-500/30"
                                                        : ativ.tipo === "Material"
                                                          ? "border-emerald-500/10 hover:border-emerald-500/30"
                                                          : "border-brand-primary/10 hover:border-brand-primary/30"
                                              }`}
                                            >
                                              <div className="p-5">
                                                <div className="flex justify-between items-start mb-3">
                                                  <span
                                                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border tracking-wider shadow-sm ${
                                                      ativ.tipo === "Quiz"
                                                        ? "bg-amber-500/10 text-amber-450 border-amber-500/20"
                                                        : ativ.tipo === "Material"
                                                          ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                                                          : "bg-blue-500/10 text-blue-450 border-blue-500/20"
                                                    }`}
                                                  >
                                                    {ativ.tipo}
                                                  </span>
                                                  <span className="text-[9px] bg-slate-900/50 text-slate-500 font-bold px-2 py-0.5 rounded border border-white/5 font-mono">
                                                    ID: {ativ.id.replace("ATIV-", "")}
                                                  </span>
                                                </div>

                                                <h4 className="font-bold text-white text-base mb-4 leading-tight line-clamp-2">
                                                  {ativ.titulo}
                                                </h4>

                                                <div className="pt-3 flex items-center justify-between border-t border-white/5">
                                                  {isConcluida ? (
                                                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                                      <span>✅</span> Concluída
                                                    </span>
                                                  ) : isAguardandoValidacao ? (
                                                    <span className="text-amber-400 font-bold text-xs flex items-center gap-1 animate-pulse">
                                                      <span>⏳</span> Em Validação
                                                    </span>
                                                  ) : isDevolvida ? (
                                                    <span className="text-red-400 font-bold text-xs flex items-center gap-1">
                                                      <span>⚠️</span> Devolvida
                                                    </span>
                                                  ) : (
                                                    <span className="text-slate-400 font-bold text-xs flex items-center gap-1">
                                                      <span>⏳</span> Pendente
                                                    </span>
                                                  )}
                                                  <span className="text-[10px] text-slate-300 font-black">
                                                    ⭐ {isAguardandoValidacao ? "Pendente" : `${ativ.xpGanho || ativ.xp} XP`}
                                                  </span>
                                                </div>

                                                <button
                                                  onClick={() =>
                                                    abrirMissaoEspecial(
                                                      ativ,
                                                      trilhasDeEstudo[
                                                        cursoSelecionado
                                                      ].status,
                                                    )
                                                  }
                                                  className={`cursor-pointer w-full mt-4 text-white text-xs font-black py-3 px-4 rounded-xl transition-all active:scale-95 shadow-md ${
                                                    isConcluida
                                                      ? "bg-slate-800 hover:bg-slate-700"
                                                      : isAguardandoValidacao
                                                        ? "bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30"
                                                        : isDevolvida
                                                          ? "bg-red-500 hover:bg-red-600"
                                                          : "bg-brand-primary hover:bg-indigo-650"
                                                  }`}
                                                >
                                                  {isConcluida || isAguardandoValidacao
                                                    ? "Ver Detalhes"
                                                    : "Abrir Atividade"}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )
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

      <AnimatePresence>
        {modalFrequenciaAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalFrequenciaAberto(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2rem] shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
            >
              {/* Glow decorativo de fundo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

              {/* Cabeçalho do modal */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-700 dark:to-purple-800 p-5.5 flex justify-between items-center text-white shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2 tracking-tight">
                    <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm shadow-inner">
                      📊
                    </span>{" "}
                    Meu Desempenho e Frequência
                  </h2>
                  <p className="text-indigo-100 text-xs mt-1 font-semibold tracking-wide uppercase opacity-90">
                    Resumo de presença escolar
                  </p>
                </div>
                <button
                  onClick={() => setModalFrequenciaAberto(false)}
                  className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-colors duration-200"
                >
                  &times;
                </button>
              </div>

              {/* Conteúdo rolável */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/40 dark:bg-transparent">
                {carregandoFrequencia ? (
                  <div className="flex flex-col justify-center items-center py-16 opacity-60">
                    <div className="relative w-10 h-10 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                    </div>
                    <p className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">
                      Buscando seu histórico...
                    </p>
                  </div>
                ) : dadosFrequencia ? (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    {/* Bento Grid de Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-center transition-colors">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          Aulas Totais
                        </p>
                        <p className="text-2xl font-black text-slate-700 dark:text-slate-200 font-mono">
                          {dadosFrequencia.totalAulas}
                        </p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-center transition-colors">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          Presenças
                        </p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-450 font-mono">
                          {dadosFrequencia.totalPresencas}
                        </p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-center transition-colors">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          Faltas
                        </p>
                        <p className="text-2xl font-black text-rose-500 dark:text-rose-455 font-mono">
                          {dadosFrequencia.totalFaltas}
                        </p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-center transition-colors">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          Sua Taxa
                        </p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {dadosFrequencia.taxa}%
                        </p>
                      </div>
                    </div>

                    {/* Mensagem de Feedback */}
                    <div
                      className={`p-4.5 rounded-2xl font-semibold shadow-inner text-sm leading-relaxed border ${
                        dadosFrequencia.taxa >= 90
                          ? "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30"
                          : dadosFrequencia.taxa >= 75
                            ? "bg-blue-50/50 dark:bg-blue-950/15 text-blue-800 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/30"
                            : dadosFrequencia.taxa >= 60
                              ? "bg-amber-50/50 dark:bg-amber-950/15 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30"
                              : "bg-red-50/50 dark:bg-red-950/15 text-red-800 dark:text-red-300 border-red-200/50 dark:border-red-900/30 font-bold"
                      }`}
                    >
                      {dadosFrequencia.mensagem}
                    </div>

                    {/* Histórico de aulas */}
                    <div>
                      <h3 className="font-display font-black text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                        Histórico Resumido de Aulas
                      </h3>
                      {dadosFrequencia.historico.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-6 bg-slate-50/30 dark:bg-slate-950/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          Ainda não há registros de presença para a sua turma.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {dadosFrequencia.historico.map(
                            (reg: FrequenciaHistorico, idx: number) => (
                              <div
                                key={idx}
                                className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-2.5 px-3.5 rounded-xl flex justify-between items-center shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                              >
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 font-mono">
                                  {reg.data.slice(0, 5)}
                                </span>
                                {reg.status === "presente" && (
                                  <span
                                    className="bg-emerald-100/90 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20"
                                    title="Presente"
                                  >
                                    P
                                  </span>
                                )}
                                {reg.status === "justificada" && (
                                  <span
                                    className="bg-amber-100/90 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-200/40 dark:border-amber-900/20"
                                    title="Falta Justificada"
                                  >
                                    J
                                  </span>
                                )}
                                {reg.status === "falta" && (
                                  <span
                                    className="bg-red-100/90 dark:bg-red-955/45 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-red-200/40 dark:border-red-900/20"
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
                  <p className="text-center text-red-500 dark:text-red-450 py-12 font-black text-sm uppercase tracking-wider">
                    Erro ao carregar os dados de frequência.
                  </p>
                )}
              </div>

              {/* Rodapé fixo do Modal */}
              <div className="p-6 md:p-8 pt-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/30 dark:bg-transparent">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setModalFrequenciaAberto(false)}
                  className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all select-none shadow-md"
                >
                  Fechar Histórico
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
