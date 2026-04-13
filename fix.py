fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Zvysit zIndex event blocku z z-10 na z-20
stare = 'className={cn("absolute rounded-md border-l-2 px-1.5 py-0.5 text-10px font-medium truncate z-10 cursor-grab'
nove  = 'className={cn("absolute rounded-md border-l-2 px-1.5 py-0.5 text-10px font-medium truncate z-20 cursor-grab'

# A shift blocku z z-5 na z-20
stare2 = 'className={cn("absolute rounded-lg border-l-3 pointer-events-auto z-5 flex'
nove2  = 'className={cn("absolute rounded-lg border-l-3 pointer-events-auto z-20 flex'

ok1 = stare in kod
ok2 = stare2 in kod

if ok1:
    kod = kod.replace(stare, nove, 1)
    print("OK 1/2 - event z-10 -> z-20")
else:
    print("CHYBA 1/2")

if ok2:
    kod = kod.replace(stare2, nove2, 1)
    print("OK 2/2 - shift z-5 -> z-20")
else:
    print("CHYBA 2/2")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
