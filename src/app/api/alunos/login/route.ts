export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

function normalizarData(d?: string | null): string {
  if (!d) return "";
  const trimmed = d.trim();
  // Se contiver ISO timestamp (ex: "1997-08-06T03:00:00.000Z")
  if (trimmed.includes("T")) {
    return trimmed.split("T")[0];
  }
  // Se formato brasileiro "DD/MM/YYYY"
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const dia = parts[0].padStart(2, "0");
      const mes = parts[1].padStart(2, "0");
      const ano = parts[2];
      return `${ano}-${mes}-${dia}`;
    }
  }
  // Se formato "YYYY-MM-DD"
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      matricula?: string;
      dataNasc?: string;
    };

    const matricula = String(body.matricula || "").trim();
    const dataNascDigitada = String(body.dataNasc || "").trim();

    if (!matricula || !dataNascDigitada) {
      return NextResponse.json(
        { status: "erro", mensagem: "Matrícula e data de nascimento são obrigatórias." },
        { status: 400 }
      );
    }

    const alunoSnap = await dbAdmin.collection("alunos").doc(matricula).get();
    if (!alunoSnap.exists) {
      return NextResponse.json(
        { status: "erro", mensagem: "Matrícula ou data de nascimento incorreta." },
        { status: 401 }
      );
    }

    const alunoData = alunoSnap.data();
    if (!alunoData) {
      return NextResponse.json(
        { status: "erro", mensagem: "Dados do aluno indisponíveis." },
        { status: 404 }
      );
    }

    // Validação flexível e robusta de data de nascimento
    const dataDigitadaNorm = normalizarData(dataNascDigitada);
    const dataBancoNorm = normalizarData(alunoData.dataNasc);

    if (dataDigitadaNorm !== dataBancoNorm) {
      return NextResponse.json(
        { status: "erro", mensagem: "Matrícula ou data de nascimento incorreta." },
        { status: 401 }
      );
    }

    // Verificação de bloqueio
    const statusTrilha = String(alunoData.statusTrilha || "").toLowerCase();
    const isBloqueado = statusTrilha === "bloqueado" || alunoData.bloqueado === true;

    if (isBloqueado) {
      return NextResponse.json({
        status: "bloqueado",
        nome: alunoData.nome || "Aluno",
        mensagem: "Seu acesso ao Trilha Tech está temporariamente bloqueado. Procure o Tutor."
      });
    }

    return NextResponse.json({
      status: "sucesso",
      mensagem: "Login realizado com sucesso!",
      aluno: {
        matricula: alunoData.matricula || matricula,
        nome: alunoData.nome || "Estudante",
        turma: alunoData.turma || alunoData.turmaTrilha || "",
        dataNasc: alunoData.dataNasc || dataNascDigitada,
        statusTrilha: alunoData.statusTrilha || "Ativo",
        statusGraduacao: alunoData.statusGraduacao || "Aluno",
        avatar: alunoData.avatar || alunoData.avatarId || "avatar-padrao",
        xp: alunoData.xp || 0
      }
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Login Aluno API Error]:", err.message);
    return NextResponse.json(
      { status: "erro", mensagem: "Erro interno no servidor ao realizar autenticação." },
      { status: 500 }
    );
  }
}

