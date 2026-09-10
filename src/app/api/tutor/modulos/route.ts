import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { clearAllPortalCaches } from "@/src/lib/cache";

export async function GET() {
  try {
    const snap = await dbAdmin.collection("controle_modulos").get();
    const modulos = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { nomeMod?: string, statusMod?: string, turmaMod?: string }) }));
    // Sort by name
    modulos.sort((a, b) => String(a.nomeMod).localeCompare(String(b.nomeMod)));
    return NextResponse.json({ status: "sucesso", modulos }, {
      headers: {
        "Cache-Control": "s-maxage=15, stale-while-revalidate"
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message }, { status: 500 });
  }
}

async function rebuildModulosSingleton() {
  const snap = await dbAdmin.collection("controle_modulos").get();
  const modulos = snap.docs.map(doc => doc.data());
  await dbAdmin.collection("cache").doc("modulos_gerais").set({
    modulos,
    updatedAt: new Date().toISOString()
  });
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
      await rebuildModulosSingleton();
      clearAllPortalCaches();
      return NextResponse.json({ status: "sucesso", mensagem: "Módulo adicionado." });
    }
    else if (action === "atualizar_status") {
      await dbAdmin.collection("controle_modulos").doc(id).update({ statusMod });
      await rebuildModulosSingleton();
      clearAllPortalCaches();
      return NextResponse.json({ status: "sucesso", mensagem: "Status atualizado." });
    }
    else if (action === "remover") {
      await dbAdmin.collection("controle_modulos").doc(id).delete();
      await rebuildModulosSingleton();
      clearAllPortalCaches();
      return NextResponse.json({ status: "sucesso", mensagem: "Módulo removido." });
    }

    return NextResponse.json({ status: "erro", mensagem: "Ação inválida." }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ status: "erro", mensagem: (error as Error).message }, { status: 500 });
  }
}
