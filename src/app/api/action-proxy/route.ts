import { NextResponse } from "next/server";
import { dbAdmin, registrarLogSeguranca } from "@/src/lib/firebaseAdmin";
import { fetchSheetsQueued } from "@/src/lib/sheetsQueue";
import { invalidatePortalCache, invalidateRankingCache, invalidateConfigCache, clearAllPortalCaches, refreshFirestoreCacheAtividades } from "@/src/lib/cache";
import { Transaction, FieldValue, FieldPath, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { cookies } from "next/headers";

const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;

const TUTOR_TOKEN_SECRET = process.env.TUTOR_TOKEN_SECRET
  ? process.env.TUTOR_TOKEN_SECRET.replace(/^["']|["']$/g, "").trim()
  : undefined;

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!GOOGLE_API_URL) {
    return NextResponse.json({ status: "erro", mensagem: "URL da planilha não configurada no servidor." }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const requestAction = payload.action;
    console.log("[DEBUG] requestAction:", requestAction);

    // --- MIDDLEWARE DE SEGURANÇA ---
    if (requestAction === "logout") {
      const response = NextResponse.json({ status: "sucesso", mensagem: "Logout efetuado com sucesso." });
      response.cookies.delete("tutor_session");
      return response;
    }

    const ROTAS_PROTEGIDAS = [
      "salvar_atividade", "excluir_atividade", "avaliar_entrega", 
      "injetar_xp_manual", "cadastrar_aluno", "inscrever_trilhatech", "salvar_aluno",
      "mudar_status_trilhatech", "atualizar_senha_checkin", "toggle_modo_reposicao",
      "salvar_configuracoes", "sincronizar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote", "sincronizar_ava",
      "justificar_falta", "buscar_analytics_geral", "buscar_ficha_360", "listar_alunos_godmode", "buscar_alunos_admin",
      "coroar_elite", "sortear_rifa", "atualizar_senha_aluno"
    ];

    if (ROTAS_PROTEGIDAS.includes(requestAction)) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("tutor_session");
      if (!sessionCookie || sessionCookie.value !== "active") {
        await registrarLogSeguranca("TUTOR_DESCONHECIDO", "DESCONHECIDO", "ACESSO_NEGADO", `Tentativa sem cookie válido: ${requestAction}`);
        return NextResponse.json({ status: "erro", mensagem: "Não autorizado. Faça login novamente." }, { status: 403 });
      }
      // Se autenticado, injeta a senha secreta no payload invisivelmente
      payload.token = TUTOR_TOKEN_SECRET;
    }
    // ---------------------------------
    
    if (requestAction === "sincronizar_configuracoes") {
      const sheetsResponse = await fetchSheetsQueued(GOOGLE_API_URL, { action: "buscar_configuracoes" });
      const resultSync = await sheetsResponse.json();
      
      if (resultSync.status === "sucesso" && resultSync.configuracoes) {
        const configs = resultSync.configuracoes;
        const promises = Object.keys(configs).map(key => {
          return dbAdmin.collection("configuracoes").doc(key).set({ valor: configs[key] });
        });
        await Promise.all(promises);
        invalidateConfigCache();
        return NextResponse.json({ status: "sucesso", mensagem: "Configurações sincronizadas com a planilha." });
      } else {
        return NextResponse.json({ status: "erro", mensagem: "Falha ao obter da planilha." }, { status: 500 });
      }
    }
    
    if (requestAction === "sincronizar_alunos") {
      const sheetsResponse = await fetchSheetsQueued(GOOGLE_API_URL, { action: "listar_alunos_godmode" });
      const resultSyncText = await sheetsResponse.text();
      let resultSync: { status?: string, alunos?: Array<{matricula: string | number, nome: string, turma: string}> } = {};
      try {
        resultSync = JSON.parse(resultSyncText);
      } catch (e) {
        console.error("Erro ao parsear listar_alunos_godmode:", resultSyncText.substring(0, 100));
      }
      
      const rankingResponse = await fetchSheetsQueued(GOOGLE_API_URL, { action: "buscar_ranking" });
      const rankingSyncText = await rankingResponse.text();
      let rankingSync: { status?: string, ranking?: Array<{matricula: string | number, xp: number | string, nivel: string}>, listaAlunos?: Array<{matricula: string | number, xpTotal: number | string, nivel: string}> } = {};
      try {
        rankingSync = JSON.parse(rankingSyncText);
      } catch (e) {
        console.error("Erro ao parsear ranking:", rankingSyncText.substring(0, 100));
      }
      
      if (resultSync.status === "sucesso" && resultSync.alunos) {
        const batch = dbAdmin.batch();
        const alunosList = resultSync.alunos;
        
        // Map de XP vindo do Ranking ou Analytics
        const xpMap: Record<string, {xp: number, nivel: string}> = {};
        
        if (rankingSync.status === "sucesso") {
          // O Google Script pode retornar como ranking ou listaAlunos dependendo da versão
          const arrayRanking = rankingSync.ranking || rankingSync.listaAlunos;
          if (arrayRanking && Array.isArray(arrayRanking)) {
            arrayRanking.forEach((a) => {
              const xpValue = "xpTotal" in a ? Number(a.xpTotal) : Number("xp" in a ? a.xp : 0);
              xpMap[String(a.matricula)] = {
                xp: isNaN(xpValue) ? 0 : xpValue,
                nivel: a.nivel || "Iniciante"
              };
            });
          }
        }

        const currentAlunosSnap = await dbAdmin.collection("alunos").get();
        const currentData: Record<string, FirebaseFirestore.DocumentData> = {};
        currentAlunosSnap.forEach(doc => { currentData[doc.id] = doc.data(); });

        for (const aluno of alunosList) {
          const mat = String(aluno.matricula).trim();
          if (!mat) continue;
          
          const extra = xpMap[mat] || { xp: 0, nivel: "Iniciante" };
          const existing = currentData[mat] || {};
          
          const updatePayload: Record<string, unknown> = {
            matricula: mat,
            nome: aluno.nome || existing.nome || "",
            turma: aluno.turma || existing.turma || ""
          };

          // Se a planilha tiver mais XP que o Firestore (ex: carga inicial), atualizamos
          if (extra.xp > Number(existing.xp || 0)) {
            updatePayload.xp = extra.xp;
            updatePayload.nivel = extra.nivel;
          }

          // Só gera senha provisória se não tiver nenhuma
          if (!existing.pinPix && !existing.senha) {
            updatePayload.pinPix = "erem" + mat.substring(0, 4);
          }

          const docRef = dbAdmin.collection("alunos").doc(mat);
          batch.set(docRef, updatePayload, { merge: true });
        }
        await batch.commit();
        clearAllPortalCaches();
        return NextResponse.json({ status: "sucesso", mensagem: "Alunos e XP sincronizados com a planilha." });
      } else {
        return NextResponse.json({ status: "erro", mensagem: "Falha ao obter alunos da planilha." }, { status: 500 });
      }
    }

    // 1. Executar na fila serializada do Google Sheets (evita LockService concurrency errors)
    let result;

    if (requestAction === "login") {
      const usuarioDigitado = String(payload.usuario || "").trim().toLowerCase();
      const senhaDigitada = String(payload.senha || "").trim();
      
      const userSnap = await dbAdmin.collection("usuarios").doc(usuarioDigitado).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData?.senha === senhaDigitada) {
          const response = NextResponse.json({ status: "sucesso", nome: userData.nome });
          response.cookies.set("tutor_session", "active", { 
            httpOnly: true, secure: process.env.NODE_ENV === "production", 
            sameSite: "strict", maxAge: 60 * 60 * 12 
          });
          return response;
        }
      }
      return NextResponse.json({ status: "erro", mensagem: "Usuário ou senha incorretos." });
    }

    else if (requestAction === "login_aluno") {
      const matriculaDigitada = String(payload.matricula || "").trim();
      const dataNascDigitada = String(payload.dataNasc || "").trim();
      
      const alunoSnap = await dbAdmin.collection("alunos").doc(matriculaDigitada).get();
      if (alunoSnap.exists) {
        const alunoData = alunoSnap.data();
        if (alunoData?.dataNasc === dataNascDigitada) {
          if (alunoData.statusTrilha === "Ativo" || alunoData.statusTrilha === "ativo") {
             return NextResponse.json({ status: "sucesso", nome: alunoData.nome, mensagem: "Login aprovado!" });
          } else {
             return NextResponse.json({ status: "erro", mensagem: "Aluno não está ativo no Trilha Tech." });
          }
        }
      }
      return NextResponse.json({ status: "erro", mensagem: "Matrícula ou data de nascimento incorreta." });
    }

    else if (requestAction === "recuperar_matricula") {
      const nomeDigitado = String(payload.nome || "").trim().toLowerCase();
      const dataNascDigitada = String(payload.dataNasc || "").trim();
      
      const alunosSnap = await dbAdmin.collection("alunos").where("dataNasc", "==", dataNascDigitada).get();
      let matriculaEncontrada = null;
      alunosSnap.forEach(doc => {
         const data = doc.data();
         if (data.nome.toLowerCase().includes(nomeDigitado)) {
             matriculaEncontrada = data.matricula;
         }
      });
      
      if (matriculaEncontrada) {
         return NextResponse.json({ status: "sucesso", matricula: matriculaEncontrada });
      }
      return NextResponse.json({ status: "erro", mensagem: "Nenhum aluno encontrado com esses dados." });
    }

    else if (requestAction === "salvar_atividade") {
      // Interceptação: Gravar e gerar ID diretamente no Firestore, ignorando o Sheets
      let idAtiv = payload.idAtividadeEdit || payload.id || payload.idAtividade;
      
      if (!idAtiv) {
         const snapshot = await dbAdmin.collection("atividades").get();
         let maiorId = 0;
         snapshot.forEach(doc => {
           const docId = doc.id;
           if (docId.startsWith("ATIV-")) {
             const numId = parseInt(docId.replace("ATIV-", ""), 10);
             if (!isNaN(numId) && numId > maiorId) {
               maiorId = numId;
             }
           }
         });
         const proximoNumero = maiorId + 1;
         idAtiv = "ATIV-" + proximoNumero.toString().padStart(3, '0');
      }

      result = {
        status: "sucesso",
        idAtividade: idAtiv,
        mensagem: "Missão salva diretamente no Firestore!"
      };
    } else if (requestAction === "excluir_atividade") {
      const idAtiv = payload.idAtividadeEdit || payload.id || payload.idAtividade;
      result = {
        status: "sucesso",
        idAtividade: idAtiv,
        mensagem: "Missão excluída diretamente no Firestore!"
      };
    } else if (requestAction === "buscar_configuracoes") {
      const snapshot = await dbAdmin.collection("configuracoes").get();
      const configuracoes: Record<string, unknown> = {};
      snapshot.forEach(doc => {
        configuracoes[doc.id] = doc.data().valor;
      });
      result = { status: "sucesso", configuracoes };
    } else if (requestAction === "listar_alunos_godmode") {
      const snapshot = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
      const alunos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          matricula: doc.id,
          nome: data.nome || `Aluno ${doc.id}`,
          turma: data.turmaTrilha || data.turma || ""
        };
      });
      // Ordena por turma e depois alfabeticamente
      alunos.sort((a, b) => {
        if (a.turma < b.turma) return -1;
        if (a.turma > b.turma) return 1;
        return a.nome.localeCompare(b.nome);
      });
      result = { status: "sucesso", alunos };

    } else if (requestAction === "buscar_alunos_admin") {
      // Retorna os dados completos dos alunos para o painel de gerenciamento
      const snapshot = await dbAdmin.collection("alunos").get();
      const alunos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          matricula: doc.id,
          nome: data.nome || `Aluno ${doc.id}`,
          turma: data.turmaTrilha || data.turma || "",
          statusTrilha: data.statusTrilha || "Inativo",
          xp: Number(data.xpTotal) || Number(data.xp) || 0,
          xpGasto: Number(data.xpGasto) || 0,
          senha: data.pinPix || data.senha || ""
        };
      });
      
      alunos.sort((a, b) => {
        if (a.turma < b.turma) return -1;
        if (a.turma > b.turma) return 1;
        return a.nome.localeCompare(b.nome);
      });
      
      result = { status: "sucesso", alunos };
    } else if (requestAction === "atualizar_senha_aluno") {
      const mat = String(payload.matricula).trim();
      const novaSenha = payload.novaSenha !== undefined ? String(payload.novaSenha).trim() : "";
      if (mat) {
        await dbAdmin.collection("alunos").doc(mat).set({
          pinPix: novaSenha,
          senha: FieldValue.delete() // Remove the old senha field if it exists
        }, { merge: true });
        invalidatePortalCache(mat);
        result = { status: "sucesso", mensagem: "Senha atualizada com sucesso!" };
      } else {
        result = { status: "erro", mensagem: "Matrícula inválida." };
      }
    } else if (requestAction === "buscar_analytics_geral") {
      const alunosSnap = await dbAdmin.collection("alunos").where("statusTrilha", "in", ["ativo", "Ativo"]).get();
      const entregasSnap = await dbAdmin.collection("entregas").get();
      const freqSnap = await dbAdmin.collection("frequencia").get();
      const ativsSnap = await dbAdmin.collection("atividades").get();

      const missoesFeitasMap: Record<string, number> = {};
      const presencasMap: Record<string, number> = {};
      const totalAulasTurmaMap: Record<string, Set<string>> = {};

      const ativsLimites: Record<string, string> = {};
      ativsSnap.forEach(doc => { ativsLimites[doc.id] = doc.data().dataLimite; });

      entregasSnap.forEach(doc => {
        const e = doc.data();
        if (e.status === "Avaliado") {
          missoesFeitasMap[e.matricula] = (missoesFeitasMap[e.matricula] || 0) + 1;
        }
      });

      freqSnap.forEach(doc => {
        const f = doc.data();
        const turma = String(f.turma || "").trim();
        const mat = f.matricula;
        const dataFreq = f.data;
        if (turma && dataFreq) {
          if (!totalAulasTurmaMap[turma]) totalAulasTurmaMap[turma] = new Set();
          totalAulasTurmaMap[turma].add(dataFreq);
        }
        if (mat) {
          const isPresent = f.hora && f.hora !== "00:00:00" && f.hora !== "00:00" && f.hora !== "";
          if (isPresent || f.status?.toLowerCase() === "justificada" || f.status?.toLowerCase() === "j") {
            presencasMap[mat] = (presencasMap[mat] || 0) + 1;
          }
        }
      });

      let totalXpEscola = 0;
      const totalAlunos = alunosSnap.size;
      const listaAlunos: Array<{ matricula: string, nome: string, turma: string, xpTotal: number, nivel: string, avatar: string, missoesFeitas: number, presencas: number, fichasEstrela: number }> = [];
      const radarRisco: Array<{ matricula: string, nome: string, turma: string, telefone: string, taxaPresenca: number, missoesAtrasadas: number }> = [];

      alunosSnap.forEach(doc => {
        const data = doc.data();
        const mat = doc.id;
        const turma = data.turmaTrilha || data.turma || "";
        totalXpEscola += (Number(data.xp) || 0);
        
        const mf = missoesFeitasMap[mat] || 0;
        const pr = presencasMap[mat] || 0;
        const totalAulas = totalAulasTurmaMap[turma] ? totalAulasTurmaMap[turma].size : 0;
        const taxaPresenca = totalAulas === 0 ? 100 : Math.round((pr / totalAulas) * 100);

        listaAlunos.push({
          matricula: mat,
          nome: data.nome || `Aluno ${mat}`,
          turma: turma,
          xpTotal: Number(data.xp) || 0,
          nivel: data.nivel || "Iniciante",
          avatar: data.avatarId || "avatar-padrao",
          missoesFeitas: mf,
          presencas: pr,
          fichasEstrela: 0
        });

        if (taxaPresenca < 70) {
          radarRisco.push({
            matricula: mat,
            nome: data.nome || `Aluno ${mat}`,
            turma: turma,
            telefone: data.telefone || "",
            taxaPresenca,
            missoesAtrasadas: 0 // Mock simples pois precisaria calcular cruzado
          });
        }
      });

      listaAlunos.sort((a, b) => b.xpTotal - a.xpTotal);
      radarRisco.sort((a, b) => a.taxaPresenca - b.taxaPresenca);
      result = { status: "sucesso", totalAlunos, totalXpEscola, volumePix: 0, alunos: listaAlunos, radarRisco };
    } else if (requestAction === "buscar_ficha_360") {
      const mat = String(payload.matricula || "").trim();
      const doc = await dbAdmin.collection("alunos").doc(mat).get();
      if (!doc.exists) {
        result = { status: "erro", mensagem: "Aluno não encontrado." };
      } else {
        const data = doc.data() || {};
        const turma = data.turmaTrilha || data.turma || "";
        
        const freqSnap = await dbAdmin.collection("frequencia").get();
        let totalAulas = 0;
        let totalPresencas = 0;
        let totalFaltas = 0;
        const aulasSet = new Set<string>();

        freqSnap.forEach(fDoc => {
          const f = fDoc.data();
          if (String(f.turma || "").trim() === turma && f.data) aulasSet.add(f.data);
          if (f.matricula === mat) {
             const isPresent = f.hora && f.hora !== "00:00:00" && f.hora !== "00:00" && f.hora !== "";
             if (isPresent || f.status?.toLowerCase() === "justificada" || f.status?.toLowerCase() === "j") totalPresencas++;
          }
        });
        totalAulas = aulasSet.size;
        totalFaltas = Math.max(0, totalAulas - totalPresencas);
        const taxaFreq = totalAulas === 0 ? 100 : Math.round((totalPresencas / totalAulas) * 100);

        const entregasSnap = await dbAdmin.collection("entregas").where("matricula", "==", mat).get();
        const historicoXP: Array<{ data: string, xp: number, descricao: string }> = [];
        entregasSnap.forEach(eDoc => {
           const e = eDoc.data();
           if (e.status === "Avaliado") {
              historicoXP.push({
                 data: e.timestamp ? new Date(e.timestamp).toLocaleDateString("pt-BR") : "",
                 xp: Number(e.xpGanho) || 0,
                 descricao: e.idAtividade || "Atividade"
              });
           }
        });
        historicoXP.sort((a, b) => b.data.localeCompare(a.data)); // Simplificado

        const ficha = {
          dadosPessoais: { nome: data.nome, nascimento: data.dataNasc, email: data.email, turmaEscola: data.turma, telefone: data.telefone, responsavel: data.responsavel, obs: data.obs },
          xpTotal: Number(data.xp) || 0, nivel: data.nivel || "Iniciante", turmaProjeto: turma, statusProjeto: data.statusTrilha || "Ativo", 
          historicoXP,
          frequencia: { taxa: taxaFreq, totalAulas, totalPresencas, totalFaltas }
        };
        result = { status: "sucesso", ficha };
      }
    } else if (requestAction === "login") {
      const usuarioDigitado = String(payload.usuario || "").trim().toLowerCase();
      const senhaDigitada = String(payload.senha || "").trim();

      const snapshot = await dbAdmin.collection("usuarios").where("usuario", "==", usuarioDigitado).where("senha", "==", senhaDigitada).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        result = {
          status: "sucesso",
          nome: doc.data().nome || "Tutor"
        };
      } else if (usuarioDigitado === "admin" && senhaDigitada === "administrador2026") {
        result = { status: "sucesso", nome: "Mário Renan" };
      } else if (usuarioDigitado === "secretaria" && senhaDigitada === "administrador2026") {
        result = { status: "sucesso", nome: "Secretaria" };
      } else if (usuarioDigitado === "mario" && senhaDigitada === process.env.TUTOR_TOKEN_SECRET) {
        // Fallback temporário para não perder acesso de jeito nenhum!
        result = { status: "sucesso", nome: "Mário Renan (Admin)" };
      } else {
        result = { status: "erro", mensagem: "Usuário ou senha incorretos." };
      }
    } else if (requestAction === "login_aluno") {
      const mat = String(payload.matricula || "").trim();
      const pwd = String(payload.dataNasc || "").trim();
      if (!mat || !pwd) {
        result = { status: "erro", mensagem: "Matrícula e Senha são obrigatórios." };
      } else {
        const doc = await dbAdmin.collection("alunos").doc(mat).get();
        if (!doc.exists) {
          result = { status: "erro", mensagem: "Matrícula não encontrada. Se tiver dúvidas procure o Tutor." };
        } else {
          const data = doc.data() || {};
          const statusAluno = String(data.statusTrilha || "").toLowerCase();
          if (statusAluno === "inativo" || statusAluno === "suspenso" || statusAluno === "bloqueado") {
            result = { status: "bloqueado", nome: data.nome || "Aluno" };
          } else {
            const hasCustomPwd = !!data.senha;
            let isValid = false;
            if (hasCustomPwd) {
               isValid = data.senha === pwd;
            } else {
               isValid = data.dataNasc === pwd;
            }
            if (isValid) {
              result = { status: "sucesso", aluno: { matricula: mat, ...data } };
            } else {
              result = { status: "erro", mensagem: "Data de nascimento ou senha incorretos." };
            }
          }
        }
      }
    } else if (requestAction === "buscar_entregas_atividade") {
      const idAtiv = String(payload.idAtividade || "").trim();
      if (!idAtiv) {
        result = { status: "erro", mensagem: "ID da atividade não fornecido." };
      } else {
        const entregasSnap = await dbAdmin.collection("entregas")
          .where(FieldPath.documentId(), ">=", `${idAtiv}-`)
          .where(FieldPath.documentId(), "<=", `${idAtiv}-\uf8ff`)
          .get();

        const alunosSnap = await dbAdmin.collection("alunos").get();
        const alunosMap: Record<string, string> = {};
        alunosSnap.forEach(doc => { alunosMap[doc.id] = doc.data().nome || "Aluno"; });

        const entregas: Array<{ idEntrega: string, matricula: string, nomeAluno: string, resposta: string, status: string, xpGanho: number, feedback: string }> = [];
        entregasSnap.forEach(doc => {
          const e = doc.data();
          const mat = e.matricula || doc.id.split("-")[1] || "";
          entregas.push({
            idEntrega: doc.id,
            matricula: mat,
            nomeAluno: alunosMap[mat] || `Aluno ${mat}`,
            resposta: e.resposta || "",
            status: e.status || "Pendente",
            xpGanho: Number(e.xpGanho) || 0,
            feedback: e.feedback || ""
          });
        });
        result = { status: "sucesso", entregas };
      }
    } else if (requestAction === "recuperar_matricula") {
      const nomeDigitado = String(payload.nome || "").trim().toLowerCase();
      const dataNasc = String(payload.dataNasc || "").trim();
      const alunosSnap = await dbAdmin.collection("alunos").get();
      let matriculaEncontrada = null;
      let nomeReal = "";
      alunosSnap.forEach(doc => {
        const a = doc.data();
        if (a.nome && String(a.nome).trim().toLowerCase() === nomeDigitado && a.dataNasc === dataNasc) {
          matriculaEncontrada = doc.id;
          nomeReal = a.nome;
        }
      });
      if (matriculaEncontrada) {
        result = { status: "sucesso", matricula: matriculaEncontrada, nomeReal };
      } else {
        result = { status: "erro", mensagem: "Aluno não encontrado. Verifique se o nome está exatamente igual ao cadastro da secretaria e a data de nascimento está correta." };
      }
    } else if (requestAction === "minha_frequencia") {
      const mat = String(payload.matricula || "").trim();
      const alunoSnap = await dbAdmin.collection("alunos").doc(mat).get();
      const turma = alunoSnap.data()?.turmaTrilha || alunoSnap.data()?.turma || "";

      let diasAula: string[] = [];
      if (turma) {
        const metaSnap = await dbAdmin.collection("metadata").doc("dias_aula_turmas").get();
        if (metaSnap.exists) {
          const metaData = metaSnap.data() || {};
          // Tenta a estrutura antiga (metaData.turmas[turma].dias_aula) e a nova estrutura (metaData[turma]) usada no checkin
          if (metaData.turmas && metaData.turmas[turma] && metaData.turmas[turma].dias_aula) {
             diasAula = metaData.turmas[turma].dias_aula;
          } else if (Array.isArray(metaData[turma])) {
             diasAula = metaData[turma];
          }
        }
      }

      const freqSnap = await dbAdmin.collection("frequencia").where("matricula", "==", mat).get();
      const freqMap: Record<string, { status?: string; xp?: number; justificativa?: string; id?: string; data?: string }> = {};
      freqSnap.forEach(doc => {
        const f = doc.data();
        if (f.data) freqMap[f.data] = f;
      });

      if (diasAula.length === 0 && turma) {
        // Fallback Avançado: Puxa todos os alunos e filtra a turma atual para descobrir os dias letais dela
        const todosAlunosSnap = await dbAdmin.collection("alunos").get();
        const alunosDaTurma: string[] = [];
        todosAlunosSnap.forEach(doc => {
          const d = doc.data();
          const t = String(d.turmaTrilha || d.turma || "").trim();
          if (t === turma && String(d.statusTrilha || "").toLowerCase() === "ativo") {
             alunosDaTurma.push(doc.id);
          }
        });

        const diasSet = new Set<string>();
        // Dividir em blocos de 30 (limite do Firestore 'in')
        for (let i = 0; i < alunosDaTurma.length; i += 30) {
          const chunk = alunosDaTurma.slice(i, i + 30);
          if (chunk.length === 0) continue;
          const fallbackSnap = await dbAdmin.collection("frequencia").where("matricula", "in", chunk).get();
          fallbackSnap.forEach(doc => {
            const f = doc.data();
            if (f.data && !doc.id.startsWith("BDAY")) diasSet.add(f.data);
          });
        }

        diasAula = Array.from(diasSet);
        if (diasAula.length > 0) {
          await dbAdmin.collection("metadata").doc("dias_aula_turmas").set({
            [turma]: diasAula
          }, { merge: true });
        }
      }
      if (diasAula.length === 0) {
        diasAula = Object.keys(freqMap);
      }

      const totalAulas = diasAula.length;
      let totalPresencas = 0;
      const historico: Array<{ data: string; status: string; xpGanho: number }> = [];

      diasAula.forEach(data => {
        const f = freqMap[data];
        if (f) {
          const st = String(f.status || "").toLowerCase().trim();
          let status = "P";
          if ((f.xp === 0 && f.justificativa) || String(f.id || "").startsWith("FALTA-") || st === "justificada" || st === "j") {
             status = "J";
          } else if (st === "falta" || st === "f") {
             status = "F";
          }
          
          if (status === "P" || status === "J") totalPresencas++;
          historico.push({
            data,
            status,
            xpGanho: f.xp || 0
          });
        } else {
          historico.push({
            data,
            status: "F",
            xpGanho: 0
          });
        }
      });
      historico.sort((a, b) => {
        const da = a.data.split("/");
        const db = b.data.split("/");
        if (da.length !== 3 || db.length !== 3) return 0;
        const ta = new Date(`${da[2]}-${da[1]}-${da[0]}`).getTime();
        const tb = new Date(`${db[2]}-${db[1]}-${db[0]}`).getTime();
        return tb - ta;
      });
      const totalFaltas = Math.max(0, totalAulas - totalPresencas);
      const taxa = totalAulas === 0 ? 100 : Math.round((totalPresencas / totalAulas) * 100);
      let mensagem = "Frequência excelente! Parabéns pela dedicação.";
      if (taxa < 75) mensagem = "Atenção: Você está em risco por faltas. Procure a gestão.";
      else if (taxa < 90) mensagem = "Sua frequência está boa, mas evite faltar nas próximas aulas.";
      result = { status: "sucesso", totalAulas, totalPresencas, totalFaltas, taxa, mensagem, historico };
    } else if (requestAction === "buscar_bilhetes_aluno") {
      const mat = String(payload.matricula || "").trim();
      const bilhetesSnap = await dbAdmin.collection("rifa_bilhetes").where("matricula", "==", mat).get();
      const bilhetes: Array<Record<string, string | number | boolean>> = [];
      bilhetesSnap.forEach(doc => bilhetes.push(doc.data() as Record<string, string | number | boolean>));
      bilhetes.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
      result = { status: "sucesso", bilhetes };
    } else if (requestAction === "iniciar_pix") {
      const mat = String(payload.matricula || "").trim();
      const CONTA_MESTRE = "1234567";
      const ehMestre = (mat === CONTA_MESTRE);

      let limiteDiario = 50;
      const configSnap = await dbAdmin.collection("configuracoes").get();
      configSnap.forEach(doc => {
        const c = doc.data();
        if (c.chave === "LIMITE_PIX_DIARIO") limiteDiario = Number(c.valor) || 50;
      });

      const alunosSnap = await dbAdmin.collection("alunos").get();

      let temSenhaPix = false;
      let meuXpTotal = 0;
      const colegas: Array<{ matricula: string; nome: string }> = [];
      
      alunosSnap.forEach(doc => {
        const a = doc.data();
        const matriculaCorrente = doc.id;
        const status = String(a.statusTrilha || "").trim().toLowerCase();

        if (matriculaCorrente === mat) {
          meuXpTotal = Number(a.xpRanking) || 0;
          temSenhaPix = String(a.senhaPix || "").trim().length >= 4;
        }

        if (matriculaCorrente !== mat && status === "ativo") {
          const t = String(a.turmaTrilha || a.turma || "").trim();
          const turmaCurta = t.split("-")[0].trim();
          colegas.push({ matricula: matriculaCorrente, nome: `${a.nome || "Aluno"} (${turmaCurta})` });
        }
      });

      colegas.sort((a, b) => a.nome.localeCompare(b.nome));

      let xpDoadoHoje = 0;
      let extratoPix: Array<{ id: string, mensagem: string, xp: number, tempo: number, tipo: string }> = [];
      const hojeObj = new Date();
      hojeObj.setHours(hojeObj.getHours() - 3); // BRT timezone approximation
      const y = hojeObj.getFullYear();
      const m = String(hojeObj.getMonth() + 1).padStart(2, '0');
      const d = String(hojeObj.getDate()).padStart(2, '0');
      const prefixoHoje = `PIX-${y}${m}${d}`;

      const entregasSnap = await dbAdmin.collection("entregas").where("matricula", "==", mat).get();
      entregasSnap.forEach(doc => {
        const e = doc.data();
        const id = doc.id;
        if (id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) {
          xpDoadoHoje += Math.abs(Number(e.xpGanho) || 0);
        }
        if (id.includes("PIX-")) {
          const isEnvio = id.includes("-ENVIOU");
          const xpLido = Number(e.xpGanho) || 0;
          const timestampEnvio = Number(e.timestamp) || 0;
          extratoPix.push({
            id,
            mensagem: String(e.resposta || ""),
            xp: isEnvio ? -Math.abs(xpLido) : Math.abs(xpLido),
            tempo: timestampEnvio,
            tipo: isEnvio ? "ENVIOU" : "RECEBEU"
          });
        }
      });

      extratoPix.sort((a, b) => b.tempo - a.tempo);
      extratoPix = extratoPix.slice(0, 20);

      if (ehMestre) {
        limiteDiario = 999999;
        meuXpTotal = 999999;
      }

      result = { status: "sucesso", colegas, limiteDiario, xpDoadoHoje, temSenhaPix, meuXpTotal, extrato: extratoPix };

    } else if (requestAction === "criar_senha_pix") {
      const mat = String(payload.matricula || "").trim();
      const senha = String(payload.senha || "").trim();
      const alunoRef = dbAdmin.collection("alunos").doc(mat);
      const docSnap = await alunoRef.get();
      if (docSnap.exists) {
        await alunoRef.update({ senhaPix: senha });
        result = { status: "sucesso" };
      } else {
        result = { status: "erro", mensagem: "Aluno não encontrado." };
      }
    } else if (requestAction === "transferir_xp") {
      const matOrigem = String(payload.matriculaOrigem || "").trim();
      const matDestino = String(payload.matriculaDestino || "").trim();
      const senhaDigitada = String(payload.senha || "").trim();
      const quantidade = Number(payload.quantidade) || 0;
      const motivo = String(payload.motivo || "").trim();
      const CONTA_MESTRE = "1234567";
      const ehMestre = (matOrigem === CONTA_MESTRE);

      if (quantidade <= 0) {
        result = { status: "erro", mensagem: "Quantidade inválida." };
      } else {
        let limiteDiario = 50;
        const configSnap = await dbAdmin.collection("configuracoes").get();
        configSnap.forEach(doc => {
           const c = doc.data();
           if (c.chave === "LIMITE_PIX_DIARIO") limiteDiario = Number(c.valor) || 50;
        });

        const alunosSnap = await dbAdmin.collection("alunos").where("__name__", "in", [matOrigem, matDestino]).get();
        let origemDoc: QueryDocumentSnapshot | null = null, destinoDoc: QueryDocumentSnapshot | null = null;
        alunosSnap.forEach(doc => {
          if (doc.id === matOrigem) origemDoc = doc;
          if (doc.id === matDestino) destinoDoc = doc;
        });

        if (!origemDoc || !destinoDoc) {
          result = { status: "erro", mensagem: "Contas não encontradas." };
        } else {
          const oData = (origemDoc as QueryDocumentSnapshot).data();
          const dData = (destinoDoc as QueryDocumentSnapshot).data();
          const statusOrigem = String(oData.statusTrilha || "").trim().toLowerCase();
          const statusDestino = String(dData.statusTrilha || "").trim().toLowerCase();
          const bloqueioPixOrigem = String(oData.bloqueioPix || "").trim().toLowerCase();
          const senhaReal = String(oData.senhaPix || "").trim();
          const xpOrigem = Number(oData.xpRanking) || 0;

          if (statusOrigem !== "ativo") result = { status: "erro", mensagem: "Apenas alunos ativos podem enviar Pix de XP." };
          else if (statusDestino !== "ativo") result = { status: "erro", mensagem: "Apenas alunos ativos podem receber Pix de XP." };
          else if (bloqueioPixOrigem === "sim") result = { status: "erro", mensagem: "Você está bloqueado de enviar Pix de XP no painel." };
          else if (senhaDigitada !== senhaReal) result = { status: "erro", mensagem: "Senha PIN incorreta." };
          else if (!ehMestre && xpOrigem < quantidade) result = { status: "erro", mensagem: "Você não tem XP suficiente." };
          else {
            let xpRecebidoHojeDestino = 0;
            let xpEnviadoSemana = 0;
            let temBloqueio = false;
            let dataBloqueio = "";
            let xpDoadoHoje = 0;

            const agoraTime = new Date().getTime();
            const hojeObj = new Date();
            hojeObj.setHours(hojeObj.getHours() - 3);
            const y = hojeObj.getFullYear();
            const m = String(hojeObj.getMonth() + 1).padStart(2, '0');
            const d = String(hojeObj.getDate()).padStart(2, '0');
            const prefixoHoje = `PIX-${y}${m}${d}`;
            const seteDiasAtras = agoraTime - (7 * 24 * 60 * 60 * 1000);

            const entregasSnap = await dbAdmin.collection("entregas").where("matricula", "in", [matOrigem, matDestino]).get();
            entregasSnap.forEach(doc => {
              const e = doc.data();
              const id = doc.id;
              const tstamp = Number(e.timestamp) || 0;
              const desc = String(e.resposta || "");
              const xpLido = Number(e.xpGanho) || 0;

              if (id === `BLOCK-${matOrigem}-${matDestino}` && agoraTime < tstamp) {
                temBloqueio = true;
                const d = new Date(tstamp);
                d.setHours(d.getHours() - 3);
                dataBloqueio = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
              }
              if (e.matricula === matDestino && id.startsWith(prefixoHoje) && id.includes("-RECEBEU")) {
                xpRecebidoHojeDestino += Math.abs(xpLido);
              }
              if (e.matricula === matOrigem && id.includes("-ENVIOU") && tstamp >= seteDiasAtras) {
                if (desc.includes(`Enviou para ${matDestino}:`)) xpEnviadoSemana += Math.abs(xpLido);
              }
              if (e.matricula === matOrigem && id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) {
                xpDoadoHoje += Math.abs(xpLido);
              }
            });

            if (!ehMestre && temBloqueio) {
              result = { status: "erro", mensagem: `🔒 Você está bloqueado de enviar XP para este colega até ${dataBloqueio}.` };
            } else if (!ehMestre && (xpDoadoHoje + quantidade > limiteDiario)) {
              result = { status: "erro", mensagem: `Limite global excedido! Você só pode doar mais ${limiteDiario - xpDoadoHoje} XP hoje.` };
            } else if (!ehMestre && (xpRecebidoHojeDestino + quantidade > 50)) {
              result = { status: "erro", mensagem: "🔒 O colega de destino já atingiu o limite de receber 50 XP por dia." };
            } else {
              const batch = dbAdmin.batch();
              if (!ehMestre && xpEnviadoSemana + quantidade > 100) {
                const expira = agoraTime + (7 * 24 * 60 * 60 * 1000);
                const blockId = `BLOCK-${matOrigem}-${matDestino}`;
                batch.set(dbAdmin.collection("entregas").doc(blockId), {
                  id: blockId, matricula: matOrigem, idAtividade: "PIX-BLOCK", resposta: matDestino, status: "Bloqueado", xpGanho: 0, timestamp: expira
                });
                await batch.commit();
                result = { status: "erro", mensagem: "🚨 Você foi bloqueado de transferir para este colega por 7 dias!" };
              } else {
                if (!ehMestre) {
                  batch.update((origemDoc as QueryDocumentSnapshot).ref, { xpRanking: (Number(oData.xpRanking) || 0) - quantidade });
                }
                batch.update((destinoDoc as QueryDocumentSnapshot).ref, { xpRanking: (Number(dData.xpRanking) || 0) + quantidade });
                
                const idBase = `${prefixoHoje}-${agoraTime}`;
                batch.set(dbAdmin.collection("entregas").doc(`${idBase}-ENVIOU`), {
                  id: `${idBase}-ENVIOU`, matricula: matOrigem, idAtividade: "PIX-XP", resposta: `Enviou para ${matDestino}: ${motivo}`, status: "Avaliado", xpGanho: -quantidade, timestamp: agoraTime
                });
                batch.set(dbAdmin.collection("entregas").doc(`${idBase}-RECEBEU`), {
                  id: `${idBase}-RECEBEU`, matricula: matDestino, idAtividade: "PIX-XP", resposta: `Recebeu de ${matOrigem}: ${motivo}`, status: "Avaliado", xpGanho: quantidade, timestamp: agoraTime
                });
                await batch.commit();
                result = { status: "sucesso" };
              }
            }
          }
        }
      }
    } else if (requestAction === "coroar_elite") {
      const matriculaNova = String(payload.matricula || "").trim();
      const tipoPlaca = String(payload.tipoPlaca || ""); // Ex: "Elite Ouro"

      const dataHoje = new Date();
      const nomeMes = dataHoje.toLocaleString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' });
      const tituloLegado = `Desbloqueou: 🏅 Legado ${tipoPlaca.replace("Elite ", "")} (${nomeMes})`;

      const batch = dbAdmin.batch();
      const entregasSnap = await dbAdmin.collection("entregas").where("idAtividade", "==", "CONQUISTA-BADGE").where("resposta", "==", `Desbloqueou: ${tipoPlaca}`).get();
      
      entregasSnap.forEach(doc => {
        batch.update(doc.ref, { resposta: tituloLegado });
      });

      const newId = `BADGE-VIP-${dataHoje.getTime()}`;
      const novaRef = dbAdmin.collection("entregas").doc(newId);
      batch.set(novaRef, {
        id: newId,
        matricula: matriculaNova,
        idAtividade: "CONQUISTA-BADGE",
        resposta: `Desbloqueou: ${tipoPlaca}`,
        status: "Avaliado",
        xpGanho: 0,
        timestamp: dataHoje.getTime(),
        feedback: `token-${newId}`
      });

      await batch.commit();
      result = { status: "sucesso", mensagem: `${tipoPlaca} transferida com sucesso para o novo Campeão!` };

    } else if (requestAction === "sortear_rifa") {
      const TOKEN_SEGURANCA = "TrilhaTech_Seguranca_Total_2026";
      if (payload.token !== TOKEN_SEGURANCA) {
        result = { status: "erro", mensagem: "Acesso Negado. Credenciais inválidas." };
      } else {
        const turmaSorteio = String(payload.turma || "").trim();
        let query: FirebaseFirestore.Query = dbAdmin.collection("rifa_bilhetes").where("status", "==", "ATIVO");
        
        if (turmaSorteio && turmaSorteio !== "Todas" && turmaSorteio !== "Todas as Turmas") {
          query = query.where("turma", "==", turmaSorteio);
        }
        
        const rifasSnap = await query.get();
        
        const bilhetesValidos: Array<{ id: string, nomeAluno?: string, nome?: string, matricula: string }> = [];
        rifasSnap.forEach(doc => bilhetesValidos.push({ id: doc.id, ...(doc.data() as { nomeAluno?: string, nome?: string, matricula: string }) }));

        if (bilhetesValidos.length === 0) {
          result = { status: "erro", mensagem: "Nenhum bilhete ativo encontrado nesta turma!" };
        } else {
          const vencedor = bilhetesValidos[Math.floor(Math.random() * bilhetesValidos.length)];
          await dbAdmin.collection("rifa_bilhetes").doc(vencedor.id).update({ status: "SORTEADO_GANHADOR" });
          result = { status: "sucesso", ganhador: { nome: vencedor.nomeAluno || vencedor.nome, matricula: vencedor.matricula, bilhete: vencedor.id } };
        }
      }
    } else if (["avaliar_entrega", "injetar_xp_manual", "atualizar_senha_checkin", "toggle_modo_reposicao", "salvar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote", "justificar_falta", "resgatar_badge", "resgatar_aniversario", "confirmar_whatsapp", "cadastrar_aluno", "salvar_aluno", "inscrever_trilhatech", "mudar_status_trilhatech", "atualizar_contatos_aluno", "excluir_dia_letivo"].includes(requestAction)) {
      // FASE 4: Bypass total da planilha para escritas lentas. 
      // Simula o sucesso para forçar a execução do bloco de gravação local no Firestore logo abaixo.
      result = { status: "sucesso", mensagem: "Sincronizado via Firestore nativo (Bypass)" };
    } else {
      const sheetsResponse = await fetchSheetsQueued(GOOGLE_API_URL, payload);
      const sheetsText = await sheetsResponse.text();
      try {
        result = JSON.parse(sheetsText);
      } catch {
        console.error("[Google Script HTML Error]", sheetsText.substring(0, 500));
        throw new Error(`A API do Google falhou ao retornar JSON (retornou HTML). A ação pode ter sido concluída parcialmente. Sincronize o AVA para confirmar.`);
      }
    }

    // Se for login e teve sucesso, cria a sessão!
    if (requestAction === "login" && result.status === "sucesso") {
      const response = NextResponse.json(result);
      response.cookies.set("tutor_session", "active", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });
      return response;
    }

    // 2. Se for sucesso, e for uma ação de escrita/sincronização do tutor, rodar a escrita local no Firestore
    const ACTIONS_TO_SYNC = [
      "salvar_atividade", "excluir_atividade", "avaliar_entrega", 
      "injetar_xp_manual", "atualizar_senha_checkin", "toggle_modo_reposicao",
      "salvar_configuracoes", "toggle_gabarito", "salvar_gabaritos_lote",
      "justificar_falta",
      "resgatar_badge", "resgatar_aniversario", "confirmar_whatsapp",
      "cadastrar_aluno", "salvar_aluno", "inscrever_trilhatech", "mudar_status_trilhatech", "atualizar_contatos_aluno", "excluir_dia_letivo"
    ];

    if (result.status === "sucesso" && ACTIONS_TO_SYNC.includes(String(payload.action))) {
      let idAtiv = (result.idAtividade || payload.idAtividadeEdit || payload.id) as string | undefined;
      if (!idAtiv && result.mensagem) {
        const match = String(result.mensagem).match(/ATIV-\d+/);
        if (match) idAtiv = match[0];
      }

      const action = payload.action;

      if (action === "salvar_atividade") {
        const ativ = payload;
        const id = String(idAtiv || "").trim();
        if (id) {
          await dbAdmin.collection("atividades").doc(id).set({
            id,
            titulo: String(ativ.titulo || ""),
            descricao: String(ativ.descricao || ""),
            dataLimite: String(ativ.dataLimite || ""),
            xp: Number(ativ.xp) || 0,
            turmaAlvo: String(ativ.turmaAlvo || "Todas").trim(),
            tipo: String(ativ.tipo || "Projeto").trim(),
            opcaoA: String(ativ.opcaoA || ""),
            opcaoB: String(ativ.opcaoB || ""),
            opcaoC: String(ativ.opcaoC || ""),
            opcaoD: String(ativ.opcaoD || ""),
            respostaCorreta: String(ativ.respostaCorreta || ""),
            linkClassroom: String(ativ.linkClassroom || ""),
            statusPublicacao: String(ativ.statusPublicacao || "Publicada").trim(),
            imageUrl: String(ativ.imageUrl || ativ.imagemUrl || ""),
            modulo: String(ativ.modulo || "Geral").trim(),
            gabarito: String(ativ.gabarito || ""),
            gabaritoLiberado: ativ.gabaritoLiberado === true || String(ativ.gabaritoLiberado).toLowerCase() === "true",
            ...(ativ.resolucaoTyping !== undefined ? { resolucaoTyping: String(ativ.resolucaoTyping || "") } : {}),
            ...(ativ.limiteTempoTyping !== undefined ? { limiteTempoTyping: Number(ativ.limiteTempoTyping) || 0 } : {})
          }, { merge: true });
          invalidateRankingCache();
          clearAllPortalCaches();
          await refreshFirestoreCacheAtividades(dbAdmin);
        }
      }

      else if (action === "excluir_dia_letivo") {
        const turma = String(payload.turma || "").trim();
        const dataStr = String(payload.data || "").trim();
        
        if (turma && dataStr) {
          const metaRef = dbAdmin.collection("metadata").doc("dias_aula_turmas");
          
          // Tenta remover a data do array da turma usando FieldValue
          // OBS: Pode ser que dê erro se não tiver importado FieldValue, mas aqui estamos importando 'FieldValue' do firebase-admin/firestore.
          // Se não estiver importado no arquivo, precisaremos ajustar. 
          // O arquivo tem: import { QueryDocumentSnapshot, FieldValue, Timestamp } from "firebase-admin/firestore";
          await metaRef.update({
            [turma]: FieldValue.arrayRemove(dataStr)
          }).catch(() => {}); // catch caso o doc/campo não exista
          
          // Opcional: deletar todas as frequencias da turma neste dia
          const snap = await dbAdmin.collection("frequencia")
            .where("turma", "==", turma)
            .where("data", "==", dataStr)
            .get();
          
          const batchFreq = dbAdmin.batch();
          snap.forEach(doc => batchFreq.delete(doc.ref));
          await batchFreq.commit();
          
          clearAllPortalCaches();
        }
      }

      else if (action === "excluir_atividade") {
        const id = String(payload.idAtividade || idAtiv).trim();
        if (id) {
          await dbAdmin.collection("atividades").doc(id).delete();
          invalidateRankingCache();
          clearAllPortalCaches();
          await refreshFirestoreCacheAtividades(dbAdmin);
        }
      }

      else if (action === "avaliar_entrega") {
        const { idEntrega, matricula, xpGanho, novoStatus, feedback } = payload;
        const mat = String(matricula).trim();
        if (idEntrega && mat) {
          const entregaRef = dbAdmin.collection("entregas").doc(idEntrega);
          const alunoRef = dbAdmin.collection("alunos").doc(mat);

          await dbAdmin.runTransaction(async (transaction: Transaction) => {
            const entregaDoc = await transaction.get(entregaRef);
            const alunoDoc = await transaction.get(alunoRef);

            let statusAnterior = "Aguardando Correção";
            let xpAnterior = 0;

            if (entregaDoc.exists) {
              statusAnterior = entregaDoc.data()?.status || "Aguardando Correção";
              xpAnterior = Number(entregaDoc.data()?.xpGanho) || 0;
            }

            const xpDiff = Number(xpGanho) - xpAnterior;

            transaction.set(entregaRef, {
              id: idEntrega,
              matricula: mat,
              status: novoStatus,
              xpGanho: Number(xpGanho),
              feedback: String(feedback || ""),
              timestamp: Date.now()
            }, { merge: true });

            const idAtividade = entregaDoc.exists 
              ? (entregaDoc.data()?.idAtividade || idEntrega.split("-")[0]) 
              : idEntrega.split("-")[0];

            const getStatusCategory = (status: string, fb: string = "") => {
              const s = String(status).trim();
              if (s === "Aguardando Correção") return "pendentes";
              if (s === "Aguardando Validação" || s === "Aguardando Validacao") return "aguardandoValidacao";
              if (s === "Avaliado" && (fb.includes("Classroom") || fb.includes("AVA") || fb.includes("sincronizada"))) {
                return "validadasAVA";
              }
              return null;
            };

            const oldCat = getStatusCategory(statusAnterior, entregaDoc.data()?.feedback || "");
            const newCat = getStatusCategory(novoStatus, feedback || "");

            if (idAtividade && oldCat !== newCat) {
              const statsRef = dbAdmin.collection("estatisticas_atividades").doc(idAtividade);
              const statsUpdates: Record<string, FieldValue> = {};
              if (oldCat) statsUpdates[oldCat] = FieldValue.increment(-1);
              if (newCat) statsUpdates[newCat] = FieldValue.increment(1);
              transaction.set(statsRef, statsUpdates, { merge: true });
            }

            if (alunoDoc.exists) {
              const currentXp = Number(alunoDoc.data()?.xp) || 0;
              transaction.update(alunoRef, {
                xp: currentXp + xpDiff,
                lastUpdated: Date.now()
              });
            }
          });

          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }

      else if (action === "injetar_xp_manual") {
        const { matriculaAlvo, quantidadeXP, motivo } = payload;
        const mat = String(matriculaAlvo).trim();
        const xp = Number(quantidadeXP) || 0;
        if (mat && xp !== 0) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const timestamp = Date.now();
          const idEntrega = `NOTIF-${timestamp}-${mat}`;

          await dbAdmin.runTransaction(async (transaction: Transaction) => {
            const alunoDoc = await transaction.get(alunoRef);
            if (alunoDoc.exists) {
              const data = alunoDoc.data();
              const currentXp = Number(data?.xpTotal) || Number(data?.xp) || 0;
              transaction.update(alunoRef, {
                xp: currentXp + xp,
                xpTotal: currentXp + xp,
                lastUpdated: timestamp
              });

              transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
                id: idEntrega,
                matricula: mat,
                idAtividade: "BÔNUS/MULTA",
                resposta: String(motivo || "XP Injetado pelo Tutor"),
                status: xp > 0 ? "Bônus" : "Multa",
                xpGanho: xp,
                timestamp
              });
            }
          });

          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }

      else if (action === "atualizar_senha_checkin") {
        const { novaSenha } = payload;
        if (novaSenha) {
          await dbAdmin.collection("configuracoes").doc("SENHA_CHECKIN").set({ valor: String(novaSenha).trim() });
          invalidateConfigCache();
        }
      }

      else if (action === "toggle_modo_reposicao") {
        const { status } = payload;
        if (status) {
          await dbAdmin.collection("configuracoes").doc("MODO_REPOSICAO").set({ valor: String(status).trim() });
          invalidateConfigCache();
        }
      }

      else if (action === "salvar_configuracoes") {
        const { configs } = payload;
        if (configs && typeof configs === "object") {
          const promises = Object.keys(configs).map(key => {
            return dbAdmin.collection("configuracoes").doc(key).set({ valor: configs[key] });
          });
          await Promise.all(promises);
          invalidateConfigCache();
        }
      }

      else if (action === "toggle_gabarito") {
        const { idAtividade } = payload;
        if (idAtividade) {
          const ref = dbAdmin.collection("atividades").doc(idAtividade);
          const doc = await ref.get();
          if (doc.exists) {
            const current = doc.data()?.gabaritoLiberado === true;
            await ref.update({ gabaritoLiberado: !current });
            clearAllPortalCaches();
          }
        }
      }

      else if (action === "salvar_gabaritos_lote") {
        const { atualizacoes } = payload;
        if (Array.isArray(atualizacoes)) {
          const promises = atualizacoes.map((item: { id: string; gabarito?: string; gabaritoLiberado?: boolean }) => {
            return dbAdmin.collection("atividades").doc(item.id).set({
              gabarito: String(item.gabarito || ""),
              gabaritoLiberado: item.gabaritoLiberado === true
            }, { merge: true });
          });
          await Promise.all(promises);
          clearAllPortalCaches();
        }
      }

      else if (action === "justificar_falta") {
        const { matricula, data, justificativa, idFalta } = payload;
        const mat = String(matricula).trim();
        const dataIso = String(data).trim();
        const reason = String(justificativa || "").trim();

        if (mat && dataIso) {
          const partes = dataIso.split("-");
          if (partes.length === 3) {
            const dia = partes[2];
            const mes = partes[1];
            const ano = partes[0];
            const dataBR = `${dia}/${mes}/${ano}`;
            const docId = `${dia}-${mes}-${ano}_${mat}`;

            const finalIdFalta = idFalta ? String(idFalta).trim() : `FALTA-${Date.now()}`;

            const alunoRef = dbAdmin.collection("alunos").doc(mat);
            const alunoDoc = await alunoRef.get();
            const freshAluno = alunoDoc.exists ? alunoDoc.data() : null;
            const nomeAluno = freshAluno ? String(freshAluno.nome || "Aluno") : "Aluno";
            const turmaDoAluno = freshAluno ? String(freshAluno.turmaTrilha || freshAluno.turma || "Todas").trim() : "Todas";

            const docTimestamp = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0).getTime();

            const freqRef = dbAdmin.collection("frequencia").doc(docId);
            await freqRef.set({
              id: finalIdFalta,
              matricula: mat,
              nome: nomeAluno,
              data: dataBR,
              hora: "00:00:00",
              status: "Justificada",
              xpGanho: 0,
              justificativa: reason,
              turma: turmaDoAluno,
              timestamp: docTimestamp
            }, { merge: true });

            invalidatePortalCache(mat);
            invalidateRankingCache();
          }
        }
      }

      else if (action === "resgatar_badge") {
        const { matricula, badgeId, xpGanho, nomeBadge } = payload;
        const mat = String(matricula).trim();
        const xp = Number(xpGanho) || 0;
        if (mat && badgeId) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const idEntrega = `BADGE-${badgeId}-${mat}`;
          await dbAdmin.runTransaction(async (transaction: Transaction) => {
            const alunoDoc = await transaction.get(alunoRef);
            if (alunoDoc.exists) {
              const currentXp = Number(alunoDoc.data()?.xp) || 0;
              transaction.update(alunoRef, {
                xp: currentXp + xp,
                lastUpdated: Date.now()
              });
              transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
                id: idEntrega,
                matricula: mat,
                idAtividade: "RECOMPENSA",
                resposta: `Badge Resgatada: ${nomeBadge}`,
                status: "Badge",
                xpGanho: xp,
                timestamp: Date.now()
              });
            }
          });
          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }

      else if (action === "resgatar_aniversario") {
        const { matricula } = payload;
        const mat = String(matricula).trim();
        if (mat) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const ano = new Date().getFullYear();
          const idEntrega = `BDAY-${ano}-${mat}`;
          await dbAdmin.runTransaction(async (transaction: Transaction) => {
            const alunoDoc = await transaction.get(alunoRef);
            if (alunoDoc.exists) {
              const currentXp = Number(alunoDoc.data()?.xp) || 0;
              transaction.update(alunoRef, {
                xp: currentXp + 500,
                lastUpdated: Date.now()
              });
              transaction.set(dbAdmin.collection("entregas").doc(idEntrega), {
                id: idEntrega,
                matricula: mat,
                idAtividade: "RECOMPENSA",
                resposta: "Presente de Aniversário! 🎉",
                status: "Aniversário",
                xpGanho: 500,
                timestamp: Date.now()
              });
            }
          });
          invalidatePortalCache(mat);
          invalidateRankingCache();
        }
      }

      else if (action === "confirmar_whatsapp") {
        const { matricula } = payload;
        const mat = String(matricula).trim();
        if (mat) {
          const alunoRef = dbAdmin.collection("alunos").doc(mat);
          const alunoDoc = await alunoRef.get();
          if (alunoDoc.exists) {
            const currentXp = Number(alunoDoc.data()?.xp) || 0;
            await alunoRef.update({
              xp: currentXp + 200,
              whatsapp: { confirmado: true }
            });
            invalidatePortalCache(mat);
            invalidateRankingCache();
          }
        }
      }

      else if (action === "cadastrar_aluno" || action === "salvar_aluno") {
        const mat = String(payload.matricula).trim();
        if (mat) {
          await dbAdmin.collection("alunos").doc(mat).set({
            matricula: mat,
            nome: String(payload.nome || ""),
            dataNasc: String(payload.dataNasc || ""),
            email: String(payload.email || ""),
            turma: String(payload.turma || ""),
            telefoneAluno: String(payload.telefoneAluno || ""),
            telefoneResponsavel: String(payload.telefoneResponsavel || ""),
            obs: String(payload.obs || "")
          }, { merge: true });
          invalidatePortalCache(mat);
        }
      }

      else if (action === "atualizar_contatos_aluno") {
        const mat = String(payload.matricula).trim();
        if (mat) {
          await dbAdmin.collection("alunos").doc(mat).update({
            telefone: payload.telefoneAluno || "",
            responsavel: payload.telefoneResponsavel || ""
          });
          clearAllPortalCaches();
        }
      }

      else if (action === "inscrever_trilhatech" || action === "mudar_status_trilhatech") {
        const mat = String(payload.matricula).trim();
        if (mat) {
          const updateData: Record<string, string> = {};
          if (payload.turma) updateData.turmaTrilha = String(payload.turma).trim();
          if (payload.novoStatus) updateData.statusTrilha = String(payload.novoStatus).trim();
          if (action === "inscrever_trilhatech") updateData.statusTrilha = "Ativo";
          
          await dbAdmin.collection("alunos").doc(mat).set(updateData, { merge: true });
          invalidatePortalCache(mat);
        }
      }

    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Action Proxy Error]", err);
    return NextResponse.json({ status: "erro", mensagem: err.message }, { status: 500 });
  }
}
