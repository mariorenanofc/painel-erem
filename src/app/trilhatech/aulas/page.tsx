/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";

// --- INTERFACES ---
interface Atividade {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: number | string;
  turmaAlvo: string;
  tipo: string;
  opcaoA?: string;
  opcaoB?: string;
  opcaoC?: string;
  opcaoD?: string;
  respostaCorreta?: string;
}

interface Entrega {
  idEntrega: string;
  matricula: string;
  nomeAluno: string;
  resposta: string;
  status: string;
  xpGanho: number;
}

interface RegistroFrequencia {
  idCheckin: string;
  matricula: string;
  nomeAluno: string;
  data: string;
  hora: string;
  xpGanho: number;
}

interface AlunoRanking {
  matricula: string;
  nome: string;
  turma: string;
  nivel: number;
  xp: number;
  posicao?: number;
}

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

const fetcherAtividades = async (url: string) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "buscar_todas_atividades" }),
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
  const [link1Ano, setLink1Ano] = useState("");
  const [link2Ano, setLink2Ano] = useState("");
  const [salvandoZap, setSalvandoZap] = useState(false);

  // === ESTADOS DO RANKING DO TUTOR ===
  const [modalRankingAberto, setModalRankingAberto] = useState(false);
  const [dadosRanking, setDadosRanking] = useState<AlunoRanking[]>([]);
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
  const [carregandoFreq, setCarregandoFreq] = useState(false);
  const [diasComAula, setDiasComAula] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [alunosDiario, setAlunosDiario] = useState<any[]>([]);

  const [turmaDiario, setTurmaDiario] = useState("Turma 1 - 1º Ano");
  const [mesDiario, setMesDiario] = useState(String(new Date().getMonth() + 1));
  const [anoDiario, setAnoDiario] = useState(String(new Date().getFullYear()));
  const [modalJustificativaAberto, setModalJustificativaAberto] = useState<{
    matricula: string;
    nome: string;
    dia: number;
    idFalta?: string;
  } | null>(null);
  const [textoJustificativa, setTextoJustificativa] = useState("");

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

    // Busca a senha atual do backend ao carregar a página
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

    // Busca os aniversariantes do dia
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
      buscarSenhaAtual();
      buscarAniversariantes();
    }
  }, [nomeUsuario]);

  const abrirModalZap = async () => {
    setModalZapAberto(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "buscar_links_whatsapp" }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        setLink1Ano(data.link1Ano);
        setLink2Ano(data.link2Ano);
      }
    } catch {}
  };

  const salvarLinksZap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoZap(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "salvar_links_whatsapp",
          link1Ano,
          link2Ano,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("✅ Links salvos!");
        setModalZapAberto(false);
      }
    } catch {
      alert("Erro ao salvar.");
    } finally {
      setSalvandoZap(false);
    }
  };

  // --- FUNÇÕES DE RANKING ---
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

  const turmasRanking = useMemo(() => {
    const turmas = new Set(dadosRanking.map((a: AlunoRanking) => a.turma));
    return ["Todas", ...Array.from(turmas).sort()];
  }, [dadosRanking]);

  const rankingFiltrado = useMemo(() => {
    let lista = dadosRanking;
    if (filtroTurmaRanking !== "Todas")
      lista = dadosRanking.filter(
        (a: AlunoRanking) => a.turma === filtroTurmaRanking,
      );
    return lista.map((aluno, index) => ({ ...aluno, posicao: index + 1 }));
  }, [dadosRanking, filtroTurmaRanking]);

  const podio = rankingFiltrado.slice(0, 3);

  const exportarRankingCSV = () => {
    if (rankingFiltrado.length === 0)
      return alert("Nenhum dado para exportar.");
    const cabecalho = ["Posição", "Matrícula", "Nome", "Turma", "Nível", "XP"];
    const linhas = rankingFiltrado.map(
      (a) =>
        `${a.posicao},${a.matricula},"${a.nome}",${a.turma},${a.nivel},${a.xp}`,
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

  // Função para salvar a nova senha
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

  // --- FUNÇÕES DE MISSÕES ---
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
    setIdEditando(ativ.id);
    setTitulo(ativ.titulo);
    setDescricao(ativ.descricao);
    setDataLimite(ativ.dataLimite);
    setXp(String(ativ.xp));
    setTurmaAlvo(ativ.turmaAlvo);
    setTipo(ativ.tipo);
    setOpcaoA(ativ.opcaoA || "");
    setOpcaoB(ativ.opcaoB || "");
    setOpcaoC(ativ.opcaoC || "");
    setOpcaoD(ativ.opcaoD || "");
    setRespostaCorreta(ativ.respostaCorreta || "A");
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

  // --- FUNÇÕES DE CORREÇÃO (ENTREGAS) ---
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

  // --- FUNÇÕES DO DIÁRIO DE CLASSE (API) ---
  const buscarDiarioClasse = async (
    turma: string,
    mes: string,
    ano: string,
  ) => {
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

  const abrirRelatorioFrequencia = () => {
    setModalFreqAberto(true);
    buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
  };

  // Efeito para recarregar a tabela automaticamente quando o professor trocar de turma ou mês
  useEffect(() => {
    if (modalFreqAberto) {
      buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaDiario, mesDiario, anoDiario]);

  const salvarJustificativa = async () => {
    if (!modalJustificativaAberto || !textoJustificativa)
      return alert("Digite o motivo da falta.");

    // Monta a data no formato YYYY-MM-DD exigido pelo back-end
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
        // Recarrega a tabela para pintar o J de amarelo!
        buscarDiarioClasse(turmaDiario, mesDiario, anoDiario);
      } else {
        alert("⚠️ " + data.mensagem);
      }
    } catch {
      alert("Erro ao salvar justificativa.");
    }
  };

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-100"></div>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {/* ========================================== */}
      {/* MODAL TELA CHEIA: RANKING DO TUTOR         */}
      {/* ========================================== */}
      {modalRankingAberto && (
        <div className="fixed inset-0 bg-slate-100 z-50 overflow-y-auto font-sans flex flex-col">
          <div className="bg-blue-900 text-white p-4 sticky top-0 z-20 shadow-md">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <span>🏆</span> Painel de Relatórios e Rankings
                </h2>
                <p className="text-blue-300 text-xs">
                  Visão estratégica de pontuação da escola
                </p>
              </div>
              <button
                onClick={() => setModalRankingAberto(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto p-4 md:p-6 w-full flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto">
                {(["geral", "mensal", "semanal"] as const).map((tempo) => (
                  <button
                    key={tempo}
                    onClick={() => carregarRankingTutor(tempo)}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filtroTempoRanking === tempo ? "bg-amber-100 text-amber-700 shadow-sm border border-amber-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                  >
                    {tempo === "geral" ? "Histórico Total" : tempo}
                  </button>
                ))}
              </div>

              <div className="w-full md:w-auto flex items-center gap-3">
                <label className="text-sm font-bold text-slate-500 whitespace-nowrap">
                  Filtrar por Turma:
                </label>
                <select
                  value={filtroTurmaRanking}
                  onChange={(e) => setFiltroTurmaRanking(e.target.value)}
                  className="w-full md:w-64 bg-white border border-slate-300 text-slate-800 rounded-lg p-2 text-sm font-bold shadow-sm outline-none focus:border-amber-500"
                >
                  {turmasRanking.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={exportarRankingCSV}
                  title="Exportar CSV"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center"
                >
                  📥
                </button>
              </div>
            </div>

            {carregandoRanking ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500"></div>
              </div>
            ) : rankingFiltrado.length === 0 ? (
              <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
                <div className="text-6xl mb-4 opacity-50">📭</div>
                <h3 className="text-xl font-bold text-slate-700">
                  Nenhum aluno pontuou neste filtro.
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                {/* Pódio Vertical */}
                <div className="xl:col-span-1 bg-linear-to-b from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl text-white relative">
                  <h3 className="font-black text-lg mb-6 text-center text-slate-200 uppercase tracking-widest">
                    Pódio Atual
                  </h3>
                  <div className="flex justify-center items-end gap-2 h-56 mt-4">
                    {podio[1] && (
                      <div className="w-1/3 flex flex-col items-center">
                        <div className="bg-slate-300 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-slate-700 shadow-lg z-10 -mb-5 border-2 border-slate-400">
                          2
                        </div>
                        <div className="bg-slate-700/80 w-full h-28 rounded-t-lg border border-slate-600/50 flex flex-col items-center pt-6 px-1 text-center">
                          <p className="font-bold text-[10px] line-clamp-2">
                            {podio[1].nome}
                          </p>
                          <p className="text-blue-300 font-black mt-auto mb-2 text-xs">
                            {podio[1].xp} XP
                          </p>
                        </div>
                      </div>
                    )}
                    {podio[0] && (
                      <div className="w-1/3 flex flex-col items-center z-10">
                        <div className="text-3xl mb-1 filter drop-shadow-md animate-bounce">
                          👑
                        </div>
                        <div className="bg-amber-400 w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-amber-900 shadow-xl z-10 -mb-7 border-2 border-amber-200">
                          1
                        </div>
                        <div className="bg-blue-600 w-full h-40 rounded-t-lg shadow-2xl border border-blue-500 flex flex-col items-center pt-9 px-1 text-center">
                          <p className="font-bold text-xs line-clamp-2 text-white">
                            {podio[0].nome}
                          </p>
                          <p className="text-amber-300 font-black mt-auto mb-3 text-sm">
                            {podio[0].xp} XP
                          </p>
                        </div>
                      </div>
                    )}
                    {podio[2] && (
                      <div className="w-1/3 flex flex-col items-center">
                        <div className="bg-orange-400 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-orange-950 shadow-lg z-10 -mb-5 border-2 border-orange-300">
                          3
                        </div>
                        <div className="bg-slate-700/60 w-full h-24 rounded-t-lg border border-slate-600/30 flex flex-col items-center pt-6 px-1 text-center">
                          <p className="font-bold text-[10px] line-clamp-2 text-slate-300">
                            {podio[2].nome}
                          </p>
                          <p className="text-orange-300 font-black mt-auto mb-2 text-xs">
                            {podio[2].xp} XP
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabela Completa */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm">
                      Lista Geral
                    </h3>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                      {rankingFiltrado.length} Alunos
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr className="text-slate-500 text-xs uppercase">
                          <th className="p-3 font-bold border-b border-slate-200 text-center">
                            Pos
                          </th>
                          <th className="p-3 font-bold border-b border-slate-200">
                            Aluno
                          </th>
                          <th className="p-3 font-bold border-b border-slate-200">
                            Turma
                          </th>
                          <th className="p-3 font-bold border-b border-slate-200">
                            Nível
                          </th>
                          <th className="p-3 font-bold border-b border-slate-200 text-right">
                            XP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rankingFiltrado.map((aluno) => (
                          <tr
                            key={aluno.matricula}
                            className={`hover:bg-slate-50 ${aluno.posicao <= 3 ? "bg-amber-50/20" : ""}`}
                          >
                            <td className="p-3 text-center font-black text-slate-400">
                              {aluno.posicao}º
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">
                                {aluno.nome}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {aluno.matricula}
                              </p>
                            </td>
                            <td className="p-3 text-slate-600 text-xs">
                              {aluno.turma}
                            </td>
                            <td className="p-3">
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                                {aluno.nivel}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-black text-emerald-600 text-base">
                                {aluno.xp}
                              </span>{" "}
                              <span className="text-[10px] text-slate-400">
                                XP
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE JUSTIFICATIVA DE FALTA */}
      {modalJustificativaAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-1">
              Justificar Falta
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Aluno: <strong>{modalJustificativaAberto.nome}</strong> <br />{" "}
              Data da Falta:{" "}
              <strong>
                {String(modalJustificativaAberto.dia).padStart(2, "0")}/
                {String(mesDiario).padStart(2, "0")}
              </strong>
            </p>

            <textarea
              rows={4}
              value={textoJustificativa}
              onChange={(e) => setTextoJustificativa(e.target.value)}
              placeholder="Digite o motivo (ex: Atestado médico entregue)"
              className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 outline-none focus:border-amber-500 mb-4 resize-none"
            ></textarea>

            <div className="flex gap-2">
              <button
                onClick={() => setModalJustificativaAberto(null)}
                className="flex-1 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={salvarJustificativa}
                className="flex-1 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DO RELATÓRIO DE FREQUÊNCIA (NOVO)    */}
      {/* ========================================== */}
      {modalFreqAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-emerald-700 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span>📍</span> Diário de Classe Digital
              </h2>
              <button
                onClick={() => setModalFreqAberto(false)}
                className="text-3xl leading-none hover:text-emerald-200"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-3">
                <select
                  value={turmaDiario}
                  onChange={(e) => setTurmaDiario(e.target.value)}
                  className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
                  <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
                </select>
                <select
                  value={mesDiario}
                  onChange={(e) => setMesDiario(e.target.value)}
                  className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
                <select
                  value={anoDiario}
                  onChange={(e) => setAnoDiario(e.target.value)}
                  className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value={new Date().getFullYear()}>
                    {new Date().getFullYear()}
                  </option>
                  <option value={new Date().getFullYear() + 1}>
                    {new Date().getFullYear() + 1}
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>{" "}
                  Presente
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>{" "}
                  Falta
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>{" "}
                  Justificada
                </span>
              </div>
            </div>

            {/* MATRIZ DE FREQUÊNCIA (COM ROLAGEM HORIZONTAL E COLUNA CONGELADA) */}
            <div className="p-0 flex-1 overflow-auto relative">
              {carregandoFreq ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <span className="text-4xl animate-bounce mb-3">📅</span>
                  <p className="text-slate-600 font-bold">
                    Processando Diário de Classe...
                  </p>
                </div>
              ) : diasComAula.length === 0 ? (
                <p className="text-center text-slate-500 py-12">
                  Nenhuma aula registrada para esta turma neste mês.
                </p>
              ) : (
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                  <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 border-b border-r border-slate-200 sticky left-0 bg-slate-100 z-30 min-w-62">
                        Nome do Aluno
                      </th>
                      {diasComAula.map((dia) => (
                        <th
                          key={dia}
                          className="px-2 py-3 border-b border-slate-200 text-center min-w-15"
                          title={`Dia ${dia}`}
                        >
                          <div className="mx-auto text-slate-700 font-black">
                            Dia {dia}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {alunosDiario.map((aluno) => (
                      <tr
                        key={aluno.matricula}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-4 py-3 border-b border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10 font-bold text-slate-800">
                          <div className="truncate w-57">{aluno.nome}</div>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {aluno.matricula}
                          </span>
                        </td>

                        {diasComAula.map((dia) => {
                          const infoDia = aluno.frequencia[dia];
                          return (
                            <td
                              key={dia}
                              className="px-2 py-2 border-b border-slate-100 text-center border-r md:border-slate-50"
                            >
                              {infoDia?.status === "presente" && (
                                <div
                                  className="w-6 h-6 mx-auto bg-emerald-100 text-emerald-600 rounded flex items-center justify-center font-bold text-xs"
                                  title="Presente"
                                >
                                  P
                                </div>
                              )}
                              {infoDia?.status === "falta" && (
                                <div
                                  onClick={() =>
                                    setModalJustificativaAberto({
                                      matricula: aluno.matricula,
                                      nome: aluno.nome,
                                      dia: dia,
                                      idFalta: infoDia?.idFalta,
                                    })
                                  }
                                  className="w-6 h-6 mx-auto bg-red-100 text-red-600 rounded flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-red-200 hover:scale-110 transition-all shadow-sm"
                                  title="Falta - Clique para justificar"
                                >
                                  F
                                </div>
                              )}
                              {infoDia?.status === "justificada" && (
                                <div
                                  onClick={() =>
                                    setModalJustificativaAberto({
                                      matricula: aluno.matricula,
                                      nome: aluno.nome,
                                      dia: dia,
                                      idFalta: infoDia?.idFalta,
                                    })
                                  }
                                  className="w-6 h-6 mx-auto bg-amber-100 text-amber-600 rounded flex items-center justify-center font-bold text-xs cursor-help"
                                  title={`Justificada: ${infoDia?.justificativa || "Sem observação"} - Clique para editar`}
                                >
                                  J
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE ENTREGAS (MANTIDO INTACTO)        */}
      {/* ========================================== */}
      {missaoAberta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">
                📝 Entregas: {missaoAberta.titulo}
              </h2>
              <button
                onClick={() => setMissaoAberta(null)}
                className="text-3xl leading-none hover:text-slate-300"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">
                Alunos que enviaram: {entregas.length}
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                XP Máximo: {missaoAberta.xp}
              </span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {carregandoEntregas ? (
                <p className="text-center text-slate-500 py-8 animate-pulse">
                  Buscando cadernos...
                </p>
              ) : entregas.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Nenhum aluno enviou resposta ainda.
                </p>
              ) : (
                entregas.map((ent) => (
                  <div
                    key={ent.idEntrega}
                    className="border border-slate-200 rounded-lg bg-white p-4 flex flex-col md:flex-row gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`w-2 h-2 rounded-full ${ent.status === "Avaliado" ? "bg-emerald-500" : "bg-amber-400"}`}
                        ></span>
                        <h3 className="font-bold text-slate-800">
                          {ent.nomeAluno}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          ({ent.matricula})
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-700 text-sm break-all font-medium">
                        {missaoAberta.tipo === "Projeto" &&
                        ent.resposta.startsWith("http") ? (
                          <a
                            href={ent.resposta}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            🔗 Abrir Link do Projeto
                          </a>
                        ) : (
                          <p>
                            <span className="text-slate-400 text-xs uppercase block mb-1">
                              Resposta do Aluno:
                            </span>{" "}
                            {ent.resposta}
                          </p>
                        )}
                        {missaoAberta.tipo === "Quiz" && (
                          <p
                            className={`mt-2 text-xs font-bold ${ent.resposta === missaoAberta.respostaCorreta ? "text-emerald-600" : "text-red-500"}`}
                          >
                            Gabarito Oficial: {missaoAberta.respostaCorreta}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-48 border-l border-slate-100 pl-0 md:pl-6 flex flex-col justify-center gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Dar Nota (XP)
                      </label>
                      <input
                        type="number"
                        max={Number(missaoAberta.xp)}
                        value={notasTemp[ent.idEntrega] ?? 0}
                        onChange={(e) =>
                          setNotasTemp({
                            ...notasTemp,
                            [ent.idEntrega]: Number(e.target.value),
                          })
                        }
                        className="w-full border-2 border-emerald-200 focus:border-emerald-500 rounded p-2 text-center font-black text-emerald-700 outline-none"
                      />
                      <button
                        onClick={() => avaliarAluno(ent)}
                        className={`w-full py-2 rounded text-sm font-bold text-white transition-colors ${ent.status === "Avaliado" ? "bg-slate-400 hover:bg-slate-500" : "bg-emerald-600 hover:bg-emerald-700"}`}
                      >
                        {ent.status === "Avaliado" ? "Reavaliar" : "Avaliar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO WHATSAPP */}
      {modalZapAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 mb-4">
              <span>💬</span> Configurar Grupos
            </h2>
            <form onSubmit={salvarLinksZap} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Link do Grupo - Turma 1º Ano
                </label>
                <input
                  type="url"
                  value={link1Ano}
                  onChange={(e) => setLink1Ano(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full text-blue-950 border-slate-300 rounded p-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Link do Grupo - Turma 2º Ano
                </label>
                <input
                  type="url"
                  value={link2Ano}
                  onChange={(e) => setLink2Ano(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full text-blue-950 border-slate-300 rounded p-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalZapAberto(false)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoZap}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-bold shadow-md"
                >
                  {salvandoZap ? "Salvando..." : "Salvar Links"}
                </button>
              </div>
            </form>
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
            Gestão de Ensino
          </h2>
        </div>

        {/* ========================================== */}
        {/* LINKS E ATALHOS RÁPIDOS                    */}
        {/* ========================================== */}
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

        {/* ========================================== */}
        {/* AVISO DE ANIVERSARIANTES DO DIA            */}
        {/* ========================================== */}
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
            {/* NOVO: PAINEL DA SENHA DA LOUSA */}
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

            {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO DE MISSÕES */}
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {tipo === "Quiz" ? "Pergunta" : "Instruções"}
                  </label>
                  <textarea
                    rows={3}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 resize-none"
                  ></textarea>
                </div>
                {tipo === "Quiz" && (
                  <div className="bg-amber-50 p-4 rounded border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">A)</span>{" "}
                      <input
                        type="text"
                        value={opcaoA}
                        onChange={(e) => setOpcaoA(e.target.value)}
                        className="w-full border rounded p-1 text-sm text-slate-800"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">B)</span>{" "}
                      <input
                        type="text"
                        value={opcaoB}
                        onChange={(e) => setOpcaoB(e.target.value)}
                        className="w-full border rounded p-1 text-sm text-slate-800"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">C)</span>{" "}
                      <input
                        type="text"
                        value={opcaoC}
                        onChange={(e) => setOpcaoC(e.target.value)}
                        className="w-full border rounded p-1 text-sm text-slate-800"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">D)</span>{" "}
                      <input
                        type="text"
                        value={opcaoD}
                        onChange={(e) => setOpcaoD(e.target.value)}
                        className="w-full border rounded p-1 text-sm text-slate-800"
                      />
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Qual é a certa?
                      </label>
                      <select
                        value={respostaCorreta}
                        onChange={(e) => setRespostaCorreta(e.target.value)}
                        className="w-full border rounded p-1 font-bold text-emerald-600 bg-white"
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
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      XP
                    </label>
                    <input
                      type="number"
                      value={xp}
                      onChange={(e) => setXp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-emerald-700 rounded p-2 font-bold"
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2"
                  >
                    <option value="Todas">Todas as Turmas</option>
                    <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
                    <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={salvando}
                  className={`w-full text-white font-bold py-2.5 rounded transition-colors disabled:bg-slate-400 ${idEditando ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {salvando
                    ? "Salvando..."
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
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  📚 Missões Cadastradas
                </h3>
                <div className="flex gap-2">
                  {/* BOTÃO DO RANKING */}
                  <button
                    onClick={abrirRankingTutor}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2"
                  >
                    <span>🏆</span> Ver Ranking
                  </button>
                  {/* BOTÃO MÁGICO DA FREQUÊNCIA AQUI */}
                  <button
                    onClick={abrirRelatorioFrequencia}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2"
                  >
                    <span>📍</span> Ver Presenças
                  </button>
                </div>
              </div>
              <div className="p-5">
                {isLoading ? (
                  <p className="text-slate-500 text-center py-8 animate-pulse">
                    Carregando missões...
                  </p>
                ) : atividades.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Nenhuma missão cadastrada ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {atividades.map((ativ) => (
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
