import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import {
  invalidateRankingCache,
  clearAllPortalCaches,
  getAlunosAtivosSnapshot,
  loadFirestoreCacheAtividades,
  refreshFirestoreCacheAtividades,
  invalidateTutorAtividadesCache
} from "@/src/lib/cache";
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
    const body = await req.json();
    const filtroTurma = body.filtroTurma || "Todas";
    const filtroModulo = body.filtroModulo || "Todos";
    let filtroAtividadesIds: string[] = [];
    if (body.filtroAtividadesIds) {
      filtroAtividadesIds = Array.isArray(body.filtroAtividadesIds) ? body.filtroAtividadesIds : [body.filtroAtividadesIds];
    }
    if (body.filtroAtividade) {
      filtroAtividadesIds.push(String(body.filtroAtividade));
    }

    // 1. Setup Google API (Usando as credenciais OAuth do Tutor)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Variáveis GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN ausentes no .env.local");
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const classroom = google.classroom({ version: "v1", auth });

    // 2. Buscar Dados Estruturais via Cache Particionado (Zero varredura da coleção atividades)
    const [cachedAtividades, snapAlunos, modulosSnap] = await Promise.all([
      loadFirestoreCacheAtividades(dbAdmin),
      getAlunosAtivosSnapshot(dbAdmin),
      dbAdmin.collection("modulos").get()
    ]);

    const atividadesLista: Array<{
      idDoc: string;
      linkClassroom?: string;
      turmaAlvo?: string;
      modulo?: string;
      xp?: number;
      dataLimite?: string;
      gabaritoLiberado?: string | boolean;
      statusPublicacao?: string;
    }> = cachedAtividades?.atividades
      ? cachedAtividades.atividades.map(a => ({ idDoc: String(a.id), ...a }))
      : (await dbAdmin.collection("atividades").get()).docs.map(doc => ({
          idDoc: doc.id,
          ...(doc.data() as {
            linkClassroom?: string;
            turmaAlvo?: string;
            modulo?: string;
            xp?: number;
            dataLimite?: string;
            gabaritoLiberado?: string | boolean;
            statusPublicacao?: string;
          })
        }));

    // Mapeamentos em memória
    const mapaModulos: Record<string, string> = {};
    modulosSnap.forEach(doc => {
      const m = doc.data();
      const nome = normalizar(String(m.nomeMod || ""));
      const turma = normalizar(String(m.turmaMod || ""));
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
    interface AtividadeSyncItem {
      idDoc: string;
      linkClassroom?: string;
      turmaAlvo?: string;
      modulo?: string;
      xp?: number;
      dataLimite?: string;
      gabaritoLiberado?: string | boolean;
      statusPublicacao?: string;
      courseId: string;
      courseWorkId: string;
      statusModulo: string;
    }

    const candidatosIniciais: AtividadeSyncItem[] = [];
    const uniqueCourseIds = new Set<string>();

    atividadesLista.forEach(ativ => {
      const link = String(ativ.linkClassroom || "").trim();
      const turmaAlvo = String(ativ.turmaAlvo || "Todas");
      const nomeModulo = String(ativ.modulo || "Geral");

      if (!link.includes("classroom.google.com")) return;
      if (filtroAtividadesIds.length > 0 && !filtroAtividadesIds.includes(ativ.idDoc)) return;
      if (filtroTurma !== "Todas" && turmaAlvo !== "Todas" && turmaAlvo !== filtroTurma) return;
      if (filtroModulo !== "Todos" && nomeModulo !== filtroModulo) return;

      const moduloNorm = normalizar(nomeModulo);
      const turmaAlvoNorm = normalizar(turmaAlvo);
      const statusModulo = mapaModulos[`${moduloNorm}_${turmaAlvoNorm}`] || mapaModulos[moduloNorm] || "aberto";
      if (statusModulo === "em breve" || statusModulo === "encerrado") return;

      const match = link.match(/\/c\/([^\/\?]+)\/(?:a|sa|q|mc)\/([^\/\?]+)/i);
      if (match && match[1] && match[2]) {
        const courseId = decodificarId(match[1]);
        const courseWorkId = decodificarId(match[2]);
        uniqueCourseIds.add(courseId);
        candidatosIniciais.push({
          ...ativ,
          courseId,
          courseWorkId,
          statusModulo
        });
      }
    });

    if (candidatosIniciais.length === 0) {
      return NextResponse.json({ status: "sucesso", mensagem: "Nenhuma atividade correspondente com link do Classroom encontrada." });
    }

    // 3. Pré-carregar em paralelo os CourseWorks PUBLICADOS e os Alunos de cada Curso no Classroom
    // Isso reduz centenas de chamadas HTTP individuais para apenas 1 chamada por turma!
    const publishedCourseWorksByCourse: Record<string, Set<string>> = {};
    const cacheAlunosCurso: Record<string, Record<string, { email: string; nomeNorm: string }>> = {};

    await Promise.all(
      Array.from(uniqueCourseIds).map(async (courseId) => {
        publishedCourseWorksByCourse[courseId] = new Set<string>();
        cacheAlunosCurso[courseId] = {};

        // A) Buscar todos os courseWorks PUBLICADOS do curso em lote
        const fetchPublishedPromise = (async () => {
          try {
            let cwToken: string | undefined = undefined;
            do {
              const cwRes = (await classroom.courses.courseWork.list({
                courseId,
                courseWorkStates: ["PUBLISHED"],
                pageSize: 100,
                pageToken: cwToken
              })) as { data: { courseWork?: Array<{ id?: string }>; nextPageToken?: string } };
              (cwRes.data.courseWork || []).forEach(cw => {
                if (cw.id) publishedCourseWorksByCourse[courseId].add(String(cw.id));
              });
              cwToken = cwRes.data.nextPageToken;
            } while (cwToken);
          } catch (err: unknown) {
            console.warn("[Sincronizar AVA] Aviso ao listar courseWorks do curso", courseId, err);
          }
        })();

        // B) Buscar roster de alunos do curso em lote
        const fetchStudentsPromise = (async () => {
          try {
            let stPageToken: string | undefined = undefined;
            do {
              const stRes = (await classroom.courses.students.list({
                courseId,
                pageToken: stPageToken,
                pageSize: 500
              })) as unknown as { data: { nextPageToken?: string; students?: Array<{ userId?: string; profile?: { emailAddress?: string; name?: { fullName?: string } } }> } };
              const students = stRes.data.students || [];
              students.forEach(s => {
                if (s.userId && s.profile) {
                  const email = (s.profile.emailAddress || "").toLowerCase().trim();
                  const nome = s.profile.name?.fullName || "";
                  cacheAlunosCurso[courseId][s.userId] = { email, nomeNorm: normalizar(nome) };
                }
              });
              stPageToken = stRes.data.nextPageToken;
            } while (stPageToken);
          } catch (err: unknown) {
            console.warn("[Sincronizar AVA] Aviso ao listar alunos do curso", courseId, err);
          }
        })();

        await Promise.all([fetchPublishedPromise, fetchStudentsPromise]);
      })
    );

    // 4. Filtrar Rascunhos em O(1) e promover os que já foram publicados no Classroom
    let rascunhosPublicados = 0;
    let precisaRefreshAtividades = false;
    const logsErro: string[] = [];
    const atividadesAtivasParaBuscarEntregas: AtividadeSyncItem[] = [];

    for (const ativ of candidatosIniciais) {
      const isRascunhoNoPortal = String(ativ.statusPublicacao || "Publicada").trim() === "Rascunho";
      const isPublishedNoClassroom = publishedCourseWorksByCourse[ativ.courseId]?.has(ativ.courseWorkId);

      if (isRascunhoNoPortal) {
        if (isPublishedNoClassroom) {
          await dbAdmin.collection("atividades").doc(ativ.idDoc).set({
            statusPublicacao: "Publicada"
          }, { merge: true });
          precisaRefreshAtividades = true;
          rascunhosPublicados++;
          logsErro.push(`🚀 Atividade ${ativ.idDoc}: Publicada no Classroom -> Liberada automaticamente no Portal!`);
          atividadesAtivasParaBuscarEntregas.push(ativ);
        } else {
          // Continua em Rascunho no Classroom -> Pula em 0ms sem fazer chamada HTTP!
          continue;
        }
      } else {
        atividadesAtivasParaBuscarEntregas.push(ativ);
      }
    }

    // 5. Buscar submissões no Google Classroom (Bulk O(1) por curso via courseWorkId: "-" quando > 4 atividades)
    // Reduz 150+ chamadas HTTP individuais (~88s) para apenas 1 stream paginado por turma (~4-8s)!
    const submissionsByAtiv: Record<string, Array<{ state?: string; userId?: string; updateTime?: string }>> = {};
    atividadesAtivasParaBuscarEntregas.forEach(a => {
      submissionsByAtiv[a.idDoc] = [];
    });

    if (atividadesAtivasParaBuscarEntregas.length > 4) {
      const cwMapByCourse: Record<string, Record<string, string[]>> = {};
      atividadesAtivasParaBuscarEntregas.forEach(a => {
        if (!cwMapByCourse[a.courseId]) cwMapByCourse[a.courseId] = {};
        if (!cwMapByCourse[a.courseId][a.courseWorkId]) cwMapByCourse[a.courseId][a.courseWorkId] = [];
        cwMapByCourse[a.courseId][a.courseWorkId].push(a.idDoc);
      });

      await Promise.all(
        Object.keys(cwMapByCourse).map(async (courseId) => {
          try {
            let pageToken: string | undefined = undefined;
            do {
              const response = (await classroom.courses.courseWork.studentSubmissions.list({
                courseId,
                courseWorkId: "-",
                states: ["TURNED_IN", "RETURNED"],
                pageSize: 500,
                pageToken
              })) as unknown as {
                data: {
                  nextPageToken?: string;
                  studentSubmissions?: Array<{ courseWorkId?: string; state?: string; userId?: string; updateTime?: string }>;
                };
              };

              const subs = response.data.studentSubmissions || [];
              for (const s of subs) {
                if ((s.state === "TURNED_IN" || s.state === "RETURNED") && s.courseWorkId) {
                  const idDocs = cwMapByCourse[courseId][String(s.courseWorkId)];
                  if (idDocs) {
                    idDocs.forEach(idDoc => submissionsByAtiv[idDoc].push(s));
                  }
                }
              }
              pageToken = response.data.nextPageToken;
            } while (pageToken);
          } catch (e: unknown) {
            logsErro.push(`❌ Erro ao ler submissões em lote do curso [${courseId}]: ${(e as Error).message}`);
          }
        })
      );

      atividadesAtivasParaBuscarEntregas.forEach(ativ => {
        const qtd = submissionsByAtiv[ativ.idDoc]?.length || 0;
        if (qtd > 0) {
          logsErro.push(`✅ Atividade ${ativ.idDoc}: ${qtd} entrega(s) concluída(s) no Classroom.`);
        }
      });
    } else {
      for (const ativ of atividadesAtivasParaBuscarEntregas) {
        try {
          const listaSubs: Array<{ state?: string; userId?: string; updateTime?: string }> = [];
          let pageToken: string | undefined = undefined;
          do {
            const response = (await classroom.courses.courseWork.studentSubmissions.list({
              courseId: ativ.courseId,
              courseWorkId: ativ.courseWorkId,
              states: ["TURNED_IN", "RETURNED"],
              pageToken
            })) as unknown as { data: { nextPageToken?: string; studentSubmissions?: Array<{ state?: string; userId?: string; updateTime?: string }> } };

            const subs = response.data.studentSubmissions || [];
            for (const s of subs) {
              if (s.state === "TURNED_IN" || s.state === "RETURNED") {
                listaSubs.push(s);
              }
            }
            pageToken = response.data.nextPageToken;
          } while (pageToken);

          submissionsByAtiv[ativ.idDoc] = listaSubs;
          logsErro.push(`✅ Atividade ${ativ.idDoc}: ${listaSubs.length} entrega(s) concluída(s) no Classroom.`);
        } catch (e: unknown) {
          logsErro.push(`❌ Erro ao ler atividade [${ativ.idDoc}]: ${(e as Error).message}`);
        }
      }
    }

    // 6. Processar notas e entregas usando cache sob demanda de portal_views
    const cachePortalViews: Record<string, Record<string, { status?: string; feedback?: string }>> = {};
    let entregasNovas = 0;

    for (const ativ of atividadesAtivasParaBuscarEntregas) {
      const idAtiv = ativ.idDoc;
      const submissions = submissionsByAtiv[idAtiv] || [];
      if (submissions.length === 0) continue;

      const xpAtiv = Number(ativ.xp) || 0;
      const courseId = ativ.courseId;
      const statusModulo = ativ.statusModulo;

      let dataLimObj: Date | null = null;
      if (ativ.dataLimite) {
        const strDate = String(ativ.dataLimite).trim();
        if (strDate.includes("-")) {
          const p = strDate.split("-");
          if (p.length === 3) dataLimObj = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        } else if (strDate.includes("/")) {
          const p = strDate.split("/");
          if (p.length === 3) dataLimObj = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
        }
      }
      if (dataLimObj) dataLimObj.setHours(0, 0, 0, 0);

      for (const sub of submissions) {
        const userId = sub.userId!;
        const usr = cacheAlunosCurso[courseId]?.[userId] || { email: "", nomeNorm: "" };

        if (!usr.email && !usr.nomeNorm) {
          try {
            const prof = await classroom.userProfiles.get({ userId });
            if (prof.data && prof.data.emailAddress) usr.email = prof.data.emailAddress.toLowerCase().trim();
            if (prof.data && prof.data.name && prof.data.name.fullName) usr.nomeNorm = normalizar(prof.data.name.fullName);
            cacheAlunosCurso[courseId] = cacheAlunosCurso[courseId] || {};
            cacheAlunosCurso[courseId][userId] = usr;
          } catch (error: unknown) {
            const e = error as Error;
            logsErro.push(`⚠️ Falha ao buscar nome do aluno (ID: ${userId}): ${e.message}`);
          }
        }

        let alunoDb = mapaBuscaAluno[usr.email] || mapaBuscaAluno[usr.nomeNorm];

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
          continue;
        }

        // CQRS: Carregar portal_view do aluno sob demanda (apenas 1 vez por aluno)
        if (!cachePortalViews[alunoDb.idDoc]) {
          const viewSnap = await dbAdmin.collection("portal_views").doc(alunoDb.idDoc).get();
          if (viewSnap.exists) {
            cachePortalViews[alunoDb.idDoc] = viewSnap.data()?.entregasMap || {};
          } else {
            cachePortalViews[alunoDb.idDoc] = {};
          }
        }

        const entregasDoAluno = cachePortalViews[alunoDb.idDoc];
        const pViewEntrega = entregasDoAluno[idAtiv];

        let entregaExistente = null;
        if (pViewEntrega) {
          entregaExistente = {
            idDoc: `${idAtiv}-${alunoDb.matricula}`,
            status: pViewEntrega.status,
            feedback: pViewEntrega.feedback || ""
          };
        }

        if (
          !entregaExistente ||
          entregaExistente.status === "Aguardando Correção" ||
          entregaExistente.status === "Pendente" ||
          entregaExistente.status === "Aguardando Validação" ||
          entregaExistente.status === "Aguardando Validacao"
        ) {
          const dataEntregaAVA = sub.updateTime ? new Date(sub.updateTime) : new Date();
          const timestampRealDaEntrega = dataEntregaAVA.getTime();

          let xpGanhoFinal = xpAtiv;
          let notaAdicional = "";

          let atrasoDias = 0;
          let descontoAtraso = 0;
          let descontoTotal = 0;
          let isGabaritoLiberado = false;

          if (statusModulo === "encerrado") {
            xpGanhoFinal = 0;
            notaAdicional = " (Módulo Encerrado: 0 XP)";
          } else {
            if (dataLimObj) {
              const dataEnvioZero = new Date(dataEntregaAVA);
              dataEnvioZero.setHours(0, 0, 0, 0);
              if (dataEnvioZero > dataLimObj) {
                const diffTime = Math.abs(dataEnvioZero.getTime() - dataLimObj.getTime());
                atrasoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
            }

            if (atrasoDias > 0 && xpAtiv > 0) {
              descontoAtraso = atrasoDias;
            }

            isGabaritoLiberado = ativ.gabaritoLiberado === true || String(ativ.gabaritoLiberado).toLowerCase() === "true";
            let descontoGabarito = 0;
            if (atrasoDias > 0 && isGabaritoLiberado && xpAtiv > 0) {
              descontoGabarito = Math.floor(xpAtiv * 0.3);
            }

            descontoTotal = descontoAtraso + descontoGabarito;
            xpGanhoFinal = xpAtiv - Math.min(descontoTotal, xpAtiv);

            let matchDig = null;
            if (entregaExistente && entregaExistente.feedback) {
              matchDig = String(entregaExistente.feedback).match(/\[XP_DIGITACAO:\s*(\d+)\]/);
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
            const idUnico = `${idAtiv}-${alunoDb.matricula}`;
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

          const alunoRef = dbAdmin.collection("alunos").doc(alunoDb.idDoc);
          batch.update(alunoRef, {
            xpTotal: FieldValue.increment(xpGanhoFinal),
            xp: FieldValue.increment(xpGanhoFinal),
            lastUpdated: Date.now()
          });

          const portalViewRef = dbAdmin.collection("portal_views").doc(alunoDb.idDoc);
          batch.set(portalViewRef, {
            entregasMap: {
              [idAtiv]: {
                status: "Avaliado",
                resposta: "Entrega validada pelo AVA.",
                xpGanho: xpGanhoFinal,
                dataEnvio: timestampRealDaEntrega,
                feedback: "Sincronizado via Google Classroom" + notaAdicional + msgAviso
              }
            }
          }, { merge: true });

          const ehAtrasado = atrasoDias > 0 || isGabaritoLiberado || (descontoTotal > 0 && descontoAtraso > 0);
          const xpNormalIncr = ehAtrasado ? 0 : xpGanhoFinal;
          const xpAtrasadoIncr = ehAtrasado ? xpGanhoFinal : 0;

          const { semanaKey, mesKey } = getRankingKeys(new Date(timestampRealDaEntrega));

          const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
          batch.set(rankSemanaRef, {
            alunos: {
              [alunoDb.idDoc]: {
                xpNormal: FieldValue.increment(xpNormalIncr),
                xpAtrasado: FieldValue.increment(xpAtrasadoIncr),
                ultimoEnvio: timestampRealDaEntrega
              }
            }
          }, { merge: true });

          const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
          batch.set(rankMesRef, {
            alunos: {
              [alunoDb.idDoc]: {
                xpNormal: FieldValue.increment(xpNormalIncr),
                xpAtrasado: FieldValue.increment(xpAtrasadoIncr),
                ultimoEnvio: timestampRealDaEntrega
              }
            }
          }, { merge: true });

          const statsRef = dbAdmin.collection("estatisticas_atividades").doc(idAtiv);
          const statsResumoRef = dbAdmin.collection("cache").doc("estatisticas_atividades_resumo");
          const statsUpdates: Record<string, FieldValue> = { validadasAVA: FieldValue.increment(1) };
          if (oldCat) statsUpdates[oldCat] = FieldValue.increment(-1);
          batch.set(statsRef, statsUpdates, { merge: true });
          batch.set(statsResumoRef, { stats: { [idAtiv]: statsUpdates }, updatedAt: new Date().toISOString() }, { merge: true });

          await batch.commit();

          cachePortalViews[alunoDb.idDoc][idAtiv] = { status: "Avaliado" };
          alunoDb.xpTotal += xpGanhoFinal;
          entregasNovas++;
        } else {
          logsErro.push(`⏭️ Ignorada (Já estava ${entregaExistente.status}): ${alunoDb.nomeNorm}`);
        }
      }
    }

    if (precisaRefreshAtividades) {
      await refreshFirestoreCacheAtividades(dbAdmin);
      clearAllPortalCaches();
    }

    let mensagemFinal = "";
    if (entregasNovas > 0 || rascunhosPublicados > 0) {
      mensagemFinal = `Sincronização Perfeita! ${entregasNovas} nova(s) entrega(s) validadas pelo AVA` +
        (rascunhosPublicados > 0 ? ` e ${rascunhosPublicados} rascunho(s) publicado(s) automaticamente.` : ".");
      invalidateTutorAtividadesCache();
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
    console.error("Erro fatal na sincronização OAuth do AVA:", error);
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message || "Erro interno ao conectar no Google Classroom." }, { status: 500 });
  }
}
