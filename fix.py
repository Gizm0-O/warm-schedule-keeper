fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Odstranit radek 962 (index 961) ktery obsahuje prebytecne />
if lines[961].strip() == '/>':
    lines.pop(961)
    with open(fp, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("OK - prebytecne /> odstraneno")
else:
    print("CHYBA - radek 962 obsahuje:", repr(lines[961]))
