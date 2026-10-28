import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { FieldValue, QueryDocumentSnapshot, DocumentSnapshot } from "firebase-admin/firestore";
import {
  invalidatePortalCache,
  invalidateVeteranosCache,
  invalidateAdminAlunosCache,
  invalidateRankingCache,
  refreshAlunosAtivosSnapshot
} from "@/src/lib/cache";
import { MemorialFormatura, ProjetoConclusao, CertificacaoTech } from "@/src/types";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export interface AlunoCuradoriaItem {
  matricula: string;
  nome: string;
  turmaTrilha: string;
  statusTrilha: string;
  avatar: string;
  xpAtual: number;
  nivelAtual: string;
  badges: string[];
  temRascunho: boolean;
  memorial: MemorialFormatura;
}

export async function GET() {
  try {
    // Busca alunos Veteranos e alunos da Turma 2 (2º Ano / Formandos) ou que já tenham memorial
    const [snapVeteranos, snapTurma2, snapComMemorial] = await Promise.all([
      dbAdmin.collection("alunos").where("statusTrilha", "==", "Veterano").get(),
      dbAdmin.collection("alunos").where("turmaTrilha", "==", "Turma 2 - 2º Ano").get(),
      dbAdmin.collection("alunos").where("memorialFormatura.publicadoNoHall", "in", [true, false]).get()
    ]);

    const docsMap = new Map<string, DocumentSnapshot>();
    snapVeteranos.docs.forEach((d: QueryDocumentSnapshot) => docsMap.set(d.id, d));
    snapTurma2.docs.forEach((d: QueryDocumentSnapshot) => docsMap.set(d.id, d));
    snapComMemorial.docs.forEach((d: QueryDocumentSnapshot) => docsMap.set(d.id, d));

    const docs = Array.from(docsMap.values());

    // Busca portal_views correspondentes em paralelo
    const portalSnaps = await Promise.all(
      docs.map(d => dbAdmin.collection("portal_views").doc(d.id).get())
    );

    const candidatos: AlunoCuradoriaItem[] = [];

    docs.forEach((doc: DocumentSnapshot, index: number) => {
      const data = doc.data() || {};
      const statusTrilha = String(data.statusTrilha || "Ativo");
      if (statusTrilha === "Inativo") return;

      const portal = portalSnaps[index].exists ? (portalSnaps[index].data() || {}) : {};
      const memSalvo = (data.memorialFormatura || {}) as Partial<MemorialFormatura>;

      const historico = Array.isArray(data.historicoAnual) ? data.historicoAnual : [];
      const ultimoHistorico = historico.length > 0 ? historico[historico.length - 1] : null;

      const xpAtual = memSalvo.xpFinal || ultimoHistorico?.xp || Number(portal.xpTotal) || Number(data.xp) || 0;
      const nivelAtual = memSalvo.nivelFinal || ultimoHistorico?.nivel || (portal.nivel as string) || "Iniciante";
      const avatar = memSalvo.fotoUrl || (portal.avatar as string) || `https://api.dicebear.com/9.x/bottts/svg?seed=${doc.id}`;
      const badges: string[] = Array.isArray(portal.badges) ? [...portal.badges] : [];

      const certificacoesTech: CertificacaoTech[] = Array.isArray(memSalvo.certificacoesTech)
        ? memSalvo.certificacoesTech
        : [];

      const techStackAprovada = certificacoesTech
        .filter(c => c.aprovado && Number(c.nota) >= 7)
        .map(c => c.tech);

      const projetoDestaque: ProjetoConclusao = memSalvo.projetoDestaque || {
        titulo: "",
        descricao: "",
        linkDeploy: "",
        linkGithub: "",
        aprovadoPeloTutor: false
      };

      const temRascunho = Boolean(
        (memSalvo.fraseFormatura && memSalvo.fraseFormatura.trim() !== "") ||
        (projetoDestaque.titulo && projetoDestaque.titulo.trim() !== "") ||
        certificacoesTech.length > 0
      );

      const memorialCompleto: MemorialFormatura = {
        fraseFormatura: memSalvo.fraseFormatura || "",
        techStack: techStackAprovada.length > 0 ? techStackAprovada : (Array.isArray(memSalvo.techStack) ? memSalvo.techStack : []),
        fotoUrl: avatar,
        certificacoesTech,
        projetoDestaque,
        linkedinUrl: memSalvo.linkedinUrl || "",
        githubUrl: memSalvo.githubUrl || "",
        especialidadeOficial: memSalvo.especialidadeOficial || "",
        seloHonorifico: memSalvo.seloHonorifico || "",
        parecerTutor: memSalvo.parecerTutor || "",
        publicadoNoHall: Boolean(memSalvo.publicadoNoHall),
        anoFormacao: memSalvo.anoFormacao || ultimoHistorico?.ano || new Date().getFullYear(),
        xpFinal: memSalvo.xpFinal || xpAtual,
        nivelFinal: memSalvo.nivelFinal || nivelAtual,
        totalAplausos: Number(memSalvo.totalAplausos) || 0,
        dataGraduacao: memSalvo.dataGraduacao
      };

      candidatos.push({
        matricula: doc.id,
        nome: String(data.nome || "Estudante"),
        turmaTrilha: String(data.turmaTrilha || data.turma || "Turma 2 - 2º Ano"),
        statusTrilha,
        avatar,
        xpAtual,
        nivelAtual,
        badges,
        temRascunho,
        memorial: memorialCompleto
      });
    });

    // Ordena: primeiro quem enviou rascunho e aguarda publicação, depois publicados, depois por XP
    candidatos.sort((a, b) => {
      if (a.temRascunho && !a.memorial.publicadoNoHall && (!b.temRascunho || b.memorial.publicadoNoHall)) return -1;
      if (b.temRascunho && !b.memorial.publicadoNoHall && (!a.temRascunho || a.memorial.publicadoNoHall)) return 1;
      if (a.memorial.publicadoNoHall !== b.memorial.publicadoNoHall) {
        return a.memorial.publicadoNoHall ? -1 : 1;
      }
      return b.xpAtual - a.xpAtual;
    });

    return NextResponse.json({
      status: "sucesso",
      candidatos
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Curadoria Hall API] Erro no GET:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matricula = String(body.matricula || "").trim();

    if (!matricula) {
      return NextResponse.json({ status: "erro", mensagem: "Matrícula do formando é obrigatória." }, { status: 400 });
    }

    const especialidadeOficial = String(body.especialidadeOficial || "").trim();
    const seloHonorifico = String(body.seloHonorifico || "").trim();
    const parecerTutor = String(body.parecerTutor || "").trim();
    const aprovadoProjeto = Boolean(body.aprovadoProjeto);
    const publicadoNoHall = Boolean(body.publicadoNoHall);
    const graduarComoVeterano = Boolean(body.graduarComoVeterano);
    const anoFormacaoInput = Number(body.anoFormacao) || new Date().getFullYear();

    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const portalRef = dbAdmin.collection("portal_views").doc(matricula);

    const [alunoSnap, portalSnap] = await Promise.all([alunoRef.get(), portalRef.get()]);

    if (!alunoSnap.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado no banco de dados." }, { status: 404 });
    }

    const alunoData = alunoSnap.data() || {};
    const portalData = portalSnap.exists ? (portalSnap.data() || {}) : {};
    const memorialExistente = (alunoData.memorialFormatura || {}) as Partial<MemorialFormatura>;

    // Regra de Imutabilidade de Veterano (.agents/AGENTS.md):
    // Se o aluno já possui xpFinal e nivelFinal congelados como Veterano, preserva-os!
    const jaEraVeterano = alunoData.statusTrilha === "Veterano" && Boolean(memorialExistente.xpFinal);
    const xpCongelado = jaEraVeterano
      ? Number(memorialExistente.xpFinal)
      : (Number(memorialExistente.xpFinal) || Number(portalData.xpTotal) || Number(alunoData.xp) || 0);
    const nivelCongelado = jaEraVeterano
      ? String(memorialExistente.nivelFinal || "Dev Supremo")
      : String(memorialExistente.nivelFinal || portalData.nivel || "Dev Supremo");

    const projetoExistente: ProjetoConclusao = memorialExistente.projetoDestaque || {
      titulo: "",
      descricao: "",
      linkDeploy: "",
      linkGithub: "",
      aprovadoPeloTutor: false
    };

    const projetoAtualizado: ProjetoConclusao = {
      ...projetoExistente,
      aprovadoPeloTutor: aprovadoProjeto
    };

    const agora = Date.now();
    const dataGraduacaoFinal = memorialExistente.dataGraduacao || (publicadoNoHall ? agora : null);

    const novoMemorial: Record<string, unknown> = {
      ...memorialExistente,
      especialidadeOficial: especialidadeOficial || memorialExistente.especialidadeOficial || "Desenvolvedor de Software",
      seloHonorifico: seloHonorifico || memorialExistente.seloHonorifico || "Lenda da Trilha Tech",
      parecerTutor,
      projetoDestaque: projetoAtualizado,
      publicadoNoHall,
      anoFormacao: memorialExistente.anoFormacao || anoFormacaoInput,
      xpFinal: xpCongelado,
      nivelFinal: nivelCongelado
    };

    if (dataGraduacaoFinal) {
      novoMemorial.dataGraduacao = dataGraduacaoFinal;
    } else {
      delete novoMemorial.dataGraduacao;
    }

    // Remove qualquer eventual propriedade undefined herdada para blindar o Firestore
    Object.keys(novoMemorial).forEach(key => {
      if (novoMemorial[key] === undefined) {
        delete novoMemorial[key];
      }
    });

    const novoStatusTrilha = graduarComoVeterano
      ? "Veterano"
      : (alunoData.statusTrilha === "Veterano" ? "Ativo" : String(alunoData.statusTrilha || "Ativo"));

    const payloadAlunoUpdate: Record<string, unknown> = {
      memorialFormatura: novoMemorial,
      statusTrilha: novoStatusTrilha,
      lastUpdated: agora
    };

    await alunoRef.set(payloadAlunoUpdate, { merge: true });

    // Sincronia CQRS Obrigatória: Notifica o aluno em portal_views se publicado no Hall
    if (publicadoNoHall && !memorialExistente.publicadoNoHall) {
      await portalRef.set({
        notificacoes: FieldValue.arrayUnion({
          id: `CURADORIA-HALL-${agora}`,
          mensagem: `🏛️ Parabéns! Seu Memorial foi aprovado pelo Mestre e publicado oficialmente no Hall da Fama!`,
          xp: 0,
          tempo: agora,
          tipo: "CONQUISTA"
        }),
        lastUpdated: agora
      }, { merge: true });
    }

    // Invalida caches (Portal do Aluno, Vitrine de Veteranos, Ranking e Admin)
    invalidatePortalCache(matricula);
    invalidateVeteranosCache();
    invalidateAdminAlunosCache();
    invalidateRankingCache();

    if (novoStatusTrilha !== alunoData.statusTrilha) {
      await refreshAlunosAtivosSnapshot(dbAdmin);
    }

    return NextResponse.json({
      status: "sucesso",
      mensagem: publicadoNoHall
        ? "Curadoria salva e formando publicado no Hall da Fama!"
        : "Rascunho de curadoria atualizado com sucesso!",
      memorial: novoMemorial,
      statusTrilha: novoStatusTrilha
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Curadoria Hall API] Erro no POST:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}

