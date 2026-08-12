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

    const report: any = {};

    // 1. Migrate usuarios
    const uRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'usuarios!A2:C' });
    const uRows = uRes.data?.values || [];
    let uCount = 0;
    for (const r of uRows) {
      if (!r[0]) continue;
      const usuario = String(r[0]).trim().toLowerCase();
      const senha = String(r[1] || '').trim();
      const nome = String(r[2] || '').trim();
      await dbAdmin.collection('usuarios').doc(usuario).set({ usuario, senha, nome, role: 'admin' });
      uCount++;
    }
    report.usuariosMigrados = uCount;

    // 2. Migrate controle_modulos
    const mRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'controle_modulos!A2:C' });
    const mRows = mRes.data?.values || [];
    let mCount = 0;
    for (const r of mRows) {
      if (!r[0]) continue;
      const nomeMod = String(r[0]).trim();
      const statusMod = String(r[1] || 'Aberto').trim();
      const turmaMod = String(r[2] || 'Todas').trim();
      const idMod = `${nomeMod}_${turmaMod}`.replace(/\s+/g, '_').toLowerCase();
      await dbAdmin.collection('controle_modulos').doc(idMod).set({ 
        id: idMod, 
        nomeMod, 
        statusMod, 
        turmaMod 
      });
      mCount++;
    }
    report.modulosMigrados = mCount;

    // 3. Migrate logs_seguranca
    const lRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'logs_seguranca!A2:E' });
    const lRows = lRes.data?.values || [];
    let lCount = 0;
    for (const r of lRows) {
      if (!r[0]) continue;
      const dataHora = String(r[0] || '').trim();
      const matricula = String(r[1] || '').trim();
      const nome = String(r[2] || '').trim();
      const acao = String(r[3] || '').trim();
      const detalhes = String(r[4] || '').trim();
      
      // Generate a document ID for the log
      await dbAdmin.collection('logs_seguranca').add({ 
        dataHora, 
        matricula, 
        nome, 
        acao,
        detalhes,
        timestamp: new Date().getTime()
      });
      lCount++;
    }
    report.logsMigrados = lCount;

    return NextResponse.json({ status: 'sucesso', report });
  } catch (error: any) {
    return NextResponse.json({ status: 'erro', message: error.message }, { status: 500 });
  }
}
