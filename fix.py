fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Nahradit vertikalni pismena za dva radky textu
stare = '''              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 1)",
                  lineHeight: 1.1,
                  textShadow: "0 0 6px rgba(255,255,255,1)",
                }}>{letter}</span>
              ))}'''

nove = '''              <span style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "32px",
                fontWeight: "bold",
                color: "rgba(180, 83, 9, 1)",
                textShadow: "0 0 8px rgba(255,255,255,1)",
                whiteSpace: "nowrap",
              }}>{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
              <span style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "26px",
                fontWeight: "bold",
                color: "rgba(219, 39, 119, 1)",
                textShadow: "0 0 8px rgba(255,255,255,1)",
                whiteSpace: "nowrap",
              }}>Narozeniny! 🎂</span>'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - text zvetsen, dva radky")
else:
    print("CHYBA - vzor nenalezen")
