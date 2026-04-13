fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '        );\n      })}\n      {HOURS.map((hour) => {'

nove = '''        );
      })}
        {weekDays.map((day, dayIdx) => {
          const colWidth = `calc((100% - 60px) / 7)`;
          const left = `calc(60px + ${dayIdx} * (100% - 60px) / 7)`;
          if (format(day, "dd") !== "13") return null; // TODO: změnit zpět na 20
          return (
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
          );
        })}
      {HOURS.map((hour) => {'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - anniversary overlay pridan")
else:
    idx = kod.find('{HOURS.map((hour) => {')
    print("CHYBA:", repr(kod[idx-60:idx+30]))
