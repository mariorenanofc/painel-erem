"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PerfilAluno } from "@/src/types";
import { DadosParaBadges } from "@/src/utils/badges";
import BadgesGallery from "./BadgesGallery";

interface PerfilModalProps {
  dadosPerfil: PerfilAluno | null;
  dadosBadges: DadosParaBadges | null;
  carregando: boolean;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (novosDados: PerfilAluno) => void;
  setDadosPerfil: (dados: PerfilAluno | null) => void;
  avatarAtual: string;
  totalCurtidas: number;
  onSalvarAvatar: (emoji: string) => void;
  ofensivaDias: number;
}

const GALERIA_AVATARES = [
  "👨‍💻", "👩‍💻", "🚀", "🛸", "🤖", "👾", "🦊", "🦁", "🐼", "🐨",
  "🐯", "🐲", "🧙‍♂️", "🧙‍♀️", "🦸‍♂️", "🦸‍♀️", "👻", "🦄", "🍕", "🎨"
];

const BACKGROUND_OPTIONS = [
  { id: "constellation", name: "Constelação Conectada", emoji: "🌌", desc: "Teia de partículas 3D com conexões e atração gravitacional." },
  { id: "aurora", name: "Fitas de Aurora", emoji: "🧬", desc: "Ondas e fitas paralelas flutuantes e senoidais." },
  { id: "matrix", name: "Chuva de Código", emoji: "💾", desc: "Fluxos de números binários descendo sutilmente pelo fundo." },
  { id: "vortex", name: "Vórtice Espacial", emoji: "🌀", desc: "Redemoinho de poeira estelar orbitando o centro da tela." },
  { id: "tech", name: "Ícones Tech", emoji: "🛠️", desc: "Formas tridimensionais em wireframe flutuando em gravidade zero." },
  { id: "none", name: "Apenas Blobs", emoji: "❌", desc: "Desativa as animações WebGL, mantendo apenas as cores em degrade." }
];

export default function PerfilModal({
  dadosPerfil,
  dadosBadges,
  carregando,
  salvando,
  onClose,
  onSalvar,
  setDadosPerfil,
  avatarAtual,
  totalCurtidas,
  onSalvarAvatar,
  ofensivaDias,
}: PerfilModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<"dados" | "avatar" | "badges" | "aparencia">("dados");
  const [selectedBg, setSelectedBg] = useState("constellation");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelectedBg(localStorage.getItem("interactiveBg") || "constellation");
    }
  }, []);

  const handleBgSelect = (id: string) => {
    localStorage.setItem("interactiveBg", id);
    setSelectedBg(id);
    window.dispatchEvent(new Event("bg-change"));
  };

  const avatarExibicao = avatarAtual && avatarAtual !== "avatar-padrao" ? avatarAtual : "👤";

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in transition-colors duration-300">
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel-heavy w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] select-text border border-slate-200 dark:border-white/5 transition-colors duration-300"
      >
        {/* HEADER DO MODAL */}
        <div className="bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-secondary dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-900 p-6 text-white flex flex-col md:flex-row items-center md:items-start gap-6 relative shrink-0 transition-colors duration-300">
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="cursor-pointer absolute top-4 right-4 text-3xl leading-none text-white/70 hover:text-white transition-colors"
          >
            &times;
          </motion.button>

          <div className="w-24 h-24 bg-white/10 dark:bg-slate-900/30 rounded-3xl border-2 border-white/60 dark:border-white/10 flex items-center justify-center text-5xl shadow-lg shrink-0 backdrop-blur-sm">
            {avatarExibicao}
          </div>

          <div className="text-center md:text-left flex-1 mt-2 md:mt-0">
            <h2 className="font-display font-black text-2xl tracking-tight leading-tight">
              {dadosPerfil?.nome || "Carregando..."}
            </h2>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <span className="bg-white/15 border border-white/20 text-white font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                🏫 {dadosPerfil?.turma || "Visitante"}
              </span>
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                ⭐ {dadosBadges?.xpTotal || 0} XP
              </span>
              <span className="bg-pink-500/20 border border-pink-500/40 text-pink-300 dark:text-pink-400 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                ❤️ {totalCurtidas} Curtidas
              </span>
              {ofensivaDias > 0 && (
                <span className="bg-orange-500/20 border border-orange-500/40 text-orange-300 dark:text-orange-400 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                  🔥 {ofensivaDias} Dias
                </span>
              )}
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 shrink-0 transition-colors duration-300 font-sans">
          {[
            { id: "dados", label: "👤 Meus Dados" },
            { id: "avatar", label: "🎭 Avatar" },
            { id: "badges", label: "🏆 Conquistas" },
            { id: "aparencia", label: "🎨 Aparência" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`cursor-pointer flex-1 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all duration-200 ${
                abaAtiva === tab.id
                  ? "border-brand-primary text-brand-primary dark:text-brand-secondary bg-white/70 dark:bg-slate-900/60"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTEÚDO DO PANEL */}
        <div className="p-6 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/20 flex-1 transition-colors duration-300 select-none">
          {carregando ? (
            <div className="flex justify-center py-16">
              <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : dadosPerfil ? (
            <>
              {/* TAB 1: MEUS DADOS */}
              {abaAtiva === "dados" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSalvar(dadosPerfil);
                  }}
                  className="space-y-4 animate-in fade-in duration-300"
                >
                  <div className="bg-amber-50 dark:bg-amber-955/20 text-amber-800 dark:text-amber-300 text-xs p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 mb-4 leading-relaxed transition-colors font-medium">
                    <strong>⚠️ Permissão Restrita:</strong> Por motivos de segurança escolar, dados cadastrais principais são editáveis somente pela Gestão. Você tem permissão apenas para atualizar os seus telefones de contato.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.nome}
                        disabled
                        className="w-full bg-slate-200/50 dark:bg-slate-950/20 border border-slate-300/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed font-medium"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Matrícula
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.matricula}
                        disabled
                        className="w-full bg-slate-200/50 dark:bg-slate-950/20 border border-slate-300/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed font-mono font-medium"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        E-mail Institucional
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.email || "Não informado"}
                        disabled
                        className="w-full bg-slate-200/50 dark:bg-slate-950/20 border border-slate-300/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed font-mono font-medium"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Data de Nascimento
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.dataNasc}
                        disabled
                        className="w-full bg-slate-200/50 dark:bg-slate-950/20 border border-slate-300/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed font-medium"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Turma Atual
                      </label>
                      <input
                        type="text"
                        value={dadosPerfil.turma}
                        disabled
                        className="w-full bg-slate-200/50 dark:bg-slate-950/20 border border-slate-300/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-brand-primary dark:text-brand-secondary uppercase tracking-widest mb-1.5">
                        Telefone do Aluno
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
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm transition-all"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-brand-primary dark:text-brand-secondary uppercase tracking-widest mb-1.5">
                        Telefone do Responsável
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
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm transition-all"
                        placeholder="(87) 9XXXX-XXXX"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={salvando}
                      className="cursor-pointer bg-gradient-to-r from-brand-primary to-indigo-650 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {salvando ? "Salvando..." : "Atualizar Contato"}
                    </motion.button>
                  </div>
                </form>
              )}

              {/* TAB 2: SELEÇÃO DE AVATAR */}
              {abaAtiva === "avatar" && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">
                    Escolha a sua Identidade Visual
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
                    Este avatar aparecerá no Ranking e no seu Perfil para todos os colegas do Trilha Tech.
                  </p>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3.5">
                    {GALERIA_AVATARES.map((emoji) => (
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        key={emoji}
                        onClick={() => onSalvarAvatar(emoji)}
                        className={`text-4xl p-3 rounded-2xl transition-all aspect-square flex items-center justify-center border-2 ${
                          avatarExibicao === emoji
                            ? "bg-brand-primary/20 border-brand-primary dark:border-brand-secondary scale-105 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-brand-primary/40 hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CONQUISTAS (BADGES) */}
              {abaAtiva === "badges" && (
                <div className="animate-in fade-in duration-300">
                  {dadosBadges && <BadgesGallery dados={dadosBadges} />}
                </div>
              )}

              {/* TAB 4: APARÊNCIA / CUSTOMIZAÇÃO DO DECORATIVE BACKGROUND */}
              {abaAtiva === "aparencia" && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">
                      Escolha o seu Fundo Interativo 3D
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium font-sans">
                      Personalize a experiência do seu painel com diferentes efeitos 3D acelerados por GPU. O fundo se adaptará instantaneamente ao ser selecionado.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BACKGROUND_OPTIONS.map((opt) => (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        key={opt.id}
                        onClick={() => handleBgSelect(opt.id)}
                        className={`cursor-pointer p-4 rounded-2xl text-left border flex gap-4 transition-all duration-200 relative overflow-hidden ${
                          selectedBg === opt.id
                            ? "bg-indigo-500/10 border-brand-primary dark:border-brand-secondary ring-1 ring-brand-primary/30"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        {/* Glow indicator on selected item */}
                        {selectedBg === opt.id && (
                          <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-cyan-400" />
                        )}

                        <span className="text-3xl p-2 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0 w-12 h-12">
                          {opt.emoji}
                        </span>
                        
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            {opt.name}
                          </h4>
                          <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-400 font-medium">
                            {opt.desc}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-red-500 dark:text-red-400 font-bold py-8">
              Erro ao carregar dados do perfil.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
