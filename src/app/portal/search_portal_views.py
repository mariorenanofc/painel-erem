with open("c:/Users/Mario Renan/OneDrive/Área de Trabalho/painel-erem/src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
lines = content.split("\n")
for i, line in enumerate(lines):
    if "useState" in line or "Tab" in line or "Aba" in line or "View" in line:
        if len(line.strip()) < 120:
            print(f"{i+1}: {line.strip()}")
