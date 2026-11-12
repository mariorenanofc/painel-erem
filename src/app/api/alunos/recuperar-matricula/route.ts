export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

function normalizarData(d?: string | null): string {
  if (!d) return "";
  const trimmed = d.trim();
  if (trimmed.includes("T")) return trimmed.split("T")[0];
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
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
      nome?: string;
      dataNasc?: string;
    };

    const nomeBuscado = String(body.nome || "").trim().toLowerCase();
    const dataNascDigitada = String(body.dataNasc || "").trim();

    if (!nomeBuscado || !dataNascDigitada) {
      return NextResponse.json(
        { status: "erro", mensagem: "Nome e data de nascimento são obrigatórios." },
        { status: 400 }
      );
    }

    const dataNorm = normalizarData(dataNascDigitada);

    // Consulta aos alunos ativos
    const snap = await dbAdmin.collection("alunos").get();
    let alunoEncontrado: { matricula: string; nome: string } | null = null;

    snap.forEach((doc) => {
      if (alunoEncontrado) return;
      const data = doc.data();
      const nomeDoc = String(data.nome || "").toLowerCase();
      const dataDocNorm = normalizarData(data.dataNasc);

      if (dataDocNorm === dataNorm && nomeDoc.includes(nomeBuscado)) {
        alunoEncontrado = {
          matricula: String(data.matricula || doc.id),
          nome: String(data.nome || "Estudante")
        };
      }
    });

    if (alunoEncontrado) {
      return NextResponse.json({
        status: "sucesso",
        matricula: (alunoEncontrado as { matricula: string; nome: string }).matricula,
        nomeReal: (alunoEncontrado as { matricula: string; nome: string }).nome
      });
    }

    return NextResponse.json(
      { status: "erro", mensagem: "Nenhum aluno encontrado com estes dados." },
      { status: 404 }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Recuperar Matricula API Error]:", err.message);
    return NextResponse.json(
      { status: "erro", mensagem: "Erro interno ao buscar matrícula." },
      { status: 500 }
    );
  }
}

