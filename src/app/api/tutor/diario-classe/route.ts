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

    // 2. Buscar dias letivos oficiais da turma
    const metaRef = dbAdmin.collection("metadata").doc("dias_aula_turmas");
    const metaSnap = await metaRef.get();
    let diasDaTurmaGeral: string[] = [];
    if (metaSnap.exists && metaSnap.data()![turma]) {
      diasDaTurmaGeral = metaSnap.data()![turma];
    }

    const mesStrFiltro = String(mesNum).padStart(2, "0");
    const anoStrFiltro = String(anoNum);
    
    // Filtra apenas os dias oficiais que pertencem ao mês e ano solicitados
    let diasDoMesOficiais = diasDaTurmaGeral.filter(data => {
      const parts = data.split("/");
      return parts.length === 3 && parts[1] === mesStrFiltro && parts[2] === anoStrFiltro;
    });

    const diasComAulaSet = new Set<string>(diasDoMesOficiais);
    const matriculasAtivas = Object.keys(alunosMap);

    // 3. Buscar todas as frequências desses alunos no mês (Busca Otimizada)
    const inicioMesDate = new Date(anoNum, mesNum - 1, 1, 0, 0, 0);
    const fimMesDate = new Date(anoNum, mesNum, 0, 23, 59, 59, 999);
    
    const inicioTimestamp = inicioMesDate.getTime();
    const fimTimestamp = fimMesDate.getTime();

    let freqDocs: QueryDocumentSnapshot[] = [];
    try {
      const freqSnap = await dbAdmin.collection("frequencia")
        .where("turma", "==", turma)
        .where("timestamp", ">=", inicioTimestamp)
        .where("timestamp", "<=", fimTimestamp)
        .get();
      freqDocs = freqSnap.docs;
    } catch (e: unknown) {
      const err = e as Error;
      console.warn("[Diário de Classe] Índice Composto não encontrado, caindo para busca via Timestamp: ", err.message);
      // Fallback seguro usando apenas índice simples de timestamp
      const freqSnap = await dbAdmin.collection("frequencia")
        .where("timestamp", ">=", inicioTimestamp)
        .where("timestamp", "<=", fimTimestamp)
        .get();
      freqDocs = freqSnap.docs.filter(doc => {
         const mat = doc.data().matricula;
         return matriculasAtivas.includes(mat);
      });
    }

    freqDocs.forEach((doc: QueryDocumentSnapshot) => {
      const f = doc.data();
      const idFreq = String(f.id || doc.id).trim();
      if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
      
      let dataClean = String(f.data || "").trim();
      if (dataClean.includes("/") && dataClean.length > 10) {
        dataClean = dataClean.slice(0, 10);
      }
      
      const delim = dataClean.includes("/") ? "/" : "-";
      const parts = dataClean.split(delim);
      if (parts.length !== 3) return;

      const d = String(parts[0]).padStart(2, "0");
      const m = String(parts[1]).padStart(2, "0");
      const y = String(parts[2]);

      // Processamos a frequência formatada
      const dataFormatada = `${d}/${m}/${y}`;
      const mat = f.matricula;
      if (alunosMap[mat]) {
        // Se não tínhamos dias oficiais (fallback), adicionamos o dia encontrado no Set
        if (diasDoMesOficiais.length === 0) {
          diasComAulaSet.add(dataFormatada);
        }

        const rawSt = String(f.status || "").toLowerCase().trim();
        const isPresenteOuJustificada = (f.xpGanho === 0 && f.justificativa) || rawSt === "presente" || rawSt === "p" || rawSt === "justificada" || rawSt === "j";
        
        let statusMapeado = "falta";
        if (isPresenteOuJustificada) {
          statusMapeado = (rawSt === "justificada" || rawSt === "j" || (f.xpGanho === 0 && f.justificativa)) ? "justificada" : "presente";
        }

        alunosMap[mat].frequencia[dataFormatada] = {
          status: statusMapeado,
          justificativa: f.justificativa || "",
          xp: f.xpGanho !== undefined ? Number(f.xpGanho) : 10,
          idFalta: idFreq
        };
      }
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
