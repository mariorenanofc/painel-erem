"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/src/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";

export default function AbaRifas() {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [bilhetes, setBilhetes] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState({ total: 0, ativos: 0, sorteados: 0 });
  const [busca, setBusca] = useState("");
  
  // Sorteio
  const [turmaSorteio, setTurmaSorteio] = useState("Todas as Turmas");
  const [sorteando, setSorteando] = useState(false);
  const [vencedor, setVencedor] = useState<{nome: string, matricula: string, bilhete: string} | null>(null);

  const TOKEN_SEGURANCA = "TrilhaTech_Seguranca_Total_2026"; // Mesma const do backend

  const carregarRifas = async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/tutor/rifas");
      const data = await res.json();
      if (data.status === "sucesso") {
        setBilhetes(data.bilhetes || []);
        setEstatisticas(data.estatisticas || { total: 0, ativos: 0, sorteados: 0 });
      } else {
        toast(data.mensagem || "Erro ao buscar rifas", "error", "Erro");
      }
    } catch (error) {
      toast("Erro de conexão", "error", "Erro");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRifas();
  }, []);

  const handleSortear = async () => {
    if (!confirm(`Confirma a realização de um sorteio para: ${turmaSorteio}?`)) return;
    
    setSorteando(true);
    setVencedor(null);
    
    // Pequeno delay pra dar aquele "suspense" no botão
    await new Promise(r => setTimeout(r, 1500));

    try {
      const res = await apiTutor.sortearRifa(turmaSorteio, TOKEN_SEGURANCA);
      if (res.status === "sucesso") {
        setVencedor(res.ganhador);
        toast(`O ganhador foi ${res.ganhador?.nome}!`, "success", "Temos um Vencedor!");
        carregarRifas(); // Atualiza a lista para marcar como sorteado
      } else {
        toast(res.mensagem || "Erro ao sortear", "warning", "Atenção");
      }
    } catch (error) {
      toast("Erro na conexão ao sortear", "error", "Erro");
    } finally {
      setSorteando(false);
    }
  };

  const bilhetesFiltrados = bilhetes.filter(b => {
    const termo = busca.toLowerCase();
    const nomeOk = String(b.nomeAluno || "").toLowerCase().includes(termo);
    const matOk = String(b.matricula || "").includes(termo);
    const idOk = String(b.id || "").toLowerCase().includes(termo);
    return nomeOk || matOk || idOk;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white font-display flex items-center gap-2">
            🎟️ Rifas e Sorteios
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Gerencie bilhetes vendidos e realize sorteios da Loteria Escolar.
          </p>
        </div>
        <button 
          onClick={carregarRifas}
          className="text-xs uppercase tracking-wider font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          🔄 Atualizar Dados
        </button>
      </div>

      {/* CARDS DE ESTATÍSTICAS (GLASSMORPHISM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-[1.5rem] p-6 border border-slate-200/60 dark:border-white/5 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1">Total de Bilhetes Gerados</p>
          <div className="text-4xl font-black text-slate-800 dark:text-white font-mono">{estatisticas.total}</div>
        </div>
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 backdrop-blur-md rounded-[1.5rem] p-6 border border-emerald-500/20 dark:border-emerald-500/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-500 mb-1">Bilhetes Ativos (No Pote)</p>
          <div className="text-4xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{estatisticas.ativos}</div>
        </div>
        <div className="bg-amber-500/10 dark:bg-amber-500/5 backdrop-blur-md rounded-[1.5rem] p-6 border border-amber-500/20 dark:border-amber-500/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-black text-amber-600 dark:text-amber-500 mb-1">Bilhetes Já Sorteados</p>
          <div className="text-4xl font-black text-amber-700 dark:text-amber-400 font-mono">{estatisticas.sorteados}</div>
        </div>
      </div>

      {/* ÁREA DE SORTEIO */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 p-8 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden text-center">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto">
          <span className="text-6xl mb-4">🎰</span>
          <h4 className="text-3xl font-black text-white font-display mb-2">Realizar Novo Sorteio</h4>
          <p className="text-indigo-200 text-sm font-medium mb-8">
            Selecione a abrangência do sorteio. O sistema escolherá, aleatoriamente, um dos bilhetes ATIVOS do pote selecionado.
          </p>

          <div className="w-full max-w-sm space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-indigo-300 uppercase mb-2 ml-2">Público Alvo (Pote)</label>
              <select 
                value={turmaSorteio}
                onChange={e => setTurmaSorteio(e.target.value)}
                className="w-full bg-black/40 border border-white/20 text-white p-4 rounded-2xl font-bold outline-none focus:border-fuchsia-500 transition-colors cursor-pointer appearance-none text-center"
              >
                <option value="Todas as Turmas" className="text-slate-800">Sorteio Global (Todas as Turmas)</option>
                <option value="Turma 1 - 1º Ano" className="text-slate-800">Turma 1 - 1º Ano</option>
                <option value="Turma 2 - 2º Ano" className="text-slate-800">Turma 2 - 2º Ano</option>
                <option value="Turma 3 - 3º Ano" className="text-slate-800">Turma 3 - 3º Ano</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSortear}
              disabled={sorteando}
              className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider text-white shadow-xl transition-all ${
                sorteando 
                ? "bg-slate-700 animate-pulse cursor-not-allowed"
                : "bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:brightness-110 shadow-fuchsia-500/25 cursor-pointer"
              }`}
            >
              {sorteando ? "Sorteando..." : "Sortear Agora!"}
            </motion.button>
          </div>
        </div>

        {/* MODAL / ANIMAÇÃO DE VENCEDOR */}
        <AnimatePresence>
          {vencedor && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="bg-gradient-to-b from-amber-500 to-orange-600 p-1 rounded-3xl w-full max-w-lg shadow-[0_0_100px_rgba(245,158,11,0.4)]">
                <div className="bg-slate-900 rounded-[1.4rem] p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-amber-500/20 blur-[50px] pointer-events-none" />
                  
                  <span className="text-7xl block mb-4 animate-bounce">🏆</span>
                  <h5 className="text-amber-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Temos um Ganhador!</h5>
                  
                  <div className="my-6 space-y-1">
                    <p className="text-3xl font-black text-white font-display">{vencedor.nome}</p>
                    <p className="text-slate-400 font-mono text-sm">Matrícula: {vencedor.matricula}</p>
                  </div>
                  
                  <div className="inline-block bg-white/5 border border-white/10 rounded-xl px-6 py-3 mb-8">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Bilhete Sorteado</p>
                    <p className="text-lg text-white font-mono font-black">{vencedor.bilhete}</p>
                  </div>
                  
                  <button 
                    onClick={() => setVencedor(null)}
                    className="block w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
                  >
                    Fechar e Voltar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LISTA DE BILHETES (HISTÓRICO) */}
      <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-white/5 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <h4 className="text-lg font-black text-slate-800 dark:text-white font-display">
            Registros da Rifa
          </h4>
          <input 
            type="text" 
            placeholder="Buscar por nome, matrícula ou bilhete..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full md:w-80 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm p-3.5 rounded-xl outline-none focus:border-indigo-500 font-medium transition-colors"
          />
        </div>

        <div className="overflow-x-auto">
          {carregando ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-black">ID Bilhete</th>
                  <th className="p-4 font-black">Data/Hora Compra</th>
                  <th className="p-4 font-black">Aluno (Matrícula)</th>
                  <th className="p-4 font-black">Turma</th>
                  <th className="p-4 font-black text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {bilhetesFiltrados.slice(0, 100).map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">{b.id}</td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {new Date(b.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px]" title={b.nomeAluno}>
                        {b.nomeAluno}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{b.matricula}</p>
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {b.turma}
                    </td>
                    <td className="p-4 text-center">
                      {b.status === "SORTEADO_GANHADOR" ? (
                        <span className="inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          🏆 Sorteado
                        </span>
                      ) : (
                        <span className="inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          Ativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {bilhetesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                      Nenhum bilhete encontrado.
                    </td>
                  </tr>
                )}
                {bilhetesFiltrados.length > 100 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      Mostrando os 100 mais recentes de {bilhetesFiltrados.length}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
