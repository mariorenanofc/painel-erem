import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedAdminAlunos, setCachedAdminAlunos, getAlunosAtivosSnapshot, invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { QueryDocumentSnapshot, Transaction, FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { getRankingKeys } from "@/src/lib/dateUtils";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN_SECRET = process.env.TUTOR_TOKEN_SECRET
  ? process.env.TUTOR_TOKEN_SECRET.replace(/^["']|["']$/g, "").trim()
  : undefined;

interface Transacao {
  id: string;
  matricula: string;
  nomeAluno: string;
  idAtividade: string;
  resposta: string;
  status: string;
  xpGanho: number;
  timestamp: number;
  feedback: string;
}

// Helper para substituir matrículas por nomes na resposta da transação
function formatResposta(resposta: string, alunosMap: Record<string, string>) {
  if (!resposta) return "";
  // Procura por números de 5 dígitos (ex: matrícula de aluno)
  return resposta.replace(/\b\d{5}\b/g, (match) => {
    return alunosMap[match] ? `${alunosMap[match]} (${match})` : match;
  });
}

// -------------------------------------------------------------------------
// GET: Listar transações
// -------------------------------------------------------------------------
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tutor_session");
  if (!sessionCookie || sessionCookie.value !== "active") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Number(searchParams.get("limit") || 20));
  const busca = String(searchParams.get("busca") || "").trim().toLowerCase();
  const categoria = String(searchParams.get("categoria") || "").trim();
  const status = String(searchParams.get("status") || "").trim();

  const alunosMap: Record<string, string> = {};
  const transacoes: Transacao[] = [];

  try {
    // 1. Carregar mapa de estudantes para tradução de matrícula -> nome (Usando Cache)
    let alunosArray = getCachedAdminAlunos() as Array<{ matricula: string, nome: string, turma: string, statusTrilha: string, xp: number, xpGasto: number, senha: string }> | null;
    if (!alunosArray) {
      const snapAlunos = await getAlunosAtivosSnapshot(dbAdmin);
      if (snapAlunos && snapAlunos.length > 0) {
        alunosArray = snapAlunos.map((a: Record<string, unknown>) => ({
          matricula: String(a.matricula),
          nome: String(a.nome || `Aluno ${a.matricula}`),
          turma: String(a.turmaTrilha || a.turma || ""),
          statusTrilha: String(a.statusTrilha || "Inativo"),
          xp: Number(a.xp) || 0,
          xpGasto: Number(a.xpGasto) || 0,
          senha: String(a.pinPix || a.senha || "")
        }));
      } else {
        const snapshot = await dbAdmin.collection("alunos").get();
        alunosArray = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          return {
            matricula: doc.id,
            nome: data.nome || `Aluno ${doc.id}`,
            turma: data.turmaTrilha || data.turma || "",
            statusTrilha: data.statusTrilha || "Inativo",
            xp: Number(data.xp) || 0,
            xpGasto: Number(data.xpGasto) || 0,
            senha: data.pinPix || data.senha || ""
          };
        });
      }
      setCachedAdminAlunos(alunosArray);
    }

    alunosArray.forEach((aluno) => {
      if (aluno.matricula) {
        alunosMap[String(aluno.matricula).trim()] = String(aluno.nome || "").trim();
      }
    });

    // 2. Tentar buscar transações (entregas) no Firestore
    const entregasSnap = await dbAdmin
      .collection("entregas")
      .orderBy("timestamp", "desc")
      .limit(350) // Limite de varredura rápida em memória
      .get();

    entregasSnap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const matricula = String(data.matricula || "").trim();
      transacoes.push({
        id: doc.id,
        matricula,
        nomeAluno: alunosMap[matricula] || matricula,
        idAtividade: String(data.idAtividade || "").trim(),
        resposta: String(data.resposta || ""),
        status: String(data.status || "Aguardando Correção").trim(),
        xpGanho: Number(data.xpGanho) || 0,
        timestamp: Number(data.timestamp) || 0,
        feedback: String(data.feedback || "").trim()
      });
    });

  } catch (firestoreError: unknown) {
    const fireErr = firestoreError as Error;
    console.warn("[Failover] Erro ao buscar transações no Firestore. Usando Planilha...", fireErr.message);

    if (!GOOGLE_API_URL || !TUTOR_TOKEN_SECRET) {
      return NextResponse.json({ error: "Serviço indisponível e sem credenciais de planilha." }, { status: 500 });
    }

    try {
      const sheetsRes = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "exportar_dados_migracao", token: TUTOR_TOKEN_SECRET }),
      });
      const sheetsData = await sheetsRes.json();
      if (sheetsData.status !== "sucesso") {
        throw new Error(sheetsData.mensagem || "Erro na planilha.");
      }

      // Montar mapa a partir dos dados brutos da planilha
      const baseValues = sheetsData.basededados || [];
      for (let i = 1; i < baseValues.length; i++) {
        const mat = String(baseValues[i][2]).trim();
        const nome = String(baseValues[i][0]).trim();
        if (mat) alunosMap[mat] = nome;
      }

      const entregasValues = sheetsData.entregas || [];
      for (let i = entregasValues.length - 1; i >= 1; i--) { // Ordem inversa para data recente primeiro
        const mat = String(entregasValues[i][1]).trim();
        transacoes.push({
          id: String(entregasValues[i][0]),
          matricula: mat,
          nomeAluno: alunosMap[mat] || mat,
          idAtividade: String(entregasValues[i][2]).trim(),
          resposta: String(entregasValues[i][3] || ""),
          status: String(entregasValues[i][4] || "Aguardando Correção").trim(),
          xpGanho: Number(entregasValues[i][5]) || 0,
          timestamp: Number(entregasValues[i][6]) || 0,
          feedback: String(entregasValues[i][7] || "").trim()
        });
      }

      // Ordenar por timestamp desc
      transacoes.sort((a, b) => b.timestamp - a.timestamp);

    } catch (sheetsError: unknown) {
      const sheetsErrObj = sheetsError as Error;
      return NextResponse.json({ error: "Erro ao ler transações de ambas as bases: " + sheetsErrObj.message }, { status: 500 });
    }
  }

  // 3. Formatar respostas e filtrar resultados em memória
  let resultadosFiltrados = transacoes.map(t => {
    return {
      ...t,
      respostaFormatada: formatResposta(t.resposta, alunosMap)
    };
  });

  // Filtrar por Categoria (tratar variações case-insensitive e sinônimos do banco de dados)
  if (categoria) {
    const catUpper = categoria.toUpperCase();

    if (catUpper === "TRANSFERENCIA-XP") {
      resultadosFiltrados = resultadosFiltrados.filter(t => {
        const act = String(t.idAtividade || "").toUpperCase();
        return act.includes("TRANSFER") || act.includes("PIX") || act.includes("ENVIOU") || act.includes("RECEBEU");
      });
    } else if (catUpper === "COMPRA_RIFA") {
      resultadosFiltrados = resultadosFiltrados.filter(t => {
        const act = String(t.idAtividade || "").toUpperCase();
        return act.includes("RIFA") || act.includes("LOJA") || act.includes("VIRTUAL") || act.includes("COMPRA");
      });
    } else if (catUpper === "AJUSTE-MANUAL") {
      resultadosFiltrados = resultadosFiltrados.filter(t => {
        const act = String(t.idAtividade || "").toUpperCase();
        return act.includes("AJUSTE") || act.includes("MANUAL") || act.includes("BÔNUS") || act.includes("BONUS") || act.includes("MULTA") || act.includes("INJET") || act.includes("NOTIF");
      });
    } else if (catUpper === "SISTEMA") {
      resultadosFiltrados = resultadosFiltrados.filter(t => {
        const act = String(t.idAtividade || "").toUpperCase();
        return act.includes("SISTEMA") || act.includes("AUTO") || act.includes("BOT");
      });
    } else if (catUpper === "MISSOES") {
      resultadosFiltrados = resultadosFiltrados.filter(t => {
        const act = String(t.idAtividade || "").toUpperCase();
        const ehEspecial = act.includes("TRANSFER") || act.includes("PIX") || act.includes("ENVIOU") || act.includes("RECEBEU") ||
          act.includes("RIFA") || act.includes("LOJA") || act.includes("VIRTUAL") || act.includes("COMPRA") ||
          act.includes("AJUSTE") || act.includes("MANUAL") || act.includes("BÔNUS") || act.includes("BONUS") ||
          act.includes("MULTA") || act.includes("INJET") || act.includes("SISTEMA") || act.includes("AUTO") ||
          t.id.startsWith("NOTIF-");
        return !ehEspecial;
      });
    }
  }

  // Filtrar por Status
  if (status) {
    resultadosFiltrados = resultadosFiltrados.filter(t => t.status.toLowerCase() === status.toLowerCase());
  } else {
    resultadosFiltrados = resultadosFiltrados.filter(t => t.status.toUpperCase() !== "EXCLUIDA");
  }

  // Filtrar por busca (nome, matrícula ou texto da resposta)
  if (busca) {
    resultadosFiltrados = resultadosFiltrados.filter(
      t =>
        t.nomeAluno.toLowerCase().includes(busca) ||
        t.matricula.toLowerCase().includes(busca) ||
        t.respostaFormatada.toLowerCase().includes(busca) ||
        t.idAtividade.toLowerCase().includes(busca)
    );
  }

  // 4. Paginação
  const total = resultadosFiltrados.length;
  const startIndex = (page - 1) * limit;
  const transacoesPaginadas = resultadosFiltrados.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    status: "sucesso",
    transacoes: transacoesPaginadas,
    total,
    page,
    limit
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate"
    }
  });
}

// -------------------------------------------------------------------------
// PUT: Editar transação (com reestorno de XP)
// -------------------------------------------------------------------------
export async function PUT(request: Request) {
  let id = "";
  let matricula = "";
  let novoStatus = "";
  let novoXpGanho = 0;
  let novoFeedback = "";
  let novaResposta = "";

  try {
    const body = await request.json();
    id = String(body.id || "").trim();
    matricula = String(body.matricula || "").trim();
    novoStatus = String(body.status || "Avaliado").trim();
    novoXpGanho = Number(body.xpGanho) || 0;
    novoFeedback = String(body.feedback || "").trim();
    novaResposta = String(body.resposta || "").trim();

    if (!id || !matricula) {
      return NextResponse.json({ status: "erro", mensagem: "ID e Matrícula são obrigatórios." }, { status: 400 });
    }

    // Tentar atualizar no Firestore
    const entregaRef = dbAdmin.collection("entregas").doc(id);
    const doc = await entregaRef.get();
    if (!doc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Transação não encontrada." }, { status: 404 });
    }

    const antigaEntrega = doc.data()!;
    const antigoXpGanho = Number(antigaEntrega.xpGanho) || 0;
    const diffXp = novoXpGanho - antigoXpGanho;

    await dbAdmin.runTransaction(async (transaction: Transaction) => {
      // 1. Atualizar Entrega
      transaction.update(entregaRef, {
        status: novoStatus,
        xpGanho: novoXpGanho,
        feedback: novoFeedback,
        resposta: novaResposta,
        timestamp: Date.now() // Força sincronização
      });

      // 2. Se mudou o XP e a transação afeta um aluno ativo
      if (diffXp !== 0 && matricula !== "SISTEMA") {
        const alunoRef = dbAdmin.collection("alunos").doc(matricula);
        const freshAlunoDoc = await transaction.get(alunoRef);
        if (freshAlunoDoc.exists) {
          const freshAluno = freshAlunoDoc.data()!;
          const currentXp = Number(freshAluno.xp) || 0;
          transaction.update(alunoRef, {
            xp: Math.max(0, currentXp + diffXp),
            lastUpdated: Date.now()
          });
          
          if (diffXp !== 0) {
            const timestampEnvio = Number(antigaEntrega.timestamp) || Date.now();
            const { semanaKey, mesKey } = getRankingKeys(new Date(timestampEnvio));
            
            const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
            transaction.set(rankSemanaRef, {
              alunos: {
                [matricula]: {
                  xpNormal: FieldValue.increment(diffXp),
                  ultimoEnvio: Date.now()
                }
              }
            }, { merge: true });
    
            const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
            transaction.set(rankMesRef, {
              alunos: {
                [matricula]: {
                  xpNormal: FieldValue.increment(diffXp),
                  ultimoEnvio: Date.now()
                }
              }
            }, { merge: true });
          }
        }
      }

      // CQRS: Atualizar portal_views
      if (matricula !== "SISTEMA") {
        const portalViewRef = dbAdmin.collection("portal_views").doc(matricula);
        transaction.set(portalViewRef, {
          entregasMap: {
            [String(antigaEntrega.idAtividade || "").trim()]: {
              resposta: novaResposta,
              status: novoStatus,
              xpGanho: novoXpGanho,
              dataEnvio: Date.now(),
              feedback: novoFeedback
            }
          }
        }, { merge: true });
      }
    });

    // Invalidar caches afetados
    invalidatePortalCache(matricula);
    invalidateRankingCache();

    return NextResponse.json({ status: "sucesso", mensagem: "Transação atualizada com sucesso!" });

  } catch (firestoreError: unknown) {
    const fireErr = firestoreError as Error;
    console.warn("[Failover] Erro ao editar transação no Firestore. Enviando para Planilha...", fireErr.message);

    if (!GOOGLE_API_URL || !TUTOR_TOKEN_SECRET) {
      return NextResponse.json({ error: "Serviço indisponível e sem credenciais de planilha." }, { status: 500 });
    }

    try {
      // Usar a rota avaliar_entrega do Apps Script para atualizar o registro na planilha e recalcular XP
      const response = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "avaliar_entrega",
          idEntrega: id,
          matricula,
          xpGanho: novoXpGanho,
          novoStatus,
          feedback: novoFeedback,
          token: TUTOR_TOKEN_SECRET
        }),
      });
      const sheetsData = await response.json();
      return NextResponse.json(sheetsData);
    } catch (sheetsError: unknown) {
      const sheetsErrObj = sheetsError as Error;
      return NextResponse.json({ error: "Erro ao atualizar na planilha: " + sheetsErrObj.message }, { status: 500 });
    }
  }
}

// -------------------------------------------------------------------------
// DELETE: Excluir/Soft-deletar transação e reverter XP
// -------------------------------------------------------------------------
export async function DELETE(request: Request) {
  let id = "";
  let matricula = "";

  try {
    const { searchParams } = new URL(request.url);
    id = String(searchParams.get("id") || "").trim();
    matricula = String(searchParams.get("matricula") || "").trim();

    if (!id || !matricula) {
      return NextResponse.json({ status: "erro", mensagem: "ID e Matrícula são obrigatórios." }, { status: 400 });
    }

    // Tentar atualizar no Firestore (soft delete para manter integridade com planilhas)
    const entregaRef = dbAdmin.collection("entregas").doc(id);
    const doc = await entregaRef.get();
    if (!doc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Transação não encontrada." }, { status: 404 });
    }

    const antigaEntrega = doc.data()!;
    const antigoXpGanho = Number(antigaEntrega.xpGanho) || 0;
    const antigaResposta = String(antigaEntrega.resposta || "");

    await dbAdmin.runTransaction(async (transaction: Transaction) => {
      // 1. Atualizar para status EXCLUIDA, zeras XP e renomear resposta
      transaction.update(entregaRef, {
        status: "EXCLUIDA",
        xpGanho: 0,
        resposta: `[EXCLUÍDA] ${antigaResposta}`,
        timestamp: Date.now() // Força sincronização
      });

      // 2. Estornar XP do saldo total do estudante
      if (antigoXpGanho !== 0 && matricula !== "SISTEMA") {
        const alunoRef = dbAdmin.collection("alunos").doc(matricula);
        const freshAlunoDoc = await transaction.get(alunoRef);
        if (freshAlunoDoc.exists) {
          const freshAluno = freshAlunoDoc.data()!;
          const currentXp = Number(freshAluno.xp) || 0;
          transaction.update(alunoRef, {
            xp: Math.max(0, currentXp - antigoXpGanho), // Reverte o XP adicionado anteriormente
            lastUpdated: Date.now()
          });
          
          const timestampEnvio = Number(antigaEntrega.timestamp) || Date.now();
          const { semanaKey, mesKey } = getRankingKeys(new Date(timestampEnvio));
          
          const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
          transaction.set(rankSemanaRef, {
            alunos: {
              [matricula]: {
                xpNormal: FieldValue.increment(-antigoXpGanho),
                ultimoEnvio: Date.now()
              }
            }
          }, { merge: true });
  
          const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
          transaction.set(rankMesRef, {
            alunos: {
              [matricula]: {
                xpNormal: FieldValue.increment(-antigoXpGanho),
                ultimoEnvio: Date.now()
              }
            }
          }, { merge: true });
        }
      }

      // CQRS: Atualizar portal_views
      if (matricula !== "SISTEMA") {
        const portalViewRef = dbAdmin.collection("portal_views").doc(matricula);
        transaction.set(portalViewRef, {
          entregasMap: {
            [String(antigaEntrega.idAtividade || "").trim()]: {
              resposta: `[EXCLUÍDA] ${antigaResposta}`,
              status: "EXCLUIDA",
              xpGanho: 0,
              dataEnvio: Date.now(),
              feedback: "Excluída"
            }
          }
        }, { merge: true });
      }
    });

    // Invalida caches
    invalidatePortalCache(matricula);
    invalidateRankingCache();

    return NextResponse.json({ status: "sucesso", mensagem: "Transação estornada e excluída com sucesso!" });

  } catch (firestoreError: unknown) {
    const fireErr = firestoreError as Error;
    console.warn("[Failover] Erro ao excluir transação no Firestore. Sincronizando com Planilha...", fireErr.message);

    if (!GOOGLE_API_URL || !TUTOR_TOKEN_SECRET) {
      return NextResponse.json({ error: "Serviço indisponível e sem credenciais de planilha." }, { status: 500 });
    }

    try {
      // Reverter na planilha marcando como EXCLUIDA e com XP = 0
      const response = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "avaliar_entrega",
          idEntrega: id,
          matricula,
          xpGanho: 0,
          novoStatus: "EXCLUIDA",
          feedback: "Transação excluída pelo tutor no painel",
          token: TUTOR_TOKEN_SECRET
        }),
      });
      const sheetsData = await response.json();
      return NextResponse.json(sheetsData);
    } catch (sheetsError: unknown) {
      const sheetsErrObj = sheetsError as Error;
      return NextResponse.json({ error: "Erro ao excluir na planilha: " + sheetsErrObj.message }, { status: 500 });
    }
  }
}
