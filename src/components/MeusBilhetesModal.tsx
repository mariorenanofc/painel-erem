/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { apiAluno } from "@/src/services/api";

interface MeusBilhetesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricula: string;
}

interface Bilhete {
  id: string;
  data: string;
  status: string;
  ciclo: string;
}

export default function MeusBilhetesModal({ isOpen, onClose, matricula }: MeusBilhetesModalProps) {
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [loading, setLoading] = useState(true);
  const [bilheteSelecionado, setBilheteSelecionado] = useState<Bilhete | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiAluno.buscarMeusBilhetes(matricula).then((data) => {
        if (data.status === "sucesso") setBilhetes(data.bilhetes);
        setLoading(false);
      });
    } else {
      setBilheteSelecionado(null);
    }
  }, [isOpen, matricula]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-6000 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Efeito de decoração no fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

        {/* TELA DE DETALHES */}
        {bilheteSelecionado ? (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setBilheteSelecionado(null)} className="text-indigo-500 font-black mb-6 hover:underline cursor-pointer">← Voltar</button>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center relative shadow-inner">
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Bilhete Único</div>
              <h2 className="text-5xl font-black text-slate-800 dark:text-white font-mono mb-6">{bilheteSelecionado.id.split('-').pop()}</h2>
              
              <div className="space-y-4 text-left border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Status</span> <span className={`font-black ${bilheteSelecionado.status === "ATIVO" ? "text-emerald-500" : "text-amber-500"}`}>{bilheteSelecionado.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Data da Compra</span> <span className="font-bold text-slate-700 dark:text-slate-200">{bilheteSelecionado.data}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">ID Transação</span> <span className="text-xs font-mono text-slate-400">{bilheteSelecionado.id}</span></div>
              </div>

              <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                🎫 Este bilhete está a concorrer ao prémio de R$ 50,00!
              </div>
            </div>
          </div>
        ) : (
          /* GRID DE LISTAGEM */
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white">Meus Bilhetes</h2>
              <p className="text-slate-500 font-medium">Toque num ticket para ver detalhes</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-20 font-black text-slate-400 animate-pulse">Carregando...</div>
              ) : bilhetes.length === 0 ? (
                <div className="text-center py-20 font-bold text-slate-400">Nenhum bilhete ainda. Vá à Loja!</div>
              ) : (
                <div className="m-4 grid grid-cols-6 gap-4">
                  {bilhetes.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBilheteSelecionado(b)}
                      className={`group relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all hover:scale-105 active:scale-5 cursor-pointer ${
                        b.status === "ATIVO" 
                          ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600" 
                          : "border-slate-300 bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="text-sm font-black uppercase opacity-60">Nº</span>
                      {/* 🔥 AQUI ESTÁ O AJUSTE: Número + 1 */}
                      <span className="text-sm font-black font-mono">
                         {Number(b.id.split("-").pop()) + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={onClose} 
            className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}