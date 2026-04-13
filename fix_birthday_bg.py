import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '''background: "linear-gradient(180deg, rgba(251,191,36,0.18) 0%, rgba(249,168,212,0.22) 50%, rgba(167,243,208,0.15) 100%)",
              backgroundImage: `
                radial-gradient(circle, rgba(251,191,36,0.9) 2px, transparent 2px),
                radial-gradient(circle, rgba(249,168,212,0.9) 2px, transparent 2px),
                radial-gradient(circle, rgba(167,243,208,0.9) 2px, transparent 2px),
                radial-gradient(circle, rgba(239,68,68,0.7) 1.5px, transparent 1.5px)
              `,
              backgroundSize: "28px 28px, 42px 42px, 35px 35px, 20px 20px",
              backgroundPosition: "0 0, 14px 14px, 7px 21px, 21px 7px",'''

nove = '''backgroundImage: "url('/birthday-pattern.jpg')",
              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    # Pridat bile polopruhledne prekryti aby byl obsah citelny
    kod = kod.replace(
        'pointerEvents: "none",\n              zIndex: 0,',
        'pointerEvents: "none",\n              zIndex: 0,\n              opacity: 0.25,'
    )
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - narozeninovy vzor jako pozadi sloupce")
else:
    idx = kod.find('birthday-overlay')
    print("CHYBA - kontext:", repr(kod[idx:idx+300]) if idx != -1 else "Nenalezeno")
