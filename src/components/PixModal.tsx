"use client";

import { useState, useEffect } from "react";
import { DadosAluno, ColegaPix } from "../types";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

interface PixModalProps {
  aluno: DadosAluno;
  onClose: () => void;
  onSuccess: () => void; // Para atualizar as atividades após o Pix
}

export default function PixModal({ aluno, onClose, onSuccess }: PixModalProps) {
  const [carregandoPix, setCarregandoPix] = useState(true);
  const [dadosPix, setDadosPix] = useState<{
    colegas: ColegaPix[];
    limiteDiario: number;
    xpDoadoHoje: number;
    temSenhaPix: boolean;
    meuXpTotal: number;
  } | null>(null);

  const [novaSenhaPix, setNovaSenhaPix] = useState("");
  const [confirmarNovaSenhaPix, setConfirmarNovaSenhaPix] = useState("");
  const [pixColega, setPixColega] = useState("");
  const [pixQuantidade, setPixQuantidade] = useState<number | "">("");
  const [pixMotivo, setPixMotivo] = useState("🤝 Parceria de Equipe");
  const [pixSenha, setPixSenha] = useState("");
  const [enviandoPix, setEnviandoPix] = useState(false);

  useEffect(() => {
    const carregarDadosPix = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "iniciar_pix", matricula: aluno.matricula }),
        });
        const data = await res.json();
        if (data.status === "sucesso") setDadosPix(data);
        else { alert("Erro ao carregar Pix."); onClose(); }
      } catch {
        alert("Erro de conexão."); onClose();
      } finally {
        setCarregandoPix(false);
      }
    };
    carregarDadosPix();
  }, [aluno.matricula, onClose]);

  const criarSenhaPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenhaPix.length !== 6) return alert("A senha deve ter exatamente 6 números.");
    if (novaSenhaPix !== confirmarNovaSenhaPix) return alert("As senhas não batem!");
    
    setEnviandoPix(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "criar_senha_pix", matricula: aluno.matricula, senha: novaSenhaPix }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("✅ Senha criada com sucesso!");
        // Atualiza o estado local para ir para a tela de envio
        setDadosPix((prev) => prev ? { ...prev, temSenhaPix: true } : null);
      } else alert(data.mensagem);
    } catch {
      alert("Erro.");
    } finally {
      setEnviandoPix(false);
    }
  };

  const enviarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dadosPix) return;
    if (pixQuantidade === "" || Number(pixQuantidade) <= 0) return alert("Digite um valor válido.");
    if (Number(pixQuantidade) > dadosPix.limiteDiario - dadosPix.xpDoadoHoje) return alert("Isso ultrapassa o seu limite diário restante.");
    if (Number(pixQuantidade) > dadosPix.meuXpTotal) return alert("Você não tem saldo suficiente.");
    if (pixSenha.length !== 6) return alert("Digite o seu PIN de 6 números corretamente.");

    setEnviandoPix(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "transferir_xp",
          matriculaOrigem: aluno.matricula,
          senha: pixSenha,
          matriculaDestino: pixColega,
          quantidade: Number(pixQuantidade),
          motivo: pixMotivo,
        }),
      });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("🎉 PIX ENVIADO COM SUCESSO!");
        onSuccess(); // Atualiza dados na tela principal
        onClose();
      } else { alert("⚠️ " + data.mensagem); }
    } catch {
      alert("Erro na transferência.");
    } finally {
      setEnviandoPix(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 border-b flex justify-between items-center text-white">
          <div>
            <h2 className="font-black text-xl flex items-center gap-2"><span>💸</span> Pix de XP</h2>
            <p className="text-emerald-100 text-xs mt-1">Recompense seus colegas!</p>
          </div>
          <button onClick={onClose} className="text-3xl leading-none hover:text-emerald-200 transition-colors">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {carregandoPix ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-500"></div></div>
          ) : dadosPix && !dadosPix.temSenhaPix ? (
            <form onSubmit={criarSenhaPix} className="text-center animate-in zoom-in">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Crie sua Senha Pix</h3>
              <p className="text-sm text-slate-500 mb-6">Para sua segurança, crie uma senha numérica de <strong>6 dígitos</strong>. Você vai usá-la sempre que quiser enviar XP.</p>
              
              <div className="space-y-4 text-left mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha (6 números)</label>
                  <input type="password" maxLength={6} value={novaSenhaPix} onChange={(e) => setNovaSenhaPix(e.target.value.replace(/\D/g, ""))} required className="w-full text-center text-slate-800 text-2xl tracking-widest border-2 border-slate-300 rounded p-2 outline-none focus:border-emerald-500" placeholder="••••••" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Repita a Senha</label>
                  <input type="password" maxLength={6} value={confirmarNovaSenhaPix} onChange={(e) => setConfirmarNovaSenhaPix(e.target.value.replace(/\D/g, ""))} required className="w-full text-center text-slate-800 text-2xl tracking-widest border-2 border-slate-300 rounded p-2 outline-none focus:border-emerald-500" placeholder="••••••" />
                </div>
              </div>
              <button type="submit" disabled={enviandoPix} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow transition-colors disabled:opacity-50">{enviandoPix ? "Salvando..." : "Cadastrar Senha"}</button>
            </form>
          ) : dadosPix && dadosPix.temSenhaPix ? (
            <form onSubmit={enviarPix} className="animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-200 mb-5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Seu Saldo Total</p>
                  <p className="font-black text-emerald-600 text-lg">{dadosPix.meuXpTotal} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Limite Diário Restante</p>
                  <p className="font-black text-blue-600 text-lg">{Math.max(0, dadosPix.limiteDiario - dadosPix.xpDoadoHoje)} XP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Para quem você quer enviar?</label>
                  <select value={pixColega} onChange={(e) => setPixColega(e.target.value)} required className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione um colega da sua turma...</option>
                    {dadosPix.colegas.map((c) => (
                      <option key={c.matricula} value={c.matricula}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (XP)</label>
                    <input type="number" min="1" max={Math.min(dadosPix.meuXpTotal, dadosPix.limiteDiario - dadosPix.xpDoadoHoje)} value={pixQuantidade} onChange={(e) => setPixQuantidade(Number(e.target.value))} required className="w-full bg-white border border-slate-300 text-emerald-700 font-black rounded p-2.5 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: 10" />
                  </div>
                  <div className="flex-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo / Mensagem</label>
                    <select value={pixMotivo} onChange={(e) => setPixMotivo(e.target.value)} required className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                      <option>🤝 Parceria de Equipe</option>
                      <option>🧠 Mestre do Código (Me ajudou)</option>
                      <option>🍕 Pagando uma aposta/lanche</option>
                      <option>🎁 Presente de Aniversário</option>
                      <option>🚀 Incentivo para não desistir</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-2">
                  <label className="block text-xs font-bold text-amber-600 uppercase mb-1 text-center">Digite sua Senha Pix (6 Números)</label>
                  <input type="password" maxLength={6} value={pixSenha} onChange={(e) => setPixSenha(e.target.value.replace(/\D/g, ""))} required className="w-full max-w-200 text-slate-800 mx-auto block text-center text-xl tracking-widest border-2 border-amber-300 bg-amber-50 rounded p-2 outline-none focus:border-amber-500" placeholder="••••••" />
                </div>
              </div>

              <button type="submit" disabled={enviandoPix || dadosPix.limiteDiario - dadosPix.xpDoadoHoje <= 0} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-lg shadow-md transition-all disabled:opacity-50 hover:-translate-y-0.5">
                {enviandoPix ? "Transferindo..." : "Confirmar Transferência 🚀"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}