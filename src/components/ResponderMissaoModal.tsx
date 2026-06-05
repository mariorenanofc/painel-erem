/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Atividade } from "@/src/types";

interface ResponderMissaoModalProps {
  missaoAberta: Atividade;
  onClose: () => void;
  onEnviar: (respostaFinal: string) => Promise<void>;
  enviando: boolean;
  respostaInicial: string;
}

export default function ResponderMissaoModal({
  missaoAberta,
  onClose,
  onEnviar,
  enviando,
  respostaInicial,
}: ResponderMissaoModalProps) {
  const [resposta, setResposta] = useState(respostaInicial);
  const [timerClassroom, setTimerClassroom] = useState(0);
  const [classroomAberto, setClassroomAberto] = useState(false);
  const [checkboxHonestidade, setCheckboxHonestidade] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (classroomAberto && timerClassroom > 0) {
      interval = setInterval(() => {
        setTimerClassroom((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [classroomAberto, timerClassroom]);

  const dispararIdaAoClassroom = (link: string) => {
    window.open(link, "_blank");
    setClassroomAberto(true);
    if (!checkboxHonestidade && timerClassroom === 0) {
      setTimerClassroom(10);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const respostaFinal =
      missaoAberta.tipo === "Material"
        ? "Material Acessado e Consumido"
        : resposta;
    await onEnviar(respostaFinal);
  };

  const verificarPrazo = (dataStr: string) => {
    if (!dataStr) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const partes = dataStr.split("/");
    if (partes.length === 3) {
      const limite = new Date(
        Number(partes[2]),
        Number(partes[1]) - 1,
        Number(partes[0]),
      );
      return hoje > limite;
    }
    return false;
  };

  const renderDescricaoComLinks = (texto: string) => {
    if (!texto) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const partes = texto.split(urlRegex);

    return partes.map((parte, index) => {
      if (parte.match(urlRegex)) {
        return (
          <a
            key={index}
            href={parte}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-black underline break-all bg-blue-50 dark:bg-blue-900/30 px-1 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {parte}
          </a>
        );
      }
      return <span key={index}>{parte}</span>;
    });
  };

  const prazoEncerrado = verificarPrazo(missaoAberta.dataLimite);
  const statusAtual = missaoAberta.status?.toLowerCase().trim() || "pendente";

  let bloqueioClassroom = false;
  if (missaoAberta.linkClassroom && !checkboxHonestidade) {
    bloqueioClassroom = true;
  }

  const inputDesabilitado =
    enviando ||
    (statusAtual !== "pendente" && statusAtual !== "devolvida") ||
    bloqueioClassroom;

  const rawDataEnvio = (missaoAberta as any).dataEnvio;
  const dataFormatada = rawDataEnvio
    ? new Date(rawDataEnvio)
        .toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(",", " às")
    : "";

  return (
    <div className="fixed inset-0 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <div
          className={`p-4 border-b dark:border-slate-800 flex justify-between items-center text-white transition-colors duration-300 ${missaoAberta.tipo === "Quiz" ? "bg-amber-600 dark:bg-amber-700" : missaoAberta.tipo === "Material" ? "bg-emerald-600 dark:bg-emerald-700" : "bg-blue-600 dark:bg-blue-800"}`}
        >
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>🎯</span> {missaoAberta.tipo}: {missaoAberta.titulo}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none hover:text-slate-200 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
          <div className="flex flex-wrap gap-2 mb-4 text-sm font-bold">
            <span className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              ID: {missaoAberta.id}
            </span>
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/50 shadow-sm transition-colors">
              🗂️ {missaoAberta.modulo || "Geral"}
            </span>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50 shadow-sm transition-colors">
              ⭐ {missaoAberta.xp} XP
            </span>
            {prazoEncerrado && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-lg border border-red-200 dark:border-red-800/50 shadow-sm animate-pulse transition-colors">
                ⏳ Prazo Encerrado
              </span>
            )}
          </div>

          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-sm mb-6 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed shadow-sm transition-colors duration-300">
            {renderDescricaoComLinks(missaoAberta.descricao)}
          </div>

          {missaoAberta.imagemUrl && (
            <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 transition-colors">
              <Image
                src={(() => {
                  const url = missaoAberta.imagemUrl || "";
                  const match = url.match(
                    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
                  );
                  return match
                    ? `https://drive.google.com/uc?export=view&id=${match[1]}`
                    : url;
                })()}
                alt="Referência da Missão"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain p-2"
              />
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 dark:border-slate-700 pt-6 transition-colors"
          >
            {dataFormatada &&
              (statusAtual === "aguardando correção" ||
                statusAtual === "avaliado" ||
                statusAtual === "avaliada") && (
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl mb-4 shadow-sm animate-in slide-in-from-top-2 transition-colors">
                  <p className="text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
                    <span>🕒</span> Enviado em: <strong>{dataFormatada}</strong>
                  </p>
                </div>
              )}

            {statusAtual === "devolvida" && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl mb-4 shadow-sm animate-in slide-in-from-top-2 transition-colors">
                <h3 className="text-red-700 dark:text-red-400 font-black text-sm flex items-center gap-2 mb-1">
                  <span>⚠️</span> Missão Devolvida pelo Tutor!
                </h3>
                <p className="text-red-600 dark:text-red-300 text-xs font-medium">
                  {missaoAberta.feedback ||
                    "Revise as instruções e envie novamente."}
                </p>
              </div>
            )}

            {(statusAtual === "avaliado" || statusAtual === "avaliada") &&
              missaoAberta.feedback && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl mb-4 shadow-sm animate-in slide-in-from-top-2 transition-colors">
                  <h3 className="text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center gap-2 mb-1">
                    <span>💬</span> Feedback do Tutor
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-300 text-xs font-medium">
                    {missaoAberta.feedback}
                  </p>
                </div>
              )}

            {missaoAberta.linkClassroom &&
              (statusAtual === "pendente" || statusAtual === "devolvida") && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-5 rounded-xl mb-6 shadow-sm transition-colors">
                  <h3 className="text-amber-800 dark:text-amber-400 font-black text-sm flex items-center gap-2 mb-2">
                    <span>🏫</span> Entrega Obrigatória no Classroom!
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 text-xs font-medium mb-4 leading-relaxed">
                    Para ganhar o XP, você precisa primeiro registrar a sua
                    entrega oficial no Ambiente Virtual de Aprendizagem.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        dispararIdaAoClassroom(missaoAberta.linkClassroom!)
                      }
                      className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-black py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      1. ABRIR O GOOGLE CLASSROOM 🔗
                    </button>

                    {classroomAberto && timerClassroom > 0 && (
                      <div className="text-center p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-lg animate-pulse border border-amber-200 dark:border-amber-700">
                        ⏳ Validando o seu acesso... aguarde {timerClassroom}{" "}
                        segundos.
                      </div>
                    )}

                    {classroomAberto && timerClassroom === 0 && (
                      <label className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors mt-2 shadow-sm animate-in fade-in">
                        <input
                          type="checkbox"
                          required
                          checked={checkboxHonestidade}
                          onChange={(e) =>
                            setCheckboxHonestidade(e.target.checked)
                          }
                          className="mt-1 w-5 h-5 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-snug">
                          2. Confirmo por minha honra que já anexei e enviei o
                          meu material no Google Classroom oficial.
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

            {missaoAberta.tipo !== "Material" && (
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase text-sm mt-4 transition-colors">
                Sua Resposta:
              </h3>
            )}

            {missaoAberta.tipo === "Quiz" ? (
              <div className="space-y-3">
                {["A", "B", "C", "D"].map((letra) => {
                  const opcaoTexto =
                    missaoAberta[`opcao${letra}` as keyof Atividade];
                  return opcaoTexto ? (
                    <label
                      key={letra}
                      className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${resposta === letra ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700"} ${inputDesabilitado ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="quiz"
                        value={letra}
                        checked={resposta === letra}
                        onChange={(e) => setResposta(e.target.value)}
                        disabled={inputDesabilitado}
                        className="mt-1 mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 overflow-x-auto">
                        <strong className="text-slate-700 dark:text-slate-200 mr-2">
                          {letra})
                        </strong>
                        <code className="text-slate-600 dark:text-slate-400 font-mono text-sm whitespace-pre-wrap leading-tight">
                          {opcaoTexto}
                        </code>
                      </div>
                    </label>
                  ) : null;
                })}
              </div>
            ) : missaoAberta.tipo === "Projeto" ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                  Link do seu projeto (GitHub, Replit, etc):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  required={!missaoAberta.linkClassroom}
                  disabled={inputDesabilitado}
                  className={`w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors ${inputDesabilitado ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900" : ""}`}
                />
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-5 rounded-2xl text-center shadow-sm opacity-90 transition-colors">
                <span className="text-4xl block mb-3">📚</span>
                <p className="text-sm font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-1">
                  Material de Apoio
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                  Acesse o conteúdo, marque a caixinha de honestidade (se
                  existir) e resgate o seu XP!
                </p>
                <input type="hidden" value="Material Consumido" />
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4 transition-colors">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={inputDesabilitado}
                className={`text-white px-8 py-3 rounded-xl font-black shadow-md transition-all ${inputDesabilitado ? "bg-slate-400 dark:bg-slate-700" : prazoEncerrado ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 active:scale-95" : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95"}`}
              >
                {enviando
                  ? "Processando..."
                  : statusAtual === "aguardando correção" ||
                      statusAtual === "avaliador" ||
                      statusAtual === "avaliado" ||
                      statusAtual === "avaliada"
                    ? "Já Concluído"
                    : statusAtual === "devolvida"
                      ? "Reenviar Missão"
                      : missaoAberta.tipo === "Material"
                        ? "Resgatar XP do Material"
                        : prazoEncerrado
                          ? "Enviar Atrasado"
                          : "Enviar Resposta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
