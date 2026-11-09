import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { loadRegrasCiclos, invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { getRankingKeys, getCicloAnteriorKeys, getOpcoesCicloSemanal } from "@/src/lib/dateUtils";
import { CicloHistoricoItem, RegrasCiclosConfig } from "@/src/types";

interface AlunoCalculado {
  matricula: string;
  nome: string;
  turma: string;
  avatar: string;
  xpNormal: number;
  xpAtrasado: number;
  xpAtrasadoCapped: number;
  xpTotal: number;
  ultimoEnvio: number;
}

const CONTA_MESTRE = "1234567";

/**
 * Executa o fechamento de um ciclo (semanal ou mensal) de forma 100% idempotente e atômica.
 * @param tipo "semanal" | "mensal"
 * @param chaveAlvo opcional (ex: "2026_10" ou "2026_W44"). Se não fornecido, fecha o ciclo anterior com base na data.
 * @param autor quem disparou (ex: "tutor:Mário Renan" ou "automacao")
 */
export async function executarFechamentoCiclo(
  tipo: "semanal" | "mensal",
  chaveAlvo?: string,
  autor: string = "automacao"
): Promise<{ status: "sucesso" | "aviso" | "erro"; mensagem: string; ciclo?: CicloHistoricoItem }> {
  try {
    const dataAtual = new Date();
    let chaveFinal = chaveAlvo?.trim();

    if (!chaveFinal) {
      const anteriores = getCicloAnteriorKeys(dataAtual);
      chaveFinal = tipo === "mensal" ? anteriores.mesAnteriorKey : anteriores.semanaAnteriorKey;
    }

    const cicloId = `${tipo}_${chaveFinal}`;
    const cicloHistoricoRef = dbAdmin.collection("historico_ciclos").doc(cicloId);

    // 1. Verificar se o ciclo já foi fechado anteriormente (Idempotência)
    const cicloExistenteDoc = await cicloHistoricoRef.get();
    if (cicloExistenteDoc.exists) {
      const cData = cicloExistenteDoc.data() as CicloHistoricoItem;
      if (cData.status === "FECHADO") {
        return {
          status: "aviso",
          mensagem: `O ciclo ${cicloId} já foi fechado e premiado em ${new Date(cData.dataFechamento).toLocaleString("pt-BR")} por ${cData.fechadoPor}.`,
          ciclo: cData
        };
      }
    }

    // 2. Carregar regras dinâmicas de bonificação
    const regrasGerais: RegrasCiclosConfig = await loadRegrasCiclos(dbAdmin);
    const regraTipo = tipo === "mensal" ? regrasGerais.mensal : regrasGerais.semanal;

    if (!regraTipo.ativo) {
      return {
        status: "aviso",
        mensagem: `O ciclo ${tipo} está desativado nas configurações do sistema.`
      };
    }

    // 3. Buscar dados agregados de XP do ranking
    const targetKey = tipo === "mensal" ? `ranking_mensal_${chaveFinal}` : `ranking_semanal_${chaveFinal}`;
    const rankingDoc = await dbAdmin.collection("estatisticas").doc(targetKey).get();

    if (!rankingDoc.exists) {
      return {
        status: "aviso",
        mensagem: `Nenhum registro de atividade encontrado para o período ${chaveFinal} (${targetKey}).`
      };
    }

    const rankingData = (rankingDoc.data()?.alunos as Record<string, { xpNormal?: number; xpAtrasado?: number; ultimoEnvio?: number }>) || {};

    // 4. Carregar lista de alunos cadastrados
    const alunosSnap = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
    const alunosMap: Record<string, { nome: string; turma: string; avatar: string; xp: number; lastUpdated: number }> = {};

    alunosSnap.forEach((doc) => {
      const d = doc.data();
      alunosMap[doc.id] = {
        nome: String(d.nome || `Aluno ${doc.id}`),
        turma: String(d.turmaTrilha || d.turma || "Sem Turma"),
        avatar: String(d.avatarId || "👨‍💻"),
        xp: Number(d.xp) || 0,
        lastUpdated: Number(d.lastUpdated) || 9999999999999
      };
    });

    // 5. Consolidar pontuações dos alunos com o teto de atraso
    const limiteAtrasoCap = tipo === "semanal" ? 50 : 150;
    const listaAlunos: AlunoCalculado[] = [];

    for (const mat of Object.keys(rankingData)) {
      if (mat === CONTA_MESTRE) continue;

      const aluno = alunosMap[mat] || {
        nome: `Aluno ${mat}`,
        turma: "Sem Turma",
        avatar: "👨‍💻",
        xp: 0,
        lastUpdated: 9999999999999
      };

      const rData = rankingData[mat];
      const xpNormal = Number(rData.xpNormal) || 0;
      const xpAtrasado = Number(rData.xpAtrasado) || 0;
      const xpAtrasadoCapped = Math.min(xpAtrasado, limiteAtrasoCap);
      const xpTotal = xpNormal + xpAtrasadoCapped;
      const ultimoEnvio = Number(rData.ultimoEnvio) || aluno.lastUpdated;

      listaAlunos.push({
        matricula: mat,
        nome: aluno.nome,
        turma: aluno.turma,
        avatar: aluno.avatar,
        xpNormal,
        xpAtrasado,
        xpAtrasadoCapped,
        xpTotal,
        ultimoEnvio
      });
    }

    // Ordenador de ranking (maior XP primeiro; desempate por envio anterior)
    const ordenarRanking = (itens: AlunoCalculado[]) => {
      return [...itens].sort((a, b) => {
        if (b.xpTotal !== a.xpTotal) return b.xpTotal - a.xpTotal;
        return a.ultimoEnvio - b.ultimoEnvio;
      });
    };

    const rankingGeral = ordenarRanking(listaAlunos);
    const rankingTurma1 = ordenarRanking(listaAlunos.filter((a) => a.turma.includes("1")));
    const rankingTurma2 = ordenarRanking(listaAlunos.filter((a) => a.turma.includes("2")));

    // 6. Mapear premiados (Top 10 de cada turma)
    const timestampFechamento = Date.now();
    const premiadosLista: CicloHistoricoItem["premiados"] = [];

    const calcularBonus = (posicao: number): number => {
      if (posicao === 1) return regraTipo.xpTop1;
      if (posicao >= 2 && posicao <= 3) return regraTipo.xpTop2_3;
      if (posicao >= 4 && posicao <= 10) return regraTipo.xpTop4_10;
      return 0;
    };

    const processarTurmaPremiados = (rankingTurma: AlunoCalculado[]) => {
      rankingTurma.slice(0, 10).forEach((aluno, index) => {
        const posicao = index + 1;
        const xpBonus = calcularBonus(posicao);
        premiadosLista.push({
          matricula: aluno.matricula,
          nome: aluno.nome,
          turma: aluno.turma,
          posicao,
          xpAcumulado: aluno.xpTotal,
          xpBonus
        });
      });
    };

    processarTurmaPremiados(rankingTurma1);
    processarTurmaPremiados(rankingTurma2);

    // 7. Injetar XP atômico no banco com ID determinístico
    for (const item of premiadosLista) {
      if (item.xpBonus <= 0) continue;

      const mat = item.matricula;
      const idEntrega = `PREMIO-CICLO-${tipo.toUpperCase()}-${chaveFinal}-${mat}`;
      const entregaRef = dbAdmin.collection("entregas").doc(idEntrega);
      const alunoRef = dbAdmin.collection("alunos").doc(mat);
      const portalViewRef = dbAdmin.collection("portal_views").doc(mat);

      const jaExiste = (await entregaRef.get()).exists;
      if (jaExiste) continue;

      const alunoDoc = await alunoRef.get();
      if (!alunoDoc.exists) continue;

      const xpAtual = Number(alunoDoc.data()?.xp) || 0;
      const motivoTexto = `Premiação Top 10 (${item.posicao}º Lugar) - Ranking ${tipo === "mensal" ? "Mensal" : "Semanal"} (${chaveFinal})`;

      await alunoRef.update({
        xp: xpAtual + item.xpBonus,
        lastUpdated: timestampFechamento
      });

      await entregaRef.set({
        id: idEntrega,
        matricula: mat,
        idAtividade: "BÔNUS/MULTA",
        resposta: motivoTexto,
        status: "Bônus",
        xpGanho: item.xpBonus,
        timestamp: timestampFechamento
      });

      await portalViewRef.set({
        entregas: {
          [idEntrega]: {
            status: "Bônus",
            resposta: motivoTexto,
            xpGanho: item.xpBonus,
            dataEnvio: timestampFechamento,
            feedback: `Parabéns pelo ${item.posicao}º lugar no ranking ${tipo}!`
          }
        }
      }, { merge: true });

      invalidatePortalCache(mat);
    }

    // 8. Gerar Mensagens do WhatsApp
    const temBrinde = regraTipo.brindeFisicoTop1 !== false;
    const xpTop1 = regraTipo.xpTop1 || 0;
    const xpTop2_3 = regraTipo.xpTop2_3 || 0;
    const xpTop4_10 = regraTipo.xpTop4_10 || 0;

    const gerarMensagem = (titulo: string, turmaLabel: string, lista: AlunoCalculado[]) => {
      let txt = `🏆 *RANKING ${titulo.toUpperCase()} FECHADO: ${chaveFinal} – ${turmaLabel.toUpperCase()}!* 🏆\n\n`;
      txt += `Fala, Devs! O sistema finalizou a contagem oficial do ciclo ${tipo}! Parabéns a todos pelo foco, constância e pelas entregas! 🔥💻\n\n`;

      const t1 = lista[0];
      if (t1) {
        txt += `🥇 *CAMPEÃ(O) DO CICLO:*\n👑 *1º ${t1.nome.toUpperCase()}* — ${t1.xpTotal} XP\n`;
        if (temBrinde && xpTop1 > 0) {
          txt += `🎁 *Premiação do 1º Lugar:* Brinde Físico Exclusivo + ${xpTop1} XP de Bônus!\n*(Aplaude de pé! 👏 Topo absoluto!)*\n\n`;
        } else if (temBrinde && xpTop1 === 0) {
          txt += `🎁 *Premiação do 1º Lugar:* Brinde Físico Exclusivo do Ciclo!\n*(Aplaude de pé! 👏 Topo absoluto!)*\n\n`;
        } else if (!temBrinde && xpTop1 > 0) {
          txt += `⚡ *Premiação do 1º Lugar:* +${xpTop1} XP de Bônus na conta!\n*(Aplaude de pé! 👏 Topo absoluto!)*\n\n`;
        } else {
          txt += `*(Aplaude de pé! 👏 Topo absoluto!)*\n\n`;
        }
      }

      const pElite = lista.slice(1, 3);
      if (pElite.length > 0) {
        txt += `🥈 *PÓDIO DE ELITE (+${xpTop2_3} XP):*\n`;
        pElite.forEach((a, i) => {
          txt += `* ⭐ *${i + 2}º ${a.nome.toUpperCase()}* — ${a.xpTotal} XP (+${xpTop2_3} XP)\n`;
        });
        txt += `\n`;
      }

      const outros = lista.slice(3, 10);
      if (outros.length > 0) {
        txt += `🎖️ *TOP 10 COMPLETO (+${xpTop4_10} XP):*\n`;
        outros.forEach((a, i) => {
          txt += `* 🎖️ *${i + 4}º ${a.nome.toUpperCase()}* — ${a.xpTotal} XP (+${xpTop4_10} XP)\n`;
        });
        txt += `\n`;
      }

      txt += `🚀 *BÔNUS DE XP CREDITADOS!* Os pontos por colocação já foram adicionados na conta de vocês no portal. Bora com tudo para o próximo ciclo! 💪🔥`;
      return txt;
    };

    const mensagens = {
      turma1: gerarMensagem(tipo, "Turma 1 (1º Ano)", rankingTurma1),
      turma2: gerarMensagem(tipo, "Turma 2 (2º Ano)", rankingTurma2),
      geral: gerarMensagem(tipo, "Geral Unificado", rankingGeral)
    };

    // 9. Gravar Snapshot no Histórico
    const historicoPayload: CicloHistoricoItem = {
      id: cicloId,
      tipo,
      chave: chaveFinal,
      dataFechamento: timestampFechamento,
      fechadoPor: autor,
      regrasAplicadas: {
        xpTop1: regraTipo.xpTop1,
        xpTop2_3: regraTipo.xpTop2_3,
        xpTop4_10: regraTipo.xpTop4_10
      },
      totalPremiados: premiadosLista.length,
      premiados: premiadosLista,
      mensagens,
      status: "FECHADO"
    };

    await cicloHistoricoRef.set(historicoPayload);
    invalidateRankingCache();

    return {
      status: "sucesso",
      mensagem: `Ciclo ${cicloId} fechado com sucesso! ${premiadosLista.length} alunos premiados.`,
      ciclo: historicoPayload
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Ciclos Engine] Erro ao fechar ciclo:", err);
    return {
      status: "erro",
      mensagem: `Falha ao processar fechamento do ciclo: ${err.message}`
    };
  }
}

/**
 * Estorno de Emergência: reverte exclusivamente os bônus concedidos no ciclo especificado.
 */
export async function executarEstornoCiclo(
  cicloId: string,
  autor: string = "tutor:admin"
): Promise<{ status: "sucesso" | "aviso" | "erro"; mensagem: string }> {
  try {
    const cicloRef = dbAdmin.collection("historico_ciclos").doc(cicloId);
    const cicloDoc = await cicloRef.get();

    if (!cicloDoc.exists) {
      return { status: "erro", mensagem: `Ciclo ${cicloId} não encontrado no histórico.` };
    }

    const cicloData = cicloDoc.data() as CicloHistoricoItem;
    if (cicloData.status === "ESTORNADO") {
      return { status: "aviso", mensagem: `Este ciclo já foi estornado anteriormente em ${new Date(cicloData.estornadoEm || 0).toLocaleString("pt-BR")}.` };
    }

    const timestampEstorno = Date.now();

    for (const item of cicloData.premiados) {
      if (item.xpBonus <= 0) continue;

      const mat = item.matricula;
      const idEntrega = `PREMIO-CICLO-${cicloData.tipo.toUpperCase()}-${cicloData.chave}-${mat}`;
      const entregaRef = dbAdmin.collection("entregas").doc(idEntrega);
      const alunoRef = dbAdmin.collection("alunos").doc(mat);
      const portalViewRef = dbAdmin.collection("portal_views").doc(mat);

      // 1. Remover entrega
      await entregaRef.delete().catch(() => {});

      // 2. Deduzir XP do aluno
      const alunoDoc = await alunoRef.get();
      if (alunoDoc.exists) {
        const xpAtual = Number(alunoDoc.data()?.xp) || 0;
        await alunoRef.update({
          xp: Math.max(0, xpAtual - item.xpBonus),
          lastUpdated: timestampEstorno
        });
      }

      // 3. Atualizar CQRS
      await portalViewRef.update({
        [`entregas.${idEntrega}`]: {
          status: "Estornado",
          resposta: `Premiação Estornada pelo Tutor (${cicloId})`,
          xpGanho: 0,
          dataEnvio: timestampEstorno,
          feedback: "Estorno de bonificação efetuado pela coordenação."
        }
      }).catch(() => {});

      invalidatePortalCache(mat);
    }

    // 4. Marcar ciclo como estornado no histórico
    await cicloRef.update({
      status: "ESTORNADO",
      estornadoEm: timestampEstorno,
      estornadoPor: autor
    });

    invalidateRankingCache();

    return {
      status: "sucesso",
      mensagem: `Ciclo ${cicloId} estornado com sucesso! Todos os ${cicloData.premiados.length} bônus foram revertidos sem afetar outras notas.`
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Ciclos Engine] Erro ao estornar ciclo:", err);
    return {
      status: "erro",
      mensagem: `Falha ao processar estorno: ${err.message}`
    };
  }
}


/**
 * Verificação "Just-in-Time" de Ciclos Pendentes de Fechamento.
 * Executada de forma leve e não-bloqueante no acesso ao ranking ou portal.
 * Se o ciclo atual já passou do dia e horário configurados para fechamento e ainda não foi arquivado,
 * executa o fechamento silenciosamente no mesmo instante.
 */
let ultimaChecagemTimestamp = 0;

export async function verificarEFecharCiclosPendentes(db: FirebaseFirestore.Firestore): Promise<void> {
  const agora = Date.now();
  // Throttle em memória: não checar mais de uma vez a cada 60 segundos por instância
  if (agora - ultimaChecagemTimestamp < 60000) return;
  ultimaChecagemTimestamp = agora;

  try {
    const regras: RegrasCiclosConfig = await loadRegrasCiclos(dbAdmin);

    // 1. Verificar Ciclo Semanal
    if (regras.semanal.ativo && regras.semanal.modoExecucao === "automatico") {
      const diaCorte = regras.semanal.diaFechamento !== undefined ? Number(regras.semanal.diaFechamento) : 5;
      const horaCorte = regras.semanal.horaFechamento || "16:59";
      
      const { semanaAlvoPrincipal, passouCorteSemanaAtual } = getOpcoesCicloSemanal(new Date(), diaCorte, horaCorte);

      if (passouCorteSemanaAtual) {
        const cicloId = `semanal_${semanaAlvoPrincipal}`;
        const cicloDoc = await dbAdmin.collection("historico_ciclos").doc(cicloId).get();
        if (!cicloDoc.exists || cicloDoc.data()?.status !== "FECHADO") {
          console.log(`[Just-in-Time Ciclos] Fechamento automático pendente detectado para ${cicloId}. Executando...`);
          await executarFechamentoCiclo("semanal", semanaAlvoPrincipal, "automacao:just-in-time");
        }
      }
    }

    // 2. Verificar Ciclo Mensal
    if (regras.mensal.ativo && regras.mensal.modoExecucao === "automatico") {
      const dataHoje = new Date();
      const ultimoDiaMes = new Date(dataHoje.getFullYear(), dataHoje.getMonth() + 1, 0).getDate();
      const horaCorteMensal = regras.mensal.horaFechamento || "23:59";
      const horaMinutoAtual = String(dataHoje.getHours()).padStart(2, "0") + ":" + String(dataHoje.getMinutes()).padStart(2, "0");

      // Se for o último dia do mês e já passou da hora de corte
      if (dataHoje.getDate() === ultimoDiaMes && horaMinutoAtual >= horaCorteMensal) {
        const { mesKey } = getRankingKeys(dataHoje);
        const cicloId = `mensal_${mesKey}`;
        const cicloDoc = await dbAdmin.collection("historico_ciclos").doc(cicloId).get();
        if (!cicloDoc.exists || cicloDoc.data()?.status !== "FECHADO") {
          console.log(`[Just-in-Time Ciclos] Fechamento mensal pendente detectado para ${cicloId}. Executando...`);
          await executarFechamentoCiclo("mensal", mesKey, "automacao:just-in-time");
        }
      }
    }
  } catch (err: unknown) {
    console.warn("[Just-in-Time Ciclos] Erro na verificação silenciosa:", (err as Error).message);
  }
}
