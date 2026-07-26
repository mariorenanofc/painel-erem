"use client";

import { useState, useEffect } from "react";
import { PixModalProps, ItemExtrato, ColegaPix } from "../types";
import { apiAluno } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PixModal({
  aluno,
  onClose,
  onSuccess,
  alunoAlvoInicial,
}: PixModalProps) {
  const { toast } = useToast();

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
          toast("Erro ao carregar o seu extrato do Pix.", "error", "Ops!");
          onClose();
        }
      } catch {
        toast("Erro de conexão ao abrir o Pix.", "error", "Falha na Rede");
        onClose();
      } finally {
        setCarregandoPix(false);
      }
    };
    carregarDadosPix();
  }, [aluno.matricula, onClose, alunoAlvoInicial, toast]);

  const criarSenhaPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenhaPix.length !== 6) {
      toast("A senha deve ter exatamente 6 números.", "warning", "Atenção");
      return;
    }
    if (novaSenhaPix !== confirmarNovaSenhaPix) {
      toast("As senhas não batem!", "warning", "Atenção");
      return;
    }

    setEnviandoPix(true);
    try {
      const data = await apiAluno.criarSenhaPix(aluno.matricula, novaSenhaPix);
      if (data.status === "sucesso") {
        toast("Sua senha foi criada com sucesso!", "success", "Tudo Pronto!");
        setDadosPix((prev) => (prev ? { ...prev, temSenhaPix: true } : null));
      } else {
        toast(data.mensagem, "warning", "Atenção");
      }
    } catch {
      toast("Erro ao tentar criar a senha.", "error", "Erro");
    } finally {
      setEnviandoPix(false);
    }
  };

  const enviarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dadosPix) return;
    if (pixQuantidade === "" || Number(pixQuantidade) <= 0) {
      toast("Digite um valor válido de XP.", "warning", "Atenção");
      return;
    }
    if (Number(pixQuantidade) > dadosPix.limiteDiario - dadosPix.xpDoadoHoje) {
      toast(
        `Isso ultrapassa o seu limite de transferência diário.`,
        "warning",
        "Limite Atingido",
      );
      return;
    }
    if (Number(pixQuantidade) > dadosPix.meuXpTotal) {
      toast(
        "Você não tem XP suficiente para esta transferência.",
        "warning",
        "Saldo Insuficiente",
      );
      return;
    }
    if (pixSenha.length !== 6) {
      toast(
        "Digite o seu PIN de 6 números corretamente.",
        "warning",
        "Senha Inválida",
      );
      return;
    }

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
        toast(
          `Você enviou ${pixQuantidade} XP com sucesso!`,
          "success",
          "Transferência Realizada! 🎉",
        );
        onSuccess();
        onClose();
      } else {
        toast(data.mensagem, "warning", "Atenção");
      }
    } catch {
      toast(
        "Erro de rede durante a transferência.",
        "error",
        "Falha de Conexão",
      );
    } finally {
      setEnviandoPix(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Container Principal */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative z-10"
      >
        {/* Cabeçalho do modal */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 dark:from-emerald-700 dark:to-teal-800 p-5.5 flex justify-between items-center text-white shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display font-black text-xl flex items-center gap-2 tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm shadow-inner">
                💸
              </span>{" "}
              Pix de XP
            </h2>
            <p className="text-emerald-100 text-xs mt-1 font-semibold tracking-wide uppercase opacity-90">
              Sua conta de pontos
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-colors duration-200"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-transparent">
          {carregandoPix ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="relative w-10 h-10 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider uppercase">
                Buscando chaves...
              </span>
            </div>
          ) : dadosPix && !dadosPix.temSenhaPix ? (
            <form
              onSubmit={criarSenhaPix}
              className="text-center animate-in zoom-in duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-500/20 shadow-inner">
                🔐
              </div>
              <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-lg mb-2 tracking-tight">
                Crie sua Senha Pix
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Para sua segurança, crie uma senha numérica de{" "}
                <strong className="text-slate-700 dark:text-slate-300">6 dígitos</strong>.
                Você precisará dela para confirmar todas as transferências.
              </p>

              <div className="space-y-4 text-left mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase mb-1.5 tracking-wider">
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
                    className="w-full text-center text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/60 text-2xl tracking-widest border border-slate-200 dark:border-slate-800 rounded-2xl p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase mb-1.5 tracking-wider">
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
                    className="w-full text-center text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/60 text-2xl tracking-widest border border-slate-200 dark:border-slate-800 rounded-2xl p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="••••••"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={enviandoPix}
                className="cursor-pointer w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-emerald-500/10 uppercase tracking-wider disabled:opacity-50"
              >
                {enviandoPix ? "Salvando PIN..." : "Cadastrar Senha"}
              </motion.button>
            </form>
          ) : dadosPix && dadosPix.temSenhaPix ? (
            <div>
              {/* Abas */}
              <div className="flex border-b border-slate-200/80 dark:border-slate-800/80 mb-5 relative">
                <button
                  onClick={() => setAbaAtiva("enviar")}
                  className={`cursor-pointer flex-1 py-3 font-black text-xs uppercase tracking-wider transition-colors relative z-10 ${
                    abaAtiva === "enviar"
                      ? "text-emerald-600 dark:text-emerald-450 font-black"
                      : "text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                >
                  Transferir XP
                  {abaAtiva === "enviar" && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 dark:bg-emerald-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => setAbaAtiva("extrato")}
                  className={`cursor-pointer flex-1 py-3 font-black text-xs uppercase tracking-wider transition-colors relative z-10 ${
                    abaAtiva === "extrato"
                      ? "text-emerald-600 dark:text-emerald-450 font-black"
                      : "text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                >
                  Ver Extrato
                  {abaAtiva === "extrato" && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 dark:bg-emerald-400"
                    />
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {abaAtiva === "enviar" ? (
                  <motion.form
                    key="enviar"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={enviarPix}
                  >
                    {/* Bento Boxes de Saldos */}
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-850 mb-5">
                      <div className="space-y-0.5 border-r border-slate-200/80 dark:border-slate-800/80 pr-2">
                        <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">
                          Seu Saldo
                        </p>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                          {dadosPix.meuXpTotal} XP
                        </p>
                      </div>
                      <div className="space-y-0.5 pl-2">
                        <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">
                          Limite Diário Restante
                        </p>
                        <p className="font-black text-blue-600 dark:text-blue-400 text-lg font-mono">
                          {Math.max(
                            0,
                            dadosPix.limiteDiario - dadosPix.xpDoadoHoje,
                          )}{" "}
                          XP
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4.5">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">
                          Para quem você quer enviar?
                        </label>
                        <select
                          value={pixColega}
                          onChange={(e) => setPixColega(e.target.value)}
                          required
                          className="cursor-pointer w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        >
                          <option value="">Selecione um colega...</option>
                          {dadosPix.colegas.map((c) => (
                            <option key={c.matricula} value={c.matricula}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">
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
                            className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-450 font-black rounded-2xl p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono placeholder-slate-450"
                            placeholder="10"
                          />
                        </div>
                        <div className="flex-1 sm:flex-[1.5]">
                          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">
                            Motivo
                          </label>
                          <select
                            value={pixMotivo}
                            onChange={(e) => setPixMotivo(e.target.value)}
                            required
                            className="cursor-pointer w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-150 rounded-2xl p-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          >
                            <option>🤝 Parceria de Equipe</option>
                            <option>🧠 Mestre do Código (Me ajudou)</option>
                            <option>🍕 Pagando uma aposta/lanche</option>
                            <option>🎁 Presente de Aniversário</option>
                            <option>🚀 Incentivo para não desistir</option>
                            <option>🏅 Recompensa por ajudar</option>
                            <option>🪙 Negócios são negócios</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800/80 mt-2">
                        <label className="block text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase mb-2 text-center tracking-wider">
                          🔒 Confirmar com sua Senha Pix
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          value={pixSenha}
                          onChange={(e) =>
                            setPixSenha(e.target.value.replace(/\D/g, ""))
                          }
                          required
                          className="w-40 text-slate-850 dark:text-slate-50 mx-auto block text-center text-2xl tracking-widest border border-amber-250 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/15 rounded-2xl p-2.5 outline-none focus:border-amber-500 transition-colors"
                          placeholder="••••••"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={
                        enviandoPix ||
                        dadosPix.limiteDiario - dadosPix.xpDoadoHoje <= 0
                      }
                      className="cursor-pointer w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-emerald-500/10 uppercase tracking-wider disabled:opacity-50 select-none"
                    >
                      {enviandoPix
                        ? "Transferindo XP..."
                        : "Confirmar Transferência 🚀"}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="extrato"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {dadosPix.extrato.length === 0 ? (
                      <div className="text-center py-12 opacity-60 bg-slate-50/30 dark:bg-slate-950/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                          Seu extrato está vazio.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Envie ou receba XP de seus colegas primeiro!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1.5 custom-scrollbar">
                        {dadosPix.extrato.map((item, idx) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={item.id}
                            className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-850 transition-colors duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  item.tipo === "RECEBEU"
                                    ? "bg-emerald-100/80 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30"
                                    : "bg-slate-100 dark:bg-slate-950/60 text-slate-550 dark:text-slate-350 border-slate-200 dark:border-slate-850"
                                }`}
                              >
                                {item.tipo === "RECEBEU" ? "↙️" : "↗️"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-850 dark:text-slate-200 leading-tight">
                                  {item.tipo === "RECEBEU"
                                    ? "Pix Recebido"
                                    : "Pix Enviado"}
                                </p>
                                <p
                                  className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 font-bold truncate line-clamp-1"
                                  title={item.mensagem}
                                >
                                  {item.mensagem}
                                </p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-semibold uppercase">
                                  🕒{" "}
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
                              className={`font-black shrink-0 ml-2 font-mono text-sm ${
                                item.tipo === "RECEBEU"
                                  ? "text-emerald-600 dark:text-emerald-450"
                                  : "text-slate-650 dark:text-slate-300"
                              }`}
                            >
                              {item.tipo === "RECEBEU" ? "+" : "-"}
                              {item.xp} XP
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
