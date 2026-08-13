const fs = require('fs');
const path = require('path');
const dir = 'src/components/games';

fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.tsx') || file === 'JogosLayout.tsx') return;
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');

  // Skip if already patched
  if (content.includes('isFinishedRef')) return;

  // 1. Add isFinishedRef
  content = content.replace(
    /const \[score, setScore\] = useState\(0\);/,
    'const [score, setScore] = useState(0);\n  const isFinishedRef = React.useRef(false);'
  );

  // 2. Block handleAnswer / handleOptionClick / handleCategorySelect / handleSelect
  // We need to inject `if (isFinishedRef.current) return;` at the top of the function
  content = content.replace(
    /(const handle(?:Answer|OptionClick|CategorySelect|Select|TimeUp) = \([^)]*\) => \{)/g,
    '$1\n    if (isFinishedRef.current) return;'
  );

  // 3. Mark isFinishedRef.current = true just before onGameOver
  content = content.replace(
    /(onGameOver\([^)]*\);)/g,
    'isFinishedRef.current = true;\n      $1'
  );

  // 4. Reset on handleStart
  content = content.replace(
    /(const handleStart = \(\) => \{)/g,
    '$1\n    if (isFinishedRef) isFinishedRef.current = false;'
  );

  fs.writeFileSync(p, content);
  console.log('Successfully patched', file);
});
