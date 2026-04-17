/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import { useRouter } from "next/navigation";

interface DadosAluno {
  matricula: string;
  nome: string;
  turma: string;
}
interface Atividade {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: string | number;
  tipo: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  status: string;
  respostaEnviada: string;
  xpGanho: number;
  statusPrazo?: string;
}
interface PerfilAluno {
  nome: string;
  dataNasc: string;
  matricula: string;
  email: string;
  turma: string;
  telefoneAluno: string;
  telefoneResponsavel: string;
}
interface AlunoRanking {
  matricula: string;
  nome: string;
  turma: string;
  xp: number;
  nivel: string;
  posicao: number;
}

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
  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  const [montado, setMontado] = useState(false);
  const dadosSalvos = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const aluno: DadosAluno | null = dadosSalvos ? JSON.parse(dadosSalvos) : null;

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregandoAtividades, setCarregandoAtividades] = useState(true);

  const [xpTotalSistema, setXpTotalSistema] = useState(0);
  const [nivelSistema, setNivelSistema] = useState("Iniciante");

  // --- ESTADOS DE FILTROS DAS ATIVIDADES ---
  const [abaAtividade, setAbaAtividade] = useState<"Pendentes" | "Atrasadas" | "Concluidas">("Pendentes");
  const [buscaAtividade, setBuscaAtividade] = useState("");

  // --- ESTADOS DO CHECK-IN COM SENHA ---
  const [fazendoCheckin, setFazendoCheckin] = useState(false);
  const [checkinRealizado, setCheckinRealizado] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");

  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [zapConfirmado, setZapConfirmado] = useState(true); // Começa true pra não piscar na tela
  const [zapLink, setZapLink] = useState("");
  const [confirmandoZap, setConfirmandoZap] = useState(false);

  const [perfilAberto, setPerfilAberto] = useState(false);
  const [dadosPerfil, setDadosPerfil] = useState<PerfilAluno | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // --- ESTADOS DO RANKING ---
  const [rankingAberto, setRankingAberto] = useState(false);
  const [dadosRanking, setDadosRanking] = useState<AlunoRanking[]>([]);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [abaRanking, setAbaRanking] = useState<"Geral" | "Turma">("Geral");
  const [filtroTempo, setFiltroTempo] = useState<
    "geral" | "semanal" | "mensal"
  >("geral");

  // --- ESTADOS DE FREQUÊNCIA ---
  const [modalFrequenciaAberto, setModalFrequenciaAberto] = useState(false);
  const [carregandoFrequencia, setCarregandoFrequencia] = useState(false);
  const [dadosFrequencia, setDadosFrequencia] = useState<{
    taxa: number;
    totalAulas: number;
    totalPresencas: number;
    totalFaltas: number;
    mensagem: string;
    historico: { data: string; status: string }[];
  } | null>(null);

  // --- ESTADOS DE ANIVERSÁRIO ---
  const [isAniversario, setIsAniversario] = useState(false);
  const [modalPresenteAberto, setModalPresenteAberto] = useState(false);
  const [resgatandoPresente, setResgatandoPresente] = useState(false);

  const checarWhatsapp = useCallback(async () => {
    if (!aluno || !GOOGLE_API_URL) return;
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "status_whatsapp_aluno",
          matricula: aluno.matricula,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setZapConfirmado(data.confirmado);
        setZapLink(data.link);
      }
    } catch {}
  }, [aluno, GOOGLE_API_URL]);

  const confirmarEntradaGrupo = async () => {
    if (!aluno) return;
    setConfirmandoZap(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "confirmar_whatsapp",
          matricula: aluno.matricula,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setZapConfirmado(true);
        alert("✅ Perfeito! Agora você não perde nenhum aviso.");
      }
    } catch {
    } finally {
      setConfirmandoZap(false);
    }
  };

  useEffect(() => {
    setMontado(true);
  }, []);
  useEffect(() => {
    if (montado && dadosSalvos === null) router.push("/portal/login");
  }, [montado, dadosSalvos, router]);

  const buscarAtividades = useCallback(async () => {
    if (!aluno || !GOOGLE_API_URL) return;
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "buscar_atividades",
          matricula: aluno.matricula,
          turma: aluno.turma,
        }),
      });
      const respostaData = await res.json();
      if (respostaData.status === "sucesso") {
        setAtividades(respostaData.atividades);
        setXpTotalSistema(respostaData.xpTotal || 0);
        setNivelSistema(respostaData.nivel || "Iniciante");
      }
    } catch {
      console.error("Erro ao carregar missões");
    } finally {
      setCarregandoAtividades(false);
    }
  }, [aluno, GOOGLE_API_URL]);

  useEffect(() => {
    if (montado && aluno) {
      buscarAtividades();
      checarWhatsapp();

      // --- VERIFICAÇÃO DE CHECK-IN ---
      const dataHoje = new Date().toLocaleDateString("pt-BR");
      const ultimoCheckin = localStorage.getItem(`checkin_${aluno.matricula}`);
      if (ultimoCheckin === dataHoje) setCheckinRealizado(true);

      // --- VERIFICAÇÃO DE ANIVERSÁRIO ---
      const checarAniversario = async () => {
        try {
          const res = await fetch(GOOGLE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "checar_aniversario",
              matricula: aluno.matricula,
            }),
          });
          const data = await res.json();
          if (data.status === "sucesso" && data.isAniversario) {
            setIsAniversario(true);
            if (!data.jaResgatado) {
              setModalPresenteAberto(true);
            }
          }
        } catch (e) {
          console.error("Erro ao checar aniversário");
        }
      };
      checarAniversario();
    }
  }, [montado, aluno, buscarAtividades, checarWhatsapp, GOOGLE_API_URL]);

  const fazerLogout = () => {
    localStorage.removeItem("alunoLogado");
    router.push("/portal/login");
  };
  const abrirMissao = (ativ: Atividade) => {
    setResposta(ativ.respostaEnviada || "");
    setMissaoAberta(ativ);
  };

  const enviarMissao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resposta.trim())
      return alert("⚠️ Preencha a resposta antes de enviar!");
    if (!aluno || !missaoAberta) return;
    setEnviando(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "enviar_atividade",
          matricula: aluno.matricula,
          idAtividade: missaoAberta.id,
          resposta: resposta,
        }),
      });
      const respostaData = await res.json();
      if (respostaData.status === "sucesso") {
        alert("✅ " + respostaData.mensagem);
        setMissaoAberta(null);
        buscarAtividades();
      } else {
        alert("⚠️ " + respostaData.mensagem);
      }
    } catch {
      alert("❌ Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  };

  // --- NOVA FUNÇÃO DE CHECK-IN COM SENHA ---
  const confirmarCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aluno) return;
    if (!senhaDigitada.trim()) return alert("Digite a senha da lousa!");

    setFazendoCheckin(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "fazer_checkin",
          matricula: aluno.matricula,
          senha: senhaDigitada,
        }),
      });
      const data = await res.json();
      const dataHoje = new Date().toLocaleDateString("pt-BR");

      if (data.status === "sucesso") {
        alert("🎉 " + data.mensagem);
        localStorage.setItem(`checkin_${aluno.matricula}`, dataHoje);
        setCheckinRealizado(true);
        setModalSenhaAberto(false);
        setSenhaDigitada("");
        buscarAtividades();
      } else {
        alert("⚠️ " + data.mensagem);
        // Se a mensagem for sobre o dia errado ou senha errada, ele não marca como realizado.
        // Só marca como realizado se a API disser que ele já garantiu.
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
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "buscar_perfil_aluno",
          matricula: aluno.matricula,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") setDadosPerfil(data.perfil);
      else alert("⚠️ " + data.mensagem);
    } catch {
      alert("❌ Erro ao buscar perfil.");
      setPerfilAberto(false);
    } finally {
      setCarregandoPerfil(false);
    }
  };

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dadosPerfil) return;
    setSalvandoPerfil(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "atualizar_contatos_aluno",
          matricula: dadosPerfil.matricula,
          turma: dadosPerfil.turma,
          telefoneAluno: dadosPerfil.telefoneAluno,
          telefoneResponsavel: dadosPerfil.telefoneResponsavel,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("✅ Salvo!");
        setPerfilAberto(false);
      } else alert("⚠️ " + data.mensagem);
    } catch {
      alert("❌ Erro.");
    } finally {
      setSalvandoPerfil(false);
    }
  };

  // --- BUSCAR RANKING COM FILTRO ---
  const carregarRanking = async (tempoSelecionado: string) => {
    setCarregandoRanking(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "buscar_ranking",
          filtroTempo: tempoSelecionado,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") setDadosRanking(data.ranking);
      else alert("⚠️ " + data.mensagem);
    } catch {
      alert("❌ Erro ao buscar ranking.");
    } finally {
      setCarregandoRanking(false);
    }
  };

  const abrirRanking = () => {
    setRankingAberto(true);
    carregarRanking(filtroTempo);
  };

  const mudarFiltroTempo = (novoTempo: "geral" | "semanal" | "mensal") => {
    setFiltroTempo(novoTempo);
    carregarRanking(novoTempo);
  };

  // --- FUNÇÕES DO PORTAL DO ALUNO (FREQUÊNCIA E ANIVERSÁRIO) ---
  const abrirMinhaFrequencia = async () => {
    if (!aluno) return;
    setModalFrequenciaAberto(true);
    setCarregandoFrequencia(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "minha_frequencia",
          matricula: aluno.matricula,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") setDadosFrequencia(data);
      else alert("⚠️ " + data.mensagem);
    } catch {
      alert("❌ Erro ao buscar frequência.");
    } finally {
      setCarregandoFrequencia(false);
    }
  };

  const resgatarPresente = async () => {
    if (!aluno) return;
    setResgatandoPresente(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "resgatar_aniversario",
          matricula: aluno.matricula,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setModalPresenteAberto(false);
        buscarAtividades(); // Atualiza o XP na tela!
      } else {
        alert("⚠️ " + data.mensagem);
      }
    } catch {
      alert("❌ Erro ao resgatar presente.");
    } finally {
      setResgatandoPresente(false);
    }
  };

  if (!montado || !aluno)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );

  const missoesPendentes = atividades.filter(
    (a) => a.status === "Pendente",
  ).length;
  
  const qtdPendentes = atividades.filter(a => a.status === "Pendente" && a.statusPrazo !== "Atrasada").length;
  const qtdAtrasadas = atividades.filter(a => a.status === "Pendente" && a.statusPrazo === "Atrasada").length;
  const qtdConcluidas = atividades.filter(a => a.status !== "Pendente").length;

  const atividadesFiltradas = atividades.filter((a) => {
    const matchBusca = a.titulo.toLowerCase().includes(buscaAtividade.toLowerCase());
    if (!matchBusca) return false;
    if (abaAtividade === "Pendentes") return a.status === "Pendente" && a.statusPrazo !== "Atrasada";
    if (abaAtividade === "Atrasadas") return a.status === "Pendente" && a.statusPrazo === "Atrasada";
    if (abaAtividade === "Concluidas") return a.status !== "Pendente";
    return true;
  });

  return (
    <main
      className="min-h-screen bg-slate-50 font-sans pb-12 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => {
        e.preventDefault();
        alert("⚠️ Sistema Anti-Cola ativo.");
      }}
      onCut={(e) => e.preventDefault()}
    >
      {/* ========================================== */}
      {/* MODAL DE SENHA DO CHECK-IN                 */}
      {/* ========================================== */}
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

      {/* BANNER DO WHATSAPP */}
      {!zapConfirmado && zapLink && (
        <div className="bg-emerald-600 text-white p-4 shadow-inner flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">💬</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Você ainda não está no nosso WhatsApp!
              </h3>
              <p className="text-emerald-100 text-sm">
                É obrigatório entrar no grupo da sua turma para receber links,
                avisos e não perder missões.
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

      {/* ========================================== */}
      {/* MODAL DO RANKING COM FILTROS TEMPORAIS     */}
      {/* ========================================== */}
      {rankingAberto && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-linear-to-r from-amber-500 to-amber-600 p-4 md:p-5 border-b flex justify-between items-center text-white">
              <div>
                <h2 className="font-black text-lg md:text-xl flex items-center gap-2">
                  <span>🏆</span> Leaderboard
                </h2>
                <p className="text-amber-100 text-[10px] md:text-xs mt-1">
                  Os maiores pontuadores do Trilha Tech
                </p>
              </div>
              <button
                onClick={() => setRankingAberto(false)}
                className="text-3xl leading-none hover:text-amber-200 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* ABAS DE NAVEGAÇÃO DE TURMA */}
            <div className="flex bg-slate-100 border-b border-slate-200">
              <button
                onClick={() => setAbaRanking("Geral")}
                className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${abaRanking === "Geral" ? "bg-white text-amber-600 border-b-2 border-amber-500" : "text-slate-500 hover:bg-slate-200"}`}
              >
                🌎 Ranking Geral
              </button>
              <button
                onClick={() => setAbaRanking("Turma")}
                className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${abaRanking === "Turma" ? "bg-white text-amber-600 border-b-2 border-amber-500" : "text-slate-500 hover:bg-slate-200"}`}
              >
                👥 Minha Turma
              </button>
            </div>

            {/* NOVOS FILTROS TEMPORAIS */}
            <div className="bg-white px-4 py-3 flex justify-center gap-2 border-b border-slate-100 shadow-sm z-10">
              <button
                onClick={() => mudarFiltroTempo("geral")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroTempo === "geral" ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"}`}
              >
                Histórico Total
              </button>
              <button
                onClick={() => mudarFiltroTempo("mensal")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroTempo === "mensal" ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"}`}
              >
                Este Mês
              </button>
              <button
                onClick={() => mudarFiltroTempo("semanal")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroTempo === "semanal" ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"}`}
              >
                Esta Semana
              </button>
            </div>

            <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
              {carregandoRanking ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-amber-500"></div>
                </div>
              ) : dadosRanking.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-4xl mb-3 opacity-50">📭</div>
                  <p className="text-slate-500 font-medium">
                    Nenhum aluno pontuou neste período ainda.
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    Corra e faça a primeira entrega para garantir o topo!
                  </p>
                </div>
              ) : (
                <div className="p-3 md:p-4 space-y-3">
                  {(() => {
                    const minhaTurmaTrilha = dadosRanking.find(
                      (r) => r.matricula === aluno?.matricula,
                    )?.turma;
                    const listaExibicao =
                      abaRanking === "Geral"
                        ? dadosRanking
                        : dadosRanking
                            .filter((r) => r.turma === minhaTurmaTrilha)
                            .map((r, index) => ({ ...r, posicao: index + 1 }));

                    if (abaRanking === "Turma" && !minhaTurmaTrilha)
                      return (
                        <p className="text-center text-slate-500 py-8">
                          Não foi possível identificar a sua turma.
                        </p>
                      );
                    if (listaExibicao.length === 0)
                      return (
                        <p className="text-center text-slate-500 py-8">
                          Ninguém da sua turma pontuou ainda.
                        </p>
                      );

                    return listaExibicao.map((userRank) => {
                      const isMe = userRank.matricula === aluno?.matricula;
                      let medalha = "";
                      let corFundo = "bg-white border-slate-200";
                      let destaqueNome = "text-slate-800";
                      if (userRank.posicao === 1) {
                        medalha = "🥇";
                        corFundo = "bg-amber-100 border-amber-300 shadow-sm";
                        destaqueNome = "text-amber-900";
                      } else if (userRank.posicao === 2) {
                        medalha = "🥈";
                        corFundo = "bg-slate-200 border-slate-300 shadow-sm";
                        destaqueNome = "text-slate-800";
                      } else if (userRank.posicao === 3) {
                        medalha = "🥉";
                        corFundo = "bg-orange-100 border-orange-200 shadow-sm";
                        destaqueNome = "text-orange-900";
                      }
                      if (isMe && userRank.posicao > 3) {
                        corFundo = "bg-blue-50 border-blue-400 shadow-md";
                        destaqueNome = "text-blue-800";
                      }

                      return (
                        <div
                          key={userRank.matricula}
                          className={`flex items-center gap-3 md:gap-4 p-3 rounded-xl border transition-all hover:scale-[1.01] ${corFundo}`}
                        >
                          <div className="w-8 md:w-10 text-center font-black text-slate-600 text-base md:text-lg">
                            {medalha || `${userRank.posicao}º`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-bold text-sm md:text-base truncate ${destaqueNome}`}
                            >
                              {userRank.nome}{" "}
                              {isMe && (
                                <span className="text-[9px] md:text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1 md:ml-2 shadow-sm align-middle shrink-0">
                                  VOCÊ
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 truncate">
                              {userRank.turma} • {userRank.nivel}
                            </p>
                          </div>
                          <div className="text-right bg-white/60 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/50 whitespace-nowrap">
                            <span className="font-black text-amber-600 text-base md:text-lg">
                              {userRank.xp}
                            </span>
                            <span className="text-[9px] md:text-[10px] text-slate-500 ml-1 font-bold uppercase tracking-wider">
                              XP
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE ANIVERSÁRIO (PRESENTE)            */}
      {/* ========================================== */}
      {modalPresenteAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center border-4 border-amber-400 relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-amber-200/50 to-transparent"></div>
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
                className="w-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
              >
                {resgatandoPresente
                  ? "Abrindo Presente..."
                  : "RESGATAR MEU PRESENTE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL MINHA FREQUÊNCIA                     */}
      {/* ========================================== */}
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

                  {/* MENSAGEM DO SISTEMA */}
                  <div
                    className={`p-4 rounded-xl font-medium shadow-inner text-sm md:text-base border ${
                      dadosFrequencia.taxa >= 90
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : dadosFrequencia.taxa >= 75
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : dadosFrequencia.taxa >= 60
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-red-50 text-red-800 border-red-200 font-bold"
                    }`}
                  >
                    {dadosFrequencia.mensagem}
                  </div>

                  {/* HISTÓRICO EM GRADE */}
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
                        {dadosFrequencia.historico.map((reg, idx) => (
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
                        ))}
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

      {/* --- MODAL DO MEU PERFIL (OCULTO AQUI NO CHAT POR TAMANHO, MAS IDÊNTICO) --- */}
      {perfilAberto && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col select-text"
            onContextMenu={(e) => e.stopPropagation()}
            onCopy={(e) => e.stopPropagation()}
            onCut={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-900 p-4 border-b flex justify-between items-center text-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span>👤</span> Meu Perfil
              </h2>
              <button
                onClick={() => setPerfilAberto(false)}
                className="text-2xl leading-none hover:text-blue-200"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              {carregandoPerfil ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : dadosPerfil ? (
                <form onSubmit={salvarPerfil} className="space-y-4">
                  <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded border border-amber-200 mb-4 leading-relaxed">
                    <strong>Aviso de Segurança:</strong> Você tem permissão
                    apenas para atualizar seus números de telefone de contato.
                    Para corrigir qualquer outro dado de registro, procure a
                    secretaria.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.nome}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Matrícula
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.matricula}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Data de Nasc.
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.dataNasc}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Turma Atual
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.turma}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      E-mail Institucional
                    </label>
                    <input
                      type="text"
                      value={dadosPerfil.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed"
                    />
                  </div>
                  <hr className="my-4 border-slate-200" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                        Telefone (Seu)
                      </label>
                      <input
                        type="tel"
                        value={dadosPerfil.telefoneAluno}
                        onChange={(e) =>
                          setDadosPerfil({
                            ...dadosPerfil,
                            telefoneAluno: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded p-2 text-sm outline-none transition-colors"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                        Telefone (Responsável)
                      </label>
                      <input
                        type="tel"
                        value={dadosPerfil.telefoneResponsavel}
                        onChange={(e) =>
                          setDadosPerfil({
                            ...dadosPerfil,
                            telefoneResponsavel: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded p-2 text-sm outline-none transition-colors"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPerfilAberto(false)}
                      className="px-4 py-2 rounded text-slate-600 font-bold hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={salvandoPerfil}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-md disabled:bg-slate-400"
                    >
                      {salvandoPerfil ? "Salvando..." : "Salvar Telefones"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-center text-red-500">Erro ao carregar.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DA MISSÃO --- */}
      {missaoAberta &&
        (() => {
          // Lógica Inteligente para verificar o prazo
          const verificarPrazo = (dataStr: string) => {
            if (!dataStr) return false;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const partes = dataStr.split("-");
            if (partes.length === 3) {
              const limite = new Date(
                Number(partes[0]),
                Number(partes[1]) - 1,
                Number(partes[2]),
              );
              return hoje > limite;
            }
            return false;
          };

          const prazoEncerrado = verificarPrazo(missaoAberta.dataLimite);
          const inputDesabilitado =
            enviando ||
            missaoAberta.status === "Avaliador" ||
            missaoAberta.status === "Avaliado" ||
            prazoEncerrado;

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

                  {/* DESCRIÇÃO COM FORMATAÇÃO DE CÓDIGO */}
                  <div className="text-slate-700 whitespace-pre-wrap font-mono text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed shadow-inner">
                    {missaoAberta.descricao}
                  </div>

                  <form
                    onSubmit={enviarMissao}
                    className="border-t border-slate-200 pt-6"
                  >
                    <h3 className="font-bold text-slate-800 mb-3 uppercase text-sm">
                      Sua Resposta:
                    </h3>
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
                                {/* TEXTO DA ALTERNATIVA COM FORMATAÇÃO DE CÓDIGO */}
                                <code className="text-slate-600 font-mono text-xs whitespace-pre-wrap leading-tight">
                                  {opcaoTexto}
                                </code>
                              </div>
                            </label>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                          Cole o link do seu projeto (GitHub, Replit, etc):
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={resposta}
                          onChange={(e) => setResposta(e.target.value)}
                          required
                          disabled={inputDesabilitado}
                          className={`w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-3 focus:ring-2 focus:ring-blue-500 ${inputDesabilitado ? "opacity-60 cursor-not-allowed bg-slate-100" : ""}`}
                        />
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
                        className={`text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all ${
                          prazoEncerrado
                            ? "bg-red-500 hover:bg-red-600"
                            : inputDesabilitado
                              ? "bg-slate-400"
                              : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {prazoEncerrado
                          ? "Bloqueado pelo Prazo"
                          : enviando
                            ? "Enviando..."
                            : missaoAberta.status === "Avaliador" ||
                                missaoAberta.status === "Avaliado"
                              ? "Já Enviado"
                              : "Enviar Resposta"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          );
        })()}

      {/* --- CABEÇALHO DO DASHBOARD --- */}
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                Portal Trilha Tech
              </h1>
              <p className="text-blue-300 text-xs font-mono">
                {aluno.matricula}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <div className="text-right hidden md:block mr-2">
              <p className="text-sm font-bold">{aluno.nome.split(" ")[0]}</p>
              <p className="text-xs text-blue-300">{aluno.turma}</p>
            </div>

            <button
              onClick={abrirMinhaFrequencia}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md flex items-center gap-1"
            >
              <span>📊</span>{" "}
              <span className="hidden sm:inline">Frequência</span>
            </button>

            <button
              onClick={abrirRanking}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md flex items-center gap-1"
            >
              <span>🏆</span> <span className="hidden sm:inline">Ranking</span>
            </button>

            {/* BOTÃO DE CHECK-IN ABRE O MODAL DA SENHA AGORA */}
            <button
              onClick={() => setModalSenhaAberto(true)}
              disabled={checkinRealizado}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md flex items-center gap-1 ${checkinRealizado ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
            >
              {checkinRealizado ? (
                <>
                  <span>✅</span>
                  <span className="hidden sm:inline">Check-in Realizado</span>
                </>
              ) : (
                <>
                  <span className="animate-pulse">📍</span>
                  <span className="hidden sm:inline">Check-in (+10 XP)</span>
                  <span className="sm:hidden">+10 XP</span>
                </>
              )}
            </button>

            <button
              onClick={abrirPerfil}
              className="bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-blue-700 flex items-center gap-1"
            >
              <span>👤</span> <span className="hidden lg:inline">Perfil</span>
            </button>
            <button
              onClick={fazerLogout}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-slate-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* --- CORPO DO DASHBOARD (MANTIDO) --- */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-2xl font-black text-slate-800">
              Bem-vindo, {aluno.nome.split(" ")[0]}!
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Você tem{" "}
              <strong className="text-amber-600">
                {missoesPendentes} missões pendentes
              </strong>{" "}
              para concluir.
            </p>

            {/* NOVO BOTÃO DE ACESSO AO AVA */}
            <div className="mt-4 md:mt-5">
              <a
                href="https://classroom.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl leading-none">🏫</span>
                Acessar o AVA (Classroom)
              </a>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-3 hidden sm:flex">
              <div className="bg-blue-100 p-2 rounded-full text-xl">🎓</div>
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase">
                  Nível Atual
                </p>
                <p className="text-lg font-black text-blue-600">
                  {nivelSistema}
                </p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full text-xl">⭐</div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase">
                  Seu XP Total
                </p>
                <p className="text-lg font-black text-emerald-600">
                  {xpTotalSistema} XP
                </p>
              </div>
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

        {/* ABAS DE CATEGORIZAÇÃO */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <button
            onClick={() => setAbaAtividade("Pendentes")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${abaAtividade === "Pendentes" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            ⏳ No Prazo ({qtdPendentes})
          </button>
          <button
            onClick={() => setAbaAtividade("Atrasadas")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${abaAtividade === "Atrasadas" ? "bg-red-100 text-red-800 border-red-300" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            🚨 Atrasadas ({qtdAtrasadas})
          </button>
          <button
            onClick={() => setAbaAtividade("Concluidas")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${abaAtividade === "Concluidas" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            ✅ Concluídas ({qtdConcluidas})
          </button>
        </div>

        {carregandoAtividades ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : atividadesFiltradas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            Nenhuma missão encontrada para esta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atividadesFiltradas.map((ativ) => (
              <div
                key={ativ.id}
                onClick={() => abrirMissao(ativ)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col overflow-hidden cursor-pointer"
              >
                <div
                  className={`p-1 ${ativ.status === "Pendente" ? "bg-amber-400" : ativ.status === "Aguardando Correção" ? "bg-blue-400" : "bg-emerald-500"}`}
                ></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase border border-slate-200">
                      {ativ.tipo}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      ⭐ {ativ.xp} XP
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">
                    {ativ.titulo}
                  </h4>
                  <p className="text-slate-500 text-sm mb-4 flex-1 line-clamp-2">
                    {ativ.descricao}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span>📅</span> {ativ.dataLimite}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${ativ.status === "Pendente" ? "bg-amber-100 text-amber-700" : ativ.status === "Aguardando Correção" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {ativ.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
