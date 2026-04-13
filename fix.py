fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Přidat textShadow inline style k event blokům v týdenním pohledu
# Hledáme div s className obsahující event bloky a přidáme style s textShadow

stare = '''className={cn(
                  "absolute rounded-md border-l-2 px-1.5 py-0.5 text-xs font-semibold truncate z-10 cursor-grab group hover:opacity-80",
                  ev.color
                )}'''

nove = '''className={cn(
                  "absolute rounded-md border-l-2 px-1.5 py-0.5 text-xs font-semibold truncate z-10 cursor-grab group hover:opacity-80",
                  ev.color
                )}
                style={{
                  top: top + 2,
                  height: Math.max(height - 4, 16),
                  left,
                  width: `calc(${colWidth} - 4px)`,
                  marginLeft: 2,
                  textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                }}'''

# Zkusíme alternativní přístup - přidat textShadow do existujícího style objektu
# Hledáme style={{ top: top + 2 v event blocích
stare2 = '''style={{
                  top: top + 2,
                  height: Math.max(height - 4, 16),
                  left,
                  width: `calc(${colWidth} - 4px)`,
                  marginLeft: 2,
                }}'''

nove2 = '''style={{
                  top: top + 2,
                  height: Math.max(height - 4, 16),
                  left,
                  width: `calc(${colWidth} - 4px)`,
                  marginLeft: 2,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))",
                }}'''

if stare2 in kod:
    kod = kod.replace(stare2, nove2)
    print("OK - textShadow přidán do event style")
else:
    print("CHYBA - style vzor nenalezen")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
