"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import { RegrasCiclosConfig } from "@/src/types";
import { DIAS_SEMANA_NOMES } from "@/src/lib/dateUtils";

interface AbaCiclosProps {
  onSalvo?: () => void;
}

export default function AbaCiclos({ onSalvo }: AbaCiclosProps) {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [regras, setRegras] = useState<RegrasCiclosConfig>({
    semanal: {
      ativo: true,
      diaFechamento: 0, // Domingo
      horaFechamento: "23:59",
      xpTop1: 50,
      xpTop2_3: 30,
      xpTop4_10: 15,
      modoExecucao: "manual_com_alerta"
    },
    mensal: {
      ativo: true,
      diaFechamento: "ultimo_dia_mes",
      horaFechamento: "23:59",
      xpTop1: 100,
      xpTop2_3: 80,
      xpTop4_10: 40,
      modoExecucao: "automatico"
    }
  });

  useEffect(() => {
    carregarRegras();
  }, []);

  const carregarRegras = async () => {
    setCarregando(true);
    try {
      const res = await apiTutor.buscarRegrasCiclos();
      if (res.status === "sucesso" && res.regras) {
        setRegras(res.regras);
      }
    } catch {
      toast("Não foi possível carregar as regras de ciclos.", "error", "Falha de Leitura");
    } finally {
      setCarregando(false);
    }
  };

  const salvarRegras = async () => {
    setSalvando(true);
    try {
      const res = await apiTutor.salvarRegrasCiclos(regras as unknown as Record<string, unknown>);
      if (res.status === "sucesso") {
        toast("Regras de ciclos e pontuações atualizadas com sucesso!", "success", "Salvo!");
        if (onSalvo) onSalvo();
      } else {
        toast(res.mensagem || "Erro ao salvar regras.", "error", "Erro");
      }
    } catch {
      toast("Erro de conexão ao salvar regras.", "error", "Falha na Rede");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Carregando regras de ciclos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-white font-display flex items-center gap-2">
          <span>⚙️</span> Automação de Ciclos & Bonificações do Top 10
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Defina quando o sistema fecha os rankings semanais e mensais e quantos pontos de XP cada colocação do Top 10 recebe automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCO 1: CICLO SEMANAL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-display font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>🗓️</span> Ciclo Semanal
              </h4>
              <p className="text-[11px] text-slate-400">Classificação semanal de entregas e XP</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] font-black uppercase text-slate-500">
                {regras.semanal.ativo ? "Ativo" : "Inativo"}
              </span>
              <input
                type="checkbox"
                checked={regras.semanal.ativo}
                onChange={(e) =>
                  setRegras({
                    ...regras,
                    semanal: { ...regras.semanal, ativo: e.target.checked }
                  })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Horário e Dia de Corte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Dia de Fechamento
              </label>
              <select
                value={regras.semanal.diaFechamento}
                onChange={(e) =>
                  setRegras({
                    ...regras,
                    semanal: { ...regras.semanal, diaFechamento: Number(e.target.value) }
                  })
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(DIAS_SEMANA_NOMES).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Horário de Corte
              </label>
              <input
                type="time"
                value={regras.semanal.horaFechamento}
                onChange={(e) =>
                  setRegras({
                    ...regras,
                    semanal: { ...regras.semanal, horaFechamento: e.target.value }
                  })
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Checkbox Brinde Físico 1º Lugar */}
          <label className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-all">
            <input
              type="checkbox"
              checked={regras.semanal.brindeFisicoTop1 ?? true}
              onChange={(e) =>
                setRegras({
                  ...regras,
                  semanal: { ...regras.semanal, brindeFisicoTop1: e.target.checked }
                })
              }
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>🎁</span> 1º Colocado ganha Brinde Físico Semanal
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Se marcado, a mensagem do WhatsApp anuncia a entrega do brinde físico para o campeão da semana.
              </p>
            </div>
          </label>

          {/* Modo de Execução */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Modo de Fechamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setRegras({
                    ...regras,
                    semanal: { ...regras.semanal, modoExecucao: "manual_com_alerta" }
                  })
                }
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  regras.semanal.modoExecucao === "manual_com_alerta"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                🔔 Alerta no Painel
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  Avisa o tutor para revisar e confirmar o lançamento
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setRegras({
                    ...regras,
                    semanal: { ...regras.semanal, modoExecucao: "automatico" }
                  })
                }
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  regras.semanal.modoExecucao === "automatico"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                ⚡ 100% Automático
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  Injeta os pontos sozinho no horário de corte
                </span>
              </button>
            </div>
          </div>

          {/* Tabela de XP Semanal */}
          <div className="space-y-3 pt-2">
            <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Premiação em XP por Colocação Semanal:
            </h5>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-amber-500 uppercase">1º Lugar</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={regras.semanal.xpTop1}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        semanal: { ...regras.semanal, xpTop1: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm p-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400 font-bold">XP</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">2º e 3º Lugar</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={regras.semanal.xpTop2_3}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        semanal: { ...regras.semanal, xpTop2_3: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm p-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400 font-bold">XP</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-emerald-500 uppercase">4º ao 10º Lugar</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={regras.semanal.xpTop4_10}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        semanal: { ...regras.semanal, xpTop4_10: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm p-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400 font-bold">XP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* BLOCO 2: CICLO MENSAL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-display font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>🏆</span> Ciclo Mensal
              </h4>
              <p className="text-[11px] text-slate-400">Classificação acumulada de todo o mês</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] font-black uppercase text-slate-500">
                {regras.mensal.ativo ? "Ativo" : "Inativo"}
              </span>
              <input
                type="checkbox"
                checked={regras.mensal.ativo}
                onChange={(e) =>
                  setRegras({
                    ...regras,
                    mensal: { ...regras.mensal, ativo: e.target.checked }
                  })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Horário e Dia de Corte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Dia de Fechamento
              </label>
              <input
                type="text"
                disabled
                value="Último dia de cada mês"
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl p-3 cursor-not-allowed select-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Horário de Corte
              </label>
              <input
                type="time"
                value={regras.mensal.horaFechamento}
                onChange={(e) =>
                  setRegras({
                    ...regras,
                    mensal: { ...regras.mensal, horaFechamento: e.target.value }
                  })
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Checkbox Brinde Físico 1º Lugar */}
          <label className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-all">
            <input
              type="checkbox"
              checked={regras.mensal.brindeFisicoTop1 ?? true}
              onChange={(e) =>
                setRegras({
                  ...regras,
                  mensal: { ...regras.mensal, brindeFisicoTop1: e.target.checked }
                })
              }
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>🎁</span> 1º Colocado ganha Brinde Físico Mensal
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Se marcado, a mensagem do WhatsApp anuncia a entrega do troféu/brinde físico do mês.
              </p>
            </div>
          </label>

          {/* Modo de Execução */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Modo de Fechamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setRegras({
                    ...regras,
                    mensal: { ...regras.mensal, modoExecucao: "automatico" }
                  })
                }
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  regras.mensal.modoExecucao === "automatico"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                ⚡ 100% Automático
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  Injeta os pontos sozinho no fim do mês
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setRegras({
                    ...regras,
                    mensal: { ...regras.mensal, modoExecucao: "manual_com_alerta" }
                  })
                }
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  regras.mensal.modoExecucao === "manual_com_alerta"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                🔔 Alerta no Painel
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  Avisa o tutor para revisar e confirmar o lançamento
                </span>
              </button>
            </div>
          </div>

          {/* Tabela de XP Mensal */}
          <div className="space-y-3 pt-2">
            <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Premiação em XP por Colocação Mensal:
            </h5>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-amber-500 uppercase">1º Lugar</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={regras.mensal.xpTop1}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        mensal: { ...regras.mensal, xpTop1: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm p-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400 font-bold">XP</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">2º e 3º Lugar</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={regras.mensal.xpTop2_3}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        mensal: { ...regras.mensal, xpTop2_3: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm p-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400 font-bold">XP</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-emerald-500 uppercase">4º ao 10º Lugar</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={regras.mensal.xpTop4_10}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        mensal: { ...regras.mensal, xpTop4_10: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm p-1.5 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400 font-bold">XP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={salvarRegras}
          disabled={salvando}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {salvando ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Salvando Regras...
            </>
          ) : (
            "💾 Salvar Configurações de Ciclos"
          )}
        </motion.button>
      </div>
    </div>
  );
}

