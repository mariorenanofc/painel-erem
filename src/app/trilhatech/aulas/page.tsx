"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Header from "@/src/components/Header";
import { useRouter } from "next/navigation";

interface Atividade {
  id: string; titulo: string; descricao: string; dataLimite: string;
  xp: number | string; turmaAlvo: string; tipo: string;
  opcaoA?: string; opcaoB?: string; opcaoC?: string; opcaoD?: string; respostaCorreta?: string;
}

interface Entrega {
  idEntrega: string; matricula: string; nomeAluno: string;
  resposta: string; status: string; xpGanho: number;
}

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL || "";

const fetcherAtividades = async (url: string) => {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "buscar_todas_atividades" }) });
  return res.json();
};

export default function GestaoAulasPage() {
  const router = useRouter();
  const [nomeUsuario] = useState(() => typeof window !== "undefined" ? localStorage.getItem("usuarioLogado") || "" : "");
  const [montado, setMontado] = useState(false);

  // === ESTADOS DO FORMULÁRIO ===
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [xp, setXp] = useState("100");
  const [turmaAlvo, setTurmaAlvo] = useState("Todas");
  const [tipo, setTipo] = useState("Projeto"); 
  const [opcaoA, setOpcaoA] = useState(""); const [opcaoB, setOpcaoB] = useState("");
  const [opcaoC, setOpcaoC] = useState(""); const [opcaoD, setOpcaoD] = useState("");
  const [respostaCorreta, setRespostaCorreta] = useState("A");
  const [salvando, setSalvando] = useState(false);

  // === ESTADOS DO MODAL DE ENTREGAS ===
  const [missaoAberta, setMissaoAberta] = useState<Atividade | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregandoEntregas, setCarregandoEntregas] = useState(false);
  const [notasTemp, setNotasTemp] = useState<Record<string, number>>({});

  const { data, isLoading, mutate } = useSWR(nomeUsuario && GOOGLE_API_URL ? GOOGLE_API_URL : null, fetcherAtividades, { revalidateOnFocus: true });
  const atividades: Atividade[] = data?.status === "sucesso" ? data.atividades : [];

  useEffect(() => { setMontado(true); if (!nomeUsuario) window.location.href = "/"; }, [nomeUsuario]);

  const limparFormulario = () => {
    setIdEditando(null); setTitulo(""); setDescricao(""); setDataLimite(""); setXp("100"); setTurmaAlvo("Todas");
    setTipo("Projeto"); setOpcaoA(""); setOpcaoB(""); setOpcaoC(""); setOpcaoD(""); setRespostaCorreta("A");
  };

  const preencherEdicao = (ativ: Atividade) => {
    setIdEditando(ativ.id); setTitulo(ativ.titulo); setDescricao(ativ.descricao);
    setDataLimite(ativ.dataLimite); setXp(String(ativ.xp)); setTurmaAlvo(ativ.turmaAlvo); setTipo(ativ.tipo);
    setOpcaoA(ativ.opcaoA || ""); setOpcaoB(ativ.opcaoB || ""); setOpcaoC(ativ.opcaoC || ""); setOpcaoD(ativ.opcaoD || "");
    setRespostaCorreta(ativ.respostaCorreta || "A");
  };

  const excluirAtividade = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir a missão ${id}? Todas as respostas ligadas a ela ficarão órfãs.`)) return;
    try {
      await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "excluir_atividade", idAtividade: id }) });
      mutate();
    } catch { alert("Erro ao excluir."); }
  };

  const salvarNovaAtividade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descricao || !dataLimite || !xp) return alert("Preencha os campos obrigatórios!");
    setSalvando(true);
    try {
      await fetch(GOOGLE_API_URL, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "salvar_atividade", idAtividadeEdit: idEditando, titulo, descricao, dataLimite, xp, turmaAlvo, tipo, opcaoA, opcaoB, opcaoC, opcaoD, respostaCorreta }),
      });
      limparFormulario();
      mutate();
    } catch { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  // === FUNÇÕES DE CORREÇÃO ===
  const abrirModalEntregas = async (ativ: Atividade) => {
    setMissaoAberta(ativ);
    setCarregandoEntregas(true);
    setNotasTemp({});
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "buscar_entregas_atividade", idAtividade: ativ.id }) });
      const data = await res.json();
      if (data.status === "sucesso") {
        setEntregas(data.entregas);
        // Preenche notas temporárias com as que já existem
        const notasIniciais: Record<string, number> = {};
        data.entregas.forEach((ent: Entrega) => notasIniciais[ent.idEntrega] = ent.xpGanho);
        setNotasTemp(notasIniciais);
      }
    } catch { alert("Erro ao buscar entregas."); setMissaoAberta(null); } finally { setCarregandoEntregas(false); }
  };

  const avaliarAluno = async (entrega: Entrega) => {
    const nota = notasTemp[entrega.idEntrega] || 0;
    try {
      const res = await fetch(GOOGLE_API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "avaliar_entrega", idEntrega: entrega.idEntrega, matricula: entrega.matricula, xpGanho: nota, novoStatus: "Avaliado" }) });
      const data = await res.json();
      if (data.status === "sucesso") {
        alert("✅ Avaliado com sucesso!");
        // Atualiza status na tela
        setEntregas(entregas.map(e => e.idEntrega === entrega.idEntrega ? { ...e, status: "Avaliado", xpGanho: nota } : e));
      }
    } catch { alert("Erro ao avaliar."); }
  };

  if (!montado || !nomeUsuario) return <div className="min-h-screen bg-slate-100"></div>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      
      {/* MODAL DE ENTREGAS E CORREÇÃO */}
      {missaoAberta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">📝 Entregas: {missaoAberta.titulo}</h2>
              <button onClick={() => setMissaoAberta(null)} className="text-3xl leading-none hover:text-slate-300">&times;</button>
            </div>
            
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
               <span className="text-sm font-bold text-slate-600">Alunos que enviaram: {entregas.length}</span>
               <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">XP Máximo: {missaoAberta.xp}</span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {carregandoEntregas ? <p className="text-center text-slate-500 py-8 animate-pulse">Buscando cadernos...</p> : 
               entregas.length === 0 ? <p className="text-center text-slate-500 py-8">Nenhum aluno enviou resposta ainda.</p> :
               entregas.map((ent) => (
                 <div key={ent.idEntrega} className="border border-slate-200 rounded-lg bg-white p-4 flex flex-col md:flex-row gap-6">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                       <span className={`w-2 h-2 rounded-full ${ent.status === 'Avaliado' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                       <h3 className="font-bold text-slate-800">{ent.nomeAluno}</h3>
                       <span className="text-xs text-slate-400 font-mono">({ent.matricula})</span>
                     </div>
                     <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-700 text-sm break-all font-medium">
                       {missaoAberta.tipo === 'Projeto' && ent.resposta.startsWith('http') ? (
                         <a href={ent.resposta} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">🔗 Abrir Link do Projeto</a>
                       ) : (
                         <p><span className="text-slate-400 text-xs uppercase block mb-1">Resposta do Aluno:</span> {ent.resposta}</p>
                       )}
                       {missaoAberta.tipo === 'Quiz' && (
                         <p className={`mt-2 text-xs font-bold ${ent.resposta === missaoAberta.respostaCorreta ? 'text-emerald-600' : 'text-red-500'}`}>
                           Gabarito Oficial: {missaoAberta.respostaCorreta}
                         </p>
                       )}
                     </div>
                   </div>
                   
                   <div className="w-full md:w-48 border-l border-slate-100 pl-0 md:pl-6 flex flex-col justify-center gap-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">Dar Nota (XP)</label>
                     <input type="number" max={Number(missaoAberta.xp)} value={notasTemp[ent.idEntrega] ?? 0} onChange={(e) => setNotasTemp({...notasTemp, [ent.idEntrega]: Number(e.target.value)})} className="w-full border-2 border-emerald-200 focus:border-emerald-500 rounded p-2 text-center font-black text-emerald-700 outline-none" />
                     <button onClick={() => avaliarAluno(ent)} className={`w-full py-2 rounded text-sm font-bold text-white transition-colors ${ent.status === 'Avaliado' ? 'bg-slate-400 hover:bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                       {ent.status === 'Avaliado' ? 'Reavaliar' : 'Avaliar'}
                     </button>
                   </div>
                 </div>
               ))
              }
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD BASE */}
      <div className="max-w-7xl mx-auto">
        <Header carregando={isLoading} nomeUsuario={nomeUsuario} onLogout={() => { localStorage.removeItem("usuarioLogado"); window.location.href = "/"; }} />
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/trilhatech")} className="text-slate-500 hover:text-blue-600 font-bold">← Voltar</button>
          <h2 className="text-2xl font-black text-slate-800 border-l-2 border-blue-500 pl-3">Gestão de Ensino</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULÁRIO */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📝</span> {idEditando ? `Editando ${idEditando}` : "Nova Missão"}
                </h3>
                {idEditando && <button type="button" onClick={limparFormulario} className="text-xs text-red-500 hover:underline">Cancelar Edição</button>}
              </div>
              
              <form onSubmit={salvarNovaAtividade} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Missão</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700"><input type="radio" value="Projeto" checked={tipo === "Projeto"} onChange={() => setTipo("Projeto")} className="text-blue-600" /> Projeto</label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700"><input type="radio" value="Quiz" checked={tipo === "Quiz"} onChange={() => setTipo("Quiz")} className="text-amber-500" /> Quiz</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{tipo === "Quiz" ? "Pergunta" : "Instruções"}</label>
                  <textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2 resize-none"></textarea>
                </div>
                {tipo === "Quiz" && (
                  <div className="bg-amber-50 p-4 rounded border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2"><span className="font-bold text-slate-500">A)</span> <input type="text" value={opcaoA} onChange={(e) => setOpcaoA(e.target.value)} className="w-full border rounded p-1 text-sm text-slate-800" /></div>
                    <div className="flex items-center gap-2"><span className="font-bold text-slate-500">B)</span> <input type="text" value={opcaoB} onChange={(e) => setOpcaoB(e.target.value)} className="w-full border rounded p-1 text-sm text-slate-800" /></div>
                    <div className="flex items-center gap-2"><span className="font-bold text-slate-500">C)</span> <input type="text" value={opcaoC} onChange={(e) => setOpcaoC(e.target.value)} className="w-full border rounded p-1 text-sm text-slate-800" /></div>
                    <div className="flex items-center gap-2"><span className="font-bold text-slate-500">D)</span> <input type="text" value={opcaoD} onChange={(e) => setOpcaoD(e.target.value)} className="w-full border rounded p-1 text-sm text-slate-800" /></div>
                    <div className="pt-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qual é a certa?</label><select value={respostaCorreta} onChange={(e) => setRespostaCorreta(e.target.value)} className="w-full border rounded p-1 font-bold text-emerald-600 bg-white"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Limite</label><input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">XP</label><input type="number" value={xp} onChange={(e) => setXp(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-emerald-700 rounded p-2 font-bold" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma Alvo</label>
                  <select value={turmaAlvo} onChange={(e) => setTurmaAlvo(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded p-2"><option value="Todas">Todas as Turmas</option><option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option><option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option></select>
                </div>
                <button type="submit" disabled={salvando} className={`w-full text-white font-bold py-2.5 rounded transition-colors disabled:bg-slate-400 ${idEditando ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {salvando ? "Salvando..." : idEditando ? "Salvar Alterações" : "Publicar Missão"}
                </button>
              </form>
            </div>
          </div>

          {/* LISTAGEM DAS MISSÕES COM BOTÕES DE AÇÃO */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">📚 Missões Cadastradas</h3>
              </div>
              <div className="p-5">
                {isLoading ? <p className="text-slate-500 text-center py-8 animate-pulse">Carregando missões...</p> : 
                 atividades.length === 0 ? <p className="text-slate-500 text-center py-8">Nenhuma missão cadastrada ainda.</p> : (
                  <div className="space-y-4">
                    {atividades.map((ativ) => (
                      <div key={ativ.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4 group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{ativ.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ativ.tipo === 'Quiz' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'} border`}>{ativ.tipo}</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">⭐ {ativ.xp} XP</span>
                          </div>
                          <h4 className="font-bold text-slate-800">{ativ.titulo}</h4>
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{ativ.descricao}</p>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between min-w-30 gap-2">
                          <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => preencherEdicao(ativ)} className="p-2 text-slate-400 hover:text-amber-500 bg-white rounded shadow-sm border border-slate-200" title="Editar">✏️</button>
                            <button onClick={() => excluirAtividade(ativ.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded shadow-sm border border-slate-200" title="Excluir">🗑️</button>
                          </div>
                          <button onClick={() => abrirModalEntregas(ativ)} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded shadow-md transition-all hover:-translate-y-0.5">
                            Ver Entregas
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}