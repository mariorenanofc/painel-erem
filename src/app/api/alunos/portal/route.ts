import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedPortal, setCachedPortal } from "@/src/lib/cache";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

const niveisGamificacao = [
  { nome: "Hello World", min: 0, max: 499 },
  { nome: "Bug Hunter", min: 500, max: 1499 },
  { nome: "Coder Ninja", min: 1500, max: 2999 },
  { nome: "Tech Hacker", min: 3000, max: 4999 },
  { nome: "Dev Supremo", min: 5000, max: 7499 },
  { nome: "Lenda Binária", min: 7500, max: 9999 },
  { nome: "Mestre do Código", min: 10000, max: 13999 },
  { nome: "Arquiteto de Sistemas", min: 14000, max: 18999 },
  { nome: "Hacker Quântico", min: 19000, max: 24999 },
  { nome: "Oráculo Digital", min: 25000, max: 34999 },
  { nome: "Titã da Nuvem", min: 35000, max: 49999 },
  { nome: "Deus da Lógica", min: 50000, max: 999999 }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matricula = searchParams.get("matricula")?.trim();

  if (!matricula) {
    return NextResponse.json({ error: "Matrícula não fornecida." }, { status: 400 });
  }

  // 1. Verificar Cache em Memória
  const cachedData = getCachedPortal(matricula);
  if (cachedData) {
    console.log(`[Cache Hit] Portal do aluno ${matricula}`);
    return NextResponse.json(cachedData);
  }

  try {
    console.log(`[Firestore Query] Portal do aluno ${matricula}`);
    
    // 2. Carregar documento do Aluno
    const alunoDoc = await dbAdmin.collection("alunos").doc(matricula).get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    }
    const aluno = alunoDoc.data()!;

    // 3. Carregar Controle de Módulos
    const modulosSnap = await dbAdmin.collection("controle_modulos").get();
    const statusModulosMap: Record<string, string> = {};
    modulosSnap.forEach((doc: any) => {
      const data = doc.data();
      const nomeMod = String(data.id || doc.id).trim();
      const statusMod = String(data.status || "Aberto").trim();
      const turmaMod = String(data.turma || "Todas").trim();
      if (nomeMod) {
        statusModulosMap[`${nomeMod}|${turmaMod}`] = statusMod;
      }
    });

    const dadosRetorno: any = {
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

    // Calcular nível
    const xpTotalAtual = aluno.xp || 0;
    const xpGasto = aluno.xpGasto || 0;
    let nivelCalculado = niveisGamificacao[0];
    let proximoNivel = niveisGamificacao[1];
    for (let n = 0; n < niveisGamificacao.length; n++) {
      if (xpTotalAtual >= niveisGamificacao[n].min && xpTotalAtual <= niveisGamificacao[n].max) {
        nivelCalculado = niveisGamificacao[n];
        proximoNivel = niveisGamificacao[n + 1] || niveisGamificacao[n];
        break;
      }
    }
    const xpBaseNivel = nivelCalculado.min;
    const xpParaProximo = proximoNivel.min;
    const progressoAtual = xpTotalAtual - xpBaseNivel;
    const totalDoNivel = xpParaProximo - xpBaseNivel;

    dadosRetorno.xpTotal = xpTotalAtual;
    dadosRetorno.xpGasto = xpGasto;
    dadosRetorno.saldoCarteira = xpTotalAtual - xpGasto;
    dadosRetorno.nivel = nivelCalculado.nome;
    dadosRetorno.progressoNivel = {
      porcentagem: totalDoNivel === 0 ? 100 : Math.floor((progressoAtual / totalDoNivel) * 100),
      faltam: xpParaProximo - xpTotalAtual > 0 ? xpParaProximo - xpTotalAtual : 0,
      nomeProximo: proximoNivel.nome,
      isMaximo: totalDoNivel === 0
    };

    // 4. WhatsApp link da turma
    const configSnap = await dbAdmin.collection("configuracoes").get();
    const configMap: Record<string, any> = {};
    configSnap.forEach((doc: any) => {
      configMap[doc.id] = doc.data().valor;
    });

    const turmaDoAluno = aluno.turma || aluno.turmaTrilha || "";
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
    const entregasMap: Record<string, any> = {};

    entregasSnap.forEach((doc: any) => {
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
    curtidasSnap.forEach((doc: any) => {
      const c = doc.data();
      const tempo = Number(doc.id.split("-")[1]) || hj.getTime();
      dadosRetorno.notificacoes.push({
        id: doc.id,
        mensagem: "Alguém curtiu o seu perfil! ❤️",
        xp: 0,
        tempo: tempo,
        tipo: "LIKE"
      });
    });

    dadosRetorno.notificacoes.sort((a: any, b: any) => b.tempo - a.tempo);
    dadosRetorno.notificacoes = dadosRetorno.notificacoes.slice(0, 10);
    dadosRetorno.extratoPix.sort((a: any, b: any) => b.tempo - a.tempo);
    dadosRetorno.extratoPix = dadosRetorno.extratoPix.slice(0, 20);

    // 8. Frequência / Streak / Presença
    const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "==", matricula).get();
    const diasComAulaSet = new Set<string>();
    const checkinsMap: Record<string, boolean> = {};
    let presencasAluno = 0;

    freqSnap.forEach((doc: any) => {
      const f = doc.data();
      if (f.id?.startsWith("BDAY")) return;
      const dataFormatada = f.data || "";
      if (dataFormatada) diasComAulaSet.add(dataFormatada);

      if (f.status === "Presente") {
        presencasAluno++;
        dadosRetorno.stats.totalCheckins++;
        checkinsMap[dataFormatada] = true;
      }
    });

    dadosRetorno.taxaPresenca = diasComAulaSet.size === 0 ? 100 : Math.round((presencasAluno / diasComAulaSet.size) * 100);

    // Streak / Ofensiva
    const diasOrdenados = Array.from(diasComAulaSet).sort((a, b) => {
      const pA = a.split("/");
      const pB = b.split("/");
      return new Date(Number(pB[2]), Number(pB[1]) - 1, Number(pA[2]), Number(pA[1]) - 1, Number(pA[0])).getTime(); // Adjusted safe parsing
    });

    let streak = 0;
    const dataHojeStr = `${diaHoje}/${mesHoje}/${anoHoje}`;
    for (const dia of diasOrdenados) {
      if (dia === dataHojeStr && !checkinsMap[dia]) continue;
      if (checkinsMap[dia]) streak++;
      else break;
    }
    dadosRetorno.ofensivaDias = streak;

    // 9. Atividades
    const atividadesSnap = await dbAdmin.collection("atividades").where("statusPublicacao", "==", "Publicada").get();
    const hojeTime = new Date();
    hojeTime.setHours(0, 0, 0, 0);

    atividadesSnap.forEach((doc: any) => {
      const ativ = doc.data();
      const turmaAlvo = ativ.turmaAlvo || "Todas";

      if (turmaAlvo.toLowerCase() === "todas" || turmaAlvo === turmaDoAluno) {
        const idAtiv = doc.id;
        const entregaAluno = entregasMap[idAtiv];
        const dataLimiteStr = ativ.dataLimite || "";

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
          statusModulo: statusModulosMap[`${ativ.modulo}|${turmaDoAluno}`] || statusModulosMap[`${ativ.modulo}|Todas`] || "Aberto"
        });
      }
    });

    // Guardar no Cache
    setCachedPortal(matricula, dadosRetorno);

    return NextResponse.json(dadosRetorno);
  } catch (error: any) {
    // 🛡️ REGRAS DE FAILOVER (Se esgotar cota ou der erro no Firebase, consome a Planilha)
    console.warn(`[Failover] Erro ao carregar portal do Firestore: ${error.message}. Redirecionando para Google Sheets...`);
    
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "carregar_portal_aluno", matricula }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: any) {
        return NextResponse.json({ error: "Erro crítico em ambos os bancos: " + sheetsErr.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: "Erro ao carregar o portal: " + error.message }, { status: 500 });
  }
}

function studentTurma(aluno: any) {
  return aluno.turma || aluno.turmaTrilha || "";
}
