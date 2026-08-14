const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Se o OAuth Client for "Aplicativo da Web", podemos usar um redirect URI local
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Os escopos que precisamos para gerenciar o Classroom
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students', // Para criar/editar atividades
  'https://www.googleapis.com/auth/classroom.announcements',       // Para criar avisos
  'https://www.googleapis.com/auth/classroom.profile.emails',      // Para buscar e-mails dos perfis
  'https://www.googleapis.com/auth/classroom.rosters.readonly',    // Para ler membros/alunos
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Isso obriga o Google a nos dar um REFRESH_TOKEN
  prompt: 'consent',      // Força a tela de consentimento para garantir o refresh_token
  scope: SCOPES,
});

console.log('\n======================================================');
console.log('🔗 ACESSE ESTE LINK NO SEU NAVEGADOR PARA AUTORIZAR:');
console.log('======================================================\n');
console.log(url);
console.log('\n======================================================');
console.log('Quando você autorizar, o navegador vai te redirecionar para:');
console.log('http://localhost:3000/api/auth/callback?code=ALGUM_CODIGO_AQUI...');
console.log('\nVai dar erro na tela (Não é possível acessar esse site), ISSO É NORMAL!');
console.log('Olhe para a URL (Barra de endereços) do navegador.');
console.log('Copie apenas o valor que vem depois de "code=" (até o final ou até encontrar um "&") e cole abaixo.');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nCole o "code" ou a URL inteira aqui: ', async (inputCode) => {
  try {
    let code = inputCode.trim();
    // Se o usuário colou a URL inteira ou algo com "code="
    if (code.includes('code=')) {
      const match = code.match(/code=([^&]+)/);
      if (match) {
        code = match[1];
      }
    }
    const { tokens } = await oauth2Client.getToken(decodeURIComponent(code));
    console.log('\n✅ AUTORIZAÇÃO BEM SUCEDIDA!\n');
    console.log('Abra o seu arquivo .env.local e adicione este REFRESH_TOKEN:');
    console.log('\n------------------------------------------------------');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('------------------------------------------------------\n');
    if (!tokens.refresh_token) {
        console.log('ATENÇÃO: Nenhum refresh_token foi retornado. Você precisa remover o acesso do app na sua conta Google e tentar de novo.');
    }
  } catch (err) {
    console.error('❌ Erro ao obter os tokens:', err.message);
  }
  rl.close();
});
