// Feature flagy – přepni na true pro opětovné zapnutí.
// Měsíční generování příběhů běží v DB cronu 'generate-stories-monthly' (pozastaven:
// obnova = SELECT cron.alter_job(jobid, active := true) FROM cron.job WHERE jobname='generate-stories-monthly').
export const FEATURES = {
  monthlyStories: false, // tlačítko "Generovat příběhy" + měsíční připomínka adminovi
  rewards: false, // level bar, XP, kapesné, poukázky, progresivní (hodinové) úkoly
  italySavings: false, // panel šetření na Itálii
  steps: false, // karta kroků (StepsCard) nad kalendářem
  tokens: false, // odznak tokenů (TokensBadge) – data a logika zůstávají
  shifts: false, // směny v kalendáři + oddělovače směn (switch break separátory)
};
