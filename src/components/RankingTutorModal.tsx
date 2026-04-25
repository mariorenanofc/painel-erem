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
    <div className="fixed inset-0 bg-slate-100 z-50 overflow-y-auto font-sans flex flex-col">
      <div className="bg-blue-900 text-white p-4 sticky top-0 z-20 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <span>🏆</span> Painel de Relatórios e Rankings
            </h2>
            <p className="text-blue-300 text-xs">
              Visão estratégica de pontuação da escola
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 w-full flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto">
            {(["geral", "mensal", "semanal"] as const).map((tempo) => (
              <button
                key={tempo}
                onClick={() => onMudarFiltroTempo(tempo)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filtroTempo === tempo ? "bg-amber-100 text-amber-700 shadow-sm border border-amber-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              >
                {tempo === "geral" ? "Histórico Total" : tempo}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <label className="text-sm font-bold text-slate-500 whitespace-nowrap">
              Filtrar por Turma:
            </label>
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="w-full md:w-64 bg-white border border-slate-300 text-slate-800 rounded-lg p-2 text-sm font-bold shadow-sm outline-none focus:border-amber-500"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center"
            >
              📥
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500"></div>
          </div>
        ) : rankingFiltrado.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-bold text-slate-700">
              Nenhum aluno pontuou neste filtro.
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* O NOVO PÓDIO VISUAL DO TUTOR COM AVATARES */}
            <div className="xl:col-span-1 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl text-white relative">
              <h3 className="font-black text-lg mb-6 text-center text-slate-200 uppercase tracking-widest">
                Pódio Atual
              </h3>
              <div className="flex justify-center items-end gap-2 h-56 mt-4">
                {podio[1] && (
                  <div
                    onClick={() => setPerfilAlvo(podio[1].matricula)}
                    className="w-1/3 flex flex-col items-center cursor-pointer group hover:-translate-y-2 transition-transform"
                  >
                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 -mb-6 border-4 border-slate-400 relative">
                      {getAvatar(podio[1].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-slate-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-800">
                        2
                      </div>
                    </div>
                    <div className="bg-slate-700/80 w-full h-28 rounded-t-lg border border-slate-600/50 flex flex-col items-center pt-8 px-1 text-center group-hover:bg-slate-600/80">
                      <p className="font-bold text-[10px] line-clamp-2">
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
                    <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center text-4xl shadow-xl z-10 -mb-7 border-4 border-amber-400 relative">
                      {getAvatar(podio[0].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-amber-950 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-800">
                        1
                      </div>
                    </div>
                    <div className="bg-blue-600 w-full h-40 rounded-t-lg shadow-2xl border border-blue-500 flex flex-col items-center pt-10 px-1 text-center group-hover:bg-blue-500">
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
                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 -mb-6 border-4 border-orange-300 relative">
                      {getAvatar(podio[2].avatar)}
                      <div className="absolute -bottom-1 -right-1 bg-orange-400 text-orange-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-800">
                        3
                      </div>
                    </div>
                    <div className="bg-slate-700/60 w-full h-24 rounded-t-lg border border-slate-600/30 flex flex-col items-center pt-8 px-1 text-center group-hover:bg-slate-600/60">
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
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">
                  Lista Geral
                </h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  {rankingFiltrado.length} Alunos
                </span>
              </div>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr className="text-slate-500 text-xs uppercase">
                      <th className="p-3 font-bold border-b border-slate-200 text-center w-16">
                        Pos
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200">
                        Aluno
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200">
                        Turma
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200">
                        Nível
                      </th>
                      <th className="p-3 font-bold border-b border-slate-200 text-right">
                        XP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingFiltrado.map((aluno) => (
                      <tr
                        key={aluno.matricula}
                        onClick={() => setPerfilAlvo(aluno.matricula)}
                        className={`cursor-pointer hover:bg-blue-50 transition-colors ${aluno.posicao && aluno.posicao <= 3 ? "bg-amber-50/20" : ""}`}
                      >
                        <td className="p-3 text-center font-black text-slate-400">
                          {aluno.posicao}º
                        </td>
                        <td className="p-3">
                          {/* AVATAR + NOME NA TABELA */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-lg shrink-0">
                              {getAvatar(aluno.avatar)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">
                                {aluno.nome}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {aluno.matricula}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 text-xs">
                          {aluno.turma}
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                            {aluno.nivel}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-black text-emerald-600 text-base">
                            {aluno.xp}
                          </span>{" "}
                          <span className="text-[10px] text-slate-400">XP</span>
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
