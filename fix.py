fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '''              backgroundImage: "url('/birthday-pattern.jpg')",
              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
            }}
        />'''

nove = '''              backgroundImage: "url('/birthday-pattern.jpg')",
              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
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
              pointerEvents: "none",
            }}>
              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 0.85)",
                  lineHeight: 1.1,
                  textShadow: "0 0 8px rgba(255,255,255,0.9)",
                }}>{letter}</span>
              ))}
            </div>
          </div>'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - vertikalni jmeno pridano!")
else:
    print("CHYBA - nenalezeno")
