fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = 'textShadow: "0 0 4px rgba(255,255,255,1), 1px 1px 4px rgba(0,0,0,1), 2px 2px 6px rgba(0,0,0,0.9)",'
nove  = 'textShadow: "0 0 4px rgba(255,255,255,1), 1px 1px 2px rgba(0,0,0,0.95)",'

if stare in kod:
    kod = kod.replace(stare, nove)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - jeden shadow, blizko, vyrazny")
else:
    print("CHYBA - vzor nenalezen")
