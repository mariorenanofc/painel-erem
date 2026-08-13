import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getCachedTutorAtividades, setCachedTutorAtividades } from "@/src/lib/cache";
import { cookies } from "next/headers";

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
  resolucaoTyping?: string;
  limiteTempoTyping?: number;
  pendentes: number;
  aguardandoValidacao: number;
  validadasAVA: number;
  statusModulo: string;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tutor_session");
  if (!sessionCookie || sessionCookie.value !== "active") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filtroTurma = searchParams.get("filtroTurma") || "Todas";
  const filtroTipo = searchParams.get("filtroTipo") || "Todos";
  const nocache = searchParams.get("nocache") === "true";

  if (!nocache) {
    const cached = getCachedTutorAtividades(filtroTurma, filtroTipo);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate"
        }
      });
    }
  }

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

      const rawDataLimite = d.dataLimite || "";
      let dataLimiteStr = rawDataLimite;
      if (rawDataLimite.includes("T")) {
        const parts = rawDataLimite.split("T")[0].split("-");
        if (parts.length === 3) dataLimiteStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (rawDataLimite.includes("-")) {
        const parts = rawDataLimite.split("-");
        if (parts.length === 3 && parts[0].length === 4) dataLimiteStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
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
        linkClassroom: String(d.links_ava || d.link || d.linkClassroom || ""),
        statusPublicacao: String(d.statusPublicacao || "Publicada").trim(),
        imagemUrl: String(d.imageUrl || ""),
        modulo: nomeModulo,
        gabarito: String(d.gabarito || ""),
        gabaritoLiberado: d.gabaritoLiberado === true,
        resolucaoTyping: String(d.resolucaoTyping || ""),
        limiteTempoTyping: Number(d.limiteTempoTyping) || 0,
        pendentes: stats.pendentes,
        aguardandoValidacao: stats.aguardandoValidacao,
        validadasAVA: stats.validadasAVA,
        statusModulo: statusModulosMap[`${nomeModulo}|${turmaAtiv}`] || statusModulosMap[`${nomeModulo}|Todas`] || "Aberto"
      });
    });

    const result = {
      status: "sucesso",
      atividades,
      modulosMatriz: listaModulos
    };

    if (!nocache) {
      setCachedTutorAtividades(filtroTurma, filtroTipo, result);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Error] Erro ao buscar atividades do tutor no Firestore: ${err.message}`);
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
