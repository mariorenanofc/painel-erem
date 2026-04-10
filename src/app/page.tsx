/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr"; // <-- Importação do SWR
import * as XLSX from "xlsx"; // Biblioteca para ler arquivos Excel

// Componentes
import Header from "../components/Header";
import SearchFilter from "../components/SearchFilter";
import StudentModal from "../components/StudentModal";
import StudentTable from "../components/StudentTable";
import LoginScreen from "../components/LoginScreen";
import { formatarDataInput, formatarDataTabela } from "../utils/formatters";
import { Aluno } from "../types";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL as string;

// Buscador do SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardAlunos() {
  // === ESTADOS DE LOGIN ===
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  // === ESTADOS DE FILTROS ===
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarSemEmail, setMostrarSemEmail] = useState(false);
  const [mostrarComObs, setMostrarComObs] = useState(false);

  // === ESTADOS DO MODAL ===
  const [modalAberto, setModalAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState<Aluno>({
    matricula: "",
    nome: "",
    dataNasc: "",
    email: "",
    turma: "",
    telefoneAluno: "",
    telefoneResponsavel: "",
    obs: "",
  });

  // === ESTADOS DO MODAL SIEPE ===
  const [modalSiepeAberto, setModalSiepeAberto] = useState(false);
  const [sincronizandoSiepe, setSincronizandoSiepe] = useState(false);
  const [resultadoSiepe, setResultadoSiepe] = useState<{
    inseridos: number;
    atualizados: number;
    total: number;
  } | null>(null);
  const [progressoSiepe, setProgressoSiepe] = useState({ lidas: 0, total: 0 });

  // === Busca de Dados (SWR) ===
  const {
    data: alunos = [],
    isLoading,
    mutate,
  } = useSWR(usuarioLogado ? GOOGLE_API_URL : null, fetcher);

  // 1. VERIFICAÇÃO DE LOGIN INICIAL
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");
    if (usuarioSalvo) setUsuarioLogado(usuarioSalvo);
    setVerificandoSessao(false);
  }, []);

  // 3. FILTRO OTIMIZADO COM useMemo
  const alunosFiltrados = useMemo(() => {
    if (!alunos || alunos.length === 0) return [];
    return alunos.filter((aluno: Aluno) => {
      const matchTurma =
        turmaSelecionada === "" || aluno.turma === turmaSelecionada;
      const matchBusca =
        busca === "" ||
        aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
        aluno.matricula.includes(busca);

      const isEmailVazio =
        !aluno.email ||
        aluno.email.trim() === "" ||
        aluno.email.toLowerCase() === "não encontrado" ||
        aluno.email.toLowerCase() === "sem email";
      const matchSemEmail = mostrarSemEmail ? isEmailVazio : true;

      // --- 2. NOVA REGRA DE OBSERVAÇÕES AQUI ---
      const temObs = aluno.obs && aluno.obs.trim() !== "";
      const matchObs = mostrarComObs ? temObs : true;

      return matchTurma && matchBusca && matchSemEmail && matchObs;
    });
  }, [alunos, turmaSelecionada, busca, mostrarSemEmail, mostrarComObs]);

  // === FUNÇÕES DE AÇÃO ===

  const exportarParaCSV = () => {
    if (alunosFiltrados.length === 0)
      return alert("⚠️ Não há alunos para exportar com os filtros atuais.");

    const cabecalhos = [
      "Nome",
      "Data de Nascimento",
      "Matricula",
      "Email",
      "Turma",
      "Tel. Pessoal",
      "Tel. Responsável",
      "Observacoes",
    ];
    const linhasCSV = alunosFiltrados.map((aluno: Aluno) =>
      [
        `"${aluno.nome}"`,
        `"${formatarDataTabela(aluno.dataNasc)}"`,
        `"${aluno.matricula}"`,
        `"${aluno.email || "Sem email"}"`,
        `"${aluno.turma}"`,
        `"${aluno.telefoneAluno || ""}"`,
        `"${aluno.telefoneResponsavel || ""}"`,
        `"${aluno.obs || ""}"`,
      ].join(";"),
    );

    const conteudoCSV = [cabecalhos.join(";"), ...linhasCSV].join("\n");
    const blob = new Blob(["\uFEFF" + conteudoCSV], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Relatorio_EREM_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === LEITOR DE EXCEL SIEPE (LÊ .XLS, .XLSX e .CSV - TODAS AS ABAS) ===
  const handleFileUploadSIEPE = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setSincronizandoSiepe(true);
    setResultadoSiepe(null);
    setProgressoSiepe({ lidas: 0, total: 0 });

    const files = Array.from(e.target.files);
    const todosAlunos: Aluno[] = [];

    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        const totalAbas = workbook.SheetNames.length;
        setProgressoSiepe({ lidas: 0, total: totalAbas });

        for (let idx = 0; idx < totalAbas; idx++) {
          const sheetName = workbook.SheetNames[idx];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as (string | number | boolean | null)[][];

          let turmaEscola = "Desconhecida";

          // DEBUG: Mostra no console do navegador (F12) o nome exato da aba que está sendo lida
          console.log(`Lendo aba [${idx}]: "${sheetName}"`);

          // 1. Tenta extrair a turma pelo nome da aba do Excel
          let matchTurma = sheetName.match(/EMI\s*-\s*(\d)\s*([A-Z])/i);

          // 2. FALLBACK: Tenta extrair lendo diretamente a Linha 4 (índice 3), Coluna A (índice 0)
          // Onde fica o formato descrito por você: "1ANO - I - EMI-1A"
          if (!matchTurma && jsonData[3] && jsonData[3][0]) {
            const celulaLinha4 = String(jsonData[3][0] || "");
            matchTurma = celulaLinha4.match(/EMI\s*-\s*(\d)\s*([A-Z])/i);
            console.log(`Fallback Linha 4 acionado: "${celulaLinha4}"`);
          }

          if (matchTurma) {
            turmaEscola = `${matchTurma[1]}º ANO ${matchTurma[2].toUpperCase()}`;
          }

          // Começa a ler a partir da linha 8 (índice 7) da respectiva aba
          const startIndex = 7;

          for (let i = startIndex; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 2) continue;

            const matricula = String(row[0] || "").trim();
            const nome = String(row[1] || "").trim();
            const dataNasc = String(row[2] || "").trim();

            if (matricula && !isNaN(Number(matricula)) && nome) {
              todosAlunos.push({
                matricula: matricula,
                nome: nome,
                dataNasc: dataNasc,
                email: "",
                turma: turmaEscola,
                telefoneAluno: "",
                telefoneResponsavel: "",
                obs: "",
              });
            }
          }

          // Atualiza a barra de progresso e dá um respiro para a tela renderizar a animação
          setProgressoSiepe({ lidas: idx + 1, total: totalAbas });
          await new Promise((resolve) => setTimeout(resolve, 10));
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
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "sincronizar_siepe",
          // Mapeamos o array para incluir "turmaEscola" que é o nome exato
          // da variável que o seu Google Apps Script está esperando receber!
          alunos: todosAlunos.map((a) => ({ ...a, turmaEscola: a.turma })),
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
      console.error(err);
      alert(
        "❌ Erro ao processar o(s) arquivo(s) Excel. Certifique-se de que o arquivo não está corrompido.",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
        headers: { "Content-Type": "text/plain;charset=utf-8" },
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

  const inscreverNoTrilha = async (matricula: string, turmaCurso: string) => {
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "inscrever_trilhatech",
          matricula,
          turmaCurso,
          statusCurso: "Inscrito",
        }),
      });
      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert("✅ Inscrição realizada com sucesso!");
        mutate(); // 🚀 Atualiza a tabela na hora para a etiqueta do foguete aparecer!
        setModalAberto(false);
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro ao conectar com o sistema: " + erro);
    }
  };

  const mudarStatusTrilha = async (matricula: string, novoStatus: string) => {
    const acaoTexto = novoStatus === "Ativo" ? "APROVAR" : "DESCLASSIFICAR";
    if (
      !confirm(
        `Deseja realmente ${acaoTexto} este aluno no projeto Trilha Tech?`,
      )
    )
      return;

    setSalvando(true);
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "mudar_status_trilhatech",
          matricula,
          novoStatus,
        }),
      });
      const resposta = await res.json();
      if (resposta.status === "sucesso") {
        alert(
          `✅ Aluno ${novoStatus === "Ativo" ? "aprovado" : "desclassificado"} com sucesso!`,
        );
        mutate();
        setModalAberto(false);
      } else {
        alert("⚠️ " + resposta.mensagem);
      }
    } catch (erro) {
      alert("❌ Erro ao conectar com o sistema: " + erro);
    } finally {
      setSalvando(false);
    }
  };

  // Enquanto lê o navegador, não mostra nada
  if (verificandoSessao)
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">
        Verificando sessão...
      </div>
    );

  // Se NÃO tiver logado, mostra a tela de Login
  if (!usuarioLogado)
    return (
      <LoginScreen
        onLoginSuccess={(nome) => setUsuarioLogado(nome)}
        apiUrl={GOOGLE_API_URL}
      />
    );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {/* --- MODAL SINCRONIZADOR SIEPE --- */}
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
                  setProgressoSiepe({ lidas: 0, total: 0 });
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
                        ? "Processando..."
                        : "Clique aqui para subir o Excel"}
                    </p>

                    {/* BARRA DE PROGRESSO */}
                    {sincronizandoSiepe && progressoSiepe.total > 0 && (
                      <div className="mt-4 w-full">
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(progressoSiepe.lidas / progressoSiepe.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Lendo aba {progressoSiepe.lidas} de{" "}
                          {progressoSiepe.total}...
                        </p>
                      </div>
                    )}
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
