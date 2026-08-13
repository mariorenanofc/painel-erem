/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import { apiGeral, apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import { motion } from "framer-motion";

// Novos Componentes do Super Painel
import AbaFrequencia from "@/src/components/admin/AbaFrequencia";
import AbaAlunos from "@/src/components/admin/AbaAlunos";
import AbaAtividades from "@/src/components/admin/AbaAtividades";
import AbaEntregas from "@/src/components/admin/AbaEntregas";
import AbaRifas from "@/src/components/admin/AbaRifas";
import AbaCurtidas from "@/src/components/admin/AbaCurtidas";
export default function ConfiguracoesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [nomeUsuario] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioLogado") || ""
      : "",
  );
  const [montado, setMontado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<
    | "alunos"
    | "frequencia"
    | "atividades"
    | "entregas"
    | "rifas"
    | "curtidas"
    | "geral"
    | "links"
    | "modulos"
    | "usuarios"
    | "seguranca"
    | "onboarding"
  >("geral");

  // States para Controle de Módulos
  const [modulosDb, setModulosDb] = useState<any[]>([]);
  const [novoNomeMod, setNovoNomeMod] = useState("");
  const [novoStatusMod, setNovoStatusMod] = useState("Aberto");
  const [novaTurmaMod, setNovaTurmaMod] = useState("Todas");

  // States para Usuários (Tutores)
  const [usuariosDb, setUsuariosDb] = useState<any[]>([]);
  const [novoUsuario, setNovoUsuario] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoNomeUsuario, setNovoNomeUsuario] = useState("");

  // States para Segurança
  const [logsSeguranca, setLogsSeguranca] = useState<any[]>([]);

  // Estado das Configurações
  const [configs, setConfigs] = useState<Record<string, string>>({
    NOME_ESCOLA: "",
    NOME_PROJETO: "",
    TURMAS_PROJETO: "",
    LINK_WPP_T1: "",
    LINK_WPP_T2: "",
    SENHA_CHECKIN: "",
    LIMITE_XP_DIARIO: "",
    LIMITE_PIX_DIARIO: "",
    MODO_REPOSICAO: "DESLIGADO",
    LINK_PLANILHA: "",
    LINK_CLASSROOM: "",
    LINK_MATRIZ: "",
    LINK_AJUDA: "",
    LINK_CRONOGRAMA: "",
  });

  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) {
      window.location.href = "/";
      return;
    }

    const buscarDados = async () => {
      try {
        const res = await apiGeral.buscarConfiguracoes();

        if (res.status === "sucesso" && res.configuracoes) {
          const dados = res.configuracoes;

          const formatarTurmas = (t: any) => {
            if (!t) return "";
            if (Array.isArray(t)) return t.join(", ");
            return String(t);
          };

          setConfigs((prev) => ({
            ...prev,
            NOME_ESCOLA:
              dados.NOME_ESCOLA || dados.nomeEscola || prev.NOME_ESCOLA,
            NOME_PROJETO:
              dados.NOME_PROJETO || dados.nomeProjeto || prev.NOME_PROJETO,
            TURMAS_PROJETO:
              dados.TURMAS_PROJETO ||
              formatarTurmas(dados.turmas) ||
              prev.TURMAS_PROJETO,
            LINK_WPP_T1: dados.LINK_WPP_T1 || prev.LINK_WPP_T1,
            LINK_WPP_T2: dados.LINK_WPP_T2 || prev.LINK_WPP_T2,
            SENHA_CHECKIN:
              dados.SENHA_CHECKIN || dados.senhaLousa || prev.SENHA_CHECKIN,
            LIMITE_XP_DIARIO:
              dados.LIMITE_XP_DIARIO !== undefined
                ? String(dados.LIMITE_XP_DIARIO)
                : prev.LIMITE_XP_DIARIO,
            LIMITE_PIX_DIARIO:
              dados.LIMITE_PIX_DIARIO !== undefined
                ? String(dados.LIMITE_PIX_DIARIO)
                : prev.LIMITE_PIX_DIARIO,
            MODO_REPOSICAO:
              dados.MODO_REPOSICAO ||
              dados.modoReposicao ||
              prev.MODO_REPOSICAO,
            LINK_PLANILHA:
              dados.LINK_PLANILHA || dados.linkPlanilha || prev.LINK_PLANILHA,
            LINK_CLASSROOM:
              dados.LINK_CLASSROOM ||
              dados.linkClassroom ||
              prev.LINK_CLASSROOM,
            LINK_MATRIZ:
              dados.LINK_MATRIZ || dados.linkMatriz || prev.LINK_MATRIZ,
            LINK_AJUDA: dados.LINK_AJUDA || dados.linkAjuda || prev.LINK_AJUDA,
            LINK_CRONOGRAMA:
              dados.LINK_CRONOGRAMA ||
              dados.linkCronograma ||
              prev.LINK_CRONOGRAMA,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar configurações iniciais", error);
        toast(
          "Falha ao carregar as suas configurações atuais.",
          "error",
          "Erro de Rede",
        );
      } finally {
        setCarregando(false);
        if (!configs.LINK_PLANILHA) {
          setAbaAtiva("onboarding");
        }
      }
    };

    buscarDados();
  }, [configs.LINK_PLANILHA, nomeUsuario, toast]);

  const handleChange = (chave: string, valor: string) => {
    setConfigs((prev) => ({ ...prev, [chave]: valor }));
  };

  const carregarModulosDb = async () => {
    try {
      const res = await fetch("/api/tutor/modulos");
      const data = await res.json();
      if (data.modulos) setModulosDb(data.modulos);
    } catch (e) { console.error(e); }
  };

  const carregarUsuariosDb = async () => {
    try {
      const res = await fetch("/api/tutor/usuarios");
      const data = await res.json();
      if (data.usuarios) setUsuariosDb(data.usuarios);
    } catch (e) { console.error(e); }
  };

  const carregarLogsSeguranca = async () => {
    try {
      const res = await fetch("/api/tutor/seguranca");
      const data = await res.json();
      if (data.logs) setLogsSeguranca(data.logs);
    } catch (e) { console.error(e); }
  };

  const adicionarModuloDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeMod) return;
    try {
      await fetch("/api/tutor/modulos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adicionar", nomeMod: novoNomeMod, statusMod: novoStatusMod, turmaMod: novaTurmaMod })
      });
      setNovoNomeMod(""); carregarModulosDb();
    } catch (e) { console.error(e); }
  };

  const atualizarStatusModDb = async (id: string, statusMod: string) => {
    try {
      await fetch("/api/tutor/modulos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "atualizar_status", id, statusMod })
      });
      carregarModulosDb();
    } catch (e) { console.error(e); }
  };

  const removerModuloDb = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta regra de módulo?")) return;
    try {
      await fetch("/api/tutor/modulos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remover", id })
      });
      carregarModulosDb();
    } catch (e) { console.error(e); }
  };

  const adicionarUsuarioDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoUsuario || !novaSenha || !novoNomeUsuario) return;
    try {
      await fetch("/api/tutor/usuarios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adicionar", usuario: novoUsuario, senha: novaSenha, nome: novoNomeUsuario })
      });
      setNovoUsuario(""); setNovaSenha(""); setNovoNomeUsuario(""); carregarUsuariosDb();
    } catch (e) { console.error(e); }
  };

  const removerUsuarioDb = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este tutor?")) return;
    try {
      await fetch("/api/tutor/usuarios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remover", id })
      });
      carregarUsuariosDb();
    } catch (e) { console.error(e); }
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    try {
      const res = await apiTutor.salvarConfiguracoes(configs);
      if (res.status === "sucesso") {
        toast(
          "Suas definições foram guardadas em segurança no banco de dados.",
          "success",
          "Configurações Salvas!",
        );
      } else {
        toast(res.mensagem, "warning", "Ops!");
      }
    } catch (e) {
      toast(
        "Erro de conexão ao tentar salvar as configurações.",
        "error",
        "Erro",
      );
    } finally {
      setSalvando(false);
    }
  };

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"></div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 dark:bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* HEADER CONTROLS */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 pt-6 relative z-10">
        <Header
          carregando={carregando}
          nomeUsuario={nomeUsuario}
          onLogout={() => {
            fetch("/api/action-proxy", { method: "POST", body: JSON.stringify({ action: "logout" }) }).then(() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            });
          }}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mt-8 mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/trilhatech/aulas")}
              className="cursor-pointer text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              ← Voltar
            </motion.button>
            <div className="text-left">
              <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
                Painel de Configurações
                <span className="text-[9px] font-black tracking-widest uppercase bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-lg border border-blue-500/20 dark:border-blue-900/10 shadow-sm align-middle">
                  System Settings
                </span>
              </h2>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={salvarConfiguracoes}
            disabled={salvando}
            className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-110 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            {salvando ? "Salvando..." : "💾 Salvar Alterações"}
          </motion.button>
        </div>
      </div>

      {/* SYSTEM CONFIGURATION CONTENT */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* MENU LATERAL DE ABAS */}
          <div className="lg:col-span-1 space-y-2">
            <div className="mb-6">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Gestão de Dados</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setAbaAtiva("alunos")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "alunos"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  👥 Alunos & Gamificação
                </button>
                <button
                  onClick={() => setAbaAtiva("frequencia")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "frequencia"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  📅 Diário (Dias & Logs)
                </button>
                <button
                  onClick={() => setAbaAtiva("atividades")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "atividades"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  📚 Atividades & Gabaritos
                </button>
                <button
                  onClick={() => setAbaAtiva("entregas")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "entregas"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  📤 Entregas (Projetos)
                </button>
                <button
                  onClick={() => setAbaAtiva("rifas")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "rifas"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  🎟️ Rifas e Sorteios
                </button>
                <button
                  onClick={() => setAbaAtiva("curtidas")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "curtidas"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  ❤️ Pix de XP (Transações)
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Configurações de Sistema</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setAbaAtiva("geral")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "geral"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  ⚙️ Ajustes Gerais
                </button>
                <button
                  onClick={() => setAbaAtiva("links")}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "links"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  🔗 Links e WhatsApp
                </button>
                <button
                  onClick={() => {
                    setAbaAtiva("modulos");
                    carregarModulosDb();
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "modulos"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  📚 Módulos & SIEPE
                </button>
                <button
                  onClick={() => {
                    setAbaAtiva("usuarios");
                    carregarUsuariosDb();
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "usuarios"
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  👥 Usuários (Tutores)
                </button>
                <button
                  onClick={() => {
                    setAbaAtiva("seguranca");
                    carregarLogsSeguranca();
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all text-xs uppercase tracking-wider border ${
                    abaAtiva === "seguranca"
                      ? "bg-red-600 border-red-700 text-white shadow-md"
                      : "bg-white/80 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  🛡️ Logs de Segurança
                </button>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setAbaAtiva("onboarding")}
                className={`w-full text-left px-5 py-4 rounded-xl font-black transition-all text-xs uppercase tracking-wider border ${
                  abaAtiva === "onboarding"
                    ? "bg-amber-500 border-amber-600 text-white shadow-md"
                    : "bg-amber-500/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-900/10 hover:scale-[1.02]"
                }`}
              >
                🚀 Guia de 1º Acesso
              </button>
            </div>
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] shadow-lg border border-slate-200/60 dark:border-white/5 p-6 md:p-8 backdrop-blur-md">
              {carregando ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 text-left">
                  {/* NOVOS COMPONENTES DO SUPER PAINEL */}
                  {abaAtiva === "frequencia" && <AbaFrequencia />}
                  {abaAtiva === "alunos" && <AbaAlunos />}
                  {abaAtiva === "atividades" && <AbaAtividades />}
                  {abaAtiva === "entregas" && <AbaEntregas />}
                  {abaAtiva === "rifas" && <AbaRifas />}
                  {abaAtiva === "curtidas" && <AbaCurtidas />}

                  {/* CONTEÚDO: GERAL */}
                  {abaAtiva === "geral" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 font-display">
                        Ajustes Gerais da Escola
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase mb-2">
                            Nome da Escola
                          </label>
                          <input
                            type="text"
                            value={configs.NOME_ESCOLA}
                            onChange={(e) => handleChange("NOME_ESCOLA", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Nome do Projeto
                          </label>
                          <input
                            type="text"
                            value={configs.NOME_PROJETO}
                            onChange={(e) => handleChange("NOME_PROJETO", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Turmas do Projeto (Separadas por vírgula)
                          </label>
                          <input
                            type="text"
                            value={configs.TURMAS_PROJETO}
                            onChange={(e) => handleChange("TURMAS_PROJETO", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Senha do Check-in Presencial
                          </label>
                          <input
                            type="text"
                            value={configs.SENHA_CHECKIN}
                            onChange={(e) => handleChange("SENHA_CHECKIN", e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold font-mono focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Modo Reposição
                          </label>
                          <div className="relative">
                            <select
                              value={configs.MODO_REPOSICAO}
                              onChange={(e) => handleChange("MODO_REPOSICAO", e.target.value)}
                              className="cursor-pointer w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3.5 pr-10 font-bold focus:border-blue-555 outline-none transition-all appearance-none shadow-sm"
                            >
                              <option value="LIGADO" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">LIGADO (Ignora dias letivos)</option>
                              <option value="DESLIGADO" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">DESLIGADO (Presença regulada)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                              ▼
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Limite Diário de XP do Aluno
                          </label>
                          <input
                            type="number"
                            value={configs.LIMITE_XP_DIARIO}
                            onChange={(e) => handleChange("LIMITE_XP_DIARIO", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Limite Diário de Envio Pix (XP)
                          </label>
                          <input
                            type="number"
                            value={configs.LIMITE_PIX_DIARIO}
                            onChange={(e) => handleChange("LIMITE_PIX_DIARIO", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO: LINKS */}
                  {abaAtiva === "links" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 font-display">
                        Links de Integração & Suporte
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Link do Grupo: Turma 1
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_WPP_T1}
                            onChange={(e) => handleChange("LINK_WPP_T1", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Link do Grupo: Turma 2
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_WPP_T2}
                            onChange={(e) => handleChange("LINK_WPP_T2", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            URL do Apps Script (Banco de Dados)
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_PLANILHA}
                            onChange={(e) => handleChange("LINK_PLANILHA", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 font-mono text-xs focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Link do Classroom AVA
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_CLASSROOM}
                            onChange={(e) => handleChange("LINK_CLASSROOM", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Link da Matriz Curricular
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_MATRIZ}
                            onChange={(e) => handleChange("LINK_MATRIZ", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Link do Cronograma Geral
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_CRONOGRAMA}
                            onChange={(e) => handleChange("LINK_CRONOGRAMA", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Link de Ajuda / Suporte
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_AJUDA}
                            onChange={(e) => handleChange("LINK_AJUDA", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO: MÓDULOS */}
                  {abaAtiva === "modulos" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 font-display">
                        Controle de Módulos & Importação SIEPE
                      </h3>
                      <div className="grid grid-cols-1 gap-6 mb-8">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 uppercase mb-2">
                            Importação Automática SIEPE
                          </label>
                          <select
                            value={configs.STATUS_SIEPE || "ATIVO"}
                            onChange={(e) => handleChange("STATUS_SIEPE", e.target.value)}
                            className="cursor-pointer w-full md:w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3.5 font-bold outline-none"
                          >
                            <option value="ATIVO">Ativado (Recebendo dados)</option>
                            <option value="INATIVO">Pausado</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="bg-slate-100 dark:bg-slate-800/30 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold mb-4">Nova Regra de Módulo</h4>
                        <form onSubmit={adicionarModuloDb} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <input 
                            type="text" placeholder="Nome do Módulo (ex: Aula 01)" 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white"
                            value={novoNomeMod} onChange={e => setNovoNomeMod(e.target.value)} required
                          />
                          <select 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white"
                            value={novaTurmaMod} onChange={e => setNovaTurmaMod(e.target.value)} required
                          >
                            <option value="Todas">Todas as Turmas</option>
                            <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
                            <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
                          </select>
                          <select 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white"
                            value={novoStatusMod} onChange={e => setNovoStatusMod(e.target.value)} required
                          >
                            <option value="Aberto">Aberto</option>
                            <option value="Em breve">Em Breve</option>
                            <option value="Encerrado">Encerrado</option>
                          </select>
                          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg p-3 transition">
                            Adicionar
                          </button>
                        </form>
                      </div>

                      <table className="w-full text-left mt-6">
                        <thead>
                          <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="pb-3">Módulo</th>
                            <th className="pb-3">Turma Alvo</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modulosDb.map(m => (
                            <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800/50">
                              <td className="py-3 text-slate-800 dark:text-white font-medium">{m.nomeMod}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-400">{m.turmaMod}</td>
                              <td className="py-3">
                                <select 
                                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded text-sm"
                                  value={m.statusMod}
                                  onChange={(e) => atualizarStatusModDb(m.id, e.target.value)}
                                >
                                  <option value="Aberto">Aberto</option>
                                  <option value="Em breve">Em breve</option>
                                  <option value="Encerrado">Encerrado</option>
                                </select>
                              </td>
                              <td className="py-3 text-right">
                                <button onClick={() => removerModuloDb(m.id)} className="text-red-500 hover:text-red-600 px-2">Remover</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* CONTEÚDO: USUÁRIOS */}
                  {abaAtiva === "usuarios" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 font-display">
                        Gestão de Acesso (Tutores)
                      </h3>
                      <div className="bg-slate-100 dark:bg-slate-800/30 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold mb-4">Novo Tutor</h4>
                        <form onSubmit={adicionarUsuarioDb} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <input 
                            type="text" placeholder="Usuário (ex: admin)" 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white"
                            value={novoUsuario} onChange={e => setNovoUsuario(e.target.value)} required
                          />
                          <input 
                            type="text" placeholder="Nome Completo" 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white"
                            value={novoNomeUsuario} onChange={e => setNovoNomeUsuario(e.target.value)} required
                          />
                          <input 
                            type="password" placeholder="Senha" 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white"
                            value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required
                          />
                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg p-3 transition">
                            Adicionar
                          </button>
                        </form>
                      </div>

                      <table className="w-full text-left mt-6">
                        <thead>
                          <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="pb-3">Usuário</th>
                            <th className="pb-3">Nome</th>
                            <th className="pb-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuariosDb.map(u => (
                            <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/50">
                              <td className="py-3 text-slate-800 dark:text-white font-medium">{u.usuario}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-400">{u.nome}</td>
                              <td className="py-3 text-right">
                                <button onClick={() => removerUsuarioDb(u.id)} className="text-red-500 hover:text-red-600 px-2">Remover</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* CONTEÚDO: SEGURANÇA */}
                  {abaAtiva === "seguranca" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white font-display">
                          Logs de Auditoria e Segurança
                        </h3>
                        <button onClick={carregarLogsSeguranca} className="text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                          Atualizar
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                          <thead>
                            <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                              <th className="pb-3 font-medium">Data/Hora</th>
                              <th className="pb-3 font-medium">Matrícula</th>
                              <th className="pb-3 font-medium">Nome</th>
                              <th className="pb-3 font-medium">Ação Detectada</th>
                              <th className="pb-3 font-medium">Detalhes Técnicos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logsSeguranca.map((log, i) => (
                              <tr key={log.id || i} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 text-slate-500 text-sm">{log.dataHora}</td>
                                <td className="py-3 text-slate-800 dark:text-white font-mono">{log.matricula}</td>
                                <td className="py-3 text-slate-600 dark:text-slate-400">{log.nome}</td>
                                <td className="py-3">
                                  <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold">
                                    {log.acao}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500 text-sm max-w-xs truncate" title={log.detalhes}>
                                  {log.detalhes}
                                </td>
                              </tr>
                            ))}
                            {logsSeguranca.length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center py-12 text-emerald-500 font-medium">
                                  Nenhuma ocorrência registrada. Sistema limpo!
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO: PRIMEIRO ACESSO (ONBOARDING) */}
                  {abaAtiva === "onboarding" && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <span className="text-5xl animate-bounce block mb-4 select-none">
                          👋
                        </span>
                        <h3 className="text-2xl font-display font-black text-slate-800 dark:text-white mb-2">
                          Bem-vindo ao Portal Trilha Tech!
                        </h3>
                        <p className="text-sm font-semibold text-slate-450 dark:text-slate-500">
                          Vamos configurar o sistema na sua conta do Google em 3 passos rápidos.
                        </p>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-white/80 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative shadow-sm text-left">
                          <span className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 text-white font-black flex items-center justify-center rounded-full border-4 border-white dark:border-slate-900 shadow-md">
                            1
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-white mb-2 ml-4">
                            Criar o seu Banco de Dados
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-450 ml-4 mb-3 font-semibold leading-relaxed">
                            Todo o sistema funciona baseado numa Planilha do Google. Faça uma cópia do modelo oficial para o seu Drive.
                          </p>
                          <a
                            href="https://docs.google.com/spreadsheets/d/1-J3PKSlTOZDP6ce2WXBwb2JbTxkd-tGdmnTRTAw8m8M/copy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 w-max"
                          >
                            🔗 Fazer cópia do Template Base
                          </a>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative shadow-sm text-left">
                          <span className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 text-white font-black flex items-center justify-center rounded-full border-4 border-white dark:border-slate-900 shadow-md">
                            2
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-white mb-2 ml-4">
                            Ativar a API (Apps Script)
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-450 ml-4 mb-1 font-semibold leading-relaxed">
                            Na sua planilha recém-copiada, vá em <strong>Extensões &gt; Apps Script</strong>. No canto superior direito, clique em <strong>Implantar &gt; Nova Implantação</strong>.
                          </p>
                          <p className="text-xs text-slate-550 dark:text-slate-450 ml-4 font-semibold leading-relaxed">
                            Escolha tipo &quot;App da Web&quot;, execute como &quot;Você&quot; e defina acesso para &quot;Qualquer pessoa&quot;.
                          </p>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative shadow-sm text-left">
                          <span className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 text-white font-black flex items-center justify-center rounded-full border-4 border-white dark:border-slate-900 shadow-md">
                            3
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-white mb-2 ml-4">
                            Vincular a URL no Frontend
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-450 ml-4 mb-3 font-semibold leading-relaxed">
                            Copie a URL gerada no passo anterior. No código fonte deste portal (no arquivo <code>.env</code> ou <code>api.ts</code>), cole o link na variável <code>NEXT_PUBLIC_API_URL</code>.
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-850 flex justify-center">
                        <button
                          onClick={() => setAbaAtiva("geral")}
                          className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-655 text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Concluí a instalação! Iniciar configuração
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
