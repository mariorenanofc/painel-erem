"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiTutor } from "@/src/services/api";
import { useToast } from "@/src/contexts/ToastContext";
import ReactMarkdown from "react-markdown";

interface LancamentoNovidadesModalProps {
  onClose: () => void;
}

interface DadosTelemetria {
  versao: string;
  ultimaLeitura: string | null;
  resumo: {
    totalAlunos: number;
    totalVisualizados: number;
    percentualGeral: number;
  };
  porTurma: Array<{
    turma: string;
    total: number;
    visualizados: number;
    percentual: number;
  }>;
  pendentes: Array<{
    matricula: string;
    nome: string;
    turma: string;
  }>;
}

export const TEMPLATE_HOJE_MARKDOWN = `### 🏆 Ranking Semanal Apurado (Semana 46)!
⚡ **Fechamento Automático:** Apuração oficial da Semana 46 consolidada com sincronização direta do Google Classroom.
🎁 **Bônus de XP no Top 10:** Os estudantes com melhor desempenho na semana já receberam seus pontos extras na conta!
📊 **Consulte sua Posição:** Acesse a aba Ranking no Portal para ver o pódio da sua turma e o ranking geral.

---

### 🎨 Nova Identidade Visual PFT (Projeto Florescendo Talentos)
✨ **Paleta Oficial PFT:** Novo design harmônico com Laranja Vibrante, Azul Marinho Noturno, Areia Suave e Verde Broto para status de conclusão.
🌐 **Grafismo Tubular Exclusivo:** Fundo dinâmico com circuitos e nós digitais inspirados nas trilhas tecnológicas do projeto.
🌗 **Modo Claro e Modo Escuro:** Adaptação completa de alto contraste em 100% das telas, botões, modais e relatórios.

---

### 🚀 Cockpit & Telas Docentes Revitalizadas
🌟 **Portal do Aluno:** Cockpit e cards de missões com gradientes canônicos e legibilidade reforçada em ambos os temas.
🛡️ **Painel Docente / Tutor:** Dashboards, frequências, analytics e gabaritos alinhados à mesma linguagem visual moderna.
⚡ **Zero Textos Ocultos:** Correções completas em estados de foco, hover e transições de tema.

---

### 🏛️ Santuário PFT & Leaderboards
👏 **Aplausos e Stories:** Efeitos de celebração e geração de cards 9:16 integrados à nova atmosfera PFT.
🏆 **Leaderboards e Certificados:** Visual refinado para honras escolares e certificados oficiais de conclusão.
🏎️ **Performance e Fluidez:** Zero leituras extras no banco de dados e transição CSS instantânea.`;

export default function LancamentoNovidadesModal({ onClose }: LancamentoNovidadesModalProps) {
  const { toast } = useToast();
  const [rascunho, setRascunho] = useState(
    "Hoje implementamos: 1) Transição visual completa para a identidade oficial do PFT (Projeto Florescendo Talentos) em 100% do portal (Laranja, Azul Marinho, Areia e Verde Broto); 2) Fundo com grafismo tubular de circuitos e nós tecnológicos; 3) Ajustes finos de alto contraste e hover no Portal, Cockpit, Tutor e Hall da Fama."
  );
  const [versao, setVersao] = useState("v2.4.0");
  const [markdownGerado, setMarkdownGerado] = useState(TEMPLATE_HOJE_MARKDOWN);
  const [isGerando, setIsGerando] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<"editor" | "telemetria">("editor");
  const [telemetria, setTelemetria] = useState<DadosTelemetria | null>(null);
  const [carregandoTelemetria, setCarregandoTelemetria] = useState(false);

  const carregarTelemetria = async () => {
    setCarregandoTelemetria(true);
    try {
      const res = await fetch(`/api/tutor/novidades/engajamento?versao=${versao}`);
      const data = (await res.json()) as { status: string } & DadosTelemetria;
      if (data && data.status === "sucesso") {
        setTelemetria(data);
      }
    } catch (e: unknown) {
      console.warn("Erro ao buscar telemetria:", e);
    } finally {
      setCarregandoTelemetria(false);
    }
  };

  useEffect(() => {
    if (abaAtiva === "telemetria") {
      carregarTelemetria();
    }
  }, [abaAtiva, versao]);

  const carregarTemplateHoje = () => {
    setVersao("v2.4.0");
    setMarkdownGerado(TEMPLATE_HOJE_MARKDOWN);
    toast("Novidades da versão v2.4.0 carregadas!", "info", "Atualizado");
  };

  const handleGerarIA = async () => {
    if (!rascunho.trim()) {
      toast("Digite um rascunho antes de gerar!", "error", "Erro");
      return;
    }
    setIsGerando(true);
    try {
      const res = await apiTutor.gerarNovidadesIA(rascunho);
      if (res.status === "sucesso") {
        setMarkdownGerado(res.mensagem);
        toast("Markdown gerado com sucesso!", "success", "Sucesso");
      } else {
        toast(res.mensagem || "Erro ao gerar markdown.", "error", "Erro");
      }
    } catch (error) {
      console.error(error);
      toast("Falha ao comunicar com a IA.", "error", "Erro");
    } finally {
      setIsGerando(false);
    }
  };

  const handleSalvar = async () => {
    if (!markdownGerado.trim() || !versao.trim()) {
      toast("Gere o markdown e defina a versão antes de salvar.", "error", "Erro");
      return;
    }
    setIsSalvando(true);
    try {
      const payload = {
        NOVIDADES_MARKDOWN: markdownGerado,
        VERSAO_NOVIDADES: versao,
      };
      const res = await apiTutor.salvarConfiguracoes(payload);
      if (res.status === "sucesso") {
        toast("Novidades publicadas para os alunos!", "success", "Sucesso");
        onClose();
      } else {
        toast(res.mensagem || "Erro ao salvar novidades.", "error", "Erro");
      }
    } catch (error) {
      console.error(error);
      toast("Erro ao salvar.", "error", "Erro");
    } finally {
      setIsSalvando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>🚀</span> Central de Novidades & Telemetria
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Publique patch notes gamificados e acompanhe as leituras dos estudantes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAbaAtiva("editor")}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    abaAtiva === "editor"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ✏️ Editor
                </button>
                <button
                  type="button"
                  onClick={() => setAbaAtiva("telemetria")}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    abaAtiva === "telemetria"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span>📊 Leituras</span>
                  {telemetria && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                      {telemetria.resumo.percentualGeral}%
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg cursor-pointer transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>

          {abaAtiva === "editor" ? (
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Esquerda: Inputs */}
              <div className="w-full md:w-1/2 p-6 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Versão (Ex: v2.2.1)
                      </label>
                      <button
                        type="button"
                        onClick={carregarTemplateHoje}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
                      >
                        <span>⚡</span> Carregar Novidades v2.2.1
                      </button>
                    </div>
                    <input
                      type="text"
                      value={versao}
                      onChange={(e) => setVersao(e.target.value)}
                      placeholder="v2.2.1"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      O que mudou? (Rascunho bruto)
                    </label>
                    <textarea
                      value={rascunho}
                      onChange={(e) => setRascunho(e.target.value)}
                      rows={5}
                      placeholder="Ex: Arrumei o bug do XP que não somava direito. Adicionei a IA no gerador de ranking do whatsapp. O painel está mais rápido."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGerarIA}
                    disabled={isGerando || !rascunho}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGerando ? (
                      <span className="animate-spin text-xl">⏳</span>
                    ) : (
                      <span>✨</span>
                    )}
                    {isGerando ? "Gerando Gamificação..." : "Gerar Markdown com IA"}
                  </button>
                </div>
              </div>

              {/* Direita: Preview */}
              <div className="w-full md:w-1/2 p-6 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/30">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Preview Visual (Para os Alunos)
                </label>
                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 custom-scrollbar prose prose-slate dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-a:text-indigo-500 max-w-none">
                  {markdownGerado ? (
                    <ReactMarkdown>{markdownGerado}</ReactMarkdown>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-center italic">
                      A pré-visualização aparecerá aqui...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ABA DE TELEMETRIA: QUEM JÁ VISUALIZOU AS NOVIDADES */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                    <span>📊</span> Engajamento da Atualização ({versao})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Telemetria em tempo real dos estudantes que concluíram a visualização dos slides.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={carregarTelemetria}
                  disabled={carregandoTelemetria}
                  className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <span className={carregandoTelemetria ? "animate-spin" : ""}>🔄</span>
                  <span>Atualizar</span>
                </button>
              </div>

              {carregandoTelemetria && !telemetria ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <span className="text-2xl block mb-2 animate-bounce">📊</span>
                  Calculando leituras das turmas...
                </div>
              ) : telemetria ? (
                <div className="space-y-6">
                  {/* Cards de Métricas Gerais */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        Taxa de Abertura
                      </span>
                      <p className="text-3xl font-display font-black text-indigo-950 dark:text-white mt-1">
                        {telemetria.resumo.percentualGeral}%
                      </p>
                      <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/40 h-2 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${telemetria.resumo.percentualGeral}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        Alunos que Visualizaram
                      </span>
                      <p className="text-3xl font-display font-black text-emerald-950 dark:text-white mt-1">
                        {telemetria.resumo.totalVisualizados}
                      </p>
                      <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
                        Estudantes confirmados
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Total da Escola
                      </span>
                      <p className="text-3xl font-display font-black text-slate-900 dark:text-white mt-1">
                        {telemetria.resumo.totalAlunos}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Estudantes ativos na base
                      </span>
                    </div>
                  </div>

                  {/* Engajamento por Turma */}
                  <div>
                    <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
                      Adesão por Turma
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {telemetria.porTurma.map((item) => (
                        <div
                          key={item.turma}
                          className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 shadow-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {item.turma}
                            </span>
                            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                              {item.percentual}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentual}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 text-right">
                            {item.visualizados} de {item.total} alunos
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum dado de telemetria encontrado para a versão {versao}.
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {abaAtiva === "editor" ? "Pronto para sincronizar com os alunos" : `Visualizações da versão ${versao}`}
            </span>
            {abaAtiva === "editor" && (
              <button
                onClick={handleSalvar}
                disabled={isSalvando || !markdownGerado || !versao}
                className="cursor-pointer py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
              >
                {isSalvando ? "Publicando..." : "Publicar Novidades 🚀"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
