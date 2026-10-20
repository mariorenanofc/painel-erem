import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { QueryDocumentSnapshot, DocumentSnapshot } from "firebase-admin/firestore";
import { MemorialFormatura, CertificacaoTech } from "@/src/types";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const MATRICULAS_LENDAS_OFICIAIS = [
  "3756187", // Kelly
  "3826087", // Breno
  "3183600", // Anna
  "3826381", // Otavio
  "2908059", // Wendel
  "3116928", // Gustavo
  "3763451", // Samara
  "2950897"  // Hellen
];

interface VeteranoResposta {
  matricula: string;
  nome: string;
  avatar: string;
  badges: string[];
  anoFormacao: number;
  xpFinal: number;
  nivelFinal: string;
  apelido?: string;
  especialidade?: string;
  fraseFormatura?: string;
  techStack?: string[];
  destaque?: string;
  projetosConcluidos?: number;
  totalAplausos?: number;
  publicadoNoHall?: boolean;
}

export async function GET() {
  try {
    // Busca alunos com status Veterano
    const snapVeteranos = await dbAdmin.collection("alunos").where("statusTrilha", "==", "Veterano").get();

    // Também busca alunos que já foram marcados com publicadoNoHall no memorial
    const snapPublicados = await dbAdmin.collection("alunos").where("memorialFormatura.publicadoNoHall", "==", true).get();

    // Consolida mapa por matrícula para evitar duplicações
    const docsMap = new Map<string, DocumentSnapshot>();
    snapVeteranos.docs.forEach((doc: QueryDocumentSnapshot) => docsMap.set(doc.id, doc));
    snapPublicados.docs.forEach((doc: QueryDocumentSnapshot) => docsMap.set(doc.id, doc));

    // Fallback de segurança para garantir a listagem das lendas oficiais do curso
    if (docsMap.size === 0) {
      const lendasSnaps = await Promise.all(
        MATRICULAS_LENDAS_OFICIAIS.map(m => dbAdmin.collection("alunos").doc(m).get())
      );
      lendasSnaps.forEach(docSnap => {
        if (docSnap.exists) {
          docsMap.set(docSnap.id, docSnap);
        }
      });
    }

    const docs = Array.from(docsMap.values());

    // Buscar portal_views para sincronizar badges e fotos
    const portalViewsSnaps = await Promise.all(
      docs.map(doc => dbAdmin.collection("portal_views").doc(doc.id).get())
    );

    const veteranos: VeteranoResposta[] = [];

    docs.forEach((doc: DocumentSnapshot, i: number) => {
      const data = doc.data() || {};
      const portal = portalViewsSnaps[i].exists ? (portalViewsSnaps[i].data() || {}) : {};
      const memorial = (data.memorialFormatura || {}) as Partial<MemorialFormatura>;

      const historico = Array.isArray(data.historicoAnual) ? data.historicoAnual : [];
      const ultimoHistorico = historico.length > 0 ? historico[historico.length - 1] : null;

      const anoFormacao = memorial.anoFormacao || ultimoHistorico?.ano || new Date().getFullYear();
      const xpFinal = memorial.xpFinal || ultimoHistorico?.xp || Number(portal.xpTotal) || Number(data.xp) || 0;
      const nivelFinal = memorial.nivelFinal || ultimoHistorico?.nivel || (portal.nivel as string) || "Dev Supremo";

      // Badges: junta badges do portal com as badges conquistadas nos questionários do memorial
      const badgesBase: string[] = Array.isArray(portal.badges) ? [...portal.badges] : [];
      const certificacoes: CertificacaoTech[] = Array.isArray(memorial.certificacoesTech) ? memorial.certificacoesTech : [];
      
      // Tecnologias de domínio: APENAS tecnologias com teste realizado e nota >= 7
      const techStackAprovada: string[] = certificacoes
        .filter(c => c.aprovado && Number(c.nota) >= 7)
        .map(c => c.tech);

      // Adiciona as badges concedidas nas certificações aprovadas
      certificacoes.filter(c => c.aprovado && c.badgeConcedida).forEach(c => {
        if (!badgesBase.includes(c.badgeConcedida)) {
          badgesBase.unshift(c.badgeConcedida);
        }
      });

      // Foto prioritária: fotoUrl do memorial -> avatar do portal -> dicebear
      const avatarFinal = memorial.fotoUrl || (portal.avatar as string) || `https://api.dicebear.com/9.x/bottts/svg?seed=${doc.id}`;

      // Mensagem de reflexão: apenas se o aluno tiver redigido e salvo no perfil
      const fraseFormatura = typeof memorial.fraseFormatura === "string" ? memorial.fraseFormatura.trim() : "";

      veteranos.push({
        matricula: doc.id,
        nome: data.nome || "Formando Tech",
        avatar: avatarFinal,
        badges: badgesBase,
        anoFormacao,
        xpFinal,
        nivelFinal,
        especialidade: memorial.especialidadeOficial || "Desenvolvedor de Software",
        fraseFormatura,
        techStack: techStackAprovada,
        destaque: memorial.seloHonorifico || "Lenda da Trilha Tech",
        projetosConcluidos: memorial.projetoDestaque?.titulo ? 1 : 0,
        totalAplausos: Number(memorial.totalAplausos) || 0,
        publicadoNoHall: memorial.publicadoNoHall ?? true
      });
    });

    return NextResponse.json({ status: "sucesso", veteranos });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Veteranos API] Erro ao buscar formandos:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
