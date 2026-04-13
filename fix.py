fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Nahradit radky 922-960 (index 921-959) novym blokem
start = 921  # radek 922 (index)
end = 960    # radek 961 (index)

novy_blok = '''            style={{
              position: "absolute",
              top: 0,
              left,
              width: colWidth,
              height: totalGridHeight,
              pointerEvents: "none",
              zIndex: 1,
              border: '2px solid rgba(251,191,36,0.6)',
              borderRadius: '4px',
            }}
          >
            {/* Pozadi s pruhlednosti */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/birthday-pattern.jpg')",
              backgroundSize: "320px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "center top",
              opacity: 0.45,
              borderRadius: '4px',
            }} />
            {/* Text - plna opacita */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              zIndex: 2,
            }}>
              {BIRTHDAY_NAMES[format(day, "MM-dd")].split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "rgba(180, 83, 9, 1)",
                  lineHeight: 1.1,
                  textShadow: "0 0 6px rgba(255,255,255,1)",
                }}>{letter}</span>
              ))}
            </div>
'''

new_lines = lines[:start] + [novy_blok] + lines[end:]
with open(fp, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("OK - pozadi a text oddeleny, text plna opacita")
