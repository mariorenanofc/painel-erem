/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { AlunoGodMode, GodModeModalProps } from "../types";
import { useToast } from "@/src/contexts/ToastContext";

export default function GodModeModal({
  onClose,
  onSuccess,
}: GodModeModalProps) {
  const { toast } = useToast();

  const [alunos, setAlunos] = useState<AlunoGodMode[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Abas do God Mode
  const [abaAtiva, setAbaAtiva] = useState<"xp" | "coroa">("xp");

  // Estado Injetar XP
  const [matriculaSelecionada, setMatriculaSelecionada] = useState("");
  const [quantidadeXP, setQuantidadeXP] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");
  const [injetando, setInjetando] = useState(false);

  // Estado Coroar Elite
  const [matriculaCoroa, setMatriculaCoroa] = useState("");
  const [tipoPlaca, setTipoPlaca] = useState<
    "Elite Ouro" | "Elite Prata" | "Elite Bronze"
  >("Elite Ouro");
  const [coroando, setCoroando] = useState(false);

  useEffect(() => {
    const buscarAlunos = async () => {
      try {
        const data = await apiTutor.listarAlunosGodMode();
        if (data.status === "sucesso") setAlunos(data.alunos);
      } catch (e) {
        toast("Erro ao buscar alunos.", "error", "Falha de Conexão");
      } finally {
        setCarregando(false);
      }
    };
    buscarAlunos();
  }, [toast]);

  const handleInjetar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !matriculaSelecionada ||
      quantidadeXP === "" ||
      Number(quantidadeXP) === 0 ||
      !motivo
    ) {
      toast(
        "Preencha todos os campos e use um valor diferente de zero!",
        "warning",
        "Atenção",
      );
      return;
    }

    setInjetando(true);
    try {
      const data = await apiTutor.injetarXP(
        matriculaSelecionada,
        Number(quantidadeXP),
        motivo,
      );

      if (data.status === "sucesso") {
        if (Number(quantidadeXP) > 0) {
          confetti({
            particleCount: 150,
            spread: 80,
            colors: ["#fbbf24", "#f59e0b", "#fff"],
          });
        }
        toast(
          data.mensagem,
          "success",
          Number(quantidadeXP) < 0 ? "Punição Aplicada" : "Bônus Injetado!",
        );
        onSuccess();
        onClose();
      } else {
        toast(data.mensagem, "warning", "Atenção");
      }
    } catch {
      toast("Erro ao aplicar o poder.", "error", "Falha na Rede");
    } finally {
      setInjetando(false);
    }
  };

  const handleCoroar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matriculaCoroa) {
      toast("Selecione o aluno que vai receber a placa!", "warning", "Atenção");
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja passar a placa ${tipoPlaca} para este aluno? O dono anterior perderá a placa e receberá uma badge de Legado.`,
      )
    )
      return;

    setCoroando(true);
    try {
      const data = await apiTutor.coroarElite(matriculaCoroa, tipoPlaca);

      if (data.status === "sucesso") {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
        toast(data.mensagem, "success", "Novo Campeão Coroado! 👑");
        onSuccess();
        onClose();
      } else {
        toast(data.mensagem, "warning", "Atenção");
      }
    } catch {
      toast("Erro ao transferir a coroa.", "error", "Falha");
    } finally {
      setCoroando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-[0_0_50px_rgba(168,85,247,0.2)] border border-slate-200/80 dark:border-white/5 w-full max-w-lg overflow-hidden flex flex-col relative z-10"
        >
          {/* Glow decorativo de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 p-7 text-center relative overflow-hidden shrink-0 border-b border-white/5">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <button
              onClick={onClose}
              className="cursor-pointer absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors duration-200 z-20"
            >
              &times;
            </button>

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, delay: 0.15 }}
                className="text-5xl mb-2 animate-bounce select-none"
              >
                ⚡
              </motion.div>
              <h2 className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 uppercase tracking-widest">
                God Mode
              </h2>
              <p className="text-purple-200 text-[10px] font-black mt-1 uppercase tracking-widest opacity-80">
                Controle Absoluto do Jogo
              </p>
            </div>
          </div>

          {/* Abas */}
          <div className="flex bg-slate-100/50 dark:bg-slate-950/40 p-1.5 rounded-2xl border-b border-slate-200/50 dark:border-slate-850 shrink-0 m-4 mb-2">
            <button
              onClick={() => setAbaAtiva("xp")}
              className={`cursor-pointer flex-1 py-3.5 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all select-none ${
                abaAtiva === "xp"
                  ? "bg-purple-650 text-white shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              ⚖️ Injetar/Punir XP
            </button>
            <button
              onClick={() => setAbaAtiva("coroa")}
              className={`cursor-pointer flex-1 py-3.5 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all select-none ${
                abaAtiva === "coroa"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              👑 Coroar Elite
            </button>
          </div>

          {/* Conteúdo rolável */}
          <div className="p-6 overflow-y-auto max-h-[52vh] custom-scrollbar bg-white/40 dark:bg-transparent">
            {carregando ? (
              <div className="flex flex-col justify-center items-center py-12 opacity-60">
                <div className="relative w-10 h-10 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
                </div>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">
                  Carregando lista de alunos...
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {abaAtiva === "xp" ? (
                  <motion.form
                    key="abaXp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleInjetar}
                    className="space-y-5"
                  >
                    {/* Alvo */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        1. Escolha o Alvo
                      </label>
                      <div className="relative">
                        <select
                          value={matriculaSelecionada}
                          onChange={(e) => setMatriculaSelecionada(e.target.value)}
                          className="cursor-pointer w-full p-4 pr-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm transition-all shadow-sm appearance-none"
                          required
                        >
                          <option value="">Selecione um aluno...</option>
                          {alunos.map((a) => (
                            <option key={a.matricula} value={a.matricula}>
                              {a.nome} ({a.turma})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Quantidade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          2. Quantidade (+ ou -)
                        </label>
                        <input
                          type="number"
                          value={quantidadeXP}
                          onChange={(e) => setQuantidadeXP(Number(e.target.value))}
                          placeholder="Ex: 50 ou -100"
                          className={`w-full border rounded-2xl p-4 text-xl font-black outline-none shadow-inner text-center bg-white dark:bg-slate-950 transition-all ${
                            Number(quantidadeXP) < 0
                              ? "border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 focus:border-red-500"
                              : "border-emerald-300 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500"
                          }`}
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-250/60 dark:border-slate-850 p-4.5 rounded-2xl w-full text-xs font-semibold leading-relaxed text-slate-550 dark:text-slate-400 shadow-sm">
                          💡 <span className="text-emerald-600 dark:text-emerald-400 font-bold">Positivo (+10)</span> para bonificar. <br />
                          🚨 <span className="text-red-500 dark:text-red-400 font-bold font-mono">Negativo (-100)</span> para punir IA ou cola.
                        </div>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        3. Motivo da Ação
                      </label>
                      <input
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ex: Ajudou o colega / Punição por uso indevido de IA"
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-850 dark:text-slate-200 bg-white dark:bg-slate-950 outline-none focus:border-purple-500 shadow-sm transition-all"
                        required
                      />
                    </div>

                    {/* Botão de Submissão */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={injetando}
                      className={`cursor-pointer w-full text-white font-black py-4 rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 select-none ${
                        Number(quantidadeXP) < 0
                          ? "bg-red-650 hover:brightness-110 shadow-red-500/10"
                          : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 shadow-amber-500/10"
                      }`}
                    >
                      {injetando ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Aplicando Alteração...
                        </>
                      ) : Number(quantidadeXP) < 0 ? (
                        "🚨 Aplicar Punição"
                      ) : (
                        "⚡ Injetar Bônus de XP"
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="abaCoroa"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleCoroar}
                    className="space-y-5"
                  >
                    {/* Alerta explicativo */}
                    <div className="bg-amber-50/50 dark:bg-amber-955/15 p-4.5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30">
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
                        <strong>Destaque VIP:</strong> Ao coroar um novo campeão, o dono anterior perderá o destaque estético no mural público, mas receberá automaticamente uma <strong>Badge de Legado</strong> eterna em seu histórico.
                      </p>
                    </div>

                    {/* Placa */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        1. Qual placa transferir?
                      </label>
                      <div className="relative">
                        <select
                          value={tipoPlaca}
                          onChange={(e) => setTipoPlaca(e.target.value as any)}
                          className="cursor-pointer w-full p-4 pr-10 border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-950 text-amber-700 dark:text-amber-500 rounded-2xl outline-none focus:border-amber-500 font-bold text-sm transition-all shadow-sm appearance-none"
                        >
                          <option value="Elite Ouro">👑 Elite Ouro (Top 1)</option>
                          <option value="Elite Prata">🥈 Elite Prata (Top 2)</option>
                          <option value="Elite Bronze">🥉 Elite Bronze (Top 3)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Campeão */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        2. Novo Dono (Campeão Atual)
                      </label>
                      <div className="relative">
                        <select
                          value={matriculaCoroa}
                          onChange={(e) => setMatriculaCoroa(e.target.value)}
                          className="cursor-pointer w-full p-4 pr-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm transition-all shadow-sm appearance-none"
                          required
                        >
                          <option value="">Selecione o novo campeão...</option>
                          {alunos.map((a) => (
                            <option key={a.matricula} value={a.matricula}>
                              {a.nome} ({a.turma})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Botão Coroar */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={coroando}
                      className="cursor-pointer w-full text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-500/10 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 mt-4 select-none"
                    >
                      {coroando ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Transferindo Coroa...
                        </>
                      ) : (
                        "👑 Coroar Novo Campeão"
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
