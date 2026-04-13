fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '''                  fontSize: letter === " " ? "6px" : "22px",
                  fontWeight: "bold",
                  color: i < BIRTHDAY_NAMES[format(day, "MM-dd")].length ? "rgba(180, 83, 9, 1)" : "rgba(219, 39, 119, 1)",'''

nove  = '''                  fontSize: letter === " " ? "8px" : "33px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 1)",'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - hneda barva, text +50%")
else:
    print("CHYBA - vzor nenalezen")
