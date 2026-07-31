import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function POST(request: Request) {
  let matricula = "";
  let avatarId = "";
  try {
    const body = await request.json();
    matricula = String(body.matricula || "").trim();
    avatarId = String(body.avatarId || "").trim();

    if (!matricula || !avatarId) {
      return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const doc = await alunoRef.get();
    if (!doc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." });
    }

    const now = Date.now();
    await alunoRef.update({
      avatarId,
      lastUpdated: now
    });

    invalidatePortalCache(matricula);
    invalidateRankingCache();
    return NextResponse.json({ status: "sucesso", mensagem: "Avatar atualizado!" });
  } catch (error: any) {
    console.warn("[Failover] Erro ao salvar avatar no Firestore:", error.message);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "salvar_avatar", matricula, avatarId }),
        });
        return NextResponse.json(await response.json());
      } catch (sheetsErr) {}
    }
    return NextResponse.json({ status: "erro", mensagem: "Erro ao salvar avatar: " + error.message }, { status: 500 });
  }
}
