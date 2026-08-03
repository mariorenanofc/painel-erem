import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { fetchSheetsQueued } from "@/src/lib/sheetsQueue";

interface TutorAtividade {
  id: string;
  titulo: string;
  descricao: string;
  dataLimite: string;
  xp: number;
  turmaAlvo: string;
  tipo: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  respostaCorreta: string;
  linkClassroom: string;
  statusPublicacao: string;
  imagemUrl: string;
  modulo: string;
  gabarito: string;
  gabaritoLiberado: boolean;
  pendentes: number;
  aguardandoValidacao: number;
  validadasAVA: number;
  statusModulo: string;
}

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filtroTurma = searchParams.get("filtroTurma") || "Todas";
  const filtroTipo = searchParams.get("filtroTipo") || "Todos";

  try {
    // 1. Buscar Atividades
    const ativSnap = await dbAdmin.collection("atividades").get();

    // 2. Buscar Módulos de Controle
    const modSnap = await dbAdmin.collection("modulos").get();
    const statusModulosMap: Record<string, string> = {};
    const listaModulos: string[] = [];
    modSnap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const nomeMod = String(data.nome || doc.id.split("|")[0]).trim();
      const statusMod = String(data.status || "Aberto").trim();
      const turmaMod = String(data.turma || doc.id.split("|")[1] || "Todas").trim();
      statusModulosMap[`${nomeMod}|${turmaMod}`] = statusMod;
      if (!listaModulos.includes(nomeMod)) {
        listaModulos.push(nomeMod);
      }
    });

    // 3. Obter Estatísticas Consolidadas (Contadores de Agregação)
    const statsSnap = await dbAdmin.collection("estatisticas_atividades").get();
    const statsMap: Record<string, { pendentes: number; aguardandoValidacao: number; validadasAVA: number }> = {};

    statsSnap.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      statsMap[doc.id] = {
        pendentes: Number(data.pendentes) || 0,
        aguardandoValidacao: Number(data.aguardandoValidacao) || 0,
        validadasAVA: Number(data.validadasAVA) || 0
      };
    });

    const atividades: TutorAtividade[] = [];
    ativSnap.forEach((doc: QueryDocumentSnapshot) => {
      const d = doc.data();
      const idAtiv = doc.id;
      const turmaAtiv = String(d.turmaAlvo || "Todas").trim();
      const tipoAtiv = String(d.tipo || "Projeto").trim();

      // Aplicar Filtros
      if (filtroTurma !== "Todas" && turmaAtiv !== "Todas" && turmaAtiv !== filtroTurma) return;
      if (filtroTipo !== "Todos" && tipoAtiv !== filtroTipo) return;

      const dataLimiteStr = d.dataLimite || "";
      const nomeModulo = String(d.modulo || "Geral").trim();
      const stats = statsMap[idAtiv] || { pendentes: 0, aguardandoValidacao: 0, validadasAVA: 0 };

      atividades.push({
        id: idAtiv,
        titulo: String(d.titulo || ""),
        descricao: String(d.descricao || ""),
        dataLimite: dataLimiteStr,
        xp: Number(d.xp) || 0,
        turmaAlvo: turmaAtiv,
        tipo: tipoAtiv,
        opcaoA: String(d.opcaoA || ""),
        opcaoB: String(d.opcaoB || ""),
        opcaoC: String(d.opcaoC || ""),
        opcaoD: String(d.opcaoD || ""),
        respostaCorreta: String(d.respostaCorreta || "A"),
        linkClassroom: String(d.linkClassroom || ""),
        statusPublicacao: String(d.statusPublicacao || "Publicada").trim(),
        imagemUrl: String(d.imageUrl || ""),
        modulo: nomeModulo,
        gabarito: String(d.gabarito || ""),
        gabaritoLiberado: d.gabaritoLiberado === true,
        pendentes: stats.pendentes,
        aguardandoValidacao: stats.aguardandoValidacao,
        validadasAVA: stats.validadasAVA,
        statusModulo: statusModulosMap[`${nomeModulo}|${turmaAtiv}`] || statusModulosMap[`${nomeModulo}|Todas`] || "Aberto"
      });
    });

    return NextResponse.json({
      status: "sucesso",
      atividades,
      modulosMatriz: listaModulos
    }, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao buscar atividades do tutor no Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
