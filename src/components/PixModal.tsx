"use client";

import { useState, useEffect } from "react";
import { PixModalProps, ItemExtrato, ColegaPix } from "../types";
import { apiAluno } from "@/src/services/api";

export default function PixModal({
  aluno,
  onClose,
  onSuccess,
  alunoAlvoInicial,
}: PixModalProps) {
  const [carregandoPix, setCarregandoPix] = useState(true);
  const [dadosPix, setDadosPix] = useState<{
    colegas: ColegaPix[];
    limiteDiario: number;
    xpDoadoHoje: number;
    temSenhaPix: boolean;
    meuXpTotal: number;
    extrato: ItemExtrato[];
  } | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<"enviar" | "extrato">("enviar");
  const [novaSenhaPix, setNovaSenhaPix] = useState("");
  const [confirmarNovaSenhaPix, setConfirmarNovaSenhaPix] = useState("");

  const [pixColega, setPixColega] = useState(alunoAlvoInicial || "");
  const [pixQuantidade, setPixQuantidade] = useState<number | "">("");
  const [pixMotivo, setPixMotivo] = useState("🤝 Parceria de Equipe");
  const [pixSenha, setPixSenha] = useState("");
  const [enviandoPix, setEnviandoPix] = useState(false);

  useEffect(() => {
    const carregarDadosPix = async () => {
      try {
        const data = await apiAluno.iniciarPix(aluno.matricula);
        if (data.status === "sucesso") {
          setDadosPix(data);
          if (
            alunoAlvoInicial &&
            !data.colegas.some(
              (c: ColegaPix) => c.matricula === alunoAlvoInicial,
            )
          ) {
            setPixColega("");
          }
        } else {
          alert("Erro ao carregar Pix.");
          onClose();
        }
      } catch {
        alert("Erro de conexão.");
        onClose();
      } finally {
        setCarregandoPix(false);
      }
    };
    carregarDadosPix();
  }, [aluno.matricula, onClose, alunoAlvoInicial]);

  const criarSenhaPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenhaPix.length !== 6)
      return alert("A senha deve ter exatamente 6 números.");
    if (novaSenhaPix !== confirmarNovaSenhaPix)
      return alert("As senhas não batem!");

    setEnviandoPix(true);
    try {
      const data = await apiAluno.criarSenhaPix(aluno.matricula, novaSenhaPix);
      if (data.status === "sucesso") {
        alert("✅ Senha criada com sucesso!");
        setDadosPix((prev) => (prev ? { ...prev, temSenhaPix: true } : null));
      } else {
        alert(data.mensagem);
      }
    } catch {
      alert("Erro ao criar senha.");
    } finally {
      setEnviandoPix(false);
    }
  };

  const enviarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dadosPix) return;
    if (pixQuantidade === "" || Number(pixQuantidade) <= 0)
      return alert("Digite um valor válido.");
    if (Number(pixQuantidade) > dadosPix.limiteDiario - dadosPix.xpDoadoHoje)
      return alert("Isso ultrapassa o seu limite diário restante.");
    if (Number(pixQuantidade) > dadosPix.meuXpTotal)
      return alert("Você não tem saldo suficiente.");
    if (pixSenha.length !== 6)
      return alert("Digite o seu PIN de 6 números corretamente.");

    setEnviandoPix(true);
    try {
      const data = await apiAluno.transferirXP(
        aluno.matricula,
        pixSenha,
        pixColega,
        Number(pixQuantidade),
        pixMotivo,
      );

      if (data.status === "sucesso") {
        alert("🎉 PIX ENVIADO COM SUCESSO!");
        onSuccess();
        onClose();
      } else {
        alert("⚠️ " + data.mensagem);
      }
    } catch {
      alert("Erro na transferência.");
    } finally {
      setEnviandoPix(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 p-5 border-b dark:border-slate-800 flex justify-between items-center text-white shrink-0 transition-colors duration-300">
          <div>
            <h2 className="font-black text-xl flex items-center gap-2">
              <span>💸</span> Pix de XP
            </h2>
            <p className="text-emerald-100 text-xs mt-1">Sua conta de pontos</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-3xl leading-none hover:text-emerald-200 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {carregandoPix ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-500"></div>
            </div>
          ) : dadosPix && !dadosPix.temSenhaPix ? (
            <form
              onSubmit={criarSenhaPix}
              className="text-center animate-in zoom-in"
            >
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2 transition-colors">
                Crie sua Senha Pix
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 transition-colors">
                Para sua segurança, crie uma senha numérica de{" "}
                <strong className="dark:text-slate-300">6 dígitos</strong>. Você
                vai usá-la sempre que quiser enviar XP.
              </p>

              <div className="space-y-4 text-left mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                    Nova Senha (6 números)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={novaSenhaPix}
                    onChange={(e) =>
                      setNovaSenhaPix(e.target.value.replace(/\D/g, ""))
                    }
                    required
                    className="w-full text-center text-slate-800 dark:text-slate-100 bg-transparent dark:bg-slate-800 text-2xl tracking-widest border-2 border-slate-300 dark:border-slate-700 rounded p-2 outline-none focus:border-emerald-500 transition-colors duration-300"
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                    Repita a Senha
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmarNovaSenhaPix}
                    onChange={(e) =>
                      setConfirmarNovaSenhaPix(
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    required
                    className="w-full text-center text-slate-800 dark:text-slate-100 bg-transparent dark:bg-slate-800 text-2xl tracking-widest border-2 border-slate-300 dark:border-slate-700 rounded p-2 outline-none focus:border-emerald-500 transition-colors duration-300"
                    placeholder="••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={enviandoPix}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {enviandoPix ? "Salvando..." : "Cadastrar Senha"}
              </button>
            </form>
          ) : dadosPix && dadosPix.temSenhaPix ? (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 transition-colors duration-300">
                <button
                  onClick={() => setAbaAtiva("enviar")}
                  className={`cursor-pointer flex-1 py-3 font-bold text-sm transition-colors ${abaAtiva === "enviar" ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  Transferir XP
                </button>
                <button
                  onClick={() => setAbaAtiva("extrato")}
                  className={`cursor-pointer flex-1 py-3 font-bold text-sm transition-colors ${abaAtiva === "extrato" ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  Ver Extrato
                </button>
              </div>

              {abaAtiva === "enviar" ? (
                <form onSubmit={enviarPix}>
                  <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-5 transition-colors duration-300">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        Seu Saldo Total
                      </p>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                        {dadosPix.meuXpTotal} XP
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        Limite Diário Restante
                      </p>
                      <p className="font-black text-blue-600 dark:text-blue-400 text-lg">
                        {Math.max(
                          0,
                          dadosPix.limiteDiario - dadosPix.xpDoadoHoje,
                        )}{" "}
                        XP
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                        Para quem você quer enviar?
                      </label>
                      <select
                        value={pixColega}
                        onChange={(e) => setPixColega(e.target.value)}
                        required
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300"
                      >
                        <option value="">Selecione um colega...</option>
                        {dadosPix.colegas.map((c) => (
                          <option key={c.matricula} value={c.matricula}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                          Valor (XP)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={Math.min(
                            dadosPix.meuXpTotal,
                            dadosPix.limiteDiario - dadosPix.xpDoadoHoje,
                          )}
                          value={pixQuantidade}
                          onChange={(e) =>
                            setPixQuantidade(Number(e.target.value))
                          }
                          required
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-black rounded p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300"
                          placeholder="Ex: 10"
                        />
                      </div>
                      <div className="flex-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">
                          Motivo / Mensagem
                        </label>
                        <select
                          value={pixMotivo}
                          onChange={(e) => setPixMotivo(e.target.value)}
                          required
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300"
                        >
                          <option>🤝 Parceria de Equipe</option>
                          <option>🧠 Mestre do Código (Me ajudou)</option>
                          <option>🍕 Pagando uma aposta/lanche</option>
                          <option>🎁 Presente de Aniversário</option>
                          <option>🚀 Incentivo para não desistir</option>
                          <option>🏅 Recompensa por ajudar</option>
                          <option>🪙 Negocios são negocios</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-2 transition-colors duration-300">
                      <label className="block text-xs font-bold text-amber-600 dark:text-amber-500 uppercase mb-1 text-center transition-colors">
                        Digite sua Senha Pix
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={pixSenha}
                        onChange={(e) =>
                          setPixSenha(e.target.value.replace(/\D/g, ""))
                        }
                        required
                        className="w-full max-w-200 text-slate-800 dark:text-slate-100 mx-auto block text-center text-xl tracking-widest border-2 border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 rounded p-2 outline-none focus:border-amber-500 transition-colors duration-300"
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      enviandoPix ||
                      dadosPix.limiteDiario - dadosPix.xpDoadoHoje <= 0
                    }
                    className="cursor-pointer w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-lg shadow-md transition-all disabled:opacity-50 hover:-translate-y-0.5"
                  >
                    {enviandoPix
                      ? "Transferindo..."
                      : "Confirmar Transferência 🚀"}
                  </button>
                </form>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  {dadosPix.extrato.length === 0 ? (
                    <div className="text-center py-10 opacity-60">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Seu extrato está vazio.
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Você ainda não fez nem recebeu PIX.
                      </p>
                    </div>
                  ) : (
                    dadosPix.extrato.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-full shrink-0 ${item.tipo === "RECEBEU" ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
                          >
                            {item.tipo === "RECEBEU" ? "↙️" : "↗️"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {item.tipo === "RECEBEU"
                                ? "Pix Recebido"
                                : "Pix Enviado"}
                            </p>
                            <p
                              className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1"
                              title={item.mensagem}
                            >
                              {item.mensagem}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
                              <span>🕒</span>{" "}
                              {new Date(item.tempo)
                                .toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                .replace(",", " às")}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`font-black shrink-0 ml-2 ${item.tipo === "RECEBEU" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {item.tipo === "RECEBEU" ? "+" : ""}
                          {item.xp} XP
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
