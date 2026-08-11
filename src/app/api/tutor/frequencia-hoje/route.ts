import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turma = String(searchParams.get("turma") || "").trim();

  if (!turma) {
    return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
  }

  try {
    // 1. Obter a data de hoje no fuso de Brasília
    const hoje = new Date();
    const options = { timeZone: "America/Sao_Paulo", day: "2-digit" as const, month: "2-digit" as const, year: "numeric" as const };
    const formatter = new Intl.DateTimeFormat("pt-BR", options);
    const parts = formatter.formatToParts(hoje);
    const dia = parts.find(p => p.type === "day")?.value || String(hoje.getDate()).padStart(2, "0");
    const mes = parts.find(p => p.type === "month")?.value || String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = parts.find(p => p.type === "year")?.value || String(hoje.getFullYear());
    const dataHojeStr = `${dia}/${mes}/${ano}`;

    // 2. Buscar todos os alunos ativos da turma
    const alunosSnap = await dbAdmin.collection("alunos")
      .where("statusTrilha", "in", ["ativo", "Ativo"])
      .get();

    interface AlunoFrequenciaHoje {
      matricula: string;
      nome: string;
      presencasTotais: number;
      faltasTotais: number;
      presenteHoje: boolean;
      horaHoje: string;
    }

    const alunosMap: Record<string, AlunoFrequenciaHoje> = {};
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
          presencasTotais: 0,
          faltasTotais: 0,
          presenteHoje: false,
          horaHoje: ""
        };
      }
    });

    if (Object.keys(alunosMap).length === 0) {
      return NextResponse.json({ status: "sucesso", registros: [], totalAulas: 0 });
    }

    // 3. Obter o total de aulas a partir dos metadados unificados (1 leitura)
    const metaRef = dbAdmin.collection("metadata").doc("dias_aula_turmas");
    const metaSnap = await metaRef.get();
    let totalAulasTurma = 0;
    if (metaSnap.exists) {
      const metaTurmas = metaSnap.data()?.turmas || {};
      totalAulasTurma = metaTurmas[turma]?.dias_aula?.length || 0;
    }

    // Fallback: Se totalAulasTurma for 0, a turma não tem metadado cacheado.
    // Fazemos uma varredura completa (custará as leituras normais apenas desta vez) e salvamos no metadado.
    if (totalAulasTurma === 0) {
      const fallbackSnap = await dbAdmin.collection("frequencia").where("turma", "==", turma).get();
      const diasSet = new Set<string>();
      fallbackSnap.forEach(doc => {
        const dStr = String(doc.data().data || "").trim();
        if (dStr.includes("/") || dStr.includes("-")) {
          // Normaliza formato
          let clean = dStr;
          if (clean.includes("/") && clean.length > 10) clean = clean.slice(0, 10);
          diasSet.add(clean);
        }
      });
      
      if (diasSet.size > 0) {
        totalAulasTurma = diasSet.size;
        await metaRef.set({
          turmas: {
            [turma]: { dias_aula: Array.from(diasSet).sort() }
          }
        }, { merge: true });
      }
    }

    // 4. Buscar apenas os registros de frequência de HOJE para a turma específica (aprox. 40 leituras)
    const freqHojeSnap = await dbAdmin.collection("frequencia")
      .where("turma", "==", turma)
      .where("data", "==", dataHojeStr)
      .get();

    freqHojeSnap.forEach((doc: QueryDocumentSnapshot) => {
      const f = doc.data();
      const mat = f.matricula;
      if (alunosMap[mat]) {
        const st = String(f.status || "").toLowerCase().trim();
        if (st === "presente" || st === "p") {
          alunosMap[mat].presenteHoje = true;
          alunosMap[mat].horaHoje = String(f.hora || f.timestamp ? new Date(f.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Marcar");
        }
      }
    });

    // 5. Contar as presenças totais usando a API Count (1 leitura por aluno)
    const countPromises = Object.values(alunosMap).map(async (aluno) => {
      try {
        const countSnap = await dbAdmin.collection("frequencia")
          .where("matricula", "==", aluno.matricula)
          .where("status", "in", ["presente", "p", "Presente", "P"])
          .count()
          .get();
        aluno.presencasTotais = countSnap.data().count;
      } catch (e) {
        console.error(`Erro ao contar frequencia do aluno ${aluno.matricula}:`, e);
      }
    });

    await Promise.all(countPromises);

    const listaFinal = Object.values(alunosMap).map((a: AlunoFrequenciaHoje) => {
      a.faltasTotais = totalAulasTurma - a.presencasTotais;
      if (a.faltasTotais < 0) a.faltasTotais = 0;
      return a;
    });

    return NextResponse.json({
      status: "sucesso",
      registros: listaFinal,
      totalAulas: totalAulasTurma
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API Error] Erro ao buscar frequência hoje:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
