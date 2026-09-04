import { NextResponse } from 'next/server';
import { dbAdmin } from '@/src/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { getRankingKeys } from '@/src/lib/dateUtils';
import { invalidateRankingCache, clearAllPortalCaches } from '@/src/lib/cache';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        if (url.searchParams.get('token') !== '123') return NextResponse.json({ erro: 'Não autorizado' });

        const entregasSnap = await dbAdmin.collection('entregas')
            .where('xpGanho', '>', 0)
            .get();

        const dataAtual = new Date();
        const { semanaKey, mesKey } = getRankingKeys(dataAtual);
        const batch = dbAdmin.batch();
        let cont = 0;
        let diffs = [];

        for (const doc of entregasSnap.docs) {
            const e = doc.data();
            const xpParaRemover = e.xpGanho;
            const matricula = e.matricula;
            const idAtiv = e.idAtividade;
            const status = e.status;

            if (status !== 'Avaliado') continue;

            const dataEntrega = new Date(e.timestamp || 0);
            const diffHoras = (dataAtual.getTime() - dataEntrega.getTime()) / (1000 * 60 * 60);

            // Apenas entregas de hoje/ontem
            if (diffHoras > 24) continue;

            // Checar módulo da atividade
            const ativDoc = await dbAdmin.collection('atividades').doc(idAtiv).get();
            if (!ativDoc.exists) continue;
            
            const ativ = ativDoc.data();
            if (!ativ.modulo || !ativ.modulo.toLowerCase().includes('javascript')) continue;

            // É do Módulo 2.2 Javascript!
            batch.update(doc.ref, { 
                xpGanho: 0, 
                feedback: (e.feedback || '') + ' \n[CORREÇÃO ADMIN: Módulo Encerrado = 0 XP]'
            });

            batch.update(dbAdmin.collection('alunos').doc(matricula), { 
                xpTotal: FieldValue.increment(-xpParaRemover), 
                xp: FieldValue.increment(-xpParaRemover) 
            });

            batch.update(dbAdmin.collection('estatisticas').doc(`ranking_semanal_${semanaKey}`), { 
                [`alunos.${matricula}.xpNormal`]: FieldValue.increment(-xpParaRemover) 
            });

            batch.update(dbAdmin.collection('estatisticas').doc(`ranking_mensal_${mesKey}`), { 
                [`alunos.${matricula}.xpNormal`]: FieldValue.increment(-xpParaRemover) 
            });

            cont++;
            diffs.push(`Aluno ${matricula} corrigido: -${xpParaRemover} XP`);
        }

        if (cont > 0) {
            await batch.commit();
            invalidateRankingCache();
            clearAllPortalCaches();
        }

        return NextResponse.json({ 
            mensagem: 'Correção finalizada com sucesso',
            modificados: cont,
            detalhes: diffs
        });
    } catch (e: any) {
        return NextResponse.json({ erro: e.message }, { status: 500 });
    }
}
