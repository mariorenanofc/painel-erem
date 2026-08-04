import { invalidatePortalCache, invalidateRankingCache } from "@/src/lib/cache";
import { NextResponse } from "next/server";
import { QueryDocumentSnapshot, Transaction } from "firebase-admin/firestore";
const GOOGLE_API_URL = process.env.NEXT_PUBLIC_GOOGLE_API_URL
  ? process.env.NEXT_PUBLIC_GOOGLE_API_URL.replace(/^["']|["']$/g, "").trim()
  : undefined;
import { dbAdmin } from "@/src/lib/firebaseAdmin";

const CONTA_MESTRE = "1234567";

export async function POST(request: Request) {
  let matriculaOrigem = "";
  let senhaDigitada = "";
  let matriculaDestino = "";
  let quantidade = 0;
  let motivo = "";
  try {
    const body = await request.json();
    matriculaOrigem = String(body.matriculaOrigem || "").trim();
    senhaDigitada = String(body.senha || "").trim();
    matriculaDestino = String(body.matriculaDestino || "").trim();
    quantidade = Number(body.quantidade);
    motivo = String(body.motivo || "").trim();

    if (!matriculaOrigem || !senhaDigitada || !matriculaDestino || quantidade <= 0) {
      return NextResponse.json({ status: "erro", mensagem: "Parâmetros inválidos." }, { status: 400 });
    }

    if (matriculaOrigem === matriculaDestino) {
      return NextResponse.json({ status: "erro", mensagem: "Você não pode transferir XP para si mesmo!" });
    }

    const ehMestre = (matriculaOrigem === CONTA_MESTRE);

    // 1. Carregar alunos (Origem e Destino)
    const senderRef = dbAdmin.collection("alunos").doc(matriculaOrigem);
    const receiverRef = dbAdmin.collection("alunos").doc(matriculaDestino);

    const senderDoc = await senderRef.get();
    const receiverDoc = await receiverRef.get();

    if (!senderDoc.exists || !receiverDoc.exists) {
      return NextResponse.json({ status: "erro", mensagem: "Contas não encontradas." });
    }

    const sender = senderDoc.data()!;
    const receiver = receiverDoc.data()!;

    // 2. Verificar regras básicas
    if (String(sender.statusTrilha || "").toLowerCase() !== "ativo") {
      return NextResponse.json({ status: "erro", mensagem: "Apenas alunos ativos podem enviar Pix de XP." });
    }
    if (String(receiver.statusTrilha || "").toLowerCase() !== "ativo") {
      return NextResponse.json({ status: "erro", mensagem: "Apenas alunos ativos podem receber Pix de XP." });
    }
    if (sender.bloqueioPix === true) {
      return NextResponse.json({ status: "erro", mensagem: "Você está bloqueado de enviar Pix de XP no painel." });
    }

    const senhaReal = String(sender.pinPix || "").trim();
    if (senhaDigitada !== senhaReal) {
      return NextResponse.json({ status: "erro", mensagem: "Senha PIN incorreta." });
    }

    const xpOrigem = Number(sender.xp) || 0;
    const xpGastoOrigem = Number(sender.xpGasto) || 0;
    const saldoOrigem = xpOrigem - xpGastoOrigem;

    if (!ehMestre && saldoOrigem < quantidade) {
      return NextResponse.json({ status: "erro", mensagem: "Você não tem XP suficiente." });
    }

    // 3. Obter Limites e Prazos
    const configDoc = await dbAdmin.collection("configuracoes").doc("LIMITE_PIX_DIARIO").get();
    const limiteDiario = Number(configDoc.data()?.valor) || 50;

    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const diaHoje = String(spDate.getDate()).padStart(2, "0");
    const mesHoje = String(spDate.getMonth() + 1).padStart(2, "0");
    const anoHoje = String(spDate.getFullYear());
    
    const hojeStr = `${anoHoje}${mesHoje}${diaHoje}`;
    const prefixoHoje = `PIX-${hojeStr}`;
    const seteDiasAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // 4. Analisar limites diários e semanais
    const entregasOrigemSnap = await dbAdmin.collection("entregas")
      .where("matricula", "==", matriculaOrigem)
      .get();

    const entregasDestinoSnap = await dbAdmin.collection("entregas")
      .where("matricula", "==", matriculaDestino)
      .get();

    let xpDoadoHoje = 0;
    let xpEnviadoSemana = 0;
    let temBloqueio = false;
    let dataBloqueio = "";

    // Analisar bloqueios ativos do remetente
    const blockId = `BLOCK-${matriculaOrigem}-${matriculaDestino}`;
    const blockDoc = await dbAdmin.collection("entregas").doc(blockId).get();
    if (blockDoc.exists) {
      const bData = blockDoc.data()!;
      const expiry = Number(bData.timestamp) || 0;
      if (Date.now() < expiry) {
        temBloqueio = true;
        const expiryDate = new Date(expiry);
        const diaB = String(expiryDate.getDate()).padStart(2, "0");
        const mesB = String(expiryDate.getMonth() + 1).padStart(2, "0");
        const anoB = String(expiryDate.getFullYear());
        const horaB = String(expiryDate.getHours()).padStart(2, "0");
        const minB = String(expiryDate.getMinutes()).padStart(2, "0");
        dataBloqueio = `${diaB}/${mesB}/${anoB} ${horaB}:${minB}`;
      }
    }

    if (temBloqueio) {
      return NextResponse.json({ status: "erro", mensagem: `🔒 Você está bloqueado de enviar XP para este colega até ${dataBloqueio}.` });
    }

    // Calcular XP doado hoje e na semana
    entregasOrigemSnap.forEach((doc: QueryDocumentSnapshot) => {
      const id = doc.id;
      const v = doc.data();
      const xp = Number(v.xpGanho) || 0;
      const timestamp = v.timestamp || 0;
      const desc = String(v.resposta || "");

      if (id.startsWith(prefixoHoje) && id.includes("-ENVIOU")) {
        xpDoadoHoje += Math.abs(xp);
      }
      if (id.includes("-ENVIOU") && timestamp >= seteDiasAtras) {
        if (desc.includes(`Enviou para ${matriculaDestino}:`)) {
          xpEnviadoSemana += Math.abs(xp);
        }
      }
    });

    // Calcular XP recebido hoje pelo destinatário
    let xpRecebidoHojeDestino = 0;
    entregasDestinoSnap.forEach((doc: QueryDocumentSnapshot) => {
      const id = doc.id;
      const v = doc.data();
      const xp = Number(v.xpGanho) || 0;
      if (id.startsWith(prefixoHoje) && id.includes("-RECEBEU")) {
        xpRecebidoHojeDestino += xp;
      }
    });

    // Verificar restrições de limite
    if (!ehMestre) {
      if (xpDoadoHoje + quantidade > limiteDiario) {
        return NextResponse.json({ status: "erro", mensagem: `Limite global excedido! Você só pode doar mais ${limiteDiario - xpDoadoHoje} XP hoje.` });
      }
      if (xpRecebidoHojeDestino + quantidade > 50) {
        return NextResponse.json({ status: "erro", mensagem: "🔒 O colega de destino já atingiu o limite de receber 50 XP por dia." });
      }
    }

    // 5. Aplicar transferência na Transação
    const tstamp = Date.now();
    const idEnvio = `PIX-${hojeStr}-${tstamp}-ENVIOU`;
    const idRecebeu = `PIX-${hojeStr}-${tstamp}-RECEBEU`;

    await dbAdmin.runTransaction(async (transaction: Transaction) => {
      const freshSender = (await transaction.get(senderRef)).data()!;
      const freshReceiver = (await transaction.get(receiverRef)).data()!;

      const freshXpGastoOrigem = Number(freshSender.xpGasto) || 0;
      const freshXpDestino = Number(freshReceiver.xp) || 0;

      // 1. Debitar da Origem (se não for Mestre)
      if (!ehMestre) {
        transaction.update(senderRef, {
          xpGasto: freshXpGastoOrigem + quantidade
        });
      }

      // 2. Creditar no Destino
      transaction.update(receiverRef, {
        xp: freshXpDestino + quantidade
      });

      // 3. Registrar Log do Envio (Origem)
      const logEnvioRef = dbAdmin.collection("entregas").doc(idEnvio);
      transaction.set(logEnvioRef, {
        id: idEnvio,
        matricula: matriculaOrigem,
        idAtividade: "TRANSFERENCIA-XP",
        resposta: `Enviou para ${matriculaDestino}: ${motivo}`,
        status: "Avaliado",
        xpGanho: -quantidade,
        timestamp: tstamp,
        feedback: "Transferência enviada"
      });

      // 4. Registrar Log do Recebimento (Destino)
      const logRecRef = dbAdmin.collection("entregas").doc(idRecebeu);
      transaction.set(logRecRef, {
        id: idRecebeu,
        matricula: matriculaDestino,
        idAtividade: "TRANSFERENCIA-XP",
        resposta: `Recebeu de ${matriculaOrigem}: ${motivo}`,
        status: "Avaliado",
        xpGanho: quantidade,
        timestamp: tstamp,
        feedback: "Transferência recebida"
      });

      // 5. Aplicar Bloqueio se ultrapassar 100 XP por semana para o mesmo colega
      if (!ehMestre && xpEnviadoSemana + quantidade > 100) {
        const blockRef = dbAdmin.collection("entregas").doc(blockId);
        const dataExpira = tstamp + (7 * 24 * 60 * 60 * 1000);
        transaction.set(blockRef, {
          id: blockId,
          matricula: matriculaOrigem,
          idAtividade: "PIX-BLOCK",
          resposta: matriculaDestino,
          status: "Bloqueado",
          xpGanho: 0,
          timestamp: dataExpira,
          feedback: "Bloqueio temporário por limite semanal"
        });
      }
    });

    invalidatePortalCache(matriculaOrigem);
    invalidatePortalCache(matriculaDestino);
    invalidateRankingCache();
    return NextResponse.json({ status: "sucesso", mensagem: `Pix realizado com sucesso! Enviados ${quantidade} XP.` });

  } catch (error: unknown) {
    const err = error as Error;
    console.warn("[Failover] Erro na transferência de XP do Firestore:", err.message);
    if (GOOGLE_API_URL) {
      try {
        const response = await fetch(GOOGLE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "transferir_xp", matriculaOrigem, senha: senhaDigitada, matriculaDestino, quantidade, motivo }),
        });
        return NextResponse.json(await response.json());
      } catch {
        // Ignora erro do Sheets no failover
      }
    }
    return NextResponse.json({ status: "erro", mensagem: "Erro ao processar transferência: " + err.message }, { status: 500 });
  }
}
