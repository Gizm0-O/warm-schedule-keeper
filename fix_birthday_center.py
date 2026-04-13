import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

vzor = r'\{isBirthday\(day\) && \(\s*<div className="flex flex-col items-center justify-center w-full flex-1[^"]*">([\s\S]*?)</div>\s*\)\}'

novy = '''{isBirthday(day) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-1">
                <span className="text-2xl leading-none">🎂</span>
                <span className="text-sm font-bold text-amber-700 uppercase tracking-wide leading-tight">{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
              </div>
            )}'''

novy_kod, n = re.subn(vzor, novy, kod, count=1, flags=re.DOTALL)
if n:
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(novy_kod)
    print("OK - dort a jmeno vycentrovano doprostred bunky")
else:
    idx = kod.find('isBirthday(day)')
    print("CHYBA - kontext:")
    print(repr(kod[idx:idx+350]) if idx != -1 else "Nenalezeno")
