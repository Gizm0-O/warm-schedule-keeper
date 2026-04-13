fp = './src/pages/Index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    kod = f.read()

# 1. Přidat state pro dismissal
stare_state = 'const [showNewEventDialog, setShowNewEventDialog] = useState(false);'
nove_state = '''const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [anniversaryDismissed, setAnniversaryDismissed] = useState(false);
  const isAnniversaryDay = now.getDate() === 20;'''

# 2. Přidat overlay do JSX – hned za opening <div> returnu
stare_jsx = '{/* Italy Savings Banner */}'
nove_jsx = '''{/* Výroční overlay - každý 20. v měsíci */}
      {isAnniversaryDay && !anniversaryDismissed && (
        <div
          onClick={() => setAnniversaryDismissed(true)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundImage: "url(/hearts-bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            cursor: "pointer",
          }}
        >
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(180, 20, 40, 0.4)",
          }} />
        </div>
      )}
      {/* Italy Savings Banner */}'''

ok1 = stare_state in kod
ok2 = stare_jsx in kod

if ok1:
    kod = kod.replace(stare_state, nove_state)
    print("OK - state přidán")
else:
    print("CHYBA - state vzor nenalezen")

if ok2:
    kod = kod.replace(stare_jsx, nove_jsx)
    print("OK - overlay JSX přidán")
else:
    print("CHYBA - JSX vzor nenalezen")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(kod)
