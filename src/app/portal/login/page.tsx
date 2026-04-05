"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalLogin() {
  const [matricula, setMatricula] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  // --- NOVOS ESTADOS PARA A TELA DE BLOQUEIO ---
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [nomeBloqueado, setNomeBloqueado] = useState("");

  const router = useRouter();
  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !dataNasc) return alert("Preencha todos os campos!");

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
        router.push("/portal");
      } 
      // --- CAPTURA O STATUS DE BLOQUEIO AQUI ---
      else if (resposta.status === "nao_autorizado") {
        setNomeBloqueado(resposta.nomeAluno || "Aluno");
        setAcessoNegado(true);
      } 
      else {
        alert("⚠️ " + resposta.mensagem);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("❌ Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  // ==========================================
  // TELA DE ACESSO NEGADO (Estilo 404 Personalizado)
  // ==========================================
  if (acessoNegado) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-t-red-500 text-center animate-in zoom-in-95 duration-300">
          <div className="text-6xl mb-4">🛑</div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Acesso Restrito</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Olá, <strong className="text-slate-800">{nomeBloqueado.split(' ')[0]}</strong>! <br/>
            O sistema reconhece que você faz parte da nossa escola, porém o seu acesso ao portal foi negado porque você <strong>não está matriculado ou aprovado</strong> no projeto Trilha Tech.
          </p>
          <button
            onClick={() => setAcessoNegado(false)} // Volta para o formulário
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // FORMULÁRIO DE LOGIN NORMAL
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Portal do Aluno</h1>
          <p className="text-slate-500 text-sm mt-1">Projeto Trilha Tech</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Número da Matrícula</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              placeholder="Ex: 1234567"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Data de Nascimento</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={dataNasc}
              onChange={(e) => setDataNasc(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md disabled:bg-slate-400 disabled:transform-none flex justify-center"
          >
            {carregando ? "⌛ Verificando..." : "Entrar no Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}