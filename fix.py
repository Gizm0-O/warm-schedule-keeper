fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Změnit EVENT_COLORS - bílý text na sytém pozadí
nahrazeni = {
    '"bg-primary/50 text-primary border-primary/60"':
        '"bg-primary/75 text-white border-primary/80"',
    '"bg-destructive/50 text-destructive border-destructive/60"':
        '"bg-destructive/75 text-white border-destructive/80"',
    '"bg-success/50 text-success border-success/60"':
        '"bg-success/75 text-white border-success/80"',
    '"bg-warning/50 text-warning border-warning/60"':
        '"bg-warning/75 text-white border-warning/80"',
}

zmeneno = 0
for stare, nove in nahrazeni.items():
    if stare in kod:
        kod = kod.replace(stare, nove)
        zmeneno += 1
        print(f"OK: {stare[:50]}...")
    else:
        print(f"CHYBA: {stare[:50]}...")

print(f"\nCelkem: {zmeneno}/4")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
