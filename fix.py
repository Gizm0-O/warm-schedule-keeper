import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Pridat vertikalni text do birthday overlay sloupce
stare = '''key={`birthday-overlay-${dayIdx}`}
            style={{
              position: "absolute",'''

nove = '''key={`birthday-overlay-${dayIdx}`}
            style={{
              position: "absolute",'''

# Najdeme birthday overlay div a pridame vertikalni text dovnitr
vzor = r'(key=\{`birthday-overlay-\$\{dayIdx\}`\}[\s\S]*?pointerEvents: "none",\s*zIndex: 0,\s*opacity: 0\.45,\s*border:[^,]+,\s*borderRadius: \'4px\',\s*\}\}\s*/>)'

nahrada = r'''key={`birthday-overlay-${dayIdx}`}
            style={{
              position: "absolute",
              top: 0,
              left,
              width: colWidth,
              height: totalGridHeight,
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.45,
              border: '2px solid rgba(251,191,36,0.6)',
              borderRadius: '4px',
            }}
          >
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              zIndex: 10,
              pointerEvents: "none",
            }}>
              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 0.7)",
                  lineHeight: 1.1,
                }}>{letter}</span>
              ))}
            </div>
          </div>'''

novy_kod, n = re.subn(vzor, nahrada, kod, count=1, flags=re.DOTALL)
if n:
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(novy_kod)
    print("OK - vertikalni jmeno pridano do sloupce")
else:
    idx = kod.find('birthday-overlay')
    print("CHYBA:", repr(kod[idx:idx+400]) if idx != -1 else "Nenalezeno")
