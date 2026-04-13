fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

nahrazeni = {
    # Timed event bloky v týdenním pohledu – text větší, tučnější
    '"absolute rounded-md border-l-2 px-1.5 py-0.5 text-10px font-medium truncate z-10 cursor-grab group hover:opacity-80"':
    '"absolute rounded-md border-l-2 px-1.5 py-0.5 text-xs font-semibold truncate z-10 cursor-grab group hover:opacity-80"',

    # Čas pod názvem události
    '"text-9px opacity-60"':
    '"text-10px opacity-80 font-medium"',

    # Události v měsíčním pohledu
    '"truncate rounded-md px-1.5 py-0.5 text-10px font-medium"':
    '"truncate rounded-md px-1.5 py-0.5 text-xs font-semibold"',
}

zmeneno = 0
for stare, nove in nahrazeni.items():
    pocet = kod.count(stare)
    if pocet > 0:
        kod = kod.replace(stare, nove)
        zmeneno += pocet
        print(f"OK ({pocet}x): {stare[:60]}...")
    else:
        print(f"CHYBA - nenalezeno: {stare[:60]}...")

print(f"\nCelkem změněno: {zmeneno}")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
