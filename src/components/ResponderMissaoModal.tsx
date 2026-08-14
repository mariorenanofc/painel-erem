/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Atividade } from "@/src/types";
import CodingPractice from "./CodingPractice";
import { useToast } from "@/src/contexts/ToastContext";
import { apiAluno } from "@/src/services/api";
import { PerfilAtualizado } from "./LojaRifaModal";

interface ResponderMissaoModalProps {
  missaoAberta: Atividade;
  onClose: () => void;
  onEnviar: (respostaFinal: string, xpCalculado?: number) => Promise<void>;
  enviando: boolean;
  respostaInicial: string;
  matricula: string;
  onStatusAtualizado: (atividade: Atividade, perfil: PerfilAtualizado) => void;
}

/* ─── Micro-componente: Loader temático de Missão ─── */
function MissaoLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      {/* Anel orbital externo */}
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400 dark:border-indigo-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-dotted border-pink-400 dark:border-pink-500"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎯
        </motion.div>
      </div>
      <motion.p
        className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Processando missão...
      </motion.p>
    </div>
  );
}

export default function ResponderMissaoModal({
  missaoAberta,
  onClose,
  onEnviar,
  enviando,
  respostaInicial,
  matricula,
  onStatusAtualizado,
}: ResponderMissaoModalProps) {
  const { toast } = useToast();
  const [resposta, setResposta] = useState(respostaInicial);
  const [timerClassroom, setTimerClassroom] = useState(0);
  const [classroomAberto, setClassroomAberto] = useState(false);
  const [checkboxHonestidade, setCheckboxHonestidade] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

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
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black underline decoration-indigo-400/40 underline-offset-2 break-all bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md transition-colors"
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

  /* ─── Gradientes do Header por tipo de missão ─── */
  const headerGradient =
    missaoAberta.tipo === "Quiz"
      ? "from-amber-500 via-orange-500 to-yellow-500 dark:from-slate-950 dark:via-amber-950/30 dark:to-slate-900"
      : missaoAberta.tipo === "Material"
        ? "from-emerald-500 via-teal-500 to-cyan-500 dark:from-slate-950 dark:via-emerald-950/30 dark:to-slate-900"
        : "from-indigo-500 via-purple-500 to-pink-500 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-900";

  const tipoIcone =
    missaoAberta.tipo === "Quiz"
      ? "🧩"
      : missaoAberta.tipo === "Material"
        ? "📚"
        : missaoAberta.tipo === "Projeto"
          ? "🚀"
          : "🎯";

  const isPendenteOuDevolvida = statusAtual === "pendente" || statusAtual === "devolvida";
  const isTypingActivity = !!missaoAberta.resolucaoTyping && String(missaoAberta.resolucaoTyping).trim() !== "";

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200 transition-colors ${
        isTypingActivity && isPendenteOuDevolvida ? "p-0" : "p-2 md:p-4"
      }`}>
        <motion.div
          initial={isTypingActivity && isPendenteOuDevolvida ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={isTypingActivity && isPendenteOuDevolvida ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`glass-panel-heavy w-full ${
            isTypingActivity && isPendenteOuDevolvida 
              ? "w-screen h-screen max-w-full max-h-screen rounded-none border-none" 
              : "max-w-2xl rounded-3xl max-h-[90vh] border border-slate-200 dark:border-white/5"
          } overflow-hidden flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-colors duration-300`}
        >
          {isTypingActivity && isPendenteOuDevolvida ? (
            <>
              {/* Header Simplificado do Treinador */}
              <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-5 flex justify-between items-center text-white shrink-0 relative">
                <div className="relative z-10 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">⌨️</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                      Prática de Digitação Orientada
                    </span>
                  </div>
                  <h2 className="font-display font-black text-lg md:text-xl leading-tight truncate text-white drop-shadow-sm">
                    {missaoAberta.titulo}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="cursor-pointer text-3xl leading-none text-white/80 hover:text-white transition-colors relative z-10 ml-4 shrink-0"
                >
                  &times;
                </button>
              </div>
              <CodingPractice
                missaoAberta={missaoAberta}
                onClose={onClose}
                onEnviar={onEnviar}
                enviando={enviando}
              />
            </>
          ) : (
            <>
              {/* ═══ HEADER PREMIUM ═══ */}
              <div
                className={`bg-gradient-to-r ${headerGradient} p-5 flex justify-between items-center text-white shrink-0 shadow-md relative transition-colors duration-300`}
              >
            {/* Textura sutil do header */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{tipoIcone}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                  {missaoAberta.tipo}
                </span>
              </div>
              <h2 className="font-display font-black text-lg md:text-xl leading-tight truncate text-white drop-shadow-sm">
                {missaoAberta.titulo}
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="cursor-pointer text-3xl leading-none text-white/80 hover:text-white transition-colors relative z-10 ml-4 shrink-0"
            >
              &times;
            </motion.button>
          </div>

          {/* ═══ CORPO ROLÁVEL ═══ */}
          <div
            className={`overflow-y-auto flex-1 p-5 md:p-6 bg-slate-50/40 dark:bg-slate-900/20 transition-colors duration-300 custom-scrollbar ${missaoAberta.tipo === "Quiz" ? "select-none" : ""}`}
            onContextMenu={
              missaoAberta.tipo === "Quiz" ? (e) => e.preventDefault() : undefined
            }
            onCopy={
              missaoAberta.tipo === "Quiz" ? (e) => e.preventDefault() : undefined
            }
          >
            {/* ─── PILLS DE METADADOS ─── */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700/60 shadow-sm transition-colors">
                <span className="text-slate-400 dark:text-slate-500">#</span>{missaoAberta.id}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm transition-colors">
                🗂️ {missaoAberta.modulo || "Geral"}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm transition-colors">
                ⭐ {missaoAberta.xp} XP
              </span>
              {missaoAberta.dataLimite && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-colors ${
                  prazoEncerrado
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/40 animate-pulse"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60"
                }`}>
                  {prazoEncerrado ? "⏳ Prazo Encerrado" : `📅 ${missaoAberta.dataLimite}`}
                </span>
              )}
            </div>

            {/* ─── BLOCO DE DESCRIÇÃO ─── */}
            <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-sm mb-6 bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 leading-relaxed shadow-sm transition-colors duration-300 backdrop-blur-sm">
              {renderDescricaoComLinks(missaoAberta.descricao)}
            </div>

            {/* ─── IMAGEM DA MISSÃO ─── */}
            {missaoAberta.imagemUrl && (
              <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/50 shadow-sm bg-white dark:bg-slate-800/60 transition-colors backdrop-blur-sm">
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

            {/* ═══ FORMULÁRIO ═══ */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200/60 dark:border-slate-700/40 pt-6 transition-colors"
            >
              {/* ─── CARD: Data de envio ─── */}
              {dataFormatada &&
                (statusAtual === "aguardando correção" ||
                  statusAtual === "avaliado" ||
                  statusAtual === "avaliada") && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 p-3.5 rounded-2xl mb-4 shadow-sm backdrop-blur-sm"
                  >
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2">
                      <span className="text-base">🕒</span> Enviado em: <strong className="text-slate-700 dark:text-slate-200">{dataFormatada}</strong>
                    </p>
                  </motion.div>
                )}

              {/* ─── CARD: Missão Devolvida ─── */}
              {statusAtual === "devolvida" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/80 dark:bg-red-900/15 border border-red-200/60 dark:border-red-800/40 p-4 rounded-2xl mb-4 shadow-sm backdrop-blur-sm"
                >
                  <h3 className="text-red-700 dark:text-red-400 font-black text-sm flex items-center gap-2 mb-1.5">
                    <span className="text-base">⚠️</span> Missão Devolvida pelo Tutor!
                  </h3>
                  <p className="text-red-600 dark:text-red-300 text-xs font-medium leading-relaxed">
                    {missaoAberta.feedback ||
                      "Revise as instruções e envie novamente."}
                  </p>
                </motion.div>
              )}

              {/* ─── CARD: Feedback do Tutor ─── */}
              {(statusAtual === "avaliado" || statusAtual === "avaliada") &&
                missaoAberta.feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/80 dark:bg-emerald-900/15 border border-emerald-200/60 dark:border-emerald-800/40 p-4 rounded-2xl mb-4 shadow-sm backdrop-blur-sm"
                  >
                    <h3 className="text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center gap-2 mb-1.5">
                      <span className="text-base">💬</span> Feedback do Tutor
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-300 text-xs font-medium leading-relaxed">
                      {missaoAberta.feedback}
                    </p>
                  </motion.div>
                )}

              {/* ─── CARD: Template Base CodePen (Opcional) ─── */}
              {missaoAberta.opcaoA && missaoAberta.tipo !== "Quiz" && (statusAtual === "pendente" || statusAtual === "devolvida") && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-50/80 dark:bg-indigo-900/15 border border-indigo-300/60 dark:border-indigo-700/40 p-5 rounded-2xl mb-4 shadow-sm backdrop-blur-sm transition-colors"
                >
                  <h3 className="text-indigo-800 dark:text-indigo-400 font-black text-sm flex items-center gap-2 mb-2">
                    <span className="text-base">⚡</span> Template Base para Desenvolvimento!
                  </h3>
                  <p className="text-indigo-750 dark:text-indigo-300 text-xs font-medium mb-3 leading-relaxed">
                    Clique no botão abaixo para abrir o projeto inicial (CodePen/IDE) onde você irá programar esta atividade.
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(missaoAberta.opcaoA, "_blank")}
                    className="cursor-pointer bg-gradient-to-r from-indigo-505 via-indigo-500 to-purple-600 text-white font-black py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider border-none w-full"
                  >
                    ABRIR TEMPLATE BASE (IDE) 🔗
                  </motion.button>
                </motion.div>
              )}

               {/* ─── CARD: Classroom Obrigatório ─── */}
               {missaoAberta.linkClassroom &&
                 (statusAtual === "pendente" || statusAtual === "devolvida") && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50/80 dark:bg-amber-900/15 border border-amber-300/60 dark:border-amber-700/40 p-5 rounded-2xl mb-6 shadow-sm backdrop-blur-sm transition-colors"
                  >
                    <h3 className="text-amber-800 dark:text-amber-400 font-black text-sm flex items-center gap-2 mb-2">
                      <span className="text-base">🏫</span> Entrega Obrigatória no Classroom!
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-xs font-medium mb-4 leading-relaxed">
                      Para ganhar o XP, você precisa primeiro registrar a sua
                      entrega oficial no Ambiente Virtual de Aprendizagem.
                    </p>

                    <div className="flex flex-col gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          dispararIdaAoClassroom(missaoAberta.linkClassroom!)
                        }
                        className="cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                      >
                        1. ABRIR O GOOGLE CLASSROOM 🔗
                      </motion.button>

                      <AnimatePresence>
                        {classroomAberto && timerClassroom > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-center p-3.5 bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200/60 dark:border-amber-700/40 backdrop-blur-sm"
                          >
                            <motion.span
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              ⏳ Validando o seu acesso... aguarde {timerClassroom}{" "}
                              segundos.
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {classroomAberto && timerClassroom === 0 && missaoAberta.tipo === "Projeto" && (
                          <motion.label
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-4 bg-white/80 dark:bg-slate-800/60 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl cursor-pointer hover:bg-emerald-50/80 dark:hover:bg-slate-700/60 transition-colors mt-1 shadow-sm backdrop-blur-sm"
                          >
                            <input
                              type="checkbox"
                              required
                              checked={checkboxHonestidade}
                              onChange={(e) =>
                                setCheckboxHonestidade(e.target.checked)
                              }
                              className="mt-1 w-5 h-5 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer accent-emerald-500"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-snug">
                              2. Confirmo por minha honra que já anexei e enviei o
                              meu material no Google Classroom oficial.
                            </span>
                          </motion.label>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

              {/* ─── LABEL: Sua Resposta ─── */}
              {missaoAberta.tipo !== "Material" && !missaoAberta.linkClassroom && (
                <h3 className="font-display font-black text-slate-800 dark:text-slate-200 mb-3 uppercase text-[11px] tracking-[0.2em] mt-4 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gradient-to-b from-indigo-500 to-pink-500 rounded-full" />
                  Sua Resposta
                </h3>
              )}

              {/* ─── OPÇÕES: Quiz ─── */}
              {missaoAberta.tipo === "Quiz" && !missaoAberta.linkClassroom ? (
                <div className="space-y-3">
                  {["A", "B", "C", "D"].map((letra) => {
                    const opcaoTexto =
                      missaoAberta[`opcao${letra}` as keyof Atividade];
                    const isSelected = resposta === letra;
                    return opcaoTexto ? (
                      <motion.label
                        key={letra}
                        whileHover={!inputDesabilitado ? { scale: 1.005 } : {}}
                        whileTap={!inputDesabilitado ? { scale: 0.995 } : {}}
                        className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-500 shadow-md shadow-indigo-500/10"
                            : "bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                        } ${inputDesabilitado ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="radio"
                          name="quiz"
                          value={letra}
                          checked={isSelected}
                          onChange={(e) => setResposta(e.target.value)}
                          disabled={inputDesabilitado}
                          className="mt-1 mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                        />
                        <div className="flex-1 overflow-x-auto">
                          <strong className={`mr-2 text-sm font-black ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-300"}`}>
                            {letra})
                          </strong>
                          <code className="text-slate-600 dark:text-slate-400 font-mono text-sm whitespace-pre-wrap leading-tight">
                            {opcaoTexto}
                          </code>
                        </div>
                      </motion.label>
                    ) : null;
                  })}
                </div>
              ) : missaoAberta.tipo === "Projeto" ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.15em]">
                    Link do seu projeto (GitHub, Replit, etc):
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    required={!missaoAberta.linkClassroom}
                    disabled={inputDesabilitado}
                    className={`w-full bg-white/80 dark:bg-slate-800/60 border-2 border-slate-200/80 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 rounded-2xl p-4 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 backdrop-blur-sm ${inputDesabilitado ? "opacity-60 cursor-not-allowed bg-slate-100/80 dark:bg-slate-900/60" : ""}`}
                  />
                </div>
              ) : !missaoAberta.linkClassroom ? (
                /* ─── BLOCO: Material de Apoio (Somente Portal) ─── */
                <div className="bg-indigo-50/80 dark:bg-indigo-900/15 border border-indigo-200/60 dark:border-indigo-800/40 p-6 rounded-2xl text-center shadow-sm backdrop-blur-sm transition-colors">
                  <motion.span
                    className="text-4xl block mb-3"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📚
                  </motion.span>
                  <p className="text-sm font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-widest mb-1">
                    Material de Apoio
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
                    Acesse o conteúdo, marque a caixinha de honestidade (se
                    existir) e resgate o seu XP!
                  </p>
                  <input type="hidden" value="Material Consumido" />
                </div>
              ) : null}

              {/* ─── LOADING ESTADO ─── */}
              <AnimatePresence>
                {enviando && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MissaoLoader />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── BARRA DE AÇÕES ─── */}
              <div className="mt-8 flex justify-end gap-3 border-t border-slate-200/60 dark:border-slate-700/40 pt-5 transition-colors pb-2">
                {statusAtual !== "pendente" && !missaoAberta.linkClassroom && (
                  <motion.button
                    type="button"
                    whileHover={!atualizandoStatus ? { scale: 1.02 } : {}}
                    whileTap={!atualizandoStatus ? { scale: 0.98 } : {}}
                    disabled={atualizandoStatus}
                    onClick={async () => {
                      setAtualizandoStatus(true);
                      try {
                        const data = await apiAluno.buscarAtividadeStatus(matricula, missaoAberta.id);
                        if (data.status === "sucesso") {
                          onStatusAtualizado(data.atividade, data.perfilAtualizado);
                          toast("Status atualizado com sucesso!", "success", "Sincronizado!");
                        } else {
                          toast(data.mensagem || "Erro ao atualizar status.", "warning", "Ops!");
                        }
                      } catch {
                        toast("Erro ao conectar com o servidor.", "error", "Falha de Conexão");
                      } finally {
                        setAtualizandoStatus(false);
                      }
                    }}
                    className="cursor-pointer px-6 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {atualizandoStatus ? "Verificando..." : "Atualizar Status"}
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="cursor-pointer px-6 py-3 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors backdrop-blur-sm"
                >
                  Cancelar
                </motion.button>
                
                {missaoAberta.linkClassroom && missaoAberta.tipo !== "Projeto" ? (
                  <div
                    className={`px-8 py-3 rounded-xl font-black text-sm shadow-md transition-all uppercase tracking-wider text-white ${
                      statusAtual === "pendente" 
                        ? "bg-slate-400 dark:bg-slate-700" 
                        : "bg-emerald-500 dark:bg-emerald-600"
                    }`}
                  >
                    {statusAtual === "pendente" ? "Aguardando Sincronização..." : "Entregue via Classroom"}
                  </div>
                ) : (
                  <motion.button
                    type="submit"
                    whileHover={!inputDesabilitado ? { scale: 1.02 } : {}}
                    whileTap={!inputDesabilitado ? { scale: 0.97 } : {}}
                    disabled={inputDesabilitado}
                    className={`cursor-pointer text-white px-8 py-3 rounded-xl font-black text-sm shadow-md transition-all uppercase tracking-wider ${
                      inputDesabilitado
                        ? "bg-slate-400 dark:bg-slate-700 shadow-none"
                        : prazoEncerrado
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 active:scale-95"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20 active:scale-95"
                    }`}
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
                  </motion.button>
                )}
              </div>
            </form>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
