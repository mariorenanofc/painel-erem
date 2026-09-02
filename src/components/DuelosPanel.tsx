"use client";

import React, { useState, useEffect } from "react";
import DueloModal from "./DueloModal";

import { motion, AnimatePresence } from "framer-motion";

interface OnlinePlayer {
  matricula: string;
  nome: string;
  turma: string;
}

interface Duelo {
  id: string;
  status: string;
  desafiante: { matricula: string; nome: string };
  desafiado: { matricula: string; nome: string };
  vencedor?: string;
  [key: string]: unknown;
}

export default function DuelosPanel({ isOpen, onClose, onXpUpdate }: { isOpen: boolean; onClose: () => void; onXpUpdate?: () => void }) {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [duelos, setDuelos] = useState<Duelo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de Duelo
  const [dueloAtivo, setDueloAtivo] = useState<{ id: string, codigo: string, isDesafiante: boolean } | null>(null);

  const carregarDados = async () => {
    try {
      const usrStr = localStorage.getItem("alunoLogado");
      if (!usrStr) return;
      const { matricula } = JSON.parse(usrStr);

      // Ping e buscar online
      const resOnline = await fetch("/api/alunos/duelos/online", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula })
      });
      const dataOnline = await resOnline.json();
      if (dataOnline.online) setOnlinePlayers(dataOnline.online);

      // Buscar duelos
      const resDuelos = await fetch(`/api/alunos/duelos/listar?matricula=${matricula}`);
      const dataDuelos = await resDuelos.json();
      if (dataDuelos.duelos) setDuelos(dataDuelos.duelos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarDados();
      const interval = setInterval(carregarDados, 5000); // Ping a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleDesafiar = async (matricula: string, nome: string, turma: string) => {
    if (!confirm(`Deseja desafiar ${nome} por 50 XP?`)) return;
    try {
      const usrStr = localStorage.getItem("alunoLogado");
      if (!usrStr) throw new Error("Usuário não encontrado");
      const { matricula: matriculaMinha } = JSON.parse(usrStr);

      const res = await fetch("/api/alunos/duelos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula: matriculaMinha, desafiadoMatricula: matricula, desafiadoNome: nome, desafiadoTurma: turma })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao desafiar");
      
      setDueloAtivo({ id: data.idDuelo, codigo: data.codigoDesafio, isDesafiante: true });
      onXpUpdate?.();
    } catch (error: unknown) {
      const e = error as Error;
      alert(e.message);
    }
  };

  const handleAceitar = async (idDuelo: string) => {
    if (!confirm("Aceitar desafio por 50 XP?")) return;
    try {
      const usrStr = localStorage.getItem("alunoLogado");
      if (!usrStr) throw new Error("Usuário não encontrado");
      const { matricula: matriculaMinha } = JSON.parse(usrStr);

      const res = await fetch("/api/alunos/duelos/aceitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idDuelo, matricula: matriculaMinha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao aceitar");
      
      setDueloAtivo({ id: idDuelo, codigo: data.codigoDesafio, isDesafiante: false });
      onXpUpdate?.();
    } catch (error: unknown) {
      const e = error as Error;
      alert(e.message);
    }
  };

  const duelosPendentes = duelos.filter(d => d.status === "Aguardando Oponente");
  const historico = duelos.filter(d => ["Finalizado", "Cancelado", "Expirado_TempoEsgotado", "Expirado_ChallengerWO", "Expirado_ChallengedWO"].includes(d.status));

  const matriculaMinha = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("alunoLogado") || "{}").matricula : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                ⚔️ Arena 1v1
              </h2>
              <div className="flex items-center gap-4">
                <button onClick={carregarDados} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300">
                  Atualizar
                </button>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pb-4 pr-2">
        {/* Jogadores Online */}
        <div>
          <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Online Agora ({onlinePlayers.length})
          </h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? <p className="text-slate-500 text-sm">Carregando...</p> : 
             onlinePlayers.length === 0 ? <p className="text-slate-500 text-sm">Nenhum outro jogador online no momento.</p> :
             onlinePlayers.map(p => (
               <div key={p.matricula} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between">
                 <div>
                   <p className="font-bold text-slate-200">{p.nome}</p>
                   <p className="text-xs text-slate-400">Turma {p.turma}</p>
                 </div>
                 <button 
                   onClick={() => handleDesafiar(p.matricula, p.nome, p.turma)}
                   className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors"
                 >
                   Desafiar (50 XP)
                 </button>
               </div>
             ))
            }
          </div>
        </div>

        {/* Meus Duelos */}
        <div>
          <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            🔥 Desafios Pendentes
          </h3>
          <div className="flex flex-col gap-2 mb-6">
            {duelosPendentes.filter(d => d.desafiado.matricula === matriculaMinha).length === 0 && 
             <p className="text-slate-500 text-sm">Você não tem desafios recebidos pendentes.</p>}
            
            {duelosPendentes.filter(d => d.desafiado.matricula === matriculaMinha).map(d => (
              <div key={d.id} className="bg-amber-900/20 border border-amber-700/50 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-200">{d.desafiante.nome} te desafiou!</p>
                  <p className="text-xs text-amber-400/70">Valendo {((d.apostaXP as number) || 50) * 2} XP</p>
                </div>
                <button 
                  onClick={() => handleAceitar(d.id)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors"
                >
                  Aceitar (-50 XP)
                </button>
              </div>
            ))}

            {/* Desafios que EU enviei e estão aguardando */}
            {duelosPendentes.filter(d => d.desafiante.matricula === matriculaMinha).map(d => (
              <div key={d.id} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between opacity-70">
                <div>
                  <p className="font-bold text-slate-300">Aguardando {d.desafiado.nome}...</p>
                  <p className="text-xs text-slate-400">Você apostou {(d.apostaXP as number) || 50} XP</p>
                </div>
                <span className="text-xs font-bold text-amber-500">⏳ Pendente</span>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-400 mb-4">
            📜 Histórico de Hoje
          </h3>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {historico.length === 0 && <p className="text-slate-600 text-sm">Nenhum duelo finalizado hoje.</p>}
            {historico.map(d => {
              let resultadoTexto = "";
              let corTexto = "text-slate-400";
              
              if (d.status.includes("Expirado")) {
                 resultadoTexto = "Cancelado / W.O.";
                 corTexto = "text-red-400/80";
              } else if (d.vencedor === matriculaMinha) {
                 resultadoTexto = "👑 VITÓRIA (+100 XP)";
                 corTexto = "text-green-400 font-bold";
              } else if (d.vencedor === "Empate") {
                 resultadoTexto = "🤝 Empate (XP Devolvido)";
                 corTexto = "text-blue-400";
              } else {
                 resultadoTexto = "💀 DERROTA";
                 corTexto = "text-red-500 font-bold";
              }

              const adv = d.desafiante.matricula === matriculaMinha ? d.desafiado.nome : d.desafiante.nome;

              return (
                <div key={d.id} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center text-sm">
                  <span className="text-slate-300">vs {adv}</span>
                  <span className={corTexto}>{resultadoTexto}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dueloAtivo && (
        <DueloModal 
          idDuelo={dueloAtivo.id}
          codigoDesafio={dueloAtivo.codigo}
          isDesafiante={dueloAtivo.isDesafiante}
          onClose={() => { setDueloAtivo(null); carregarDados(); }}
          onSuccess={() => { setDueloAtivo(null); carregarDados(); onXpUpdate?.(); }}
        />
      )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
