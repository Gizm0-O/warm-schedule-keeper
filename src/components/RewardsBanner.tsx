import { useState, useEffect, useMemo, useRef } from 'react';
import { useRewards } from '../hooks/useRewards';
import { useTaskEarnings } from '../hooks/useTaskEarnings';
import { useTodos } from '../contexts/TodoContext';
import type { RewardsConfig } from '../hooks/useRewards';
import { useArchivedMonths, useMonthlyArchive, useMonthlyAutoArchive } from '../hooks/useMonthlyArchive';
import { cn } from '../lib/utils';
import { Coins, Star, Lock, ChevronDown, ChevronUp, Settings, Trash2, Pencil, History, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7);
const formatMonthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return format(new Date(y, m - 1, 1), 'LLLL yyyy', { locale: cs }).replace(/^./, c => c.toUpperCase());
};

import { LEVEL_ICONS, LEVEL_COLORS, LEVEL_BG, computeLevel, defaultXpFor } from '@/lib/xp';
import { useMonthlyXp } from '@/hooks/useMonthlyXp';
import { useTaskXp } from '@/hooks/useTaskXp';

export function RewardsBanner() {
  const { todos } = useTodos();
  const completedTodoIds = (() => {
    const s = new Set<string>();
    todos.forEach(t => { if (t.completed) s.add(t.id); });
    return s;
  })();
  const rewards = useRewards(completedTodoIds);
  const { earnings: liveEarnings, totalEarned: liveTotalEarned, removeEarning: removeLiveEarning, updateEarning: updateLiveEarning } = useTaskEarnings();

  // Auto-archivace předchozích měsíců při prvním otevření v novém měsíci
  useMonthlyAutoArchive();

  // Měsíční navigace
  const { months: archivedMonths } = useArchivedMonths();
  const [viewMonth, setViewMonth] = useState<string>(CURRENT_MONTH());
  const isArchiveView = viewMonth !== CURRENT_MONTH();
  const { archive, updateEarning: updateArchiveEarning, removeEarning: removeArchiveEarning, updateConfig: updateArchiveConfig, addEarning: addArchiveEarning } = useMonthlyArchive(isArchiveView ? viewMonth : null);

  // Sestav timeline měsíců: aktuální + všechny archivované, sestupně
  const monthTimeline = useMemo(() => {
    const set = new Set<string>([CURRENT_MONTH(), ...archivedMonths]);
    return Array.from(set).sort().reverse();
  }, [archivedMonths]);

  const currentIdx = monthTimeline.indexOf(viewMonth);
  const canGoOlder = currentIdx >= 0 && currentIdx < monthTimeline.length - 1;
  const canGoNewer = currentIdx > 0;
  const goOlder = () => { if (canGoOlder) setViewMonth(monthTimeline[currentIdx + 1]); };
  const goNewer = () => { if (canGoNewer) setViewMonth(monthTimeline[currentIdx - 1]); };

  const [expanded, setExpanded] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [adminMode, setAdminMode] = useState(() => sessionStorage.getItem('adminMode') === '1');
  const [editingEarningId, setEditingEarningId] = useState<string | null>(null);
  const [editEarningAmount, setEditEarningAmount] = useState('');
  const [editEarningText, setEditEarningText] = useState('');
  const [editEarningBonusType, setEditEarningBonusType] = useState<string>('');
  const [editEarningBonusPercent, setEditEarningBonusPercent] = useState('');
  const [showAddArchiveEarning, setShowAddArchiveEarning] = useState(false);
  const [newEarningText, setNewEarningText] = useState('');
  const [newEarningAmount, setNewEarningAmount] = useState('');
  const [newEarningBonusType, setNewEarningBonusType] = useState<string>('');
  const [newEarningBonusPercent, setNewEarningBonusPercent] = useState('');
  const [newEarningDate, setNewEarningDate] = useState('');

  useEffect(() => {
    const handler = () => setAdminMode(sessionStorage.getItem('adminMode') === '1');
    window.addEventListener('adminModeChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('adminModeChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const [adminConfig, setAdminConfig] = useState<RewardsConfig>(rewards.config);

  const saveAdmin = () => {
    if (isArchiveView) {
      updateArchiveConfig(adminConfig);
    } else {
      rewards.saveConfig(adminConfig);
    }
    setShowAdminDialog(false);
  };

  // Adapter — earnings/handlery podle režimu
  const earnings = isArchiveView ? (archive?.earnings_snapshot ?? []) : liveEarnings;
  const removeEarning = isArchiveView ? removeArchiveEarning : removeLiveEarning;
  const updateEarning = isArchiveView ? updateArchiveEarning : updateLiveEarning;

  const startEditEarning = (e: any) => {
    setEditingEarningId(e.id);
    setEditEarningAmount(e.amount.toString());
    setEditEarningText(e.todo_text);
    setEditEarningBonusType(e.bonus_type || '');
    setEditEarningBonusPercent(e.bonus_percent?.toString() || '');
  };

  const saveEditEarning = () => {
    if (!editingEarningId) return;
    updateEarning(editingEarningId, {
      amount: parseInt(editEarningAmount) || 0,
      todo_text: editEarningText,
      bonus_type: editEarningBonusType || null,
      bonus_percent: editEarningBonusPercent ? parseFloat(editEarningBonusPercent) : null,
    });
    setEditingEarningId(null);
  };

  const saveNewArchiveEarning = async () => {
    if (!isArchiveView || !addArchiveEarning) return;
    const amount = parseInt(newEarningAmount) || 0;
    const text = newEarningText.trim();
    if (!text) return;
    let completedAt = '';
    if (newEarningDate) {
      // Local datetime input → ISO
      const d = new Date(newEarningDate);
      if (!isNaN(d.getTime())) completedAt = d.toISOString();
    }
    await addArchiveEarning({
      todo_id: `manual-${Date.now()}`,
      todo_text: text,
      amount,
      bonus_type: newEarningBonusType || null,
      bonus_percent: newEarningBonusPercent ? parseFloat(newEarningBonusPercent) : null,
      deadline: null,
      completed_at: completedAt,
    });
    setNewEarningText('');
    setNewEarningAmount('');
    setNewEarningBonusType('');
    setNewEarningBonusPercent('');
    setNewEarningDate('');
    setShowAddArchiveEarning(false);
  };

  const { config: liveConfig, saveConfig } = rewards;
  const config = isArchiveView && archive ? archive.config_snapshot as RewardsConfig : liveConfig;

  // Synchronizuj adminConfig s aktuálně zobrazeným měsícem
  useEffect(() => {
    setAdminConfig(config);
  }, [viewMonth, config.basePercent, config.bonusPerTask, config.bonusLate, config.maxTasks, config.monthlyEarnings]);

  // ========== Pro archivní režim používáme předpočítané hodnoty ze snapshotu ==========
  const archiveSummary = isArchiveView && archive ? {
    completedOnTime: archive.completed_on_time,
    completedLate: archive.completed_late,
    completedMissed: archive.completed_missed,
    totalBonusPercent: Number(archive.total_bonus_percent),
    activeTasks: archive.completed_on_time + archive.completed_late + archive.completed_missed,
  } : null;

  const bonusSummary = useMemo(() => {
    if (archiveSummary) {
      return { ...archiveSummary };
    }
    const taskEarnings = liveEarnings.filter(e => !String(e.todo_id).endsWith('__bonus'));
    const completedOnTime = taskEarnings.filter(e => e.bonus_type === 'on_time').length;
    const completedLate = taskEarnings.filter(e => e.bonus_type === 'late').length;
    const completedMissed = taskEarnings.filter(e => e.bonus_type === 'missed').length;
    const rawBonusPercent = taskEarnings.reduce((sum, e) => {
      if (e.bonus_type === 'on_time') {
        return sum + (e.bonus_percent != null ? Number(e.bonus_percent) : liveConfig.bonusPerTask);
      }
      if (e.bonus_type === 'late') {
        return sum + (e.bonus_percent != null ? Number(e.bonus_percent) : liveConfig.bonusLate);
      }
      return sum;
    }, 0);
    const totalBonusPercent = Math.min(rawBonusPercent, liveConfig.maxTasks * liveConfig.bonusPerTask);
    const activeTasks = completedOnTime + completedLate + completedMissed;

    return {
      completedOnTime,
      completedLate,
      completedMissed,
      totalBonusPercent,
      activeTasks,
    };
  }, [liveEarnings, liveConfig, archiveSummary]);

  const { completedOnTime, completedLate, completedMissed, totalBonusPercent } = bonusSummary;

  // ===== XP & Level systém =====
  const liveXp = useMonthlyXp();
  const { map: xpOverrides } = useTaskXp();

  // XP pro archivní měsíc - spočítá se ze snapshotu
  const archiveXp = useMemo(() => {
    if (!isArchiveView || !archive) return null;
    let sum = 0;
    (archive.earnings_snapshot || []).forEach((e: any) => {
      const tid = String(e.todo_id);
      if (tid.startsWith('hourly:')) return;
      if (tid.endsWith('__bonus')) return;
      if (xpOverrides[tid] != null) sum += xpOverrides[tid];
      else sum += defaultXpFor(e.todo_text);
    });
    (archive.hourly_tasks_snapshot || []).forEach((t: any) => {
      const xpPerHour = t.xp_per_hour ?? 10;
      sum += Math.round(Number(t.hours_worked || 0) * xpPerHour);
    });
    return { totalXp: sum, ...computeLevel(sum) };
  }, [isArchiveView, archive, xpOverrides]);

  const xpInfo = isArchiveView ? archiveXp : liveXp;
  const totalXp = xpInfo?.totalXp ?? 0;
  const effectiveLevel = xpInfo?.level ?? 0;
  const effectiveLevelLabel = xpInfo?.label ?? 'Newbie Bambul';
  const effectiveLevelIcon = xpInfo?.icon ?? '🌱';
  const effectiveLevelColor = xpInfo?.color ?? LEVEL_COLORS[0];
  const effectiveLevelBg = xpInfo?.bg ?? LEVEL_BG[0];
  const effectiveProgressPct = xpInfo?.progressPct ?? 0;
  const effectiveNextAt = xpInfo?.nextAt ?? 50;
  const effectiveCurrentBase = xpInfo?.currentBase ?? 0;
  const effectiveIsMax = xpInfo?.isMax ?? false;
  const effectiveActiveTasks = bonusSummary.activeTasks;

  // Animace level-upu (jen pro live view)
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (isArchiveView) return;
    if (prevLevelRef.current == null) { prevLevelRef.current = effectiveLevel; return; }
    if (effectiveLevel > prevLevelRef.current) {
      setLevelUpFlash(true);
      const t = setTimeout(() => setLevelUpFlash(false), 2500);
      prevLevelRef.current = effectiveLevel;
      return () => clearTimeout(t);
    }
    prevLevelRef.current = effectiveLevel;
  }, [effectiveLevel, isArchiveView]);

  // Vyděláno + odvozená čísla
  const totalEarned = isArchiveView && archive ? archive.total_earned : liveTotalEarned;
  const effectiveTotalPercent = isArchiveView && archive ? Number(archive.total_percent) : config.basePercent + totalBonusPercent;
  const totalAmount = isArchiveView && archive ? archive.allowance_amount : Math.round(totalEarned * effectiveTotalPercent / 100);
  const baseAmount = isArchiveView && archive ? archive.base_amount : Math.round(totalEarned * config.basePercent / 100);
  const bonusAmount = isArchiveView && archive ? archive.bonus_amount : totalAmount - baseAmount;
  const toHandOver = totalEarned - totalAmount;

  const noEarnings = totalEarned === 0;

  return (
    <>
      {/* Měsíční navigace - viditelná jen pokud existuje historie */}
      {(monthTimeline.length > 1) && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            type="button"
            onClick={goOlder}
            disabled={!canGoOlder}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Starší měsíc"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            {isArchiveView && <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className={cn(isArchiveView && 'text-muted-foreground')}>{formatMonthLabel(viewMonth)}</span>
            {isArchiveView && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                uzavřeno
              </span>
            )}
            {!isArchiveView && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success">
                aktuální
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={goNewer}
            disabled={!canGoNewer}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Novější měsíc"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className={cn(
          'rounded-2xl border-2 p-4 mb-2 transition-all cursor-pointer select-none',
          'dark:bg-opacity-10',
          effectiveLevelBg,
          isArchiveView && 'opacity-95 ring-1 ring-muted-foreground/10'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Hlavní řádek */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-2xl shadow-inner',
              effectiveLevelColor
            )}>
              {effectiveLevelIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{effectiveLevelLabel}</span>
                <span className="text-xs text-muted-foreground">Lv.{effectiveLevel}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', effectiveLevelColor)}
                    style={{ width: `${Math.max(effectiveProgressPct, effectiveIsMax ? 100 : 5)}%` }}
                  />
                </div>
                <span className="text-10px text-muted-foreground tabular-nums">
                  {effectiveIsMax ? `${totalXp} XP · MAX` : `${totalXp}/${effectiveNextAt} XP`}
                </span>
              </div>
            </div>
          </div>

          {/* Vyděláno z task_earnings */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground/70 leading-none">Vyděláno</p>
            <p className="text-2xl font-bold text-foreground leading-none">
              {totalEarned > 0 ? `${totalEarned.toLocaleString('cs')} Kč` : '0 Kč'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Coins className="h-4 w-4 text-warning" />
                <span className="text-lg font-bold text-foreground">
                  {noEarnings ? '?? Kč' : `${totalAmount.toLocaleString('cs')} Kč`}
                </span>
              </div>
              <div className="text-10px text-muted-foreground">
                {noEarnings ? 'Žádné výdělky' : `${effectiveTotalPercent.toFixed(1)}% z ${totalEarned.toLocaleString('cs')} Kč`}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowHistoryDialog(true); }}>
              <History className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {adminMode && (
              <button onClick={(e) => { e.stopPropagation(); setShowAdminDialog(true); }}>
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-xl bg-card/70 p-2">
                <div className="text-lg font-bold text-foreground">{noEarnings ? '—' : `${baseAmount.toLocaleString('cs')} Kč`}</div>
                <div className="text-9px text-muted-foreground">Základ {config.basePercent}%</div>
              </div>
              <div className="text-center rounded-xl bg-card/70 p-2">
                <div className="text-lg font-bold text-success">+{noEarnings ? '—' : `${bonusAmount.toLocaleString('cs')} Kč`}</div>
                <div className="text-9px text-muted-foreground">Bonus +{totalBonusPercent.toFixed(1)}%</div>
              </div>
              <div className="text-center rounded-xl bg-card/70 p-2">
                <div className="text-lg font-bold text-foreground">{completedOnTime + completedLate + completedMissed}/{config.maxTasks}</div>
                <div className="text-9px text-muted-foreground">Splněné úkoly</div>
              </div>
            </div>
            {/* Souhrn - kapesné vs k odevzdání */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center rounded-xl bg-warning/10 border border-warning/20 p-2">
                <div className="text-base font-bold text-warning">{noEarnings ? '—' : `${totalAmount.toLocaleString('cs')} Kč`}</div>
                <div className="text-9px text-muted-foreground">Kapesné ({effectiveTotalPercent.toFixed(1)}%)</div>
              </div>
              <div className="text-center rounded-xl bg-primary/10 border border-primary/20 p-2">
                <div className="text-base font-bold text-primary">{noEarnings ? '—' : `${toHandOver.toLocaleString('cs')} Kč`}</div>
                <div className="text-9px text-muted-foreground">Do rozpočtu</div>
              </div>
            </div>
            <div className="text-center text-[11px] text-muted-foreground">
              Splněno {completedOnTime + completedLate + completedMissed}/{config.maxTasks} úkolů · bonus +{totalBonusPercent.toFixed(1)}%
            </div>

            {/* Recent earnings preview */}
            {earnings.length > 0 && (
              <div className="mt-2 pt-2 border-t border-current/10">
                <div className="text-9px text-muted-foreground font-semibold mb-1">Poslední výdělky:</div>
                {earnings.slice(0, 3).map(e => (
                  <div key={e.id} className="flex justify-between text-[11px] py-0.5">
                    <span className="text-foreground truncate mr-2">{e.todo_text}</span>
                    <span className="text-success font-medium shrink-0">
                      +{e.amount.toLocaleString('cs')} Kč
                      {e.bonus_type && <span className="text-muted-foreground ml-1">({e.bonus_type === 'on_time' ? '⭐' : '⏳'} {e.bonus_percent}%)</span>}
                    </span>
                  </div>
                ))}
                {earnings.length > 3 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHistoryDialog(true); }}
                    className="text-[10px] text-primary mt-1"
                  >
                    Zobrazit vše ({earnings.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Settings Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={open => { if (!open) setShowAdminDialog(false); }}>
        <DialogContent aria-describedby="rewards-admin-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Nastavení odměn</DialogTitle>
            <DialogDescription id="rewards-admin-description">
              Nastavení základního procenta a bonusů pro výpočet odměn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Měsíční výdělek (Kč)</label>
                <Input type="number" value={adminConfig.monthlyEarnings || ''} onChange={e => setAdminConfig(c => ({ ...c, monthlyEarnings: Number(e.target.value) }))} className="mt-1" placeholder="50000" />
              </div>
              <div>
                <label className="text-sm font-medium">Měsíc (RRRR-MM)</label>
                <Input type="month" value={adminConfig.month} onChange={e => setAdminConfig(c => ({ ...c, month: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Základ % (kapesné)</label>
                <Input type="number" value={adminConfig.basePercent} onChange={e => setAdminConfig(c => ({ ...c, basePercent: Number(e.target.value) }))} className="mt-1" min={0} max={50} step={1} />
              </div>
              <div>
                <label className="text-sm font-medium">Bonus včas (%)</label>
                <Input type="number" value={adminConfig.bonusPerTask} onChange={e => setAdminConfig(c => ({ ...c, bonusPerTask: Number(e.target.value) }))} className="mt-1" min={0} max={5} step={0.5} />
              </div>
              <div>
                <label className="text-sm font-medium">Bonus pozdě (%)</label>
                <Input type="number" value={adminConfig.bonusLate} onChange={e => setAdminConfig(c => ({ ...c, bonusLate: Number(e.target.value) }))} className="mt-1" min={0} max={5} step={0.5} />
              </div>
              <div>
                <label className="text-sm font-medium">Max bonusových úkolů</label>
                <Input type="number" value={adminConfig.maxTasks} onChange={e => setAdminConfig(c => ({ ...c, maxTasks: Number(e.target.value) }))} className="mt-1" min={1} max={20} />
              </div>
            </div>
            <div className="rounded-xl bg-muted p-3 text-sm space-y-1">
              <div className="font-semibold text-foreground">Náhled</div>
              <div className="text-muted-foreground">Základ: {Math.round(adminConfig.monthlyEarnings * adminConfig.basePercent / 100).toLocaleString('cs')} Kč</div>
              <div className="text-muted-foreground">Max celkem: {Math.round(adminConfig.monthlyEarnings * (adminConfig.basePercent + adminConfig.maxTasks * adminConfig.bonusPerTask) / 100).toLocaleString('cs')} Kč ({(adminConfig.basePercent + adminConfig.maxTasks * adminConfig.bonusPerTask).toFixed(1)}%)</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>Zrušit</Button>
            <Button onClick={saveAdmin}>Uložit{isArchiveView ? ' (do archivu)' : ''}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Earnings History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={open => { if (!open) { setShowHistoryDialog(false); setEditingEarningId(null); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby="rewards-history-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Historie & Bonusy</DialogTitle>
            <DialogDescription id="rewards-history-description">
              Přehled zaznamenaných výdělků a bonusových procent u dokončených úkolů.
            </DialogDescription>
          </DialogHeader>

          {/* Earnings section - only completed tasks with recorded earnings */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-muted-foreground">Odevzdané úkoly ({earnings.length})</div>
              {adminMode && isArchiveView && !showAddArchiveEarning && (
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setShowAddArchiveEarning(true)}>
                  + Přidat úkol
                </Button>
              )}
            </div>

            {adminMode && isArchiveView && showAddArchiveEarning && (
              <div className="space-y-1.5 p-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 mb-2">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Nový záznam do archivu</div>
                <div className="flex gap-2">
                  <Input
                    value={newEarningText}
                    onChange={ev => setNewEarningText(ev.target.value)}
                    className="text-sm h-8"
                    placeholder="Text úkolu"
                  />
                  <Input
                    type="number"
                    value={newEarningAmount}
                    onChange={ev => setNewEarningAmount(ev.target.value)}
                    className="text-sm h-8 w-24"
                    placeholder="Kč"
                  />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={newEarningBonusType}
                    onChange={ev => setNewEarningBonusType(ev.target.value)}
                    className="text-xs h-7 rounded border border-input bg-background px-2"
                  >
                    <option value="">Bez bonusu</option>
                    <option value="on_time">⭐ Včas</option>
                    <option value="late">⏳ Pozdě</option>
                    <option value="missed">❌ Zmeškáno</option>
                  </select>
                  <Input
                    type="number"
                    value={newEarningBonusPercent}
                    onChange={ev => setNewEarningBonusPercent(ev.target.value)}
                    className="text-sm h-7 w-20"
                    placeholder="% bonus"
                    step="0.5"
                  />
                  <Input
                    type="datetime-local"
                    value={newEarningDate}
                    onChange={ev => setNewEarningDate(ev.target.value)}
                    className="text-sm h-7 w-44"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => { setShowAddArchiveEarning(false); }} className="h-7">Zrušit</Button>
                  <Button size="sm" onClick={saveNewArchiveEarning} className="h-7">Přidat</Button>
                </div>
              </div>
            )}

            {earnings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Zatím žádné odevzdané úkoly</p>
            )}
              {earnings.map(e => (
                <div key={e.id} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {editingEarningId === e.id ? (
                    <div className="flex-1 space-y-1.5">
                      <div className="flex gap-2">
                        <Input
                          value={editEarningText}
                          onChange={ev => setEditEarningText(ev.target.value)}
                          className="text-sm h-8"
                          placeholder="Text úkolu"
                        />
                        <Input
                          type="number"
                          value={editEarningAmount}
                          onChange={ev => setEditEarningAmount(ev.target.value)}
                          className="text-sm h-8 w-24"
                          placeholder="Kč"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <select
                          value={editEarningBonusType}
                          onChange={ev => setEditEarningBonusType(ev.target.value)}
                          className="text-xs h-7 rounded border border-input bg-background px-2"
                        >
                          <option value="">Bez bonusu</option>
                          <option value="on_time">⭐ Včas</option>
                          <option value="late">⏳ Pozdě</option>
                        </select>
                        <Input
                          type="number"
                          value={editEarningBonusPercent}
                          onChange={ev => setEditEarningBonusPercent(ev.target.value)}
                          className="text-sm h-7 w-20"
                          placeholder="% bonus"
                          step="0.5"
                        />
                        <Button size="sm" onClick={saveEditEarning} className="h-7">✓</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingEarningId(null)} className="h-7">✕</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{e.todo_text}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span>{format(parseISO(e.completed_at), 'd.M.yyyy HH:mm', { locale: cs })}</span>
                          {e.bonus_type && <span>{e.bonus_type === 'on_time' ? '⭐ včas' : '⏳ pozdě'} {e.bonus_percent}%</span>}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-success shrink-0">+{e.amount.toLocaleString('cs')} Kč</span>
                      {adminMode && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditEarning(e)} className="p-1 rounded hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => removeEarning(e.id)} className="p-1 rounded hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm font-bold">
              <span>Celkem vyděláno:</span>
              <span className="text-success">{totalEarned.toLocaleString('cs')} Kč</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
