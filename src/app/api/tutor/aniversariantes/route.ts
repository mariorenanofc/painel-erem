import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL;
const TUTOR_TOKEN = process.env.NEXT_PUBLIC_TUTOR_TOKEN;

export async function GET() {
  try {
    const hoje = new Date();
    // Usa fuso horário oficial de Brasília
    const options = { timeZone: "America/Sao_Paulo", day: "2-digit" as const, month: "2-digit" as const };
    const formatter = new Intl.DateTimeFormat("pt-BR", options);
    const parts = formatter.formatToParts(hoje);
    const diaBuscado = parts.find(p => p.type === "day")?.value || String(hoje.getDate()).padStart(2, "0");
    const mesBuscado = parts.find(p => p.type === "month")?.value || String(hoje.getMonth() + 1).padStart(2, "0");

    const activeSnap = await dbAdmin.collection("alunos").where("statusTrilha", "==", "ativo").get();
    const list: { nome: string; turma: string }[] = [];

    activeSnap.forEach((doc: QueryDocumentSnapshot) => {
      const d = doc.data();
      const dataNasc = String(d.dataNasc || "").trim();
      let match = false;
      if (dataNasc.includes("-")) {
        const p = dataNasc.split("T")[0].split("-");
        if (p.length === 3 && p[2] === diaBuscado && p[1] === mesBuscado) {
          match = true;
        }
      } else if (dataNasc.includes("/")) {
        const p = dataNasc.split("/");
        if (p.length === 3 && p[0] === diaBuscado && p[1] === mesBuscado) {
          match = true;
        }
      }
      if (match) {
        list.push({
          nome: String(d.nome || ""),
          turma: String(d.turma || d.turmaTrilha || "")
        });
      }
    });

    return NextResponse.json({ status: "sucesso", aniversariantes: list });
  } catch (error: unknown) {
    const err = error as Error;
    console.warn(`[Failover] Erro ao buscar aniversariantes no Firestore: ${err.message}. Redirecionando para Google Sheets...`);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "buscar_aniversariantes_dia", token: TUTOR_TOKEN }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } catch (sheetsErr: unknown) {
        const sErr = sheetsErr as Error;
        return NextResponse.json({ status: "erro", error: "Erro em ambos os bancos: " + sErr.message }, { status: 500 });
      }
    }
    return NextResponse.json({ status: "erro", error: err.message }, { status: 500 });
  }
}
