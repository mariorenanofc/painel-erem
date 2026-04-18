/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";

interface LoginScreenProps {
  onLoginSuccess: (nomeUsuario: string) => void;
  apiUrl: string;
}

export default function LoginScreen({ onLoginSuccess, apiUrl }: LoginScreenProps) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  // Estados Dinâmicos para o White-Label
  const [nomeEscola, setNomeEscola] = useState("Carregando...");
  const [nomeProjeto, setNomeProjeto] = useState("Portal Educacional");

  useEffect(() => {
    // Busca o nome da escola e do projeto na Planilha (Aba configuracoes)
    const buscarConfiguracoes = async () => {
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "buscar_configuracoes" }),
        });
        const data = await res.json();
        
        if (data.status === "sucesso") {
          setNomeEscola(data.configuracoes.nomeEscola || "Portal Educacional");
          setNomeProjeto(data.configuracoes.nomeProjeto || "Plataforma Gamificada");
        } else {
          setNomeEscola("Portal Educacional");
        }
      } catch (e) {
        setNomeEscola("Portal Educacional"); // Fallback em caso de erro de rede
      }
    };

    if (apiUrl) buscarConfiguracoes();
  }, [apiUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        // Enviando action "login", usuario e senha exatamente como o seu Apps Script espera
        body: JSON.stringify({ action: "login", usuario, senha }), 
      });
      const data = await res.json();

      if (data.status === "sucesso") {
        // A sua rota retorna "data.nome"
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* CABEÇALHO DO LOGIN DINÂMICO */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10 mx-auto mb-4">
              🎓
            </div>
            <h1 className="text-2xl font-black text-white leading-tight mb-1">
              {nomeProjeto}
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {nomeEscola}
            </p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Acesso da Gestão</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Digite seu usuário..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {erro && (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-lg border border-red-200 text-center">
                ⚠️ {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed mt-4"
            >
              {carregando ? "Verificando..." : "Entrar no Painel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}