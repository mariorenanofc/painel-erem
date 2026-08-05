import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turma = String(searchParams.get("turma") || "").trim();
  const mes = String(searchParams.get("mes") || "").trim(); // Ex: "8" ou "08"
  const ano = String(searchParams.get("ano") || "").trim(); // Ex: "2026"

  if (!turma || !mes || !ano) {
    return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
  }

  try {
    // 1. Buscar todos os alunos ativos da turma
    const alunosSnap = await dbAdmin.collection("alunos")
      .where("statusTrilha", "in", ["ativo", "Ativo"])
      .get();

    interface DiarioAluno {
      matricula: string;
      nome: string;
      frequencia: Record<string, {
        status: string;
        justificativa: string;
        xp: number;
        idFalta?: string;
      }>;
    }

    const alunosMap: Record<string, DiarioAluno> = {};
    alunosSnap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const tTrilha = String(data.turmaTrilha || "").trim();
      const tEscola = String(data.turma || "").trim();

      const matchesTrilha = tTrilha.toLowerCase() === turma.toLowerCase();
      let matchesEscola = false;
      if (turma.includes("1º") || turma.includes("1")) {
        matchesEscola = tEscola.includes("1º") || tEscola.includes("1");
      } else if (turma.includes("2º") || turma.includes("2")) {
        matchesEscola = tEscola.includes("2º") || tEscola.includes("2");
      } else if (turma.includes("3º") || turma.includes("3")) {
        matchesEscola = tEscola.includes("3º") || tEscola.includes("3");
      }

      if (matchesTrilha || matchesEscola) {
        alunosMap[doc.id] = {
          matricula: doc.id,
          nome: data.nome || `Aluno ${doc.id}`,
          frequencia: {}
        };
      }
    });

    if (Object.keys(alunosMap).length === 0) {
      return NextResponse.json({ status: "sucesso", diasComAula: [], alunos: [] });
    }

    // 2. Buscar todas as presenças da turma (buscando tudo e filtrando em memória pelos alunos da turma)
    const freqSnap = await dbAdmin.collection("frequencia").get();

    const diasComAulaSet = new Set<string>();
    const mesNum = Number(mes);
    const anoNum = Number(ano);

    freqSnap.forEach((doc: QueryDocumentSnapshot) => {
      const f = doc.data();
      const dataStr = String(f.data || "").trim(); // "DD/MM/YYYY" ou "DD-MM-YYYY"
      
      // Extrair dia, mes e ano do formato da string
      let d = 0, m = 0, y = 0;
      if (dataStr.includes("/")) {
        const parts = dataStr.split("/");
        if (parts.length === 3) {
          d = Number(parts[0]);
          m = Number(parts[1]);
          y = Number(parts[2]);
        }
      } else if (dataStr.includes("-")) {
        const parts = dataStr.split("-");
        if (parts.length === 3) {
          d = Number(parts[0]);
          m = Number(parts[1]);
          y = Number(parts[2]);
        }
      }

      // Se coincidir com o mês e ano buscado
      if (m === mesNum && y === anoNum && d > 0) {
        const dataFormatada = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
        diasComAulaSet.add(dataFormatada);

        const mat = f.matricula;
        if (alunosMap[mat]) {
          const rawSt = String(f.status || "").toLowerCase().trim();
          let statusMapeado = "presente";
          if (rawSt === "presente" || rawSt === "p") statusMapeado = "presente";
          else if (rawSt === "falta" || rawSt === "f") statusMapeado = "falta";
          else if (rawSt === "justificada" || rawSt === "j") statusMapeado = "justificada";

          alunosMap[mat].frequencia[dataFormatada] = {
            status: statusMapeado,
            justificativa: f.justificativa || "",
            xp: f.xpGanho !== undefined ? f.xpGanho : 10,
            idFalta: f.id || doc.id
          };
        }
      }
    });

    const diasComAula = Array.from(diasComAulaSet).sort((a, b) => {
      const partsA = a.split("/");
      const partsB = b.split("/");
      return Number(partsA[0]) - Number(partsB[0]);
    });

    return NextResponse.json({
      status: "sucesso",
      diasComAula,
      alunos: Object.values(alunosMap)
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API Error] Erro ao buscar diário de classe:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
