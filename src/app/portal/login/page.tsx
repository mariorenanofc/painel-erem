"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalLogin() {
  const [matricula, setMatricula] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [carregando, setCarregando] = useState(false);

  // --- NOME DINÂMICO (WHITE-LABEL) ---
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

  const router = useRouter();
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
      } else if (resposta.status === "bloqueado") {
        setNomeBloqueado(resposta.nome || "Aluno");
        setAcessoNegado(true);
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro de conexão com o servidor.");
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
  // TELA 1: ACESSO NEGADO (A sua tela original de bloqueio)
  // ==========================================
  if (acessoNegado) {
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-4 text-center text-white animate-in fade-in duration-500">
        <div className="text-8xl mb-6">🛑</div>
        <h1 className="text-4xl font-black mb-4">Acesso Bloqueado</h1>
        <p className="text-xl max-w-lg font-medium leading-relaxed mb-8">
          Olá, <strong>{nomeBloqueado}</strong>. Identificamos uma infração
          grave às regras do projeto Trilha Tech. O seu acesso à plataforma,
          missões e ranking foi temporariamente suspenso.
        </p>
        <div className="bg-red-800/50 p-6 rounded-2xl max-w-md border border-red-500 shadow-xl mb-8">
          <p className="font-bold text-red-100 uppercase tracking-widest text-sm mb-2">
            Próximos Passos
          </p>
          <p className="text-sm">
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
          className="bg-white text-red-700 hover:bg-red-50 font-black py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          Voltar para a tela de Login
        </button>
      </div>
    );
  }

  // ==========================================
  // TELA 2: LOGIN NORMAL E RECUPERAÇÃO
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decoração de Fundo */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-900 skew-y-3 transform -translate-y-20 z-0"></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            🚀
          </div>
          <h1 className="text-2xl font-black text-slate-800">
            Portal Trilha Tech
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Acesse sua área de aluno
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Número da Matrícula
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              placeholder="Ex: 1234567"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))} // Permite apenas números
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={dataNasc}
              onChange={(e) => setDataNasc(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md disabled:bg-slate-400 hover:-translate-y-0.5"
          >
            {carregando ? "Autenticando..." : "Entrar no Portal"}
          </button>
        </form>

        {/* LINK PARA RECUPERAR A MATRÍCULA */}
        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => {
              setModalRecuperacaoAberto(true);
              setResultadoRecuperacao(null);
              setErroRecuperacao("");
              setNomeRecuperacao("");
              setDataNascRecuperacao("");
            }}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Esqueci o número da minha matrícula
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE RECUPERAÇÃO DE MATRÍCULA          */}
      {/* ========================================== */}
      {modalRecuperacaoAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
                <span>🔍</span> Consultar Matrícula
              </h2>
              <button
                onClick={() => setModalRecuperacaoAberto(false)}
                className="text-3xl leading-none text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {resultadoRecuperacao ? (
              <div className="py-6 animate-in zoom-in">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-bold text-slate-800 mb-2">
                  Matrícula Encontrada!
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Olá, {resultadoRecuperacao.nome}. Anote o seu número de
                  acesso:
                </p>

                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 mb-6">
                  <span className="text-3xl font-black text-blue-700 font-mono tracking-widest">
                    {resultadoRecuperacao.matricula}
                  </span>
                </div>

                <p className="text-xs font-bold text-emerald-600 mb-4 bg-emerald-50 py-2 rounded">
                  ✅ Nós já preenchemos a tela de login para você!
                </p>

                <button
                  onClick={() => setModalRecuperacaoAberto(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
                >
                  Fazer Login Agora
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-6 text-left">
                  Preencha os seus dados exatamente como estão na secretaria da
                  escola para localizar o seu registro.
                </p>

                {erroRecuperacao && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4 border border-red-200 text-left font-bold">
                    {erroRecuperacao}
                  </div>
                )}

                <form
                  onSubmit={buscarMatricula}
                  className="space-y-4 text-left"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={nomeRecuperacao}
                      onChange={(e) => setNomeRecuperacao(e.target.value)}
                      placeholder="Ex: João da Silva Santos"
                      className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all text-slate-800 uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={dataNascRecuperacao}
                      onChange={(e) => setDataNascRecuperacao(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all text-slate-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={buscandoMatricula}
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:bg-slate-400 mt-2 flex justify-center items-center gap-2"
                  >
                    {buscandoMatricula
                      ? "Consultando Banco de Dados..."
                      : "Consultar Matrícula"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
