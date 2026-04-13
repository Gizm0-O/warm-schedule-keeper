fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = "              border: '1px solid rgba(251,191,36,0.2)',\n              borderRadius: '0',"
nove  = "              borderLeft: '1px solid rgba(251,191,36,0.4)',\n              borderRight: '1px solid rgba(251,191,36,0.4)',\n              borderRadius: '0',"

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - ramecek symetricky na obou stranach")
else:
    print("CHYBA - vzor nenalezen")
