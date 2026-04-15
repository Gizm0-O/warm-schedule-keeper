import { useState, useEffect } from 'react';
import { useRewards } from '../hooks/useRewards';
import type { RewardsConfig } from '../hooks/useRewards';
import { cn } from '../lib/utils';
import { Coins, Star, Lock, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';


const LEVEL_ICONS = ['\ud83c\udf31', '\u2b50', '\ud83d\udcaa', '\ud83d\udc8e', '\ud83d\udc51'];
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
  const rewards = useRewards();
  const [expanded, setExpanded] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  
  const [adminConfig, setAdminConfig] = useState<RewardsConfig>(rewards.config);


  const saveAdmin = () => {
    rewards.saveConfig(adminConfig);
    setShowAdminDialog(false);
    setPinInput('');
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
        {/* Hlavn\u00ed ř\u00e1dek */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Level odznak */}
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
              {/* XP progress bar */}
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

          {/* Kapesn\u00e9 */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-foreground">
                  {noEarnings ? '?? Kč' : `${totalAmount.toLocaleString('cs')} Kč`}
                </span>
              </div>
              <div className="text-10px text-muted-foreground">
                {noEarnings ? 'Nastav výdělek \u2193' : `${totalPercent.toFixed(1)}% z výdělku`}
              </div>
            </div>
            {adminMode && <button onClick={() => setShowAdminDialog(true)}>
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </button>}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Rozbal detail */}
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
          </div>
        )}
      </div>

      {/* Admin dialog */}
      <Dialog open={showAdminDialog} onOpenChange={open => { if (!open) { setShowAdminDialog(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Nastavení odměn</DialogTitle>
          </DialogHeader>
          
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Měsíční výdělek (Kč)</label>
                  <Input
                    type="number"
                    value={adminConfig.monthlyEarnings || ''}
                    onChange={e => setAdminConfig(c => ({ ...c, monthlyEarnings: Number(e.target.value) }))}
                    className="mt-1"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Měsíc (RRRR-MM)</label>
                  <Input
                    type="month"
                    value={adminConfig.month}
                    onChange={e => setAdminConfig(c => ({ ...c, month: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Základ % (kapesné)</label>
                  <Input
                    type="number"
                    value={adminConfig.basePercent}
                    onChange={e => setAdminConfig(c => ({ ...c, basePercent: Number(e.target.value) }))}
                    className="mt-1"
                    min={0} max={50} step={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus včas (%)</label>
                  <Input
                    type="number"
                    value={adminConfig.bonusPerTask}
                    onChange={e => setAdminConfig(c => ({ ...c, bonusPerTask: Number(e.target.value) }))}
                    className="mt-1"
                    min={0} max={5} step={0.5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus pozdě (%)</label>
                  <Input
                    type="number"
                    value={adminConfig.bonusLate}
                    onChange={e => setAdminConfig(c => ({ ...c, bonusLate: Number(e.target.value) }))}
                    className="mt-1"
                    min={0} max={5} step={0.5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max bonusových úkolů</label>
                  <Input
                    type="number"
                    value={adminConfig.maxTasks}
                    onChange={e => setAdminConfig(c => ({ ...c, maxTasks: Number(e.target.value) }))}
                    className="mt-1"
                    min={1} max={20}
                  />
                </div>
              </div>
              {/* Náhled výpočtu */}
              <div className="rounded-xl bg-muted p-3 text-sm space-y-1">
                <div className="font-semibold text-foreground">Náhled</div>
                <div className="text-muted-foreground">
                  Základ: {Math.round(adminConfig.monthlyEarnings * adminConfig.basePercent / 100).toLocaleString('cs')} Kč
                </div>
                <div className="text-muted-foreground">
                  Max celkem: {Math.round(adminConfig.monthlyEarnings * (adminConfig.basePercent + adminConfig.maxTasks * adminConfig.bonusPerTask) / 100).toLocaleString('cs')} Kč
                  ({(adminConfig.basePercent + adminConfig.maxTasks * adminConfig.bonusPerTask).toFixed(1)}%)
                </div>
              </div>
            </div>
              <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdminDialog(false)}>Zrušit</Button>
                <Button onClick={saveAdmin}>Uložit</Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
