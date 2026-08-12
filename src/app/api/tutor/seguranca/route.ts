import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";

export async function GET() {
  try {
    // Get the last 100 security logs, sorted by timestamp descending
    const snap = await dbAdmin.collection("logs_seguranca")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
    
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ status: "sucesso", logs });
  } catch (error: any) {
    return NextResponse.json({ status: "erro", mensagem: error.message }, { status: 500 });
  }
}
