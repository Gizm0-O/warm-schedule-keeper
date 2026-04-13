fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Najit cely anniversary blok a odstranit ho z aktualni pozice
import re
vzor = r'(\s*\{weekDays\.map\(\(day, dayIdx\) => \{\s*const colWidth[^}]+\}[^}]+\}[^}]+\}[^}]+\}[^}]+\}[^}]+\}[^}]+\}[^)]+\)\s*\}\);\s*\}(?:\s*\)\s*\})*\s*\}\)\})'

# Jednodussi pristup - najit blok podle unikatniho textu
start_tag = '        {weekDays.map((day, dayIdx) => {\n          const colWidth = `calc((100% - 60px) / 7)`;\n          const left = `calc(60px + ${dayIdx} * (100% - 60px) / 7)`;\n          if (format(day, "dd") !== "20") return null;'
end_tag = '        })}\n      {HOURS.map((hour) => {'

idx_start = kod.find(start_tag)
idx_end = kod.find(end_tag)

if idx_start != -1 and idx_end != -1:
    anniversary_blok = kod[idx_start:idx_end + len('        })}')]
    # Odstranit z puvodniho mista
    kod_bez = kod[:idx_start] + '      {HOURS.map((hour) => {' + kod[idx_end + len(end_tag):]
    
    # Vlozit pred birthday overlay (ktery je pred HOURS.map)
    cilovy_tag = '      {weekDays.map((day, dayIdx) => {\n        if (!isBirthday(day)) return null;'
    if cilovy_tag in kod_bez:
        kod_final = kod_bez.replace(cilovy_tag, anniversary_blok + '\n      {weekDays.map((day, dayIdx) => {\n        if (!isBirthday(day)) return null;', 1)
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(kod_final)
        print("OK - anniversary overlay presunut pred shift/event bloky")
    else:
        print("CHYBA - cilovy tag nenalezen")
else:
    print("CHYBA - start:", idx_start, "end:", idx_end)
