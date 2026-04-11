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

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL as string;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardAlunos() {
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
    if (alunosFiltrados.length === 0)
      return alert("Nenhum aluno para exportar.");
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
        alert(
          "⚠️ Nenhum aluno válido encontrado. Verifique se as planilhas contêm os dados no formato SIEPE.",
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
        alert("❌ Erro no Servidor: " + resData.mensagem);
      }
    } catch (err) {
      alert("❌ Erro ao processar o(s) arquivo(s) Excel.");
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
      const action = isEditing ? "editar_aluno" : "adicionar_aluno";
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action, ...formData }),
      });
      const resData = await res.json();
      if (resData.status === "sucesso") {
        setModalAberto(false);
        mutate();
      } else {
        alert(resData.mensagem);
      }
    } catch (err) {
      alert("Erro ao salvar aluno.");
    } finally {
      setSalvando(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-red-600">
        <div className="text-center p-8 bg-white shadow-2xl rounded-2xl max-w-lg mx-auto">
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            ❌ Erro ao Carregar Dados
          </h2>
          <p className="text-slate-600 mb-4">
            Não foi possível conectar-se à base de dados. Isso pode ocorrer por
            um problema de rede ou uma falha na API.
          </p>
          <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
            <strong>Dica:</strong> Verifique o console do navegador (F12) para
            mais detalhes técnicos sobre o erro.
          </p>
        </div>
      </div>
    );
  }

  if (verificandoSessao)
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">
        Verificando sessão...
      </div>
    );

  if (!usuarioLogado) {
    return (
      <LoginScreen
        onLoginSuccess={(nome) => setUsuarioLogado(nome)}
        apiUrl={GOOGLE_API_URL}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {modalSiepeAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-700 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                <span>🔄</span> Sincronizador SIEPE
              </h2>
              <button
                onClick={() => {
                  setModalSiepeAberto(false);
                  setResultadoSiepe(null);
                }}
                className="text-3xl leading-none hover:text-emerald-200"
              >
                &times;
              </button>
            </div>
            <div className="p-6 text-center">
              {resultadoSiepe ? (
                <div className="animate-in zoom-in">
                  <div className="text-5xl mb-2">✅</div>
                  <h3 className="font-bold text-emerald-800 text-lg mb-1">
                    Sincronização Concluída!
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Base escolar devidamente atualizada.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      Novatos Cadastrados
                      <br />
                      <span className="text-2xl text-emerald-600">
                        {resultadoSiepe.inseridos}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      Alunos Atualizados
                      <br />
                      <span className="text-2xl text-blue-600">
                        {resultadoSiepe.atualizados}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    Selecione o arquivo <strong>.xls ou .xlsx</strong> do SIEPE.
                    O sistema lerá todas as abas automaticamente.
                  </p>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 relative hover:bg-slate-100 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileUploadSIEPE}
                      disabled={sincronizandoSiepe}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="text-4xl mb-3">
                      {sincronizandoSiepe ? "⚙️" : "📊"}
                    </div>
                    <p className="font-bold text-slate-700">
                      {sincronizandoSiepe
                        ? "Lendo Planilhas..."
                        : "Clique aqui para subir o Excel"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <Header
          carregando={isLoading}
          nomeUsuario={usuarioLogado}
          onLogout={fazerLogout}
        />

        <div className="flex justify-between items-center mb-6 mt-4">
          <h2 className="text-2xl font-black text-slate-800">Alunos</h2>
          <button
            onClick={() => setModalSiepeAberto(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"
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

        <StudentTable
          alunosFiltrados={alunosFiltrados}
          preencherEdicao={abrirVisualizacao}
        />

        {isLoading && (
          <div className="text-center p-10 font-semibold text-slate-500">
            Carregando alunos...
          </div>
        )}

        <StudentModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          formData={formData}
          handleChange={handleChange}
          salvarAluno={salvarAluno}
          salvando={salvando}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
}
