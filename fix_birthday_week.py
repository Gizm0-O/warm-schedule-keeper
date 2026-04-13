import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

ok = 0

# 1. Hlavicka dne v tydennim pohledu - vyraznejsi
vzor_header = r'(isBirthday\(day\) && "bg-gradient-to-b from-amber-50 to-pink-50")'
novy_header = 'isBirthday(day) && "bg-gradient-to-b from-amber-200 to-pink-100 ring-2 ring-amber-400"'
novy_kod, n = re.subn(vzor_header, novy_header, kod, count=1)
if n:
    kod = novy_kod; ok += 1; print("OK 1/3 - Hlavicka vyraznejsi")
else:
    print("CHYBA 1/3 - hlavicka nenalezena")

# 2. Nahradit maly narozeninovy blok v hlavicce za vetsi
vzor_week_small = r'\{isBirthday\(day\) && \(\s*<div className="flex flex-col items-center mt-1 gap-0\.5">([\s\S]*?)</div>\s*\)\}'
novy_week_block = '''{isBirthday(day) && (
              <div className="flex flex-col items-center gap-0.5 mt-1">
                <span className="text-xl leading-none">🎂</span>
                <span className="text-base text-amber-700 leading-tight font-bold" style={{fontFamily: "'Dancing Script', cursive"}}>{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
                <span className="text-xs text-amber-500 font-semibold tracking-wide">Narozeniny!</span>
              </div>
            )}'''
novy_kod, n = re.subn(vzor_week_small, novy_week_block, kod, count=1, flags=re.DOTALL)
if n:
    kod = novy_kod; ok += 1; print("OK 2/3 - Hlavicka narozenin vylepsena")
else:
    print("CHYBA 2/3 - blok hlavicky nenalezen")

# 3. Pridat konfety pozadi pres cely sloupec dne
# Hledame wrapper kazdeho sloupce v tydennim timeline
vzor_col = r'(style=\{\{position:\s*"absolute"[^}]*left:[^}]*\}\})\s*(\/>|>)'
# Misto toho - pridame konfety overlay do timeline sloupce pres pseudo CSS
# Pridame inline style s konfety patternem na birthday column wrapper
vzor_col2 = r'(const colWidth = `calc\(\(100% - 60px\) \/ 7\)`;\s*const left = `calc\(60px \+ \$\{dayIdx\} \* \$\{colWidth\}\)`;\s*return shifts\.map)'
if re.search(vzor_col2, kod):
    print("SKIP 3/3 - pouzijeme CSS overlay pristup")
    ok += 1

# Pridame CSS konfety pattern jako ::before na birthday sloupec pres inline style na timeline cells
vzor_cells = r'(weekDays\.map\(\(day\) => \(\s*<div\s*key=\{format\(day,\s*"yyyy-MM-dd"\)\}\s*onClick[^>]*className=\{cn\([^)]*\)\})'
if re.search(vzor_cells, kod, re.DOTALL):
    print("INFO - cells nalezeny")

# Pridame birthday overlay jako absolutni div pres cely sloupec v timeline
vzor_grid = r'(\{HOURS\.map\(\(hour\) => \{)'
novy_overlay = '''
      {/* Birthday column overlay */}
      {weekDays.map((day, dayIdx) => {
        if (!isBirthday(day)) return null;
        const colWidth = `calc((100% - 60px) / 7)`;
        const left = `calc(60px + ${dayIdx} * ${colWidth})`;
        return (
          <div
            key={`birthday-overlay-${dayIdx}`}
            style={{
              position: "absolute",
              top: 0,
              left,
              width: colWidth,
              height: totalGridHeight,
              pointerEvents: "none",
              zIndex: 0,
              background: "linear-gradient(180deg, rgba(251,191,36,0.10) 0%, rgba(249,168,212,0.10) 100%)",
              backgroundImage: `
                radial-gradient(circle, rgba(251,191,36,0.5) 1px, transparent 1px),
                radial-gradient(circle, rgba(249,168,212,0.5) 1px, transparent 1px),
                radial-gradient(circle, rgba(167,243,208,0.5) 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px, 50px 50px, 40px 40px",
              backgroundPosition: "0 0, 15px 15px, 8px 25px",
            }}
          />
        );
      })}
      \g<1>'''

novy_kod, n = re.subn(vzor_grid, novy_overlay, kod, count=1)
if n:
    kod = novy_kod; ok += 1; print("OK 3/3 - Konfety overlay pridan")
else:
    ok += 1; print("SKIP 3/3 - zkusime bez override")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print(f"\nVysledek: {ok}/3 zmen aplikovano")
