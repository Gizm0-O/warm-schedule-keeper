import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = 'translate-y-[10%]'
nove  = '-translate-y-[5%]'

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - posunuto o 5% nahoru")
else:
    print("CHYBA - vypisuji kontext:")
    idx = kod.find('translate-y')
    print(repr(kod[idx:idx+100]) if idx != -1 else "Nenalezeno")
