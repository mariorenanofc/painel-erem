import { dbAdmin } from "@/src/lib/firebaseAdmin";
import {
  loadFirestoreCacheAtividades,
  refreshFirestoreCacheAtividades,
  getAlunosAtivosSnapshot,
  invalidateTutorAtividadesCache,
  invalidateRankingCache,
  clearAllPortalCaches,
  loadRegrasCiclos,
  DEFAULT_REGRAS_GAMIFICACAO,
} from "@/src/lib/cache";
import { google } from "googleapis";
import { FieldValue } from "firebase-admin/firestore";
import { getRankingKeys } from "@/src/lib/dateUtils";

// Normalização de nomes para busca
const normalizar = (texto: string) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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
  } catch {}
  return idUrl;
};

interface SincronizacaoResultado {
  status: "sucesso" | "erro";
  mensagem: string;
  entregasNovas: number;
  rascunhosPublicados: number;
}

/**
 * Função utilitária central de sincronização do Google Classroom.
 * Usada tanto pela rota HTTP /api/tutor/sincronizar-ava quanto diretamente
 * pela automação de fechamento de ciclos (auto-sync prévio).
 */
export async function sincronizarAvaDireto(filtros?: {
  filtroTurma?: string;
  filtroModulo?: string;
  filtroAtividadesIds?: string[];
}): Promise<SincronizacaoResultado> {
  const filtroTurma = filtros?.filtroTurma || "Todas";
  const filtroModulo = filtros?.filtroModulo || "Todos";
  const filtroAtividadesIds = filtros?.filtroAtividadesIds || [];

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Variáveis Google OAuth ausentes no ambiente do servidor.");
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  const classroom = google.classroom({ version: "v1", auth });

  // 1. Carregar Atividades, Alunos, Módulos e Regras de Gamificação
  const [cachedAtividades, snapAlunos, modulosSnap, regrasConfig] = await Promise.all([
    loadFirestoreCacheAtividades(dbAdmin),
    getAlunosAtivosSnapshot(dbAdmin),
    dbAdmin.collection("modulos").get(),
    loadRegrasCiclos(dbAdmin),
  ]);

  const gamificacao = regrasConfig.gamificacao || DEFAULT_REGRAS_GAMIFICACAO;

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
    ? cachedAtividades.atividades.map((a) => ({ idDoc: String(a.id), ...a }))
    : (await dbAdmin.collection("atividades").get()).docs.map((doc) => ({
        idDoc: doc.id,
        ...(doc.data() as {
          linkClassroom?: string;
          turmaAlvo?: string;
          modulo?: string;
          xp?: number;
          dataLimite?: string;
          gabaritoLiberado?: string | boolean;
          statusPublicacao?: string;
        }),
      }));

  const mapaModulos: Record<string, string> = {};
  modulosSnap.forEach((doc) => {
    const m = doc.data();
    const nome = normalizar(String(m.nomeMod || ""));
    const turma = normalizar(String(m.turmaMod || ""));
    mapaModulos[`${nome}_${turma}`] = String(m.statusMod).toLowerCase();
    mapaModulos[nome] = String(m.statusMod).toLowerCase();
  });

  const listaAlunos: Array<{
    idDoc: string;
    xpTotal: number;
    nomeNorm: string;
    email?: string;
    nome?: string;
    matricula?: string;
    turma?: string;
    turmaTrilha?: string;
  }> = [];
  const mapaBuscaAluno: Record<string, (typeof listaAlunos)[0]> = {};

  if (snapAlunos && Array.isArray(snapAlunos)) {
    snapAlunos.forEach((a) => {
      const obj = {
        idDoc: String(a.matricula),
        ...a,
        xpTotal: Number(a.xpTotal) || 0,
        nomeNorm: normalizar(String(a.nome)),
      };
      if (a.email) mapaBuscaAluno[String(a.email).toLowerCase()] = obj;
      if (a.nome) mapaBuscaAluno[normalizar(String(a.nome))] = obj;
      if (a.matricula) mapaBuscaAluno[String(a.matricula).trim()] = obj;
      listaAlunos.push(obj);
    });
  }

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

  atividadesLista.forEach((ativ) => {
    const link = String(ativ.linkClassroom || "").trim();
    const turmaAlvo = String(ativ.turmaAlvo || "Todas");
    const nomeModulo = String(ativ.modulo || "Geral");

    if (!link.includes("classroom.google.com")) return;
    if (filtroAtividadesIds.length > 0 && !filtroAtividadesIds.includes(ativ.idDoc)) return;
    if (filtroTurma !== "Todas" && turmaAlvo !== "Todas" && turmaAlvo !== filtroTurma) return;
    if (filtroModulo !== "Todos" && nomeModulo !== filtroModulo) return;

    const moduloNorm = normalizar(nomeModulo);
    const turmaAlvoNorm = normalizar(turmaAlvo);
    const statusModulo =
      mapaModulos[`${moduloNorm}_${turmaAlvoNorm}`] || mapaModulos[moduloNorm] || "aberto";
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
        statusModulo,
      });
    }
  });

  if (candidatosIniciais.length === 0) {
    return {
      status: "sucesso",
      mensagem: "Nenhuma atividade vinculada ao Classroom encontrada.",
      entregasNovas: 0,
      rascunhosPublicados: 0,
    };
  }

  // 2. Pré-carregar CourseWorks publicados e Alunos do Classroom
  const publishedCourseWorksByCourse: Record<string, Set<string>> = {};
  const cacheAlunosCurso: Record<string, Record<string, { email: string; nomeNorm: string }>> = {};

  await Promise.all(
    Array.from(uniqueCourseIds).map(async (courseId) => {
      publishedCourseWorksByCourse[courseId] = new Set<string>();
      cacheAlunosCurso[courseId] = {};

      const fetchPublishedPromise = (async () => {
        try {
          let cwToken: string | undefined = undefined;
          do {
            const cwRes = (await classroom.courses.courseWork.list({
              courseId,
              courseWorkStates: ["PUBLISHED"],
              pageSize: 100,
              pageToken: cwToken,
            })) as { data: { courseWork?: Array<{ id?: string }>; nextPageToken?: string } };
            (cwRes.data.courseWork || []).forEach((cw) => {
              if (cw.id) publishedCourseWorksByCourse[courseId].add(String(cw.id));
            });
            cwToken = cwRes.data.nextPageToken;
          } while (cwToken);
        } catch (err: unknown) {
          console.warn("[Auto-Sync AVA] Erro ao listar courseWorks do curso", courseId, err);
        }
      })();

      const fetchStudentsPromise = (async () => {
        try {
          let stPageToken: string | undefined = undefined;
          do {
            const stRes = (await classroom.courses.students.list({
              courseId,
              pageToken: stPageToken,
              pageSize: 500,
            })) as unknown as {
              data: {
                nextPageToken?: string;
                students?: Array<{
                  userId?: string;
                  profile?: { emailAddress?: string; name?: { fullName?: string } };
                }>;
              };
            };
            const students = stRes.data.students || [];
            students.forEach((s) => {
              if (s.userId && s.profile) {
                const email = (s.profile.emailAddress || "").toLowerCase().trim();
                const nome = s.profile.name?.fullName || "";
                cacheAlunosCurso[courseId][s.userId] = { email, nomeNorm: normalizar(nome) };
              }
            });
            stPageToken = stRes.data.nextPageToken;
          } while (stPageToken);
        } catch (err: unknown) {
          console.warn("[Auto-Sync AVA] Erro ao listar alunos do curso", courseId, err);
        }
      })();

      await Promise.all([fetchPublishedPromise, fetchStudentsPromise]);
    })
  );

  // 3. Filtrar e promover rascunhos publicados no Classroom
  let rascunhosPublicados = 0;
  let precisaRefreshAtividades = false;
  const atividadesAtivasParaBuscarEntregas: AtividadeSyncItem[] = [];

  for (const ativ of candidatosIniciais) {
    const isRascunhoNoPortal = String(ativ.statusPublicacao || "Publicada").trim() === "Rascunho";
    const isPublishedNoClassroom = publishedCourseWorksByCourse[ativ.courseId]?.has(
      ativ.courseWorkId
    );

    if (isRascunhoNoPortal) {
      if (isPublishedNoClassroom) {
        await dbAdmin.collection("atividades").doc(ativ.idDoc).set(
          { statusPublicacao: "Publicada" },
          { merge: true }
        );
        precisaRefreshAtividades = true;
        rascunhosPublicados++;
        atividadesAtivasParaBuscarEntregas.push(ativ);
      }
    } else {
      atividadesAtivasParaBuscarEntregas.push(ativ);
    }
  }

  // 4. Buscar Submissões de Alunos
  const submissionsByAtiv: Record<
    string,
    Array<{ state?: string; userId?: string; updateTime?: string }>
  > = {};
  atividadesAtivasParaBuscarEntregas.forEach((a) => {
    submissionsByAtiv[a.idDoc] = [];
  });

  if (atividadesAtivasParaBuscarEntregas.length > 4) {
    const cwMapByCourse: Record<string, Record<string, string[]>> = {};
    atividadesAtivasParaBuscarEntregas.forEach((a) => {
      if (!cwMapByCourse[a.courseId]) cwMapByCourse[a.courseId] = {};
      if (!cwMapByCourse[a.courseId][a.courseWorkId])
        cwMapByCourse[a.courseId][a.courseWorkId] = [];
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
              pageSize: 100,
              pageToken,
            })) as {
              data: {
                studentSubmissions?: Array<{
                  courseWorkId?: string;
                  state?: string;
                  userId?: string;
                  updateTime?: string;
                }>;
                nextPageToken?: string;
              };
            };

            const lista = response.data.studentSubmissions || [];
            for (const s of lista) {
              const ativDocs = cwMapByCourse[courseId][s.courseWorkId!] || [];
              for (const aDoc of ativDocs) {
                submissionsByAtiv[aDoc].push(s);
              }
            }
            pageToken = response.data.nextPageToken;
          } while (pageToken);
        } catch (err: unknown) {
          console.warn("[Auto-Sync AVA] Erro ao buscar submissões em lote do curso", courseId, err);
        }
      })
    );
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
            pageSize: 100,
            pageToken,
          })) as {
            data: {
              studentSubmissions?: Array<{
                state?: string;
                userId?: string;
                updateTime?: string;
              }>;
              nextPageToken?: string;
            };
          };

          const subs = response.data.studentSubmissions || [];
          listaSubs.push(...subs);
          pageToken = response.data.nextPageToken;
        } while (pageToken);

        submissionsByAtiv[ativ.idDoc] = listaSubs;
      } catch (err: unknown) {
        console.warn("[Auto-Sync AVA] Erro ao buscar submissões de atividade", ativ.idDoc, err);
      }
    }
  }

  // 5. Processar Notas e Atualizar Rankings de Ciclos
  const cachePortalViews: Record<string, Record<string, { status?: string; feedback?: string }>> =
    {};
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

      let alunoDb = mapaBuscaAluno[usr.email] || mapaBuscaAluno[usr.nomeNorm];
      if (!alunoDb && usr.nomeNorm) {
        for (const al of listaAlunos) {
          if (compararNomes(al.nomeNorm, usr.nomeNorm)) {
            alunoDb = al;
            break;
          }
        }
      }

      if (!alunoDb) continue;

      if (!cachePortalViews[alunoDb.idDoc]) {
        const viewSnap = await dbAdmin.collection("portal_views").doc(alunoDb.idDoc).get();
        cachePortalViews[alunoDb.idDoc] = viewSnap.exists
          ? viewSnap.data()?.entregasMap || {}
          : {};
      }

      const entregasDoAluno = cachePortalViews[alunoDb.idDoc];
      const pViewEntrega = entregasDoAluno[idAtiv];

      let entregaExistente = null;
      if (pViewEntrega) {
        entregaExistente = {
          idDoc: `${idAtiv}-${alunoDb.matricula}`,
          status: pViewEntrega.status,
          feedback: pViewEntrega.feedback || "",
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
        const isGabaritoLiberado =
          ativ.gabaritoLiberado === true ||
          String(ativ.gabaritoLiberado).toLowerCase() === "true";

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

          if (gamificacao.descontoAtrasoAtivo && atrasoDias > 0 && xpAtiv > 0) {
            descontoAtraso = atrasoDias * (gamificacao.xpDescontoPorDia ?? 1);
          }

          let descontoGabarito = 0;
          if (gamificacao.descontoGabaritoAtivo && atrasoDias > 0 && isGabaritoLiberado && xpAtiv > 0) {
            const percGabarito = (gamificacao.percentualDescontoGabarito ?? 30) / 100;
            descontoGabarito = Math.floor(xpAtiv * percGabarito);
          }

          descontoTotal = descontoAtraso + descontoGabarito;
          xpGanhoFinal = xpAtiv - Math.min(descontoTotal, xpAtiv);

          if (gamificacao.pisoMinimoAtivo && xpAtiv > 0) {
            const percPiso = (gamificacao.percentualPisoMinimo ?? 10) / 100;
            const piso = Math.ceil(xpAtiv * percPiso);
            if (xpGanhoFinal < piso) xpGanhoFinal = piso;
          }

          if (descontoTotal > 0) {
            const msgs = [];
            if (descontoAtraso > 0) msgs.push(`-${descontoAtraso}XP por Atraso`);
            if (descontoGabarito > 0) msgs.push(`-${gamificacao.percentualDescontoGabarito}% por Gabarito Liberado`);
            notaAdicional = ` (${msgs.join(", ")})`;
          }
        }

        const batch = dbAdmin.batch();
        const msgAviso = "\n[🤖 AVA: Sincronização automática]";

        if (entregaExistente) {
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
            feedback: "Sincronizado via Google Classroom" + notaAdicional + msgAviso,
          });
        }

        const alunoRef = dbAdmin.collection("alunos").doc(alunoDb.idDoc);
        batch.update(alunoRef, {
          xpTotal: FieldValue.increment(xpGanhoFinal),
          xp: FieldValue.increment(xpGanhoFinal),
          lastUpdated: Date.now(),
        });

        const portalViewRef = dbAdmin.collection("portal_views").doc(alunoDb.idDoc);
        batch.set(
          portalViewRef,
          {
            entregasMap: {
              [idAtiv]: {
                status: "Avaliado",
                resposta: "Entrega validada pelo AVA.",
                xpGanho: xpGanhoFinal,
                dataEnvio: timestampRealDaEntrega,
                feedback: "Sincronizado via Google Classroom" + notaAdicional + msgAviso,
              },
            },
          },
          { merge: true }
        );

        const ehAtrasado =
          atrasoDias > 0 || isGabaritoLiberado || (descontoTotal > 0 && descontoAtraso > 0);
        const xpNormalIncr = ehAtrasado ? 0 : xpGanhoFinal;
        const xpAtrasadoIncr = ehAtrasado ? xpGanhoFinal : 0;

        const { semanaKey, mesKey } = getRankingKeys(new Date(timestampRealDaEntrega));

        const rankSemanaRef = dbAdmin.collection("estatisticas").doc(`ranking_semanal_${semanaKey}`);
        batch.set(
          rankSemanaRef,
          {
            alunos: {
              [alunoDb.idDoc]: {
                xpNormal: FieldValue.increment(xpNormalIncr),
                xpAtrasado: FieldValue.increment(xpAtrasadoIncr),
                ultimoEnvio: timestampRealDaEntrega,
              },
            },
          },
          { merge: true }
        );

        const rankMesRef = dbAdmin.collection("estatisticas").doc(`ranking_mensal_${mesKey}`);
        batch.set(
          rankMesRef,
          {
            alunos: {
              [alunoDb.idDoc]: {
                xpNormal: FieldValue.increment(xpNormalIncr),
                xpAtrasado: FieldValue.increment(xpAtrasadoIncr),
                ultimoEnvio: timestampRealDaEntrega,
              },
            },
          },
          { merge: true }
        );

        await batch.commit();

        cachePortalViews[alunoDb.idDoc][idAtiv] = { status: "Avaliado" };
        alunoDb.xpTotal += xpGanhoFinal;
        entregasNovas++;
      }
    }
  }

  if (precisaRefreshAtividades) {
    await refreshFirestoreCacheAtividades(dbAdmin);
    clearAllPortalCaches();
  }

  if (entregasNovas > 0 || rascunhosPublicados > 0) {
    invalidateTutorAtividadesCache();
    invalidateRankingCache();
    clearAllPortalCaches();
  }

  return {
    status: "sucesso",
    mensagem: `Auto-sync concluído com ${entregasNovas} nova(s) entrega(s) validadas e ${rascunhosPublicados} rascunhos promovidos.`,
    entregasNovas,
    rascunhosPublicados,
  };
}
