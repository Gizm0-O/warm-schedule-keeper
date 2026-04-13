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

nove = '''              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 1)",
                  textShadow: "0 0 8px rgba(255,255,255,1)",
                  lineHeight: 1.0,
                  display: "block",
                  textAlign: "center",
                }}>{letter}</span>
              ))}
              <span style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "13px",
                fontWeight: "bold",
                color: "rgba(219, 39, 119, 1)",
                textShadow: "0 0 6px rgba(255,255,255,1)",
                marginTop: "6px",
                display: "block",
                textAlign: "center",
                letterSpacing: "1px",
              }}>Narozeniny!</span>'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - pismena pod sebou + Narozeniny!")
else:
    print("CHYBA - vzor nenalezen")
