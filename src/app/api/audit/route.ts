import { NextResponse } from 'next/server';
import { dbAdmin } from '@/src/lib/firebaseAdmin';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1himFlAIQbTyLiUnytkE5MsUiq9X47vdH3DaB59U9y-E';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const tabNames = sheetInfo.data.sheets?.map(s => s.properties?.title) || [];

    const report: Record<string, unknown>[] = [];

    const targetTabs = ['basededados', 'trilhatech', 'frequencia', 'atividades', 'entregas', 'curtidas', 'configuracoes', 'usuarios', 'controle_modulos', 'logs_seguranca', 'rifa_bilhetes'];

    for (const tab of targetTabs) {
      if (tabNames.includes(tab)) {
        const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!A2:A` });
        const sRows = sRes.data?.values || [];
        const sheetsCount = sRows.filter((r: unknown[]) => r[0] && String(r[0]).trim() !== '').length;
        
        let collectionName = tab;
        if (tab === 'basededados' || tab === 'trilhatech') collectionName = 'alunos';

        const snap = await dbAdmin.collection(collectionName).get();
        const firebaseCount = snap.size;

        report.push({
          aba_planilha: tab,
          linhas_planilha: sheetsCount,
          colecao_firebase: collectionName,
          documentos_firebase: firebaseCount,
          diferenca: sheetsCount - firebaseCount
        });
      }
    }

    return NextResponse.json({ status: 'sucesso', report });
  } catch (error: unknown) {
    return NextResponse.json({ status: 'erro', message: (error as Error).message }, { status: 500 });
  }
}
