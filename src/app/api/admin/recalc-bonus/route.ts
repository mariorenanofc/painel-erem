import { NextResponse } from 'next/server';
import { dbAdmin } from '@/src/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { getRankingKeys } from '@/src/lib/dateUtils';
import { invalidateRankingCache } from '@/src/lib/cache';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        if (url.searchParams.get('token') !== '123') return NextResponse.json({ erro: 'Não autorizado' });

        const dataAtual = new Date();
        dataAtual.setHours(0, 0, 0, 0); // Considerar atividades apenas a partir de hoje
        const timestampHoje = dataAtual.getTime();

        const entregasSnap = await dbAdmin.collection('entregas')
            .where('timestamp', '>=', timestampHoje)
            .get();

        const { semanaKey, mesKey } = getRankingKeys(new Date());
        const batch = dbAdmin.batch();
        let cont = 0;
        const diffs: string[] = [];

        for (const doc of entregasSnap.docs) {
            const e = doc.data();
            const xp = e.xpGanho || 0;
            const matricula = e.matricula;
            const idAtiv = e.idAtividade;
            const timestamp = e.timestamp || Date.now();

            if (xp === 0) continue;
            
            // Só vamos processar Bônus, Multas e Badges (que não foram processados antes da modificação do código)
            if (idAtiv !== 'BÔNUS/MULTA' && idAtiv !== 'RECOMPENSA') continue;

            const rankSemanaRef = dbAdmin.collection('estatisticas').doc(`ranking_semanal_${semanaKey}`);
            batch.set(rankSemanaRef, { 
                alunos: {
                    [matricula]: {
                        xpNormal: FieldValue.increment(xp),
                        ultimoEnvio: timestamp
                    }
                }
            }, { merge: true });

            const rankMesRef = dbAdmin.collection('estatisticas').doc(`ranking_mensal_${mesKey}`);
            batch.set(rankMesRef, { 
                alunos: {
                    [matricula]: {
                        xpNormal: FieldValue.increment(xp),
                        ultimoEnvio: timestamp
                    }
                }
            }, { merge: true });

            cont++;
            diffs.push(`Aluno ${matricula} recebeu +${xp} XP no ranking (Atividade: ${idAtiv})`);
        }

        if (cont > 0) {
            await batch.commit();
            invalidateRankingCache();
        }

        return NextResponse.json({ 
            mensagem: 'Recálculo finalizado com sucesso',
            modificados: cont,
            detalhes: diffs
        });
    } catch (e: unknown) {
        const err = e as Error;
        return NextResponse.json({ erro: err.message }, { status: 500 });
    }
}
