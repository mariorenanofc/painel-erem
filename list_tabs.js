require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

const SPREADSHEET_ID = '1himFlAIQbTyLiUnytkE5MsUiq9X47vdH3DaB59U9y-E';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function run() {
  try {
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const tabNames = sheetInfo.data.sheets.map(s => s.properties.title);
    console.log(JSON.stringify(tabNames));
  } catch (e) {
    console.error(e.message);
  }
}
run();
