## Co jsem našel v Excelu

3 měsíční listy (Duben, Květen, Červen) + Template. Každý měsíc má 6 sekcí:

1. **PŘÍJEM** — položka, plánovaný, skutečný (např. „B", „T - Podpora", „T - KzP")
2. **PŘEDPLATNÉ** — měsíční fixní (Netflix 380, Spotify 300, …)
3. **FIXNÍ NÁKLADY** — položka, splatnost, plánovaný, skutečný (Nájem 18150, Pojištění, Splátka, Internet)
4. **KAŽDODENNÍ VÝDAJE** — kategorie + popis + plánovaný + skutečný (Domácnost, Tádyn, Sebík, Kočky, Benzín, Zábava, Ostatní…)
5. **JÍDLO** — obchod + plánovaný + skutečný (Albert, Lidl, Penny, Globus, Vilgain, Kendamil, Restaurace…)
6. **ITÁLIE** — už máš (zachováme, pouze přečteme zůstatek z `italy_savings`)

Plus souhrny nahoře: PŘÍJMY vs VÝDAJE, plánované vs skutečné.

## Návrh — Finance panel

### Nová stránka `/finance` v admin sekci

Stejný design jako zbytek (orange/Italy gradient, karty, animace).

**Layout:**
```
┌─ Měsíc: [Červen 2026 ▾]   [+ Nová položka] ──┐
│                                                │
│  ┌─ Souhrn ──────────────────────────────┐   │
│  │ Příjmy: 85 600 / 85 830                │   │
│  │ Výdaje: 70 580 / 98 620   ⚠ -12 790    │   │
│  │ Zůstatek: -12 790 Kč                   │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  ┌─ Příjmy ─────┐  ┌─ Předplatné ────┐        │
│  │ B    37 700  │  │ Netflix    380  │        │
│  │ T-Podpora 13k│  │ Spotify    300  │        │
│  │ ...          │  │ ...    Σ 3 220  │        │
│  └──────────────┘  └─────────────────┘        │
│                                                │
│  ┌─ Fixní náklady ────────────────────┐       │
│  │ Nájem  20.  18 150 / 18 150  ✓     │       │
│  │ Pojištění 15. 490 / 490  ✓         │       │
│  └─────────────────────────────────────┘      │
│                                                │
│  ┌─ Každodenní výdaje ────────────────┐       │
│  │ [Vše][Domácnost][Tádyn][Kočky]...  │       │
│  │ Domácnost · Alza filtr   160       │       │
│  │ Benzín · Benzín        1 000       │       │
│  └────────────────────────────────────┘       │
│                                                │
│  ┌─ Jídlo ────────────────────────────┐       │
│  │ Albert    60 + 1 040 = 1 100       │       │
│  │ ... pivot per obchod               │       │
│  └────────────────────────────────────┘       │
└────────────────────────────────────────────────┘
```

### Funkce
- Měsíční filtr (dropdown + šipky ←→)
- Inline edit, mazání, přidávání
- Plánovaný (modře) vs skutečný (zeleně / červeně podle převisu)
- Grafy: koláč skutečných výdajů per kategorie, sloupcový plán vs skutečnost
- Sdílené pro Barču + Tadeáše (oba vidí, oba edit)
- Import: do migrace nahraju všechna data z Duben/Květen/Červen

## Databáze (Lovable Cloud)

Jedna univerzální tabulka — flexibilnější než 6 samostatných:

```sql
finance_entries(
  id, month text 'YYYY-MM', section text,  -- 'income' | 'subscription' | 'fixed' | 'daily' | 'food'
  category text,        -- pro daily/food (Domácnost, Albert, ...)
  name text,            -- popis položky
  planned numeric, actual numeric,
  due_day int,          -- pro fixed
  note text,
  created_by uuid, created_at, updated_at
)
```

RLS: čte/píše každý schválený přihlášený uživatel (sdílené pro domácnost).

## Technické

- Nová stránka `src/pages/FinancePage.tsx` + komponenty `FinanceSummary`, `FinanceSection`, `FinanceMonthPicker`
- Hook `useFinance(month)` (analogie `useItalySavings`)
- Trasa `/finance` v `App.tsx`, odkaz do `AppLayout` navigace (s ikonou Wallet)
- Recharts pro grafy (už používáš)
- Migrace 1: tabulka + RLS + grants
- Migrace 2: `INSERT` všech ~150 položek z Duben/Květen/Červen

## Co dodělám až po schválení
1. Migrace (tabulka)
2. Import dat (insert script)
3. UI komponenty
4. Navigaci

---

**Otázky před spuštěním:**

1. **Položky Itálie** v Excelu (Hotovost Děda 6 100, Hotovost T 1 000…) — mám je naimportovat jako zálohy do existující Italy banneru, nebo nechat jen v Finance pod sekcí „Itálie"?
2. **„CELKEM" sloupec úplně vpravo** (asi měsíční souhrn napříč lety) — zobrazit i tento roční pohled?
3. **Předplatné** — chceš ho vidět každý měsíc stejné (templated), nebo per-month editovatelné?