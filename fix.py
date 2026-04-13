fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '''              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
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

nove = '''              {(BIRTHDAY_NAMES[format(day, "MM-dd")] + " Narozeniny").split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: letter === " " ? "6px" : "22px",
                  fontWeight: "bold",
                  color: i < BIRTHDAY_NAMES[format(day, "MM-dd")].length ? "rgba(180, 83, 9, 1)" : "rgba(219, 39, 119, 1)",
                  textShadow: "0 0 8px rgba(255,255,255,1)",
                  lineHeight: letter === " " ? 0.3 : 1.0,
                  display: "block",
                  textAlign: "center",
                }}>{letter === " " ? "\u00A0" : letter}</span>
              ))}'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - vsechna pismena svisle, dve barvy")
else:
    print("CHYBA - vzor nenalezen")
