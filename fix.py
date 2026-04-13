fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = "              border: '2px solid rgba(251,191,36,0.6)',\n              borderRadius: '4px',"
nove  = "              border: '1px solid rgba(251,191,36,0.2)',\n              borderRadius: '0',"

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - tenky ramecek, bez zaobleni")
else:
    print("CHYBA - vzor nenalezen")
