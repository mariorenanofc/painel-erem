import { invalidatePortalCache,  } from "@/src/lib/cache";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { Transaction } from "firebase-admin/firestore";
import { calcularGamificacao } from "@/src/lib/gamificacao";

export async function POST(request: Request) {
  let matricula = "";
  try {
    const body = await request.json();
    matricula = String(body.matricula || "").trim();
    const tipoJogo = String(body.tipoJogo || "").trim();
    const score = Number(body.score) || 0;
    const duracaoPartida = Number(body.duracaoPartida) || 0;
    const tempoInicio = Number(body.tempoInicio) || 0;
    const vidasPerdidas = Number(body.vidasPerdidas) || 0;

    if (!matricula || !tipoJogo || score < 0 || duracaoPartida <= 0 || !tempoInicio) {
      return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    // 1. Validação Anti-Cheat (Tempo e Densidade de Score)
    const agora = Date.now();
    const tempoDecorridoReal = agora - tempoInicio;
    const tempoMinimoEsperado = (duracaoPartida * 1000) - 2000; // tolerância de 2s

    if (tempoDecorridoReal < tempoMinimoEsperado) {
      return NextResponse.json({ 
        status: "erro", 
        mensagem: "Partida inválida: Tempo decorrido inconsistente com a duração reportada." 
      }, { status: 400 });
    }

    // Máximo aceitável de 500 pontos por segundo
    const densidadeScore = score / duracaoPartida;
    if (densidadeScore > 500) {
      return NextResponse.json({ 
        status: "erro", 
        mensagem: "Partida inválida: Densidade de pontuação suspeita." 
      }, { status: 400 });
    }

    // 2. Calcular XP correspondente (1 XP por 1000 pontos)
    const xpCalculado = Math.floor(score / 1000);
    if (xpCalculado <= 0) {
      return NextResponse.json({ 
        status: "sucesso", 
        xpGanho: 0, 
        mensagem: `Partida concluída! Você fez ${score} pontos. (Precisa de pelo menos 1.000 pontos para ganhar 1 XP)` 
      });
    }

    // 3. Obter início do dia no fuso horário de São Paulo para verificação do limite diário (25 XP)
    const startOfDayTimestamp = new Date(
      new Date().toLocaleDateString("en-US", { timeZone: "America/Sao_Paulo" })
    ).getTime();

    // Consultar XP e Vidas Gastas hoje
    const entregasSnap = await dbAdmin.collection("entregas")
      .where("matricula", "==", matricula)
      .get();

    let xpGanhoHoje = 0;
    let vidasGastasHoje = 0;

    entregasSnap.forEach(doc => {
      const data = doc.data();
      if (Number(data.timestamp || 0) >= startOfDayTimestamp) {
        if (data.idAtividade === "JOGOS-EDUCATIVOS") {
          xpGanhoHoje += Number(data.xpGanho) || 0;
        } else if (data.idAtividade === "JOGOS-VIDAS-GASTAS") {
          vidasGastasHoje += Number(data.quantidade) || 0;
        }
      }
    });

    const LIMITE_VIDAS_DIARIAS = 12;
    
    // Se o limite de vidas for excedido, nega o ganho de XP mas ainda processa a dedução (se aplicável)
    // Opcionalmente, podemos apenas zerar o xpCalculado
    if (vidasGastasHoje >= LIMITE_VIDAS_DIARIAS && xpCalculado > 0) {
      return NextResponse.json({ 
        status: "erro", 
        mensagem: "Suas 12 vidas diárias acabaram. Jogue amanhã para ganhar mais XP!" 
      });
    }

    if (xpGanhoHoje >= 25 && xpCalculado > 0) {
      return NextResponse.json({ 
        status: "erro", 
        mensagem: "Você já atingiu o limite diário de 25 XP com jogos hoje!" 
      });
    }

    const xpAdicionar = Math.min(xpCalculado, 25 - xpGanhoHoje);
    if (xpAdicionar <= 0) {
      return NextResponse.json({ 
        status: "erro", 
        mensagem: "Você já atingiu o limite diário de 25 XP com jogos hoje!" 
      });
    }

    // 4. Carregar Aluno
    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const alunoDoc = await alunoRef.get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." }, { status: 404 });
    }

    // 5. Transação para gravar entrega e somar XP com segurança
    const timestamp = Date.now();
    const idEntrega = `JOGO-${timestamp}-${matricula}`;
    let finalXp = 0;
    let finalGamificacao;

    await dbAdmin.runTransaction(async (transaction: Transaction) => {
      const freshAlunoDoc = await transaction.get(alunoRef);
      const freshAluno = freshAlunoDoc.data()!;
      const currentXp = Number(freshAluno.xp) || 0;
      const xpGasto = Number(freshAluno.xpGasto) || 0;

      finalXp = currentXp + xpAdicionar;

      // Registrar o log do jogo em "entregas" para que o sincronizador com o Google Sheets
      // pegue esse log e sincronize os pontos na planilha de notas automaticamente.
      // Registrar o log do jogo em "entregas"
      if (xpAdicionar > 0) {
        transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
          id: idEntrega,
          matricula,
          idAtividade: "JOGOS-EDUCATIVOS",
          resposta: `${tipoJogo} - Score: ${score}`,
          status: "Avaliado",
          xpGanho: xpAdicionar,
          timestamp
        });
      }

      // Registrar perda de vida, se houver
      if (vidasPerdidas > 0) {
        const idVida = `VIDA-${timestamp}-${matricula}`;
        transaction.set(dbAdmin.collection("entregas").doc(idVida), {
          id: idVida,
          matricula,
          idAtividade: "JOGOS-VIDAS-GASTAS",
          resposta: `${tipoJogo} - Vidas perdidas: ${vidasPerdidas}`,
          status: "Avaliado",
          quantidade: vidasPerdidas,
          timestamp
        });
      }

      // Atualizar o XP do aluno
      transaction.update(alunoRef, {
        xp: finalXp,
        lastUpdated: timestamp
      });

      finalGamificacao = calcularGamificacao(finalXp, xpGasto);
    });

    // Invalida os caches correspondentes
    invalidatePortalCache(matricula);

    return NextResponse.json({
      status: "sucesso",
      xpGanho: xpAdicionar,
      xpTotalDia: xpGanhoHoje + xpAdicionar,
      mensagem: `Parabéns! Você fez ${score} pontos e ganhou +${xpAdicionar} XP!`,
      gamificacao: finalGamificacao
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Salvar Pontuacao Jogos Error]", err);
    return NextResponse.json({ status: "erro", mensagem: "Erro interno no servidor." }, { status: 500 });
  }
}
