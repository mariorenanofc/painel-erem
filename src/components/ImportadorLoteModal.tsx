"use client";

import React, { useState } from "react";

// ==========================================
// ⚙️ TABELA DE XP PADRÃO DA PLATAFORMA
// ==========================================
const TABELA_XP_PADRAO = {
  Material: 10,
  Quiz: 50,
  Projeto: 100,
};

interface AtividadeParseada {
  idTemp: string;
  titulo: string;
  tipo: string;
  xp: number;
  isRascunho: boolean;
  selecionado: boolean;
}

interface ImportadorLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  modulosCadastrados: string[];
  turmasDisponiveis: string[];
  onImportar: (
    atividades: AtividadeParseada[],
    modulo: string,
    turma: string,
  ) => Promise<void>;
}

export default function ImportadorLoteModal({
  isOpen,
  onClose,
  modulosCadastrados,
  turmasDisponiveis,
  onImportar,
}: ImportadorLoteModalProps) {
  const [textoBruto, setTextoBruto] = useState("");
  const [modulo, setModulo] = useState("");
  const [turma, setTurma] = useState("Todas");
  const [atividades, setAtividades] = useState<AtividadeParseada[]>([]);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [importando, setImportando] = useState(false);

  if (!isOpen) return null;

  const analisarTexto = () => {
    if (!modulo)
      return alert("Por favor, selecione o Módulo (Matriz) primeiro!");

    const linhas = textoBruto
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const encontradas: AtividadeParseada[] = [];

    // Tentar auto-detectar a Turma baseada no texto colado
    const textoCompleto = textoBruto.toUpperCase();
    for (const t of turmasDisponiveis) {
      if (textoCompleto.includes(t.toUpperCase())) {
        setTurma(t);
        break;
      }
    }

    // Loop de Leitura do Texto
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];

      // REGEX: Captura -> Aula (01) - (Apresentação) (Assunto)
      const regexClassroom = /^Aula\s+(\d+)\s*[-–]\s*([^(]+?)\s*\((.+?)\)/i;
      const match = linha.match(regexClassroom);

      if (match) {
        const numAula = match[1].padStart(2, "0");
        const nomeOriginal = match[2].trim();
        const assunto = match[3].trim();

        const proximaLinha = linhas[i + 1] || "";
        const isRascunho = proximaLinha.toLowerCase().includes("rascunho");

        let tipoPortal = "Material";
        let xp = TABELA_XP_PADRAO.Material;
        let nomeFormatado = nomeOriginal;

        const nomeLower = nomeOriginal.toLowerCase();

        // LÓGICA DE NEGÓCIOS DE CLASSIFICAÇÃO
        if (nomeLower.includes("desafio")) {
          tipoPortal = "Quiz";
          xp = TABELA_XP_PADRAO.Quiz;
          nomeFormatado = nomeOriginal.replace(/desafio/i, "Desafio");
        } else if (nomeLower.includes("projeto")) {
          tipoPortal = "Projeto";
          xp = TABELA_XP_PADRAO.Projeto;
          nomeFormatado = "Projeto Prático";
        } else {
          tipoPortal = "Material";
          xp = TABELA_XP_PADRAO.Material;

          if (nomeLower.includes("apoio"))
            nomeFormatado = "Materiais de Apoio";
          else if (nomeLower.includes("feedback"))
            nomeFormatado = "Feedback da Aula";
          else if (nomeLower.includes("broadcast"))
            nomeFormatado = "Broadcast";
          else if (
            nomeLower.includes("apresentação") ||
            nomeLower.includes("apresentacao")
          )
            nomeFormatado = "Apresentação";
        }

        // TÍTULO FINAL FORMATADO: [Aula 01] Materiais de Apoio (História...)
        const tituloFinal = `[Aula ${numAula}] ${nomeFormatado} (${assunto})`;

        encontradas.push({
          idTemp: Math.random().toString(36).substring(7),
          titulo: tituloFinal,
          tipo: tipoPortal,
          xp: xp,
          isRascunho,
          selecionado: isRascunho, // Apenas os rascunhos começam marcados!
        });
      }
    }

    if (encontradas.length === 0) {
      alert(
        "Nenhuma atividade no padrão do Classroom foi encontrada. Tem a certeza que copiou corretamente?",
      );
      return;
    }

    setAtividades(encontradas);
    setEtapa(2);
  };

  const toggleSelecao = (idTemp: string) => {
    setAtividades((prev) =>
      prev.map((a) =>
        a.idTemp === idTemp ? { ...a, selecionado: !a.selecionado } : a,
      ),
    );
  };

  const confirmarImportacao = async () => {
    const selecionadas = atividades.filter((a) => a.selecionado);
    if (selecionadas.length === 0)
      return alert("Selecione pelo menos uma atividade para importar.");

    setImportando(true);
    await onImportar(selecionadas, modulo, turma);
    setImportando(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="font-black text-xl flex items-center gap-2">
            <span>⚡</span> Automação de Rascunhos (Classroom)
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-3xl leading-none hover:text-blue-200"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {etapa === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Módulo da Matriz (Curso)
                  </label>
                  <select
                    value={modulo}
                    onChange={(e) => setModulo(e.target.value)}
                    className="cursor-pointer w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Selecione o Módulo...</option>
                    {modulosCadastrados.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Turma Alvo
                  </label>
                  <select
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    className="cursor-pointer w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Todas">Todas as Turmas</option>
                    {turmasDisponiveis.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                  <span>Cole o texto cru do Google Classroom aqui:</span>
                  <span className="text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    CTRL+A, CTRL+C na aba &ldquo;Atividades&quot;
                  </span>
                </label>
                <textarea
                  rows={10}
                  value={textoBruto}
                  onChange={(e) => setTextoBruto(e.target.value)}
                  placeholder="Exemplo:&#10;Aula 01 - Apresentação (História do JS)&#10;Rascunho&#10;Aula 01 - Desafio 1.1 (História do JS)"
                  className="w-full p-4 font-mono text-sm border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 rounded-xl outline-none focus:border-blue-500 resize-none transition-colors"
                />
              </div>

              <button
                onClick={analisarTexto}
                className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 text-lg"
              >
                🤖 Analisar e Formatar Textos
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 transition-colors">
                <div>
                  <h3 className="font-black text-blue-900 dark:text-blue-400">
                    Revisão de Estrutura
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">
                    Verifique se os títulos estão no padrão{" "}
                    <strong>[Aula XX] Tipo (Assunto)</strong>. O sistema
                    selecionou apenas os rascunhos.
                  </p>
                </div>
                <div className="text-center bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-blue-200 dark:border-slate-700 shrink-0 transition-colors">
                  <span className="text-blue-600 dark:text-blue-400 font-black text-2xl">
                    {atividades.filter((a) => a.selecionado).length}
                  </span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    A Importar
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {atividades.map((ativ) => (
                  <label
                    key={ativ.idTemp}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      ativ.selecionado
                        ? "bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={ativ.selecionado}
                      onChange={() => toggleSelecao(ativ.idTemp)}
                      className="cursor-pointer mt-1 w-5 h-5 text-blue-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {ativ.titulo}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded uppercase border border-slate-300 dark:border-slate-600 transition-colors">
                          {ativ.tipo}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded uppercase border border-emerald-200 dark:border-emerald-800/50 transition-colors">
                          ⭐ {ativ.xp} XP
                        </span>
                        {!ativ.isRascunho && (
                          <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded uppercase border border-amber-200 dark:border-amber-800/50 transition-colors">
                            Já Postada
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between shrink-0 transition-colors">
          <button
            onClick={() => (etapa === 2 ? setEtapa(1) : onClose())}
            disabled={importando}
            className="cursor-pointer px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {etapa === 2 ? "← Ajustar Texto" : "Cancelar"}
          </button>

          {etapa === 2 && (
            <button
              onClick={confirmarImportacao}
              disabled={importando}
              className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {importando ? (
                <>
                  <span className="animate-spin text-xl">⏳</span> Inserindo
                  no Banco...
                </>
              ) : (
                <>🚀 Inserir Rascunhos no Portal</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}