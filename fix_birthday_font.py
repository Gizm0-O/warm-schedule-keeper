import re

# 1. Pridat font do index.html
with open('./index.html', 'r', encoding='utf-8') as f:
    html = f.read()

font_link = '<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">'
if 'Dancing+Script' not in html:
    html = html.replace('</head>', f'  {font_link}\n</head>', 1)
    with open('./index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("OK 1/2 - Font pridan do index.html")
else:
    print("SKIP 1/2 - Font uz existuje")

# 2. Zmenit styl jmena v Index.tsx
fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '"text-xl font-bold text-amber-700 uppercase tracking-wide leading-tight"'
nove  = '"text-xl text-amber-700 leading-tight"  style={{fontFamily: "\'Dancing Script\', cursive"}}'

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK 2/2 - Font aplikovan na jmeno")
else:
    idx = kod.find('text-xl font-bold text-amber-700')
    print("CHYBA 2/2:", repr(kod[idx:idx+100]) if idx != -1 else "Nenalezeno")
