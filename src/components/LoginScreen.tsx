"use client";

import { useState, useEffect } from "react";
import { apiGeral } from "@/src/services/api";
import { motion } from "framer-motion";
import ThreeParticleBg from "@/src/components/ThreeParticleBg";

interface LoginScreenProps {
  onLoginSuccess: (nomeUsuario: string) => void;
  apiUrl?: string;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [nomeEscola, setNomeEscola] = useState("Carregando...");
  const [nomeProjeto, setNomeProjeto] = useState("Portal Educacional");

  // Keep track of the active HTML theme for styles
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const buscarConfiguracoes = async () => {
      try {
        const data = await apiGeral.buscarConfiguracoes();

        if (data.status === "sucesso") {
          setNomeEscola(data.configuracoes.nomeEscola || "Portal Educacional");
          setNomeProjeto(
            data.configuracoes.nomeProjeto || "Plataforma Gamificada",
          );
        } else {
          setNomeEscola("Portal Educacional");
        }
      } catch (e) {
        setNomeEscola("Portal Educacional");
      }
    };

    buscarConfiguracoes();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const data = await apiGeral.loginGestao(usuario, senha);

      if (data.status === "sucesso") {
        localStorage.setItem("usuarioLogado", data.nome);
        onLoginSuccess(data.nome);
      } else {
        setErro(data.mensagem || "Usuário ou senha incorretos.");
      }
    } catch (err) {
      setErro("Erro de conexão. Verifique sua internet.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 font-sans">
      
      {/* Interactive web coding particle background */}
      <ThreeParticleBg />

      {/* Floating ambient blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[40vw] h-[40vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[25vw] h-[25vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none" />

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
            className="bg-gradient-to-tr from-brand-primary to-brand-secondary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-indigo-500/20"
          >
            🎓
          </motion.div>
          <h1 className="text-3xl font-display font-black tracking-tight text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-indigo-200 dark:to-cyan-300 dark:text-neon-glow">
            {nomeProjeto}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            {nomeEscola} • Acesso da Gestão
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/45 border border-slate-300 dark:border-slate-700/60 rounded-xl p-3 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none text-slate-800 dark:text-white transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Digite seu usuário..."
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/45 border border-slate-300 dark:border-slate-700/60 rounded-xl p-3 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none text-slate-800 dark:text-white transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs border border-red-200 dark:border-red-900/50 text-center font-semibold"
            >
              ⚠️ {erro}
            </motion.div>
          )}

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
              "Entrar no Painel"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
