import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
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

    const { rascunho } = await request.json();

    if (!rascunho || typeof rascunho !== "string") {
      return NextResponse.json(
        { status: "erro", mensagem: "Rascunho inválido ou vazio." },
        { status: 400 }
      );
    }

    const prompt = `
Você é o desenvolvedor super empolgado e redator de "Release Notes" de uma plataforma educacional chamada TrilhaTech.
Sua missão é pegar um rascunho simples do que foi feito e transformá-lo num texto de atualização em formato Markdown altamente engajador, formatado e visualmente incrível para os alunos.

RASCUNHO DO TUTOR:
"${rascunho}"

REGRAS DE FORMATAÇÃO (MARKDOWN):
1. O texto DEVE ser em Markdown padrão da web.
2. É ESTRITAMENTE PROIBIDO usar código HTML (nada de <div>, <span>, etc). Use apenas Markdown nativo.
3. Não crie um título grande # (Header 1) no início, pois a própria janela do Modal já terá o título principal "NOVIDADES".
4. Use subtítulos ### com emojis para organizar os blocos (ex: "### 🎨 Novo Visual Premium").
5. Use **negrito** e *itálico* livremente.
6. Use listas (bullet points) ou parágrafos fluidos.
7. Adicione uma mensagem final épica e motivacional para os alunos explorarem a plataforma.

INSTRUÇÕES DE TOM:
- Gamificado, empolgante, tecnológico e juvenil.
- Transforme correções de bugs chatas em "Desarmamos armadilhas de XP", etc.
- Faça o aluno sentir que a plataforma está viva e em constante evolução.
`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    return NextResponse.json({
      status: "sucesso",
      mensagem: response.text,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao gerar novidades com IA:", err);
    return NextResponse.json(
      { status: "erro", mensagem: "Erro ao gerar as novidades com a IA. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
