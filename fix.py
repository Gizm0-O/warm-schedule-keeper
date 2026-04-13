fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Pridat anniversary overlay hned za birthday overlay blok
stare = '''        {format(day, "dd") === "13" && ( // TODO: změnit zpět na 20'''

if stare in kod:
    print("Anniversary overlay uz existuje v kodu - hledam problem jinde")
else:
    print("Anniversary overlay CHYBI - pridavam")
    # Pridat za closing birthday overlay tag
    stare2 = '''          </div>
        )}
      {HOURS.map((hour) => {'''
    
    nove2 = '''          </div>
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
              backgroundColor: "rgba(180, 20, 40, 0.12)",
            }} />
          </div>
        )}
      {HOURS.map((hour) => {'''
    
    if stare2 in kod:
        kod = kod.replace(stare2, nove2, 1)
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(kod)
        print("OK - anniversary overlay pridan do sloupce")
    else:
        # Zkusime najit konec birthday bloku jinak
        idx = kod.find('{HOURS.map((hour) => {')
        print("CHYBA - zkus:", repr(kod[idx-150:idx+30]))
