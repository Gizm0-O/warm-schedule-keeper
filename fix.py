fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Pridat zIndex: 2 do style shift bloku
stare = 'style={{ top, height, left, width: colWidth }}'
nove  = 'style={{ top, height, left, width: colWidth, zIndex: 2 }}'

# Pridat zIndex: 2 do style event bloku
stare2 = 'style={{ top: top + 2, height: Math.max(height - 4, 16), left, width: `calc(${colWidth} - 4px)`, marginLeft: 2 }}'
nove2  = 'style={{ top: top + 2, height: Math.max(height - 4, 16), left, width: `calc(${colWidth} - 4px)`, marginLeft: 2, zIndex: 2 }}'

ok1 = stare in kod
ok2 = stare2 in kod

if ok1:
    kod = kod.replace(stare, nove, 1)
    print("OK 1/2 - shift zIndex: 2")
else:
    print("CHYBA 1/2")

if ok2:
    kod = kod.replace(stare2, nove2, 1)
    print("OK 2/2 - event zIndex: 2")
else:
    print("CHYBA 2/2")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
