/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import { apiGeral, apiTutor } from "@/src/services/api";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [nomeUsuario] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioLogado") || ""
      : "",
  );
  const [montado, setMontado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<
    "geral" | "links" | "modulos" | "onboarding"
  >("geral");

  // Estado das Configurações
  const [configs, setConfigs] = useState<Record<string, string>>({
    NOME_ESCOLA: "",
    NOME_PROJETO: "",
    TURMAS_PROJETO: "",
    LINK_WPP_T1: "",
    LINK_WPP_T2: "",
    SENHA_CHECKIN: "",
    LIMITE_XP_DIARIO: "",
    LIMITE_PIX_DIARIO: "",
    MODO_REPOSICAO: "DESLIGADO",
    LINK_PLANILHA: "",
    LINK_CLASSROOM: "",
    LINK_MATRIZ: "",
    LINK_AJUDA: "",
    LINK_CRONOGRAMA: "",
  });

  useEffect(() => {
    setMontado(true);
    if (!nomeUsuario) {
      window.location.href = "/";
      return;
    }

    const buscarDados = async () => {
      try {
        const res = await apiGeral.buscarConfiguracoes();

        if (res.status === "sucesso" && res.configuracoes) {
          const dados = res.configuracoes;

          // Função segura para extrair turmas (caso venha como array ou string)
          const formatarTurmas = (t: any) => {
            if (!t) return "";
            if (Array.isArray(t)) return t.join(", ");
            return String(t);
          };

          setConfigs((prev) => ({
            ...prev,
            NOME_ESCOLA:
              dados.NOME_ESCOLA || dados.nomeEscola || prev.NOME_ESCOLA,
            NOME_PROJETO:
              dados.NOME_PROJETO || dados.nomeProjeto || prev.NOME_PROJETO,
            TURMAS_PROJETO:
              dados.TURMAS_PROJETO ||
              formatarTurmas(dados.turmas) ||
              prev.TURMAS_PROJETO,
            LINK_WPP_T1: dados.LINK_WPP_T1 || prev.LINK_WPP_T1,
            LINK_WPP_T2: dados.LINK_WPP_T2 || prev.LINK_WPP_T2,
            SENHA_CHECKIN:
              dados.SENHA_CHECKIN || dados.senhaLousa || prev.SENHA_CHECKIN,
            LIMITE_XP_DIARIO:
              dados.LIMITE_XP_DIARIO !== undefined
                ? String(dados.LIMITE_XP_DIARIO)
                : prev.LIMITE_XP_DIARIO,
            LIMITE_PIX_DIARIO:
              dados.LIMITE_PIX_DIARIO !== undefined
                ? String(dados.LIMITE_PIX_DIARIO)
                : prev.LIMITE_PIX_DIARIO,
            MODO_REPOSICAO:
              dados.MODO_REPOSICAO ||
              dados.modoReposicao ||
              prev.MODO_REPOSICAO,
            LINK_PLANILHA:
              dados.LINK_PLANILHA || dados.linkPlanilha || prev.LINK_PLANILHA,
            LINK_CLASSROOM:
              dados.LINK_CLASSROOM ||
              dados.linkClassroom ||
              prev.LINK_CLASSROOM,
            LINK_MATRIZ:
              dados.LINK_MATRIZ || dados.linkMatriz || prev.LINK_MATRIZ,
            LINK_AJUDA: dados.LINK_AJUDA || dados.linkAjuda || prev.LINK_AJUDA,
            LINK_CRONOGRAMA:
              dados.LINK_CRONOGRAMA ||
              dados.linkCronograma ||
              prev.LINK_CRONOGRAMA,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar configurações iniciais", error);
      } finally {
        setCarregando(false);
        // Força onboarding se não houver link
        if (!configs.LINK_PLANILHA) {
          setAbaAtiva("onboarding");
        }
      }
    };

    buscarDados();
  }, [configs.LINK_PLANILHA, nomeUsuario]);

  const handleChange = (chave: string, valor: string) => {
    setConfigs((prev) => ({ ...prev, [chave]: valor }));
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    try {
      const res = await apiTutor.salvarConfiguracoes(configs);
      if (res.status === "sucesso") {
        alert("✅ Configurações salvas com sucesso no banco de dados!");
      } else {
        alert("⚠️ " + res.mensagem);
      }
    } catch (e) {
      alert("❌ Erro ao tentar salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  };

  if (!montado || !nomeUsuario)
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"></div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors duration-300">
        <div className="max-w-384 w-full mx-auto px-4 lg:px-8 py-3">
          <Header
            carregando={carregando}
            nomeUsuario={nomeUsuario}
            onLogout={() => {
              localStorage.removeItem("usuarioLogado");
              window.location.href = "/";
            }}
          />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6 mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/trilhatech/aulas")}
                className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ← Voltar para Aulas
              </button>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 border-l-4 border-indigo-600 pl-3 transition-colors">
                Painel de Configurações
              </h2>
            </div>
            <button
              onClick={salvarConfiguracoes}
              disabled={salvando}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {salvando ? "Salvando..." : "💾 Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-384 w-full mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* MENU LATERAL DE ABAS */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setAbaAtiva("geral")}
              className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all ${abaAtiva === "geral" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              ⚙️ Ajustes Gerais
            </button>
            <button
              onClick={() => setAbaAtiva("links")}
              className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all ${abaAtiva === "links" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              🔗 Links e WhatsApp
            </button>
            <button
              onClick={() => setAbaAtiva("modulos")}
              className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all ${abaAtiva === "modulos" ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              📚 Módulos & SIEPE
            </button>
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setAbaAtiva("onboarding")}
                className={`w-full text-left px-5 py-4 rounded-xl font-black transition-all ${abaAtiva === "onboarding" ? "bg-amber-500 text-white shadow-md" : "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:scale-[1.02]"}`}
              >
                🚀 Guia de 1º Acesso
              </button>
            </div>
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-colors duration-300">
              {carregando ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 dark:border-indigo-400"></div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  {/* CONTEÚDO: GERAL */}
                  {abaAtiva === "geral" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                        Ajustes Gerais da Escola
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Nome da Escola
                          </label>
                          <input
                            type="text"
                            value={configs.NOME_ESCOLA}
                            onChange={(e) =>
                              handleChange("NOME_ESCOLA", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Nome do Projeto
                          </label>
                          <input
                            type="text"
                            value={configs.NOME_PROJETO}
                            onChange={(e) =>
                              handleChange("NOME_PROJETO", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Turmas do Projeto (Separadas por vírgula)
                          </label>
                          <input
                            type="text"
                            value={configs.TURMAS_PROJETO}
                            onChange={(e) =>
                              handleChange("TURMAS_PROJETO", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Senha do Check-in Presencial
                          </label>
                          <input
                            type="text"
                            value={configs.SENHA_CHECKIN}
                            onChange={(e) =>
                              handleChange(
                                "SENHA_CHECKIN",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold font-mono focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Modo Reposição
                          </label>
                          <select
                            value={configs.MODO_REPOSICAO}
                            onChange={(e) =>
                              handleChange("MODO_REPOSICAO", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                          >
                            <option value="DESLIGADO">
                              Desligado (Padrão)
                            </option>
                            <option value="LIGADO">
                              Ligado (Permite check-in retroativo)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 text-emerald-600 dark:text-emerald-500">
                            Limite de XP Diário
                          </label>
                          <input
                            type="number"
                            value={configs.LIMITE_XP_DIARIO}
                            onChange={(e) =>
                              handleChange("LIMITE_XP_DIARIO", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-emerald-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 text-blue-600 dark:text-blue-500">
                            Limite PIX Diário (Loja)
                          </label>
                          <input
                            type="number"
                            value={configs.LIMITE_PIX_DIARIO}
                            onChange={(e) =>
                              handleChange("LIMITE_PIX_DIARIO", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO: LINKS E INTEGRAÇÕES */}
                  {abaAtiva === "links" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                        Integrações e Atalhos
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-500 uppercase mb-2 flex items-center gap-2">
                            <span>💬</span> WhatsApp - Turma 1
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_WPP_T1}
                            onChange={(e) =>
                              handleChange("LINK_WPP_T1", e.target.value)
                            }
                            className="w-full bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:border-emerald-500 outline-none transition-colors font-mono text-xs"
                          />
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-500 uppercase mb-2 flex items-center gap-2">
                            <span>💬</span> WhatsApp - Turma 2
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_WPP_T2}
                            onChange={(e) =>
                              handleChange("LINK_WPP_T2", e.target.value)
                            }
                            className="w-full bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:border-emerald-500 outline-none transition-colors font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <span>📊</span> Link da Planilha Banco de Dados
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_PLANILHA}
                            onChange={(e) =>
                              handleChange("LINK_PLANILHA", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <span>🏫</span> Link do Google Classroom
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_CLASSROOM}
                            onChange={(e) =>
                              handleChange("LINK_CLASSROOM", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <span>📑</span> Link da Matriz Curricular
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_MATRIZ}
                            onChange={(e) =>
                              handleChange("LINK_MATRIZ", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <span>🗓️</span> Link do Cronograma
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_CRONOGRAMA}
                            onChange={(e) =>
                              handleChange("LINK_CRONOGRAMA", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <span>🆘</span> Link de Ajuda / Suporte
                          </label>
                          <input
                            type="url"
                            value={configs.LINK_AJUDA}
                            onChange={(e) =>
                              handleChange("LINK_AJUDA", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO: MÓDULOS */}
                  {abaAtiva === "modulos" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                        Gestão de Módulos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Importação SIEPE
                          </label>
                          <select
                            value={configs.STATUS_SIEPE}
                            onChange={(e) =>
                              handleChange("STATUS_SIEPE", e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                          >
                            <option value="ATIVO">
                              Ativado (Recebendo dados)
                            </option>
                            <option value="INATIVO">Pausado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Módulos Ativos (Separados por vírgula)
                          </label>
                          <input
                            type="text"
                            value={configs.MODULOS_ATIVOS}
                            onChange={(e) =>
                              handleChange("MODULOS_ATIVOS", e.target.value)
                            }
                            placeholder="Módulo 1, Nano-curso Cloud..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-bold focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 mt-6">
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                          <strong>Dica:</strong> A estrutura detalhada dos
                          módulos e as chaves de importação avançadas continuam
                          disponíveis diretamente na aba{" "}
                          <code>controle_modulos</code> do seu banco de dados
                          (Planilha).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO: PRIMEIRO ACESSO (ONBOARDING) */}
                  {abaAtiva === "onboarding" && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <span className="text-5xl animate-bounce block mb-4">
                          👋
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                          Bem-vindo ao Portal Trilha Tech!
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                          Vamos configurar o sistema na sua conta do Google em 3
                          passos rápidos.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5 rounded-2xl relative">
                          <span className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 text-white font-black flex items-center justify-center rounded-full border-4 border-white dark:border-slate-900 shadow-md">
                            1
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 ml-4">
                            Criar o seu Banco de Dados
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 ml-4 mb-3">
                            Todo o sistema funciona baseado numa Planilha do
                            Google. Faça uma cópia do modelo oficial para o seu
                            Drive.
                          </p>
                          <a
                            href="https://docs.google.com/spreadsheets/d/1-J3PKSlTOZDP6ce2WXBwb2JbTxkd-tGdmnTRTAw8m8M/copy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            🔗 Fazer cópia do Template Base
                          </a>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5 rounded-2xl relative">
                          <span className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 text-white font-black flex items-center justify-center rounded-full border-4 border-white dark:border-slate-900 shadow-md">
                            2
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 ml-4">
                            Ativar a API (Apps Script)
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 ml-4 mb-3">
                            Na sua planilha recém-copiada, vá em{" "}
                            <strong>Extensões &gt; Apps Script</strong>. No
                            canto superior direito, clique em{" "}
                            <strong>Implantar &gt; Nova Implantação</strong>.
                            Escolha tipo &quot;App da Web&quot;, execute como
                            &quot;Você&quot; e defina acesso para &quot;Qualquer
                            pessoa&quot;.
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5 rounded-2xl relative">
                          <span className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 text-white font-black flex items-center justify-center rounded-full border-4 border-white dark:border-slate-900 shadow-md">
                            3
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 ml-4">
                            Vincular a URL no Frontend
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 ml-4 mb-3">
                            Copie a URL gerada no passo anterior. No código
                            fonte deste portal (no arquivo <code>.env</code> ou{" "}
                            <code>api.ts</code>), cole o link na variável{" "}
                            <code>NEXT_PUBLIC_API_URL</code>.
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                        <button
                          onClick={() => setAbaAtiva("geral")}
                          className="bg-slate-800 dark:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
                        >
                          Concluí a instalação! Iniciar configuração
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
