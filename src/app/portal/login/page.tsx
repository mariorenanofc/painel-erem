"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import ThreeParticleBg from "@/src/components/ThreeParticleBg";

export default function PortalLogin() {
  const { toast } = useToast();
  const router = useRouter();

  const [matricula, setMatricula] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState("Portal Educacional");

  const [acessoNegado, setAcessoNegado] = useState(false);
  const [nomeBloqueado, setNomeBloqueado] = useState("");

  const [modalRecuperacaoAberto, setModalRecuperacaoAberto] = useState(false);
  const [nomeRecuperacao, setNomeRecuperacao] = useState("");
  const [dataNascRecuperacao, setDataNascRecuperacao] = useState("");
  const [buscandoMatricula, setBuscandoMatricula] = useState(false);
  const [resultadoRecuperacao, setResultadoRecuperacao] = useState<{
    matricula: string;
    nome: string;
  } | null>(null);
  const [erroRecuperacao, setErroRecuperacao] = useState("");

  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  // Busca o nome do projeto na inicialização
  useEffect(() => {
    const buscarConfiguracoes = async () => {
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "buscar_configuracoes" }),
        });
        const data = await res.json();
        if (data.status === "sucesso") {
          setNomeProjeto(
            data.configuracoes.nomeProjeto || "Portal Educacional",
          );
        }
      } catch (e) {
        console.error("Erro ao buscar configurações", e);
      }
    };
    if (GOOGLE_API_URL) buscarConfiguracoes();
  }, [GOOGLE_API_URL]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !dataNasc) {
      toast("Preencha todos os campos!", "warning", "Atenção");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "login_aluno",
          matricula: matricula,
          dataNasc: dataNasc,
        }),
      });

      const resposta = await res.json();

      if (resposta.status === "sucesso") {
        localStorage.setItem("alunoLogado", JSON.stringify(resposta.aluno));
        toast(`Seja bem-vindo de volta!`, "success", "Acesso Permitido");
        router.push("/portal");
      } else if (resposta.status === "bloqueado") {
        setNomeBloqueado(resposta.nome || "Aluno");
        setAcessoNegado(true);
      } else {
        toast(resposta.mensagem, "warning", "Ops!");
      }
    } catch (erro) {
      toast("Erro de conexão com o servidor.", "error", "Falha na Rede");
    } finally {
      setCarregando(false);
    }
  };

  const buscarMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRecuperacao.trim() || !dataNascRecuperacao.trim()) {
      setErroRecuperacao("Preencha o nome e a data de nascimento.");
      return;
    }
    setBuscandoMatricula(true);
    setErroRecuperacao("");
    setResultadoRecuperacao(null);

    let dataFormatada = dataNascRecuperacao;
    if (dataNascRecuperacao.includes("-")) {
      const partes = dataNascRecuperacao.split("-");
      dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "recuperar_matricula",
          nome: nomeRecuperacao,
          dataNasc: dataFormatada,
        }),
      });
      const data = await res.json();

      if (data.status === "sucesso") {
        setResultadoRecuperacao({
          matricula: data.matricula,
          nome: data.nomeReal,
        });
        setMatricula(data.matricula);
        setDataNasc(dataNascRecuperacao);
      } else {
        setErroRecuperacao(data.mensagem);
      }
    } catch {
      setErroRecuperacao("Erro de conexão com o servidor.");
    } finally {
      setBuscandoMatricula(false);
    }
  };

  // ==========================================
  if (acessoNegado) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center text-slate-850 dark:text-white relative overflow-hidden transition-colors duration-300">
        {/* Glow Blob */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-500/10 blur-[100px] pointer-events-none animate-glow-pulse" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="glass-panel-heavy p-8 rounded-3xl max-w-lg border border-red-500/30 shadow-2xl relative z-10 flex flex-col items-center animate-in fade-in"
        >
          <div className="text-7xl mb-6 animate-bounce">🛑</div>
          <h1 className="text-3xl font-display font-black text-red-500 tracking-tight mb-4">Acesso Bloqueado</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
            Olá, <strong className="text-slate-900 dark:text-white">{nomeBloqueado}</strong>. Identificamos uma infração
            grave às regras do projeto Trilha Tech. O seu acesso à plataforma,
            missões e ranking foi temporariamente suspenso.
          </p>
          <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-200 dark:border-red-900/40 mb-8 text-left w-full">
            <p className="font-bold text-red-600 dark:text-red-400 uppercase tracking-widest text-xs mb-2">
              Próximos Passos
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Por favor, compareça à sala da coordenação do Trilha Tech
              presencialmente para conversar com o Tutor e a Gestão Pedagógica.
            </p>
          </div>
          <button
            onClick={() => {
              setAcessoNegado(false);
              setMatricula("");
              setDataNasc("");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Voltar para a tela de Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: LOGIN NORMAL E RECUPERAÇÃO
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Three.js interactive canvas particle background */}
      <ThreeParticleBg />

      {/* Floating ambient blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[40vw] h-[40vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[25vw] h-[25vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none" />

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 90 }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative z-10 border border-slate-200 dark:border-white/5"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="bg-gradient-to-tr from-brand-primary to-brand-secondary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg shadow-indigo-500/20"
          >
            🚀
          </motion.div>
          <h1 className="text-3xl font-display font-black tracking-tight text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-indigo-200 dark:to-cyan-300 dark:text-neon-glow">
            {nomeProjeto}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            Área do Aluno • Painel de Gestão
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Número da Matrícula
            </label>
            <input
              type="text"
              className="w-full bg-slate-100 dark:bg-slate-950/45 border border-slate-300 dark:border-slate-700/60 rounded-xl p-3 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none text-slate-800 dark:text-white font-mono transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Digite sua matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Data de Nascimento
            </label>
            <input
              type="date"
              className="w-full bg-slate-100 dark:bg-slate-950/45 border border-slate-300 dark:border-slate-700/60 rounded-xl p-3 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none text-slate-800 dark:text-white transition-all duration-200"
              value={dataNasc}
              onChange={(e) => setDataNasc(e.target.value)}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={carregando}
            className="w-full cursor-pointer bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-secondary text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Autenticando...
              </span>
            ) : (
              "Entrar no Portal"
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-800/80 pt-5">
          <button
            type="button"
            onClick={() => {
              setModalRecuperacaoAberto(true);
              setResultadoRecuperacao(null);
              setErroRecuperacao("");
              setNomeRecuperacao("");
              setDataNascRecuperacao("");
            }}
            className="text-xs font-bold text-brand-secondary hover:text-indigo-400 transition-colors uppercase tracking-wider"
          >
            Esqueci minha matrícula
          </button>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* MODAL DE RECUPERAÇÃO DE MATRÍCULA          */}
      {/* ========================================== */}
      <AnimatePresence>
        {modalRecuperacaoAberto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="glass-panel-heavy rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center border border-slate-200 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <span>🔍</span> Consultar Matrícula
                </h2>
                <button
                  onClick={() => setModalRecuperacaoAberto(false)}
                  className="cursor-pointer text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-2xl"
                >
                  &times;
                </button>
              </div>

              {resultadoRecuperacao ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-6"
                >
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="font-display font-bold text-slate-800 dark:text-white mb-2">
                    Matrícula Encontrada!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Olá, <strong className="text-slate-900 dark:text-white">{resultadoRecuperacao.nome}</strong>. Anote seu número de acesso:
                  </p>

                  <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-brand-primary/30 rounded-2xl p-4 mb-6 shadow-inner">
                    <span className="text-3xl font-black text-indigo-600 dark:text-brand-secondary font-mono tracking-widest">
                      {resultadoRecuperacao.matricula}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-6 bg-emerald-50 dark:bg-emerald-950/20 py-2.5 rounded-xl border border-emerald-250 dark:border-emerald-900/30">
                    ✅ Nós já preenchemos a tela de login para você!
                  </p>

                  <button
                    onClick={() => setModalRecuperacaoAberto(false)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Fazer Login Agora
                  </button>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-left leading-relaxed">
                    Preencha os seus dados exatamente como estão na secretaria da
                    escola para localizar o seu registro.
                  </p>

                  {erroRecuperacao && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs mb-4 border border-red-200 dark:border-red-900/50 text-left font-semibold"
                    >
                      ⚠️ {erroRecuperacao}
                    </motion.div>
                  )}

                  <form
                    onSubmit={buscarMatricula}
                    className="space-y-4 text-left"
                  >
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={nomeRecuperacao}
                        onChange={(e) => setNomeRecuperacao(e.target.value)}
                        placeholder="Ex: JOÃO DA SILVA SANTOS"
                        className="w-full bg-slate-100 dark:bg-slate-950/35 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-slate-800 dark:text-white uppercase"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={dataNascRecuperacao}
                        onChange={(e) => setDataNascRecuperacao(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-950/35 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={buscandoMatricula}
                      className="w-full bg-brand-primary hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex justify-center items-center gap-2"
                    >
                      {buscandoMatricula ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        "Consultar Matrícula"
                      )}
                    </motion.button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
