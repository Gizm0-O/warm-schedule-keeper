fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '"text-xl text-amber-700 leading-tight"'
nove  = '"text-2xl text-amber-700 leading-tight"'

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - text vetsi (text-2xl)")
else:
    idx = kod.find('text-amber-700 leading-tight')
    print("CHYBA:", repr(kod[idx:idx+100]) if idx != -1 else "Nenalezeno")
