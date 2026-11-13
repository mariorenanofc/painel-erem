export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

interface VisualizarNovidadesPayload {
  matricula?: string;
  versao?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VisualizarNovidadesPayload;
    const matricula = (body.matricula || "").trim();
    const versao = (body.versao || "v2.2.1").trim();

    if (!matricula) {
      return NextResponse.json(
        { status: "erro", mensagem: "Matrícula é obrigatória." },
        { status: 400 }
      );
    }

    const telemetriaRef = dbAdmin.collection("metadata").doc("telemetria_novidades");

    // Registro idempotente usando FieldValue.arrayUnion (sem duplicatas)
    await telemetriaRef.set(
      {
        [versao]: {
          visualizados: FieldValue.arrayUnion(matricula),
          ultimaLeitura: new Date().toISOString()
        }
      },
      { merge: true }
    );

    return NextResponse.json({
      status: "sucesso",
      mensagem: "Visualização registrada com sucesso."
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[API Novidades Visualizar Error]:", err.message);
    return NextResponse.json(
      { status: "erro", mensagem: "Erro ao registrar visualização." },
      { status: 500 }
    );
  }
}

