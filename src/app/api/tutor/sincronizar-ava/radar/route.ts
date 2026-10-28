import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { loadFirestoreCacheAtividades } from "@/src/lib/cache";
import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ status: "erro", mensagem: "courseId é obrigatório" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Variáveis Google ausentes no .env.local");
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    const classroom = google.classroom({ version: "v1", auth });

    // 1. Busca CourseWorks (Publicadas e Rascunhos) apenas para o curso especificado
    const atividadesDoCurso = [];
    let pageToken: string | undefined = undefined;

    do {
      const cwRes = await classroom.courses.courseWork.list({
        courseId: courseId,
        courseWorkStates: ["PUBLISHED", "DRAFT"],
        pageToken: pageToken
      }) as {
        data: {
          courseWork?: Array<{
            alternateLink?: string;
            id: string;
            title: string;
            description?: string;
            maxPoints?: number;
            dueDate?: { day: number; month: number; year: number };
            creationTime: string;
            state?: string;
          }>;
          nextPageToken?: string;
        };
      };

      const courseWorks = cwRes.data.courseWork || [];

      for (const cw of courseWorks) {
        const courseB64 = Buffer.from(String(courseId)).toString("base64").replace(/=+$/, "");
        const cwB64 = Buffer.from(String(cw.id)).toString("base64").replace(/=+$/, "");
        const linkFinal = cw.alternateLink || `https://classroom.google.com/c/${courseB64}/a/${cwB64}/details`;
        const linkCwNorm = String(linkFinal).trim().split("?")[0].replace(/\/$/, "");

        atividadesDoCurso.push({
          idClassroom: cw.id,
          courseId: courseId,
          titulo: cw.title,
          descricao: cw.description || "",
          linkClassroom: linkFinal,
          linkNorm: linkCwNorm,
          xpRecomendado: cw.maxPoints || 10,
          dataLimite: cw.dueDate ? `${cw.dueDate.day}/${cw.dueDate.month}/${cw.dueDate.year}` : "",
          creationTime: cw.creationTime,
          estadoClassroom: cw.state || "PUBLISHED"
        });
      }

      pageToken = cwRes.data.nextPageToken;
    } while (pageToken);

    if (atividadesDoCurso.length === 0) {
      return NextResponse.json({ status: "sucesso", atividades: [] });
    }

    // 2. Verifica links já cadastrados usando o Cache Particionado (0 a 7 leituras em vez de varrer coleção)
    const linksCadastrados = new Set<string>();
    const cachedAtividades = await loadFirestoreCacheAtividades(dbAdmin);

    if (cachedAtividades && Array.isArray(cachedAtividades.atividades)) {
      cachedAtividades.atividades.forEach(doc => {
        if (doc.linkClassroom) {
          const linkReal = String(doc.linkClassroom).trim().split("?")[0].replace(/\/$/, "");
          linksCadastrados.add(linkReal);
        }
      });
    } else {
      const chunkSize = 30;
      for (let i = 0; i < atividadesDoCurso.length; i += chunkSize) {
        const chunk = atividadesDoCurso.slice(i, i + chunkSize);
        const linksChunk = chunk.map(a => a.linkNorm);
        const atividadesSnap = await dbAdmin.collection("atividades")
          .where("linkClassroom", "in", linksChunk)
          .get();

        atividadesSnap.forEach(doc => {
          const linkReal = String(doc.data().linkClassroom).trim().split("?")[0].replace(/\/$/, "");
          linksCadastrados.add(linkReal);
        });
      }
    }

    // 3. Filtra apenas as que não estão cadastradas
    const novasAtividades = atividadesDoCurso
      .filter(a => !linksCadastrados.has(a.linkNorm))
      .map(a => {
        const { linkNorm: _linkNorm, ...resto } = a;
        void _linkNorm;
        return resto;
      });

    // Ordenar pelas mais recentes
    novasAtividades.sort((a, b) => new Date(b.creationTime || 0).getTime() - new Date(a.creationTime || 0).getTime());

    return NextResponse.json({ status: "sucesso", atividades: novasAtividades });
  } catch (error: unknown) {
    console.error("Erro Radar Classroom (Curso Especifico):", error);
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message }, { status: 500 });
  }
}
