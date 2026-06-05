"use client";

import { useMemo, useState } from "react";
import { AlunoRankingTutor } from "../types";
import PerfilPublicoModal from "./PerfilPublicoModal";

// Atualização da tipagem local
interface AlunoRankingComAvatar extends AlunoRankingTutor {
  avatar?: string;
}

interface RankingTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carregando: boolean;
  dadosRanking: AlunoRankingComAvatar[];
  filtroTempo: "geral" | "mensal" | "semanal";
  filtroTurma: string;
  setFiltroTurma: (val: string) => void;
  onMudarFiltroTempo: (tempo: "geral" | "mensal" | "semanal") => void;
  onExportarCSV: () => void;
}

export default function RankingTutorModal({
  isOpen,
  onClose,
  carregando,
  dadosRanking,
  filtroTempo,
  filtroTurma,
  setFiltroTurma,
  onMudarFiltroTempo,
  onExportarCSV,
}: RankingTutorModalProps) {
  const [perfilAlvo, setPerfilAlvo] = useState<string | null>(null);

  const turmasRanking = useMemo(() => {
    const turmas = new Set(dadosRanking.map((a) => a.turma));
    return ["Todas", ...Array.from(turmas).sort()];
  }, [dadosRanking]);

  const rankingFiltrado = useMemo(() => {
    let lista = dadosRanking;
    if (filtroTurma !== "Todas")
      lista = dadosRanking.filter((a) => a.turma === filtroTurma);
    return lista.map((aluno, index) => ({ ...aluno, posicao: index + 1 }));
  }, [dadosRanking, filtroTurma]);

  const podio = rankingFiltrado.slice(0, 3);

  const getAvatar = (avatarStr?: string) =>
    avatarStr && avatarStr !== "avatar-padrao" ? avatarStr : "👨‍💻";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[60] overflow-y-auto font-sans flex flex-col transition-colors duration-300">
      <div className="bg-blue-900 dark:bg-slate-900 text-white p-4 sticky top-0 z-20 shadow-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <span>🏆</span> Painel de Relatórios e Rankings
            </h2>
            <p className="text-blue-300 dark:text-blue-400 text-xs transition-colors">
              Visão estratégica de pontuação da escola
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 w-full flex-1">
        {/* FILTROS E AÇÕES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 w-full md:w-auto transition-colors duration-300">
            {(["geral", "mensal", "semanal"] as const).map((tempo) => (
              <button
                key={tempo}
                onClick={() => onMudarFiltroTempo(tempo)}
                className={`cursor-pointer flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  filtroTempo === tempo
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 shadow-sm border border-amber-200 dark:border-amber-700/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {tempo === "geral" ? "Histórico Total" : tempo}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap transition-colors">
              Filtrar por Turma:
            </label>
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="cursor-pointer w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-sm font-bold shadow-sm outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
            >
              {turmasRanking.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={onExportarCSV}
              title="Exportar CSV"
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white p-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center"
            >
              📥
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500 dark:border-amber-400"></div>
          </div>
        ) : rankingFiltrado.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-16 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm transition-colors duration-300">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">
              Nenhum aluno pontuou neste filtro.
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* O PÓDIO VISUAL DO TUTOR COM AVATARES */}
            <div className="xl:col-span-1 bg-gradient-to-b from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-6 shadow-xl text-white relative border dark:border-slate-800 transition-colors duration-300">
              <h3 className="font-black text-lg mb-6 text-center text-slate-200 uppercase tracking-widest">
                Pódio Atual
              </h3>
              <div className="flex justify-center items-end gap-2 h-56 mt-4">
                {podio[1] && (
                  <div
                    onClick={() => setPerfilAlvo(podio[1].matricula)}
                    className="w-1/3 flex flex-col items-center cursor-pointer group hover:-translate-y-2 transition-transform"
                  >
                    <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 -mb-6 border-4 border-slate-400 dark:border-slate-500 relative transition-colors">
                      {getAvatar(podio[1].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-slate-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-800 dark:border-slate-900">
                        2
                      </div>
                    </div>
                    <div className="bg-slate-700/80 dark:bg-slate-800/80 w-full h-28 rounded-t-lg border border-slate-600/50 dark:border-slate-700/50 flex flex-col items-center pt-8 px-1 text-center group-hover:bg-slate-600/80 dark:group-hover:bg-slate-700/80 transition-colors">
                      <p className="font-bold text-[10px] line-clamp-2 text-slate-200">
                        {podio[1].nome}
                      </p>
                      <p className="text-blue-300 font-black mt-auto mb-2 text-xs">
                        {podio[1].xp} XP
                      </p>
                    </div>
                  </div>
                )}
                {podio[0] && (
                  <div
                    onClick={() => setPerfilAlvo(podio[0].matricula)}
                    className="w-1/3 flex flex-col items-center z-10 cursor-pointer group hover:-translate-y-2 transition-transform"
                  >
                    <div className="text-3xl mb-1 filter drop-shadow-md animate-bounce group-hover:scale-125 transition-transform">
                      👑
                    </div>
                    <div className="bg-white dark:bg-slate-800 w-14 h-14 rounded-full flex items-center justify-center text-4xl shadow-xl z-10 -mb-7 border-4 border-amber-400 dark:border-amber-500 relative transition-colors">
                      {getAvatar(podio[0].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-amber-950 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-800 dark:border-slate-900">
                        1
                      </div>
                    </div>
                    <div className="bg-blue-600 dark:bg-blue-700 w-full h-40 rounded-t-lg shadow-2xl border border-blue-500 dark:border-blue-600 flex flex-col items-center pt-10 px-1 text-center group-hover:bg-blue-500 dark:group-hover:bg-blue-600 transition-colors">
                      <p className="font-bold text-xs line-clamp-2 text-white">
                        {podio[0].nome}
                      </p>
                      <p className="text-amber-300 font-black mt-auto mb-3 text-sm">
                        {podio[0].xp} XP
                      </p>
                    </div>
                  </div>
                )}
                {podio[2] && (
                  <div
                    onClick={() => setPerfilAlvo(podio[2].matricula)}
                    className="w-1/3 flex flex-col items-center cursor-pointer group hover:-translate-y-2 transition-transform"
                  >
                    <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 -mb-6 border-4 border-orange-300 dark:border-orange-500 relative transition-colors">
                      {getAvatar(podio[2].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-orange-400 text-orange-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-800 dark:border-slate-900">
                        3
                      </div>
                    </div>
                    <div className="bg-slate-700/60 dark:bg-slate-800/60 w-full h-24 rounded-t-lg border border-slate-600/30 dark:border-slate-700/50 flex flex-col items-center pt-8 px-1 text-center group-hover:bg-slate-600/60 dark:group-hover:bg-slate-700/60 transition-colors">
                      <p className="font-bold text-[10px] line-clamp-2 text-slate-300">
                        {podio[2].nome}
                      </p>
                      <p className="text-orange-300 font-black mt-auto mb-2 text-xs">
                        {podio[2].xp} XP
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TABELA COMPLETA COM AVATARES */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  Lista Geral
                </h3>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full transition-colors">
                  {rankingFiltrado.length} Alunos
                </span>
              </div>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 transition-colors">
                    <tr className="text-slate-500 dark:text-slate-400 text-xs uppercase">
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-800 text-center w-16">
                        Pos
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-800">
                        Aluno
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-800">
                        Turma
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-800">
                        Nível
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-800 text-right">
                        XP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rankingFiltrado.map((aluno) => (
                      <tr
                        key={aluno.matricula}
                        onClick={() => setPerfilAlvo(aluno.matricula)}
                        className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors ${aluno.posicao && aluno.posicao <= 3 ? "bg-amber-50/20 dark:bg-amber-900/10" : ""}`}
                      >
                        <td className="p-3 text-center font-black text-slate-400 dark:text-slate-500">
                          {aluno.posicao}º
                        </td>
                        <td className="p-3">
                          {/* AVATAR + NOME NA TABELA */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-lg shrink-0 transition-colors">
                              {getAvatar(aluno.avatar)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 transition-colors">
                                {aluno.nome}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono transition-colors">
                                {aluno.matricula}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 text-xs transition-colors">
                          {aluno.turma}
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-1 rounded transition-colors">
                            {aluno.nivel}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-black text-emerald-600 dark:text-emerald-500 text-base transition-colors">
                            {aluno.xp}
                          </span>{" "}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 transition-colors">
                            XP
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {perfilAlvo && (
        <PerfilPublicoModal
          matriculaAlvo={perfilAlvo}
          matriculaVisualizador={"1234567"}
          onClose={() => setPerfilAlvo(null)}
        />
      )}
    </div>
  );
}
