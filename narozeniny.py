import re, subprocess

r = subprocess.run(['find', '.', '-name', 'Index.tsx', '-not', '-path', '*/node_modules/*', '-not', '-path', '*/dist/*'], capture_output=True, text=True)
soubory = [f.strip() for f in r.stdout.strip().split('\n') if f.strip()]
if not soubory:
    print("Soubor Index.tsx nenalezen!"); exit(1)
fp = soubory[0]
print(f"Soubor: {fp}")

with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

if 'BIRTHDAY_DATES' in kod:
    print("Zmeny jiz aplikovany!"); exit(0)

ok = 0

weekdays = 'const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];'
if weekdays in kod:
    konstanty = '\n\nconst BIRTHDAY_DATES = new Set(["04-16", "05-15", "11-06"]);\nconst isBirthday = (date: Date) => BIRTHDAY_DATES.has(format(date, "MM-dd"));\nconst BIRTHDAY_NAMES: Record<string, string> = {\n  "04-16": "🎂 Barča",\n  "05-15": "🎂 Sebastian",\n  "11-06": "🎂 Tadeáš",\n};'
    kod = kod.replace(weekdays, weekdays + konstanty, 1)
    ok += 1; print("OK 1/4 - Konstanty pridany")
else:
    print("CHYBA 1/4 - WEEKDAYS nenalezen")

kod, n = re.subn(
    r'(isToday\(day\) && "bg-primary/5")(\s*\)\})',
    r'\1,\n                isBirthday(day) && !selected && "bg-gradient-to-br from-amber-50 to-pink-50 ring-2 ring-amber-300"\2',
    kod, count=1)
if n: ok += 1; print("OK 2/4 - Mesicni pohled upraven")
else: print("CHYBA 2/4 - Vzor nenalezen")

kod, n = re.subn(
    r'(\{format\(day, "d"\)\})(\s*)(\{NAME_DAYS\[format\(day, "MM-dd"\)\])',
    r'\1\2{isBirthday(day) && (<span className="text-xs font-semibold text-amber-600">{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>)}\2\3',
    kod, count=1)
if n: ok += 1; print("OK 3/4 - Jmeno narozeninaře pridano")
else: print("CHYBA 3/4 - Vzor pro jmeno nenalezen")

kod, n = re.subn(
    r'(isToday\(day\) && "bg-primary/5")(\s*\)\})',
    r'\1,\n              isBirthday(day) && "bg-gradient-to-b from-amber-50 to-pink-50"\2',
    kod, count=1)
if n: ok += 1; print("OK 4/4 - Tydenni pohled upraven")
else: print("CHYBA 4/4 - Vzor pro tydenni pohled nenalezen")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print(f"\nVysledek: {ok}/4 zmen aplikovano")
