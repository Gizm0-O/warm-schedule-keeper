fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Shift barvy
kod = kod.replace('bg-shift-office/15', 'bg-shift-office/35')
kod = kod.replace('bg-shift-partner/15', 'bg-shift-partner/35')
kod = kod.replace('bg-shift-home/15', 'bg-shift-home/35')

# Event barvy
kod = kod.replace('bg-primary/20', 'bg-primary/40')
kod = kod.replace('bg-destructive/20', 'bg-destructive/40')
kod = kod.replace('bg-success/20', 'bg-success/40')
kod = kod.replace('bg-warning/20', 'bg-warning/40')

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print('OK')
