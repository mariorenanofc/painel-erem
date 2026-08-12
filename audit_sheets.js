require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const admin = require('firebase-admin');

const SPREADSHEET_ID = '1himFlAIQbTyLiUnytkE5MsUiq9X47vdH3DaB59U9y-E';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    })
  });
}
const db = admin.firestore();

console.log('Firebase Inicializado.');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
console.log('Google Auth Configurado.');

async function runAudit() {
  console.log('--- INICIANDO AUDITORIA ---');
  try {
    console.log('Buscando abas da planilha...');
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const tabNames = sheetInfo.data.sheets.map(s => s.properties.title);
    console.log('Abas encontradas:', tabNames.join(', '));

    const report = {};

    // 1. Alunos (Base de dados / Trilhatech)
    console.log('\n[1] Lendo Alunos...');
    const baseSnap = await db.collection('alunos').get();
    report.firebaseAlunos = baseSnap.size;
    
    if (tabNames.includes('trilhatech')) {
      const tRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'trilhatech!A2:A' });
      const tRows = tRes.data.values || [];
      const matriculasValidas = tRows.filter(r => r[0] && String(r[0]).trim() !== '').length;
      report.sheetsAlunosAtivos = matriculasValidas;
    }

    // 2. Frequencia
    console.log('[2] Lendo Frequência...');
    const freqSnap = await db.collection('frequencia').get();
    report.firebaseFrequencia = freqSnap.size;

    if (tabNames.includes('frequencia')) {
      const fRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'frequencia!A2:A' });
      const fRows = fRes.data.values || [];
      report.sheetsFrequencia = fRows.filter(r => r[0] && String(r[0]).trim() !== '').length;
    }

    // 3. Entregas
    console.log('[3] Lendo Entregas...');
    const entSnap = await db.collection('entregas').get();
    report.firebaseEntregas = entSnap.size;

    if (tabNames.includes('entregas')) {
      const eRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'entregas!A2:A' });
      const eRows = eRes.data.values || [];
      report.sheetsEntregas = eRows.filter(r => r[0] && String(r[0]).trim() !== '').length;
    }

    // 4. Atividades
    console.log('[4] Lendo Atividades...');
    const ativSnap = await db.collection('atividades').get();
    report.firebaseAtividades = ativSnap.size;

    if (tabNames.includes('atividades')) {
      const aRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'atividades!A2:A' });
      const aRows = aRes.data.values || [];
      report.sheetsAtividades = aRows.filter(r => r[0] && String(r[0]).trim() !== '').length;
    }

    console.log('\n--- RELATÓRIO FINAL ---');
    console.table(report);

    const diffs = [];
    if (report.sheetsFrequencia !== report.firebaseFrequencia) diffs.push(`Frequencia: Sheets=${report.sheetsFrequencia}, FB=${report.firebaseFrequencia}`);
    if (report.sheetsEntregas !== report.firebaseEntregas) diffs.push(`Entregas: Sheets=${report.sheetsEntregas}, FB=${report.firebaseEntregas}`);
    if (report.sheetsAtividades !== report.firebaseAtividades) diffs.push(`Atividades: Sheets=${report.sheetsAtividades}, FB=${report.firebaseAtividades}`);
    
    if (diffs.length === 0) {
      console.log('✅ SUCESSO: Todos os dados primários batem perfeitamente!');
    } else {
      console.log('⚠️ AVISO: Encontramos discrepâncias nas contagens:\n' + diffs.join('\n'));
    }

  } catch(e) {
    console.error('ERRO:', e.message);
  }
  process.exit(0);
}

runAudit();
