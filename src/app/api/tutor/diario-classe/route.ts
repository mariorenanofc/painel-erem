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
    const mesNum = Number(mes);
    const anoNum = Number(ano);

    // 2. Gerar todos os dias possíveis para o mês selecionado
    // Isso garante que buscaremos APENAS os dados deste mês, sem precisar ler 100% da tabela de frequência ou depender de metadados.
    const diasNoMes = new Date(anoNum, mesNum, 0).getDate(); // Retorna 28, 29, 30 ou 31
    const possiveisDatas: string[] = [];
    
    for (let d = 1; d <= diasNoMes; d++) {
      const diaStr = String(d).padStart(2, "0");
      const mesStr = String(mesNum).padStart(2, "0");
      possiveisDatas.push(`${diaStr}/${mesStr}/${anoNum}`);
      possiveisDatas.push(`${diaStr}-${mesStr}-${anoNum}`); // Cobrir formato alternativo salvo no banco
    }

    const diasComAulaSet = new Set<string>();

    // 3. Dividir em lotes de 10 (limite da cláusula 'in' do Firebase)
    const chunks = [];
    for (let i = 0; i < possiveisDatas.length; i += 10) {
      chunks.push(possiveisDatas.slice(i, i + 10));
    }

    const freqPromises = chunks.map(chunk => 
      dbAdmin.collection("frequencia")
        .where("turma", "==", turma)
        .where("data", "in", chunk)
        .get()
    );

    const freqSnaps = await Promise.all(freqPromises);

    freqSnaps.forEach(snap => {
      snap.forEach((doc: QueryDocumentSnapshot) => {
        const f = doc.data();
        let dataClean = String(f.data || "").trim();
        if (dataClean.includes("/") && dataClean.length > 10) {
          dataClean = dataClean.slice(0, 10);
        }
        const delim = dataClean.includes("/") ? "/" : "-";
        const parts = dataClean.split(delim);
        if (parts.length !== 3) return;

        const d = Number(parts[0]);
        const m = Number(parts[1]);
        const y = Number(parts[2]);
        
        const mat = f.matricula;
        if (alunosMap[mat]) {
          const dataFormatada = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
          diasComAulaSet.add(dataFormatada);

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
      });
    });

    const diasComAula = Array.from(diasComAulaSet).sort((a, b) => {
      const partsA = a.split("/");
      const partsB = b.split("/");
      return Number(partsA[0]) - Number(partsB[0]);
    });

    const alunosArray = Object.values(alunosMap);
    alunosArray.forEach((aluno) => {
      diasComAula.forEach((diaStr) => {
        if (!aluno.frequencia[diaStr]) {
          aluno.frequencia[diaStr] = {
            status: "falta",
            justificativa: "",
            xp: 0
          };
        }
      });
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
