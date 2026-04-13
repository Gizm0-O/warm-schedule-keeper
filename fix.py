fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Zvýšení opacity u klasických (timed) event bloků v týdenním pohledu
# bg-*/20 → bg-*/35, border-*/30 → border-*/50
import re

# EVENT_COLORS - zvýšit opacity pozadí a borderu
stare = [
    '"bg-primary/20 text-primary border-primary/30"',
    '"bg-destructive/20 text-destructive border-destructive/30"',
    '"bg-success/20 text-success border-success/30"',
    '"bg-warning/20 text-warning border-warning/30"',
]
nove = [
    '"bg-primary/35 text-primary border-primary/50"',
    '"bg-destructive/35 text-destructive border-destructive/50"',
    '"bg-success/35 text-success border-success/50"',
    '"bg-warning/35 text-warning border-warning/50"',
]

zmeneno = 0
for s, n in zip(stare, nove):
    if s in kod:
        kod = kod.replace(s, n)
        zmeneno += 1

print(f"OK - změněno {zmeneno}/4 barev")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
