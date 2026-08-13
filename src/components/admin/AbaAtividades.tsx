"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/src/contexts/ToastContext";
import { apiTutor } from "@/src/services/api";

type AtividadeAdmin = {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: number;
  turmaAlvo: string;
  tipo: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  respostaCorreta: string;
  linkClassroom: string;
  statusPublicacao: string;
  imagemUrl: string;
  modulo: string;
  gabarito: string;
  gabaritoLiberado: boolean;
  resolucaoTyping?: string;
  limiteTempoTyping?: number;
};

export default function AbaAtividades() {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [atividades, setAtividades] = useState<AtividadeAdmin[]>([]);
  
  // Filtros Avançados
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroGabarito, setFiltroGabarito] = useState("Todos");

  // Modal de Edição/Criação
  const [modalAberto, setModalAberto] = useState(false);
  const [atividadeEmEdicao, setAtividadeEmEdicao] = useState<AtividadeAdmin | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  const [sincronizandoId, setSincronizandoId] = useState<string | null>(null);

  const carregarAtividades = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await apiTutor.buscarAtividadesAdmin();
      if (data && Array.isArray(data.atividades)) {
        setAtividades(data.atividades);
      } else if (Array.isArray(data)) {
        setAtividades(data);
      } else {
        setAtividades([]);
        if (data && data.error) throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      toast("Falha ao carregar atividades. Tente novamente.", "error");
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  const sincronizarAtividadeUnica = async (ativ: AtividadeAdmin) => {
    if (!ativ.linkClassroom) {
      toast("Esta atividade não possui link do Classroom vinculado.", "warning");
      return;
    }
    setSincronizandoId(ativ.id);
    try {
      const res = await fetch("/api/tutor/sincronizar-ava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filtroTurma: ativ.turmaAlvo,
          filtroModulo: ativ.modulo,
          filtroAtividade: ativ.id
        })
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        toast(data.mensagem || "Atividade sincronizada!", "success");
      } else {
        toast(data.mensagem || "Falha ao sincronizar.", "error");
      }
    } catch (error) {
      toast("Erro de conexão ao sincronizar com o AVA.", "error");
    } finally {
      setSincronizandoId(null);
    }
  };

  useEffect(() => {
    carregarAtividades();
  }, [carregarAtividades]);

  // Listas para os selects (derivadas dos dados)
  const turmasUnicas = useMemo(() => {
    const ts = new Set(atividades.map((a) => a.turmaAlvo));
    return ["Todas", ...Array.from(ts).filter(t => t && t !== "Todas")].sort();
  }, [atividades]);

  const tiposUnicos = useMemo(() => {
    const tp = new Set(atividades.map((a) => a.tipo));
    return ["Todos", ...Array.from(tp).filter(t => t)].sort();
  }, [atividades]);

  const modulosUnicos = useMemo(() => {
    const ms = new Set(atividades.map((a) => a.modulo));
    return ["Todos", ...Array.from(ms).filter(t => t)].sort();
  }, [atividades]);

  const statusUnicos = useMemo(() => {
    const st = new Set(atividades.map((a) => a.statusPublicacao || "Rascunho"));
    return ["Todos", ...Array.from(st).filter(t => t)].sort();
  }, [atividades]);

  const atividadesFiltradas = useMemo(() => {
    let lista = atividades;
    if (filtroTurma !== "Todas") lista = lista.filter((a) => a.turmaAlvo === filtroTurma || a.turmaAlvo === "Todas");
    if (filtroTipo !== "Todos") lista = lista.filter((a) => a.tipo === filtroTipo);
    if (filtroModulo !== "Todos") lista = lista.filter((a) => a.modulo === filtroModulo);
    if (filtroStatus !== "Todos") lista = lista.filter((a) => (a.statusPublicacao || "Rascunho") === filtroStatus);
    
    if (filtroGabarito !== "Todos") {
      const wantLiberado = filtroGabarito === "Liberado";
      lista = lista.filter((a) => a.gabaritoLiberado === wantLiberado);
    }
    
    if (busca) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (a) =>
          a.titulo.toLowerCase().includes(t) ||
          a.id.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [atividades, busca, filtroTurma, filtroTipo, filtroModulo, filtroStatus, filtroGabarito]);

  // Resetar página quando os filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroTurma, filtroTipo, filtroModulo, filtroStatus, filtroGabarito, itensPorPagina]);

  const totalPaginas = Math.ceil(atividadesFiltradas.length / itensPorPagina);
  const atividadesPaginadas = atividadesFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const abrirNovaAtividade = () => {
    setAtividadeEmEdicao({
      id: "",
      titulo: "",
      descricao: "",
      dataLimite: "",
      xp: 10,
      turmaAlvo: "Todas",
      tipo: "Quiz",
      opcaoA: "",
      opcaoB: "",
      opcaoC: "",
      opcaoD: "",
      respostaCorreta: "A",
      linkClassroom: "",
      statusPublicacao: "Rascunho",
      imagemUrl: "",
      modulo: "Módulo 1",
      gabarito: "",
      gabaritoLiberado: false,
      resolucaoTyping: "",
      limiteTempoTyping: 0
    });
    setModalAberto(true);
  };

  const abrirEdicao = (ativ: AtividadeAdmin) => {
    setAtividadeEmEdicao({ 
      opcaoA: "",
      opcaoB: "",
      opcaoC: "",
      opcaoD: "",
      linkClassroom: "",
      imagemUrl: "",
      resolucaoTyping: "",
      ...ativ 
    });
    setModalAberto(true);
  };

  const salvarAtividade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atividadeEmEdicao) return;

    setSalvando(true);
    try {
      const res = await apiTutor.salvarAtividade({
        ...atividadeEmEdicao,
        idAtividadeEdit: atividadeEmEdicao.id // Para o backend saber se é edição ou novo
      });
      if (res.status === "sucesso") {
        toast("Atividade salva com sucesso!", "sucesso");
        setModalAberto(false);
        carregarAtividades();
      } else {
        toast(res.mensagem || "Erro ao salvar", "erro");
      }
    } catch (error) {
      console.error(error);
      toast("Erro de conexão ao salvar.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const excluirAtividade = async (id: string) => {
    if (!confirm(`Deseja realmente excluir a atividade ${id}?`)) return;
    try {
      const res = await apiTutor.excluirAtividade(id);
      if (res.status === "sucesso") {
        toast("Atividade excluída!", "sucesso");
        carregarAtividades();
      } else {
        toast(res.mensagem || "Erro ao excluir", "erro");
      }
    } catch (error) {
      console.error(error);
      toast("Erro de conexão ao excluir.", "erro");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white font-display flex items-center gap-2">
            📚 Atividades e Gabaritos
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
              {atividades.length}
            </span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Crie, gerencie prazos e modifique questões e recompensas das missões.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={carregarAtividades}
            disabled={carregando}
            className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {carregando ? "🔄 Atualizando..." : "🔄 Atualizar"}
          </button>
          <button
            onClick={abrirNovaAtividade}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>+</span> Nova Atividade
          </button>
        </div>
      </div>

      {/* TABELA DE ATIVIDADES COM FILTROS NA COLUNA */}
      {carregando && atividades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-sm font-medium text-slate-500">Buscando missões intergaláticas...</span>
        </div>
      ) : atividadesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
          <span className="text-slate-500 font-medium">Nenhuma atividade encontrada com os filtros atuais.</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80">
                <th className="p-3 border-b border-slate-200 dark:border-slate-700 min-w-[200px]">
                  <div className="mb-2 flex items-center gap-2">Atividade</div>
                  <input
                    type="text"
                    placeholder="🔍 Buscar Título/ID..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-white font-normal focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="mb-2">Turma & Módulo</div>
                  <div className="flex flex-col gap-1">
                    <select
                      value={filtroTurma}
                      onChange={(e) => setFiltroTurma(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-white font-normal focus:outline-none focus:border-blue-500"
                    >
                      {turmasUnicas.map(t => <option key={t} value={t}>{t === "Todas" ? "Turma: Todas" : t}</option>)}
                    </select>
                    <select
                      value={filtroModulo}
                      onChange={(e) => setFiltroModulo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-white font-normal focus:outline-none focus:border-blue-500"
                    >
                      {modulosUnicos.map(t => <option key={t} value={t}>{t === "Todos" ? "Módulo: Todos" : t}</option>)}
                    </select>
                  </div>
                </th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">
                  <div className="mb-2">Tipo / XP</div>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-white font-normal focus:outline-none focus:border-blue-500 text-center"
                  >
                    {tiposUnicos.map(t => <option key={t} value={t}>{t === "Todos" ? "Tipo: Todos" : t}</option>)}
                  </select>
                </th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">
                  <div className="mb-2">Status & Prazo</div>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-white font-normal focus:outline-none focus:border-blue-500 text-center"
                  >
                    {statusUnicos.map(t => <option key={t} value={t}>{t === "Todos" ? "Status: Todos" : t}</option>)}
                  </select>
                </th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">
                  <div className="mb-2">Gabarito</div>
                  <select
                    value={filtroGabarito}
                    onChange={(e) => setFiltroGabarito(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-white font-normal focus:outline-none focus:border-blue-500 text-center"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Liberado">Liberado</option>
                    <option value="Oculto">Oculto</option>
                  </select>
                </th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center w-[120px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {atividadesPaginadas.map((ativ) => (
                <tr key={ativ.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 dark:text-white max-w-[250px] truncate" title={ativ.titulo}>
                      {ativ.titulo}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{ativ.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-600 dark:text-slate-300 font-medium">{ativ.turmaAlvo}</div>
                    <div className="text-[10px] text-slate-400 max-w-[200px] truncate uppercase tracking-wider mt-0.5" title={ativ.modulo}>
                      {ativ.modulo}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-medium text-indigo-600 dark:text-indigo-400">{ativ.tipo}</div>
                    <div className="font-black text-amber-500 text-xs mt-0.5">{ativ.xp} XP</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-black rounded-full ${
                      ativ.statusPublicacao?.toLowerCase() === "publicada" 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {ativ.statusPublicacao || "Rascunho"}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">Vence: {ativ.dataLimite}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-black rounded-full ${
                      ativ.gabaritoLiberado
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {ativ.gabaritoLiberado ? "Liberado" : "Oculto"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {ativ.linkClassroom && (
                        <button 
                          onClick={() => sincronizarAtividadeUnica(ativ)}
                          disabled={sincronizandoId === ativ.id}
                          className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border border-emerald-100 dark:border-emerald-900/30 disabled:opacity-50 flex items-center"
                          title="Sincronizar Apenas Esta Atividade do Classroom"
                        >
                          {sincronizandoId === ativ.id ? "🔄..." : "🔄 Sync"}
                        </button>
                      )}
                      <button 
                        onClick={() => abrirEdicao(ativ)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border border-blue-100 dark:border-blue-900/30"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => excluirAtividade(ativ.id)}
                        title="Excluir"
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Controles de Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Mostrar:</span>
              <select 
                value={itensPorPagina} 
                onChange={e => setItensPorPagina(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>por página</span>
            </div>
            
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Página {paginaAtual} de {totalPaginas || 1} <span className="text-slate-400 font-normal">({atividadesFiltradas.length} resultados)</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual >= totalPaginas}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && atividadeEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="absolute inset-0" onClick={() => setModalAberto(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">

            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-black font-display text-slate-800 dark:text-white">
                {atividadeEmEdicao.id ? `Editar Atividade: ${atividadeEmEdicao.id}` : "Criar Nova Atividade"}
              </h2>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors p-2"
              >
                ✕
              </button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="form-atividade" onSubmit={salvarAtividade} className="space-y-8">
                
                {/* Seção 1: Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Título da Atividade</label>
                      <input 
                        required type="text"
                        value={atividadeEmEdicao.titulo}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, titulo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Descrição / Enunciado</label>
                      <textarea 
                        rows={3}
                        value={atividadeEmEdicao.descricao}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, descricao: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">XP Recompensa</label>
                      <input 
                        type="number" min="0" required
                        value={atividadeEmEdicao.xp}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, xp: Number(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-black text-amber-600 dark:text-amber-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Data Limite (DD/MM/AAAA)</label>
                      <input 
                        type="text" placeholder="Ex: 08/04/2026"
                        value={atividadeEmEdicao.dataLimite}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, dataLimite: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Módulo</label>
                      <input 
                        type="text"
                        value={atividadeEmEdicao.modulo}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, modulo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Turma Alvo</label>
                      <input 
                        type="text" placeholder="Ex: Todas, Turma 1 - 1º Ano"
                        value={atividadeEmEdicao.turmaAlvo}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, turmaAlvo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Questão / Respostas */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                    Formato e Gabarito
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Status:</label>
                      <select 
                        value={atividadeEmEdicao.statusPublicacao}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, statusPublicacao: e.target.value})}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="Publicada">Publicada</option>
                        <option value="Rascunho">Rascunho</option>
                      </select>
                    </div>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Tipo de Atividade</label>
                      <select 
                        value={atividadeEmEdicao.tipo}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, tipo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="Quiz">Quiz (Multipla Escolha)</option>
                        <option value="Projeto">Projeto (Link/Upload)</option>
                        <option value="Typing">Typing (Digitação)</option>
                        <option value="Code">Code (Programação)</option>
                        <option value="Teorica">Teórica (Leitura/Vídeo)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Resposta Correta</label>
                      <select 
                        value={atividadeEmEdicao.respostaCorreta}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, respostaCorreta: e.target.value})}
                        className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="A">Alternativa A</option>
                        <option value="B">Alternativa B</option>
                        <option value="C">Alternativa C</option>
                        <option value="D">Alternativa D</option>
                        <option value="ABERTA">Aberta / Projeto</option>
                      </select>
                    </div>

                    {atividadeEmEdicao.tipo === "Quiz" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Alternativa A</label>
                          <input type="text" value={atividadeEmEdicao.opcaoA} onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, opcaoA: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Alternativa B</label>
                          <input type="text" value={atividadeEmEdicao.opcaoB} onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, opcaoB: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Alternativa C</label>
                          <input type="text" value={atividadeEmEdicao.opcaoC} onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, opcaoC: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Alternativa D</label>
                          <input type="text" value={atividadeEmEdicao.opcaoD} onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, opcaoD: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                      </>
                    )}
                    
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Justificativa do Gabarito (Para mostrar após responder)</label>
                      <textarea 
                        rows={2}
                        value={atividadeEmEdicao.gabarito}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, gabarito: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    
                    {atividadeEmEdicao.tipo !== "Quiz" && atividadeEmEdicao.tipo !== "Teorica" && (
                      <div className="space-y-1.5 sm:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Link Template Base / CodePen (Opção A)</label>
                        <input 
                          type="text" 
                          value={atividadeEmEdicao.opcaoA || ""} 
                          onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, opcaoA: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                        />
                      </div>
                    )}
                    
                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">Liberar Gabarito?</span>
                        <span className="text-xs text-slate-500">Se ativo, os alunos verão a justificativa acima após enviarem a resposta.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isLiberado = String(atividadeEmEdicao.gabaritoLiberado) === "true";
                          setAtividadeEmEdicao({...atividadeEmEdicao, gabaritoLiberado: !isLiberado});
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          String(atividadeEmEdicao.gabaritoLiberado) === "true" ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                          String(atividadeEmEdicao.gabaritoLiberado) === "true" ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Outros */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    Avançado & Multimídia
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Link Classroom / AVA Secundário</label>
                      <input 
                        type="text"
                        value={atividadeEmEdicao.linkClassroom}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, linkClassroom: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">URL Imagem Capa</label>
                      <input 
                        type="text"
                        value={atividadeEmEdicao.imagemUrl}
                        onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, imagemUrl: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    
                    {atividadeEmEdicao.tipo === "Typing" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Resolução Esperada (Typing)</label>
                          <textarea 
                            rows={3}
                            value={atividadeEmEdicao.resolucaoTyping}
                            onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, resolucaoTyping: e.target.value})}
                            className="w-full font-mono bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Tempo Limite (segundos)</label>
                          <input 
                            type="number" min="0"
                            value={atividadeEmEdicao.limiteTempoTyping}
                            onChange={e => setAtividadeEmEdicao({...atividadeEmEdicao, limiteTempoTyping: Number(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/30">
              <button 
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="form-atividade"
                disabled={salvando}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "💾 Salvar Atividade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
