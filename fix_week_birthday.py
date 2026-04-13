import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

ok = 0

# 1. Vyraznejsi konfety + barevny gradient celeho sloupce
stare_overlay = '''background: "linear-gradient(180deg, rgba(251,191,36,0.10) 0%, rgba(249,168,212,0.10) 100%)",
              backgroundImage: `
                radial-gradient(circle, rgba(251,191,36,0.5) 1px, transparent 1px),
                radial-gradient(circle, rgba(249,168,212,0.5) 1px, transparent 1px),
                radial-gradient(circle, rgba(167,243,208,0.5) 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px, 50px 50px, 40px 40px",
              backgroundPosition: "0 0, 15px 15px, 8px 25px",'''
nove_overlay = '''background: "linear-gradient(180deg, rgba(251,191,36,0.18) 0%, rgba(249,168,212,0.22) 50%, rgba(167,243,208,0.15) 100%)",
              backgroundImage: `
                radial-gradient(circle, rgba(251,191,36,0.9) 2px, transparent 2px),
                radial-gradient(circle, rgba(249,168,212,0.9) 2px, transparent 2px),
                radial-gradient(circle, rgba(167,243,208,0.9) 2px, transparent 2px),
                radial-gradient(circle, rgba(239,68,68,0.7) 1.5px, transparent 1.5px)
              `,
              backgroundSize: "28px 28px, 42px 42px, 35px 35px, 20px 20px",
              backgroundPosition: "0 0, 14px 14px, 7px 21px, 21px 7px",'''
if stare_overlay in kod:
    kod = kod.replace(stare_overlay, nove_overlay, 1)
    ok += 1; print("OK 1/3 - Konfety vyraznejsi + gradient celeho sloupce")
else:
    print("CHYBA 1/3 - overlay nenalezen")

# 2. Skryt svatek a zobrazit narozeninove jmeno v hlavicce tydenního pohledu
# Najit blok s NAME_DAYS v tydenni hlavicce a podmínit
vzor_nameday_week = r'(\{NAME_DAYS\[format\(day,\s*"MM-dd"\)\]\s*&&\s*\([\s\S]{0,20}?<span[^>]*>\{NAME_DAYS\[format\(day,\s*"MM-dd"\)\]\}</span>[\s\S]{0,10}?\)\})'
nahrada_nameday = '''{isBirthday(day) ? (
              <span className="text-base font-bold text-amber-600" style={{fontFamily: "'Dancing Script', cursive"}}>{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
            ) : NAME_DAYS[format(day, "MM-dd")] && (
              <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">{NAME_DAYS[format(day, "MM-dd")]}</span>
            )}'''
novy_kod, n = re.subn(vzor_nameday_week, nahrada_nameday, kod, count=1, flags=re.DOTALL)
if n:
    kod = novy_kod; ok += 1; print("OK 2/3 - Jmeno narozeninaře v hlavicce")
else:
    print("CHYBA 2/3 - vzor NAME_DAYS v tydenni hlavicce nenalezen")
    idx = kod.find('NAME_DAYS[format(day')
    print(repr(kod[idx:idx+200]) if idx != -1 else "Nenalezeno")

# 3. Vyraznejsi hlavicka narozeninoveho dne
stare_header = 'isBirthday(day) && "bg-gradient-to-b from-amber-200 to-pink-100 ring-2 ring-amber-400"'
nove_header  = 'isBirthday(day) && "bg-gradient-to-b from-amber-300 to-pink-200 ring-2 ring-amber-500 shadow-lg"'
if stare_header in kod:
    kod = kod.replace(stare_header, nove_header, 1)
    ok += 1; print("OK 3/3 - Hlavicka vyraznejsi")
else:
    print("CHYBA 3/3 - hlavicka nenalezena")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print(f"\nVysledek: {ok}/3 zmen aplikovano")
