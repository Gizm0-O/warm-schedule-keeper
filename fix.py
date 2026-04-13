fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

kod = kod.replace(
    '{ label: "Zelená", value: "bg-primary/85 text-white border-primary" }',
    '{ label: "Zelená", value: "bg-primary/20 text-primary border-primary/30" }'
)
kod = kod.replace(
    '{ label: "Červená", value: "bg-destructive/85 text-white border-destructive" }',
    '{ label: "Červená", value: "bg-destructive/20 text-destructive border-destructive/30" }'
)
kod = kod.replace(
    '{ label: "Zelená tmavá", value: "bg-success/85 text-white border-success" }',
    '{ label: "Zelená tmavá", value: "bg-success/20 text-success border-success/30" }'
)
kod = kod.replace(
    '{ label: "Oranžová", value: "bg-warning/85 text-white border-warning" }',
    '{ label: "Oranžová", value: "bg-warning/20 text-warning border-warning/30" }'
)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print('OK')
