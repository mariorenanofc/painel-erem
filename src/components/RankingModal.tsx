"use client";

import { useState, useEffect } from "react";
import { DadosAluno, AlunoRanking } from "../types";
import PerfilPublicoModal from "./PerfilPublicoModal";
import { apiTutor } from "@/src/services/api";

interface AlunoRankingComAvatar extends AlunoRanking {
  avatar?: string;
}

interface RankingModalProps {
  aluno: DadosAluno;
  onClose: () => void;
}

export default function RankingModal({ aluno, onClose }: RankingModalProps) {
  const [dadosRanking, setDadosRanking] = useState<AlunoRankingComAvatar[]>([]);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [abaRanking, setAbaRanking] = useState<"Geral" | "Turma">("Geral");
  const [filtroTempo, setFiltroTempo] = useState<
    "geral" | "semanal" | "mensal"
  >("geral");

  const [perfilAlvo, setPerfilAlvo] = useState<string | null>(null);

  const carregarRanking = async (
    tempoSelecionado: "geral" | "semanal" | "mensal",
  ) => {
    setCarregandoRanking(true);
    try {
      //  CHAMADA LIMPA DA API
      const data = await apiTutor.buscarRanking(tempoSelecionado);

      if (data.status === "sucesso") setDadosRanking(data.ranking);
      else alert("⚠️ " + data.mensagem);
    } catch {
      alert("❌ Erro ao buscar ranking.");
    } finally {
      setCarregandoRanking(false);
    }
  };

  useEffect(() => {
    carregarRanking(filtroTempo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mudarFiltroTempo = (novoTempo: "geral" | "semanal" | "mensal") => {
    setFiltroTempo(novoTempo);
    carregarRanking(novoTempo);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 md:p-5 border-b flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="font-black text-lg md:text-xl flex items-center gap-2">
              <span>🏆</span> Leaderboard
            </h2>
            <p className="text-amber-100 text-[10px] md:text-xs mt-1">
              Os maiores pontuadores do Trilha Tech
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl leading-none hover:text-amber-200 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="flex bg-slate-100 border-b border-slate-200 shrink-0">
          <button
            onClick={() => setAbaRanking("Geral")}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${abaRanking === "Geral" ? "bg-white text-amber-600 border-b-2 border-amber-500" : "text-slate-500 hover:bg-slate-200"}`}
          >
            🌎 Ranking Geral
          </button>
          <button
            onClick={() => setAbaRanking("Turma")}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${abaRanking === "Turma" ? "bg-white text-amber-600 border-b-2 border-amber-500" : "text-slate-500 hover:bg-slate-200"}`}
          >
            👥 Minha Turma
          </button>
        </div>

        <div className="bg-white px-4 py-3 flex justify-center gap-2 border-b border-slate-100 shadow-sm z-10 shrink-0">
          <button
            onClick={() => mudarFiltroTempo("geral")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroTempo === "geral" ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"}`}
          >
            Histórico Total
          </button>
          <button
            onClick={() => mudarFiltroTempo("mensal")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroTempo === "mensal" ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"}`}
          >
            Este Mês
          </button>
          <button
            onClick={() => mudarFiltroTempo("semanal")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroTempo === "semanal" ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"}`}
          >
            Esta Semana
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
          {carregandoRanking ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-amber-500"></div>
            </div>
          ) : dadosRanking.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-4xl mb-3 opacity-50">📭</div>
              <p className="text-slate-500 font-medium">
                Nenhum aluno pontuou neste período ainda.
              </p>
              <p className="text-slate-400 text-xs mt-2">
                Corra e faça a primeira entrega para garantir o topo!
              </p>
            </div>
          ) : (
            <div className="p-3 md:p-4 space-y-3">
              {(() => {
                const minhaTurmaTrilha = dadosRanking.find(
                  (r) => r.matricula === aluno.matricula,
                )?.turma;
                const listaExibicao =
                  abaRanking === "Geral"
                    ? dadosRanking
                    : dadosRanking
                        .filter((r) => r.turma === minhaTurmaTrilha)
                        .map((r, index) => ({ ...r, posicao: index + 1 }));

                if (abaRanking === "Turma" && !minhaTurmaTrilha)
                  return (
                    <p className="text-center text-slate-500 py-8">
                      Não foi possível identificar a sua turma.
                    </p>
                  );
                if (listaExibicao.length === 0)
                  return (
                    <p className="text-center text-slate-500 py-8">
                      Ninguém da sua turma pontuou ainda.
                    </p>
                  );

                return listaExibicao.map((userRank) => {
                  const isMe = userRank.matricula === aluno.matricula;
                  let medalha = "";
                  let corFundo = "bg-white border-slate-200";
                  let destaqueNome = "text-slate-800";
                  if (userRank.posicao === 1) {
                    medalha = "🥇";
                    corFundo = "bg-amber-100 border-amber-300 shadow-sm";
                    destaqueNome = "text-amber-900";
                  } else if (userRank.posicao === 2) {
                    medalha = "🥈";
                    corFundo = "bg-slate-200 border-slate-300 shadow-sm";
                    destaqueNome = "text-slate-800";
                  } else if (userRank.posicao === 3) {
                    medalha = "🥉";
                    corFundo = "bg-orange-100 border-orange-200 shadow-sm";
                    destaqueNome = "text-orange-900";
                  }
                  if (isMe && userRank.posicao > 3) {
                    corFundo = "bg-blue-50 border-blue-400 shadow-md";
                    destaqueNome = "text-blue-800";
                  }

                  const avatarExibicao =
                    userRank.avatar && userRank.avatar !== "avatar-padrao"
                      ? userRank.avatar
                      : "👨‍💻";

                  return (
                    <div
                      key={userRank.matricula}
                      onClick={() => setPerfilAlvo(userRank.matricula)}
                      className={`flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${corFundo}`}
                    >
                      <div className="flex items-center justify-center gap-2 shrink-0 w-16 md:w-20">
                        <div className="w-5 text-center font-black text-slate-500 text-sm md:text-base">
                          {medalha || `${userRank.posicao}º`}
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/70 border border-slate-200 rounded-full flex items-center justify-center text-2xl shadow-sm">
                          {avatarExibicao}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-bold text-sm md:text-base truncate ${destaqueNome}`}
                        >
                          {userRank.nome}{" "}
                          {isMe && (
                            <span className="text-[9px] md:text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1 md:ml-2 shadow-sm align-middle shrink-0">
                              VOCÊ
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {userRank.turma} • {userRank.nivel}
                        </p>
                      </div>

                      <div className="text-right bg-white/60 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/50 whitespace-nowrap shrink-0">
                        <span className="font-black text-amber-600 text-base md:text-lg">
                          {userRank.xp}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-slate-500 ml-1 font-bold uppercase tracking-wider">
                          XP
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {perfilAlvo && (
        <PerfilPublicoModal
          matriculaAlvo={perfilAlvo}
          matriculaVisualizador={aluno.matricula}
          onClose={() => setPerfilAlvo(null)}
        />
      )}
    </div>
  );
}
