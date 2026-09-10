import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Iniciando sincronização do portal_views...");
    const freqSnap = await dbAdmin.collection("frequencia").get();
    
    // Agrupar datas por matrícula
    const freqPorMatricula: Record<string, Set<string>> = {};
    
    freqSnap.forEach(doc => {
      const data = doc.data();
      const mat = data.matricula;
      const dataString = data.data; // ex: "26/08/2026"
      const status = String(data.status || "").toLowerCase().trim();
      const isPresenteOuJustificada = (data.xpGanho === 0 && data.justificativa) || status === "presente" || status === "p" || status === "justificada" || status === "j";

      if (mat && dataString && isPresenteOuJustificada) {
        if (!freqPorMatricula[mat]) freqPorMatricula[mat] = new Set();
        freqPorMatricula[mat].add(dataString);
      }
    });

    let batch = dbAdmin.batch();
    let cont = 0;

    for (const mat of Object.keys(freqPorMatricula)) {
      const datasArray = Array.from(freqPorMatricula[mat]);
      const ref = dbAdmin.collection("portal_views").doc(mat);
      
      batch.set(ref, { frequencias: datasArray }, { merge: true });
      cont++;

      if (cont % 400 === 0) {
         await batch.commit();
         batch = dbAdmin.batch();
      }
    }
    
    if (cont % 400 !== 0) {
      await batch.commit();
    }

    return NextResponse.json({
      status: "sucesso",
      mensagem: `Sincronizou frequências de ${cont} alunos no portal_views.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
