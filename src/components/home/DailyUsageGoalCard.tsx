import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import {
  getDailyProgress,
  setDailyGoal,
  subscribeToDailyGoal,
  getLast7DaysUsage,
  download7DaysUsageCSV,
  DailyGoalProgress,
  DailyUsageHistoryPoint,
} from '../../utils/dailyGoalTracking';
import { DailyUsageRecharts } from './DailyUsageRecharts';
import {
  Target,
  Flame,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Plus,
  Minus,
  Sliders,
  FileSpreadsheet,
  Check,
} from 'lucide-react';

interface DailyUsageGoalCardProps {
  onSelectTool: (toolId: string) => void;
  onExploreTools?: () => void;
}

export const DailyUsageGoalCard: React.FC<DailyUsageGoalCardProps> = ({ onSelectTool, onExploreTools }) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const [progress, setProgress] = useState<DailyGoalProgress>(() => getDailyProgress());
  const [history, setHistory] = useState<DailyUsageHistoryPoint[]>(() =>
    getLast7DaysUsage(getDailyProgress().goal)
  );
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe to real-time goal updates across the applet
  useEffect(() => {
    const unsubscribe = subscribeToDailyGoal(() => {
      const p = getDailyProgress();
      setProgress(p);
      setHistory(getLast7DaysUsage(p.goal));
    });
    return unsubscribe;
  }, []);

  const handleAdjustGoal = (newGoal: number) => {
    setDailyGoal(newGoal);
    const updated = getDailyProgress();
    setProgress(updated);
    setHistory(getLast7DaysUsage(updated.goal));
  };

  const handleExportCSV = () => {
    const filename = download7DaysUsageCSV(history, progress.goal, progress.streakDays);
    setToastMsg(t.dailyGoal.exportSuccess.replace('{filename}', filename));
    setTimeout(() => setToastMsg(null), 3800);
  };

  // Resolve tool definitions for tools used today
  const usedToolDefs = useMemo(() => {
    return progress.toolsUsedToday
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, [progress.toolsUsedToday]);

  const presetGoals = [3, 5, 8, 10];

  return (
    <section className="w-full py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Feedback for CSV Export */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-6 ${
          progress.isGoalReached
            ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/60 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-md shadow-emerald-500/5'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
        }`}
      >
        {/* Subtle decorative background glow */}
        <div
          className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
            progress.isGoalReached ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
        />

        {/* Top Header Row */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs shrink-0 transition-colors ${
                progress.isGoalReached
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {progress.isGoalReached ? (
                <Trophy className="w-6 h-6 animate-bounce" />
              ) : (
                <Target className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t.dailyGoal.badge}
                </span>
                {progress.streakDays > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{t.dailyGoal.streak.replace('{days}', String(progress.streakDays))}</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {t.dailyGoal.title}
              </h3>
            </div>
          </div>

          {/* Goal Adjustment & CSV Export Actions Toolbar */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Export 7-Day Usage to CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
              title={t.dailyGoal.exportCsvTooltip}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.dailyGoal.exportCSV}</span>
            </button>

            {/* Change Daily Target Goal Button */}
            <button
              type="button"
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Change your target daily tool count"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {t.dailyGoal.adjustGoal} <strong className="font-bold text-indigo-600 dark:text-indigo-400">{progress.goal}</strong>
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Goal Setting Drawer/Bar */}
        {isEditingGoal && (
          <div className="relative mb-5 p-4 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isUrdu ? 'روزانہ کتنے ٹولز استعمال کرنے کا ارادہ ہے؟' : 'Select your daily target count:'}
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {presetGoals.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleAdjustGoal(g)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      progress.goal === g
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {g} {isUrdu ? 'ٹولز' : 'Tools'}
                  </button>
                ))}

                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(Math.max(1, progress.goal - 1))}
                    disabled={progress.goal <= 1}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    title="Decrease goal"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {progress.goal}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(Math.min(20, progress.goal + 1))}
                    disabled={progress.goal >= 20}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    title="Increase goal"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid: Left side for today's progress & status; Right side for 7-day D3 sparkline activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Progress Bar & Numerical Metrics */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <span className="text-slate-800 dark:text-slate-200">
                  {t.dailyGoal.toolsUsed
                    .replace('{count}', String(progress.completedCount))
                    .replace('{goal}', String(progress.goal))}
                </span>
                <span
                  className={`font-mono font-bold text-sm tabular-nums ${
                    progress.isGoalReached
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {progress.percent}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/80">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out shadow-xs ${
                    progress.isGoalReached
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500'
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            {/* Goal Achieved Banner or Tip */}
            {progress.isGoalReached ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t.dailyGoal.goalReached}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onExploreTools) onExploreTools();
                    else onSelectTool('resume-builder');
                  }}
                  className="font-bold underline hover:no-underline shrink-0 cursor-pointer"
                >
                  {t.dailyGoal.exploreMore} →
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{t.dailyGoal.noToolsYet}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.max(0, progress.goal - progress.completedCount)} {isUrdu ? 'باقی' : 'left'}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: 7-Day Recharts Activity Chart with Interactive Tooltip & View Switcher */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <DailyUsageRecharts
              history={history}
              goal={progress.goal}
              streakDays={progress.streakDays}
              onExportCSV={handleExportCSV}
            />
          </div>
        </div>

        {/* Bottom Bar: Explored Today Tools & CTA */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          {usedToolDefs.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {t.dailyGoal.toolsCompletedToday}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {usedToolDefs.slice(0, 6).map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelectTool(tool.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <span>{isUrdu ? tool.nameUrdu : tool.name}</span>
                  </button>
                ))}
                {usedToolDefs.length > 6 && (
                  <span className="text-[11px] text-slate-400">
                    +{usedToolDefs.length - 6} {isUrdu ? 'مزید' : 'more'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span>{t.dailyGoal.noToolsYet}</span>
          )}

          <button
            type="button"
            onClick={() => {
              if (onExploreTools) onExploreTools();
              else onSelectTool('resume-builder');
            }}
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
          >
            <span>{t.dailyGoal.exploreMore}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isUrdu ? '-scale-x-100' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
};
