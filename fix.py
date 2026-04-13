fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# Odstraň isAnniversaryDay ze špatného místa
stare = '''const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [anniversaryDismissed, setAnniversaryDismissed] = useState(false);
  const isAnniversaryDay = now.getDate() === 20;'''

nove = '''const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [anniversaryDismissed, setAnniversaryDismissed] = useState(false);'''

# Přidej isAnniversaryDay ZA deklaraci now
stare2 = 'const [now, setNow] = useState(new Date());'
nove2 = '''const [now, setNow] = useState(new Date());
  const isAnniversaryDay = new Date().getDate() === 20;'''

ok1 = stare in kod
ok2 = stare2 in kod

if ok1:
    kod = kod.replace(stare, nove)
    print("OK - odstraněno ze špatného místa")
else:
    print("CHYBA - vzor 1 nenalezen")

if ok2:
    kod = kod.replace(stare2, nove2)
    print("OK - přidáno za 'now'")
else:
    print("CHYBA - vzor 2 nenalezen")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
