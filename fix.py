fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

kod = kod.replace('"11-06": "Sebastian"', '"11-06": "Sebastián"', 1)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
print("OK - Sebastián opraven")
