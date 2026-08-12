const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const CODE = '4/0AXEQxICCZLcpIo2EEiFJ6mL5HYIqQWvSLkufak4Z3Jbxk8pqahzqNhDmGT67V6O3nPZsuA';

async function run() {
  try {
    const { tokens } = await oauth2Client.getToken(decodeURIComponent(CODE));
    console.log('REFRESH_TOKEN=' + tokens.refresh_token);
  } catch(e) {
    console.error(e.message);
  }
}
run();
