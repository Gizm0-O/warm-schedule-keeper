fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Zvetsit font 33px -> 40px
stare1 = 'fontSize: letter === " " ? "8px" : "33px",'
nove1  = 'fontSize: letter === " " ? "8px" : "40px",'
if stare1 in kod:
    kod = kod.replace(stare1, nove1, 1)
    print("OK 1/2 - font zvetseni")
else:
    print("CHYBA 1/2")

# Vice mezer mezi slovy - pouzijeme 3 mezery misto 1
stare2 = '" Narozeniny"'
nove2  = '"   Narozeniny"'
if stare2 in kod:
    kod = kod.replace(stare2, nove2, 1)
    print("OK 2/2 - 3 mezery mezi slovy")
else:
    print("CHYBA 2/2")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
