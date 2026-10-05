import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export const revalidate = 60; // Cache 1 min
export const maxDuration = 10;

export async function GET() {
  try {
    const snap = await dbAdmin.collection("alunos").where("statusTrilha", "==", "Veterano").get();
    
    // Precisamos buscar as infos de portal_views para badges e avatar
    const matriculas = snap.docs.map(d => d.id);
    const veteranos: Array<{ matricula: string; nome: string; avatar: string; badges: string[]; anoFormacao: number; xpFinal: number; nivelFinal: string }> = [];
    
    // Buscar em chunks de 10 se fosse maior, mas assumimos menos veteranos ou usamos promise all
    const portalViewsPromises = snap.docs.map(doc => 
       dbAdmin.collection("portal_views").doc(doc.id).get()
    );
    
    const portalViewsSnaps = await Promise.all(portalViewsPromises);
    
    snap.docs.forEach((doc: QueryDocumentSnapshot, i: number) => {
       const data = doc.data();
       const portal = portalViewsSnaps[i].exists ? portalViewsSnaps[i].data() : {};
       
       const historico = Array.isArray(data.historicoAnual) ? data.historicoAnual : [];
       const ultimoHistorico = historico.length > 0 ? historico[historico.length - 1] : null;
       
       veteranos.push({
         matricula: doc.id,
         nome: data.nome || "Veterano",
         avatar: portal?.avatar || "default-avatar.png",
         badges: portal?.badges || [],
         anoFormacao: ultimoHistorico?.ano || new Date().getFullYear(),
         xpFinal: ultimoHistorico?.xp || 0,
         nivelFinal: ultimoHistorico?.nivel || "Formado"
       });
    });

    return NextResponse.json({ status: "sucesso", veteranos });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
