/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";
import { apiTutor, apiGeral } from "@/src/services/api";

// Imports dos Tipos e Componentes centralizados
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
import GodModeModal from "@/src/components/GodModeModal";
import FormularioMissaoModal from "@/src/components/FormularioMissaoModal"; // 🔥 O NOSSO NOVO COMPONENTE AQUI!

// SWR Fetcher super limpo usando a API
const fetcherAtividades = async () => {
  return await apiTutor.buscarTodasAtividades("Todas", "Todos");
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

  // === ESTADOS DO MODO REPOSIÇÃO E SENHA ===
  const [modoReposicao, setModoReposicao] = useState(false);
  const [carregandoReposicao, setCarregandoReposicao] = useState(false);
  const [senhaLousa, setSenhaLousa] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [modalZapAberto, setModalZapAberto] = useState(false);

  // === ESTADOS DO FORMULÁRIO (NOVA MISSÃO) ===
  const [modalNovaMissaoAberto, setModalNovaMissaoAberto] = useState(false);
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
  const [linkClassroom, setLinkClassroom] = useState("");
  const [statusPublicacao, setStatusPublicacao] = useState("Publicada");
  const [imagemUrl, setImagemUrl] = useState("");
  const [modulo, setModulo] = useState("Geral"); // 🔥 NOVO ESTADO DO MÓDULO AQUI
  const [salvando, setSalvando] = useState(false);

  // === ESTADOS DOS MODAIS ===
  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregandoEntregas, setCarregandoEntregas] = useState(false);
  const [notasTemp, setNotasTemp] = useState<Record<string, number>>({});

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
  const [modalGodModeAberto, setModalGodModeAberto] = useState(false);
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

  // SWR com cache local otimizado
  const { data, isLoading, mutate } = useSWR(
    nomeUsuario ? "atividades_tutor" : null,
    fetcherAtividades,
    { revalidateOnFocus: true },
  );

  const atividades: Atividade[] =
    data?.status === "sucesso" ? data.atividades : [];

  // ==========================================
  // INICIALIZAÇÃO DA PÁGINA (Limpa e Paralela)
  // ==========================================
  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) window.location.href = "/";

    const carregarDadosIniciais = async () => {
      try {
        const [resConf, resSenha, resNiver] = await Promise.all([
          apiGeral.buscarConfiguracoes(),
          apiTutor.buscarSenhaCheckin(),
          apiTutor.buscarAniversariantes(),
        ]);

        if (resConf.status === "sucesso") {
          if (resConf.configuracoes.turmas?.length > 0) {
            setTurmasDisponiveis(resConf.configuracoes.turmas);
            setTurmaDiario(resConf.configuracoes.turmas[0]);
          }
          setNomeProjeto(resConf.configuracoes.nomeProjeto || "Trilha Tech");
          setLinksGerais({
            planilha:
              resConf.configuracoes.linkPlanilha ||
              "https://docs.google.com/spreadsheets",
            classroom:
              resConf.configuracoes.linkClassroom ||
              "https://classroom.google.com/",
            matriz: resConf.configuracoes.linkMatriz || "#",
            ajuda: resConf.configuracoes.linkAjuda || "#",
            cronograma: resConf.configuracoes.linkCronograma || "#",
          });
          setModoReposicao(resConf.configuracoes.modoReposicao === "LIGADO");
        }

        if (resSenha.status === "sucesso") setSenhaLousa(resSenha.senha);
        if (resNiver.status === "sucesso")
          setAniversariantes(resNiver.aniversariantes);
      } catch (e) {
        console.error("Erro na inicialização", e);
      }
    };

    carregarDadosIniciais();
  }, [nomeUsuario]);

  // ==========================================
  // FUNÇÕES DE AÇÃO DA PÁGINA
  // ==========================================
  const toggleModoReposicao = async () => {
    setCarregandoReposicao(true);
    const novoStatus = !modoReposicao ? "LIGADO" : "DESLIGADO";
    try {
      const data = await apiTutor.toggleModoReposicao(novoStatus);
      if (data.status === "sucesso") setModoReposicao(!modoReposicao);
      else alert("Erro: " + data.mensagem);
    } catch {
      alert("Erro de conexão.");
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
      const data = await apiTutor.buscarRanking(tempo);
      if (data.status === "sucesso") setDadosRanking(data.ranking);
      else alert("Erro: " + data.mensagem);
    } catch {
      alert("Erro ao buscar o ranking.");
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
      const data = await apiTutor.atualizarSenhaCheckin(senhaLousa);
      if (data.status === "sucesso") alert("✅ " + data.mensagem);
    } catch {
      alert("Erro ao salvar a senha.");
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
    setLinkClassroom("");
    setStatusPublicacao("Publicada");
    setImagemUrl("");
    setModulo("Geral");
    setModalNovaMissaoAberto(false); // 🔥 LIMPANDO O MÓDULO
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
    setLinkClassroom(String(ativ.linkClassroom || ""));
    setStatusPublicacao(String(ativ.statusPublicacao || "Publicada"));
    setImagemUrl(String(ativ.imagemUrl || ""));
    setModulo(String(ativ.modulo || "Geral")); // 🔥 PREENCHENDO O MÓDULO
    setModalNovaMissaoAberto(true);
  };

  const excluirAtividade = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir a missão ${id}?`)) return;
    try {
      await apiTutor.excluirAtividade(id);
      mutate();
    } catch {
      alert("Erro ao excluir.");
    }
  };

  const salvarNovaAtividade = async (
    e: React.FormEvent | React.MouseEvent,
    statusAcao: string,
  ) => {
    e.preventDefault();
    if (!titulo || !descricao || !dataLimite || !xp)
      return alert("Preencha os campos obrigatórios!");
    setSalvando(true);
    try {
      await apiTutor.salvarAtividade({
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
        linkClassroom,
        statusPublicacao: statusAcao,
        imagemUrl,
        modulo, // 🔥 ENVIANDO O MÓDULO PARA O BANCO DE DADOS
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
      const data = await apiTutor.buscarEntregas(ativ.id);
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

  const avaliarAluno = async (
    entrega: Entrega,
    statusAvaliacao: "Avaliado" | "Devolvida",
    feedbackTutor: string = "",
  ) => {
    const nota =
      statusAvaliacao === "Devolvida" ? 0 : notasTemp[entrega.idEntrega] || 0;
    try {
      const data = await apiTutor.avaliarEntrega(
        entrega.idEntrega,
        entrega.matricula,
        nota,
        statusAvaliacao,
        feedbackTutor,
      );

      if (data.status === "sucesso") {
        alert("✅ " + data.mensagem);
        setEntregas(
          entregas.map((e) =>
            e.idEntrega === entrega.idEntrega
              ? {
                  ...e,
                  status: statusAvaliacao,
                  xpGanho: nota,
                  feedback: feedbackTutor,
                }
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
      const data = await apiTutor.buscarDiarioClasse(turma, mes, ano);
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
      const data = await apiTutor.buscarFrequenciaHoje(turma);
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
      const data = await apiTutor.justificarFalta(
        modalJustificativaAberto.matricula,
        dataIso,
        textoJustificativa,
        modalJustificativaAberto.idFalta,
      );
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
    return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-24">
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

      {modalGodModeAberto && (
        <GodModeModal
          onClose={() => setModalGodModeAberto(false)}
          onSuccess={() => carregarRankingTutor("geral")}
        />
      )}

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
                className="cursor-pointer px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded font-bold text-slate-700 transition-colors"
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 O NOSSO NOVO COMPONENTE SUBSTITUI AS 150 LINHAS DE CÓDIGO AQUI! */}
      {modalNovaMissaoAberto && (
        <FormularioMissaoModal
          idEditando={idEditando}
          titulo={titulo}
          setTitulo={setTitulo}
          descricao={descricao}
          setDescricao={setDescricao}
          dataLimite={dataLimite}
          setDataLimite={setDataLimite}
          xp={xp}
          setXp={setXp}
          turmaAlvo={turmaAlvo}
          setTurmaAlvo={setTurmaAlvo}
          tipo={tipo}
          setTipo={setTipo}
          opcaoA={opcaoA}
          setOpcaoA={setOpcaoA}
          opcaoB={opcaoB}
          setOpcaoB={setOpcaoB}
          opcaoC={opcaoC}
          setOpcaoC={setOpcaoC}
          opcaoD={opcaoD}
          setOpcaoD={setOpcaoD}
          respostaCorreta={respostaCorreta}
          setRespostaCorreta={setRespostaCorreta}
          linkClassroom={linkClassroom}
          setLinkClassroom={setLinkClassroom}
          imagemUrl={imagemUrl}
          setImagemUrl={setImagemUrl}
          modulo={modulo}
          setModulo={setModulo}
          turmasDisponiveis={turmasDisponiveis}
          salvando={salvando}
          limparFormulario={limparFormulario}
          salvarNovaAtividade={salvarNovaAtividade}
        />
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

        <div className="flex items-center gap-4 mb-4 mt-6">
          <button
            onClick={() => router.push("/trilhatech")}
            className="text-slate-500 hover:text-slate-800 font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-black text-slate-800 border-l-4 border-blue-500 pl-3">
            Gestão: {nomeProjeto}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <a
            href={linksGerais.planilha}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>📊</span> Planilha (BD)
          </a>
          <a
            href={linksGerais.classroom}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>🏫</span> AVA (Classroom)
          </a>
          <a
            href={linksGerais.matriz}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>📑</span> Matriz Curricular
          </a>
          <a
            href={linksGerais.cronograma}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>🗓️</span> Cronograma
          </a>
          <a
            href={linksGerais.ajuda}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>🆘</span> Ajuda
          </a>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-4">
            {aniversariantes.length > 0 && (
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-300 p-4 rounded-2xl shadow-sm text-center">
                <div className="text-4xl animate-bounce mb-2">🎂</div>
                <h3 className="font-black text-sm uppercase tracking-tight text-amber-800">
                  Aniversariantes!
                </h3>
                <p className="text-xs font-medium text-amber-700 mt-1">
                  Parabéns para:{" "}
                  <strong>
                    {aniversariantes.map((a) => `${a.nome}`).join(", ")}
                  </strong>
                </p>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
                Controles da Aula
              </h3>
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-sm font-bold flex items-center gap-2 ${modoReposicao ? "text-indigo-600" : "text-slate-600"}`}
                  >
                    ⚙️ Modo Reposição
                  </span>
                  <button
                    onClick={toggleModoReposicao}
                    disabled={carregandoReposicao}
                    className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${modoReposicao ? "bg-indigo-600" : "bg-slate-300"} ${carregandoReposicao ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${modoReposicao ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Ignora o dia da semana para permitir check-ins atrasados.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2">
                  <span>🔐</span> Senha da Lousa
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={senhaLousa}
                    onChange={(e) =>
                      setSenhaLousa(e.target.value.toUpperCase())
                    }
                    placeholder="AULA01"
                    className="w-full font-mono font-black text-center border-2 border-slate-200 rounded-lg p-2 text-slate-800 uppercase focus:border-blue-500 outline-none bg-slate-50"
                  />
                  <button
                    onClick={salvarNovaSenha}
                    disabled={salvandoSenha}
                    className="cursor-pointer w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                  >
                    {salvandoSenha ? "..." : "Atualizar Senha"}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setModalZapAberto(true)}
              className="cursor-pointer w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold py-3 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 border border-emerald-200"
            >
              <span>💬</span> Configurar WhatsApp
            </button>

            <button
              onClick={() => setModalGodModeAberto(true)}
              className="cursor-pointer w-full bg-gradient-to-r text-black from-slate-900 to-purple-900 hover:from-black hover:to-indigo-950 text-transparent bg-clip-text bg-gradient-to-r text-sm font-black py-4 px-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 border-2 border-amber-400 hover:scale-105 active:scale-95 uppercase tracking-widest mt-4"
            >
              <span className="text-xl">⚡</span> God Mode
            </button>
          </div>

          <div className="xl:col-span-3">
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
              <button
                onClick={() => {
                  setModalRankingAberto(true);
                  carregarRankingTutor("geral");
                }}
                className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 md:p-5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-left flex flex-col items-start gap-2 group"
              >
                <div className="bg-white/20 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
                  🏆
                </div>
                <div>
                  <h3 className="text-white font-black text-sm md:text-base leading-tight">
                    Ranking Escolar
                  </h3>
                  <p className="text-amber-100 text-[10px] md:text-xs">
                    Ver Líderes e XP
                  </p>
                </div>
              </button>
              <button
                onClick={abrirRelatorioFrequencia}
                className="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 md:p-5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-left flex flex-col items-start gap-2 group"
              >
                <div className="bg-white/20 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
                  📍
                </div>
                <div>
                  <h3 className="text-white font-black text-sm md:text-base leading-tight">
                    Frequência
                  </h3>
                  <p className="text-emerald-100 text-[10px] md:text-xs">
                    Diário de Classe
                  </p>
                </div>
              </button>
              <button
                onClick={() => router.push("/trilhatech/analytics")}
                className="bg-gradient-to-br from-indigo-600 to-blue-600 p-4 md:p-5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-left flex flex-col items-start gap-2 group"
              >
                <div className="bg-white/20 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
                  📈
                </div>
                <div>
                  <h3 className="text-white font-black text-sm md:text-base leading-tight">
                    Analytics
                  </h3>
                  <p className="text-indigo-100 text-[10px] md:text-xs">
                    Radar e Relatórios
                  </p>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Missões Publicadas
                  </h2>
                  <p className="text-sm text-slate-500">
                    Gerencie as atividades, prazos e notas dos alunos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    limparFormulario();
                    setModalNovaMissaoAberto(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 w-full md:w-auto justify-center"
                >
                  <span className="text-lg leading-none">+</span> Criar Nova
                  Missão
                </button>
              </div>
              <div className="p-4 md:p-6 bg-slate-50/50 rounded-b-2xl">
                <MissoesList
                  atividades={atividades}
                  isLoading={isLoading}
                  turmasDisponiveis={turmasDisponiveis}
                  onEdit={preencherEdicao}
                  onDelete={excluirAtividade}
                  onViewEntregas={abrirModalEntregas}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
