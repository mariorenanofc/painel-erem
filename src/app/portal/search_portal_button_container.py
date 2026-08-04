with open("c:/Users/Mario Renan/OneDrive/Área de Trabalho/painel-erem/src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
matches = re.finditer(r'Meus Bilhetes', content)
for m in matches:
    start = max(0, m.start() - 350)
    end = min(len(content), m.end() + 600)
    lines_before = content[:start].count("\n") + 1
    lines_after = content[:end].count("\n") + 1
    print(f"Lines: {lines_before} to {lines_after}")
    print(content[start:end].encode('ascii', errors='ignore').decode('ascii'))
    print("=" * 40)
