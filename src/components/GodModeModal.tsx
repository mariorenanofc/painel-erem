/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { apiTutor } from "@/src/services/api";
import { AlunoGodMode, GodModeModalProps } from "../types";

export default function GodModeModal({
  onClose,
  onSuccess,
}: GodModeModalProps) {
  const [alunos, setAlunos] = useState<AlunoGodMode[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Abas do God Mode
  const [abaAtiva, setAbaAtiva] = useState<"xp" | "coroa">("xp");

  // Estado Injetar XP
  const [matriculaSelecionada, setMatriculaSelecionada] = useState("");
  const [quantidadeXP, setQuantidadeXP] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");
  const [injetando, setInjetando] = useState(false);

  // Estado Coroar Elite
  const [matriculaCoroa, setMatriculaCoroa] = useState("");
  const [tipoPlaca, setTipoPlaca] = useState<
    "Elite Ouro" | "Elite Prata" | "Elite Bronze"
  >("Elite Ouro");
  const [coroando, setCoroando] = useState(false);

  useEffect(() => {
    const buscarAlunos = async () => {
      try {
        const data = await apiTutor.listarAlunosGodMode();
        if (data.status === "sucesso") setAlunos(data.alunos);
      } catch (e) {
        alert("Erro ao buscar alunos.");
      } finally {
        setCarregando(false);
      }
    };
    buscarAlunos();
  }, []);

  const handleInjetar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !matriculaSelecionada ||
      quantidadeXP === "" ||
      Number(quantidadeXP) === 0 ||
      !motivo
    ) {
      return alert(
        "Preencha todos os campos e use um valor diferente de zero!",
      );
    }

    setInjetando(true);
    try {
      const data = await apiTutor.injetarXP(
        matriculaSelecionada,
        Number(quantidadeXP),
        motivo,
      );

      if (data.status === "sucesso") {
        if (Number(quantidadeXP) > 0) {
          confetti({
            particleCount: 150,
            spread: 80,
            colors: ["#fbbf24", "#f59e0b", "#fff"],
          });
        }
        alert("⚡ " + data.mensagem);
        onSuccess();
        onClose();
      } else {
        alert("⚠️ " + data.mensagem);
      }
    } catch {
      alert("Erro ao aplicar o poder.");
    } finally {
      setInjetando(false);
    }
  };

  const handleCoroar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matriculaCoroa)
      return alert("Selecione o aluno que vai receber a placa!");

    if (
      !confirm(
        `Tem certeza que deseja passar a placa ${tipoPlaca} para este aluno? O dono anterior perderá a placa e receberá uma badge de Legado.`,
      )
    )
      return;

    setCoroando(true);
    try {
      const data = await apiTutor.coroarElite(matriculaCoroa, tipoPlaca);

      if (data.status === "sucesso") {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
        alert("👑 " + data.mensagem);
        onSuccess();
        onClose();
      } else {
        alert("⚠️ " + data.mensagem);
      }
    } catch {
      alert("Erro ao transferir a coroa.");
    } finally {
      setCoroando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border-4 border-amber-400">
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-3xl leading-none text-white hover:text-amber-400 z-10"
          >
            &times;
          </button>

          <div className="relative z-10 text-center">
            <div className="text-5xl mb-2 animate-bounce">⚡</div>
            <h2 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 uppercase tracking-widest">
              God Mode
            </h2>
            <p className="text-purple-200 text-xs font-bold mt-1">
              Controle Absoluto do Jogo
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 border-b border-slate-200 shrink-0">
          <button
            onClick={() => setAbaAtiva("xp")}
            className={`flex-1 py-3 font-black text-sm transition-colors ${abaAtiva === "xp" ? "text-purple-700 border-b-2 border-purple-600 bg-white" : "text-slate-500 hover:bg-slate-200"}`}
          >
            ⚖️ Injetar/Punir XP
          </button>
          <button
            onClick={() => setAbaAtiva("coroa")}
            className={`flex-1 py-3 font-black text-sm transition-colors ${abaAtiva === "coroa" ? "text-amber-600 border-b-2 border-amber-500 bg-white" : "text-slate-500 hover:bg-slate-200"}`}
          >
            👑 Coroar Elite
          </button>
        </div>

        <div className="p-6 bg-slate-50 max-h-[60vh] overflow-y-auto">
          {carregando ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600"></div>
            </div>
          ) : abaAtiva === "xp" ? (
            <form
              onSubmit={handleInjetar}
              className="space-y-5 animate-in slide-in-from-left-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  1. Escolha o Alvo
                </label>
                <select
                  value={matriculaSelecionada}
                  onChange={(e) => setMatriculaSelecionada(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-purple-500 shadow-sm"
                  required
                >
                  <option value="">Selecione um aluno...</option>
                  {alunos.map((a) => (
                    <option key={a.matricula} value={a.matricula}>
                      {a.nome} ({a.turma})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    2. Quantidade (+ ou -)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quantidadeXP}
                      onChange={(e) => setQuantidadeXP(Number(e.target.value))}
                      placeholder="Ex: 50 ou -100"
                      className={`w-full border-2 rounded-xl p-3 text-lg font-black outline-none shadow-sm text-center ${Number(quantidadeXP) < 0 ? "border-red-400 text-red-600 focus:border-red-600" : "border-emerald-400 text-emerald-600 focus:border-emerald-600"}`}
                      required
                    />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 flex flex-col justify-end pb-2">
                  <p className="text-[10px] text-slate-500 font-bold leading-tight">
                    💡 <span className="text-emerald-600">Positivo (+10)</span>{" "}
                    para premiar. <br />
                    🚨 <span className="text-red-500">
                      Negativo (-100)
                    </span>{" "}
                    para punir IA/cola.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  3. Motivo da Ação
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Ajudou o colega / Punição por uso de IA"
                  className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-purple-500 shadow-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={injetando}
                className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg flex items-center justify-center gap-2 ${Number(quantidadeXP) < 0 ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"}`}
              >
                {injetando
                  ? "Aplicando..."
                  : Number(quantidadeXP) < 0
                    ? "🚨 APLICAR PUNIÇÃO"
                    : "⚡ INJETAR BÔNUS"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleCoroar}
              className="space-y-5 animate-in slide-in-from-right-4"
            >
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
                <p className="text-xs text-amber-800 font-medium">
                  <strong>Como funciona:</strong> Ao transferir a placa, o dono
                  anterior perde o destaque VIP, mas recebe automaticamente uma{" "}
                  <strong>Badge de Legado</strong> para guardar no mural dele
                  eternamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  1. Qual placa transferir?
                </label>
                <select
                  value={tipoPlaca}
                  onChange={(e) => setTipoPlaca(e.target.value as any)}
                  className="w-full border-2 border-amber-300 rounded-xl p-3 text-sm font-black text-amber-700 outline-none focus:border-amber-500 shadow-sm bg-white"
                >
                  <option value="Elite Ouro">👑 Elite Ouro (Top 1)</option>
                  <option value="Elite Prata">🥈 Elite Prata (Top 2)</option>
                  <option value="Elite Bronze">🥉 Elite Bronze (Top 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  2. Novo Dono (Campeão Atual)
                </label>
                <select
                  value={matriculaCoroa}
                  onChange={(e) => setMatriculaCoroa(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-purple-500 shadow-sm"
                  required
                >
                  <option value="">Selecione o novo campeão...</option>
                  {alunos.map((a) => (
                    <option key={a.matricula} value={a.matricula}>
                      {a.nome} ({a.turma})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={coroando}
                className="w-full text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 mt-4"
              >
                {coroando ? "Transferindo..." : "👑 COROAR NOVO CAMPEÃO"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
