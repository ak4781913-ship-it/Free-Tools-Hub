/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import {
  getDailyProgress,
  setDailyGoal,
  subscribeToDailyGoal,
  getLast7DaysUsage,
  download7DaysUsageCSV,
  DailyGoalProgress,
} from '../../utils/dailyGoalTracking';
import {
  Target,
  CheckCircle2,
  ArrowRight,
  Minus,
  Plus,
  Download,
} from 'lucide-react';

interface DailyGoalTrackerProps {
  onSelectTool: (toolId: string) => void;
  onExploreTools: () => void;
}

const PRESET_GOALS = [3, 5, 8, 10];

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({
  onSelectTool,
  onExploreTools,
}) => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isUrdu = language === 'ur';

  const [progress, setProgress] = useState<DailyGoalProgress>(() => getDailyProgress());

  useEffect(() => {
    const syncProgress = () => {
      setProgress(getDailyProgress());
    };
    syncProgress();
    const unsubscribe = subscribeToDailyGoal(syncProgress);
    return unsubscribe;
  }, []);

  const handleSetGoal = (nextGoal: number) => {
    const clamped = Math.max(1, Math.min(20, Math.round(nextGoal)));
    if (clamped === progress.goal) return;
    setDailyGoal(clamped);
    setProgress(getDailyProgress());
    toast.info(
      t.dailyGoal.trackerTitle,
      t.dailyGoal.goalUpdatedToast.replace('{goal}', String(clamped)),
      { compact: true, duration: 2800, dedupeKey: 'daily-goal-target' }
    );
  };

  const handleExportCSV = () => {
    const history = getLast7DaysUsage(progress.goal);
    const filename = download7DaysUsageCSV(history, progress.goal, progress.streakDays);
    toast.success(
      t.dailyGoal.exportCSV,
      t.dailyGoal.exportSuccess.replace('{filename}', filename),
      { compact: true, duration: 3500, dedupeKey: 'daily-goal-csv' }
    );
  };

  const usedToolDefs = useMemo(() => {
    return progress.toolsUsedToday
      .map((id) => TOOLS_LIST.find((tool) => tool.id === id))
      .filter((tool): tool is ToolDefinition => Boolean(tool));
  }, [progress.toolsUsedToday]);

  const remaining = Math.max(0, progress.goal - progress.completedCount);
  const clampedScale = Math.min(1, Math.max(0, progress.percent / 100));

  const progressText = t.dailyGoal.toolsUsed
    .replace('{count}', String(progress.completedCount))
    .replace('{goal}', String(progress.goal));

  return (
    <section
      id="daily-goal-tracker"
      aria-labelledby="daily-goal-tracker-heading"
      className="no-print w-full max-w-7xl mx-auto pt-6 pb-2 px-4 sm:px-6 lg:px-8 min-w-0"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 transition-colors min-w-0">
        {/* Header Row: Title + Unboxed Metadata on Left, Target Controls on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                progress.isGoalReached
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
              }`}
            >
              {progress.isGoalReached ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Target className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2
                  id="daily-goal-tracker-heading"
                  className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  {t.dailyGoal.trackerTitle}
                </h2>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {progress.completedCount} / {progress.goal} {isUrdu ? 'ٹولز' : 'tools'}
                </span>
                {progress.streakDays > 0 && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 tabular-nums">
                      {t.dailyGoal.streak.replace('{days}', String(progress.streakDays))}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 break-words">
                {t.dailyGoal.trackerSubtitle}
              </p>
            </div>
          </div>

          {/* Interactive Goal Target Controls & CSV Log Export */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              {t.dailyGoal.adjustGoal}
            </span>

            {/* Segmented Preset Selector */}
            <div
              role="group"
              aria-label={isUrdu ? 'روزانہ کا ہدف منتخب کریں' : 'Select daily tool goal'}
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90"
            >
              {PRESET_GOALS.map((preset) => {
                const isActive = progress.goal === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSetGoal(preset)}
                    aria-pressed={isActive}
                    className={`min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-md tabular-nums whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Fine-Grained +/- Stepper */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => handleSetGoal(progress.goal - 1)}
                disabled={progress.goal <= 1}
                aria-label={isUrdu ? 'ہدف کم کریں' : 'Decrease daily goal'}
                className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-s-lg transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                aria-live="polite"
                className="px-2 text-xs font-mono font-semibold text-slate-900 dark:text-white tabular-nums whitespace-nowrap shrink-0"
              >
                {progress.goal}
              </span>
              <button
                type="button"
                onClick={() => handleSetGoal(progress.goal + 1)}
                disabled={progress.goal >= 20}
                aria-label={isUrdu ? 'ہدف بڑھائیں' : 'Increase daily goal'}
                className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-e-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export 7-Day Activity CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              title={t.dailyGoal.exportCsvTooltip}
              className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{t.dailyGoal.exportCSV}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Numeric Readout */}
        <div className="py-4 space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {progress.isGoalReached ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {t.dailyGoal.goalReached.replace('{count}', String(progress.completedCount))}
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  {progressText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono tabular-nums shrink-0">
              {!progress.isGoalReached && (
                <>
                  <span className="text-slate-500 dark:text-slate-400 font-sans">
                    {t.dailyGoal.remainingTools.replace('{count}', String(remaining))}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 font-sans">
                    ·
                  </span>
                </>
              )}
              <span
                className={`font-bold text-sm ${
                  progress.isGoalReached
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-blue-700 dark:text-blue-400'
                }`}
              >
                {progress.percent}%
              </span>
            </div>
          </div>

          {/* Accessible Progress Bar (Compositor-only scaleX transform) */}
          <div
            role="progressbar"
            aria-labelledby="daily-goal-tracker-heading"
            aria-valuenow={progress.completedCount}
            aria-valuemin={0}
            aria-valuemax={progress.goal}
            aria-valuetext={`${progressText} (${progress.percent}%)`}
            className="relative h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
          >
            <div
              className={`h-full w-full rounded-full origin-left rtl:origin-right transition-transform duration-200 ease-out ${
                progress.isGoalReached
                  ? 'bg-emerald-600 dark:bg-emerald-500'
                  : 'bg-blue-600 dark:bg-blue-500'
              }`}
              style={{ transform: `scaleX(${clampedScale})` }}
            />
          </div>
        </div>

        {/* Footer Row: Today's Explored Tools or Empty State Prompt */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs min-w-0">
          {usedToolDefs.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                {t.dailyGoal.toolsCompletedToday}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {usedToolDefs.slice(0, 6).map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelectTool(tool.id)}
                    className="min-h-[30px] inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 max-w-[220px] truncate cursor-pointer"
                  >
                    <span className="truncate">{isUrdu ? tool.nameUrdu : tool.name}</span>
                  </button>
                ))}
                {usedToolDefs.length > 6 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                    +{usedToolDefs.length - 6} {isUrdu ? 'مزید' : 'more'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 break-words">
              {t.dailyGoal.noToolsYet}
            </p>
          )}

          <button
            type="button"
            onClick={onExploreTools}
            className="min-h-[34px] self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{t.dailyGoal.exploreMore}</span>
            <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isUrdu ? '-scale-x-100' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
};
