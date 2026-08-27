import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { invalidateRankingCache, clearAllPortalCaches, getAlunosAtivosSnapshot } from "@/src/lib/cache";
import { google } from "googleapis";
import { FieldValue } from "firebase-admin/firestore";
import { getRankingKeys } from "@/src/lib/dateUtils";

// Normalização de nomes para busca
const normalizar = (texto: string) => String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const compararNomes = (nome1: string, nome2: string) => {
  if (!nome1 || !nome2) return false;
  const n1 = normalizar(nome1);
  const n2 = normalizar(nome2);
  if (n1 === n2) return true;
  
  if (n1.indexOf(n2) === 0 || n2.indexOf(n1) === 0) return true;
  
  const p1 = n1.split(/\s+/);
  const p2 = n2.split(/\s+/);
  if (p1.length > 0 && p2.length > 0) {
      if (p1[0] === p2[0]) {
          for (let i = 1; i < p1.length; i++) {
              if (p1[i].length > 2 && p2.indexOf(p1[i]) !== -1) {
                  return true;
              }
          }
      }
  }
  return false;
};

const decodificarId = (idUrl: string) => {
  try {
    const decodificado = Buffer.from(idUrl, "base64").toString("utf8");
    if (/^\d+$/.test(decodificado)) return decodificado;
  } catch { }
  return idUrl;
};

export async function POST(req: Request) {
  try {
    // Autenticação básica via cookies para garantir que é um tutor (Opcional, mas recomendado)
    // const cookies = req.headers.get("cookie"); // etc...

    const body = await req.json();
    const filtroTurma = body.filtroTurma || "Todas";
    const filtroModulo = body.filtroModulo || "Todos";
    const filtroAtividadesIds: string[] = body.filtroAtividadesIds || [];

    // 1. Setup Google API (Usando as credenciais OAuth do Tutor)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Variáveis GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN ausentes no .env.local");
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const classroom = google.classroom({ version: 'v1', auth });

    // 2. Buscar Dados Estruturais do Firestore
    const [atividadesSnap, snapAlunos, modulosSnap] = await Promise.all([
      dbAdmin.collection("atividades").get(),
      getAlunosAtivosSnapshot(dbAdmin),
      dbAdmin.collection("modulos").get()
    ]);

    // Mapeamentos em memória
    const mapaModulos: Record<string, string> = {};
    modulosSnap.forEach(doc => {
      const m = doc.data();
      const nome = String(m.nomeMod || "").trim().toLowerCase();
      const turma = String(m.turmaMod || "").trim().toLowerCase();
      mapaModulos[`${nome}_${turma}`] = String(m.statusMod).toLowerCase();
      mapaModulos[nome] = String(m.statusMod).toLowerCase();
    });

    const listaAlunos: Array<{ idDoc: string; xpTotal: number; nomeNorm: string; email?: string; nome?: string; matricula?: string; turma?: string; turmaTrilha?: string }> = [];
    const mapaBuscaAluno: Record<string, { idDoc: string; xpTotal: number; nomeNorm: string; email?: string; nome?: string; matricula?: string; turma?: string; turmaTrilha?: string }> = {};
    
    if (snapAlunos && Array.isArray(snapAlunos)) {
      snapAlunos.forEach(a => {
        const obj = { idDoc: String(a.matricula), ...a, xpTotal: Number(a.xpTotal) || 0, nomeNorm: normalizar(String(a.nome)) };
        if (a.email) mapaBuscaAluno[String(a.email).toLowerCase()] = obj;
        if (a.nome) mapaBuscaAluno[normalizar(String(a.nome))] = obj;
        if (a.matricula) mapaBuscaAluno[String(a.matricula).trim()] = obj;
        listaAlunos.push(obj);
      });
    } else {
      const fallbackSnap = await dbAdmin.collection("alunos").get();
      fallbackSnap.forEach(doc => {
        const a = doc.data();
        const obj = { idDoc: doc.id, ...a, xpTotal: Number(a.xpTotal) || 0, nomeNorm: normalizar(a.nome) };
        if (a.email) mapaBuscaAluno[a.email.toLowerCase()] = obj;
        if (a.nome) mapaBuscaAluno[normalizar(a.nome)] = obj;
        if (a.matricula) mapaBuscaAluno[a.matricula.trim()] = obj;
        listaAlunos.push(obj);
      });
    }

    // Filtra Atividades do Classroom
    const atividadesParaSincronizar: Array<{ idDoc: string; linkClassroom?: string; turmaAlvo?: string; modulo?: string; xp?: number; dataLimite?: string; gabaritoLiberado?: string | boolean }> = [];
    atividadesSnap.forEach(doc => {
      const ativ = { idDoc: doc.id, ...(doc.data() as { linkClassroom?: string; turmaAlvo?: string; modulo?: string; xp?: number; dataLimite?: string; gabaritoLiberado?: string | boolean }) };
      const link = String(ativ.linkClassroom || "").trim();
      const turmaAlvo = String(ativ.turmaAlvo || "Todas");
      const nomeModulo = String(ativ.modulo || "Geral");

      if (!link.includes("classroom.google.com")) return;
      if (filtroAtividadesIds.length > 0 && !filtroAtividadesIds.includes(ativ.idDoc)) return;
      if (filtroTurma !== "Todas" && turmaAlvo !== "Todas" && turmaAlvo !== filtroTurma) return;
      if (filtroModulo !== "Todos" && nomeModulo !== filtroModulo) return;

      // Proteção extra: ignora módulos encerrados ou em breve já na filtragem
      const moduloNorm = nomeModulo.toLowerCase();
      const turmaAlvoNorm = turmaAlvo.toLowerCase();
      const statusModulo = mapaModulos[`${moduloNorm}_${turmaAlvoNorm}`] || mapaModulos[moduloNorm] || "aberto";
      if (statusModulo === "em breve" || statusModulo === "encerrado") return;

      atividadesParaSincronizar.push(ativ);
    });

    // 3. Buscar Entregas APENAS das atividades mapeadas (Chunks de 30)
    const mapaEntregas: Record<string, { idDoc?: string, status?: string }> = {};
    
    if (atividadesParaSincronizar.length > 0) {
      const idsAtividades = atividadesParaSincronizar.map(a => a.idDoc);
      const chunks = [];
      for (let i = 0; i < idsAtividades.length; i += 30) {
        chunks.push(idsAtividades.slice(i, i + 30));
      }

      const entregasSnaps = await Promise.all(
        chunks.map(chunk => dbAdmin.collection("entregas").where("idAtividade", "in", chunk).get())
      );

      entregasSnaps.forEach(snap => {
        snap.forEach(doc => {
          const e = doc.data();
          mapaEntregas[`${e.matricula}_${e.idAtividade}`] = { idDoc: doc.id, status: e.status };
        });
      });
    }

    if (atividadesParaSincronizar.length === 0) {
      return NextResponse.json({ status: "sucesso", mensagem: "Nenhuma atividade correspondente com link do Classroom encontrada." });
    }

    let entregasNovas = 0;
    const logsErro: string[] = [];
    const cacheAlunosCurso: Record<string, Record<string, { email: string, nomeNorm: string }>> = {};

    for (const ativ of atividadesParaSincronizar) {
      const idAtiv = ativ.idDoc;
      const xpAtiv = Number(ativ.xp) || 0;
      const link = ativ.linkClassroom;
      const turmaAlvoNorm = String(ativ.turmaAlvo || "").trim().toLowerCase();
      const moduloNorm = String(ativ.modulo || "").trim().toLowerCase();
      const statusModulo = mapaModulos[`${moduloNorm}_${turmaAlvoNorm}`] || mapaModulos[moduloNorm] || "aberto";

      if (statusModulo === "em breve" || statusModulo === "encerrado") continue;

      let dataLimObj: Date | null = null;
      if (ativ.dataLimite) {
         const strDate = String(ativ.dataLimite).trim();
         if (strDate.includes("-")) {
            const p = strDate.split("-");
            if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
         } else if (strDate.includes("/")) {
            const p = strDate.split("/");
            if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
         }
      }
      if (dataLimObj) dataLimObj.setHours(0,0,0,0);

      const match = (link || "").match(/\/c\/([^\/\?]+)\/(?:a|sa|q|mc)\/([^\/\?]+)/i);
      if (match && match[1] && match[2]) {
        const courseId = decodificarId(match[1]);
        const courseWorkId = decodificarId(match[2]);

        try {
          let pageToken: string | null | undefined = undefined;
          do {
            const response: { data: { nextPageToken?: string; studentSubmissions?: Array<{ state?: string; userId?: string; updateTime?: string }> } } = (await classroom.courses.courseWork.studentSubmissions.list({
              courseId,
              courseWorkId,
              pageToken: pageToken || undefined,
            })) as unknown as { data: { nextPageToken?: string; studentSubmissions?: Array<{ state?: string; userId?: string; updateTime?: string }> } };

            const submissions = response.data.studentSubmissions || [];
            logsErro.push(`✅ Atividade ${idAtiv}: ${submissions.length} entregas totais encontradas no Classroom.`);
            
            for (const sub of submissions) {
              if (sub.state === "TURNED_IN" || sub.state === "RETURNED") {
                 const userId = sub.userId!;
                 
                 // Resolver Usuário via API (Mock local se n tiver cache)
                 if (!cacheAlunosCurso[courseId]) {
                    cacheAlunosCurso[courseId] = {};
                    try {
                        let stPageToken: string | null | undefined = undefined;
                        do {
                            const stRes: { data: { nextPageToken?: string; students?: Array<{ userId?: string; profile?: { emailAddress?: string; name?: { fullName?: string } } }> } } = (await classroom.courses.students.list({ courseId, pageToken: stPageToken || undefined, pageSize: 500 })) as unknown as { data: { nextPageToken?: string; students?: Array<{ userId?: string; profile?: { emailAddress?: string; name?: { fullName?: string } } }> } };
                            const students = stRes.data.students || [];
                            students.forEach((s: { userId?: string; profile?: { emailAddress?: string; name?: { fullName?: string } } }) => {
                                if (s.userId && s.profile) {
                                    const email = (s.profile.emailAddress || "").toLowerCase().trim();
                                    const nome = s.profile.name?.fullName || "";
                                    cacheAlunosCurso[courseId][s.userId] = { email, nomeNorm: normalizar(nome) };
                                }
                            });
                            stPageToken = stRes.data.nextPageToken;
                        } while(stPageToken);
                    } catch(e) {
                        console.error("Erro listando alunos do curso", courseId, e);
                    }
                 }

                 const usr = cacheAlunosCurso[courseId][userId] || { email: "", nomeNorm: "" };

                 // Fallback: se não tiver e-mail ou nome (provavelmente falha de listagem de roster)
                 if (!usr.email && !usr.nomeNorm) {
                     try {
                         const prof = await classroom.userProfiles.get({ userId });
                         if (prof.data && prof.data.emailAddress) usr.email = prof.data.emailAddress.toLowerCase().trim();
                         if (prof.data && prof.data.name && prof.data.name.fullName) usr.nomeNorm = normalizar(prof.data.name.fullName);
                         cacheAlunosCurso[courseId] = cacheAlunosCurso[courseId] || {};
                         cacheAlunosCurso[courseId][userId] = usr; // atualiza cache local
                     } catch(error: unknown) {
                         const e = error as Error;
                         logsErro.push(`⚠️ Falha ao buscar nome do aluno (ID: ${userId}): ${e.message}`);
                     }
                 }

                 let alunoDb = mapaBuscaAluno[usr.email] || mapaBuscaAluno[usr.nomeNorm];

                 // Fallback Busca Parcial
                 if (!alunoDb && usr.nomeNorm) {
                     for (const al of listaAlunos) {
                         if (compararNomes(al.nomeNorm, usr.nomeNorm)) {
                             alunoDb = al;
                             break;
                         }
                     }
                 }

                 if (!alunoDb) {
                     logsErro.push(`⚠️ Aluno não cadastrado ou não encontrado no banco (Email: ${usr.email}, Nome: ${usr.nomeNorm})`);
                 }

                 if (alunoDb) {
                     const chaveEntrega = `${alunoDb.matricula}_${idAtiv}`;
                     const entregaExistente = mapaEntregas[chaveEntrega];

                     if (!entregaExistente || 
                         entregaExistente.status === "Aguardando Correção" || 
                         entregaExistente.status === "Pendente" || 
                         entregaExistente.status === "Aguardando Validação" ||
                         entregaExistente.status === "Aguardando Validacao") {
                         
                         const dataEntregaAVA = sub.updateTime ? new Date(sub.updateTime) : new Date();
                         const timestampRealDaEntrega = dataEntregaAVA.getTime();

                         let xpGanhoFinal = xpAtiv;
                         let notaAdicional = "";

                         if (statusModulo === "encerrado") {
                             xpGanhoFinal = 0;
                             notaAdicional = " (Módulo Encerrado: 0 XP)";
                         } else {
                             let atrasoDias = 0;
                             if (dataLimObj) {
                                 const dataEnvioZero = new Date(dataEntregaAVA);
                                 dataEnvioZero.setHours(0,0,0,0);
                                 if (dataEnvioZero > dataLimObj) {
                                     const diffTime = Math.abs(dataEnvioZero.getTime() - dataLimObj.getTime());
                                     atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                 }
                             }

                             let descontoAtraso = 0;
                             if (atrasoDias > 0 && xpAtiv > 0) {
                                 const teto = Math.floor(xpAtiv / 2);
                                 descontoAtraso = atrasoDias > teto ? teto : atrasoDias;
                             }

                             const isGabaritoLiberado = ativ.gabaritoLiberado === true || String(ativ.gabaritoLiberado).toLowerCase() === "true";
                             let descontoGabarito = 0;
                             if (atrasoDias > 0 && isGabaritoLiberado && xpAtiv > 0) {
                                 descontoGabarito = Math.floor(xpAtiv * 0.3);
                             }

                             const descontoTotal = descontoAtraso + descontoGabarito;
                             xpGanhoFinal = xpAtiv - Math.min(descontoTotal, xpAtiv);

                             // Para digitação
                             let matchDig = null;
                             if (entregaExistente && entregaExistente.idDoc) {
                                 const docSnap = await dbAdmin.collection("entregas").doc(String(entregaExistente.idDoc)).get();
                                 const feedbackExistente = docSnap.exists ? String(docSnap.data()?.feedback || "") : "";
                                 matchDig = feedbackExistente.match(/\[XP_DIGITACAO:\s*(\d+)\]/);
                             }

                             if (matchDig) {
                                 xpGanhoFinal = parseInt(matchDig[1], 10) - Math.min(descontoTotal, parseInt(matchDig[1], 10));
                             }

                             const piso = Math.ceil(xpAtiv * 0.1);
                             if (xpGanhoFinal < piso && xpAtiv > 0) xpGanhoFinal = piso;

                             if (descontoTotal > 0) {
                                 const msgs = [];
                                 if (descontoAtraso > 0) msgs.push(`-${descontoAtraso}XP por Atraso`);
                                 if (descontoGabarito > 0) msgs.push(`-30% por Gabarito Liberado`);
                                 notaAdicional = ` (${msgs.join(", ")})`;
                             }
                         }

                         const batch = dbAdmin.batch();
                         const msgAviso = "\n[🤖 AVA: Nota sincronizada automaticamente]";
                         let oldCat: string | null = null;

                         if (entregaExistente) {
                            if (entregaExistente.status === "Aguardando Correção") oldCat = "pendentes";
                            else if (entregaExistente.status === "Aguardando Validação" || entregaExistente.status === "Aguardando Validacao") oldCat = "aguardandoValidacao";

                            const docRef = dbAdmin.collection("entregas").doc(String(entregaExistente.idDoc));
                            batch.update(docRef, {
                                status: "Avaliado",
                                xpGanho: xpGanhoFinal,
                                timestamp: timestampRealDaEntrega,
                            });
                         } else {
                            const idUnico = `SYNC-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                            const docRef = dbAdmin.collection("entregas").doc(idUnico);
                            batch.set(docRef, {
                                matricula: alunoDb.matricula,
                                idAtividade: idAtiv,
                                resposta: "Entrega validada pelo AVA.",
                                status: "Avaliado",
                                xpGanho: xpGanhoFinal,
                                timestamp: timestampRealDaEntrega,
                                feedback: "Sincronizado via Google Classroom" + notaAdicional + msgAviso
                            });
                         }

                         // Atualizar XP do aluno
                         const alunoRef = dbAdmin.collection("alunos").doc(alunoDb.idDoc);
                         batch.update(alunoRef, {
                             xpTotal: (alunoDb.xpTotal || 0) + xpGanhoFinal,
                             xp: FieldValue.increment(xpGanhoFinal),
                             lastUpdated: Date.now()
                         });

                         // CQRS: Atualizar portal_views
                         const portalViewRef = dbAdmin.collection("portal_views").doc(alunoDb.idDoc);
                         batch.set(portalViewRef, {
                             [`entregasMap.${idAtiv}`]: {
                                 status: "Avaliado",
                                 resposta: "Entrega validada pelo AVA.",
                                 xpGanho: xpGanhoFinal,
                                 dataEnvio: timestampRealDaEntrega,
                                 feedback: "Sincronizado via Google Classroom" + notaAdicional + msgAviso
                             }
                         }, { merge: true });

                         // CQRS: Atualizar Ranking Semanal e Mensal
                         if (xpGanhoFinal > 0) {
                             const { semanaKey, mesKey } = getRankingKeys(new Date(timestampRealDaEntrega));

                             const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
                             batch.set(rankSemanaRef, {
                                 alunos: {
                                     [alunoDb.idDoc]: {
                                         xpNormal: FieldValue.increment(xpGanhoFinal),
                                         xpAtrasado: FieldValue.increment(0),
                                         ultimoEnvio: timestampRealDaEntrega
                                     }
                                 }
                             }, { merge: true });

                             const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
                             batch.set(rankMesRef, {
                                 alunos: {
                                     [alunoDb.idDoc]: {
                                         xpNormal: FieldValue.increment(xpGanhoFinal),
                                         xpAtrasado: FieldValue.increment(0),
                                         ultimoEnvio: timestampRealDaEntrega
                                     }
                                 }
                             }, { merge: true });
                         }

                         const statsRef = dbAdmin.collection("estatisticas_atividades").doc(idAtiv);
                         const statsUpdates: Record<string, FieldValue> = { validadasAVA: FieldValue.increment(1) };
                         if (oldCat) statsUpdates[oldCat] = FieldValue.increment(-1);
                         batch.set(statsRef, statsUpdates, { merge: true });

                         await batch.commit();

                         // Atualizar cache em memória para próximas iterações n resincronizarem errado
                         mapaEntregas[chaveEntrega] = { status: "Avaliado" };
                         alunoDb.xpTotal += xpGanhoFinal;
                         entregasNovas++;
                     } else {
                         logsErro.push(`⏭️ Ignorada (Já estava ${entregaExistente.status}): ${alunoDb.nomeNorm}`);
                     }
                 }
              }
            }
            pageToken = response.data.nextPageToken;
          } while(pageToken);

        } catch(e: unknown) {
           logsErro.push(`❌ Erro ao ler atividade [${idAtiv}]: ${(e as Error).message}`);
        }
      }
    }

    let mensagemFinal = "";
    if (entregasNovas > 0) {
        mensagemFinal = `Sincronização Perfeita! ${entregasNovas} nova(s) entrega(s) validadas e pontuadas pelo AVA.`;
        // Limpar caches para forçar a tela do ranking a atualizar imediatamente
        invalidateRankingCache();
        clearAllPortalCaches();
    } else {
        mensagemFinal = `Sincronização concluída. Nenhuma nova nota importada do AVA.`;
    }

    if (logsErro.length > 0) {
        mensagemFinal += `\n\n📋 Relatório de Validação e Ignorados:\n` + logsErro.join("\n");
    }

    return NextResponse.json({ status: "sucesso", mensagem: mensagemFinal });
  } catch (error: unknown) {
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message }, { status: 500 });
  }
}
