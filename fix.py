fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = 'const isAnniversaryDay = new Date().getDate() === 20;'
nove  = 'const isAnniversaryDay = new Date().getDate() === 13; // TODO: změnit zpět na 20'

if stare in kod:
    kod = kod.replace(stare, nove)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - testovaci datum 13")
else:
    print("CHYBA - vzor nenalezen")
