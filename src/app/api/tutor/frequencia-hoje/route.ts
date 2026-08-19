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
      const metaData = metaSnap.data() || {};
      // Lê a estrutura padrão (mesma do action-proxy e portal)
      const dias = metaData[turma] || [];
      totalAulasTurma = dias.length;
    }

    const matriculasAtivas = Object.keys(alunosMap);

    // 4. Carregar todo o histórico de frequência desses alunos por blocos de 30 para calcular presentesHoje e presencasTotais
    // Isso elimina o count() que ignorava as "justificativas" e remove a dependência da coluna "turma".
    // O fallback avança se totalAulasTurma == 0
    let diasDaTurma: string[] = [];
    if (metaSnap.exists && metaSnap.data()![turma]) {
       diasDaTurma = metaSnap.data()![turma];
    }

    const diasSet = new Set<string>();

    // 1ª Passagem: Buscar todos os registros e armazenar em memória
    const todosRegistros: Array<{ matricula: string, dataFormatada: string, id?: string, status?: string, xpGanho?: number, justificativa?: string, hora?: string, timestamp?: number }> = [];
    for (let i = 0; i < matriculasAtivas.length; i += 30) {
      const chunk = matriculasAtivas.slice(i, i + 30);
      if (chunk.length === 0) continue;
      
      const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "in", chunk).get();
      freqSnap.forEach((doc: QueryDocumentSnapshot) => {
        const f = doc.data();
        const idFreq = String(f.id || doc.id).trim();
        if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
        
        let dataFormatada = f.data || "";
        if (dataFormatada.includes("/") && dataFormatada.length > 10) {
          dataFormatada = dataFormatada.slice(0, 10);
        }
        if (dataFormatada) {
          todosRegistros.push({
            matricula: f.matricula,
            dataFormatada: dataFormatada,
            id: idFreq,
            status: f.status,
            xpGanho: f.xpGanho,
            justificativa: f.justificativa,
            hora: f.hora,
            timestamp: f.timestamp
          });
          diasSet.add(dataFormatada);
        }
      });
    }

    if (diasDaTurma.length === 0 && diasSet.size > 0) {
       diasDaTurma = Array.from(diasSet);
       totalAulasTurma = diasDaTurma.length;
       await metaRef.set({
          [turma]: diasDaTurma
       }, { merge: true });
    }

    // 2ª Passagem: Processar apenas os dias oficiais da turma
    todosRegistros.forEach(f => {
      const mat = f.matricula;
      if (!alunosMap[mat]) return;
      
      const dataFormatada = f.dataFormatada;
      const idFreq = String(f.id || "").trim();
      const st = String(f.status || "").toLowerCase().trim();
      const isPresenteOuJustificada = (f.xpGanho === 0 && f.justificativa) || st === "presente" || st === "p" || st === "justificada" || st === "j";
      
      // Se for presença em um dia oficial da turma, soma no total
      if (diasDaTurma.includes(dataFormatada) && isPresenteOuJustificada) {
        alunosMap[mat].presencasTotais++;
      }

      // Se for a presença de HOJE, marca no painel
      if (dataFormatada === dataHojeStr) {
         if (isPresenteOuJustificada && !idFreq.startsWith("FALTA-") && st !== "justificada" && st !== "j") {
           alunosMap[mat].presenteHoje = true;
           alunosMap[mat].horaHoje = String(f.hora || f.timestamp ? new Date(f.timestamp || 0).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Marcar");
         }
      }
    });

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
