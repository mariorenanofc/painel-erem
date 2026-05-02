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

  // Lógica do Timer do Classroom encapsulada!
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
      setTimerClassroom(20);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const respostaFinal = missaoAberta.tipo === "Material" ? "Material Acessado e Consumido" : resposta;
    await onEnviar(respostaFinal);
  };

  // Verificações de Prazo e Status
  const verificarPrazo = (dataStr: string) => {
    if (!dataStr) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const partes = dataStr.split("/");
    if (partes.length === 3) {
      const limite = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
      return hoje > limite;
    }
    return false;
  };

  const prazoEncerrado = verificarPrazo(missaoAberta.dataLimite);
  const statusAtual = missaoAberta.status?.toLowerCase().trim() || "pendente";
  
  let bloqueioClassroom = false;
  if (missaoAberta.linkClassroom && !checkboxHonestidade) {
    bloqueioClassroom = true;
  }

  const inputDesabilitado = enviando || (statusAtual !== "pendente" && statusAtual !== "devolvida") || bloqueioClassroom;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className={`p-4 border-b flex justify-between items-center text-white ${missaoAberta.tipo === "Quiz" ? "bg-amber-600" : missaoAberta.tipo === "Material" ? "bg-emerald-600" : "bg-blue-600"}`}>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>🎯</span> {missaoAberta.tipo}: {missaoAberta.titulo}
          </h2>
          <button onClick={onClose} className="text-2xl leading-none hover:text-slate-200 transition-colors">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-slate-50">
          <div className="flex flex-wrap gap-2 mb-4 text-sm font-bold">
            <span className="bg-white text-slate-600 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">ID: {missaoAberta.id}</span>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200 shadow-sm">🗂️ {missaoAberta.modulo || "Geral"}</span>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200 shadow-sm">⭐ {missaoAberta.xp} XP</span>
            {prazoEncerrado && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg border border-red-200 shadow-sm animate-pulse">⏳ Prazo Encerrado</span>
            )}
          </div>
          
          <div className="text-slate-700 whitespace-pre-wrap font-mono text-sm mb-6 bg-white p-5 rounded-xl border border-slate-200 leading-relaxed shadow-sm">
            {missaoAberta.descricao}
          </div>

          {missaoAberta.imagemUrl && (
            <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <Image
                src={(() => {
                  const url = missaoAberta.imagemUrl || "";
                  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
                })()}
                alt="Referência da Missão"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain p-2"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-6">
            
            {statusAtual === "devolvida" && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4 shadow-sm animate-in slide-in-from-top-2">
                <h3 className="text-red-700 font-black text-sm flex items-center gap-2 mb-1"><span>⚠️</span> Missão Devolvida pelo Tutor!</h3>
                <p className="text-red-600 text-xs font-medium">{missaoAberta.feedback || "Revise as instruções e envie novamente."}</p>
              </div>
            )}

            {(statusAtual === "avaliado" || statusAtual === "avaliada") && missaoAberta.feedback && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4 shadow-sm animate-in slide-in-from-top-2">
                <h3 className="text-emerald-700 font-black text-sm flex items-center gap-2 mb-1"><span>💬</span> Feedback do Tutor</h3>
                <p className="text-emerald-600 text-xs font-medium">{missaoAberta.feedback}</p>
              </div>
            )}

            {missaoAberta.linkClassroom && (statusAtual === "pendente" || statusAtual === "devolvida") && (
              <div className="bg-amber-50 border border-amber-300 p-5 rounded-xl mb-6 shadow-sm">
                <h3 className="text-amber-800 font-black text-sm flex items-center gap-2 mb-2"><span>🏫</span> Entrega Obrigatória no Classroom!</h3>
                <p className="text-amber-700 text-xs font-medium mb-4 leading-relaxed">
                  Para ganhar o XP, você precisa primeiro registrar a sua entrega oficial no Ambiente Virtual de Aprendizagem.
                </p>

                <div className="flex flex-col gap-3">
                  <button type="button" onClick={() => dispararIdaAoClassroom(missaoAberta.linkClassroom!)} className="bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                    1. ABRIR O GOOGLE CLASSROOM 🔗
                  </button>

                  {classroomAberto && timerClassroom > 0 && (
                    <div className="text-center p-3 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg animate-pulse border border-amber-200">
                      ⏳ Validando o seu acesso... aguarde {timerClassroom} segundos.
                    </div>
                  )}

                  {classroomAberto && timerClassroom === 0 && (
                    <label className="flex items-start gap-3 p-4 bg-white border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors mt-2 shadow-sm animate-in fade-in">
                      <input type="checkbox" required checked={checkboxHonestidade} onChange={(e) => setCheckboxHonestidade(e.target.checked)} className="mt-1 w-5 h-5 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer" />
                      <span className="text-xs text-slate-700 font-bold leading-snug">
                        2. Confirmo por minha honra que já anexei e enviei o meu material no Google Classroom oficial.
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {missaoAberta.tipo !== "Material" && (
              <h3 className="font-bold text-slate-800 mb-3 uppercase text-sm mt-4">Sua Resposta:</h3>
            )}

            {missaoAberta.tipo === "Quiz" ? (
              <div className="space-y-3">
                {["A", "B", "C", "D"].map((letra) => {
                  const opcaoTexto = missaoAberta[`opcao${letra}` as keyof Atividade];
                  return opcaoTexto ? (
                    <label key={letra} className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${resposta === letra ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"} ${inputDesabilitado ? "opacity-60 cursor-not-allowed" : ""}`}>
                      <input type="radio" name="quiz" value={letra} checked={resposta === letra} onChange={(e) => setResposta(e.target.value)} disabled={inputDesabilitado} className="mt-1 mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <div className="flex-1 overflow-x-auto">
                        <strong className="text-slate-700 mr-2">{letra})</strong>
                        <code className="text-slate-600 font-mono text-sm whitespace-pre-wrap leading-tight">{opcaoTexto}</code>
                      </div>
                    </label>
                  ) : null;
                })}
              </div>
            ) : missaoAberta.tipo === "Projeto" ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Link do seu projeto (GitHub, Replit, etc):</label>
                <input type="url" placeholder="https://..." value={resposta} onChange={(e) => setResposta(e.target.value)} required={!missaoAberta.linkClassroom} disabled={inputDesabilitado} className={`w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl p-4 focus:border-blue-500 outline-none transition-colors ${inputDesabilitado ? "opacity-60 cursor-not-allowed bg-slate-100" : ""}`} />
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl text-center shadow-sm opacity-90">
                <span className="text-4xl block mb-3">📚</span>
                <p className="text-sm font-black text-blue-800 uppercase tracking-widest mb-1">Material de Apoio</p>
                <p className="text-xs text-blue-600 font-medium">Acesse o conteúdo, marque a caixinha de honestidade (se existir) e resgate o seu XP!</p>
                <input type="hidden" value="Material Consumido" />
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={inputDesabilitado} className={`text-white px-8 py-3 rounded-xl font-black shadow-md transition-all ${inputDesabilitado ? "bg-slate-400" : prazoEncerrado ? "bg-amber-500 hover:bg-amber-600 active:scale-95" : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"}`}>
                {enviando ? "Processando..." : statusAtual === "aguardando correção" || statusAtual === "avaliador" || statusAtual === "avaliado" || statusAtual === "avaliada" ? "Já Concluído" : statusAtual === "devolvida" ? "Reenviar Missão" : missaoAberta.tipo === "Material" ? "Resgatar XP do Material" : prazoEncerrado ? "Enviar Atrasado" : "Enviar Resposta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}