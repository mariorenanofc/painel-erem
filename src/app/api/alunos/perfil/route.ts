import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matricula = searchParams.get("matricula")?.trim();

  if (!matricula) {
    return NextResponse.json({ error: "Matrícula não fornecida." }, { status: 400 });
  }

  try {
    const alunoDoc = await dbAdmin.collection("alunos").doc(matricula).get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado na base de dados." }, { status: 404 });
    }

    const val = alunoDoc.data()!;
    
    // Formata a data de nascimento se necessário
    let dataNascStr = val.dataNasc || "";
    if (dataNascStr.includes("-")) {
      const p = dataNascStr.split("T")[0].split("-");
      if (p.length === 3) {
        dataNascStr = `${p[2]}/${p[1]}/${p[0]}`;
      }
    }

    const perfil = {
      nome: val.nome || "",
      dataNasc: dataNascStr,
      matricula: val.matricula || matricula,
      email: val.email || "",
      turma: val.turma || val.turmaTrilha || "",
      telefoneAluno: val.telefoneAluno || "",
      telefoneResponsavel: val.telefoneResponsavel || ""
    };

    return NextResponse.json({ status: "sucesso", perfil });
  } catch (error: unknown) {
    const err = error as Error;
    // 🛡️ REGRAS DE FAILOVER PARA GOOGLE SHEETS
    console.warn(`[Failover] Erro ao buscar perfil no Firestore: ${err.message}. Redirecionando para Google Sheets...`);
    
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "buscar_perfil_aluno", matricula }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: unknown) {
        const sErr = sheetsErr as Error;
        return NextResponse.json({ error: "Erro crítico em ambos os bancos: " + sErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Erro ao buscar perfil: " + err.message }, { status: 500 });
  }
}
