// XP systém - level výpočet a defaultní hodnoty

export const XP_LEVELS: { min: number; label: string }[] = [
  { min: 0,   label: 'Newbie Bambul' },
  { min: 50,  label: 'Basic Bambul' },
  { min: 150, label: 'Little Bambuls' },
  { min: 300, label: 'Bambulín' },
  { min: 450, label: 'Bambulka' },
  { min: 600, label: 'Super Bambulka' },
  { min: 750, label: 'MEGA Bambulka' },
  { min: 900, label: 'BAMBULÁTOR' },
];
export const MAX_LEVEL = XP_LEVELS.length - 1;

export const LEVEL_ICONS = ['🌱', '🐣', '⭐', '💪', '✨', '💎', '🔥', '👑'];
export const LEVEL_COLORS = [
  'from-slate-400 to-slate-500',
  'from-emerald-400 to-teal-500',
  'from-cyan-400 to-blue-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-yellow-400 to-amber-500',
];
export const LEVEL_BG = [
  'bg-slate-50 border-slate-200',
  'bg-emerald-50 border-emerald-200',
  'bg-cyan-50 border-cyan-200',
  'bg-blue-50 border-blue-200',
  'bg-violet-50 border-violet-200',
  'bg-fuchsia-50 border-fuchsia-200',
  'bg-amber-50 border-amber-200',
  'bg-yellow-50 border-yellow-300',
];

export function computeLevel(xp: number) {
  let level = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].min) level = i;
    else break;
  }
  const isMax = level >= MAX_LEVEL;
  const currentBase = XP_LEVELS[level].min;
  const nextAt = isMax ? XP_LEVELS[MAX_LEVEL].min : XP_LEVELS[level + 1].min;
  const span = nextAt - currentBase;
  const progressPct = isMax ? 100 : Math.min(100, Math.round(((xp - currentBase) / span) * 100));
  return {
    level,
    label: XP_LEVELS[level].label,
    icon: LEVEL_ICONS[level],
    color: LEVEL_COLORS[level],
    bg: LEVEL_BG[level],
    nextAt,
    currentBase,
    progressPct,
    isMax,
  };
}

// Defaultní XP odhad podle textu úkolu (když není override v task_xp)
export const STORY_XP_DEFAULT = 100;
export const HOURLY_XP_PER_HOUR_DEFAULT = 10;

export function isStoryTask(text: string | undefined | null): boolean {
  if (!text) return false;
  return /^napsat p[řr]íběh/i.test(text.trim());
}

export function defaultXpFor(text: string | undefined | null): number {
  if (isStoryTask(text)) return STORY_XP_DEFAULT;
  return 0;
}
