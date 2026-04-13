fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# --- UDÁLOSTI (EVENT_COLORS) ---
nahrazeni = {
    '"bg-primary/35 text-primary border-primary/50"': '"bg-primary/50 text-primary border-primary/60"',
    '"bg-destructive/35 text-destructive border-destructive/50"': '"bg-destructive/50 text-destructive border-destructive/60"',
    '"bg-success/35 text-success border-success/50"': '"bg-success/50 text-success border-success/60"',
    '"bg-warning/35 text-warning border-warning/50"': '"bg-warning/50 text-warning border-warning/60"',
    # --- SMĚNY (SHIFT_SCHEDULE) ---
    '"bg-shift-office/15"': '"bg-shift-office/50"',
    '"bg-shift-partner/15"': '"bg-shift-partner/50"',
    '"bg-shift-home/15"': '"bg-shift-home/50"',
    # border směny
    '"border-shift-office/40"': '"border-shift-office/60"',
    '"border-shift-partner/40"': '"border-shift-partner/60"',
    '"border-shift-home/40"': '"border-shift-home/60"',
}

zmeneno = 0
for stare, nove in nahrazeni.items():
    if stare in kod:
        kod = kod.replace(stare, nove)
        zmeneno += 1

print(f"OK - změněno {zmeneno} hodnot")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
