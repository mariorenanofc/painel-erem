import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getCachedPortal, setCachedPortal, getCachedConfigs, setCachedConfigs, getCachedModulos, setCachedModulos, getCachedAtividades, setCachedAtividades, getCachedClassDates, setCachedClassDates } from "@/src/lib/cache";
import { calcularGamificacao } from "@/src/lib/gamificacao";

interface AtividadePortal {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: number;
  tipo: string;
  opcaoA?: string;
  opcaoB?: string;
  opcaoC?: string;
  opcaoD?: string;
  status: string;
  respostaEnviada: string;
  xpGanho: number;
  dataEnvio: number;
  statusPrazo: string;
  feedback: string;
  linkClassroom: string;
  imagemUrl: string;
  modulo: string;
  gabarito: string;
  statusModulo: string;
  resolucaoTyping?: string;
  limiteTempoTyping?: number;
}

interface AtividadeDoc {
  id: string;
  titulo?: string;
  descricao?: string;
  dataLimite?: string;
  xp?: number;
  tipo?: string;
  opcaoA?: string;
  opcaoB?: string;
  opcaoC?: string;
  opcaoD?: string;
  statusPublicacao?: string;
  turmaAlvo?: string;
  gabaritoLiberado?: boolean;
  linkClassroom?: string;
  imageUrl?: string;
  modulo?: string;
  gabarito?: string;
  resolucaoTyping?: string;
  limiteTempoTyping?: number;
}

interface PortalData {
  status: string;
  nomeAluno: string;
  xpTotal: number;
  xpGasto?: number;
  saldoCarteira?: number;
  nivel: string;
  avatar: string;
  totalCurtidas: number;
  ofensivaDias: number;
  whatsapp: { confirmado: boolean; link: string };
  aniversario: { isAniversario: boolean; jaResgatado: boolean };
  atividades: AtividadePortal[];
  notificacoes: { id: string; mensagem: string; xp: number; tempo: number; tipo: string }[];
  extratoPix: { id: string; mensagem: string; xp: number; tempo: number; tipo: string }[];
  badgesResgatadas: string[];
  taxaPresenca: number;
  stats: { xpDoado: number; xpRecebido: number; totalCheckins: number };
  progressoNivel?: {
    porcentagem: number;
    faltam: number;
    nomeProximo: string;
    isMaximo: boolean;
  };
}




export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matricula = searchParams.get("matricula")?.trim();
  const nocache = searchParams.get("nocache") === "true";

  if (!matricula) {
    return NextResponse.json({ error: "Matrícula não fornecida." }, { status: 400 });
  }

  // 1. Verificar Cache em Memória
  const cachedData = nocache ? null : getCachedPortal(matricula);
  if (cachedData) {
    console.log(`[Cache Hit] Portal do aluno ${matricula}`);
    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  }

  try {
    console.log(`[Firestore Query] Portal do aluno ${matricula}`);
    
    // 2. Carregar documento do Aluno
    const alunoDoc = await dbAdmin.collection("alunos").doc(matricula).get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    }
    const aluno = alunoDoc.data()!;

    // 3. Carregar Controle de Módulos (com cache global de 12 horas)
    let statusModulosMap = getCachedModulos() as Record<string, string> | null;
    if (!statusModulosMap) {
      console.log(`[Firestore Query] Portal: Carregando modulos (sem cache)`);
      const modulosSnap = await dbAdmin.collection("modulos").get();
      const tempMap: Record<string, string> = {};
      modulosSnap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        const nomeMod = String(data.nome || doc.id.split("|")[0]).trim();
        const statusMod = String(data.status || "Aberto").trim();
        const turmaMod = String(data.turma || doc.id.split("|")[1] || "Todas").trim();
        if (nomeMod) {
          tempMap[`${nomeMod}|${turmaMod}`] = statusMod;
        }
      });
      statusModulosMap = tempMap;
      setCachedModulos(statusModulosMap);
    }

    const dadosRetorno: PortalData = {
      status: "sucesso",
      nomeAluno: aluno.nome || "",
      xpTotal: aluno.xp || 0,
      nivel: "Iniciante",
      avatar: aluno.avatarId || "avatar-padrao",
      totalCurtidas: aluno.likes || 0,
      ofensivaDias: 0,
      whatsapp: { confirmado: aluno.whatsappConfirmado === true, link: "" },
      aniversario: { isAniversario: false, jaResgatado: false },
      atividades: [],
      notificacoes: [],
      extratoPix: [],
      badgesResgatadas: [],
      taxaPresenca: 100,
      stats: { xpDoado: 0, xpRecebido: 0, totalCheckins: 0 }
    };

    // Calcular nível e saldo usando o utilitário compartilhado
    const xpTotal = aluno.xp || 0;
    const xpGasto = aluno.xpGasto || 0;
    const gStatus = calcularGamificacao(xpTotal, xpGasto);
    dadosRetorno.xpTotal = xpTotal;
    dadosRetorno.xpGasto = xpGasto;
    dadosRetorno.saldoCarteira = gStatus.saldoCarteira;
    dadosRetorno.nivel = gStatus.nivel;
    dadosRetorno.progressoNivel = gStatus.progressoNivel;

    // 4. WhatsApp link da turma (com cache de 10 minutos)
    let configMap = getCachedConfigs() as Record<string, string> | null;
    if (!configMap) {
      console.log(`[Firestore Query] Portal: Carregando configuracoes (sem cache)`);
      const configSnap = await dbAdmin.collection("configuracoes").get();
      const tempMap: Record<string, string> = {};
      configSnap.forEach((doc: QueryDocumentSnapshot) => {
        tempMap[doc.id] = doc.data().valor;
      });
      configMap = tempMap;
      setCachedConfigs(configMap);
    }

    const turmaDoAluno: string = aluno.turmaTrilha || aluno.turma || "";
    if (turmaDoAluno.includes("1º") || turmaDoAluno.includes("1")) {
      dadosRetorno.whatsapp.link = configMap["WHATSAPP_1ANO"] || "";
    } else if (turmaDoAluno.includes("2º") || turmaDoAluno.includes("2")) {
      dadosRetorno.whatsapp.link = configMap["WHATSAPP_2ANO"] || "";
    }

    // 5. Checar Aniversário
    const hj = new Date();
    const diaHoje = String(hj.getDate()).padStart(2, "0");
    const mesHoje = String(hj.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(hj.getFullYear());
    const idNiver = `BDAY-${anoHoje}-${matricula}`;

    const strNasc = aluno.dataNasc || "";
    let diaNasc = "", mesNasc = "";
    if (strNasc.includes("/")) {
      const p = strNasc.split("/");
      if (p.length === 3) { diaNasc = p[0].padStart(2, "0"); mesNasc = p[1].padStart(2, "0"); }
    } else if (strNasc.includes("-")) {
      const p = strNasc.split("T")[0].split("-");
      if (p.length === 3) { diaNasc = p[2].padStart(2, "0"); mesNasc = p[1].padStart(2, "0"); }
    }
    if (diaNasc === diaHoje && mesNasc === mesHoje) {
      dadosRetorno.aniversario.isAniversario = true;
    }

    // 6. Entregas, Notificações, Pix, Badges
    const entregasSnap = await dbAdmin.collection("entregas").where("matricula", "==", matricula).get();
    const entregasMap: Record<string, {
      resposta: string;
      status: string;
      xpGanho: number;
      dataEnvio: number;
      feedback: string;
    }> = {};

    entregasSnap.forEach((doc: QueryDocumentSnapshot) => {
      const idEntrega = doc.id;
      const val = doc.data();
      const idAtiv = String(val.idAtividade || "").trim();

      if (idEntrega.startsWith("NOTIF-")) {
        dadosRetorno.notificacoes.push({
          id: idEntrega,
          mensagem: val.resposta || "",
          xp: val.xpGanho || 0,
          tempo: val.timestamp || 0,
          tipo: val.status || "Info"
        });
        return;
      }
      
      if (!idEntrega.startsWith("BDAY") && !idEntrega.startsWith("PIX") && !idEntrega.startsWith("BADGE") && !idEntrega.startsWith("BLOCK")) {
        if (val.status !== "EXCLUIDA") {
          entregasMap[idAtiv] = {
            resposta: val.resposta || "",
            status: val.status || "Aguardando Correção",
            xpGanho: val.xpGanho || 0,
            dataEnvio: val.timestamp || 0,
            feedback: val.feedback || ""
          };
        }
      }

      if (idEntrega.includes("PIX") && idEntrega.includes("-RECEBEU")) {
        dadosRetorno.stats.xpRecebido += val.xpGanho || 0;
        dadosRetorno.extratoPix.push({
          id: idEntrega,
          mensagem: val.resposta || "",
          xp: val.xpGanho || 0,
          tempo: val.timestamp || 0,
          tipo: "RECEBEU"
        });
      }
      if (idEntrega.includes("PIX") && idEntrega.includes("-ENVIOU")) {
        const xpD = Math.abs(val.xpGanho || 0);
        dadosRetorno.stats.xpDoado += xpD;
        dadosRetorno.extratoPix.push({
          id: idEntrega,
          mensagem: val.resposta || "",
          xp: -xpD,
          tempo: val.timestamp || 0,
          tipo: "ENVIOU"
        });
      }

      if (idEntrega === idNiver) {
        dadosRetorno.aniversario.jaResgatado = true;
      }

      if (idEntrega.startsWith("BADGE-")) {
        const badgeId = idEntrega.replace("BADGE-", "").replace(`-${matricula}`, "");
        dadosRetorno.badgesResgatadas.push(badgeId);
      }
    });

    // 7. Curtidas recebidas
    const curtidasSnap = await dbAdmin.collection("curtidas").where("destinatario", "==", matricula).get();
    curtidasSnap.forEach((doc: QueryDocumentSnapshot) => {
      const tempo = Number(doc.id.split("-")[1]) || hj.getTime();
      dadosRetorno.notificacoes.push({
        id: doc.id,
        mensagem: "Alguém curtiu o seu perfil! ❤️",
        xp: 0,
        tempo: tempo,
        tipo: "LIKE"
      });
    });

    dadosRetorno.notificacoes.sort((a: { tempo: number }, b: { tempo: number }) => b.tempo - a.tempo);
    dadosRetorno.notificacoes = dadosRetorno.notificacoes.slice(0, 10);
    dadosRetorno.extratoPix.sort((a: { tempo: number }, b: { tempo: number }) => b.tempo - a.tempo);
    dadosRetorno.extratoPix = dadosRetorno.extratoPix.slice(0, 20);

    // 8. Frequência / Streak / Presença (com cache global de 12 horas para datas com aula)
    const diasComAulaSet = new Set<string>();
    if (turmaDoAluno) {
      let cachedDates = getCachedClassDates(turmaDoAluno) as string[] | null;
      if (!cachedDates) {
        console.log(`[Firestore Query] Portal: Carregando dias com aula da turma ${turmaDoAluno} (sem cache)`);
        
        // 1. Tentar ler do documento unificado de metadados
        const metadataRef = dbAdmin.collection("metadata").doc("dias_aula_turmas");
        const metadataDoc = await metadataRef.get();
        const metadata = metadataDoc.exists ? metadataDoc.data() || {} : {};
        let datesArray = metadata[turmaDoAluno] as string[] | undefined;

        // 2. Fallback: Se não existir no metadado, faz a query pesada UMA ÚNICA VEZ e salva
        if (!datesArray || datesArray.length === 0) {
          console.log(`[Firestore Query] Portal: Metadado vazio para ${turmaDoAluno}. Executando fallback pesado...`);
          const tempDatesSet = new Set<string>();
          const turmaFreqSnap = await dbAdmin.collection("frequencia").where("turma", "==", turmaDoAluno).get();
          turmaFreqSnap.forEach((doc: QueryDocumentSnapshot) => {
            const f = doc.data();
            const idFreq = String(f.id || doc.id).trim();
            if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
            let dataFormatada = f.data || "";
            if (dataFormatada.includes("/") && dataFormatada.length > 10) {
              dataFormatada = dataFormatada.slice(0, 10);
            }
            if (dataFormatada) tempDatesSet.add(dataFormatada);
          });
          datesArray = Array.from(tempDatesSet);
          
          // Salva no metadado para garantir que a query pesada não rode novamente
          await metadataRef.set({
            [turmaDoAluno]: datesArray
          }, { merge: true });
        }

        cachedDates = datesArray;
        setCachedClassDates(turmaDoAluno, cachedDates);
      }
      cachedDates.forEach(d => diasComAulaSet.add(d));
    }

    const checkinsMap: Record<string, boolean> = {};
    let presencasAluno = 0;

    const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "==", matricula).get();
    freqSnap.forEach((doc: QueryDocumentSnapshot) => {
      const f = doc.data();
      const idFreq = String(f.id || doc.id).trim();
      if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
      let dataFormatada = f.data || "";
      if (dataFormatada.includes("/") && dataFormatada.length > 10) {
        dataFormatada = dataFormatada.slice(0, 10);
      }
      if (!dataFormatada) return;

      diasComAulaSet.add(dataFormatada);

      checkinsMap[dataFormatada] = true;

      const st = String(f.status || "").toLowerCase().trim();
      const isPresence = !idFreq.startsWith("FALTA-") && (st === "presente" || st === "p");
      if (isPresence) {
        presencasAluno++;
        dadosRetorno.stats.totalCheckins++;
      }
    });

    dadosRetorno.taxaPresenca = diasComAulaSet.size === 0 ? 100 : Math.round((presencasAluno / diasComAulaSet.size) * 100);

    // Streak / Ofensiva baseada nas aulas aplicadas na turma dele
    const diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
      const pA = a.split("/");
      const pB = b.split("/");
      return new Date(Number(pB[2]), Number(pB[1]) - 1, Number(pB[0])).getTime() - new Date(Number(pA[2]), Number(pA[1]) - 1, Number(pA[0])).getTime();
    });

    let streak = 0;
    const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;
    for (const dia of diasOrdenados) {
      if (dia === dataHojeStr && !checkinsMap[dia]) continue;
      if (checkinsMap[dia]) streak++;
      else break;
    }
    dadosRetorno.ofensivaDias = streak;

    // 9. Atividades (com cache global de 12 horas + SINGLETON FIRESTORE)
    let atividadesList = getCachedAtividades() as AtividadeDoc[] | null;
    if (!atividadesList) {
      console.log(`[Firestore Query] Portal: Carregando atividades publicadas (SINGLETON CACHE)`);
      
      const cacheDoc = await dbAdmin.collection("cache").doc("atividades_publicadas").get();
      if (cacheDoc.exists) {
        atividadesList = cacheDoc.data()?.atividades as AtividadeDoc[] || [];
      } else {
        console.warn(`[Firestore Query] Portal: Singleton vazio, carregando fallback...`);
        const atividadesSnap = await dbAdmin.collection("atividades").where("statusPublicacao", "==", "Publicada").get();
        const tempAtivList: AtividadeDoc[] = [];
        atividadesSnap.forEach((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          tempAtivList.push({
            id: doc.id,
            titulo: data.titulo,
            descricao: data.descricao,
            dataLimite: data.dataLimite,
            xp: data.xp,
            tipo: data.tipo,
            opcaoA: data.opcaoA,
            opcaoB: data.opcaoB,
            opcaoC: data.opcaoC,
            opcaoD: data.opcaoD,
            statusPublicacao: data.statusPublicacao,
            turmaAlvo: data.turmaAlvo,
            gabaritoLiberado: data.gabaritoLiberado,
            linkClassroom: data.linkClassroom,
            imageUrl: data.imageUrl,
            modulo: data.modulo,
            gabarito: data.gabarito,
            resolucaoTyping: data.resolucaoTyping,
            limiteTempoTyping: data.limiteTempoTyping
          });
        });
        atividadesList = tempAtivList;
      }
      setCachedAtividades(atividadesList);
    }

    const hojeTime = new Date();
    hojeTime.setHours(0, 0, 0, 0);

    atividadesList.forEach((ativ) => {
      const turmaAlvo = ativ.turmaAlvo || "Todas";

      if (turmaAlvo.toLowerCase() === "todas" || turmaAlvo === turmaDoAluno) {
        const idAtiv = ativ.id;
        const entregaAluno = entregasMap[idAtiv];

        const rawDataLimite = ativ.dataLimite || "";
        let dataLimiteStr = rawDataLimite;
        if (rawDataLimite.includes("T")) {
          const parts = rawDataLimite.split("T")[0].split("-");
          if (parts.length === 3) dataLimiteStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else if (rawDataLimite.includes("-")) {
          const parts = rawDataLimite.split("-");
          if (parts.length === 3 && parts[0].length === 4) dataLimiteStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        let statusPrazo = "No Prazo";
        if (!entregaAluno && dataLimiteStr) {
          if (dataLimiteStr.includes("-")) {
            const p = dataLimiteStr.split("-");
            if (p.length === 3 && hojeTime > new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))) statusPrazo = "Atrasada";
          } else if (dataLimiteStr.includes("/")) {
            const p = dataLimiteStr.split("/");
            if (p.length === 3 && hojeTime > new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]))) statusPrazo = "Atrasada";
          }
        }

        const isGabaritoLiberado = ativ.gabaritoLiberado === true;
        dadosRetorno.atividades.push({
          id: idAtiv,
          titulo: ativ.titulo || "",
          descricao: ativ.descricao || "",
          dataLimite: dataLimiteStr,
          xp: ativ.xp || 0,
          tipo: ativ.tipo || "Projeto",
          opcaoA: ativ.opcaoA || "",
          opcaoB: ativ.opcaoB || "",
          opcaoC: ativ.opcaoC || "",
          opcaoD: ativ.opcaoD || "",
          status: entregaAluno ? entregaAluno.status : "Pendente",
          respostaEnviada: entregaAluno ? entregaAluno.resposta : "",
          xpGanho: entregaAluno ? entregaAluno.xpGanho : 0,
          dataEnvio: entregaAluno ? entregaAluno.dataEnvio : 0,
          statusPrazo: statusPrazo,
          feedback: entregaAluno ? entregaAluno.feedback : "",
          linkClassroom: ativ.linkClassroom || "",
          imagemUrl: ativ.imageUrl || "",
          modulo: ativ.modulo || "Geral",
          gabarito: isGabaritoLiberado ? (ativ.gabarito || "") : "",
          statusModulo: statusModulosMap[`${ativ.modulo}|${turmaDoAluno}`] || statusModulosMap[`${ativ.modulo}|Todas`] || "Aberto",
          resolucaoTyping: ativ.resolucaoTyping || "",
          limiteTempoTyping: Number(ativ.limiteTempoTyping) || 0
        });
      }
    });

    // Guardar no Cache
    setCachedPortal(matricula, dadosRetorno);

    return NextResponse.json(dadosRetorno, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao carregar portal do Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
