/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";

interface RoletaSorteioModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmasDisponiveis: string[];
}

export default function RoletaSorteioModal({
  isOpen,
  onClose,
  turmasDisponiveis,
}: RoletaSorteioModalProps) {
  const { toast } = useToast();
  const [turmaSelecionada, setTurmaSelecionada] = useState(turmasDisponiveis[0] || "");
  const [sorteando, setSorteando] = useState(false);
  const [nomeAnimado, setNomeAnimado] = useState("?????");
  const [vencedor, setVencedor] = useState<{ nome: string; matricula: string; bilhete: string } | null>(null);

  // Efeito visual de roleta girando
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (sorteando) {
      const nomesFalsos = ["CARREGANDO...", "MISTURANDO BILHETES...", "GIRANDO A ROLETA...", "QUEM SERÁ?", "CRUZEM OS DEDOS!"];
      let i = 0;
      intervalo = setInterval(() => {
        setNomeAnimado(nomesFalsos[i % nomesFalsos.length]);
        i++;
      }, 150);
    }
    return () => clearInterval(intervalo);
  }, [sorteando]);

  const iniciarSorteio = async () => {
    if (!turmaSelecionada) return toast("Selecione uma turma primeiro!", "warning");
    
    setVencedor(null);
    setSorteando(true);

    const TOKEN_SEGURANCA = "TrilhaTech_Seguranca_Total_2026";

    try {
      // Pequeno delay artificial para dar emoção à roleta (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const data = await apiTutor.sortearRifa(turmaSelecionada, TOKEN_SEGURANCA);

      if (data.status === "sucesso" && data.ganhador) {
        setVencedor(data.ganhador);
        toast("Temos um vencedor!", "success", "Sorteio Realizado");
      } else {
        toast(data.mensagem || "Erro ao realizar o sorteio.", "error");
      }
    } catch (e) {
      toast("Falha na comunicação com o servidor.", "error");
    } finally {
      setSorteando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-6000 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Confetes no background se houver vencedor */}
        {vencedor && (
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTkxY2Z5d2hqaHlhYnlwM3J4cGpqYmY1eTVtYWpsdTV6bTVvYnM4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aCvd8Mvh7V9Cj4Q/giphy.gif')] bg-cover mix-blend-screen z-0"></div>
        )}

        <div className="p-8 relative z-10 text-center">
          <div className="text-6xl mb-4">🎰</div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-wider">
            Sorteio Trilha Tech
          </h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">
            Prémio: <span className="text-emerald-500">R$ 50,00</span>
          </p>

          {!vencedor && !sorteando && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 text-left uppercase">
                  Escolha a Turma para o Sorteio
                </label>
                <select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-lg font-bold outline-none focus:border-amber-500 transition-colors"
                >
                  {turmasDisponiveis.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={iniciarSorteio}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all text-lg uppercase"
                >
                  Girar Roleta!
                </button>
              </div>
            </div>
          )}

          {sorteando && (
            <div className="py-12 border-4 border-dashed border-amber-500 rounded-2xl bg-amber-50 dark:bg-amber-900/20">
              <div className="text-4xl animate-spin mb-4">🌀</div>
              <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-widest">
                {nomeAnimado}
              </h2>
            </div>
          )}

          {vencedor && !sorteando && (
            <div className="animate-in zoom-in duration-500">
              <div className="inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 text-xs font-black uppercase px-4 py-1.5 rounded-full mb-4">
                🎉 O Vencedor é... 🎉
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
                {vencedor.nome}
              </h2>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mt-6 inline-block text-left shadow-inner">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Matrícula: <span className="text-slate-800 dark:text-slate-200 font-mono">{vencedor.matricula}</span>
                </p>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Bilhete Sorteado: <span className="text-indigo-600 dark:text-indigo-400 font-black">{vencedor.bilhete}</span>
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all uppercase"
              >
                Concluir Sorteio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}