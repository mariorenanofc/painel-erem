/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiTutor, apiGeral } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";

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
import FormularioMissaoModal from "@/src/components/FormularioMissaoModal";
import ImportadorLoteModal from "@/src/components/ImportadorLoteModal";
import FechamentoCicloModal from "@/src/components/FechamentoCicloModal";
import RoletaSorteioModal from "@/src/components/RoletaSorteioModal";

const fetcherAtividades = async () => {
  return await apiTutor.buscarTodasAtividades("Todas", "Todos");
};

export default function GestaoAulasPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [nomeUsuario] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioLogado") || ""
      : "",
  );
  const [montado, setMontado] = useState(false);

  const [turmasDisponiveis, setTurmasDisponiveis] = useState<string[]>([
    "Turma 1 - 1º Ano",
    "Turma 2 - 2º Ano",
  ]);
  const [nomeProjeto, setNomeProjeto] = useState("Trilha Tech");

  const [linksGerais, setLinksGerais] = useState({
    planilha: "https://docs.google.com/spreadsheets",
    classroom: "https://classroom.google.com/",
    matriz: "#",
    ajuda: "#",
    cronograma: "#",
  });

  const [modoReposicao, setModoReposicao] = useState(false);
  const [carregandoReposicao, setCarregandoReposicao] = useState(false);
  const [senhaLousa, setSenhaLousa] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Estados dos Modais
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [modalNovaMissaoAberto, setModalNovaMissaoAberto] = useState(false);
  const [modalImportadorAberto, setModalImportadorAberto] = useState(false);
  const [modalSyncAberto, setModalSyncAberto] = useState(false);

  // Estados do Formulário de Missão
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
  const [modulo, setModulo] = useState("Geral");
  const [gabarito, setGabarito] = useState("");
  const [gabaritoLiberado, setGabaritoLiberado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados de Entregas e Ranking
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
  const [modalSorteioAberto, setModalSorteioAberto] = useState(false);

  const [aniversariantes, setAniversariantes] = useState<
    { nome: string; turma: string }[]
  >([]);

  // Estados do Diário/Frequência
  const [modalFreqAberto, setModalFreqAberto] = useState(false);
  const [modalGodModeAberto, setModalGodModeAberto] = useState(false);
  const [abaDiario, setAbaDiario] = useState<"mensal" | "hoje">("mensal");
  const [carregandoFreq, setCarregandoFreq] = useState(false);
  const [diasComAula, setDiasComAula] = useState<number[]>([]);
  const [alunosDiario, setAlunosDiario] = useState<any[]>([]);

  // Estados da Sincronização AVA (Barra de Progresso)
  const [sincronizandoAVA, setSincronizandoAVA] = useState(false);
  const [filtroSyncTurma, setFiltroSyncTurma] = useState("Todas");
  const [filtroSyncModulo, setFiltroSyncModulo] = useState("Todos");
  const [progressoSync, setProgressoSync] = useState({
    progresso: 0,
    mensagem: "",
  });

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

  const { data, isLoading, mutate } = useSWR(
    nomeUsuario ? "atividades_tutor" : null,
    fetcherAtividades,
    { revalidateOnFocus: true },
  );

  const atividades: Atividade[] =
    data?.status === "sucesso" ? data.atividades : [];
  const modulosCadastrados: string[] =
    data?.status === "sucesso" ? data.modulosMatriz || [] : [];

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

  const executarImportacaoLote = async (
    atividadesMapeadas: any[],
    moduloSelecionado: string,
    turmaSelecionada: string,
  ) => {
    setSalvando(true);
    try {
      for (const ativ of atividadesMapeadas) {
        await apiTutor.salvarAtividade({
          idAtividadeEdit: null,
          titulo: ativ.titulo,
          descricao:
            "Acesse o Google Classroom para visualizar as instruções detalhadas desta atividade.",
          dataLimite: "",
          xp: ativ.xp.toString(),
          turmaAlvo: turmaSelecionada,
          tipo: ativ.tipo,
          opcaoA: "",
          opcaoB: "",
          opcaoC: "",
          opcaoD: "",
          respostaCorreta: "A",
          linkClassroom: "",
          statusPublicacao: "Rascunho",
          imagemUrl: "",
          modulo: moduloSelecionado,
          gabarito: "",
          gabaritoLiberado: false,
        });
      }
      toast(
        `Importação de ${atividadesMapeadas.length} rascunhos concluída com sucesso!`,
        "success",
      );
      setModalImportadorAberto(false);
      mutate();
    } catch (e) {
      toast("Houve um erro ao tentar importar algumas atividades.", "error");
    } finally {
      setSalvando(false);
    }
  };

  const toggleModoReposicao = async () => {
    setCarregandoReposicao(true);
    const novoStatus = !modoReposicao ? "LIGADO" : "DESLIGADO";
    try {
      const data = await apiTutor.toggleModoReposicao(novoStatus);
      if (data.status === "sucesso") setModoReposicao(!modoReposicao);
      else toast("Erro: " + data.mensagem, "error");
    } catch {
      toast("Erro de conexão.", "error");
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
    } catch {
      toast("Erro ao buscar o ranking.", "error");
    } finally {
      setCarregandoRanking(false);
    }
  };

  const exportarRankingCSV = () => {
    let lista = dadosRanking;
    if (filtroTurmaRanking !== "Todas")
      lista = dadosRanking.filter((a) => a.turma === filtroTurmaRanking);
    if (lista.length === 0)
      return toast("Nenhum dado para exportar.", "warning");
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
    if (!senhaLousa) return toast("Digite uma senha válida!", "warning");
    setSalvandoSenha(true);
    try {
      const data = await apiTutor.atualizarSenhaCheckin(senhaLousa);
      if (data.status === "sucesso") toast(data.mensagem, "success");
    } catch {
      toast("Erro ao salvar a senha.", "error");
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
    setGabarito("");
    setGabaritoLiberado(false);
    setModalNovaMissaoAberto(false);
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
    setModulo(String(ativ.modulo || "Geral"));
    setGabarito(String(ativ.gabarito || ""));
    setGabaritoLiberado((ativ as any).gabaritoLiberado || false);
    setModalNovaMissaoAberto(true);
  };

  const excluirAtividade = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir a missão ${id}?`)) return;
    try {
      await apiTutor.excluirAtividade(id);
      toast("Missão excluída!", "success");
      mutate();
    } catch {
      toast("Erro ao excluir.", "error");
    }
  };

  const salvarNovaAtividade = async (
    e: React.FormEvent | React.MouseEvent,
    statusAcao: string,
  ) => {
    e.preventDefault();
    if (!titulo || !descricao || !dataLimite || !xp)
      return toast("Preencha os campos obrigatórios!", "warning");
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
        modulo,
        gabarito,
        gabaritoLiberado,
      });
      toast("Atividade salva com sucesso!", "success");
      limparFormulario();
      mutate();
    } catch {
      toast("Erro ao salvar.", "error");
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
      toast("Erro ao buscar entregas.", "error");
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
        toast(data.mensagem, "success");
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
      toast("Erro ao avaliar.", "error");
    }
  };

  const buscarDiarioClasse = useCallback(
    async (turma: string, mes: string, ano: string) => {
      if (!turma) return;
      setCarregandoFreq(true);
      try {
        const data = await apiTutor.buscarDiarioClasse(turma, mes, ano);
        if (data.status === "sucesso") {
          setDiasComAula(data.diasComAula);
          setAlunosDiario(data.alunos);
        }
      } catch {
        toast("Erro.", "error");
      } finally {
        setCarregandoFreq(false);
      }
    },
    [toast],
  );

  const buscarFrequenciaHoje = useCallback(
    async (turma: string) => {
      if (!turma) return;
      setCarregandoFreqHoje(true);
      try {
        const data = await apiTutor.buscarFrequenciaHoje(turma);
        if (data.status === "sucesso") {
          setDadosFreqHoje(data.registros);
          setTotalAulasTurma(data.totalAulas);
        }
      } catch {
        toast("Erro.", "error");
      } finally {
        setCarregandoFreqHoje(false);
      }
    },
    [toast],
  );

  const abrirRelatorioFrequencia = () => {
    setModalFreqAberto(true);
    setAbaDiario("mensal");
    if (turmaDiario) {
      buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
      buscarFrequenciaHoje(turmaDiario);
    }
  };

  // 🔥 NOVA LÓGICA DE SINCRONIZAÇÃO BLINDADA 🔥
  const iniciarSincronizacaoAVA = async () => {
    // Tenta pegar a URL do .env. Se não tiver, impede o código de falhar em silêncio
    const URL_API = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

    if (!URL_API) {
      toast(
        "Link da API não configurado! Verifique o seu arquivo .env",
        "error",
      );
      return;
    }

    setModalSyncAberto(false);
    setSincronizandoAVA(true);
    setProgressoSync({
      progresso: 5,
      mensagem: "Iniciando processo no servidor...",
    });

    const TOKEN_SEGURANCA = "TrilhaTech_Seguranca_Total_2026";

    const intervalStatus = setInterval(async () => {
      try {
        const res = await fetch(URL_API, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "status_sync",
            token: TOKEN_SEGURANCA,
          }),
        });
        const data = await res.json();
        if (data && data.progresso > 0) {
          setProgressoSync(data);
        }
      } catch (e) {
        // Ignora erro de rede temporário no polling
      }
    }, 2500);

    try {
      const res = await fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "sincronizar_ava",
          token: TOKEN_SEGURANCA,
          filtroTurma: filtroSyncTurma,
          filtroModulo: filtroSyncModulo,
        }),
      });

      const data = await res.json();
      clearInterval(intervalStatus);

      if (data.status === "sucesso") {
        toast(data.mensagem, "sync", "Varredura Concluída!");
        mutate();
      } else {
        toast(data.mensagem, "error", "Falha na Sincronização");
      }
    } catch (err) {
      clearInterval(intervalStatus);
      toast(
        "O servidor demorou muito a responder. Verifique os dados.",
        "error",
        "Timeout",
      );
    } finally {
      setSincronizandoAVA(false);
    }
  };

  useEffect(() => {
    if (modalFreqAberto && turmaDiario)
      buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
  }, [turmaDiario, mesDiario, anoDiario, modalFreqAberto, buscarDiarioClasse]);

  useEffect(() => {
    if (modalFreqAberto && turmaDiario) buscarFrequenciaHoje(turmaDiario);
  }, [turmaDiario, modalFreqAberto, buscarFrequenciaHoje]);

  const salvarJustificativa = async () => {
    if (!modalJustificativaAberto || !textoJustificativa)
      return toast("Digite o motivo da falta.", "warning");
    const dataIso = `${anoDiario}-${String(mesDiario).padStart(2, "0")}-${String(modalJustificativaAberto.dia).padStart(2, "0")}`;
    try {
      const data = await apiTutor.justificarFalta(
        modalJustificativaAberto.matricula,
        dataIso,
        textoJustificativa,
        modalJustificativaAberto.idFalta,
      );
      if (data.status === "sucesso") {
        toast(data.mensagem, "success");
        setModalJustificativaAberto(null);
        setTextoJustificativa("");
        buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
      } else toast(data.mensagem, "warning");
    } catch {
      toast("Erro.", "error");
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
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300"></div>
    );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300">
      {/* ================= TODOS OS MODAIS AGRUPADOS NO TOPO DA ÁRVORE (BOA PRÁTICA REACT) ================= */}
      <ImportadorLoteModal
        isOpen={modalImportadorAberto}
        onClose={() => setModalImportadorAberto(false)}
        modulosCadastrados={modulosCadastrados}
        turmasDisponiveis={turmasDisponiveis}
        onImportar={executarImportacaoLote}
      />

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
          gabarito={gabarito}
          setGabarito={setGabarito}
          gabaritoLiberado={gabaritoLiberado}
          setGabaritoLiberado={setGabaritoLiberado}
          modulosCadastrados={modulosCadastrados}
          turmasDisponiveis={turmasDisponiveis}
          salvando={salvando}
          limparFormulario={limparFormulario}
          salvarNovaAtividade={salvarNovaAtividade}
        />
      )}

      {modalFechamentoAberto && (
        <FechamentoCicloModal
          isOpen={modalFechamentoAberto}
          onClose={() => setModalFechamentoAberto(false)}
          turmasDisponiveis={turmasDisponiveis}
        />
      )}

      {/* 🚀 MODAL 1: FILTRO DE SINCRONIZAÇÃO */}
      {modalSyncAberto && (
        <div className="fixed inset-0 z-5000 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800">
            <div className="text-5xl mb-4 text-center">⚙️</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 text-center">
              Filtro de Sincronização
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center leading-relaxed">
              Otimize a varredura do Classroom. Escolha quais turmas ou módulos
              deseja validar agora para evitar lentidão.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Filtrar por Turma Alvo
                </label>
                <select
                  value={filtroSyncTurma}
                  onChange={(e) => setFiltroSyncTurma(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Todas">👉 Todas as Turmas</option>
                  {turmasDisponiveis.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Filtrar por Módulo
                </label>
                <select
                  value={filtroSyncModulo}
                  onChange={(e) => setFiltroSyncModulo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Todos">👉 Todos os Módulos</option>
                  {modulosCadastrados.map((m, idx) => (
                    <option key={idx} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalSyncAberto(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={iniciarSincronizacaoAVA}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL 2: CARREGAMENTO DA SINCRONIZAÇÃO */}
      {sincronizandoAVA && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-indigo-500">
            <div className="text-6xl mb-4 animate-spin-slow">⚙️</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
              Sincronizando Classroom
            </h3>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-6 h-10 flex items-center justify-center">
              {progressoSync.mensagem || "Conectando ao banco de dados..."}
            </p>

            {/* BARRA DE PROGRESSO */}
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mb-3">
              <div
                className="h-full bg-indigo-500 transition-all duration-700 ease-out relative"
                style={{ width: `${progressoSync.progresso}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-slate-500 font-bold">
                {progressoSync.progresso}%
              </p>
              <p className="text-[10px] text-slate-400">
                Pode levar até 2 minutos
              </p>
            </div>
          </div>
        </div>
      )}

      <RoletaSorteioModal
        isOpen={modalSorteioAberto}
        onClose={() => setModalSorteioAberto(false)}
        turmasDisponiveis={turmasDisponiveis}
      />

      {/* ================= CORPO INSTITUCIONAL DA PÁGINA ================= */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 pt-6 relative z-10">
        <Header
          carregando={isLoading}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "/";
          }}
        />

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 mt-8 mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/trilhatech")}
              className="cursor-pointer text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              ← Voltar
            </motion.button>
            <div className="text-left">
              <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
                Portal do Tutor
                <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 dark:border-indigo-900/10 shadow-sm align-middle">
                  Aulas & Missões
                </span>
              </h2>
            </div>
          </div>

          {/* DASHBOARD SUPERIOR (SHORTCUTS) */}
          <div className="flex flex-wrap gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/trilhatech/configuracoes")}
              className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-905 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-fuchsia-500/35 dark:hover:border-fuchsia-500/35 hover:bg-fuchsia-500/5 dark:hover:bg-fuchsia-500/10 shadow-sm transition-all flex items-center gap-1.5"
            >
              ⚙️ Configs
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={iniciarSincronizacaoAVA}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-110 text-white font-black py-2.5 px-4.5 rounded-xl shadow-md shadow-blue-500/5 flex items-center gap-1.5 text-xs uppercase tracking-wider border-none"
            >
              <span>🔄</span> Sincronizar AVA
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalSorteioAberto(true)}
              className="cursor-pointer px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/5 flex items-center gap-1.5 border-none uppercase tracking-wider"
            >
              🎰 Sortear Rifa
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setModalRankingAberto(true);
                carregarRankingTutor("geral");
              }}
              className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-amber-500/35 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 shadow-sm transition-all flex items-center gap-1.5"
            >
              🏆 Ranking
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={abrirRelatorioFrequencia}
              className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-emerald-500/35 hover:bg-emerald-555/5 dark:hover:bg-emerald-500/10 shadow-sm transition-all flex items-center gap-1.5"
            >
              📍 Diário
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/trilhatech/analytics")}
              className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-indigo-500/35 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 shadow-sm transition-all flex items-center gap-1.5"
            >
              📈 Analytics
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/trilhatech/gabaritos")}
              className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-emerald-555/35 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 shadow-sm transition-all flex items-center gap-1.5"
            >
              📋 Gabaritos
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8">
        {/* BARRA DE LINKS EXTERNOS COMPACTA */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a
            href={linksGerais.planilha}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>📊</span> Planilha BD
          </a>
          <a
            href={linksGerais.classroom}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>🏫</span> AVA Classroom
          </a>
          <a
            href={linksGerais.matriz}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>📑</span> Matriz Curricular
          </a>
          <a
            href={linksGerais.cronograma}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>🗓️</span> Cronograma
          </a>
          <a
            href={linksGerais.ajuda}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>🆘</span> Ajuda
          </a>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* PAINEL LATERAL DE CONFIGURAÇÕES */}
          <div className="xl:col-span-1 space-y-4">
            {aniversariantes.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl shadow-sm transition-colors">
                <h3 className="font-black text-sm uppercase tracking-tight text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-2 transition-colors">
                  <span>🎂</span> Aniversariantes!
                </h3>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-500 transition-colors">
                  Parabéns:{" "}
                  <strong>
                    {aniversariantes.map((a) => `${a.nome}`).join(", ")}
                  </strong>
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <h3 className="font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 transition-colors">
                Configurações Rápidas
              </h3>

              <div className="mb-5 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold flex items-center gap-2 transition-colors ${modoReposicao ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    ⚙️ Modo Reposição
                  </span>
                  <button
                    onClick={toggleModoReposicao}
                    disabled={carregandoReposicao}
                    className={`cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${modoReposicao ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${modoReposicao ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight transition-colors">
                  Ignora o dia da semana para permitir check-ins atrasados.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-1.5 transition-colors">
                  <span>🔐</span> Senha da Lousa
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={senhaLousa}
                    onChange={(e) =>
                      setSenhaLousa(e.target.value.toUpperCase())
                    }
                    className="w-full font-mono font-black text-center border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-slate-800 dark:text-slate-100 uppercase text-sm focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-slate-50 dark:bg-slate-950 transition-colors"
                  />
                  <button
                    onClick={salvarNovaSenha}
                    disabled={salvandoSenha}
                    className="cursor-pointer bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold px-3 rounded-md transition-colors text-xs"
                  >
                    {salvandoSenha ? "..." : "OK"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <button
                  onClick={() => router.push("/trilhatech/configuracoes")}
                  className="cursor-pointer w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  <span>⚙️</span> Painel de Configurações
                </button>
                <button
                  onClick={() => setModalGodModeAberto(true)}
                  className="cursor-pointer w-full bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-slate-800 dark:border-slate-700"
                >
                  <span>⚡</span> God Mode
                </button>
                <button
                  onClick={() => setModalFechamentoAberto(true)}
                  className="cursor-pointer w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-black py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border border-amber-600 dark:border-amber-500 mt-2 uppercase tracking-wide"
                >
                  <span>🏆</span> Fechar Ranking
                </button>
              </div>
            </div>
          </div>

          {/* ÁREA PRINCIPAL: CENTRAL DE MISSÕES */}
          <div className="xl:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              {/* CABEÇALHO E AÇÕES PRIMÁRIAS */}
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 transition-colors">
                    Central de Missões
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                    Gira o conteúdo, prazos e os XP da turma.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setModalImportadorAberto(true)}
                    className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-base leading-none">⚡</span> Importar
                    Lote
                  </button>
                  <button
                    onClick={() => {
                      limparFormulario();
                      setModalNovaMissaoAberto(true);
                    }}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 justify-center"
                  >
                    <span className="text-lg leading-none">+</span> Nova Missão
                  </button>
                </div>
              </div>

              {/* LISTA COMPACTA */}
              <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 rounded-b-2xl min-h-125 transition-colors duration-300">
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
