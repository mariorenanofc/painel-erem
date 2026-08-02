import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
import { dbAdmin } from "@/src/lib/firebaseAdmin";

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
    const turmaDoAluno = aluno.turma || aluno.turmaTrilha || "";

    // 3. Regra de dias de aula por turma (se modo reposição desligado)
    if (modoReposicao !== "LIGADO") {
      if ((turmaDoAluno.includes("1º") || turmaDoAluno.includes("1 ANO")) && diaSemana !== 1 && diaSemana !== 3) {
        return NextResponse.json({ status: "erro", mensagem: "Hoje não é dia de aula para o 1º Ano." });
      } else if ((turmaDoAluno.includes("2º") || turmaDoAluno.includes("2 ANO")) && diaSemana !== 2 && diaSemana !== 4) {
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
    const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "==", matricula).get();
    const diasComAulaSet = new Set<string>();
    let presencasAluno = 0;

    freqSnap.forEach((doc: any) => {
      const f = doc.data();
      if (String(f.id || doc.id).startsWith("BDAY")) return;
      const dataFormatada = f.data || "";
      if (dataFormatada) diasComAulaSet.add(dataFormatada);
      if (f.status === "Presente") presencasAluno++;
    });

    const totalAulas = diasComAulaSet.size;
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
    await dbAdmin.runTransaction(async (transaction: any) => {
      const freshAlunoDoc = await transaction.get(alunoRef);
      const freshAluno = freshAlunoDoc.data()!;
      const currentXp = Number(freshAluno.xp) || 0;

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
        xp: currentXp + xpGanho,
        lastUpdated: spDate.getTime()
      });
    });

    return NextResponse.json({
      status: "sucesso",
      mensagem: `Check-in realizado! +${xpGanho} XP garantidos.${msgFogo}`
    });

  } catch (error: any) {
    console.warn("[Failover] Erro no check-in do Firestore:", error.message);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "fazer_checkin", matricula, senha: senhaInformada }),
        });
        return NextResponse.json(await response.json());
      } catch (sheetsErr) {}
    }
    return NextResponse.json({ status: "erro", mensagem: "Erro ao processar o check-in: " + error.message }, { status: 500 });
  }
}
