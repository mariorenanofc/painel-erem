import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot, Transaction, FieldValue } from "firebase-admin/firestore";
import { calcularGamificacao, GamificacaoStatus } from "@/src/lib/gamificacao";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

export async function POST(request: Request) {
  let matricula = "";
  let senhaInformada = "";
  try {
    const body = await request.json();
    matricula = String(body.matricula || "").trim();
    senhaInformada = String(body.senha || "").trim();

    if (!matricula || !senhaInformada) {
      invalidatePortalCache(matricula);
    invalidateRankingCache();
    return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    // Obter data, hora e dia da semana no fuso de São Paulo
    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const diaHoje = String(spDate.getDate()).padStart(2, "0");
    const mesHoje = String(spDate.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(spDate.getFullYear());
    
    const dataHoje = `${diaHoje}/${mesHoje}/${anoHoje}`;
    const horaAtual = spDate.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const diaSemana = spDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

    // 1. Validar Senha de Check-in e Modo Reposição
    const configDoc = await dbAdmin.collection("configuracoes").doc("SENHA_CHECKIN").get();
    const modoRepDoc = await dbAdmin.collection("configuracoes").doc("MODO_REPOSICAO").get();

    const senhaCorreta = String(configDoc.data()?.valor || "").trim();
    const modoReposicao = String(modoRepDoc.data()?.valor || "DESLIGADO").trim().toUpperCase();

    if (!senhaCorreta || senhaInformada.toUpperCase() !== senhaCorreta.toUpperCase()) {
      return NextResponse.json({ status: "erro", mensagem: "Senha incorreta ou não configurada!" });
    }

    // 2. Carregar Aluno
    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const alunoDoc = await alunoRef.get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." });
    }
    const aluno = alunoDoc.data()!;
    const turmaDoAluno = aluno.turmaTrilha || aluno.turma || "";

    // 3. Regra de dias de aula por turma (se modo reposição desligado)
    const isPrimeiroAno = turmaDoAluno.includes("1º") || turmaDoAluno.includes("1 ANO");
    const isSegundoAno = turmaDoAluno.includes("2º") || turmaDoAluno.includes("2 ANO");

    if (!isPrimeiroAno && !isSegundoAno) {
      return NextResponse.json({ status: "erro", mensagem: "Sua conta não possui uma turma válida vinculada para o check-in." });
    }

    if (modoReposicao !== "LIGADO") {
      if (isPrimeiroAno && diaSemana !== 1 && diaSemana !== 3) {
        return NextResponse.json({ status: "erro", mensagem: "Hoje não é dia de aula para o 1º Ano." });
      } else if (isSegundoAno && diaSemana !== 2 && diaSemana !== 4) {
        return NextResponse.json({ status: "erro", mensagem: "Hoje não é dia de aula para o 2º Ano." });
      }
    }

    // 4. Verificar se já fez check-in hoje
    const docId = `${diaHoje}-${mesHoje}-${anoHoje}_${matricula}`;
    const checkinRef = dbAdmin.collection("frequencia").doc(docId);
    const checkinDoc = await checkinRef.get();

    if (checkinDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Você já garantiu o seu XP de presença hoje!" });
    }

    // 5. Calcular Taxa de Presença para determinar o XP de recompensa
    const metaDoc = await dbAdmin.collection("metadata").doc("dias_aula_turmas").get();
    const metaData = metaDoc.exists ? metaDoc.data() || {} : {};
    let diasDaTurma: string[] = metaData[turmaDoAluno] || [];

    if (diasDaTurma.length === 0) {
      // Fallback Avançado (Igual ao action-proxy)
      const tempDatesSet = new Set<string>();
      const todosAlunosSnap = await dbAdmin.collection("alunos").get();
      const alunosDaTurma: string[] = [];
      todosAlunosSnap.forEach(doc => {
        const d = doc.data();
        const t = String(d.turmaTrilha || d.turma || "").trim();
        if (t === turmaDoAluno && String(d.statusTrilha || "").toLowerCase() === "ativo") {
           alunosDaTurma.push(doc.id);
        }
      });

      for (let i = 0; i < alunosDaTurma.length; i += 30) {
        const chunk = alunosDaTurma.slice(i, i + 30);
        if (chunk.length === 0) continue;
        const fallbackSnap = await dbAdmin.collection("frequencia").where("matricula", "in", chunk).get();
        fallbackSnap.forEach(doc => {
          const f = doc.data();
          const idFreq = String(f.id || doc.id).trim();
          if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
          let dataFormatada = f.data || "";
          if (dataFormatada.includes("/") && dataFormatada.length > 10) {
            dataFormatada = dataFormatada.slice(0, 10);
          }
          if (dataFormatada) tempDatesSet.add(dataFormatada);
        });
      }
      diasDaTurma = Array.from(tempDatesSet);
    }

    // Adiciona o dia de hoje, já que o check-in está sendo feito agora
    if (!diasDaTurma.includes(dataHoje)) {
      diasDaTurma.push(dataHoje);
    }

    // Conta apenas presenças/justificadas em dias oficiais da turma
    let presencasAluno = 1; // +1 porque ele está fazendo check-in hoje
    const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "==", matricula).get();
    
    const freqMap: Record<string, any> = {};
    freqSnap.forEach((doc: QueryDocumentSnapshot) => {
      const f = doc.data();
      const idFreq = String(f.id || doc.id).trim();
      if (idFreq.startsWith("BDAY") || idFreq.startsWith("NIVER-") || idFreq.startsWith("COMPRA-") || idFreq.startsWith("DOACAO-") || idFreq.startsWith("BADGE-")) return;
      
      let dataFormatada = f.data || "";
      if (dataFormatada.includes("/") && dataFormatada.length > 10) {
        dataFormatada = dataFormatada.slice(0, 10);
      }
      if (dataFormatada) {
        freqMap[dataFormatada] = f;
      }
    });

    // Cruzar com os dias oficiais da turma, exatamente igual ao action-proxy
    diasDaTurma.forEach(data => {
      if (data === dataHoje) return; // O dia de hoje já foi somado em presencasAluno = 1
      const f = freqMap[data];
      if (f) {
        const st = String(f.status || "").toLowerCase().trim();
        if ((f.xpGanho === 0 && f.justificativa) || st === "justificada" || st === "j") {
          presencasAluno++;
        } else if (st === "presente" || st === "p") {
          presencasAluno++;
        }
      }
    });

    const totalAulas = diasDaTurma.length;
    const taxa = totalAulas === 0 ? 100 : Math.round((presencasAluno / totalAulas) * 100);

    let xpGanho = 10;
    let msgFogo = "";
    if (taxa >= 90) {
      xpGanho = 15;
      msgFogo = " 🔥 Ofensiva Alta!";
    } else if (taxa >= 75) {
      xpGanho = 12;
      msgFogo = " ⚡ Ofensiva Média!";
    }

    // 6. Gravar Check-in e atualizar XP usando Transação atômica (Protege contra concorrência)
    let finalXp = 0;
    let finalGamificacao: GamificacaoStatus = {
      nivel: "Hello World",
      saldoCarteira: 0,
      progressoNivel: { porcentagem: 0, faltam: 500, nomeProximo: "Bug Hunter", isMaximo: false }
    };

    await dbAdmin.runTransaction(async (transaction: Transaction) => {
      const freshAlunoDoc = await transaction.get(alunoRef);
      const freshAluno = freshAlunoDoc.data()!;
      const currentXp = Number(freshAluno.xp) || 0;
      const xpGasto = Number(freshAluno.xpGasto) || 0;

      finalXp = currentXp + xpGanho;

      // Gravar registro na coleção frequencia
      transaction.set(checkinRef, {
        id: docId,
        matricula,
        nome: freshAluno.nome || "Aluno",
        data: dataHoje,
        hora: horaAtual,
        status: "Presente",
        justificativa: "",
        turma: turmaDoAluno,
        timestamp: spDate.getTime()
      });

      // Atualizar XP do Aluno
      transaction.update(alunoRef, {
        xp: finalXp,
        lastUpdated: spDate.getTime()
      });

      // Registrar o dia de aula no metadado para não sobrecarregar a query do Portal
      const metadataRef = dbAdmin.collection("metadata").doc("dias_aula_turmas");
      transaction.set(metadataRef, {
        [turmaDoAluno]: FieldValue.arrayUnion(dataHoje)
      }, { merge: true });

      // Calcular gamificação com o novo XP
      finalGamificacao = calcularGamificacao(finalXp, xpGasto);
    });

    // Sincronizar com Google Sheets em segundo plano (assíncrono, sem travar o usuário)
    if (GOOGLE_API_URL) {
      fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "fazer_checkin", matricula, senha: senhaInformada }),
      }).catch((error: unknown) => {
        const err = error as Error;
        console.error("[Background Sync Error] Check-in:", err.message);
      });
    }

    // Invalidar caches locais do portal deste aluno e ranking
    invalidatePortalCache(matricula);
    invalidateRankingCache();

    return NextResponse.json({
      status: "sucesso",
      mensagem: `Check-in realizado! +${xpGanho} XP garantidos.${msgFogo}`,
      perfilAtualizado: {
        xpTotal: finalXp,
        nivel: finalGamificacao.nivel,
        saldoCarteira: finalGamificacao.saldoCarteira,
        progressoNivel: finalGamificacao.progressoNivel
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API Error] Erro no check-in:", err.message);
    return NextResponse.json({ status: "erro", mensagem: "Erro ao processar o check-in: " + err.message }, { status: 500 });
  }
}
