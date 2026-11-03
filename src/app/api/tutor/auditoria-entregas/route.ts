import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getAlunosAtivosSnapshot, clearAllPortalCaches, invalidateRankingCache } from "@/src/lib/cache";
import { getRankingKeys } from "@/src/lib/dateUtils";
import { FieldValue } from "firebase-admin/firestore";

interface AlunoMini {
  matricula: string;
  nome?: string;
  turma?: string;
  turmaTrilha?: string;
}

export interface ItemAuditoriaEntrega {
  idEntrega: string;
  matricula: string;
  nomeAluno: string;
  turma: string;
  dataEnvio: number;
  dataEnvioFormatada: string;
  status: string;
  xpAtual: number;
  xpEsperado: number;
  atrasado: boolean;
  diasAtraso: number;
  motivoAtraso?: string;
  jaPontuado: boolean;
  aptoPontuar: boolean;
  feedback?: string;
}

/**
 * Normaliza qualquer formato de data (DD/MM/YYYY, YYYY-MM-DD) para Objeto Date às 23:59:59
 */
function parseDataPrazo(strPrazo?: string): Date | null {
  if (!strPrazo) return null;
  const s = String(strPrazo).trim();
  if (!s) return null;

  if (s.includes("-")) {
    const p = s.split("-");
    if (p.length === 3) {
      const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59, 999);
      return isNaN(d.getTime()) ? null : d;
    }
  } else if (s.includes("/")) {
    const p = s.split("/");
    if (p.length === 3) {
      const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]), 23, 59, 59, 999);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/**
 * GET: Audita as entregas de uma atividade específica
 * Query params: idAtividade
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idAtividade = searchParams.get("idAtividade");

    if (!idAtividade) {
      return NextResponse.json({ status: "erro", mensagem: "idAtividade é obrigatório" }, { status: 400 });
    }

    // 1. Buscar a atividade
    const ativDoc = await dbAdmin.collection("atividades").doc(idAtividade).get();
    if (!ativDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Atividade não encontrada." }, { status: 404 });
    }
    const ativData = ativDoc.data() || {};
    const xpMaximo = Number(ativData.xp) || 0;
    const dataPrazoObj = parseDataPrazo(ativData.dataLimite);

    // 2. Buscar módulo para checar status
    const moduloNome = String(ativData.modulo || "").trim();
    let moduloEncerrado = false;
    if (moduloNome) {
      const modSnap = await dbAdmin.collection("modulos").where("nomeMod", "==", moduloNome).limit(1).get();
      if (!modSnap.empty) {
        const modStatus = String(modSnap.docs[0].data()?.statusMod || "").toLowerCase();
        if (modStatus === "encerrado") moduloEncerrado = true;
      }
    }

    // 3. Buscar entregas da atividade
    const entregasSnap = await dbAdmin.collection("entregas")
      .where("idAtividade", "==", idAtividade)
      .get();

    // 4. Buscar mapa de alunos para nomes e turmas
    const snapAlunos = (await getAlunosAtivosSnapshot(dbAdmin)) as AlunoMini[] | null;
    const mapaAlunos: Record<string, { nome: string; turma: string }> = {};

    if (snapAlunos && Array.isArray(snapAlunos)) {
      snapAlunos.forEach(a => {
        mapaAlunos[String(a.matricula)] = {
          nome: a.nome || `Aluno ${a.matricula}`,
          turma: a.turmaTrilha || a.turma || ""
        };
      });
    }

    const listaItens: ItemAuditoriaEntrega[] = [];

    entregasSnap.forEach(doc => {
      const e = doc.data();
      const matricula = String(e.matricula || doc.id.replace(new RegExp(`^${idAtividade}-`), "")).trim();
      const alunoInfo = mapaAlunos[matricula] || { nome: `Aluno ${matricula}`, turma: "" };

      const tsEnvio = Number(e.timestamp || e.dataEnvio || 0);
      const dataEnvioObj = tsEnvio > 0 ? new Date(tsEnvio) : null;
      const dataEnvioFormatada = dataEnvioObj
        ? dataEnvioObj.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "Data não registrada";

      const xpAtual = Number(e.xpGanho) || 0;
      const statusAtual = String(e.status || "Pendente");

      // Verificação de Atraso
      let atrasado = false;
      let diasAtraso = 0;
      let motivoAtraso = "";

      if (dataPrazoObj && dataEnvioObj) {
        if (dataEnvioObj.getTime() > dataPrazoObj.getTime()) {
          atrasado = true;
          const diffMs = dataEnvioObj.getTime() - dataPrazoObj.getTime();
          diasAtraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          motivoAtraso = `Enviado com ${diasAtraso} dia(s) de atraso em relação ao prazo final.`;
        }
      }

      // Verificação se está apto a pontuar automaticamente (dentro do prazo, módulo não encerrado e sem XP anterior)
      const jaPontuado = xpAtual > 0;
      let aptoPontuar = !jaPontuado && !moduloEncerrado && !atrasado;

      // Se a entrega foi devolvida pelo tutor, não está apta
      if (statusAtual === "Devolvida") {
        aptoPontuar = false;
      }

      listaItens.push({
        idEntrega: doc.id,
        matricula,
        nomeAluno: alunoInfo.nome,
        turma: alunoInfo.turma,
        dataEnvio: tsEnvio,
        dataEnvioFormatada,
        status: statusAtual,
        xpAtual,
        xpEsperado: xpMaximo,
        atrasado,
        diasAtraso,
        motivoAtraso,
        jaPontuado,
        aptoPontuar,
        feedback: e.feedback || ""
      });
    });

    // Ordenação: primeiro os aptos, depois os atrasados, depois os já pontuados
    listaItens.sort((a, b) => {
      if (a.aptoPontuar && !b.aptoPontuar) return -1;
      if (!a.aptoPontuar && b.aptoPontuar) return 1;
      if (a.atrasado && !b.atrasado) return 1;
      if (!a.atrasado && b.atrasado) return -1;
      return a.nomeAluno.localeCompare(b.nomeAluno);
    });

    return NextResponse.json({
      status: "sucesso",
      atividade: {
        id: idAtividade,
        titulo: ativData.titulo || "Atividade",
        xp: xpMaximo,
        dataLimite: ativData.dataLimite || "",
        modulo: moduloNome,
        moduloEncerrado
      },
      entregas: listaItens,
      resumo: {
        total: listaItens.length,
        aptasSemXp: listaItens.filter(i => i.aptoPontuar).length,
        atrasadas: listaItens.filter(i => i.atrasado && !i.jaPontuado).length,
        jaPontuadas: listaItens.filter(i => i.jaPontuado).length
      }
    });
  } catch (error: unknown) {
    console.error("[Auditoria Entregas - GET]", error);
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message || "Falha ao auditar entregas." }, { status: 500 });
  }
}

/**
 * POST: Concede XP seletivo para os alunos aprovados pelo tutor
 * Body: { idAtividade: string, matriculas: string[], valorXp?: number, permitirAtrasadas?: boolean }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idAtividade = String(body.idAtividade || "").trim();
    const matriculas = Array.isArray(body.matriculas) ? body.matriculas.map(String) : [];

    if (!idAtividade || matriculas.length === 0) {
      return NextResponse.json({ status: "erro", mensagem: "idAtividade e lista de matrículas são obrigatórios." }, { status: 400 });
    }

    // 1. Buscar a atividade
    const ativDoc = await dbAdmin.collection("atividades").doc(idAtividade).get();
    if (!ativDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Atividade não encontrada." }, { status: 404 });
    }
    const ativData = ativDoc.data() || {};
    const xpBase = body.valorXp !== undefined ? Number(body.valorXp) : (Number(ativData.xp) || 0);

    let processados = 0;
    const logs: string[] = [];

    // Processar em batches de até 150 operações
    const chunkSize = 25;
    for (let i = 0; i < matriculas.length; i += chunkSize) {
      const chunk = matriculas.slice(i, i + chunkSize);
      const batch = dbAdmin.batch();

      for (const mat of chunk) {
        const idEntrega = `${idAtividade}-${mat}`;
        const entregaRef = dbAdmin.collection("entregas").doc(idEntrega);
        const entregaSnap = await entregaRef.get();

        if (!entregaSnap.exists) {
          logs.push(`⚠️ Entrega não encontrada para matrícula ${mat}`);
          continue;
        }

        const eData = entregaSnap.data() || {};
        const xpAnterior = Number(eData.xpGanho) || 0;
        const xpDiff = Math.max(0, xpBase - xpAnterior);

        if (xpDiff <= 0 && xpAnterior > 0) {
          logs.push(`⏭️ Matrícula ${mat} já possui ${xpAnterior} XP. Pulada.`);
          continue;
        }

        const tsEnvio = Number(eData.timestamp || eData.dataEnvio || Date.now());
        const dataEnvioObj = new Date(tsEnvio);

        // 1. Atualiza a entrega
        batch.update(entregaRef, {
          status: "Avaliado",
          xpGanho: xpBase,
          auditadoPorTutorEm: Date.now(),
          feedback: (eData.feedback || "") + `\n[✅ XP auditado e creditado pelo Tutor (+${xpDiff} XP)]`
        });

        // 2. Atualiza o saldo do aluno
        const alunoRef = dbAdmin.collection("alunos").doc(mat);
        batch.update(alunoRef, {
          xpTotal: FieldValue.increment(xpDiff),
          xp: FieldValue.increment(xpDiff),
          lastUpdated: Date.now()
        });

        // 3. Atualiza portal_views (CQRS)
        const portalViewRef = dbAdmin.collection("portal_views").doc(mat);
        batch.set(portalViewRef, {
          entregasMap: {
            [idAtividade]: {
              status: "Avaliado",
              xpGanho: xpBase,
              dataEnvio: tsEnvio,
              feedback: (eData.feedback || "") + `\n[✅ XP auditado e creditado pelo Tutor]`
            }
          }
        }, { merge: true });

        // 4. Se o envio foi feito na semana corrente, soma nas estatísticas do ranking semanal/mensal
        const { semanaKey, mesKey } = getRankingKeys(dataEnvioObj);
        const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
        batch.set(rankSemanaRef, {
          alunos: {
            [mat]: {
              xpNormal: FieldValue.increment(xpDiff),
              ultimoEnvio: tsEnvio
            }
          }
        }, { merge: true });

        const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
        batch.set(rankMesRef, {
          alunos: {
            [mat]: {
              xpNormal: FieldValue.increment(xpDiff),
              ultimoEnvio: tsEnvio
            }
          }
        }, { merge: true });

        processados++;
      }

      await batch.commit();
    }

    if (processados > 0) {
      clearAllPortalCaches();
      invalidateRankingCache();
    }

    return NextResponse.json({
      status: "sucesso",
      mensagem: `${processados} aluno(s) tiveram o XP auditado e creditado com sucesso!`,
      processados,
      logs
    });
  } catch (error: unknown) {
    console.error("[Auditoria Entregas - POST]", error);
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message || "Falha ao processar auditoria." }, { status: 500 });
  }
}

