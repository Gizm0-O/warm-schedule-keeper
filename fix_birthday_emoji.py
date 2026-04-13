import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Odstranit emoji ze jmen v BIRTHDAY_NAMES
stare = ['"04-16": "🎂 Barča"', '"05-15": "🎂 Tadeáš"', '"11-06": "🎂 Sebastian"']
nove  = ['"04-16": "Barča"',    '"05-15": "Tadeáš"',    '"11-06": "Sebastian"']

n = 0
for s, v in zip(stare, nove):
    if s in kod:
        kod = kod.replace(s, v, 1)
        n += 1

if n:
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print(f"OK - Emoji odstranen ze {n} jmen")
else:
    print("CHYBA - jmena nenalezena, vypisuji kontext:")
    idx = kod.find('BIRTHDAY_NAMES')
    print(repr(kod[idx:idx+200]) if idx != -1 else "Nenalezeno")
