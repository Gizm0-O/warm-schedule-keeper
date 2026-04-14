import { useState, useEffect, useCallback } from 'react';

export interface RewardsConfig {
  monthlyEarnings: number;   // Měsíční výdělek Kč
  basePercent: number;       // Základní % (default 10)
  bonusPerTask: number;      // % za splněný úkol včas (default 1)
  bonusLate: number;         // % za splněný úkol pozdě (default 0.5)
  maxTasks: number;          // Max počet bonusových úkolů (default 10)
  month: string;             // "YYYY-MM" - pro který měsíc
}

export interface TaskBonus {
  todoId: string;
  status: 'pending' | 'on_time' | 'late' | 'missed';
  // on_time = splněno včas (+bonusPerTask%)
  // late = splněno pozdě (+bonusLate%)
  // missed = nesplněno (+0%)
  // pending = zatím nesplněno
}

const STORAGE_KEY = 'rewards_config';
const BONUS_KEY = 'rewards_task_bonuses';

const defaultConfig: RewardsConfig = {
  monthlyEarnings: 0,
  basePercent: 10,
  bonusPerTask: 1,
  bonusLate: 0.5,
  maxTasks: 10,
  month: new Date().toISOString().slice(0, 7),
};

export function useRewards() {
  const [config, setConfigState] = useState<RewardsConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch { return defaultConfig; }
  });

  const [taskBonuses, setTaskBonusesState] = useState<TaskBonus[]>(() => {
    try {
      const saved = localStorage.getItem(BONUS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveConfig = useCallback((newConfig: RewardsConfig) => {
    setConfigState(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  const setTaskBonus = useCallback((todoId: string, status: TaskBonus['status']) => {
    setTaskBonusesState(prev => {
      const next = prev.filter(b => b.todoId !== todoId);
      const updated = [...next, { todoId, status }];
      localStorage.setItem(BONUS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getTaskBonus = useCallback((todoId: string): TaskBonus['status'] => {
    return taskBonuses.find(b => b.todoId === todoId)?.status ?? 'pending';
  }, [taskBonuses]);

  // Výpočty
  const completedOnTime = taskBonuses.filter(b => b.status === 'on_time').length;
  const completedLate = taskBonuses.filter(b => b.status === 'late').length;
  const totalBonusPercent = Math.min(
    completedOnTime * config.bonusPerTask + completedLate * config.bonusLate,
    config.maxTasks * config.bonusPerTask
  );
  const totalPercent = config.basePercent + totalBonusPercent;
  const totalAmount = Math.round(config.monthlyEarnings * totalPercent / 100);
  const baseAmount = Math.round(config.monthlyEarnings * config.basePercent / 100);
  const bonusAmount = totalAmount - baseAmount;

  // Level systém
  const activeTasks = taskBonuses.filter(b => b.status === 'on_time' || b.status === 'late').length;
  const level = activeTasks <= 0 ? 0 : activeTasks <= 3 ? 1 : activeTasks <= 6 ? 2 : activeTasks <= 9 ? 3 : 4;
  const levelLabel = ['Začínám 🌱', 'Na cestě ⭐', 'Makám 💪', 'Boss level 💎', 'Legenda 👑'][level];
  const nextLevelAt = [1, 4, 7, 10, 10][level];
  const progressToNext = level >= 4 ? 100 : Math.round((activeTasks - [0,0,4,7,10][level]) / (nextLevelAt - [0,0,4,7,10][level]) * 100);

  return {
    config,
    saveConfig,
    taskBonuses,
    setTaskBonus,
    getTaskBonus,
    // Výsledky
    totalPercent,
    totalAmount,
    baseAmount,
    bonusAmount,
    completedOnTime,
    completedLate,
    totalBonusPercent,
    // Level
    level,
    levelLabel,
    activeTasks,
    nextLevelAt,
    progressToNext,
  };
}
