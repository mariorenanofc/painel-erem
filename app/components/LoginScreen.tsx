import { useState } from "react";

interface LoginScreenProps {
  onLoginSuccess: (nome: string) => void;
  apiUrl: string;
}

export default function LoginScreen({
  onLoginSuccess,
  apiUrl,
}: LoginScreenProps) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que a página recarregue ao enviar o formulário

    if (!usuario || !senha) {
      alert("⚠️ Preencha usuário e senha!");
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "login", // Avisa a API que é um login
          usuario: usuario,
          senha: senha,
        }),
      });

      const resposta = await res.json();

      if (resposta.status === "sucesso") {
        // Salva o nome do usuário no navegador (localStorage)
        localStorage.setItem("usuarioLogado", resposta.nome);
        onLoginSuccess(resposta.nome); // Libera o acesso
      } else {
        alert("❌ " + (resposta.mensagem || "Usuário ou senha incorretos."));
      }
    } catch (error) {
      alert("🔌 Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-emerald-800 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
            🏫
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            EREM Barão do Exu
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Acesso Restrito ao Sistema
          </p>
        </div>

        <form onSubmit={fazerLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Digite seu usuário"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className={`w-full text-white font-bold py-3 rounded-lg shadow-md transition-all ${carregando ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"}`}
          >
            {carregando ? "⏳ Verificando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
