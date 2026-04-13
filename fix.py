import re

fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Najit self-closing birthday overlay div a prevest na otevreny s textem
vzor = r'(key=\{`birthday-overlay-\$\{dayIdx\}`\}[\s\S]*?borderRadius: \'4px\',\s*\}\}\s*)\/>'

nahrada = r'''\1>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              pointerEvents: "none",
            }}>
              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 0.75)",
                  lineHeight: 1.1,
                }}>{letter}</span>
              ))}
            </div>
          </div>'''

novy_kod, n = re.subn(vzor, nahrada, kod, count=1, flags=re.DOTALL)
if n:
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(novy_kod)
    print("OK - vertikalni jmeno pridano")
else:
    idx = kod.find('birthday-overlay')
    print("CHYBA:", repr(kod[idx:idx+300]) if idx != -1 else "Nenalezeno")
