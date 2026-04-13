fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '              backgroundPosition: "center top",\n            }}\n '
nove  = '              backgroundPosition: "center top",\n            }}\n          >\n            <div style={{\n              position: "absolute",\n              top: "50%",\n              left: "50%",\n              transform: "translate(-50%, -50%)",\n              display: "flex",\n              flexDirection: "column",\n              alignItems: "center",\n              gap: "2px",\n              pointerEvents: "none",\n            }}>\n              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (\n                <span key={i} style={{\n                  fontFamily: "\'Dancing Script\', cursive",\n                  fontSize: "20px",\n                  fontWeight: "bold",\n                  color: "rgba(180, 83, 9, 0.85)",\n                  lineHeight: 1.1,\n                  textShadow: "0 0 8px rgba(255,255,255,0.9)",\n                }}>{letter}</span>\n              ))}\n            </div>\n          </div>\n '

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - vertikalni jmeno pridano!")
else:
    idx = kod.find('backgroundPosition: "center top"')
    print("CHYBA:", repr(kod[idx:idx+80]))
