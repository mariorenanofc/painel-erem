import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { getCachedVeteranos, setCachedVeteranos } from "@/src/lib/cache";
import { QueryDocumentSnapshot, DocumentSnapshot } from "firebase-admin/firestore";
import { MemorialFormatura, CertificacaoTech, ProjetoConclusao } from "@/src/types";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

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
  parecerTutor?: string;
  projetoDestaque?: ProjetoConclusao;
  linkedinUrl?: string;
  githubUrl?: string;
  projetosConcluidos?: number;
  totalAplausos?: number;
  publicadoNoHall?: boolean;
  curadoriaEstrita?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nocache = searchParams.get("nocache") === "true";

    if (!nocache) {
      const cached = getCachedVeteranos() as VeteranoResposta[] | null;
      if (cached && (cached.length === 0 || cached[0]?.curadoriaEstrita === true)) {
        return NextResponse.json({ status: "sucesso", veteranos: cached, fromCache: true });
      }
    }

    // Regra Soberana do Tutor (.agents/AGENTS.md):
    // APENAS alunos com memorialFormatura.publicadoNoHall === true aparecem na vitrine pública!
    const snapPublicados = await dbAdmin
      .collection("alunos")
      .where("memorialFormatura.publicadoNoHall", "==", true)
      .get();

    const docs: DocumentSnapshot[] = snapPublicados.docs.filter((doc: QueryDocumentSnapshot) => {
      const d = doc.data();
      return d.memorialFormatura?.publicadoNoHall === true;
    });

    if (docs.length === 0) {
      setCachedVeteranos([]);
      return NextResponse.json({ status: "sucesso", veteranos: [] });
    }

    // Buscar portal_views para sincronizar badges e fotos
    const portalViewsSnaps = await Promise.all(
      docs.map(doc => dbAdmin.collection("portal_views").doc(doc.id).get())
    );

    const veteranos: VeteranoResposta[] = [];

    docs.forEach((doc: DocumentSnapshot, i: number) => {
      const data = doc.data() || {};
      const portal = portalViewsSnaps[i].exists ? (portalViewsSnaps[i].data() || {}) : {};
      const memorial = (data.memorialFormatura || {}) as Partial<MemorialFormatura>;

      // Dupla trava: se publicadoNoHall não for estritamente true, ignora
      if (memorial.publicadoNoHall !== true) return;

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
        parecerTutor: memorial.parecerTutor || "",
        projetoDestaque: memorial.projetoDestaque,
        linkedinUrl: memorial.linkedinUrl || "",
        githubUrl: memorial.githubUrl || "",
        projetosConcluidos: memorial.projetoDestaque?.titulo ? 1 : 0,
        totalAplausos: Number(memorial.totalAplausos) || 0,
        publicadoNoHall: true,
        curadoriaEstrita: true
      });
    });

    setCachedVeteranos(veteranos);

    return NextResponse.json({ status: "sucesso", veteranos });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Veteranos API] Erro ao buscar formandos:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
