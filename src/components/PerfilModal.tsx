"use client";

import { useState } from "react";
import { PerfilAluno } from "../types";
import BadgesGallery from "./BadgesGallery";

interface PerfilModalProps {
  dadosPerfil: PerfilAluno | null;
  carregando: boolean;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (dadosAtualizados: PerfilAluno) => void;
  setDadosPerfil: (dados: PerfilAluno) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dadosBadges: any;
  avatarAtual: string;
  totalCurtidas: number;
  onSalvarAvatar: (avatarId: string) => void;
  ofensivaDias: number; // NOVO: Dias restantes para a ofensiva, se aplicável
}

const GALERIA_AVATARES = [
  // Profissionais e Heróis (Os originais + Novos)
  "👨‍💻",
  "👩‍💻",
  "🧑‍🚀",
  "🧑‍🔬",
  "🕵️",
  "🥷",
  "🦸‍♂️",
  "🦸‍♀️",
  "🤠",

  // Fantasia e Magia
  "🧙‍♂️",
  "🧙‍♀️",
  "🧝‍♂️",
  "🧝‍♀️",
  "🧚",
  "🧛",
  "🧜‍♀️",

  // Sci-Fi e Monstros
  "🤖",
  "👾",
  "👽",
  "👻",
  "🎃",
  "😈",
  "🐲",

  // Animais e Criaturas
  "🦊",
  "🦉",
  "🦖",
  "🦄",
  "🐼",
  "🦁",
  "🐺",
  "🐸",
  "🐙",
  "🐵",
];

export default function PerfilModal({
  dadosPerfil,
  carregando,
  salvando,
  onClose,
  onSalvar,
  setDadosPerfil,
  dadosBadges,
  avatarAtual,
  totalCurtidas,
  onSalvarAvatar,
  ofensivaDias, // NOVO: Dias restantes para a ofensiva, se aplicável
  
}: PerfilModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<"dados" | "avatar" | "badges">(
    "dados",
  );
  const avatarExibicao =
    avatarAtual && avatarAtual !== "avatar-padrao" ? avatarAtual : "";

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] select-text">
        {/* CABEÇALHO DO PERFIL COM AVATAR */}
        <div className="bg-blue-900 p-6 text-white flex flex-col md:flex-row items-center md:items-start gap-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-3xl leading-none hover:text-blue-200 transition-colors"
          >
            &times;
          </button>

          <div className="w-24 h-24 bg-white/20 rounded-full border-4 border-white flex items-center justify-center text-5xl shadow-lg shrink-0">
            {avatarExibicao}
          </div>

          <div className="text-center md:text-left flex-1 mt-2 md:mt-0">
            <h2 className="font-black text-2xl">
              {dadosPerfil?.nome || "Carregando..."}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                {dadosPerfil?.turma}
              </span>
              <span className="bg-emerald-500/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-400">
                ⭐ {dadosBadges?.xpTotal || 0} XP
              </span>
              <span className="bg-pink-500/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-pink-400">
                ❤️ {totalCurtidas} Curtidas
              </span>
              {ofensivaDias > 0 && (
                <span className="bg-orange-500/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-orange-400">
                  🔥 {ofensivaDias} Dias
                </span>
              )}
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setAbaAtiva("dados")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${abaAtiva === "dados" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
          >
            👤 Meus Dados
          </button>
          <button
            onClick={() => setAbaAtiva("avatar")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${abaAtiva === "avatar" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
          >
            🎭 Avatar
          </button>
          <button
            onClick={() => setAbaAtiva("badges")}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${abaAtiva === "badges" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
          >
            🏆 Conquistas
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          {carregando ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
            </div>
          ) : dadosPerfil ? (
            <>
              {/* ABA 1: DADOS E CONTATOS (Mantido o seu form exato) */}
              {abaAtiva === "dados" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSalvar(dadosPerfil);
                  }}
                  className="space-y-4 animate-in slide-in-from-left-4"
                >
                  <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 mb-4 leading-relaxed">
                    <strong>Aviso de Segurança:</strong> Você tem permissão
                    apenas para atualizar os seus números de telefone de
                    contato.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.nome}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Matrícula
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.matricula}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        E-mail Institucional
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.email}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Data de Nasc.
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.dataNasc}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Turma Atual
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.turma}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                        Telefone (Seu)
                      </label>
                      <input
                        type="tel"
                        value={dadosPerfil.telefoneAluno}
                        onChange={(e) =>
                          setDadosPerfil({
                            ...dadosPerfil,
                            telefoneAluno: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded-lg p-2.5 text-sm outline-none transition-colors"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                        Telefone (Responsável)
                      </label>
                      <input
                        type="tel"
                        value={dadosPerfil.telefoneResponsavel}
                        onChange={(e) =>
                          setDadosPerfil({
                            ...dadosPerfil,
                            telefoneResponsavel: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded-lg p-2.5 text-sm outline-none transition-colors"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md disabled:bg-slate-400 transition-colors"
                    >
                      {salvando ? "Salvando..." : "Atualizar Contactos"}
                    </button>
                  </div>
                </form>
              )}

              {/* ABA 2: ESCOLHER AVATAR */}
              {abaAtiva === "avatar" && (
                <div className="animate-in slide-in-from-right-4">
                  <h3 className="font-bold text-slate-800 mb-2">
                    Escolha a sua Identidade Visual
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Este avatar aparecerá no Ranking e no seu Perfil Público
                    para todos os colegas.
                  </p>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                    {GALERIA_AVATARES.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onSalvarAvatar(emoji)}
                        className={`text-4xl p-3 rounded-2xl transition-all aspect-square flex items-center justify-center border-4 ${avatarExibicao === emoji ? "bg-blue-100 border-blue-500 scale-110 shadow-lg" : "bg-white border-slate-200 hover:border-blue-300 hover:scale-105 hover:bg-slate-100"}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 3: A SUA BADGES GALLERY INTACTA */}
              {abaAtiva === "badges" && (
                <div className="animate-in slide-in-from-bottom-4">
                  {dadosBadges && <BadgesGallery dados={dadosBadges} />}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-red-500 font-bold py-8">
              Erro ao carregar dados do perfil.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
