import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticação
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("tutor_session");
    if (!sessionCookie || sessionCookie.value !== "active") {
      return NextResponse.json(
        { status: "erro", mensagem: "Não autorizado." },
        { status: 403 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { status: "erro", mensagem: "Chave GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    // 2. Extrair dados da requisição
    const { top10, turma, tipo } = await request.json();

    if (!top10 || !Array.isArray(top10) || top10.length === 0) {
      return NextResponse.json(
        { status: "erro", mensagem: "Lista de alunos inválida ou vazia." },
        { status: 400 }
      );
    }

    // 3. Montar o prompt contextual
    const tituloTipo = tipo === "mensal" ? "MENSAL" : "SEMANAL";
    let alunosText = "";
    top10.forEach((aluno: { posicao: number; nome: string; xp: number; xpBonus: number }) => {
      alunosText += `- ${aluno.posicao}º lugar: ${aluno.nome} (${aluno.xp} XP acumulado). Prêmio ganho: ${aluno.xpBonus > 0 ? "+" + aluno.xpBonus + " XP" : "Brinde Físico"}\n`;
    });

    const prompt = `
Você é o assistente virtual gamificado e empolgante de uma plataforma educacional de tecnologia (TrilhaTech).
A sua missão é redigir uma mensagem de WhatsApp para anunciar os ganhadores do Fechamento de Ciclo ${tituloTipo} da turma "${turma}".

Aqui estão os alunos vencedores (TOP 10):
${alunosText}

REGRAS ESTABELECIDAS DE FORMATAÇÃO (OBRIGATÓRIO):
1. O texto DEVE usar APENAS a formatação do WhatsApp. 
2. Para negrito, use apenas UM asterisco: *texto* (NUNCA use **texto**).
3. Para itálico, use apenas UM underline: _texto_ (NUNCA use *texto* como itálico).
4. É ESTRITAMENTE PROIBIDO usar formatações Markdown da web como cabeçalhos (###), listas ordenadas (1.), linhas horizontais (---) ou blocos de código (\`\`\`).
5. Não crie placeholders, o texto deve estar pronto para copiar e colar no grupo.

INSTRUÇÕES PARA O CONTEÚDO:
- Seja extremamente animado, motivacional e use gírias do universo gamer e tech (ex: "consistência", "farmar XP", "foco", "subir de nível").
- Inclua emojis vibrantes (🏆, 🚀, 🔥, 💻, 🥇, 🥈, 🥉).
- Separe em blocos de fácil leitura: Introdução, *O Pódio* (1º, 2º e 3º lugares com mais ênfase) e o restante do *Top 10* ou Elite.
- O 1º lugar recebe um prêmio maior e deve ser parabenizado de forma especial.
- Finalize com uma frase chamando os outros alunos para o próximo ciclo, dizendo que o XP zera (no ciclo) e qualquer um pode entrar na elite na próxima vez.
`;

    // 4. Chamar a API do Gemini
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const mensagemGerada = response.text;

    return NextResponse.json({
      status: "sucesso",
      mensagem: mensagemGerada,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao gerar mensagem com IA:", err);
    return NextResponse.json(
      { status: "erro", mensagem: "Erro ao gerar a mensagem com a IA. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
