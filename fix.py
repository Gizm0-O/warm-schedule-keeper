fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

stare = '''                  lineHeight: letter === " " ? 0.3 : 1.0,'''
nove  = '''                  lineHeight: letter === " " ? 1.8 : 0.8,'''

if stare in kod:
    kod = kod.replace(stare, nove, 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(kod)
    print("OK - spacing snizen, mezera mezi slovy")
else:
    print("CHYBA - vzor nenalezen")
