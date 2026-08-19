import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Variáveis Google ausentes no .env.local");
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    const classroom = google.classroom({ version: "v1", auth });

    // Busca apenas os cursos ativos
    const coursesRes = await classroom.courses.list({ courseStates: ["ACTIVE"] });
    const courses = coursesRes.data.courses || [];

    const cursosFormatados = courses.map((c) => ({
      id: c.id,
      nome: c.name,
      section: c.section || "",
    }));

    return NextResponse.json({ status: "sucesso", cursos: cursosFormatados });
  } catch (error: unknown) {
    console.error("Erro ao buscar cursos do Classroom:", error);
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}
