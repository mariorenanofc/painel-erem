import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { calcularGamificacao } from "@/src/lib/gamificacao";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matricula = searchParams.get("matricula")?.trim();
  const idAtividade = searchParams.get("idAtividade")?.trim();

  if (!matricula || !idAtividade) {
    return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
  }

  try {
    const docId = `${idAtividade}-${matricula}`;
    
    // Executa as 3 leituras em paralelo
    const [alunoDoc, atividadeDoc, entregaDoc] = await Promise.all([
      dbAdmin.collection("alunos").doc(matricula).get(),
      dbAdmin.collection("atividades").doc(idAtividade).get(),
      dbAdmin.collection("entregas").doc(docId).get()
    ]);

    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." }, { status: 404 });
    }
    if (!atividadeDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Atividade não encontrada." }, { status: 404 });
    }

    const aluno = alunoDoc.data()!;
    const ativ = atividadeDoc.data()!;
    const entrega = entregaDoc.exists ? entregaDoc.data() : null;

    // Calcular atraso
    let atrasoDias = 0;
    const dataLimiteStr = String(ativ.dataLimite || "").trim();
    let dataLimObj: Date | null = null;
    
    if (dataLimiteStr) {
      if (dataLimiteStr.includes("-")) {
        const p = dataLimiteStr.split("T")[0].split("-");
        if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      } else if (dataLimiteStr.includes("/")) {
        const p = dataLimiteStr.split("/");
        if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
      }
      if (dataLimObj) {
        dataLimObj.setHours(0, 0, 0, 0);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        if (hoje > dataLimObj) {
          atrasoDias = Math.ceil(Math.abs(hoje.getTime() - dataLimObj.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    }

    const statusPrazo = (atrasoDias > 0 && !entrega) ? "Atrasada" : "No Prazo";

    // Calcular nível e saldo usando o utilitário
    const xpTotal = Number(aluno.xp) || 0;
    const xpGasto = Number(aluno.xpGasto) || 0;
    const gStatus = calcularGamificacao(xpTotal, xpGasto);

    return NextResponse.json({
      status: "sucesso",
      atividade: {
        id: idAtividade,
        status: entrega ? (entrega.status || "Pendente") : "Pendente",
        respostaEnviada: entrega ? (entrega.resposta || "") : "",
        xpGanho: entrega ? (entrega.xpGanho || 0) : 0,
        dataEnvio: entrega ? (entrega.timestamp || 0) : 0,
        statusPrazo,
        feedback: entrega ? (entrega.feedback || "") : ""
      },
      perfilAtualizado: {
        xpTotal,
        nivel: gStatus.nivel,
        saldoCarteira: gStatus.saldoCarteira,
        progressoNivel: gStatus.progressoNivel
      }
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao carregar status da atividade ${idAtividade}: ${err.message}`);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
