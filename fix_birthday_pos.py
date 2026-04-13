import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '-translate-y-[10%]'
nove  = 'translate-y-[10%]'

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - posunuto o 10% dolu")
else:
    print("CHYBA - vzor nenalezen, vypisuji kontext:")
    idx = kod.find('isBirthday(day)')
    print(repr(kod[idx:idx+200]) if idx != -1 else "Nenalezeno")
