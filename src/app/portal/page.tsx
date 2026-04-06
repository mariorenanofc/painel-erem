"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

interface DadosAluno {
  matricula: string;
  nome: string;
  turma: string;
}

interface Atividade {
  id: string; titulo: string; descricao: string; dataLimite: string;
  xp: string | number; tipo: string;
  opcaoA: string; opcaoB: string; opcaoC: string; opcaoD: string;
  status: string; respostaEnviada: string; xpGanho: number;
}

// Interface do Perfil
interface PerfilAluno {
  nome: string; dataNasc: string; matricula: string;
  email: string; turma: string; telefoneAluno: string; telefoneResponsavel: string;
}

const subscribe = (callback: () => void) => {
  if (typeof window !== "undefined") { window.addEventListener("storage", callback); return () => window.removeEventListener("storage", callback); }
  return () => {};
};

const getSnapshot = () => typeof window !== "undefined" ? localStorage.getItem("alunoLogado") : null;
const getServerSnapshot = () => null;

export default function PortalDashboard() {
  const router = useRouter();
  const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

  const dadosSalvos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const aluno: DadosAluno | null = dadosSalvos ? JSON.parse(dadosSalvos) : null;

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregandoAtividades, setCarregandoAtividades] = useState(true);

  // --- NOVOS ESTADOS: XP E CHECK-IN ---
  const [xpTotalSistema, setXpTotalSistema] = useState(0);
  const [nivelSistema, setNivelSistema] = useState("Iniciante");
  const [fazendoCheckin, setFazendoCheckin] = useState(false);

  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  // --- ESTADOS DO PERFIL ---
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [dadosPerfil, setDadosPerfil] = useState<PerfilAluno | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  useEffect(() => { if (dadosSalvos === null) router.push("/portal/login"); }, [dadosSalvos, router]);

  const buscarAtividades = async () => {
    if (!aluno || !GOOGLE_API_URL) return;
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "buscar_atividades", matricula: aluno.matricula, turma: aluno.turma }) });
      const respostaData = await res.json();
      if (respostaData.status === "sucesso") {
        setAtividades(respostaData.atividades);
        // Atualiza o XP e o Nível puxando direto do banco de dados (Aba TrilhaTech)
        setXpTotalSistema(respostaData.xpTotal || 0);
        setNivelSistema(respostaData.nivel || "Iniciante");
      }
    } catch { console.error("Erro ao carregar missões"); } finally { setCarregandoAtividades(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { buscarAtividades(); }, [aluno]);

  const fazerLogout = () => { localStorage.removeItem("alunoLogado"); router.push("/portal/login"); };

  const abrirMissao = (ativ: Atividade) => { setResposta(ativ.respostaEnviada || ""); setMissaoAberta(ativ); };

  const enviarMissao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resposta.trim()) return alert("⚠️ Preencha a resposta antes de enviar!");
    if (!aluno || !missaoAberta) return;
    setEnviando(true);
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "enviar_atividade", matricula: aluno.matricula, idAtividade: missaoAberta.id, resposta: resposta }) });
      const respostaData = await res.json();
      if (respostaData.status === "sucesso") { alert("✅ " + respostaData.mensagem); setMissaoAberta(null); buscarAtividades(); } 
      else { alert("⚠️ " + respostaData.mensagem); }
    } catch { alert("❌ Erro de conexão."); } finally { setEnviando(false); }
  };

  // --- FUNÇÃO DO CHECK-IN ---
  const registrarPresenca = async () => {
    if (!aluno) return;
    setFazendoCheckin(true);
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "fazer_checkin", matricula: aluno.matricula }) });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("🎉 " + data.mensagem);
        buscarAtividades(); // Atualiza a tela para mostrar o novo XP na hora
      } else {
        alert("⚠️ " + data.mensagem);
      }
    } catch { alert("❌ Erro ao tentar registar a presença."); } finally { setFazendoCheckin(false); }
  };

  // --- FUNÇÕES DO PERFIL ---
  const abrirPerfil = async () => {
    if (!aluno) return;
    setPerfilAberto(true);
    setCarregandoPerfil(true);
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "buscar_perfil_aluno", matricula: aluno.matricula }) });
      const data = await res.json();
      if (data.status === "sucesso") setDadosPerfil(data.perfil);
      else alert("⚠️ " + data.mensagem);
    } catch { alert("❌ Erro ao buscar dados do perfil."); setPerfilAberto(false); } finally { setCarregandoPerfil(false); }
  };

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dadosPerfil) return;
    setSalvandoPerfil(true);
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "atualizar_contatos_aluno", matricula: dadosPerfil.matricula, turma: dadosPerfil.turma, telefoneAluno: dadosPerfil.telefoneAluno, telefoneResponsavel: dadosPerfil.telefoneResponsavel }) });
      const data = await res.json();
      if (data.status === "sucesso") { alert("✅ Contatos salvos com sucesso!"); setPerfilAberto(false); }
      else alert("⚠️ " + data.mensagem);
    } catch { alert("❌ Erro ao salvar contatos."); } finally { setSalvandoPerfil(false); }
  };

  if (!aluno) return <div className="min-h-screen bg-slate-50"></div>;
  const missoesPendentes = atividades.filter(a => a.status === "Pendente").length;

  return (
    <main 
      className="min-h-screen bg-slate-50 font-sans pb-12 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => { e.preventDefault(); alert("⚠️ Sistema Anti-Cola ativo."); }} 
      onCut={(e) => e.preventDefault()}
    >
      
      {/* --- MODAL DO MEU PERFIL --- */}
      {perfilAberto && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-blue-900 p-4 border-b flex justify-between items-center text-white">
              <h2 className="font-bold text-lg flex items-center gap-2"><span>👤</span> Meu Perfil</h2>
              <button onClick={() => setPerfilAberto(false)} className="text-2xl leading-none hover:text-blue-200">&times;</button>
            </div>
            
            <div className="p-6">
              {carregandoPerfil ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
              ) : dadosPerfil ? (
                <form onSubmit={salvarPerfil} className="space-y-4">
                  <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded border border-amber-200 mb-4 leading-relaxed">
                    <strong>Aviso de Segurança:</strong> Você tem permissão apenas para atualizar seus números de telefone de contato. Para corrigir qualquer outro dado de registro, procure a secretaria.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input type="text" value={dadosPerfil.nome} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matrícula</label>
                      <input type="text" value={dadosPerfil.matricula} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nasc.</label>
                      <input type="text" value={dadosPerfil.dataNasc} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma Atual</label>
                      <input type="text" value={dadosPerfil.turma} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Institucional</label>
                    <input type="text" value={dadosPerfil.email} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded p-2 text-sm cursor-not-allowed" />
                  </div>

                  <hr className="my-4 border-slate-200" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Telefone (Seu)</label>
                      <input type="tel" value={dadosPerfil.telefoneAluno} onChange={(e) => setDadosPerfil({...dadosPerfil, telefoneAluno: e.target.value})} className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded p-2 text-sm outline-none transition-colors" placeholder="(87) 9XXXX-XXXX" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Telefone (Responsável)</label>
                      <input type="tel" value={dadosPerfil.telefoneResponsavel} onChange={(e) => setDadosPerfil({...dadosPerfil, telefoneResponsavel: e.target.value})} className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded p-2 text-sm outline-none transition-colors" placeholder="(87) 9XXXX-XXXX" />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setPerfilAberto(false)} className="px-4 py-2 rounded text-slate-600 font-bold hover:bg-slate-100">Cancelar</button>
                    <button type="submit" disabled={salvandoPerfil} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-md disabled:bg-slate-400">
                      {salvandoPerfil ? "Salvando..." : "Salvar Telefones"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-center text-red-500">Erro ao carregar os dados do perfil.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DA MISSÃO --- */}
      {missaoAberta && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`p-4 border-b flex justify-between items-center text-white ${missaoAberta.tipo === 'Quiz' ? 'bg-amber-600' : 'bg-blue-600'}`}>
              <h2 className="font-bold text-lg">🎯 {missaoAberta.tipo}: {missaoAberta.titulo}</h2>
              <button onClick={() => setMissaoAberta(null)} className="text-2xl leading-none hover:text-slate-200">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex gap-4 mb-4 text-sm font-bold">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded border border-slate-200">ID: {missaoAberta.id}</span>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded border border-emerald-200">⭐ {missaoAberta.xp} XP Possíveis</span>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap text-base mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">{missaoAberta.descricao}</p>
              <form onSubmit={enviarMissao} className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-800 mb-3 uppercase text-sm">Sua Resposta:</h3>
                {missaoAberta.tipo === "Quiz" ? (
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((letra) => {
                      const opcaoTexto = missaoAberta[`opcao${letra}` as keyof Atividade];
                      return opcaoTexto ? (
                        <label key={letra} className={`block p-3 rounded-lg border cursor-pointer transition-colors ${resposta === letra ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                          <input type="radio" name="quiz" value={letra} checked={resposta === letra} onChange={(e) => setResposta(e.target.value)} disabled={missaoAberta.status === "Avaliador"} className="mr-3" />
                          <strong className="text-slate-700">{letra})</strong> <span className="text-slate-600">{opcaoTexto}</span>
                        </label>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Cole o link do seu projeto (GitHub, Replit, etc):</label>
                    <input type="url" placeholder="https://..." value={resposta} onChange={(e) => setResposta(e.target.value)} required disabled={missaoAberta.status === "Avaliador"} className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-3 focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setMissaoAberta(null)} className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100">Cancelar</button>
                  <button type="submit" disabled={enviando} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md disabled:bg-slate-400">
                    {enviando ? "Enviando..." : "Enviar Resposta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD PRINCIPAL --- */}
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Portal Trilha Tech</h1>
              <p className="text-blue-300 text-xs font-mono">{aluno.matricula}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{aluno.nome.split(' ')[0]}</p>
              <p className="text-xs text-blue-300">{aluno.turma}</p>
            </div>
            {/* BOTÃO CHECK-IN */}
            <button 
              onClick={registrarPresenca} 
              disabled={fazendoCheckin}
              className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md disabled:bg-slate-400 flex items-center gap-1"
            >
              <span className="animate-pulse">📍</span>
              <span className="hidden sm:inline">{fazendoCheckin ? "A registar..." : "Check-in (+10 XP)"}</span>
              <span className="sm:hidden">{fazendoCheckin ? "..." : "+10 XP"}</span>
            </button>
            <button onClick={abrirPerfil} className="bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-blue-700 flex items-center gap-1">
              <span>👤</span> <span className="hidden sm:inline">Perfil</span>
            </button>
            <button onClick={fazerLogout} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-slate-700">Sair</button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Bem-vindo, {aluno.nome.split(' ')[0]}!</h2>
            <p className="text-slate-500 text-sm mt-1">Você tem <strong className="text-amber-600">{missoesPendentes} missões pendentes</strong> para concluir.</p>
          </div>
          <div className="flex gap-4">
            {/* CAIXA DE NÍVEL */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg  items-center gap-3 hidden sm:flex">
              <div className="bg-blue-100 p-2 rounded-full text-xl">🎓</div>
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase">Nível Atual</p>
                <p className="text-lg font-black text-blue-600">{nivelSistema}</p>
              </div>
            </div>
            {/* CAIXA DE XP */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full text-xl">⭐</div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase">Seu XP Total</p>
                <p className="text-lg font-black text-emerald-600">{xpTotalSistema} XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 mt-4">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">🎯 Suas Missões</h3>

        {carregandoAtividades ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : atividades.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">Nenhuma missão liberada no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atividades.map((ativ) => (
              <div key={ativ.id} onClick={() => abrirMissao(ativ)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col overflow-hidden cursor-pointer">
                <div className={`p-1 ${ativ.status === 'Pendente' ? 'bg-amber-400' : ativ.status === 'Aguardando Correção' ? 'bg-blue-400' : 'bg-emerald-500'}`}></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase border border-slate-200">{ativ.tipo}</span>
                    <span className="text-xs font-bold flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">⭐ {ativ.xp} XP</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{ativ.titulo}</h4>
                  <p className="text-slate-500 text-sm mb-4 flex-1 line-clamp-2">{ativ.descricao}</p>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1"><span>📅</span> {ativ.dataLimite}</div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${ativ.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : ativ.status === 'Aguardando Correção' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
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