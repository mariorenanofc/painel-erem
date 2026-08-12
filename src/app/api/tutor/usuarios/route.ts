import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET() {
  try {
    const snap = await dbAdmin.collection("usuarios").get();
    const usuarios = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ status: "sucesso", usuarios });
  } catch (error: any) {
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, usuario, senha, nome } = body;

    if (action === "adicionar") {
      const userId = String(usuario).trim().toLowerCase();
      await dbAdmin.collection("usuarios").doc(userId).set({
        usuario: userId,
        senha,
        nome,
        role: "admin"
      });
      return NextResponse.json({ status: "sucesso", mensagem: "Usuário adicionado." });
    }
    else if (action === "remover") {
      await dbAdmin.collection("usuarios").doc(id).delete();
      return NextResponse.json({ status: "sucesso", mensagem: "Usuário removido." });
    }

    return NextResponse.json({ status: "erro", mensagem: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}
