fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = 'textShadow: "0 0 8px rgba(255,255,255,1)",'
nove  = 'textShadow: "0 0 8px rgba(255,255,255,1), 1px 2px 4px rgba(0,0,0,0.2)",'

# Nahradit vsechny vyskyty (pismena i mezery maji stejny textShadow)
if stare in kod:
    kod = kod.replace(stare, nove)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - shadow pod pismena pridan")
else:
    print("CHYBA - vzor nenalezen")
