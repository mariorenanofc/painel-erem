export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import {
  getCachedAniversarios,
  setCachedAniversarios,
  AniversarianteItem
} from "@/src/lib/cache";

/**
 * Formata o nome do estudante para exibir apenas o primeiro nome e o último sobrenome.
 * Trata agnomes (Filho, Neto, Junior, Sobrinho) para preservar a identificação familiar.
 * Ex: "MARIO RENAN FERREIRA FEITOSA" -> "Mario Feitosa"
 * Ex: "FRANCISCO MARIO ZAN BACURAU DE ALENCAR FILHO" -> "Francisco Alencar Filho"
 */
function formatarNomeAniversariante(nomeCompleto?: string | null): string {
  if (!nomeCompleto || !nomeCompleto.trim()) return "Estudante";
  const sufixosAgnomes = ["filho", "filha", "neto", "neta", "junior", "júnior", "sobrinho", "sobrinha"];
  const partes = nomeCompleto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));

  if (partes.length <= 1) return partes[0];
  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];

  if (partes.length >= 3 && sufixosAgnomes.includes(ultimo.toLowerCase())) {
    const penultimo = partes[partes.length - 2];
    return `${primeiro} ${penultimo} ${ultimo}`;
  }

  return `${primeiro} ${ultimo}`;
}

/**
 * Extrai dia e mês a partir de qualquer padrão comum de data
 */
function extrairDiaMes(dataStr?: string | null): { dia: number; mes: number } | null {
  if (!dataStr) return null;
  const s = String(dataStr).trim();

  // Padrão ISO: YYYY-MM-DD ou YYYY-MM-DDT...
  if (s.includes("-")) {
    const parts = s.split("T")[0].split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const dia = Number(parts[2]);
      const mes = Number(parts[1]);
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
        return { dia, mes };
      }
    }
  }

  // Padrão Brasileiro: DD/MM/YYYY
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length >= 2) {
      const dia = Number(parts[0]);
      const mes = Number(parts[1]);
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
        return { dia, mes };
      }
    }
  }

  return null;
}

export async function GET() {
  try {
    // 1. Verificar cache L1 em memória (24h de TTL)
    const cached = getCachedAniversarios();
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return NextResponse.json(
        { status: "sucesso", aniversariantes: cached },
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200"
          }
        }
      );
    }

    // 2. Tentar ler do Singleton metadata/aniversarios_alunos (1 leitura única no cold start)
    const metaRef = dbAdmin.collection("metadata").doc("aniversarios_alunos");
    const metaDoc = await metaRef.get();

    if (metaDoc.exists) {
      const data = metaDoc.data() as { aniversariantes?: AniversarianteItem[] };
      const lista = Array.isArray(data?.aniversariantes) ? data.aniversariantes : [];
      if (lista.length > 0) {
        setCachedAniversarios(lista);
        return NextResponse.json(
          { status: "sucesso", aniversariantes: lista },
          {
            headers: {
              "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200"
            }
          }
        );
      }
    }

    // 3. Fallback seguro: Primeira inicialização / geração do singleton a partir de 'alunos'
    console.log("[Firestore Query] Inicializando singleton de aniversariantes da escola...");
    const snap = await dbAdmin.collection("alunos").get();
    const listaGerada: AniversarianteItem[] = [];

    snap.forEach((doc) => {
      const aluno = doc.data();
      const dm = extrairDiaMes(aluno.dataNasc);
      if (dm) {
        listaGerada.push({
          dia: dm.dia,
          mes: dm.mes,
          nomeExibicao: formatarNomeAniversariante(aluno.nome)
        });
      }
    });

    // Ordenar cronologicamente por mês e dia
    listaGerada.sort((a, b) => {
      if (a.mes !== b.mes) return a.mes - b.mes;
      return a.dia - b.dia;
    });

    // Salvar singleton persistido para que próximas requisições façam apenas 1 leitura
    await metaRef.set({
      aniversariantes: listaGerada,
      totalAlunos: listaGerada.length,
      updatedAt: new Date().toISOString()
    });

    setCachedAniversarios(listaGerada);

    return NextResponse.json(
      { status: "sucesso", aniversariantes: listaGerada },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200"
        }
      }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[API Aniversarios Error]:", err.message);
    return NextResponse.json(
      { status: "erro", mensagem: "Falha ao carregar aniversariantes." },
      { status: 500 }
    );
  }
}

