"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

interface DadosAluno {
  matricula: string;
  nome: string;
  turma: string;
}

interface Atividade {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: string | number;
  status: string;
  xpGanho: number;
}

const subscribe = (callback: () => void) => {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return () => {};
};

const getSnapshot = () => {
  return typeof window !== "undefined" ? localStorage.getItem("alunoLogado") : null;
};

const getServerSnapshot = () => null;

export default function PortalDashboard() {
  const router = useRouter();
  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  const dadosSalvos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const aluno: DadosAluno | null = dadosSalvos ? JSON.parse(dadosSalvos) : null;

  // --- NOVOS ESTADOS PARA AS MISSÕES ---
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregandoAtividades, setCarregandoAtividades] = useState(true);

  // Barreira de segurança
  useEffect(() => {
    if (dadosSalvos === null) {
      router.push("/portal/login");
    }
  }, [dadosSalvos, router]);

  // Função para buscar as atividades do aluno
  useEffect(() => {
    const buscarAtividades = async () => {
      if (!aluno || !GOOGLE_API_URL) return;
      
      try {
        const res = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "buscar_atividades",
            matricula: aluno.matricula,
            turma: aluno.turma
          }),
        });
        
        const resposta = await res.json();
        if (resposta.status === "sucesso") {
          setAtividades(resposta.atividades);
        }
      } catch (erro) {
        console.error("Erro ao carregar missões:", erro);
      } finally {
        setCarregandoAtividades(false);
      }
    };

    buscarAtividades();
  }, [GOOGLE_API_URL, aluno]); // Executa sempre que o aluno for carregado

  const fazerLogout = () => {
    localStorage.removeItem("alunoLogado");
    router.push("/portal/login");
  };

  if (!aluno) return <div className="min-h-screen bg-slate-50"></div>;

  // Cálculo rápido para sabermos se há missões pendentes
  const missoesPendentes = atividades.filter(a => a.status === "Pendente").length;

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Cabeçalho */}
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Portal Trilha Tech</h1>
              <p className="text-blue-300 text-xs font-mono">{aluno.matricula}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{aluno.nome.split(' ')[0]}</p>
              <p className="text-xs text-blue-300">{aluno.turma}</p>
            </div>
            <button onClick={fazerLogout} className="bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-blue-700">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Saudação e Resumo */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Bem-vindo, {aluno.nome.split(' ')[0]}!</h2>
            <p className="text-slate-500 text-sm mt-1">
              Você tem <strong className="text-amber-600">{missoesPendentes} missões pendentes</strong> para concluir.
            </p>
          </div>
          {/* Caixa de XP Temporária (Vamos puxar isso do back-end na próxima etapa) */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-full text-xl">⭐</div>
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase">Seu Nível</p>
              <p className="text-lg font-black text-emerald-600">Iniciante</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mural de Atividades */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 mt-4">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          🎯 Missões Disponíveis
        </h3>

        {carregandoAtividades ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : atividades.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">
            Nenhuma missão disponível para a sua turma no momento. Volte mais tarde!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atividades.map((ativ) => (
              <div key={ativ.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                {/* Cabeçalho do Card */}
                <div className={`p-1 ${ativ.status === 'Pendente' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                      {ativ.id}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      ⭐ {ativ.xp} XP
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{ativ.titulo}</h4>
                  <p className="text-slate-500 text-sm mb-4 flex-1">{ativ.descricao}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span>📅</span> Até: {ativ.dataLimite}
                    </div>
                    
                    {/* Badge de Status */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      ativ.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 
                      ativ.status === 'Aguardando Correção' ? 'bg-blue-100 text-blue-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ativ.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}