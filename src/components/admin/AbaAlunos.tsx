"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/src/contexts/ToastContext";
import { apiTutor } from "@/src/services/api";

type AlunoAdmin = {
  matricula: string;
  nome: string;
  turma: string;
  statusTrilha: string;
  xp: number;
  xpGasto: number;
  senha?: string;
};

export default function AbaAlunos() {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [alunos, setAlunos] = useState<AlunoAdmin[]>([]);
  const [busca, setBusca] = useState("");
  
  // Modal de XP
  const [modalXpAberto, setModalXpAberto] = useState(false);
  const [alunoSelecionadoXp, setAlunoSelecionadoXp] = useState<AlunoAdmin | null>(null);
  const [quantidadeXp, setQuantidadeXp] = useState<number>(0);
  const [motivoXp, setMotivoXp] = useState("");
  const [enviandoXp, setEnviandoXp] = useState(false);
  const [filtroTurma, setFiltroTurma] = useState("Todas");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const carregarAlunos = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await apiTutor.buscarAlunosAdmin();
      if (res.status === "sucesso") {
        setAlunos(res.alunos || []);
      } else {
        toast("Erro ao carregar alunos", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Falha na conexão ao buscar alunos", "error");
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    carregarAlunos();
  }, [carregarAlunos]);

  // Extrair turmas únicas para o filtro
  const turmasUnicas = useMemo(() => Array.from(new Set(alunos.map(a => a.turma).filter(Boolean))).sort(), [alunos]);

  const alunosFiltrados = useMemo(() => {
    return alunos.filter(a => {
      const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         a.matricula.includes(busca) ||
                         a.turma.toLowerCase().includes(busca.toLowerCase());
      
      const matchTurma = filtroTurma === "Todas" || a.turma === filtroTurma;
      const matchStatus = filtroStatus === "Todos" || 
                          (filtroStatus === "Ativo" && (a.statusTrilha === "ativo" || a.statusTrilha === "Ativo")) ||
                          (filtroStatus === "Inativo" && (a.statusTrilha !== "ativo" && a.statusTrilha !== "Ativo"));

      return matchBusca && matchTurma && matchStatus;
    });
  }, [alunos, busca, filtroTurma, filtroStatus]);

  const alternarStatus = async (matricula: string, statusAtual: string) => {
    const novoStatus = statusAtual.toLowerCase() === "ativo" ? "Inativo" : "Ativo";
    if (!confirm(`Deseja alterar o status do aluno(a) para ${novoStatus}?`)) return;

    try {
      // Atualizar otimista na tela
      setAlunos(prev => prev.map(a => a.matricula === matricula ? { ...a, statusTrilha: novoStatus } : a));
      
      const res = await apiTutor.mudarStatusTrilhaTech(matricula, novoStatus);
      if (res.status === "sucesso") {
        toast(`Status alterado para ${novoStatus}!`, "success");
      } else {
        toast(res.mensagem || "Erro ao alterar status", "error");
        carregarAlunos(); // reverte em caso de erro
      }
    } catch (e) {
      console.error(e);
      toast("Erro de conexão", "error");
      carregarAlunos();
    }
  };

  const abrirModalXp = (aluno: AlunoAdmin) => {
    setAlunoSelecionadoXp(aluno);
    setQuantidadeXp(100);
    setMotivoXp("");
    setModalXpAberto(true);
  };

  const salvarXpManual = async () => {
    if (!alunoSelecionadoXp || !motivoXp.trim() || quantidadeXp === 0) {
      toast("Preencha o motivo e uma quantidade válida de XP", "warning");
      return;
    }

    setEnviandoXp(true);
    try {
      const res = await apiTutor.injetarXP(alunoSelecionadoXp.matricula, quantidadeXp, motivoXp);
      if (res.status === "sucesso") {
        toast(`${quantidadeXp > 0 ? '+' : ''}${quantidadeXp} XP para ${alunoSelecionadoXp.nome}!`, "success");
        setModalXpAberto(false);
        carregarAlunos(); // Recarrega para pegar novo saldo
      } else {
        toast(res.mensagem || "Erro ao injetar XP", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Falha na conexão ao salvar XP", "error");
    } finally {
      setEnviandoXp(false);
    }
  };

  const sincronizarPlanilha = async () => {
    if (!confirm("Deseja sincronizar a lista de alunos com a Planilha do Google agora? Isso puxará os nomes novos.")) return;
    
    setCarregando(true);
    try {
      const res = await apiTutor.sincronizarAlunos();
      if (res.status === "sucesso") {
        toast("Alunos sincronizados com sucesso!", "success");
        await carregarAlunos();
      } else {
        toast(res.mensagem || "Erro ao sincronizar", "error");
        setCarregando(false);
      }
    } catch (e) {
      console.error(e);
      toast("Erro de conexão ao sincronizar", "error");
      setCarregando(false);
    }
  };

  const redefinirSenha = async (matricula: string, nome: string) => {
    const novaSenha = window.prompt(`Redefinir PIN PIX para ${nome}\n(Digite a nova senha de 4 a 6 números ou deixe em branco para apagar):`);
    
    if (novaSenha === null) return; // Cancelou
    
    if (novaSenha && !/^\d+$/.test(novaSenha)) {
      toast("A senha deve conter apenas números!", "error");
      return;
    }

    try {
      const res = await apiTutor.atualizarSenhaAluno(matricula, novaSenha.trim());
      if (res.status === "sucesso") {
        toast(novaSenha ? "Senha atualizada!" : "Senha apagada com sucesso!", "success");
        await carregarAlunos();
      } else {
        toast(res.mensagem || "Erro ao atualizar senha", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Erro de conexão", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white font-display">
            👥 Gestão de Alunos ({alunosFiltrados.length})
          </h3>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={sincronizarPlanilha} className="text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors">
              ☁️ Importar Planilha
            </button>
            <button onClick={carregarAlunos} className="text-xs font-bold bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg">
              🔄 Atualizar
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 w-full bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60">
          <input 
            type="text" 
            placeholder="Buscar nome, mat, turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 md:flex-[2] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium outline-none"
          />
          <select 
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium outline-none text-slate-700 dark:text-slate-200"
          >
            <option value="Todas">Todas as Turmas</option>
            {turmasUnicas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select 
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium outline-none text-slate-700 dark:text-slate-200"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Apenas Ativos</option>
            <option value="Inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-slate-200 dark:border-slate-800">Aluno(a)</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800">Turma</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">Status</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-right">XP Atual</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">PIN Pix</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {alunosFiltrados.map((aluno) => (
                <tr key={aluno.matricula} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 dark:text-white max-w-[200px] truncate" title={aluno.nome}>{aluno.nome}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{aluno.matricula}</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{aluno.turma || "-"}</td>
                  <td className="p-4 text-center">
                    <span 
                      className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-black rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                        aluno.statusTrilha?.toLowerCase() === "ativo" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}
                      onClick={() => alternarStatus(aluno.matricula, aluno.statusTrilha)}
                    >
                      {aluno.statusTrilha || "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-black text-amber-500">{aluno.xp} XP</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Gasto: {aluno.xpGasto}</div>
                  </td>
                  <td className="p-4 text-center font-mono text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => redefinirSenha(aluno.matricula, aluno.nome)}>
                      <span>{aluno.senha || "vazio"}</span>
                      <button className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ✏️
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => abrirModalXp(aluno)}
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border border-indigo-100 dark:border-indigo-900/30"
                    >
                      ⚡ +/- XP
                    </button>
                  </td>
                </tr>
              ))}
              {alunosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">Nenhum aluno encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL INJETAR XP */}
      {modalXpAberto && alunoSelecionadoXp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <h3 className="text-xl font-display font-black text-slate-800 dark:text-white mb-2">
              Injetar/Remover XP
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Alterando XP para <span className="font-bold text-slate-700 dark:text-slate-300">{alunoSelecionadoXp.nome}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantidade (use - para remover)</label>
                <input 
                  type="number" 
                  value={quantidadeXp} 
                  onChange={(e) => setQuantidadeXp(Number(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo / Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Punição, Bonificação extra..."
                  value={motivoXp} 
                  onChange={(e) => setMotivoXp(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setModalXpAberto(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarXpManual}
                disabled={enviandoXp}
                className="flex-1 bg-indigo-600 text-white font-black uppercase tracking-wider text-xs py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {enviandoXp ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
