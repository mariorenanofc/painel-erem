import { invalidatePortalCache,  } from "@/src/lib/cache";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { Transaction, FieldValue } from "firebase-admin/firestore";
import { calcularGamificacao } from "@/src/lib/gamificacao";
import { getRankingKeys } from "@/src/lib/dateUtils";

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
    // Removida a validação de tempoDecorridoReal baseada no tempoInicio do cliente, 
    // pois relógios desincronizados geram falso-positivos. O limite diário de XP já protege o sistema.

    // Máximo aceitável de 500 pontos por segundo
    const densidadeScore = score / duracaoPartida;
    if (densidadeScore > 500) {
      return NextResponse.json({ 
        status: "erro", 
        mensagem: "Partida inválida: Densidade de pontuação suspeita." 
      }, { status: 400 });
    }

    // 2. Calcular XP correspondente (1 XP por 1000 pontos)
    const xpCalculado = Math.max(0, Math.floor(score / 1000));

    // 3. Obter início do dia no fuso horário de São Paulo para verificação do limite diário (25 XP)
    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const diaHoje = String(spDate.getDate()).padStart(2, "0");
    const mesHoje = String(spDate.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(spDate.getFullYear());
    const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;

    // Consultar XP e Vidas Gastas hoje do portal_views
    const portalViewRef = dbAdmin.collection("portal_views").doc(matricula);
    const portalViewDoc = await portalViewRef.get();
    
    let jogosStatus = {
      dataReferencia: "",
      xpGanhoHoje: 0,
      vidasGastasHoje: 0
    };
    
    if (portalViewDoc.exists) {
      jogosStatus = portalViewDoc.data()?.jogosStatus || jogosStatus;
    }

    if (jogosStatus.dataReferencia !== dataHojeStr) {
      jogosStatus = {
        dataReferencia: dataHojeStr,
        xpGanhoHoje: 0,
        vidasGastasHoje: 0
      };
    }

    let xpGanhoHoje = jogosStatus.xpGanhoHoje;
    let vidasGastasHoje = jogosStatus.vidasGastasHoje;

    const LIMITE_VIDAS_DIARIAS = 12;
    
    // Agora o custo por partida é fixo em 3 vidas (a não ser que o frontend envie outro valor, mas garantimos o mínimo do db)
    // O texto diz "3 vidas por partida".
    const vidasDescontar = Math.max(vidasPerdidas, 3); // Custo mínimo de 3 vidas por partida gravada

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

    let xpAdicionar = 0;
    if (xpCalculado > 0) {
      xpAdicionar = Math.max(0, Math.min(xpCalculado, 25 - xpGanhoHoje));
    }

    // Se não há XP a ganhar e nenhuma vida foi perdida, pode apenas retornar sucesso.
    if (xpAdicionar <= 0 && vidasDescontar <= 0) {
      return NextResponse.json({ 
        status: "sucesso", 
        xpGanho: 0, 
        mensagem: `Partida concluída! Você fez ${score} pontos.` 
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

      // Registrar perda de vida
      if (vidasDescontar > 0) {
        const idVida = `VIDA-${timestamp}-${matricula}`;
        transaction.set(dbAdmin.collection("entregas").doc(idVida), {
          id: idVida,
          matricula,
          idAtividade: "JOGOS-VIDAS-GASTAS",
          resposta: `${tipoJogo} - Vidas perdidas: ${vidasDescontar}`,
          status: "Avaliado",
          quantidade: vidasDescontar,
          timestamp
        });
      }

      // Atualizar o XP do aluno
      transaction.update(alunoRef, {
        xp: finalXp,
        lastUpdated: timestamp
      });
      
      // CQRS: Atualizar portal_views com jogosStatus
      transaction.set(portalViewRef, {
        jogosStatus: {
          dataReferencia: dataHojeStr,
          xpGanhoHoje: xpGanhoHoje + xpAdicionar,
          vidasGastasHoje: vidasGastasHoje + vidasDescontar
        }
      }, { merge: true });

      // CQRS: Atualizar Ranking Semanal e Mensal
      if (xpAdicionar > 0) {
        const { semanaKey, mesKey } = getRankingKeys(new Date(timestamp));

        const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
        transaction.set(rankSemanaRef, {
          alunos: {
            [matricula]: {
              xpNormal: FieldValue.increment(xpAdicionar),
              xpAtrasado: FieldValue.increment(0),
              ultimoEnvio: timestamp
            }
          }
        }, { merge: true });

        const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
        transaction.set(rankMesRef, {
          alunos: {
            [matricula]: {
              xpNormal: FieldValue.increment(xpAdicionar),
              xpAtrasado: FieldValue.increment(0),
              ultimoEnvio: timestamp
            }
          }
        }, { merge: true });
      }

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
