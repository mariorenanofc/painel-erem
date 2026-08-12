import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { invalidateConfigCache, clearAllPortalCaches } from "@/src/lib/cache";

export async function GET() {
  try {
    const snap = await dbAdmin.collection("controle_modulos").get();
    const modulos = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { nomeMod?: string, statusMod?: string, turmaMod?: string }) }));
    // Sort by name
    modulos.sort((a, b) => String(a.nomeMod).localeCompare(String(b.nomeMod)));
    return NextResponse.json({ status: "sucesso", modulos });
  } catch (error: any) {
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, nomeMod, statusMod, turmaMod } = body;

    if (action === "adicionar") {
      const modId = `${nomeMod}_${turmaMod}`.replace(/\s+/g, '_').toLowerCase();
      await dbAdmin.collection("controle_modulos").doc(modId).set({
        id: modId,
        nomeMod,
        statusMod,
        turmaMod
      });
      clearAllPortalCaches();
      return NextResponse.json({ status: "sucesso", mensagem: "Módulo adicionado." });
    }
    else if (action === "atualizar_status") {
      await dbAdmin.collection("controle_modulos").doc(id).update({ statusMod });
      clearAllPortalCaches();
      return NextResponse.json({ status: "sucesso", mensagem: "Status atualizado." });
    }
    else if (action === "remover") {
      await dbAdmin.collection("controle_modulos").doc(id).delete();
      clearAllPortalCaches();
      return NextResponse.json({ status: "sucesso", mensagem: "Módulo removido." });
    }

    return NextResponse.json({ status: "erro", mensagem: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}
