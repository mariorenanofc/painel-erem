import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function POST(request: Request) {
  let matricula = "";
  let pacote = "";
  try {
    const body = await request.json();
    matricula = String(body.matricula || "").trim();
    pacote = String(body.pacote || "").trim().toUpperCase();

    if (!matricula || !pacote) {
      return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    // 1. Determinar preços e bilhetes do pacote
    let custo = 0;
    let qtdBilhetes = 0;
    if (pacote === "BRONZE") { custo = 1000; qtdBilhetes = 10; }
    else if (pacote === "PRATA") { custo = 1800; qtdBilhetes = 20; }
    else if (pacote === "OURO") { custo = 2500; qtdBilhetes = 30; }
    else {
      return NextResponse.json({ status: "erro", mensagem: "Pacote inválido manipulado." });
    }

    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const alunoDoc = await alunoRef.get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." });
    }

    const aluno = alunoDoc.data()!;
    const nomeAluno = aluno.nome || "Desconhecido";
    const turmaAluno = aluno.turma || aluno.turmaTrilha || "";
    const xpTotal = Number(aluno.xp) || 0;
    const xpGasto = Number(aluno.xpGasto) || 0;

    // 2. Matemática Financeira e Trava de Limite de 60%
    const saldoCarteira = xpTotal - xpGasto;
    const limiteMaximoGasto = saldoCarteira * 0.60;

    if (custo > limiteMaximoGasto) {
      // Registrar log de alerta no Firestore
      const timestamp = Date.now();
      const logRef = dbAdmin.collection("logs_seguranca").doc();
      await logRef.set({
        dataHora: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        matricula,
        nome: nomeAluno,
        acao: "TENTATIVA_COMPRA_INDEVIDA",
        detalhes: `Tentou forçar pacote ${pacote} (${custo} XP). Saldo real: ${saldoCarteira}. Limite de 60%: ${limiteMaximoGasto}.`
      });

      return NextResponse.json({
        status: "erro",
        mensagem: "🚨 Transação Recusada! O seu saldo é insuficiente ou esta compra ultrapassa o limite de segurança de 60%."
      });
    }

    // 3. Efetivar Compra em Transação atômica
    const timestamp = Date.now();
    const dataStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).split(",")[0];

    await dbAdmin.runTransaction(async (transaction: any) => {
      const freshAluno = (await transaction.get(alunoRef)).data()!;
      const freshXpGasto = Number(freshAluno.xpGasto) || 0;

      // Atualiza XP gasto do aluno
      transaction.update(alunoRef, {
        xpGasto: freshXpGasto + custo
      });

      // Grava extrato na coleção entregas
      const entregaId = `RIFA-${timestamp}`;
      const entregaRef = dbAdmin.collection("entregas").doc(entregaId);
      transaction.set(entregaRef, {
        id: entregaId,
        matricula,
        idAtividade: "LOJA-VIRTUAL",
        resposta: `Comprou Pacote ${pacote} (${qtdBilhetes} Bilhetes)`,
        status: "Avaliado",
        xpGanho: -custo,
        timestamp,
        feedback: "Transação Aprovada pela Loja"
      });

      // Injeta Bilhetes da Rifa
      for (let b = 0; b < qtdBilhetes; b++) {
        const bilheteId = `RF-${timestamp}-${b}`;
        const bilheteRef = dbAdmin.collection("rifa_bilhetes").doc(bilheteId);
        transaction.set(bilheteRef, {
          id: bilheteId,
          matricula,
          nomeAluno,
          turma: turmaAluno,
          data: dataStr,
          status: "ATIVO",
          timestamp
        });
      }
    });

    invalidatePortalCache(matricula);
    invalidateRankingCache();
    return NextResponse.json({ status: "sucesso", mensagem: `Contrato Aceito! ${qtdBilhetes} Bilhetes gerados com sucesso.` });

  } catch (error: any) {
    console.warn("[Failover] Erro na compra de rifa do Firestore:", error.message);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "comprar_rifa", matricula, pacote }),
        });
        return NextResponse.json(await response.json());
      } catch (sheetsErr) {}
    }
    return NextResponse.json({ status: "erro", mensagem: "Erro ao processar compra: " + error.message }, { status: 500 });
  }
}
