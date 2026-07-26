/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from "xlsx";

// Componentes
import Header from "../components/Header";
import SearchFilter from "../components/SearchFilter";
import StudentModal from "../components/StudentModal";
import StudentTable from "../components/StudentTable";
import LoginScreen from "../components/LoginScreen";
import { formatarDataInput } from "../utils/formatters";
import { Aluno } from "../types";
import { useToast } from "@/src/contexts/ToastContext"; // <-- IMPORTAÇÃO DO CONTEXTO
import ThreeInteractiveBg from "../components/ThreeInteractiveBg";
import TrilhaTechLoader from "../components/TrilhaTechLoader";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL as string;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardAlunos() {
  const { toast } = useToast(); // <-- INICIALIZAÇÃO DO HOOK

  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarSemEmail, setMostrarSemEmail] = useState(false);
  const [mostrarComObs, setMostrarComObs] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState<Aluno>({
    nome: "",
    dataNasc: "",
    matricula: "",
    email: "",
    turma: "",
    telefoneAluno: "",
    telefoneResponsavel: "",
    obs: "",
  });

  const [modalSiepeAberto, setModalSiepeAberto] = useState(false);
  const [sincronizandoSiepe, setSincronizandoSiepe] = useState(false);
  const [resultadoSiepe, setResultadoSiepe] = useState<{
    inseridos: number;
    atualizados: number;
    total: number;
  } | null>(null);

  const { data, error, isLoading, mutate } = useSWR(GOOGLE_API_URL, fetcher);

  useEffect(() => {
    const sessao = localStorage.getItem("usuarioLogado");
    if (sessao) setUsuarioLogado(sessao);
    setVerificandoSessao(false);
  }, []);

  const alunosFiltrados = useMemo(() => {
    if (!data) return [];

    // Identificamos que a API retorna o array diretamente (ex: Array(362))
    let listaAlunos: Aluno[] = [];
    if (Array.isArray(data)) {
      listaAlunos = data; // A API retornou diretamente a lista
    } else if (data.status === "sucesso" && Array.isArray(data.alunos)) {
      listaAlunos = data.alunos; // Comportamento em formato de objeto
    } else {
      console.error("Formato de dados inesperado. Resposta recebida:", data);
      return [];
    }

    return listaAlunos.filter((aluno: Aluno) => {
      const matchesTurma =
        turmaSelecionada === "" || aluno.turma === turmaSelecionada;
      const matchesBusca =
        (aluno.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (aluno.matricula || "").includes(busca);
      const matchesSemEmail =
        !mostrarSemEmail || !aluno.email || aluno.email.trim() === "";
      const matchesComObs =
        !mostrarComObs || (aluno.obs && aluno.obs.trim() !== "");
      return matchesTurma && matchesBusca && matchesSemEmail && matchesComObs;
    });
  }, [data, turmaSelecionada, busca, mostrarSemEmail, mostrarComObs]);

  const exportarParaCSV = () => {
    if (alunosFiltrados.length === 0) {
      toast("Nenhum aluno encontrado para exportar.", "warning", "Atenção");
      return;
    }
    const cabecalho = [
      "Matrícula",
      "Nome",
      "Turma",
      "Data de Nascimento",
      "E-mail",
      "Telefone",
    ];
    const linhas = alunosFiltrados.map(
      (a: Aluno) =>
        `${a.matricula},"${a.nome}",${a.turma},${a.dataNasc},${
          a.email
        },${a.telefoneAluno || ""}`,
    );

    const csvContent = [cabecalho.join(","), ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Relatorio_Alunos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUploadSIEPE = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setSincronizandoSiepe(true);
    setResultadoSiepe(null);

    const files = Array.from(e.target.files);
    const todosAlunos: unknown[] = [];

    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as (string | number | boolean)[][];

          let turmaEscola = "Desconhecida";
          let indexCabecalho = -1;

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const celulaInicial = String(row[0] || "").trim();

            if (celulaInicial.includes("EMI-")) {
              const partes = celulaInicial.split("EMI-")[1];
              if (partes && partes.length >= 2)
                turmaEscola = `${partes.charAt(0)}º ANO ${partes.charAt(1)}`;
            }

            if (celulaInicial.toLowerCase() === "matrícula") {
              indexCabecalho = i;
            }
          }

          if (indexCabecalho > -1) {
            for (let i = indexCabecalho + 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length < 3) continue;

              const matricula = String(row[0] || "").trim();
              const nome = String(row[1] || "").trim();
              const dataNasc = String(row[2] || "").trim();

              if (matricula && !isNaN(Number(matricula)) && nome) {
                todosAlunos.push({
                  matricula: matricula,
                  nome: nome,
                  dataNasc: dataNasc,
                  turmaEscola: turmaEscola,
                });
              }
            }
          }
        }
      }

      if (todosAlunos.length === 0) {
        toast(
          "Nenhum aluno válido encontrado. Verifique se as planilhas contêm os dados no formato SIEPE.",
          "warning",
          "Atenção",
        );
        setSincronizandoSiepe(false);
        return;
      }

      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "sincronizar_siepe",
          alunos: todosAlunos,
        }),
      });
      const resData = await res.json();

      if (resData.status === "sucesso") {
        setResultadoSiepe({
          inseridos: resData.inseridos,
          atualizados: resData.atualizados,
          total: todosAlunos.length,
        });
        mutate();
      } else {
        toast(
          "Erro no Servidor: " + resData.mensagem,
          "error",
          "Falha na Sincronização",
        );
      }
    } catch (err) {
      toast(
        "Erro ao processar o(s) arquivo(s) Excel.",
        "error",
        "Falha de Leitura",
      );
    } finally {
      setSincronizandoSiepe(false);
    }
  };

  const fazerLogout = () => {
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
  };

  const abrirModalNovo = () => {
    setIsEditing(false);
    setFormData({
      nome: "",
      dataNasc: "",
      matricula: "",
      email: "",
      turma: "",
      telefoneAluno: "",
      telefoneResponsavel: "",
      obs: "",
    });
    setModalAberto(true);
  };

  const abrirVisualizacao = (aluno: Aluno) => {
    setIsEditing(true);
    setFormData({ ...aluno, dataNasc: formatarDataInput(aluno.dataNasc) });
    setModalAberto(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const salvarAluno = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);
    try {
      // O backend espera exatamente a ação "salvar_aluno" para ambas as operações
      const action = "salvar_aluno";
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action, ...formData }),
      });

      const text = await res.text();
      try {
        const resData = JSON.parse(text);
        if (resData.status === "sucesso") {
          toast("Dados do aluno salvos com sucesso!", "success", "Salvo!");
          setModalAberto(false);
          mutate();
        } else {
          toast(resData.mensagem, "warning", "Ops!");
        }
      } catch (parseError) {
        console.error("Erro na API (Resposta não foi um JSON):", text);
        toast(
          "Erro no servidor ao salvar. Aperte F12 e veja o console para mais detalhes.",
          "error",
          "Falha no Servidor",
        );
      }
    } catch (err) {
      toast("Erro de conexão ao salvar aluno.", "error", "Erro de Rede");
    } finally {
      setSalvando(false);
    }
  };

  const inscreverNoTrilha = async (matricula: string, turmaCurso: string) => {
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "inscrever_trilhatech",
          matricula,
          turmaCurso,
          statusCurso: "Inscrito",
        }),
      });
      const resData = await res.json();
      if (resData.status === "sucesso") {
        toast(resData.mensagem, "success", "Inscrição Realizada!");
        mutate(); // Atualiza a lista com o novo status
        setModalAberto(false);
      } else {
        toast(resData.mensagem, "warning", "Atenção");
      }
    } catch (err) {
      toast("Erro de conexão ao inscrever aluno.", "error", "Falha de Rede");
    }
  };

  const mudarStatusTrilha = async (matricula: string, novoStatus: string) => {
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "mudar_status_trilhatech",
          matricula,
          novoStatus,
        }),
      });
      const resData = await res.json();
      if (resData.status === "sucesso") {
        toast(resData.mensagem, "success", "Status Atualizado!");
        mutate(); // Atualiza a lista
        setModalAberto(false);
      } else {
        toast(resData.mensagem, "warning", "Atenção");
      }
    } catch (err) {
      toast("Erro de conexão ao mudar status.", "error", "Falha de Rede");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400 p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[40vw] h-[40vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none" />
        
        <div className="glass-panel p-8 rounded-2xl max-w-lg text-center border border-red-500/20 relative z-10 shadow-2xl">
          <h2 className="text-2xl font-display font-black text-white mb-3">
            ❌ Erro ao Carregar Dados
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Não foi possível conectar-se à base de dados. Isso pode ocorrer por
            um problema de rede ou uma falha na API.
          </p>
          <p className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded-xl border border-white/5 font-mono">
            <strong>Dica:</strong> Verifique o console do navegador (F12) para
            mais detalhes técnicos sobre o erro.
          </p>
        </div>
      </div>
    );
  }

  if (verificandoSessao)
    return <TrilhaTechLoader />;

  if (!usuarioLogado) {
    return (
      <LoginScreen
        onLoginSuccess={(nome) => setUsuarioLogado(nome)}
        apiUrl={GOOGLE_API_URL}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-8 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Three.js interactive custom background */}
      <ThreeInteractiveBg />

      {/* Ambient background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[50vw] h-[50vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none" />

      {modalSiepeAberto && (
        <div className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel-heavy rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10">
            <div className="bg-emerald-600/25 border-b border-white/10 text-white p-5 flex justify-between items-center">
              <h2 className="font-display font-black text-lg flex items-center gap-2">
                <span>🔄</span> Sincronizador SIEPE
              </h2>
              <button
                onClick={() => {
                  setModalSiepeAberto(false);
                  setResultadoSiepe(null);
                }}
                className="cursor-pointer text-slate-400 hover:text-white transition-colors text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 text-center">
              {resultadoSiepe ? (
                <div className="animate-in zoom-in">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="font-display font-black text-white text-lg mb-2">
                    Sincronização Concluída!
                  </h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    Base escolar devidamente atualizada no servidor.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-300">
                    <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl shadow-inner">
                      Novatos Cadastrados
                      <br />
                      <span className="text-3xl font-display font-black text-emerald-400 mt-2 block">
                        {resultadoSiepe.inseridos}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl shadow-inner">
                      Alunos Atualizados
                      <br />
                      <span className="text-3xl font-display font-black text-brand-secondary mt-2 block">
                        {resultadoSiepe.atualizados}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed text-left">
                    Selecione o arquivo <strong>.xls ou .xlsx</strong> do SIEPE.
                    O sistema lerá todas as abas automaticamente.
                  </p>
                  <div className="border-2 border-dashed border-slate-700 hover:border-brand-primary/50 rounded-2xl p-8 bg-slate-950/35 relative transition-colors cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileUploadSIEPE}
                      disabled={sincronizandoSiepe}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                    />
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {sincronizandoSiepe ? "⚙️" : "📊"}
                    </div>
                    <p className="font-bold text-slate-300 group-hover:text-white transition-colors text-sm">
                      {sincronizandoSiepe
                        ? "Processando arquivos..."
                        : "Clique ou arraste o arquivo Excel aqui"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <Header
          carregando={isLoading}
          nomeUsuario={usuarioLogado}
          onLogout={fazerLogout}
        />

        <div className="flex justify-between items-center mb-8 mt-6">
          <h2 className="text-3xl font-display font-black text-slate-800 dark:text-white dark:text-neon-glow leading-none">Gestão de Alunos</h2>
          <button
            onClick={() => setModalSiepeAberto(true)}
            className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs uppercase tracking-wider font-black py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <span>🔄</span> Importar SIEPE
          </button>
        </div>

        <SearchFilter
          turmaSelecionada={turmaSelecionada}
          setTurmaSelecionada={setTurmaSelecionada}
          busca={busca}
          setBusca={setBusca}
          abrirModalNovoAluno={abrirModalNovo}
          mostrarSemEmail={mostrarSemEmail}
          setMostrarSemEmail={setMostrarSemEmail}
          mostrarComObs={mostrarComObs}
          setMostrarComObs={setMostrarComObs}
          exportarDados={exportarParaCSV}
        />

        <div className="mt-6 glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <StudentTable
            alunosFiltrados={alunosFiltrados}
            preencherEdicao={abrirVisualizacao}
          />
          
          {isLoading && (
            <div className="text-center p-16 font-bold text-slate-400 animate-pulse bg-slate-950/20">
              Carregando alunos...
            </div>
          )}
        </div>

        <StudentModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          formData={formData}
          handleChange={handleChange}
          salvarAluno={salvarAluno}
          salvando={salvando}
          isEditing={isEditing}
          inscreverNoTrilha={inscreverNoTrilha}
          mudarStatusTrilha={mudarStatusTrilha}
        />
      </div>
    </div>
  );
}
