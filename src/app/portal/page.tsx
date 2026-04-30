/* eslint-disable @typescript-eslint/no-unused-vars */
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
import Image from "next/image";
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
import { apiAluno, apiGeral } from "@/src/services/api"; // 🔥 A MÁGICA AQUI!

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

  const [progressoNivel, setProgressoNivel] = useState({
    porcentagem: 0,
    faltam: 0,
    nomeProximo: "Bronze",
    isMaximo: false,
  });
  const [nomeProjeto, setNomeProjeto] = useState("Portal Educacional");
  const [carregandoPortal, setCarregandoPortal] = useState(true);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
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
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [timerClassroom, setTimerClassroom] = useState(0);
  const [classroomAberto, setClassroomAberto] = useState(false);
  const [checkboxHonestidade, setCheckboxHonestidade] = useState(false);

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

  const VERSAO_ATUALIZACAO = "1.4.0";
  const [modalNovidadesAberto, setModalNovidadesAberto] = useState(false);

  const carregarPortal = useCallback(async () => {
    if (!aluno) return;
    try {
      const data = await apiAluno.carregarPortal(aluno.matricula); // 🔥 API CENTRALIZADA
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
        const data = await apiGeral.buscarConfiguracoes(); // 🔥 API CENTRALIZADA
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

  useEffect(() => {
    if (!missaoAberta) {
      setTimerClassroom(0);
      setClassroomAberto(false);
      setCheckboxHonestidade(false);
    }
  }, [missaoAberta]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (classroomAberto && timerClassroom > 0) {
      interval = setInterval(() => {
        setTimerClassroom((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [classroomAberto, timerClassroom]);

  const dispararIdaAoClassroom = (link: string) => {
    window.open(link, "_blank");
    setClassroomAberto(true);
    if (!checkboxHonestidade && timerClassroom === 0) {
      setTimerClassroom(20);
    }
  };

  const resgatarRecompensaBadge = async (badge: Badge) => {
    if (!aluno) return;
    setResgatandoBadge(true);
    try {
      const data = await apiAluno.resgatarBadge(
        aluno.matricula,
        badge.id,
        badge.recompensa,
        badge.nome,
      ); // 🔥 API CENTRALIZADA
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
      const data = await apiAluno.confirmarWhatsapp(aluno.matricula); // 🔥 API CENTRALIZADA
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

  const enviarMissao = async (e: React.FormEvent) => {
    e.preventDefault();

    const respostaFinal = missaoAberta?.tipo === "Material" ? "Material Acessado e Consumido" : resposta;

    if (!respostaFinal.trim())
      return alert("⚠️ Preencha a resposta antes de enviar!");
    if (!aluno || !missaoAberta) return;
    setEnviando(true);
    try {
      const data = await apiAluno.enviarMissao(
        aluno.matricula,
        missaoAberta.id,
        respostaFinal,
      ); // 🔥 API CENTRALIZADA
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
      const data = await apiAluno.fazerCheckin(aluno.matricula, senhaDigitada); // 🔥 API CENTRALIZADA
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
      const data = await apiAluno.buscarPerfil(aluno.matricula); // 🔥 API CENTRALIZADA
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
      ); // 🔥 API CENTRALIZADA

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
      const data = await apiAluno.minhaFrequencia(aluno.matricula); // 🔥 API CENTRALIZADA
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
      const data = await apiAluno.resgatarAniversario(aluno.matricula); // 🔥 API CENTRALIZADA
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
      await apiAluno.salvarAvatar(aluno.matricula, emoji); // 🔥 API CENTRALIZADA
    } catch {}
  };

  if (!montado || !aluno || carregandoPortal)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">
          Carregando seu progresso...
        </p>
      </div>
    );

  const missoesPendentes = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    return st === "pendente" || st === "devolvida";
  }).length;

  const qtdPendentes = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    return (
      (st === "pendente" || st === "devolvida") && a.statusPrazo !== "Atrasada"
    );
  }).length;

  const qtdAtrasadas = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    return (
      (st === "pendente" || st === "devolvida") && a.statusPrazo === "Atrasada"
    );
  }).length;

  const qtdConcluidas = atividades.filter((a) => {
    const st = a.status?.toLowerCase().trim() || "pendente";
    return st !== "pendente" && st !== "devolvida";
  }).length;

  const atividadesFiltradas = atividades.filter((a) => {
    const matchBusca = a.titulo
      .toLowerCase()
      .includes(buscaAtividade.toLowerCase());
    if (!matchBusca) return false;

    const st = a.status?.toLowerCase().trim() || "pendente";
    if (abaAtividade === "Pendentes")
      return (
        (st === "pendente" || st === "devolvida") &&
        a.statusPrazo !== "Atrasada"
      );
    if (abaAtividade === "Atrasadas")
      return (
        (st === "pendente" || st === "devolvida") &&
        a.statusPrazo === "Atrasada"
      );
    if (abaAtividade === "Concluidas")
      return st !== "pendente" && st !== "devolvida";
    return true;
  });

  return (
    <main
      className="min-h-screen bg-slate-50 font-sans pb-12 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
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

      {!zapConfirmado && zapLink && (
        <div className="bg-emerald-600 text-white p-4 shadow-inner flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">💬</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Você ainda não está no nosso WhatsApp!
              </h3>
              <p className="text-emerald-100 text-sm">
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
              className="bg-white text-emerald-800 font-black py-2 px-6 rounded-lg text-center flex-1 md:flex-none shadow hover:bg-emerald-50 transition-colors"
            >
              1. Entrar no Grupo
            </a>
            <button
              onClick={confirmarEntradaGrupo}
              disabled={confirmandoZap}
              className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors disabled:opacity-50 flex-1 md:flex-none"
            >
              {confirmandoZap ? "..." : "2. Já Entrei!"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800">
              Bem-vindo, {aluno.nome.split(" ")[0]}!
            </h2>
            <p className="text-slate-500 mt-1 flex flex-wrap items-center gap-2 lg:justify-start justify-center">
              <span>
                Você tem{" "}
                <strong className="text-amber-600">
                  {missoesPendentes} missões pendentes
                </strong>
                .
              </span>
              {ofensivaDias > 0 && (
                <span className="bg-orange-100 text-orange-700 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg border border-orange-200 flex items-center gap-1 shadow-sm">
                  🔥 {ofensivaDias} Dias de Ofensiva
                </span>
              )}
            </p>

            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3 w-full">
              <a
                href="https://classroom.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                <span className="text-lg">🏫</span>{" "}
                <span className="text-sm">Classroom</span>
              </a>
              <button
                onClick={() => {
                  setModalPixAberto(true);
                  setAlvoPix(null);
                }}
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 border border-emerald-400 whitespace-nowrap"
              >
                <span className="text-lg">💸</span>{" "}
                <span className="text-sm">Pix de XP</span>
              </button>
              <button
                onClick={() => setModalSenhaAberto(true)}
                disabled={checkinRealizado}
                className={`inline-flex items-center justify-center gap-2 font-bold py-3 px-5 rounded-xl shadow-sm transition-all whitespace-nowrap ${checkinRealizado ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : taxaPresenca >= 90 ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none animate-pulse shadow-orange-200" : "bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5"}`}
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
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-[420px] shrink-0 mt-6 lg:mt-0 gap-4">
            <div className="flex flex-row gap-3 w-full justify-center lg:justify-end">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3 w-1/2 shadow-sm">
                <div className="bg-blue-100 p-2.5 rounded-full text-xl shrink-0">
                  🎓
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Nível Atual
                  </p>
                  <p className="text-lg font-black text-blue-700 leading-none">
                    {nivelSistema}
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 w-1/2 shadow-sm">
                <div className="bg-emerald-200/50 p-2.5 rounded-full text-xl shrink-0">
                  ⭐
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                    Seu XP Total
                  </p>
                  <p className="text-lg font-black text-emerald-600 leading-none">
                    {xpTotalSistema} XP
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm w-full">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2.5">
                <span>Progresso</span>
                <span className="text-blue-600">
                  {progressoNivel.isMaximo
                    ? "Nível Máximo!"
                    : `Rumo ao ${progressoNivel.nomeProximo}`}
                </span>
              </div>
              <div className="w-full bg-slate-200/70 rounded-full h-3 mb-2.5 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressoNivel.porcentagem}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 text-center">
                {progressoNivel.isMaximo ? (
                  "🏆 Você alcançou o topo do Trilha Tech!"
                ) : (
                  <>
                    Faltam{" "}
                    <strong className="text-indigo-600 font-black">
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

      <div className="max-w-5xl mx-auto p-4 md:p-8 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            🎯 Suas Missões
          </h3>
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Pesquisar missão..."
              value={buscaAtividade}
              onChange={(e) => setBuscaAtividade(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <button
            onClick={() => setAbaAtividade("Pendentes")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${abaAtividade === "Pendentes" ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            ⏳ No Prazo ({qtdPendentes})
          </button>
          <button
            onClick={() => setAbaAtividade("Atrasadas")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${abaAtividade === "Atrasadas" ? "bg-red-100 text-red-800 border-red-300 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            🚨 Atrasadas ({qtdAtrasadas})
          </button>
          <button
            onClick={() => setAbaAtividade("Concluidas")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${abaAtividade === "Concluidas" ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            ✅ Concluídas ({qtdConcluidas})
          </button>
        </div>

        {atividadesFiltradas.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm flex flex-col items-center">
            <div className="text-5xl opacity-50 mb-3">📭</div>
            <p className="font-bold">
              Nenhuma missão encontrada para esta categoria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atividadesFiltradas.map((ativ) => {
              const statusNormalizado =
                ativ.status?.toLowerCase().trim() || "pendente";

              return (
                <div
                  key={ativ.id}
                  onClick={() => {
                    setMissaoAberta(ativ);
                    setResposta(ativ.respostaEnviada || "");
                  }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col overflow-hidden cursor-pointer group"
                >
                  <div
                    className={`h-1.5 w-full ${statusNormalizado === "pendente" ? "bg-amber-400" : statusNormalizado === "devolvida" ? "bg-red-500" : statusNormalizado === "aguardando correção" ? "bg-blue-400" : "bg-emerald-500"}`}
                  ></div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                        {ativ.tipo}
                      </span>
                      <span className="text-xs font-black flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shadow-sm">
                        ⭐ {ativ.xp} XP
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {ativ.titulo}
                    </h4>
                    <p className="text-slate-500 text-sm mb-4 flex-1 line-clamp-2">
                      {ativ.descricao}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs text-slate-500 font-bold flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        📅 {ativ.dataLimite}
                      </div>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${statusNormalizado === "pendente" ? "text-amber-600 bg-amber-50" : statusNormalizado === "devolvida" ? "text-red-600 bg-red-50" : statusNormalizado === "aguardando correção" ? "text-blue-600 bg-blue-50" : "text-emerald-600 bg-emerald-50"}`}
                      >
                        {ativ.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center select-text">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="font-black text-xl text-slate-800 mb-2">
              Presença em Sala
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Digite a senha que o tutor escreveu na lousa para garantir os seus
              10 XP.
            </p>
            <form onSubmit={confirmarCheckin}>
              <input
                type="text"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value.toUpperCase())}
                placeholder="SENHA DA LOUSA"
                className="w-full text-center text-2xl font-black font-mono border-2 border-slate-300 rounded-lg p-3 mb-4 focus:border-emerald-500 outline-none uppercase tracking-widest text-slate-800"
                autoFocus
              />
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setModalSenhaAberto(false)}
                  className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={fazendoCheckin}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:bg-emerald-400"
                >
                  {fazendoCheckin ? "Validando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPresenteAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center border-4 border-amber-400 relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-200/50 to-transparent"></div>
            <div className="p-8 relative z-10">
              <div className="text-7xl animate-bounce mb-4 drop-shadow-md">
                🎁
              </div>
              <h2 className="font-black text-2xl text-slate-800 mb-2 uppercase text-amber-600">
                Feliz Aniversário!
              </h2>
              <p className="text-sm text-slate-600 font-medium mb-6">
                Parabéns, <strong>{aluno.nome.split(" ")[0]}</strong>! Hoje é o
                seu dia especial. Como presente do Tutor, você ganhou{" "}
                <strong className="text-emerald-600">100 XP</strong> para
                turbinar o seu nível!
              </p>
              <button
                onClick={resgatarPresente}
                disabled={resgatandoPresente}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
              >
                {resgatandoPresente
                  ? "Abrindo Presente..."
                  : "RESGATAR MEU PRESENTE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFrequenciaAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h2 className="font-black text-lg md:text-xl flex items-center gap-2">
                <span>📊</span> Meu Desempenho e Frequência
              </h2>
              <button
                onClick={() => setModalFrequenciaAberto(false)}
                className="text-3xl leading-none hover:text-indigo-200"
              >
                &times;
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50">
              {carregandoFrequencia ? (
                <div className="flex flex-col justify-center items-center py-16 opacity-60">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
                  <p className="font-bold text-slate-600">
                    Buscando seu histórico...
                  </p>
                </div>
              ) : dadosFrequencia ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Aulas Totais
                      </p>
                      <p className="text-2xl font-black text-slate-700">
                        {dadosFrequencia.totalAulas}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Presenças
                      </p>
                      <p className="text-2xl font-black text-emerald-600">
                        {dadosFrequencia.totalPresencas}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Faltas
                      </p>
                      <p className="text-2xl font-black text-red-500">
                        {dadosFrequencia.totalFaltas}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Sua Taxa
                      </p>
                      <p className="text-2xl font-black text-indigo-600">
                        {dadosFrequencia.taxa}%
                      </p>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-xl font-medium shadow-inner text-sm md:text-base border ${dadosFrequencia.taxa >= 90 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : dadosFrequencia.taxa >= 75 ? "bg-blue-50 text-blue-800 border-blue-200" : dadosFrequencia.taxa >= 60 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200 font-bold"}`}
                  >
                    {dadosFrequencia.mensagem}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">
                      Histórico Resumido de Aulas
                    </h3>
                    {dadosFrequencia.historico.length === 0 ? (
                      <p className="text-sm text-slate-500 italic text-center py-4">
                        Ainda não há registros de presença para a sua turma.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {dadosFrequencia.historico.map(
                          (reg: FrequenciaHistorico, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white border border-slate-200 p-2.5 rounded-lg flex justify-between items-center shadow-sm"
                            >
                              <span className="text-[11px] font-bold text-slate-600">
                                {reg.data.slice(0, 5)}
                              </span>
                              {reg.status === "presente" && (
                                <span
                                  className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded"
                                  title="Presente"
                                >
                                  P
                                </span>
                              )}
                              {reg.status === "justificada" && (
                                <span
                                  className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded"
                                  title="Falta Justificada"
                                >
                                  J
                                </span>
                              )}
                              {reg.status === "falta" && (
                                <span
                                  className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded"
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
                <p className="text-center text-red-500 py-8 font-bold">
                  Erro ao carregar dados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {missaoAberta &&
        (() => {
          const verificarPrazo = (dataStr: string) => {
            if (!dataStr) return false;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const partes = dataStr.split("/");
            if (partes.length === 3) {
              const limite = new Date(
                Number(partes[2]),
                Number(partes[1]) - 1,
                Number(partes[0]),
              );
              return hoje > limite;
            }
            return false;
          };
          const prazoEncerrado = verificarPrazo(missaoAberta.dataLimite);

          const statusAtual =
            missaoAberta.status?.toLowerCase().trim() || "pendente";

          let bloqueioClassroom = false;
          if (missaoAberta.linkClassroom && !checkboxHonestidade) {
            bloqueioClassroom = true;
          }

          const inputDesabilitado =
            enviando ||
            (statusAtual !== "pendente" && statusAtual !== "devolvida") ||
            bloqueioClassroom;

          return (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div
                  className={`p-4 border-b flex justify-between items-center text-white ${missaoAberta.tipo === "Quiz" ? "bg-amber-600" : "bg-blue-600"}`}
                >
                  <h2 className="font-bold text-lg">
                    🎯 {missaoAberta.tipo}: {missaoAberta.titulo}
                  </h2>
                  <button
                    onClick={() => setMissaoAberta(null)}
                    className="text-2xl leading-none hover:text-slate-200"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <div className="flex gap-4 mb-4 text-sm font-bold">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded border border-slate-200">
                      ID: {missaoAberta.id}
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded border border-emerald-200">
                      ⭐ {missaoAberta.xp} XP Possíveis
                    </span>
                    {prazoEncerrado && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded border border-red-200 animate-pulse">
                        ⏳ Prazo Encerrado
                      </span>
                    )}
                  </div>
                  <div className="text-slate-700 whitespace-pre-wrap font-mono text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed shadow-inner">
                    {missaoAberta.descricao}
                  </div>

                  {missaoAberta.imagemUrl && (
                    <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                      <Image
                        src={(() => {
                          const url = missaoAberta.imagemUrl || "";
                          const match = url.match(
                            /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
                          );
                          return match
                            ? `https://drive.google.com/uc?export=view&id=${match[1]}`
                            : url;
                        })()}
                        alt="Referência da Missão"
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="object-contain p-2"
                      />
                    </div>
                  )}

                  <form
                    onSubmit={enviarMissao}
                    className="border-t border-slate-200 pt-6"
                  >
                    {statusAtual === "devolvida" && (
                      <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl mb-4 animate-in slide-in-from-top-2 shadow-sm">
                        <h3 className="text-red-700 font-black text-sm flex items-center gap-2 mb-1">
                          <span>⚠️</span> Missão Devolvida pelo Tutor!
                        </h3>
                        <p className="text-red-600 text-xs font-medium">
                          {missaoAberta.feedback ||
                            "A sua missão foi devolvida para correção. Por favor, revise as instruções e envie novamente."}
                        </p>
                      </div>
                    )}

                    {(statusAtual === "avaliado" ||
                      statusAtual === "avaliada") &&
                      missaoAberta.feedback && (
                        <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl mb-4 animate-in slide-in-from-top-2 shadow-sm">
                          <h3 className="text-emerald-700 font-black text-sm flex items-center gap-2 mb-1">
                            <span>💬</span> Feedback do Tutor
                          </h3>
                          <p className="text-emerald-600 text-xs font-medium">
                            {missaoAberta.feedback}
                          </p>
                        </div>
                      )}

                    {missaoAberta.linkClassroom &&
                      (statusAtual === "pendente" ||
                        statusAtual === "devolvida") && (
                        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-xl mb-6 shadow-sm">
                          <h3 className="text-amber-800 font-black text-sm flex items-center gap-2 mb-2">
                            <span>🏫</span> Entrega Obrigatória no Classroom!
                          </h3>
                          <p className="text-amber-700 text-xs font-medium mb-4 leading-relaxed">
                            Para ganhar o XP desta missão, você precisa primeiro
                            registrar a sua entrega oficial no Ambiente Virtual
                            de Aprendizagem (Classroom).
                          </p>

                          <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                dispararIdaAoClassroom(
                                  missaoAberta.linkClassroom!,
                                )
                              }
                              className="bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                            >
                              1. ABRIR O GOOGLE CLASSROOM 🔗
                            </button>

                            {classroomAberto && timerClassroom > 0 && (
                              <div className="text-center p-3 bg-amber-100 text-amber-700 font-bold text-xs rounded-lg animate-pulse">
                                ⏳ Validando o seu acesso... aguarde{" "}
                                {timerClassroom} segundos.
                              </div>
                            )}

                            {classroomAberto && timerClassroom === 0 && (
                              <label className="flex items-start gap-3 p-3 bg-white border-2 border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors mt-2 animate-in fade-in">
                                <input
                                  type="checkbox"
                                  required
                                  checked={checkboxHonestidade}
                                  onChange={(e) =>
                                    setCheckboxHonestidade(e.target.checked)
                                  }
                                  className="mt-1 w-5 h-5 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                                />
                                <span className="text-xs text-slate-700 font-bold leading-snug">
                                  2. Confirmo por minha honra que já anexei e
                                  enviei o meu material no Google Classroom
                                  oficial.
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Renderização Condicional da Resposta baseada no Tipo de Missão */}
                    {missaoAberta.tipo !== "Material" && (
                      <h3 className="font-bold text-slate-800 mb-3 uppercase text-sm mt-4">
                        Sua Resposta:
                      </h3>
                    )}

                    {missaoAberta.tipo === "Quiz" ? (
                      <div className="space-y-3">
                        {["A", "B", "C", "D"].map((letra) => {
                          const opcaoTexto =
                            missaoAberta[`opcao${letra}` as keyof Atividade];
                          return opcaoTexto ? (
                            <label
                              key={letra}
                              className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${resposta === letra ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "bg-white border-slate-300 hover:bg-slate-50"} ${inputDesabilitado ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="radio"
                                name="quiz"
                                value={letra}
                                checked={resposta === letra}
                                onChange={(e) => setResposta(e.target.value)}
                                disabled={inputDesabilitado}
                                className="mt-1 mr-3"
                              />
                              <div className="flex-1 overflow-x-auto">
                                <strong className="text-slate-700 mr-2">
                                  {letra})
                                </strong>
                                <code className="text-slate-600 font-mono text-xs whitespace-pre-wrap leading-tight">
                                  {opcaoTexto}
                                </code>
                              </div>
                            </label>
                          ) : null;
                        })}
                      </div>
                    ) : missaoAberta.tipo === "Projeto" ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                          Cole o link do seu projeto (GitHub, Replit, etc):
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={resposta}
                          onChange={(e) => setResposta(e.target.value)}
                          required={!missaoAberta.linkClassroom}
                          disabled={inputDesabilitado}
                          className={`w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-3 focus:ring-2 focus:ring-blue-500 ${inputDesabilitado ? "opacity-60 cursor-not-allowed bg-slate-100" : ""}`}
                        />
                      </div>
                    ) : (
                      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl text-center shadow-sm">
                        <span className="text-3xl block mb-2">📚</span>
                        <p className="text-sm font-black text-blue-800 uppercase tracking-widest mb-1">
                          Material de Apoio
                        </p>
                        <p className="text-xs text-blue-600 font-medium">
                          Nenhuma resposta em texto é necessária. Apenas acesse
                          o conteúdo, marque a caixinha de honestidade acima e
                          resgate seu XP!
                        </p>
                        {/* Se for material, garantimos que o form possa ser submetido passando uma resposta invisível */}
                        <input type="hidden" value="Material Consumido" />
                      </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setMissaoAberta(null)}
                        className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={inputDesabilitado}
                        className={`text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all ${inputDesabilitado ? "bg-slate-400" : prazoEncerrado ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
                      >
                        {enviando
                          ? "Processando..."
                          : statusAtual === "aguardando correção" ||
                              statusAtual === "avaliador" ||
                              statusAtual === "avaliado" ||
                              statusAtual === "avaliada"
                            ? "Já Concluído"
                            : statusAtual === "devolvida"
                              ? "Reenviar Missão"
                              : missaoAberta.tipo === "Material"
                                ? "Resgatar XP do Material"
                                : prazoEncerrado
                                  ? "Enviar com Atraso (Penalidade)"
                                  : "Enviar Resposta"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          );
        })()}
    </main>
  );
}
