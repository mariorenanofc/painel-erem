"use client";

import React, { useState } from "react";
import CodingPractice from "./CodingPractice";
import { Atividade } from "@/src/types";

interface DueloModalProps {
  idDuelo: string;
  codigoDesafio: string;
  isDesafiante: boolean;
  onClose: () => void;
  onSuccess: (vencedor?: string) => void;
}

export default function DueloModal({
  idDuelo,
  codigoDesafio,
  isDesafiante,
  onClose,
  onSuccess
}: DueloModalProps) {
  const [enviando, setEnviando] = useState(false);

  const fakeMissao: Atividade = {
    id: `duelo_${idDuelo}`,
    titulo: "Duelo 1v1",
    descricao: "Digite o código mais rápido e com mais precisão que o seu oponente!",
    dataLimite: "",
    xp: 100,
    tipo: "Typing",
    opcaoA: "", opcaoB: "", opcaoC: "", opcaoD: "",
    linkClassroom: "", imagemUrl: "", modulo: "Arena",
    gabarito: "", gabaritoLiberado: false,
    resolucaoTyping: codigoDesafio,
    limiteTempoTyping: 5, // 5 min
    turmaAlvo: "Todas"
  };

  const handleEnviar = async (respostaFinal: string, xpCalculado: number, timeMs?: number, accuracyPct?: number) => {
    setEnviando(true);
    try {
      const endpoint = isDesafiante ? "/api/alunos/duelos/salvar" : "/api/alunos/duelos/finalizar";
      const usrStr = localStorage.getItem("alunoLogado");
      if (!usrStr) throw new Error("Usuário não encontrado");
      const { matricula } = JSON.parse(usrStr);

      const payload = {
        idDuelo,
        matricula,
        tempo: timeMs || 0,
        precisao: accuracyPct || 0
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar duelo");

      alert(isDesafiante ? "Desafio enviado! Aguarde o oponente jogar." : `Duelo Finalizado! O vencedor foi: ${data.vencedor}`);
      onSuccess(data.vencedor);
    } catch (error: unknown) {
      const e = error as Error;
      alert(e.message);
    } finally {
      setEnviando(false);
    }
  };

  // Bloqueio de paste
  React.useEffect(() => {
    const preventPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Colar é proibido na Arena de Duelos!");
    };
    document.addEventListener("paste", preventPaste);
    return () => document.removeEventListener("paste", preventPaste);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-[95vh] relative overflow-hidden bg-slate-950 rounded-2xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
        
        {/* Banner de Aviso Anti-Fraude */}
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-1 z-50 animate-pulse">
          ⚠️ ATENÇÃO: FECHAR ESTA ABA ANTES DE CONCLUIR RESULTARÁ EM W.O. E PERDA DE 50 XP! ⚠️
        </div>

        <div className="w-full h-full pt-6">
          <CodingPractice
            missaoAberta={fakeMissao}
            onClose={onClose}
            onEnviar={handleEnviar}
            enviando={enviando}
            isDuelMode={true}
          />
        </div>
      </div>
    </div>
  );
}
