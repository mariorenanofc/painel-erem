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

    const alunosMap: Record<string, any> = {};
    alunosSnap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const t = data.turma || data.turmaTrilha || "";
      if (t.toLowerCase() === turma.toLowerCase()) {
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

    // 3. Buscar todas as presenças da turma
    const freqSnap = await dbAdmin.collection("frequencia")
      .where("turma", "==", turma)
      .get();

    const diasDeAulaSet = new Set<string>();

    freqSnap.forEach((doc: QueryDocumentSnapshot) => {
      const f = doc.data();
      const rawDataStr = String(f.data || "").trim(); // "DD/MM/YYYY" ou "DD-MM-YYYY"

      let d = 0, m = 0, y = 0;
      if (rawDataStr.includes("/")) {
        const parts = rawDataStr.split("/");
        if (parts.length === 3) {
          d = Number(parts[0]);
          m = Number(parts[1]);
          y = Number(parts[2]);
        }
      } else if (rawDataStr.includes("-")) {
        const parts = rawDataStr.split("-");
        if (parts.length === 3) {
          d = Number(parts[0]);
          m = Number(parts[1]);
          y = Number(parts[2]);
        }
      }

      if (d > 0) {
        const dataFormatada = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
        const mat = f.matricula;

        if (alunosMap[mat]) {
          diasDeAulaSet.add(dataFormatada);
          alunosMap[mat].presencasTotais++;

          if (dataFormatada === dataHojeStr && f.status === "Presente") {
            alunosMap[mat].presenteHoje = true;
            alunosMap[mat].horaHoje = String(f.hora || f.timestamp ? new Date(f.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Marcar");
          }
        }
      }
    });

    const totalAulasTurma = diasDeAulaSet.size;
    const listaFinal = Object.values(alunosMap).map((a: any) => {
      a.faltasTotais = totalAulasTurma - a.presencasTotais;
      if (a.faltasTotais < 0) a.faltasTotais = 0;
      return a;
    });

    return NextResponse.json({
      status: "sucesso",
      registros: listaFinal,
      totalAulas: totalAulasTurma
    });

  } catch (error: any) {
    console.error("[API Error] Erro ao buscar frequência hoje:", error.message);
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}
