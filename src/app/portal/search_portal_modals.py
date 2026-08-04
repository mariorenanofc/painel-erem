with open("c:/Users/Mario Renan/OneDrive/Área de Trabalho/painel-erem/src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
matches = re.finditer(r'useState\((?:true|false)\);\s*//.*modal|Modal', content, re.IGNORECASE)
for m in matches:
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 500)
    print(content[start:end].encode('ascii', errors='ignore').decode('ascii'))
    print("=" * 40)
