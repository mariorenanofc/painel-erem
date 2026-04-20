/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";

// Imports dos Tipos e Componentes
import {
  Atividade,
  Entrega,
  AlunoRankingTutor,
  FrequenciaHoje,
} from "@/src/types";
import RankingTutorModal from "@/src/components/RankingTutorModal";
import CorrecaoMissoesModal from "@/src/components/CorrecaoMissoesModal";
import GestaoFrequenciaModal from "@/src/components/GestaoFrequenciaModal";
import MissoesList from "@/src/components/MissoesList";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

const fetcherAtividades = async (url: string) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "buscar_todas_atividades",
      filtroTurma: "Todas",
      filtroTipo: "Todos",
    }),
  });
  return res.json();
};

export default function GestaoAulasPage() {
  const router = useRouter();
  const [nomeUsuario] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioLogado") || ""
      : "",
  );
  const [montado, setMontado] = useState(false);

  // === CONFIGURAÇÕES DINÂMICAS ===
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<string[]>([
    "Turma 1 - 1º Ano",
    "Turma 2 - 2º Ano",
  ]);
  const [nomeProjeto, setNomeProjeto] = useState("Trilha Tech");

  // === LINKS DINÂMICOS ===
  const [linksGerais, setLinksGerais] = useState({
    planilha: "https://docs.google.com/spreadsheets",
    classroom: "https://classroom.google.com/",
    matriz: "#",
    ajuda: "#",
    cronograma: "#",
  });

  // === NOVO ESTADO: MODO REPOSIÇÃO ===
  const [modoReposicao, setModoReposicao] = useState(false);
  const [carregandoReposicao, setCarregandoReposicao] = useState(false);

  // === ESTADOS DO FORMULÁRIO (MISSÕES) ===
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [xp, setXp] = useState("100");
  const [turmaAlvo, setTurmaAlvo] = useState("Todas");
  const [tipo, setTipo] = useState("Projeto");
  const [opcaoA, setOpcaoA] = useState("");
  const [opcaoB, setOpcaoB] = useState("");
  const [opcaoC, setOpcaoC] = useState("");
  const [opcaoD, setOpcaoD] = useState("");
  const [respostaCorreta, setRespostaCorreta] = useState("A");
  const [salvando, setSalvando] = useState(false);

  // === ESTADOS DOS MODAIS ===
  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregandoEntregas, setCarregandoEntregas] = useState(false);
  const [notasTemp, setNotasTemp] = useState<Record<string, number>>({});

  const [senhaLousa, setSenhaLousa] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [modalZapAberto, setModalZapAberto] = useState(false);

  const [modalRankingAberto, setModalRankingAberto] = useState(false);
  const [dadosRanking, setDadosRanking] = useState<AlunoRankingTutor[]>([]);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [filtroTempoRanking, setFiltroTempoRanking] = useState<
    "geral" | "mensal" | "semanal"
  >("geral");
  const [filtroTurmaRanking, setFiltroTurmaRanking] = useState<string>("Todas");

  const [aniversariantes, setAniversariantes] = useState<
    { nome: string; turma: string }[]
  >([]);

  const [modalFreqAberto, setModalFreqAberto] = useState(false);
  const [abaDiario, setAbaDiario] = useState<"mensal" | "hoje">("mensal");
  const [carregandoFreq, setCarregandoFreq] = useState(false);
  const [diasComAula, setDiasComAula] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [alunosDiario, setAlunosDiario] = useState<any[]>([]);

  const [turmaDiario, setTurmaDiario] = useState("");
  const [mesDiario, setMesDiario] = useState(String(new Date().getMonth() + 1));
  const [anoDiario, setAnoDiario] = useState(String(new Date().getFullYear()));
  const [modalJustificativaAberto, setModalJustificativaAberto] = useState<{
    matricula: string;
    nome: string;
    dia: number;
    idFalta?: string;
  } | null>(null);
  const [textoJustificativa, setTextoJustificativa] = useState("");

  const [carregandoFreqHoje, setCarregandoFreqHoje] = useState(false);
  const [dadosFreqHoje, setDadosFreqHoje] = useState<FrequenciaHoje[]>([]);
  const [totalAulasTurma, setTotalAulasTurma] = useState(0);
  const [filtroStatusHoje, setFiltroStatusHoje] = useState<
    "Todos" | "Presentes" | "Faltantes"
  >("Todos");
  const [ordenacaoFreq, setOrdenacaoFreq] = useState<
    "alfabetica" | "mais_faltas"
  >("mais_faltas");

  // === DADOS GERAIS VIA SWR ===
  const { data, isLoading, mutate } = useSWR(
    nomeUsuario && GOOGLE_API_URL ? GOOGLE_API_URL : null,
    fetcherAtividades,
    { revalidateOnFocus: true },
  );

  const atividades: Atividade[] =
    data?.status === "sucesso" ? data.atividades : [];

  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) window.location.href = "/";

    const buscarConfiguracoes = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "buscar_configuracoes" }),
        });
        const data = await res.json();
        if (data.status === "sucesso") {
          if (
            data.configuracoes.turmas &&
            data.configuracoes.turmas.length > 0
          ) {
            setTurmasDisponiveis(data.configuracoes.turmas);
            setTurmaDiario(data.configuracoes.turmas[0]);
          }
          setNomeProjeto(data.configuracoes.nomeProjeto || "Trilha Tech");

          setLinksGerais({
            planilha:
              data.configuracoes.linkPlanilha ||
              "https://docs.google.com/spreadsheets",
            classroom:
              data.configuracoes.linkClassroom ||
              "https://classroom.google.com/",
            matriz: data.configuracoes.linkMatriz || "#",
            ajuda: data.configuracoes.linkAjuda || "#",
            cronograma: data.configuracoes.linkCronograma || "#",
          });

          // Puxa o estado atual do Modo Reposição
          setModoReposicao(data.configuracoes.modoReposicao === "LIGADO");
        }
      } catch (e) {
        console.error("Erro", e);
      }
    };

    const buscarSenhaAtual = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "buscar_senha_checkin" }),
        });
        const data = await res.json();
        if (data.status === "sucesso") setSenhaLousa(data.senha);
      } catch (e) {}
    };

    const buscarAniversariantes = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "buscar_aniversariantes_dia" }),
        });
        const data = await res.json();
        if (data.status === "sucesso") setAniversariantes(data.aniversariantes);
      } catch (e) {}
    };

    if (GOOGLE_API_URL) {
      buscarConfiguracoes();
      buscarSenhaAtual();
      buscarAniversariantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeUsuario, GOOGLE_API_URL]);

  // === FUNÇÃO DO BOTÃO DE MODO REPOSIÇÃO ===
  const toggleModoReposicao = async () => {
    setCarregandoReposicao(true);
    const novoStatus = !modoReposicao ? "LIGADO" : "DESLIGADO";
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "toggle_modo_reposicao",
          status: novoStatus,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setModoReposicao(!modoReposicao);
      } else {
        alert("Erro ao alterar modo: " + data.mensagem);
      }
    } catch (e) {
      alert("Erro de conexão ao alterar o modo de reposição.");
    } finally {
      setCarregandoReposicao(false);
    }
  };

  const carregarRankingTutor = async (
    tempo: "geral" | "mensal" | "semanal",
  ) => {
    setCarregandoRanking(true);
    setFiltroTempoRanking(tempo);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "buscar_ranking", filtroTempo: tempo }),
      });
      const resData = await res.json();
      if (resData.status === "sucesso") setDadosRanking(resData.ranking);
      else alert("Erro: " + resData.mensagem);
    } catch {
      alert("Erro ao buscar ranking.");
    } finally {
      setCarregandoRanking(false);
    }
  };

  const exportarRankingCSV = () => {
    let lista = dadosRanking;
    if (filtroTurmaRanking !== "Todas")
      lista = dadosRanking.filter((a) => a.turma === filtroTurmaRanking);
    if (lista.length === 0) return alert("Nenhum dado para exportar.");
    const csvContent = [
      ["Posição", "Matrícula", "Nome", "Turma", "Nível", "XP"].join(","),
      ...lista.map(
        (a, i) =>
          `${i + 1},${a.matricula},"${a.nome}",${a.turma},${a.nivel},${a.xp}`,
      ),
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
    );
    link.download = `Ranking_${filtroTempoRanking}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salvarNovaSenha = async () => {
    if (!senhaLousa) return alert("Digite uma senha válida!");
    setSalvandoSenha(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "atualizar_senha_checkin",
          novaSenha: senhaLousa,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") alert("✅ " + data.mensagem);
    } catch {
      alert("Erro.");
    } finally {
      setSalvandoSenha(false);
    }
  };

  const limparFormulario = () => {
    setIdEditando(null);
    setTitulo("");
    setDescricao("");
    setDataLimite("");
    setXp("100");
    setTurmaAlvo("Todas");
    setTipo("Projeto");
    setOpcaoA("");
    setOpcaoB("");
    setOpcaoC("");
    setOpcaoD("");
    setRespostaCorreta("A");
  };

  const preencherEdicao = (ativ: Atividade) => {
    setIdEditando(ativ.id ? String(ativ.id) : null);
    setTitulo(String(ativ.titulo || ""));
    setDescricao(String(ativ.descricao || ""));
    setDataLimite(String(ativ.dataLimite || ""));
    setXp(String(ativ.xp || "100"));
    setTurmaAlvo(String(ativ.turmaAlvo || "Todas"));
    setTipo(String(ativ.tipo || "Projeto"));
    setOpcaoA(String(ativ.opcaoA || ""));
    setOpcaoB(String(ativ.opcaoB || ""));
    setOpcaoC(String(ativ.opcaoC || ""));
    setOpcaoD(String(ativ.opcaoD || ""));
    setRespostaCorreta(String(ativ.respostaCorreta || "A"));
  };

  const excluirAtividade = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir a missão ${id}?`)) return;
    try {
      await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "excluir_atividade", idAtividade: id }),
      });
      mutate();
    } catch {
      alert("Erro ao excluir.");
    }
  };

  const salvarNovaAtividade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descricao || !dataLimite || !xp)
      return alert("Preencha os campos obrigatórios!");
    setSalvando(true);
    try {
      await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "salvar_atividade",
          idAtividadeEdit: idEditando,
          titulo,
          descricao,
          dataLimite,
          xp,
          turmaAlvo,
          tipo,
          opcaoA,
          opcaoB,
          opcaoC,
          opcaoD,
          respostaCorreta,
        }),
      });
      limparFormulario();
      mutate();
    } catch {
      alert("Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalEntregas = async (ativ: Atividade) => {
    setMissaoAberta(ativ);
    setCarregandoEntregas(true);
    setNotasTemp({});
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "buscar_entregas_atividade",
          idAtividade: ativ.id,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setEntregas(data.entregas);
        const notasIniciais: Record<string, number> = {};
        data.entregas.forEach(
          (ent: Entrega) => (notasIniciais[ent.idEntrega] = ent.xpGanho),
        );
        setNotasTemp(notasIniciais);
      }
    } catch {
      alert("Erro ao buscar entregas.");
      setMissaoAberta(null);
    } finally {
      setCarregandoEntregas(false);
    }
  };

  const avaliarAluno = async (entrega: Entrega) => {
    const nota = notasTemp[entrega.idEntrega] || 0;
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "avaliar_entrega",
          idEntrega: entrega.idEntrega,
          matricula: entrega.matricula,
          xpGanho: nota,
          novoStatus: "Avaliado",
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("✅ Avaliado com sucesso!");
        setEntregas(
          entregas.map((e) =>
            e.idEntrega === entrega.idEntrega
              ? { ...e, status: "Avaliado", xpGanho: nota }
              : e,
          ),
        );
      }
    } catch {
      alert("Erro ao avaliar.");
    }
  };

  const buscarDiarioClasse = async (
    turma: string,
    mes: string,
    ano: string,
  ) => {
    if (!turma) return;
    setCarregandoFreq(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "buscar_diario_classe",
          turma: turma,
          mes: mes,
          ano: ano,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setDiasComAula(data.diasComAula);
        setAlunosDiario(data.alunos);
      }
    } catch {
      alert("Erro.");
    } finally {
      setCarregandoFreq(false);
    }
  };

  const buscarFrequenciaHoje = async (turma: string) => {
    if (!turma) return;
    setCarregandoFreqHoje(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "buscar_frequencia_hoje", turma }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setDadosFreqHoje(data.registros);
        setTotalAulasTurma(data.totalAulas);
      }
    } catch {
      alert("Erro.");
    } finally {
      setCarregandoFreqHoje(false);
    }
  };

  const abrirRelatorioFrequencia = () => {
    setModalFreqAberto(true);
    setAbaDiario("mensal");
    if (turmaDiario) {
      buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
      buscarFrequenciaHoje(turmaDiario);
    }
  };

  useEffect(() => {
    if (modalFreqAberto && turmaDiario)
      buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaDiario, mesDiario, anoDiario]);
  useEffect(() => {
    if (modalFreqAberto && turmaDiario) buscarFrequenciaHoje(turmaDiario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaDiario]);

  const salvarJustificativa = async () => {
    if (!modalJustificativaAberto || !textoJustificativa)
      return alert("Digite o motivo da falta.");
    const dataIso = `${anoDiario}-${String(mesDiario).padStart(2, "0")}-${String(modalJustificativaAberto.dia).padStart(2, "0")}`;
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "justificar_falta",
          matricula: modalJustificativaAberto.matricula,
          data: dataIso,
          justificativa: textoJustificativa,
          idFalta: modalJustificativaAberto.idFalta,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("✅ " + data.mensagem);
        setModalJustificativaAberto(null);
        setTextoJustificativa("");
        buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
      } else alert("⚠️ " + data.mensagem);
    } catch {
      alert("Erro.");
    }
  };

  const freqHojeFiltrada = useMemo(() => {
    let lista = [...dadosFreqHoje];
    if (filtroStatusHoje === "Presentes")
      lista = lista.filter((a) => a.presenteHoje === true);
    else if (filtroStatusHoje === "Faltantes")
      lista = lista.filter((a) => a.presenteHoje === false);
    if (ordenacaoFreq === "mais_faltas")
      lista.sort((a, b) => b.faltasTotais - a.faltasTotais);
    else lista.sort((a, b) => a.nome.localeCompare(b.nome));
    return lista;
  }, [dadosFreqHoje, filtroStatusHoje, ordenacaoFreq]);

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-100"></div>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <RankingTutorModal
        isOpen={modalRankingAberto}
        onClose={() => setModalRankingAberto(false)}
        carregando={carregandoRanking}
        dadosRanking={dadosRanking}
        filtroTempo={filtroTempoRanking}
        filtroTurma={filtroTurmaRanking}
        setFiltroTurma={setFiltroTurmaRanking}
        onMudarFiltroTempo={carregarRankingTutor}
        onExportarCSV={exportarRankingCSV}
      />
      <CorrecaoMissoesModal
        missaoAberta={missaoAberta}
        entregas={entregas}
        carregando={carregandoEntregas}
        notasTemp={notasTemp}
        onClose={() => setMissaoAberta(null)}
        onSetNotasTemp={setNotasTemp}
        onAvaliar={avaliarAluno}
      />
      <GestaoFrequenciaModal
        isOpen={modalFreqAberto}
        onClose={() => setModalFreqAberto(false)}
        abaDiario={abaDiario}
        setAbaDiario={setAbaDiario}
        turmaDiario={turmaDiario}
        setTurmaDiario={setTurmaDiario}
        mesDiario={mesDiario}
        setMesDiario={setMesDiario}
        anoDiario={anoDiario}
        setAnoDiario={setAnoDiario}
        carregandoFreq={carregandoFreq}
        diasComAula={diasComAula}
        alunosDiario={alunosDiario}
        carregandoFreqHoje={carregandoFreqHoje}
        freqHojeFiltrada={freqHojeFiltrada}
        dadosFreqHoje={dadosFreqHoje}
        totalAulasTurma={totalAulasTurma}
        filtroStatusHoje={filtroStatusHoje}
        setFiltroStatusHoje={setFiltroStatusHoje}
        ordenacaoFreq={ordenacaoFreq}
        setOrdenacaoFreq={setOrdenacaoFreq}
        modalJustificativaAberto={modalJustificativaAberto}
        setModalJustificativaAberto={setModalJustificativaAberto}
        textoJustificativa={textoJustificativa}
        setTextoJustificativa={setTextoJustificativa}
        salvarJustificativa={salvarJustificativa}
      />

      {modalZapAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 mb-4">
              <span>💬</span> Configurar Grupos
            </h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 text-sm text-blue-800 font-medium">
              As configurações de WhatsApp agora devem ser alteradas diretamente
              na aba <strong>&quot;configuracoes&quot;</strong> da sua Planilha
              do Google!
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalZapAberto(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded font-bold text-slate-700 transition-colors"
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <Header
          carregando={isLoading}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "/";
          }}
        />

        <div className="flex items-center gap-4 mb-6 mt-4">
          <button
            onClick={() => router.push("/trilhatech")}
            className="text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-black text-slate-800 border-l-4 border-blue-500 pl-3">
            Gestão: {nomeProjeto}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <a
            href={linksGerais.planilha}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">📊</span>
            <span className="text-xs font-bold leading-tight">
              Planilha do Sistema
            </span>
          </a>
          <a
            href={linksGerais.classroom}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">🏫</span>
            <span className="text-xs font-bold leading-tight">
              AVA (Classroom)
            </span>
          </a>
          <a
            href={linksGerais.matriz}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">📑</span>
            <span className="text-xs font-bold leading-tight">
              Matriz Institucional
            </span>
          </a>
          <a
            href={linksGerais.ajuda}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">🆘</span>
            <span className="text-xs font-bold leading-tight">
              Canal de Ajuda
            </span>
          </a>
          <a
            href={linksGerais.cronograma}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">🗓️</span>
            <span className="text-xs font-bold leading-tight">
              Cronograma Anual
            </span>
          </a>
        </div>

        {aniversariantes.length > 0 && (
          <div className="bg-linear-to-r from-amber-100 to-orange-100 border border-amber-300 text-amber-900 px-5 py-4 rounded-xl shadow-sm mb-6 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-4xl animate-bounce drop-shadow-sm">🎂</span>
            <div>
              <h3 className="font-black text-sm md:text-base uppercase tracking-tight text-amber-700">
                Aniversariantes de Hoje!
              </h3>
              <p className="text-xs md:text-sm font-medium mt-0.5">
                Deixe um parabéns especial para:{" "}
                <strong>
                  {aniversariantes
                    .map((a) => `${a.nome} (${a.turma})`)
                    .join(", ")}
                </strong>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* NOVO CARD: MODO DE REPOSIÇÃO COM SWITCH */}
            <div
              className={`p-6 rounded-xl shadow-sm border transition-all duration-300 ${modoReposicao ? "bg-indigo-50 border-indigo-300 shadow-indigo-100" : "bg-white border-slate-200"}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3
                  className={`text-lg font-bold flex items-center gap-2 ${modoReposicao ? "text-indigo-900" : "text-slate-800"}`}
                >
                  <span className={modoReposicao ? "animate-spin-slow" : ""}>
                    ⚙️
                  </span>{" "}
                  Modo Reposição
                </h3>

                {/* O SWITCH DE LIGAR/DESLIGAR */}
                <button
                  onClick={toggleModoReposicao}
                  disabled={carregandoReposicao}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${modoReposicao ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 hover:bg-slate-400"} ${carregandoReposicao ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${modoReposicao ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
              <p
                className={`text-xs ${modoReposicao ? "text-indigo-700 font-medium" : "text-slate-500"}`}
              >
                {modoReposicao
                  ? "Ativado! Os alunos podem fazer check-in de presença hoje, ignorando a trava dos dias da semana."
                  : "Desativado. O check-in obedece rigorosamente aos dias letivos definidos para cada turma."}
              </p>
            </div>

            <button
              onClick={() => setModalZapAberto(true)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2 border border-blue-200"
            >
              <span>💬</span> Links WhatsApp
            </button>

            <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                <span>🔐</span> Senha do Check-in
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Anote esta senha na lousa para o check-in de hoje.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={senhaLousa}
                  onChange={(e) => setSenhaLousa(e.target.value.toUpperCase())}
                  placeholder="Ex: AULA01"
                  className="w-full font-mono font-black text-center border-2 border-slate-300 rounded p-2 text-slate-800 uppercase focus:border-blue-500 outline-none"
                />
                <button
                  onClick={salvarNovaSenha}
                  disabled={salvandoSenha}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded disabled:bg-slate-400 transition-colors"
                >
                  {salvandoSenha ? "..." : "Salvar"}
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📝</span>{" "}
                  {idEditando ? `Editando ${idEditando}` : "Nova Missão"}
                </h3>
                {idEditando && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
              <form onSubmit={salvarNovaAtividade} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Tipo de Missão
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700">
                      <input
                        type="radio"
                        value="Projeto"
                        checked={tipo === "Projeto"}
                        onChange={() => setTipo("Projeto")}
                        className="text-blue-600"
                      />{" "}
                      Projeto
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700">
                      <input
                        type="radio"
                        value="Quiz"
                        checked={tipo === "Quiz"}
                        onChange={() => setTipo("Quiz")}
                        className="text-amber-500"
                      />{" "}
                      Quiz
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {tipo === "Quiz"
                      ? "Pergunta / Enunciado com Código"
                      : "Instruções"}
                  </label>
                  <textarea
                    rows={6}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Digite o enunciado..."
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  ></textarea>
                </div>
                {tipo === "Quiz" && (
                  <div className="bg-amber-50 p-4 rounded border border-amber-200 space-y-4">
                    {[
                      { label: "A", val: opcaoA, set: setOpcaoA },
                      { label: "B", val: opcaoB, set: setOpcaoB },
                      { label: "C", val: opcaoC, set: setOpcaoC },
                      { label: "D", val: opcaoD, set: setOpcaoD },
                    ].map((alt) => (
                      <div key={alt.label} className="flex flex-col gap-1">
                        <span className="font-bold text-xs text-slate-500 uppercase">
                          {alt.label})
                        </span>
                        <textarea
                          rows={2}
                          value={alt.val}
                          onChange={(e) => alt.set(e.target.value)}
                          className="w-full border border-amber-300 rounded p-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        />
                      </div>
                    ))}
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Resposta Correta
                      </label>
                      <select
                        value={respostaCorreta}
                        onChange={(e) => setRespostaCorreta(e.target.value)}
                        className="w-full border border-amber-300 rounded p-2 font-bold text-emerald-600 bg-white outline-none"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Data Limite (Prazo)
                    </label>
                    <input
                      type="date"
                      value={dataLimite}
                      onChange={(e) => setDataLimite(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      XP da Missão
                    </label>
                    <input
                      type="number"
                      value={xp}
                      onChange={(e) => setXp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-emerald-700 rounded p-2 font-bold outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Turma Alvo
                  </label>
                  <select
                    value={turmaAlvo}
                    onChange={(e) => setTurmaAlvo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 outline-none"
                  >
                    <option value="Todas">Todas as Turmas</option>
                    {turmasDisponiveis.map((turma) => (
                      <option key={turma} value={turma}>
                        {turma}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={salvando}
                  className={`w-full text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95 disabled:bg-slate-400 ${idEditando ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {salvando
                    ? "Processando..."
                    : idEditando
                      ? "Salvar Alterações"
                      : "Publicar Missão"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <MissoesList
              atividades={atividades}
              isLoading={isLoading}
              turmasDisponiveis={turmasDisponiveis}
              onEdit={preencherEdicao}
              onDelete={excluirAtividade}
              onViewEntregas={abrirModalEntregas}
              onViewRanking={() => {
                setModalRankingAberto(true);
                carregarRankingTutor("geral");
              }}
              onViewFrequencia={abrirRelatorioFrequencia}
              onNavigateAnalytics={() => router.push("/trilhatech/analytics")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
