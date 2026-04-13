import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

ok = 0

# 1. Oprava jmen (prohozeni Tadeas a Sebastian)
stare = '"04-16": "🎂 Barča",\n  "05-15": "🎂 Sebastian",\n  "11-06": "🎂 Tadeáš",'
nove  = '"04-16": "🎂 Barča",\n  "05-15": "🎂 Tadeáš",\n  "11-06": "🎂 Sebastian",'
if stare in kod:
    kod = kod.replace(stare, nove, 1)
    ok += 1; print("OK 1/4 - Jmena opravena")
else:
    print("SKIP 1/4 - Jmena uz jsou spravne nebo odlisny format")
    ok += 1

# 2. Skryt svatek kdyz je narozeniny (mesicni pohled)
vzor_svatek = r'\{NAME_DAYS\[format\(day,\s*"MM-dd"\)\]\s*&&\s*\('
if re.search(vzor_svatek, kod):
    kod = re.sub(vzor_svatek, '{!isBirthday(day) && NAME_DAYS[format(day, "MM-dd")] && (', kod, count=1)
    ok += 1; print("OK 2/4 - Svatek skryt u narozenin")
else:
    print("CHYBA 2/4 - Vzor svátku nenalezen")

# 3. Nahradit jednoduchy span narozeninarem za velky display v mesicnim pohledu
vzor_span = r'\{isBirthday\(day\) && \(<span className="text-xs font-semibold text-amber-600 leading-tight block">\{BIRTHDAY_NAMES\[format\(day, "MM-dd"\)\]\}</span>\)\}'
novy_display = '''{isBirthday(day) && (
              <div className="flex flex-col items-center justify-center w-full flex-1 gap-0.5 py-1">
                <span className="text-2xl">🎂</span>
                <span className="text-xs font-bold text-amber-700 text-center leading-tight tracking-wide uppercase">{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
              </div>
            )}'''
if re.search(vzor_span, kod):
    kod = re.sub(vzor_span, novy_display, kod, count=1)
    ok += 1; print("OK 3/4 - Velky narozeninovy display v mesicnim pohledu")
else:
    print("CHYBA 3/4 - Span narozeninaře nenalezen, zkousim alternativu")
    vzor2 = r'\{isBirthday\(day\) && \(<span[^>]*>\{BIRTHDAY_NAMES\[format\(day,\s*"MM-dd"\)\]\}</span>\)\}'
    if re.search(vzor2, kod):
        kod = re.sub(vzor2, novy_display, kod, count=1)
        ok += 1; print("OK 3/4 - Velky display (alt vzor)")
    else:
        print("CHYBA 3/4 - Nenalezeno ani alternativou")

# 4. Vyraznejsi zobrazeni v tydennim pohledu - nahradit maly span
vzor_week = r'\{isBirthday\(day\) && \(\s*<span className="text-xs text-amber-500 font-semibold mt-0\.5">\s*\{BIRTHDAY_NAMES\[format\(day, "MM-dd"\)\]\}\s*</span>\s*\)\}'
novy_week = '''{isBirthday(day) && (
              <div className="flex flex-col items-center mt-1 gap-0.5">
                <span className="text-base leading-none">🎂</span>
                <span className="text-xs font-bold text-amber-600 tracking-wide">{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
                <span className="text-xs text-amber-400 font-medium">Narozeniny!</span>
              </div>
            )}'''
if re.search(vzor_week, kod, re.DOTALL):
    kod = re.sub(vzor_week, novy_week, kod, count=1, flags=re.DOTALL)
    ok += 1; print("OK 4/4 - Tydenni pohled vylepseni")
else:
    print("CHYBA 4/4 - Vzor tydenni pohled nenalezen")
    vzor_week2 = r'\{isBirthday\(day\) && \(<span[^>]*text-amber-5[^<]*</span>\)\}'
    if re.search(vzor_week2, kod):
        kod = re.sub(vzor_week2, novy_week, kod, count=1)
        ok += 1; print("OK 4/4 - Tydenni (alt vzor)")
    else:
        idx = kod.find('isBirthday(day)')
        print(repr(kod[idx:idx+200]) if idx != -1 else "isBirthday nenalezeno vubec")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print(f"\nVysledek: {ok}/4 zmen aplikovano")
