import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Zvysit opacity vzoru a pridat barevny ramecek
stare = "opacity: 0.25,"
nove  = "opacity: 0.45,\n              border: '2px solid rgba(251,191,36,0.6)',\n              borderRadius: '4px',"

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - vzor vyraznejsi + zlaty ramecek")
else:
    idx = kod.find('birthday-overlay')
    print("CHYBA:", repr(kod[idx:idx+300]) if idx != -1 else "Nenalezeno")
