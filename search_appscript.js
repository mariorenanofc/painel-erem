const fs = require('fs');
const lines = fs.readFileSync('necessarios MD/appscript.md', 'utf-8').split('\n');
lines.forEach((l, i) => {
  const lc = l.toLowerCase();
  if (lc.includes('usuario') || lc.includes('modulo') || lc.includes('log') || lc.includes('seguranca')) {
    if (l.trim().length > 0) {
      console.log(`[${i+1}] ${l.trim()}`);
    }
  }
});
