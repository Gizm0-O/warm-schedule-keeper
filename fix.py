fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Najit birthday overlay blok a pridat za nej anniversary overlay
stare = '''          </div>
        )}
      {HOURS.map((hour) => {'''

nove = '''          </div>
        )}
        {format(day, "dd") === "13" && ( // TODO: změnit zpět na 20
          <div
            key={`anniversary-overlay-${dayIdx}`}
            style={{
              position: "absolute",
              top: 0,
              left,
              width: colWidth,
              height: totalGridHeight,
              pointerEvents: "none",
              zIndex: 1,
              borderLeft: "1px solid rgba(180, 20, 40, 0.4)",
              borderRight: "1px solid rgba(180, 20, 40, 0.4)",
            }}
          >
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/hearts-bg.jpg')",
              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
              opacity: 0.45,
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(180, 20, 40, 0.15)",
            }} />
          </div>
        )}
      {HOURS.map((hour) => {'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - anniversary overlay v sloupci")
else:
    print("CHYBA - vzor nenalezen")
