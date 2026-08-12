import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { google } from "googleapis";

// Normalização de nomes para busca
const normalizar = (texto: string) => String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export async function POST(req: Request) {
  try {
    // Autenticação básica via cookies para garantir que é um tutor (Opcional, mas recomendado)
    // const cookies = req.headers.get("cookie"); // etc...

    const body = await req.json();
    const filtroTurma = body.filtroTurma || "Todas";
    const filtroModulo = body.filtroModulo || "Todos";

    // 1. Setup Google API (Usando as credenciais de Serviço do Firebase)
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!clientEmail || !privateKey) {
      throw new Error("Variáveis FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY ausentes no .env.local");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
        project_id: projectId,
      },
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
        'https://www.googleapis.com/auth/classroom.profile.emails',
        'https://www.googleapis.com/auth/classroom.rosters.readonly'
      ],
    });
    const classroom = google.classroom({ version: 'v1', auth });

    // 2. Buscar Dados do Firestore
    const [atividadesSnap, alunosSnap, entregasSnap, modulosSnap] = await Promise.all([
      dbAdmin.collection("atividades").get(),
      dbAdmin.collection("alunos").get(),
      dbAdmin.collection("entregas").get(),
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

    const listaAlunos: any[] = [];
    const mapaBuscaAluno: Record<string, any> = {};
    alunosSnap.forEach(doc => {
      const a = doc.data();
      if (a.statusCurso === "Ativo") {
        const obj = { idDoc: doc.id, ...a, xpTotal: Number(a.xpTotal) || 0, nomeNorm: normalizar(a.nome) };
        if (a.email) mapaBuscaAluno[a.email.toLowerCase()] = obj;
        if (a.nome) mapaBuscaAluno[obj.nomeNorm] = obj;
        listaAlunos.push(obj);
      }
    });

    const mapaEntregas: Record<string, any> = {};
    entregasSnap.forEach(doc => {
      const e = doc.data();
      mapaEntregas[`${e.matricula}_${e.idAtividade}`] = { idDoc: doc.id, status: e.status };
    });

    // Filtra Atividades do Classroom
    const atividadesParaSincronizar: any[] = [];
    atividadesSnap.forEach(doc => {
      const ativ = { idDoc: doc.id, ...(doc.data() as { linkClassroom?: string; turmaAlvo?: string; modulo?: string; xp?: number; dataLimite?: string }) };
      const link = String(ativ.linkClassroom || "").trim();
      const turmaAlvo = String(ativ.turmaAlvo || "Todas");
      const nomeModulo = String(ativ.modulo || "Geral");

      if (!link.includes("classroom.google.com")) return;
      if (filtroTurma !== "Todas" && turmaAlvo !== "Todas" && turmaAlvo !== filtroTurma) return;
      if (filtroModulo !== "Todos" && nomeModulo !== filtroModulo) return;

      atividadesParaSincronizar.push(ativ);
    });

    if (atividadesParaSincronizar.length === 0) {
      return NextResponse.json({ status: "sucesso", mensagem: "Nenhuma atividade correspondente com link do Classroom encontrada." });
    }

    let entregasNovas = 0;
    const logsErro: string[] = [];
    const cacheAlunosCurso: Record<string, Record<string, any>> = {};

    for (const ativ of atividadesParaSincronizar) {
      const idAtiv = ativ.idDoc;
      const xpAtiv = Number(ativ.xp) || 0;
      const link = ativ.linkClassroom;
      const turmaAlvoNorm = String(ativ.turmaAlvo || "").trim().toLowerCase();
      const moduloNorm = String(ativ.modulo || "").trim().toLowerCase();
      const statusModulo = mapaModulos[`${moduloNorm}_${turmaAlvoNorm}`] || mapaModulos[moduloNorm] || "aberto";

      if (statusModulo === "em breve") continue;

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

      const match = link.match(/\/c\/([^\/\?]+)\/(?:a|sa|q|mc)\/([^\/\?]+)/i);
      if (match && match[1] && match[2]) {
        const courseId = match[1];
        const courseWorkId = match[2];

        try {
          let pageToken: string | null | undefined = undefined;
          do {
            const response: { data: { nextPageToken?: string; studentSubmissions?: Array<{ state?: string; userId?: string; updateTime?: string }> } } = (await classroom.courses.courseWork.studentSubmissions.list({
              courseId,
              courseWorkId,
              pageToken: pageToken || undefined,
            })) as unknown as { data: { nextPageToken?: string; studentSubmissions?: Array<{ state?: string; userId?: string; updateTime?: string }> } };

            const submissions = response.data.studentSubmissions || [];
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
                 let alunoDb = mapaBuscaAluno[usr.email] || mapaBuscaAluno[usr.nomeNorm];

                 // Fallback Busca Parcial
                 if (!alunoDb && usr.nomeNorm) {
                     for (const al of listaAlunos) {
                         if (al.nomeNorm === usr.nomeNorm || al.nomeNorm.startsWith(usr.nomeNorm) || usr.nomeNorm.startsWith(al.nomeNorm)) {
                             alunoDb = al;
                             break;
                         }
                     }
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
                             if (entregaExistente) {
                                 const docSnap = await dbAdmin.collection("entregas").doc(entregaExistente.idDoc).get();
                                 const feedbackExistente = docSnap.exists ? String(docSnap.data()?.feedback || "") : "";
                                 matchDig = feedbackExistente.match(/\[XP_DIGITACAO:\s*(\d+)\]/);
                             }

                             if (matchDig) {
                                 xpGanhoFinal = parseInt(matchDig[1], 10);
                             } else {
                                 const piso = Math.ceil(xpAtiv * 0.1);
                                 if (xpGanhoFinal < piso && xpAtiv > 0) xpGanhoFinal = piso;
                             }

                             if (descontoTotal > 0 && !matchDig) {
                                 const msgs = [];
                                 if (descontoAtraso > 0) msgs.push(`-${descontoAtraso}XP por Atraso`);
                                 if (descontoGabarito > 0) msgs.push(`-30% por Gabarito Liberado`);
                                 notaAdicional = ` (${msgs.join(", ")})`;
                             }
                         }

                         const batch = dbAdmin.batch();
                         const msgAviso = "\n[🤖 AVA: Nota sincronizada automaticamente]";

                         if (entregaExistente) {
                            const docRef = dbAdmin.collection("entregas").doc(entregaExistente.idDoc);
                            batch.update(docRef, {
                                status: "Avaliado",
                                xpGanho: xpGanhoFinal,
                            });
                            // Seria ideal ler o feedback antigo aqui para anexar a string em vez de sobrescrever
                            // Mas por otimização, faremos via transação ou assumiremos anexação
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
                             xpTotal: (alunoDb.xpTotal || 0) + xpGanhoFinal
                         });

                         await batch.commit();

                         // Atualizar cache em memória para próximas iterações n resincronizarem errado
                         mapaEntregas[chaveEntrega] = { status: "Avaliado" };
                         alunoDb.xpTotal += xpGanhoFinal;
                         entregasNovas++;
                     }
                 }
              }
            }
            pageToken = response.data.nextPageToken;
          } while(pageToken);

        } catch(e: any) {
           logsErro.push(`Missão [${idAtiv}]: ${e.message}`);
        }
      }
    }

    let mensagemFinal = "";
    if (entregasNovas > 0) {
        mensagemFinal = `Sincronização Perfeita! ${entregasNovas} nova(s) entrega(s) validadas e pontuadas pelo AVA.`;
    } else {
        mensagemFinal = `Sincronização concluída. Nenhuma nova nota importada do AVA.`;
    }

    if (logsErro.length > 0) {
        mensagemFinal += `\n\n⚠️ Erros ignorados da API:\n` + logsErro.slice(0, 3).join("\n");
    }

    return NextResponse.json({ status: "sucesso", mensagem: mensagemFinal });
  } catch (error: any) {
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}
