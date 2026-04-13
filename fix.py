fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '''              <span style={{
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

nove = '''              <span style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "32px",
                fontWeight: "bold",
                color: "rgba(180, 83, 9, 1)",
                textShadow: "0 0 8px rgba(255,255,255,1)",
                whiteSpace: "nowrap",
                display: "block",
                textAlign: "center",
              }}>{BIRTHDAY_NAMES[format(day, "MM-dd")]}</span>
              <span style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "26px",
                fontWeight: "bold",
                color: "rgba(219, 39, 119, 1)",
                textShadow: "0 0 8px rgba(255,255,255,1)",
                whiteSpace: "nowrap",
                display: "block",
                textAlign: "center",
              }}>Narozeniny!</span>'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - text pod sebou, bez emoji")
else:
    print("CHYBA - vzor nenalezen")
