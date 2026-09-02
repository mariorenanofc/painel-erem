import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { GoogleGenAI } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const FALLBACK_SNIPPETS = [
  "const saudacao = 'Olá, mundo!';\nconsole.log(saudacao);",
  "function somar(a, b) {\n  return a + b;\n}",
  "let contador = 0;\ncontador++;\nconsole.log(contador);",
  "const frutas = ['Maçã', 'Banana'];\nconsole.log(frutas[0]);",
  "const aluno = { nome: 'João', xp: 100 };\nconsole.log(aluno.nome);"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { desafiadoMatricula, desafiadoNome, desafiadoTurma, matricula: desafianteMatricula } = body;

    if (!desafiadoMatricula || !desafianteMatricula) {
      return NextResponse.json({ error: "Oponente ou desafiante não informado." }, { status: 400 });
    }

    const alunoDocCheck = await dbAdmin.collection("alunos").doc(desafianteMatricula).get();
    if (!alunoDocCheck.exists) {
      return NextResponse.json({ error: "Desafiante não encontrado" }, { status: 404 });
    }
    const { nome: desafianteNome, turma: desafianteTurma } = alunoDocCheck.data() || {};

    if (desafianteMatricula === desafiadoMatricula) {
      return NextResponse.json({ error: "Você não pode desafiar a si mesmo!" }, { status: 400 });
    }

    // 1. Validar limites diários e saldo de XP
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const tsInicioDia = inicioDia.getTime();

    // Como Firestore tem limites de OR, vamos consultar todos do desafiante
    const desafianteDuelosSnap = await dbAdmin.collection("duelos")
      .where("desafiante.matricula", "==", desafianteMatricula)
      .get();

    const desafiadoDuelosSnap = await dbAdmin.collection("duelos")
      .where("desafiado.matricula", "==", desafianteMatricula)
      .get();

    const duelosDeHoje = new Map();
    desafianteDuelosSnap.forEach(doc => {
      if (doc.data().timestampCriacao >= tsInicioDia) {
        duelosDeHoje.set(doc.id, doc.data());
      }
    });
    desafiadoDuelosSnap.forEach(doc => {
      if (doc.data().timestampCriacao >= tsInicioDia) {
        duelosDeHoje.set(doc.id, doc.data());
      }
    });

    let totalDuelosHoje = 0;
    let duelosComEsteOponente = 0;

    duelosDeHoje.forEach((d) => {
      // Ignoramos duelos cancelados
      if (d.status === "Cancelado" || d.status === "Expirado_TempoEsgotado") return;

      totalDuelosHoje++;

      const op = d.desafiante.matricula === desafianteMatricula ? d.desafiado.matricula : d.desafiante.matricula;
      if (op === desafiadoMatricula) {
        duelosComEsteOponente++;
      }
    });

    if (totalDuelosHoje >= 3) {
      return NextResponse.json({ error: "Você já atingiu o limite de 3 duelos por dia." }, { status: 403 });
    }

    if (duelosComEsteOponente >= 2) {
      // Regra de desempate
      let vitoriasMinhas = 0;
      let vitoriasDele = 0;
      duelosDeHoje.forEach((d) => {
        if (d.status !== "Finalizado") return;
        const op = d.desafiante.matricula === desafianteMatricula ? d.desafiado.matricula : d.desafiante.matricula;
        if (op === desafiadoMatricula) {
          if (d.vencedor === desafianteMatricula) vitoriasMinhas++;
          if (d.vencedor === desafiadoMatricula) vitoriasDele++;
        }
      });

      if (vitoriasMinhas !== 1 || vitoriasDele !== 1) {
        return NextResponse.json({ error: "Você só pode jogar uma terceira partida como desempate (1x1)." }, { status: 403 });
      }
    }

    // Checar saldo
    const alunoDoc = await dbAdmin.collection("alunos").doc(desafianteMatricula).get();
    const xpAtual = Number(alunoDoc.data()?.xp) || 0;
    if (xpAtual < 50) {
      return NextResponse.json({ error: "Saldo de XP insuficiente. Você precisa de 50 XP para apostar." }, { status: 403 });
    }

    // 2. Gerar Snippet
    let snippet = "";
    if (GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: "Gere um snippet de código em Javascript muito curto (no máximo 8 linhas e 100 caracteres). Use variáveis ou console.log simples. Retorne apenas o código puro, sem formatação markdown (sem ```javascript). O código deve fazer sentido e ser fácil de digitar, mas não óbvio demais. Não use comentários. Mas use identação como quebra de linhas e tab para aberturas  e fechamnetos de funções."
        });
        snippet = String(response.text || "").replace(/```javascript/gi, "").replace(/```/g, "").trim();
      } catch (e) {
        console.warn("Falha no Gemini, usando fallback", e);
      }
    }

    if (!snippet || snippet.length < 5) {
      snippet = FALLBACK_SNIPPETS[Math.floor(Math.random() * FALLBACK_SNIPPETS.length)];
    }

    // 3. Criar Duelo e Debitar XP
    const batch = dbAdmin.batch();

    const dueloRef = dbAdmin.collection("duelos").doc();
    batch.set(dueloRef, {
      id: dueloRef.id,
      desafiante: { matricula: desafianteMatricula, nome: desafianteNome, turma: desafianteTurma, tempo: 0, precisao: 0, finalizado: false },
      desafiado: { matricula: desafiadoMatricula, nome: desafiadoNome, turma: desafiadoTurma, tempo: 0, precisao: 0, finalizado: false },
      status: "Iniciado_Desafiante",
      apostaXP: 50,
      codigoDesafio: snippet,
      timestampCriacao: Date.now(),
      ultimaAtualizacao: Date.now(),
      vencedor: ""
    });

    batch.update(alunoDoc.ref, { xp: FieldValue.increment(-50) });

    // Grava transação no extrato (entregas)
    const timestamp = Date.now();
    const extratoRef = dbAdmin.collection("entregas").doc(`DUELO-INIC-${dueloRef.id}`);
    batch.set(extratoRef, {
      id: `DUELO-INIC-${dueloRef.id}`,
      matricula: desafianteMatricula,
      idAtividade: "DUELO-1V1",
      resposta: `Desafiou ${desafiadoNome}`,
      status: "Avaliado",
      xpGanho: -50,
      timestamp,
      feedback: "Aposta de Duelo"
    });

    await batch.commit();

    return NextResponse.json({ status: "sucesso", idDuelo: dueloRef.id, codigoDesafio: snippet });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Duelos Iniciar Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
