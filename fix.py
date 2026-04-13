fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = 'isBirthday(day) && !selected && "bg-gradient-to-br from-amber-50 to-pink-50 ring-2 ring-amber-300"'
nove  = 'isBirthday(day) && !selected && "bg-gradient-to-br from-amber-200 to-pink-200 ring-2 ring-amber-400 shadow-md"'

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - gradient vyraznejsi")
else:
    idx = kod.find('isBirthday(day) && !selected')
    print("CHYBA:", repr(kod[idx:idx+150]) if idx != -1 else "Nenalezeno")
