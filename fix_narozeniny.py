import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

if 'isBirthday(day) && (<span' in kod:
    print("Jmeno uz existuje!"); exit(0)

# Hledame format dne v mesicnim pohledu a pridame jmeno za cislo
vzor = r'(\{format\(day,\s*"d"\)\})([\s\S]{0,50}?)(\{NAME_DAYS)'
nahrada = r'\1\2{isBirthday(day) && (<span className="text-xs font-semibold text-amber-600 leading-tight block">{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>)}\n\3'

novy_kod, n = re.subn(vzor, nahrada, kod, count=1)
if n:
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(novy_kod)
    print("OK - Jmeno narozeninaře pridano!")
else:
    # Zkusime alternativni vzor
    vzor2 = r'(\{format\(day,\s*"d"\)\})\s*\n'
    nahrada2 = r'\1\n{isBirthday(day) && (<span className="text-xs font-semibold text-amber-600 leading-tight block">{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>)}\n'
    novy_kod, n2 = re.subn(vzor2, nahrada2, kod, count=1)
    if n2:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(novy_kod)
        print("OK - Jmeno pridano (alternativni vzor)")
    else:
        print("Stale nenalezeno, vypisuji kontext:")
        idx = kod.find('format(day, "d")')
        print(repr(kod[idx-20:idx+120]))
