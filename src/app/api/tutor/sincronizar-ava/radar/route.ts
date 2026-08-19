import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
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

    // 1. Busca CourseWorks apenas para o curso especificado
    const atividadesDoCurso = [];
    let pageToken = undefined;
    
    // Para evitar que busque todo o histórico de anos, podemos limitar
    // Mas vamos buscar todos os ativos dessa turma
    do {
      const cwRes: unknown = await classroom.courses.courseWork.list({
        courseId: courseId,
        courseWorkStates: ["PUBLISHED"],
        pageToken: pageToken
      });
      
      const courseWorks = cwRes.data.courseWork || [];
      
      for (const cw of courseWorks) {
        if (!cw.alternateLink) continue;
        const linkCwNorm = String(cw.alternateLink).trim().split('?')[0].replace(/\/$/, "");
        
        atividadesDoCurso.push({
          idClassroom: cw.id,
          courseId: courseId,
          titulo: cw.title,
          descricao: cw.description || "",
          linkClassroom: cw.alternateLink,
          linkNorm: linkCwNorm,
          xpRecomendado: cw.maxPoints || 100,
          dataLimite: cw.dueDate ? `${cw.dueDate.day}/${cw.dueDate.month}/${cw.dueDate.year}` : "",
          creationTime: cw.creationTime
        });
      }
      
      pageToken = cwRes.data.nextPageToken;
    } while (pageToken);

    if (atividadesDoCurso.length === 0) {
      return NextResponse.json({ status: "sucesso", atividades: [] });
    }

    // 2. Extrai os links e verifica no Firebase usando lotes (chunking max 30 por query 'in')
    const linksCadastrados = new Set<string>();
    
    const chunkSize = 30;
    for (let i = 0; i < atividadesDoCurso.length; i += chunkSize) {
      const chunk = atividadesDoCurso.slice(i, i + chunkSize);
      const linksChunk = chunk.map(a => a.linkNorm);
      
      // Essa query é cirúrgica e gasta no MÁXIMO 30 leituras, em vez de milhares
      const atividadesSnap = await dbAdmin.collection("atividades")
        .where("linkClassroom", "in", linksChunk)
        .get();
        
      atividadesSnap.forEach(doc => {
        const linkReal = String(doc.data().linkClassroom).trim().split('?')[0].replace(/\/$/, "");
        linksCadastrados.add(linkReal);
      });
    }

    // 3. Filtra apenas as que não estão cadastradas
    const novasAtividades = atividadesDoCurso
      .filter(a => !linksCadastrados.has(a.linkNorm))
      .map(a => {
        // Remover linkNorm antes de mandar para o frontend
        const { linkNorm, ...resto } = a;
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
