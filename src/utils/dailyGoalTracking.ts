/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyGoalProgress {
  goal: number;
  completedCount: number;
  percent: number;
  isGoalReached: boolean;
  toolsUsedToday: string[];
  streakDays: number;
}

export interface DailyUsageHistoryPoint {
  date: string;
  dayLabel: string;
  dayLabelUrdu: string;
  count: number;
  isToday: boolean;
  reachedGoal: boolean;
}

interface StoredDailyProgress {
  date: string;
  toolsUsed: string[];
}

interface StoredStreakData {
  lastCompletedDate: string;
  streakCount: number;
}

const GOAL_STORAGE_KEY = 'freetools_hub_daily_goal';
const PROGRESS_STORAGE_KEY = 'freetools_hub_daily_progress';
const STREAK_STORAGE_KEY = 'freetools_hub_streak_data';
const HISTORY_STORAGE_KEY = 'freetools_hub_daily_history';
const EVENT_NAME = 'freetools_daily_goal_updated';

const DEFAULT_GOAL = 5;

const EN_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UR_DAY_NAMES = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];

// Helper to get formatted YYYY-MM-DD for local timezone
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to check if dateA is yesterday compared to dateB
function isYesterday(prevDateStr: string, currentDateStr: string): boolean {
  if (!prevDateStr) return false;
  const prev = new Date(prevDateStr + 'T00:00:00');
  const curr = new Date(currentDateStr + 'T00:00:00');
  const diffTime = curr.getTime() - prev.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Returns user's daily tool goal target (default 5)
 */
export function getDailyGoal(): number {
  try {
    const saved = localStorage.getItem(GOAL_STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_GOAL;
    return isNaN(parsed) || parsed < 1 ? DEFAULT_GOAL : Math.min(20, parsed);
  } catch {
    return DEFAULT_GOAL;
  }
}

/**
 * Updates the user's daily goal target
 */
export function setDailyGoal(goal: number): void {
  const sanitized = Math.max(1, Math.min(20, Math.round(goal)));
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, String(sanitized));
    const today = getTodayDateString();
    const rawProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (rawProgress) {
      const parsed: StoredDailyProgress = JSON.parse(rawProgress);
      if (
        parsed.date === today &&
        Array.isArray(parsed.toolsUsed) &&
        parsed.toolsUsed.length > 0 &&
        parsed.toolsUsed.length >= sanitized
      ) {
        const rawStreak = localStorage.getItem(STREAK_STORAGE_KEY);
        let streakCount = 1;
        if (rawStreak) {
          const parsedStreak: StoredStreakData = JSON.parse(rawStreak);
          if (parsedStreak.lastCompletedDate === today) {
            streakCount = parsedStreak.streakCount;
          } else if (isYesterday(parsedStreak.lastCompletedDate, today)) {
            streakCount = parsedStreak.streakCount + 1;
          }
        }
        localStorage.setItem(
          STREAK_STORAGE_KEY,
          JSON.stringify({ lastCompletedDate: today, streakCount })
        );
      }
    }
    notifyUpdate();
  } catch (err) {
    console.warn('Could not save daily goal:', err);
  }
}

/**
 * Retrieves the current day's progress and active streak
 */
export function getDailyProgress(): DailyGoalProgress {
  const today = getTodayDateString();
  const goal = getDailyGoal();

  let toolsUsed: string[] = [];
  try {
    const rawProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (rawProgress) {
      const parsed: StoredDailyProgress = JSON.parse(rawProgress);
      if (parsed.date === today && Array.isArray(parsed.toolsUsed)) {
        toolsUsed = parsed.toolsUsed;
      } else if (parsed.date !== today) {
        // New day: reset progress
        const resetData: StoredDailyProgress = { date: today, toolsUsed: [] };
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(resetData));
      }
    } else {
      toolsUsed = [];
    }
  } catch {
    toolsUsed = [];
  }

  // Calculate streak
  let streakDays = 0;
  try {
    const rawStreak = localStorage.getItem(STREAK_STORAGE_KEY);
    if (rawStreak) {
      const parsed: StoredStreakData = JSON.parse(rawStreak);
      if (parsed.lastCompletedDate === today) {
        streakDays = parsed.streakCount;
      } else if (isYesterday(parsed.lastCompletedDate, today)) {
        streakDays = parsed.streakCount;
      } else {
        streakDays = 0;
      }
    }
  } catch {
    streakDays = 0;
  }

  const completedCount = toolsUsed.length;
  const percent = Math.min(100, Math.round((completedCount / goal) * 100));
  const isGoalReached = completedCount >= goal;

  return {
    goal,
    completedCount,
    percent,
    isGoalReached,
    toolsUsedToday: toolsUsed,
    streakDays,
  };
}

/**
 * Records a tool access towards the daily goal
 */
export function recordToolUseForDailyGoal(toolId: string): DailyGoalProgress {
  if (!toolId) return getDailyProgress();

  const today = getTodayDateString();
  const goal = getDailyGoal();

  let toolsUsed: string[] = [];
  try {
    const rawProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (rawProgress) {
      const parsed: StoredDailyProgress = JSON.parse(rawProgress);
      if (parsed.date === today && Array.isArray(parsed.toolsUsed)) {
        toolsUsed = parsed.toolsUsed;
      }
    }
  } catch {
    toolsUsed = [];
  }

  if (!toolsUsed.includes(toolId)) {
    toolsUsed.push(toolId);
    try {
      localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({ date: today, toolsUsed })
      );
      updateHistoryRecord(today, toolsUsed.length);
    } catch {
      // ignore
    }
  }

  // Update streak if goal is met
  if (toolsUsed.length >= goal) {
    try {
      const rawStreak = localStorage.getItem(STREAK_STORAGE_KEY);
      let streakCount = 1;
      if (rawStreak) {
        const parsed: StoredStreakData = JSON.parse(rawStreak);
        if (parsed.lastCompletedDate === today) {
          streakCount = parsed.streakCount;
        } else if (isYesterday(parsed.lastCompletedDate, today)) {
          streakCount = parsed.streakCount + 1;
        } else {
          streakCount = 1;
        }
      }
      localStorage.setItem(
        STREAK_STORAGE_KEY,
        JSON.stringify({ lastCompletedDate: today, streakCount })
      );
    } catch {
      // ignore
    }
  }

  notifyUpdate();
  return getDailyProgress();
}

function updateHistoryRecord(dateStr: string, count: number): void {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const historyMap: Record<string, number> = raw ? JSON.parse(raw) : {};
    historyMap[dateStr] = count;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyMap));
  } catch {
    // ignore
  }
}

/**
 * Returns the last 7 days of tool usage activity for sparkline visualizations
 */
export function getLast7DaysUsage(currentGoal?: number): DailyUsageHistoryPoint[] {
  const goal = currentGoal ?? getDailyGoal();
  const today = getTodayDateString();
  const todayProgress = getDailyProgress();

  let historyMap: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      historyMap = JSON.parse(raw);
    }
  } catch {
    historyMap = {};
  }

  const points: DailyUsageHistoryPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayIndex = d.getDay();
    const isToday = i === 0;

    let count: number;
    if (isToday) {
      count = todayProgress.completedCount;
      historyMap[dateStr] = count;
    } else if (typeof historyMap[dateStr] === 'number') {
      count = historyMap[dateStr];
    } else {
      count = 0;
    }

    points.push({
      date: dateStr,
      dayLabel: EN_DAY_NAMES[dayIndex],
      dayLabelUrdu: UR_DAY_NAMES[dayIndex],
      count,
      isToday,
      reachedGoal: count >= goal,
    });
  }

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyMap));
  } catch {
    // ignore
  }

  return points;
}

/**
 * Subscribes to daily goal changes
 */
export function subscribeToDailyGoal(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  const storageHandler = (e: StorageEvent) => {
    if (
      e.key === GOAL_STORAGE_KEY ||
      e.key === PROGRESS_STORAGE_KEY ||
      e.key === STREAK_STORAGE_KEY ||
      e.key === HISTORY_STORAGE_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

function notifyUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

/**
 * Exports 7-day usage history to a CSV file and triggers automatic browser download
 * Returns the downloaded filename
 */
export function download7DaysUsageCSV(
  history: DailyUsageHistoryPoint[],
  goal: number,
  streakDays: number = 0
): string {
  const todayStr = getTodayDateString();
  const filename = `freetools_hub_7day_usage_${todayStr}.csv`;

  const rows: string[][] = [
    ['# FreeTools Hub - 7-Day Tool Usage Activity Log'],
    ['# Export Timestamp', new Date().toISOString()],
    ['# Daily Target Goal', String(goal)],
    ['# Consecutive Day Streak', `${streakDays} Days`],
    [],
    ['Date', 'Day of Week', 'Tools Explored Count', 'Target Goal', 'Goal Achieved', 'Completion Rate (%)'],
  ];

  history.forEach((point) => {
    const rate = Math.round((point.count / Math.max(1, goal)) * 100);
    const achieved = point.count >= goal ? 'Yes' : 'No';
    rows.push([
      point.date,
      point.dayLabel,
      String(point.count),
      String(goal),
      achieved,
      `${rate}%`,
    ]);
  });

  // Calculate summary metrics
  const totalCount = history.reduce((sum, p) => sum + p.count, 0);
  const avgCount = history.length > 0 ? (totalCount / history.length).toFixed(1) : '0';
  const bestCount = Math.max(...history.map((p) => p.count), 0);
  const daysMetGoal = history.filter((p) => p.count >= goal).length;

  rows.push([]);
  rows.push(['# SUMMARY STATISTICS', '']);
  rows.push(['Total Tools Used (Last 7 Days)', String(totalCount)]);
  rows.push(['Daily Average Tools Used', avgCount]);
  rows.push(['Peak Tools Used in a Day', String(bestCount)]);
  rows.push(['Days Goal Reached', `${daysMetGoal} of ${history.length}`]);

  // Escape and format CSV cells
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  // Trigger download via Blob with UTF-8 BOM
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return filename;
}

