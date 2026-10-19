import { NextResponse } from "next/server";
import { dbAdmin } from "@/src/lib/firebaseAdmin";
import { invalidatePortalCache } from "@/src/lib/cache";
import {
  listarTecnologiasDisponiveis,
  obterQuestoesPublicas,
  avaliarQuestoesTech
} from "@/src/lib/questionariosTech";
import { MemorialFormatura, CertificacaoTech, ProjetoConclusao } from "@/src/types";

export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matricula = searchParams.get("matricula")?.trim();
  const action = searchParams.get("action")?.trim();
  const tech = searchParams.get("tech")?.trim();

  try {
    // 1. Ação para listar tecnologias e metadados
    if (action === "listar_techs") {
      const tecnologias = listarTecnologiasDisponiveis();
      return NextResponse.json({ status: "sucesso", tecnologias });
    }

    // 2. Ação para buscar perguntas de um questionário sem o gabarito
    if (action === "perguntas") {
      if (!tech) {
        return NextResponse.json({ status: "erro", mensagem: "Tecnologia não especificada." }, { status: 400 });
      }
      const questoes = obterQuestoesPublicas(tech);
      if (!questoes) {
        return NextResponse.json({ status: "erro", mensagem: `Tecnologia '${tech}' não encontrada.` }, { status: 404 });
      }
      return NextResponse.json({ status: "sucesso", tech, questoes });
    }

    // 3. Ação padrão: Buscar dados do Memorial do aluno
    if (!matricula) {
      return NextResponse.json({ status: "erro", mensagem: "Matrícula é obrigatória." }, { status: 400 });
    }

    const alunoDoc = await dbAdmin.collection("alunos").doc(matricula).get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." }, { status: 404 });
    }

    const alunoData = alunoDoc.data() || {};
    const portalSnap = await dbAdmin.collection("portal_views").doc(matricula).get();
    const portalData = portalSnap.exists ? portalSnap.data() || {} : {};

    const memorialSalvo = (alunoData.memorialFormatura || {}) as Partial<MemorialFormatura>;

    // Estrutura padrão consolidada
    const memorialCompleto: MemorialFormatura = {
      fraseFormatura: memorialSalvo.fraseFormatura || "",
      techStack: Array.isArray(memorialSalvo.techStack) ? memorialSalvo.techStack : [],
      fotoUrl: memorialSalvo.fotoUrl || (portalData.avatar as string) || "https://api.dicebear.com/9.x/bottts/svg?seed=" + matricula,
      certificacoesTech: Array.isArray(memorialSalvo.certificacoesTech) ? memorialSalvo.certificacoesTech : [],
      projetoDestaque: memorialSalvo.projetoDestaque || {
        titulo: "",
        descricao: "",
        linkDeploy: "",
        linkGithub: "",
        aprovadoPeloTutor: false
      },
      linkedinUrl: memorialSalvo.linkedinUrl || "",
      githubUrl: memorialSalvo.githubUrl || "",
      especialidadeOficial: memorialSalvo.especialidadeOficial || "Aguardando Avaliação do Tutor",
      seloHonorifico: memorialSalvo.seloHonorifico || "",
      parecerTutor: memorialSalvo.parecerTutor || "",
      publicadoNoHall: Boolean(memorialSalvo.publicadoNoHall),
      anoFormacao: memorialSalvo.anoFormacao || new Date().getFullYear(),
      xpFinal: memorialSalvo.xpFinal || Number(portalData.xpTotal) || 0,
      nivelFinal: memorialSalvo.nivelFinal || (portalData.nivel as string) || "Iniciante",
      totalAplausos: memorialSalvo.totalAplausos || 0,
      dataGraduacao: memorialSalvo.dataGraduacao || undefined
    };

    const tecnologias = listarTecnologiasDisponiveis();

    return NextResponse.json({
      status: "sucesso",
      memorial: memorialCompleto,
      turma: alunoData.turma || alunoData.turmaTrilha || "",
      statusTrilha: alunoData.statusTrilha || "Ativo",
      nomeAluno: alunoData.nome || "",
      tecnologiasDisponiveis: tecnologias
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Memorial API] Erro ao carregar memorial:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "salvar_memorial").trim();
    const matricula = String(body.matricula || "").trim();

    if (!matricula) {
      return NextResponse.json({ status: "erro", mensagem: "Matrícula é obrigatória." }, { status: 400 });
    }

    const alunoRef = dbAdmin.collection("alunos").doc(matricula);
    const alunoDoc = await alunoRef.get();
    if (!alunoDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Aluno não encontrado." }, { status: 404 });
    }

    const alunoData = alunoDoc.data() || {};
    const memorialExistente = (alunoData.memorialFormatura || {}) as Partial<MemorialFormatura>;

    // =========================================================================
    // CASO 1: SUBMISSÃO E CORREÇÃO DO QUESTIONÁRIO DE LINGUAGEM DE DOMÍNIO
    // =========================================================================
    if (action === "submeter_teste") {
      const tech = String(body.tech || "").trim();
      const respostas = (body.respostas || {}) as Record<number, number>;

      if (!tech) {
        return NextResponse.json({ status: "erro", mensagem: "Tecnologia não informada." }, { status: 400 });
      }

      // Correção segura no servidor
      const avaliacao = avaliarQuestoesTech(tech, respostas);
      if (!avaliacao.sucesso) {
        return NextResponse.json({ status: "erro", mensagem: avaliacao.feedback }, { status: 400 });
      }

      const certificacoesAtuais: CertificacaoTech[] = Array.isArray(memorialExistente.certificacoesTech)
        ? [...memorialExistente.certificacoesTech]
        : [];

      const idxExistente = certificacoesAtuais.findIndex(c => c.tech.toLowerCase() === tech.toLowerCase());
      const tentativasAnteriores = idxExistente >= 0 ? certificacoesAtuais[idxExistente].tentativas : 0;

      const novaCertificacao: CertificacaoTech = {
        tech,
        nota: avaliacao.nota,
        aprovado: avaliacao.aprovado,
        dataTeste: Date.now(),
        tentativas: tentativasAnteriores + 1,
        badgeConcedida: avaliacao.badge
      };

      if (idxExistente >= 0) {
        // Se já tinha sido aprovado anteriormente com nota maior, mantém aprovação
        if (certificacoesAtuais[idxExistente].aprovado && !avaliacao.aprovado) {
          novaCertificacao.aprovado = true;
          novaCertificacao.nota = Math.max(certificacoesAtuais[idxExistente].nota, avaliacao.nota);
        }
        certificacoesAtuais[idxExistente] = novaCertificacao;
      } else {
        certificacoesAtuais.push(novaCertificacao);
      }

      // Atualiza a techStack aprovada
      const techStackAtual: string[] = Array.isArray(memorialExistente.techStack)
        ? [...memorialExistente.techStack]
        : [];

      if (avaliacao.aprovado && !techStackAtual.includes(tech)) {
        techStackAtual.push(tech);
      }

      await alunoRef.set({
        memorialFormatura: {
          ...memorialExistente,
          certificacoesTech: certificacoesAtuais,
          techStack: techStackAtual,
          lastUpdated: Date.now()
        }
      }, { merge: true });

      invalidatePortalCache(matricula);

      return NextResponse.json({
        status: "sucesso",
        aprovado: avaliacao.aprovado,
        nota: avaliacao.nota,
        acertos: avaliacao.acertos,
        totalQuestoes: avaliacao.total,
        badgeConcedida: avaliacao.aprovado ? avaliacao.badge : null,
        mensagem: avaliacao.feedback,
        certificacoes: certificacoesAtuais,
        techStack: techStackAtual
      });
    }

    // =========================================================================
    // CASO 2: SALVAR DADOS DO MEMORIAL (FOTO, FRASE, PROJETO, REDES SOCIAIS)
    // =========================================================================
    if (action === "salvar_memorial") {
      const fraseFormatura = typeof body.fraseFormatura === "string" ? body.fraseFormatura.trim() : (memorialExistente.fraseFormatura || "");
      const fotoUrl = typeof body.fotoUrl === "string" && body.fotoUrl.trim() ? body.fotoUrl.trim() : memorialExistente.fotoUrl;
      const linkedinUrl = typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : (memorialExistente.linkedinUrl || "");
      const githubUrl = typeof body.githubUrl === "string" ? body.githubUrl.trim() : (memorialExistente.githubUrl || "");

      const projetoBody = body.projetoDestaque as Partial<ProjetoConclusao> | undefined;
      const projetoExistente = memorialExistente.projetoDestaque || {
        titulo: "",
        descricao: "",
        linkDeploy: "",
        linkGithub: "",
        aprovadoPeloTutor: false
      };

      const projetoDestaque: ProjetoConclusao = {
        titulo: projetoBody?.titulo !== undefined ? String(projetoBody.titulo).trim() : projetoExistente.titulo,
        descricao: projetoBody?.descricao !== undefined ? String(projetoBody.descricao).trim() : projetoExistente.descricao,
        linkDeploy: projetoBody?.linkDeploy !== undefined ? String(projetoBody.linkDeploy).trim() : (projetoExistente.linkDeploy || ""),
        linkGithub: projetoBody?.linkGithub !== undefined ? String(projetoBody.linkGithub).trim() : (projetoExistente.linkGithub || ""),
        aprovadoPeloTutor: projetoExistente.aprovadoPeloTutor // Apenas tutor altera esta flag
      };

      const novoMemorial: Partial<MemorialFormatura> = {
        ...memorialExistente,
        fraseFormatura,
        fotoUrl,
        linkedinUrl,
        githubUrl,
        projetoDestaque
      };

      await alunoRef.set({
        memorialFormatura: novoMemorial,
        lastUpdated: Date.now()
      }, { merge: true });

      // Se o aluno alterou a fotoUrl do memorial, também reflete no avatar se desejado
      if (fotoUrl) {
        await dbAdmin.collection("portal_views").doc(matricula).set({
          avatar: fotoUrl,
          lastUpdated: Date.now()
        }, { merge: true });
      }

      invalidatePortalCache(matricula);

      return NextResponse.json({
        status: "sucesso",
        mensagem: "Memorial e foto de formatura salvos com sucesso!",
        memorial: novoMemorial
      });
    }

    return NextResponse.json({ status: "erro", mensagem: `Ação '${action}' desconhecida.` }, { status: 400 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Memorial API] Erro ao processar requisição:", err.message);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
