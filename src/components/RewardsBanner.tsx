import { useState, useEffect } from 'react';
import { useRewards } from '../hooks/useRewards';
import { useTaskEarnings } from '../hooks/useTaskEarnings';
import { useTodos } from '../contexts/TodoContext';
import type { RewardsConfig } from '../hooks/useRewards';
import { cn } from '../lib/utils';
import { Coins, Star, Lock, ChevronDown, ChevronUp, Settings, Trash2, Pencil, History } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

const LEVEL_ICONS = ['🌱', '⭐', '💪', '💎', '👑'];
const LEVEL_COLORS = [
  'from-slate-400 to-slate-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
];
const LEVEL_BG = [
  'bg-slate-50 border-slate-200',
  'bg-emerald-50 border-emerald-200',
  'bg-blue-50 border-blue-200',
  'bg-violet-50 border-violet-200',
  'bg-amber-50 border-amber-200',
];

export function RewardsBanner() {
  const { todos } = useTodos();
  const completedTodoIds = (() => {
    const s = new Set<string>();
    todos.forEach(t => { if (t.completed) s.add(t.id); });
    return s;
  })();
  const rewards = useRewards(completedTodoIds);
  const { earnings, totalEarned, removeEarning, updateEarning } = useTaskEarnings();
  const [expanded, setExpanded] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [adminMode, setAdminMode] = useState(() => sessionStorage.getItem('adminMode') === '1');
  const [editingEarningId, setEditingEarningId] = useState<string | null>(null);
  const [editEarningAmount, setEditEarningAmount] = useState('');
  const [editEarningText, setEditEarningText] = useState('');
  const [editEarningBonusType, setEditEarningBonusType] = useState<string>('');
  const [editEarningBonusPercent, setEditEarningBonusPercent] = useState('');

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
    rewards.saveConfig(adminConfig);
    setShowAdminDialog(false);
  };

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

  const { level, levelLabel, activeTasks, nextLevelAt, progressToNext,
    totalPercent, totalAmount, baseAmount, bonusAmount,
    completedOnTime, completedLate, config } = rewards;

  const noEarnings = config.monthlyEarnings === 0;

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border-2 p-4 mb-2 transition-all cursor-pointer select-none',
          'dark:bg-opacity-10',
          LEVEL_BG[level]
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Hlavní řádek */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-2xl shadow-inner',
              LEVEL_COLORS[level]
            )}>
              {LEVEL_ICONS[level]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{levelLabel}</span>
                <span className="text-xs text-muted-foreground">Lv.{level}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', LEVEL_COLORS[level])}
                    style={{ width: `${Math.max(progressToNext, level >= 4 ? 100 : 5)}%` }}
                  />
                </div>
                <span className="text-10px text-muted-foreground">
                  {level >= 4 ? 'MAX' : `${activeTasks}/${nextLevelAt} úkolů`}
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
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-foreground">
                  {noEarnings ? '?? Kč' : `${totalAmount.toLocaleString('cs')} Kč`}
                </span>
              </div>
              <div className="text-10px text-muted-foreground">
                {noEarnings ? 'Nastav výdělek ↓' : `${totalPercent.toFixed(1)}% z ${adminConfig.monthlyEarnings.toLocaleString('cs')} Kč`}
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
              <div className="text-center rounded-xl bg-white/60 dark:bg-white/5 p-2">
                <div className="text-lg font-bold text-foreground">{noEarnings ? '—' : `${baseAmount.toLocaleString('cs')} Kč`}</div>
                <div className="text-9px text-muted-foreground">Základ {config.basePercent}%</div>
              </div>
              <div className="text-center rounded-xl bg-white/60 dark:bg-white/5 p-2">
                <div className="text-lg font-bold text-emerald-600">+{noEarnings ? '—' : `${bonusAmount.toLocaleString('cs')} Kč`}</div>
                <div className="text-9px text-muted-foreground">Bonus +{rewards.totalBonusPercent.toFixed(1)}%</div>
              </div>
              <div className="text-center rounded-xl bg-white/60 dark:bg-white/5 p-2">
                <div className="text-lg font-bold text-foreground">{completedOnTime + completedLate}/{config.maxTasks}</div>
                <div className="text-9px text-muted-foreground">Splněné úkoly</div>
              </div>
            </div>
            <div className="flex gap-2 text-10px">
              <span className="flex items-center gap-1 text-emerald-600"><Star className="h-3 w-3 fill-emerald-500" /> {completedOnTime}× včas (+{config.bonusPerTask}%)</span>
              <span className="flex items-center gap-1 text-amber-600"><Star className="h-3 w-3 fill-amber-400" /> {completedLate}× pozdě (+{config.bonusLate}%)</span>
            </div>

            {/* Recent earnings preview */}
            {earnings.length > 0 && (
              <div className="mt-2 pt-2 border-t border-current/10">
                <div className="text-9px text-muted-foreground font-semibold mb-1">Poslední výdělky:</div>
                {earnings.slice(0, 3).map(e => (
                  <div key={e.id} className="flex justify-between text-[11px] py-0.5">
                    <span className="text-foreground truncate mr-2">{e.todo_text}</span>
                    <span className="text-emerald-600 font-medium shrink-0">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Nastavení odměn</DialogTitle>
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
            <Button onClick={saveAdmin}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Earnings History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={open => { if (!open) { setShowHistoryDialog(false); setEditingEarningId(null); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Historie & Bonusy</DialogTitle>
          </DialogHeader>

          {/* Bonus task assignments section */}
          {rewards.taskBonuses.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground mb-1">Bonusové úkoly ({rewards.taskBonuses.filter(b => b.status === 'on_time' || b.status === 'late').length})</div>
              {rewards.taskBonuses
                .filter(b => b.status === 'on_time' || b.status === 'late')
                .map(b => {
                  const todo = todos.find(t => t.id === b.todoId);
                  return (
                    <div key={b.todoId} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{todo?.text || b.todoId}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {b.status === 'on_time' ? `⭐ včas (+${config.bonusPerTask}%)` : `⏳ pozdě (+${config.bonusLate}%)`}
                          {todo?.amount ? ` • ${todo.amount.toLocaleString('cs')} Kč` : ''}
                        </div>
                      </div>
                      {adminMode && (
                        <div className="flex gap-1 shrink-0">
                          <select
                            value={b.status}
                            onChange={ev => rewards.setTaskBonus(b.todoId, ev.target.value as any)}
                            className="text-[10px] h-6 rounded border border-input bg-background px-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="on_time">⭐ Včas</option>
                            <option value="late">⏳ Pozdě</option>
                            <option value="pending">❌ Odebrat</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Earnings section */}
          {(earnings.length > 0 || rewards.taskBonuses.length === 0) && (
            <div className="space-y-1">
              {earnings.length > 0 && <div className="text-xs font-semibold text-muted-foreground mb-1 pt-2 border-t">Výdělky ({earnings.length})</div>}
              {earnings.length === 0 && rewards.taskBonuses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Zatím žádné výdělky ani bonusy</p>
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
                      <span className="text-sm font-bold text-emerald-600 shrink-0">+{e.amount.toLocaleString('cs')} Kč</span>
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
          )}

          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm font-bold">
              <span>Celkem vyděláno:</span>
              <span className="text-emerald-600">{totalEarned.toLocaleString('cs')} Kč</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
