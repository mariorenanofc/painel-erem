"use client";

import { useState } from "react";
import { apiAluno } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";

interface LojaRifaModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricula: string;
  saldoCarteira: number;
  onCompraSucesso: () => void;
}

export default function LojaRifaModal({
  isOpen,
  onClose,
  matricula,
  saldoCarteira,
  onCompraSucesso,
}: LojaRifaModalProps) {
  const { toast } = useToast();
  const [pacoteSelecionado, setPacoteSelecionado] = useState<string | null>(null);
  const [contratoAceite, setContratoAceite] = useState(false);
  const [comprando, setComprando] = useState(false);

  const limiteGasto = saldoCarteira * 0.60;

  const pacotes = [
    { id: "BRONZE", nome: "Pacote Bronze", bilhetes: 10, preco: 1000, cor: "from-amber-700 to-amber-900", icon: "🥉" },
    { id: "PRATA", nome: "Pacote Prata", bilhetes: 20, preco: 1800, cor: "from-slate-300 to-slate-500", icon: "🥈", destaque: "10% OFF" },
    { id: "OURO", nome: "Pacote Ouro", bilhetes: 30, preco: 2500, cor: "from-yellow-400 to-yellow-600", icon: "🥇", destaque: "17% OFF" },
  ];

  const efetuarCompra = async () => {
    if (!pacoteSelecionado) return;
    if (!contratoAceite) return toast("Você precisa aceitar os termos do contrato!", "warning");

    setComprando(true);
    try {
      const data = await apiAluno.comprarRifa(matricula, pacoteSelecionado);
      if (data.status === "sucesso") {
        toast(data.mensagem, "success", "Compra Aprovada! 🎉");
        onCompraSucesso(); // Atualiza o saldo do aluno na tela
        onClose();
      } else {
        toast(data.mensagem, "error", "Transação Recusada");
      }
    } catch (e) {
      toast("Erro de conexão com a loja.", "error");
    } finally {
      setComprando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-6000 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER DA LOJA */}
        <div className="bg-indigo-600 p-6 text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <h2 className="text-3xl font-black text-white relative z-10 flex items-center justify-center gap-3">
            <span>🛒</span> Loja Trilha Tech
          </h2>
          <p className="text-indigo-100 font-medium relative z-10 mt-2">
            Troque o seu XP por Números da Sorte para o Sorteio de R$ 50,00!
          </p>
          
          <div className="mt-4 inline-block bg-white/20 backdrop-blur-md rounded-xl px-6 py-2 border border-white/30 relative z-10">
            <p className="text-xs text-indigo-100 uppercase font-bold tracking-wider mb-1">Seu Saldo Disponível</p>
            <p className="text-2xl font-black text-white font-mono">{saldoCarteira} XP</p>
          </div>
        </div>

        {/* VITRINE DE PACOTES */}
        <div className="p-6 overflow-y-auto">
          {!pacoteSelecionado ? (
            <>
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Regra de Segurança: Você só pode gastar até <span className="text-indigo-500">60% do seu saldo ({Math.floor(limiteGasto)} XP)</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pacotes.map((pct) => {
                  const podeComprar = pct.preco <= limiteGasto;

                  return (
                    <div 
                      key={pct.id}
                      onClick={() => podeComprar && setPacoteSelecionado(pct.id)}
                      className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                        podeComprar 
                          ? "border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl cursor-pointer hover:-translate-y-1 bg-white dark:bg-slate-800" 
                          : "border-slate-100 dark:border-slate-800 opacity-50 bg-slate-50 dark:bg-slate-900 cursor-not-allowed grayscale"
                      }`}
                    >
                      {pct.destaque && podeComprar && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                          {pct.destaque}
                        </div>
                      )}
                      
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${pct.cor} flex items-center justify-center text-3xl shadow-inner mb-3`}>
                        {pct.icon}
                      </div>
                      <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase">{pct.nome}</h3>
                      <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono my-2">{pct.bilhetes} <span className="text-sm font-bold text-slate-500">Tickets</span></p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Preço</p>
                        <p className={`font-black font-mono ${podeComprar ? "text-slate-700 dark:text-slate-200" : "text-red-500"}`}>
                          {pct.preco} XP
                        </p>
                      </div>

                      {!podeComprar && (
                        <p className="text-[10px] text-red-500 font-bold mt-3 leading-tight">Saldo Insuficiente ou Excede Limite de 60%</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <button onClick={onClose} className="cursor-pointer text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">
                  Sair da Loja
                </button>
              </div>
            </>
          ) : (
            /* TELA DE CONTRATO / CHECKOUT */
            <div className="max-w-md mx-auto animate-in slide-in-from-right-8">
              <button 
                onClick={() => { setPacoteSelecionado(null); setContratoAceite(false); }}
                className="text-indigo-600 font-bold text-sm mb-4 hover:underline"
              >
                ← Voltar aos pacotes
              </button>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-black text-slate-800 dark:text-white text-xl mb-4 text-center border-b border-slate-200 dark:border-slate-700 pb-4">
                  Resumo da Transação
                </h3>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-500 font-bold">Pacote Escolhido:</span>
                  <span className="font-black text-slate-800 dark:text-white">{pacotes.find(p => p.id === pacoteSelecionado)?.nome}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-500 font-bold">Bilhetes a Receber:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{pacotes.find(p => p.id === pacoteSelecionado)?.bilhetes} Tickets</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200 font-black">Total a Pagar:</span>
                  <span className="font-black text-red-500 font-mono">- {pacotes.find(p => p.id === pacoteSelecionado)?.preco} XP</span>
                </div>
              </div>

              {/* CONTRATO DE CONCORDÂNCIA */}
              <label className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                <input 
                  type="checkbox" 
                  checked={contratoAceite}
                  onChange={(e) => setContratoAceite(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-amber-500 shrink-0"
                />
                <span className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                  <strong>Termo de Responsabilidade:</strong> Estou ciente de que esta compra descontará o XP do meu <strong>Saldo de Carteira</strong>. Entendo que esta ação é irreversível, mas que <strong>NÃO AFETARÁ</strong> a minha pontuação nem a minha posição no Ranking Geral do Projeto.
                </span>
              </label>

              <button
                onClick={efetuarCompra}
                disabled={comprando || !contratoAceite}
                className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-wide text-white transition-all shadow-lg ${
                  contratoAceite 
                    ? "bg-emerald-500 hover:bg-emerald-600 active:scale-95 shadow-emerald-500/30" 
                    : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                }`}
              >
                {comprando ? "Processando..." : "Assinar e Comprar"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}