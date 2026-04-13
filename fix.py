fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# 1. Snizit opacitu pozadi
stare1 = '''              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
              opacity: 0.45,
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(180, 20, 40, 0.12)",'''
nove1 = '''              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
              opacity: 0.25,
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(180, 20, 40, 0.07)",'''

# 2. Snizit zIndex overlay pod udalosti (z-10 maji udalosti, dame z-0)
stare2 = '''              zIndex: 1,
              borderLeft: "1px solid rgba(180, 20, 40, 0.4)",
              borderRight: "1px solid rgba(180, 20, 40, 0.4)",'''
nove2 = '''              zIndex: 0,
              borderLeft: "1px solid rgba(180, 20, 40, 0.4)",
              borderRight: "1px solid rgba(180, 20, 40, 0.4)",'''

# 3. Cerveny gradient v hlavicce - pridat za birthday gradient
stare3 = 'isBirthday(day) && "bg-gradient-to-b from-amber-100 to-pink-100 ring-1 ring-amber-200"'
nove3 = '''isBirthday(day) && "bg-gradient-to-b from-amber-100 to-pink-100 ring-1 ring-amber-200",
              format(day, "dd") === "20" && !isBirthday(day) && "bg-gradient-to-b from-red-100 to-rose-50 ring-1 ring-red-200"'''

ok1 = stare1 in kod
ok2 = stare2 in kod
ok3 = stare3 in kod

if ok1:
    kod = kod.replace(stare1, nove1)
    print("OK 1/3 - opacita snizena")
else:
    print("CHYBA 1/3")

if ok2:
    kod = kod.replace(stare2, nove2)
    print("OK 2/3 - zIndex pod udalosti")
else:
    print("CHYBA 2/3")

if ok3:
    kod = kod.replace(stare3, nove3)
    print("OK 3/3 - cerveny gradient hlavicky")
else:
    print("CHYBA 3/3")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
