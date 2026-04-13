import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Jemnejsi gradient hlavicky + slabsi ramecek JEN v hlavicce
stare = 'isBirthday(day) && "bg-gradient-to-b from-amber-300 to-pink-200 ring-2 ring-amber-500 shadow-lg"'
nove  = 'isBirthday(day) && "bg-gradient-to-b from-amber-100 to-pink-100 ring-1 ring-amber-200"'

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - hlavicka jemnejsi gradient + tenci ramecek")
else:
    idx = kod.find('isBirthday(day) && "bg-gradient')
    print("CHYBA:", repr(kod[idx:idx+150]) if idx != -1 else "Nenalezeno")
