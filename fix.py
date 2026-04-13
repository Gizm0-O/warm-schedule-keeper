fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

import re

# Zobraz aktuální EVENT_COLORS
match = re.search(r'const EVENT_COLORS.*?\];', kod, re.DOTALL)
if match:
    print("AKTUÁLNÍ EVENT_COLORS:")
    print(match.group()[:500])
else:
    print("EVENT_COLORS nenalezeno")

# Nahraď COKOLIV v EVENT_COLORS hodnotách - regex přístup
# Vzor: "bg-XXX/YY text-XXX border-XXX/YY" -> plná barva + bílý text
nahrazeni = [
    (r'"bg-primary/\d+ text-primary border-primary/\d+"',    '"bg-primary/85 text-white border-primary"'),
    (r'"bg-destructive/\d+ text-destructive border-destructive/\d+"', '"bg-destructive/85 text-white border-destructive"'),
    (r'"bg-success/\d+ text-success border-success/\d+"',    '"bg-success/85 text-white border-success"'),
    (r'"bg-warning/\d+ text-warning border-warning/\d+"',    '"bg-warning/85 text-white border-warning"'),
]

zmeneno = 0
for vzor, nahrada in nahrazeni:
    novy, pocet = re.subn(vzor, nahrada, kod)
    if pocet > 0:
        kod = novy
        zmeneno += pocet
        print(f"OK ({pocet}x): {vzor[:50]}")
    else:
        print(f"MISS: {vzor[:50]}")

print(f"\nCelkem změn: {zmeneno}")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
