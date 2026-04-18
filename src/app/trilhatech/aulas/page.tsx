/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";

// Imports dos Tipos e Modais
import {
  Atividade,
  Entrega,
  AlunoRankingTutor,
  FrequenciaHoje,
} from "@/src/types";
import RankingTutorModal from "@/src/components/RankingTutorModal";
import CorrecaoMissoesModal from "@/src/components/CorrecaoMissoesModal";
import GestaoFrequenciaModal from "@/src/components/GestaoFrequenciaModal";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

const fetcherAtividades = async ([url, filtroTurma, filtroTipo]: string[]) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "buscar_todas_atividades",
      filtroTurma,
      filtroTipo,
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

  // === CONFIGURAÇÕES DINÂMICAS (WHITE-LABEL) ===
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<string[]>(["Turma 1 - 1º Ano", "Turma 2 - 2º Ano"]);
  const [nomeProjeto, setNomeProjeto] = useState("Trilha Tech");

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

  // === ESTADOS DO MODAL DE ENTREGAS ===
  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregandoEntregas, setCarregandoEntregas] = useState(false);
  const [notasTemp, setNotasTemp] = useState<Record<string, number>>({});

  // === ESTADOS DA SENHA DA LOUSA ===
  const [senhaLousa, setSenhaLousa] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // === ESTADOS DO WHATSAPP ===
  const [modalZapAberto, setModalZapAberto] = useState(false);

  // === ESTADOS DO RANKING DO TUTOR ===
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

  // === ESTADOS DO DIÁRIO DE CLASSE ===
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

  // === ESTADOS DA FREQUÊNCIA DE HOJE ===
  const [carregandoFreqHoje, setCarregandoFreqHoje] = useState(false);
  const [dadosFreqHoje, setDadosFreqHoje] = useState<FrequenciaHoje[]>([]);
  const [totalAulasTurma, setTotalAulasTurma] = useState(0);
  const [filtroStatusHoje, setFiltroStatusHoje] = useState<
    "Todos" | "Presentes" | "Faltantes"
  >("Todos");
  const [ordenacaoFreq, setOrdenacaoFreq] = useState<
    "alfabetica" | "mais_faltas"
  >("mais_faltas");

  // === ESTADOS DE FILTROS DO TUTOR ===
  const [filtroTurmaAtiv, setFiltroTurmaAtiv] = useState("Todas");
  const [filtroTipoAtiv, setFiltroTipoAtiv] = useState("Todos");
  const [buscaAtiv, setBuscaAtiv] = useState("");

  const { data, isLoading, mutate } = useSWR(
    nomeUsuario && GOOGLE_API_URL
      ? [GOOGLE_API_URL, filtroTurmaAtiv, filtroTipoAtiv]
      : null,
    fetcherAtividades,
    { revalidateOnFocus: true },
  );

  const atividades: Atividade[] =
    data?.status === "sucesso" ? data.atividades : [];
  const atividadesVisiveis = atividades.filter((ativ) =>
    ativ.titulo.toLowerCase().includes(buscaAtiv.toLowerCase()),
  );

  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) window.location.href = "/";

    // Busca Configurações da Planilha
    const buscarConfiguracoes = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "buscar_configuracoes" }),
        });
        const data = await res.json();
        if (data.status === "sucesso") {
          const turmasPlanilha = data.configuracoes.turmas;
          if (turmasPlanilha && turmasPlanilha.length > 0) {
            setTurmasDisponiveis(turmasPlanilha);
            setTurmaDiario(turmasPlanilha[0]); // Define a primeira turma como padrão
          }
          setNomeProjeto(data.configuracoes.nomeProjeto || "Trilha Tech");
        }
      } catch (e) {
        console.error("Erro ao buscar configurações");
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
      } catch (e) {
        console.error("Erro ao buscar senha");
      }
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
      } catch (e) {
        console.error("Erro ao buscar aniversariantes");
      }
    };

    if (GOOGLE_API_URL) {
      buscarConfiguracoes();
      buscarSenhaAtual();
      buscarAniversariantes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeUsuario, GOOGLE_API_URL]);

  const abrirModalZap = () => {
    setModalZapAberto(true);
  };

  const abrirRankingTutor = () => {
    setModalRankingAberto(true);
    carregarRankingTutor("geral");
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
      alert("Erro de conexão ao buscar ranking.");
    } finally {
      setCarregandoRanking(false);
    }
  };

  const exportarRankingCSV = () => {
    let lista = dadosRanking;
    if (filtroTurmaRanking !== "Todas")
      lista = dadosRanking.filter((a) => a.turma === filtroTurmaRanking);
    if (lista.length === 0) return alert("Nenhum dado para exportar.");
    const cabecalho = ["Posição", "Matrícula", "Nome", "Turma", "Nível", "XP"];
    const linhas = lista.map(
      (a, index) =>
        `${index + 1},${a.matricula},"${a.nome}",${a.turma},${a.nivel},${a.xp}`,
    );
    const csvContent = [cabecalho.join(","), ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ranking_${filtroTempoRanking}_${filtroTurmaRanking}.csv`;
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
      alert("Erro ao salvar senha.");
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
      alert("Erro ao buscar diário de classe.");
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
      alert("Erro ao buscar frequência de hoje.");
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
    if (modalFreqAberto && turmaDiario) buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaDiario, mesDiario, anoDiario]);

  useEffect(() => {
    if (modalFreqAberto && turmaDiario) buscarFrequenciaHoje(turmaDiario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaDiario]);

  const salvarJustificativa = async () => {
    if (!modalJustificativaAberto || !textoJustificativa)
      return alert("Digite o motivo da falta.");
    const diaFormatado = String(modalJustificativaAberto.dia).padStart(2, "0");
    const mesFormatado = String(mesDiario).padStart(2, "0");
    const dataIso = `${anoDiario}-${mesFormatado}-${diaFormatado}`;

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
      alert("Erro ao salvar justificativa.");
    }
  };

  const freqHojeFiltrada = useMemo(() => {
    let lista = [...dadosFreqHoje];
    if (filtroStatusHoje === "Presentes")
      lista = lista.filter((aluno) => aluno.presenteHoje === true);
    else if (filtroStatusHoje === "Faltantes")
      lista = lista.filter((aluno) => aluno.presenteHoje === false);

    if (ordenacaoFreq === "mais_faltas")
      lista.sort((a, b) => b.faltasTotais - a.faltasTotais);
    else lista.sort((a, b) => a.nome.localeCompare(b.nome));
    return lista;
  }, [dadosFreqHoje, filtroStatusHoje, ordenacaoFreq]);

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-100"></div>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {/* COMPONENTES DOS MODAIS ISOLADOS */}
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

      {/* MODAL CONFIGURAÇÃO WHATSAPP */}
      {modalZapAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 mb-4">
              <span>💬</span> Configurar Grupos
            </h2>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4 text-sm text-amber-800 font-medium">
              As configurações de WhatsApp agora devem ser alteradas diretamente na aba <strong>&quot;configuracoes&quot;</strong> da sua Planilha do Google!
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

      {/* DASHBOARD BASE */}
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

        <div
          onClick={() => router.push("/trilhatech/analytics")}
          className="cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all flex flex-col items-center text-center group mb-6"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
            📈
          </div>
          <h3 className="font-black text-xl text-slate-800 mb-2">
            Analytics & CRM
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Radar de risco, ficha 360º dos alunos e economia de XP da escola.
          </p>
          <div className="mt-6 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest group-hover:bg-indigo-100 transition-colors">
            Acessar Painel
          </div>
        </div>

        {/* LINKS RÁPIDOS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <a
            href="https://docs.google.com/spreadsheets/d/1himFlAIQbTyLiUnytkE5MsUiq9X47vdH3DaB59U9y-E/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">📊</span>
            <span className="text-xs font-bold leading-tight">
              Planilha do Sistema
            </span>
          </a>
          <a
            href="https://classroom.google.com/h"
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
            href="https://docs.google.com/spreadsheets/d/19h6QLT4ep2RvDI_OFsx2RUcNeEYiNYeVJPviL_n29ls/edit?gid=648128656#gid=648128656"
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
            href="https://www.appsheet.com/start/6c27b6a6-595d-464c-a39f-5401d677bf43?platform=desktop#appName=MyHelp-18004287-25-09-30&vss=H4sIAAAAAAAAA6WOvQ7CMAwGXwV5zhNkRQwIwULFQhhM40oWaVI1KVBFeXdcfgQrMPqz7nQZzkyXbcL6BHqf39eKRtCQDVRjRwa0gXnwqQ_OgDKwwfYxVuRwxp5rRvkUKAf1ciSKoPP3Cv1_hQK25BM3TP3km2jxPFl5T6QMnxwUBe2Q8OjoHi9cKbI1oR4i2Z0k_ZgSl35x7dDbdbCibdBFKjdmy_V5eQEAAA==&view=Tela%20inicial"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">🆘</span>
            <span className="text-xs font-bold leading-tight">MyHelp</span>
          </a>
          <a
            href="https://docs.google.com/spreadsheets/d/1l3B3xa9CKB1PK33WPqWSv_0OMzdooAo_PJBCj8skk08/edit?gid=81150299#gid=81150299"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-center shadow-sm"
          >
            <span className="text-2xl leading-none">🗓️</span>
            <span className="text-xs font-bold leading-tight">
              Cronograma 2026
            </span>
          </a>
        </div>

        {/* AVISO ANIVERSARIANTES */}
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
          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div className="lg:col-span-1 space-y-6">
            <button
              onClick={abrirModalZap}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2 border border-emerald-200"
            >
              <span>💬</span> Links WhatsApp
            </button>

            <div className="bg-amber-50 p-6 rounded-xl shadow-sm border border-amber-200">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-2">
                <span>🔐</span> Senha do Check-in
              </h3>
              <p className="text-xs text-amber-700 mb-4">
                Anote esta senha na lousa. Os alunos precisarão dela para
                garantir os 10 XP da presença hoje.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={senhaLousa}
                  onChange={(e) => setSenhaLousa(e.target.value.toUpperCase())}
                  placeholder="Ex: AULA01"
                  className="w-full font-mono font-black text-center border-2 border-amber-300 rounded p-2 text-slate-800 uppercase focus:border-amber-500 outline-none"
                />
                <button
                  onClick={salvarNovaSenha}
                  disabled={salvandoSenha}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 rounded disabled:bg-slate-400 transition-colors"
                >
                  {salvandoSenha ? "..." : "Salvar"}
                </button>
              </div>
            </div>

            {/* FORM DE MISSÃO */}
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
                    placeholder="Digite o enunciado. Se houver código, pode colar mantendo a indentação..."
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  ></textarea>
                </div>
                {tipo === "Quiz" && (
                  <div className="bg-amber-50 p-4 rounded border border-amber-200 space-y-4">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">
                      Alternativas (Suportam blocos de código)
                    </p>
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
                          rows={4}
                          value={alt.val}
                          onChange={(e) => alt.set(e.target.value)}
                          placeholder={`Código ou texto da alternativa ${alt.label}...`}
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
                      Data Limite
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

                  {/* SELECT DINÂMICO DE TURMAS DA PLANILHA */}
                  <select
                    value={turmaAlvo}
                    onChange={(e) => setTurmaAlvo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 outline-none"
                  >
                    <option value="Todas">Todas as Turmas</option>
                    {turmasDisponiveis.map(turma => (
                      <option key={turma} value={turma}>{turma}</option>
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

          {/* COLUNA DIREITA: LISTAGEM DAS MISSÕES */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">
                    📚 Missões Cadastradas
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={abrirRankingTutor}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2"
                    >
                      <span>🏆</span> Ver Ranking
                    </button>
                    <button
                      onClick={abrirRelatorioFrequencia}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2"
                    >
                      <span>📍</span> Frequência e Diário
                    </button>
                    <button
                      onClick={() => router.push("/trilhatech/analytics")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2"
                    >
                      <span>📈</span> Analytics & CRM
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    value={buscaAtiv}
                    onChange={(e) => setBuscaAtiv(e.target.value)}
                    className="flex-1 border text-slate-800 border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500"
                  />
                  
                  {/* SELECT DINÂMICO NO FILTRO DA LISTA */}
                  <select
                    value={filtroTurmaAtiv}
                    onChange={(e) => setFiltroTurmaAtiv(e.target.value)}
                    className="border text-slate-800 border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Todas">Todas as Turmas</option>
                    {turmasDisponiveis.map(turma => (
                      <option key={turma} value={turma}>{turma}</option>
                    ))}
                  </select>

                  <select
                    value={filtroTipoAtiv}
                    onChange={(e) => setFiltroTipoAtiv(e.target.value)}
                    className="border text-slate-800 border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Todos">Todos os Tipos</option>
                    <option value="Projeto">Projetos</option>
                    <option value="Quiz">Quizzes</option>
                  </select>
                </div>
              </div>
              <div className="p-5">
                {isLoading ? (
                  <p className="text-slate-500 text-center py-8 animate-pulse">
                    Carregando missões...
                  </p>
                ) : atividadesVisiveis.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Nenhuma missão encontrada para este filtro.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {atividadesVisiveis.map((ativ) => (
                      <div
                        key={ativ.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4 group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              {ativ.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ativ.tipo === "Quiz" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"} border`}
                            >
                              {ativ.tipo}
                            </span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                              ⭐ {ativ.xp} XP
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800">
                            {ativ.titulo}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                            {ativ.descricao}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between min-w-30 gap-2">
                          <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => preencherEdicao(ativ)}
                              className="p-2 text-slate-400 hover:text-amber-500 bg-white rounded shadow-sm border border-slate-200"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => excluirAtividade(ativ.id)}
                              className="p-2 text-slate-400 hover:text-red-500 bg-white rounded shadow-sm border border-slate-200"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                          <button
                            onClick={() => abrirModalEntregas(ativ)}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded shadow-md transition-all hover:-translate-y-0.5"
                          >
                            Ver Entregas
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}