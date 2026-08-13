"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/src/contexts/ToastContext";
import { apiTutor, apiGeral } from "@/src/services/api";

export default function AbaFrequencia() {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [diasComAula, setDiasComAula] = useState<string[]>([]);
  const [excluindoDia, setExcluindoDia] = useState("");
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    // Carregar turmas disponíveis
    apiGeral.buscarConfiguracoes().then((res) => {
      if (res && res.configuracoes) {
        const turmas = res.configuracoes.TURMAS_PROJETO || res.configuracoes.turmas || "";
        if (typeof turmas === "string") {
          setTurmasDisponiveis(turmas.split(",").map((t: string) => t.trim()).filter((t: string) => t));
        } else if (Array.isArray(turmas)) {
          setTurmasDisponiveis(turmas);
        }
      }
    }).catch(console.error);
  }, []);

  const buscarDiasAula = useCallback(async () => {
    if (!turmaSelecionada) return;
    setCarregando(true);
    try {
      const res = await fetch(
        `/api/tutor/diario-classe?turma=${encodeURIComponent(turmaSelecionada)}&mes=${mes}&ano=${ano}&_t=${Date.now()}`
      );
      const data = await res.json();
      if (data.diasComAula) {
        // Ordenar as datas
        const diasOrdenados = data.diasComAula.sort((a: string, b: string) => {
          const [dA, mA, yA] = a.split("/");
          const [dB, mB, yB] = b.split("/");
          return new Date(Number(yA), Number(mA) - 1, Number(dA)).getTime() - new Date(Number(yB), Number(mB) - 1, Number(dB)).getTime();
        });
        setDiasComAula(diasOrdenados);
      }
    } catch (e) {
      console.error(e);
      toast("Erro ao buscar dias letivos", "error");
    } finally {
      setCarregando(false);
    }
  }, [turmaSelecionada, mes, ano, toast]);

  useEffect(() => {
    buscarDiasAula();
  }, [buscarDiasAula]);

  const excluirDia = async (dia: string) => {
    if (!confirm(`TEM CERTEZA ABSOLUTA que deseja EXCLUIR o dia ${dia} do calendário da ${turmaSelecionada}?\n\nIsso apagará todas as presenças/faltas gravadas nesse dia para esta turma!`)) {
      return;
    }

    setExcluindoDia(dia);
    try {
      const res = await apiTutor.excluirDiaLetivo(turmaSelecionada, dia);
      if (res.status === "sucesso") {
        toast(`Dia ${dia} excluído com sucesso!`, "success");
        buscarDiasAula();
      } else {
        toast(res.mensagem || "Erro ao excluir o dia", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Erro de conexão ao excluir o dia", "error");
    } finally {
      setExcluindoDia("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white font-display">
          📅 Gestão de Calendário (Dias Letivos)
        </h3>
        <button onClick={buscarDiasAula} className="text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          Atualizar
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-800/30 mb-6">
        Selecione uma turma e mês para visualizar os dias letivos registrados no sistema. Você pode excluir um dia criado por engano.
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={turmaSelecionada}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
        >
          <option value="">-- Selecione a Turma --</option>
          {turmasDisponiveis.length > 0 ? (
            turmasDisponiveis.map(t => (
              <option key={t} value={t}>{t}</option>
            ))
          ) : (
            <>
              <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
              <option value="Turma 2 - 1º Ano">Turma 2 - 1º Ano</option>
              <option value="Turma 3 - 2º Ano">Turma 3 - 2º Ano</option>
              <option value="Turma 4 - 2º Ano">Turma 4 - 2º Ano</option>
            </>
          )}
        </select>

        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>Mês {String(i + 1).padStart(2, '0')}</option>
          ))}
        </select>

        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {!turmaSelecionada ? (
        <div className="text-center py-10 text-slate-500">Selecione uma turma para carregar os dias letivos.</div>
      ) : carregando ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : diasComAula.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          Nenhum dia letivo registrado para esta turma neste mês.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {diasComAula.map(dia => (
            <div key={dia} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative group">
              <span className="font-display font-black text-slate-800 dark:text-white text-lg">{dia.substring(0, 5)}</span>
              <span className="text-xs text-slate-500 font-bold">{dia}</span>

              <button
                onClick={() => excluirDia(dia)}
                disabled={excluindoDia === dia}
                className="mt-2 w-full bg-red-50 text-red-600 hover:text-black hover:bg-red-600 cursor-pointer dark:bg-red-500/10 dark:hover:bg-red-500 dark:text-red-400 font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {excluindoDia === dia ? "..." : "🗑️ Excluir"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
