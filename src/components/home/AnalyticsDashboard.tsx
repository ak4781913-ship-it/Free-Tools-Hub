/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  getDailyProgress,
  getLast7DaysUsage,
  subscribeToDailyGoal,
  download7DaysUsageCSV,
  DailyGoalProgress,
  DailyUsageHistoryPoint,
} from '../../utils/dailyGoalTracking';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Download,
  ArrowRight,
  Minus,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onExploreTools: () => void;
}

type ChartMode = 'bar' | 'area';

interface ChartDatum extends DailyUsageHistoryPoint {
  displayDay: string;
  shortDate: string;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  goal: number;
  isUrdu: boolean;
  labels: {
    todayTag: string;
    toolsUnit: string;
    toolSingular: string;
    goalMet: string;
    targetSummary: string;
  };
}

const AnalyticsTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  goal,
  isUrdu,
  labels,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const unit = point.count === 1 ? labels.toolSingular : labels.toolsUnit;

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="bg-slate-900 dark:bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700/90 shadow-lg text-xs space-y-1.5 pointer-events-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
        <span className="font-semibold text-white">
          {point.displayDay} <span className="text-slate-400 font-mono tabular-nums">({point.date})</span>
        </span>
        {point.isToday && (
          <span className="text-[11px] font-semibold text-blue-300">
            {labels.todayTag}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="font-sans text-slate-300">
          {labels.targetSummary.replace('{goal}', String(goal))}
        </span>
        <span className="font-bold text-white">
          {point.count} {unit}
        </span>
      </div>

      {point.reachedGoal && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{labels.goalMet}</span>
        </div>
      )}
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onExploreTools,
}) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [progress, setProgress] = useState<DailyGoalProgress>(() => getDailyProgress());
  const [history, setHistory] = useState<DailyUsageHistoryPoint[]>(() =>
    getLast7DaysUsage(getDailyProgress().goal)
  );

  useEffect(() => {
    const syncAnalytics = () => {
      const latestProgress = getDailyProgress();
      setProgress(latestProgress);
      setHistory(getLast7DaysUsage(latestProgress.goal));
    };
    syncAnalytics();
    const unsubscribe = subscribeToDailyGoal(syncAnalytics);
    return unsubscribe;
  }, []);

  const chartData: ChartDatum[] = useMemo(() => {
    return history.map((point) => ({
      ...point,
      displayDay: isUrdu ? point.dayLabelUrdu : point.dayLabel,
      shortDate: point.date.slice(5), // MM-DD
    }));
  }, [history, isUrdu]);

  const metrics = useMemo(() => {
    if (history.length === 0) {
      return {
        total7Days: 0,
        dailyAverage: '0.0',
        peakCount: 0,
        peakDayLabel: '—',
        daysGoalMet: 0,
      };
    }

    const total = history.reduce((sum, item) => sum + item.count, 0);
    const avg = (total / history.length).toFixed(1);
    let peakItem = history[0];
    for (const item of history) {
      if (item.count >= peakItem.count) {
        peakItem = item;
      }
    }
    const metCount = history.filter((item) => item.count >= progress.goal).length;

    return {
      total7Days: total,
      dailyAverage: avg,
      peakCount: peakItem.count,
      peakDayLabel:
        peakItem.count > 0
          ? isUrdu
            ? peakItem.dayLabelUrdu
            : peakItem.dayLabel
          : '—',
      daysGoalMet: metCount,
    };
  }, [history, progress.goal, isUrdu]);

  const yAxisMax = useMemo(() => {
    const highest = Math.max(...history.map((d) => d.count), 0);
    return Math.max(highest + 1, progress.goal + 1, 5);
  }, [history, progress.goal]);

  const handleExportCSV = () => {
    const filename = download7DaysUsageCSV(history, progress.goal, progress.streakDays);
    toast.success(
      t.analyticsDashboard.exportCsv,
      t.dailyGoal.exportSuccess.replace('{filename}', filename),
      { compact: true, duration: 3500, dedupeKey: 'analytics-dashboard-csv' }
    );
  };

  const axisTickColor = isDark ? '#94a3b8' : '#64748b';
  const gridStrokeColor = isDark ? '#1e293b' : '#e2e8f0';
  const targetStrokeColor = isDark ? '#60a5fa' : '#1d4ed8';

  return (
    <section
      id="analytics-dashboard"
      aria-labelledby="analytics-dashboard-heading"
      className="no-print w-full max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 min-w-0"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 transition-colors min-w-0">
        {/* Header Row: Title & Unboxed Metadata + Chart Mode & CSV Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2
                  id="analytics-dashboard-heading"
                  className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  {t.analyticsDashboard.title}
                </h2>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.analyticsDashboard.windowLabel}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {t.analyticsDashboard.targetSummary.replace('{goal}', String(progress.goal))}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 break-words">
                {t.analyticsDashboard.subtitle}
              </p>
            </div>
          </div>

          {/* Interactive Chart Mode Switcher & CSV Export */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 min-w-0">
            <div
              role="group"
              aria-label={isUrdu ? 'چارٹ کی قسم منتخب کریں' : 'Select chart visualization mode'}
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90"
            >
              <button
                type="button"
                onClick={() => setChartMode('bar')}
                aria-pressed={chartMode === 'bar'}
                className={`min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  chartMode === 'bar'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span>{t.analyticsDashboard.barView}</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('area')}
                aria-pressed={chartMode === 'area'}
                className={`min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  chartMode === 'area'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{t.analyticsDashboard.trendView}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              title={t.dailyGoal.exportCsvTooltip}
              className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{t.analyticsDashboard.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* Hairline-Divided 4-Metric Summary Strip (Zero Nested Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {t.analyticsDashboard.total7Days}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.total7Days}
              </span>
              <span className="text-xs font-sans text-slate-500 dark:text-slate-400">
                {metrics.total7Days === 1
                  ? t.analyticsDashboard.toolSingular
                  : t.analyticsDashboard.toolsUnit}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {t.analyticsDashboard.dailyAverage}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.dailyAverage}
              </span>
              <span className="text-xs font-sans text-slate-500 dark:text-slate-400">
                / {isUrdu ? 'دن' : 'day'}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {t.analyticsDashboard.peakUsage}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.peakCount}
              </span>
              <span className="text-xs font-sans text-slate-500 dark:text-slate-400 truncate">
                ({metrics.peakDayLabel})
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {t.analyticsDashboard.daysGoalMet}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  metrics.daysGoalMet > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {metrics.daysGoalMet}
              </span>
              <span className="text-xs font-sans text-slate-500 dark:text-slate-400">
                {t.analyticsDashboard.ofSevenDays}
              </span>
            </div>
          </div>
        </div>

        {/* Main Split: 7-Day Recharts Visualization (Left 8 cols) + High-Density Daily Log (Right 4 cols) */}
        <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-w-0">
          {/* Left: Recharts 7-Day Frequency Chart */}
          <div className="lg:col-span-8 flex flex-col justify-between min-w-0">
            <div
              dir="ltr"
              className="w-full min-w-0 h-[230px] sm:h-[250px]"
              role="region"
              aria-label={t.analyticsDashboard.subtitle}
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'bar' ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 14, right: 12, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={gridStrokeColor}
                    />
                    <XAxis
                      dataKey="displayDay"
                      tickLine={false}
                      axisLine={{ stroke: gridStrokeColor }}
                      tick={{ fontSize: 11, fill: axisTickColor, fontWeight: 500 }}
                    />
                    <YAxis
                      domain={[0, yAxisMax]}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: axisTickColor, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.04)' }}
                      content={
                        <AnalyticsTooltip
                          goal={progress.goal}
                          isUrdu={isUrdu}
                          labels={{
                            todayTag: t.analyticsDashboard.todayTag,
                            toolsUnit: t.analyticsDashboard.toolsUnit,
                            toolSingular: t.analyticsDashboard.toolSingular,
                            goalMet: t.analyticsDashboard.goalMet,
                            targetSummary: t.analyticsDashboard.targetSummary,
                          }}
                        />
                      }
                    />
                    <ReferenceLine
                      y={progress.goal}
                      stroke={targetStrokeColor}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: t.analyticsDashboard.goalLineLabel.replace(
                          '{goal}',
                          String(progress.goal)
                        ),
                        position: 'insideTopRight',
                        fill: targetStrokeColor,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry) => {
                        let fill = isDark ? '#3b82f6' : '#1d4ed8';
                        if (entry.reachedGoal) {
                          fill = isDark ? '#10b981' : '#059669';
                        } else if (entry.count === 0) {
                          fill = isDark ? '#334155' : '#cbd5e1';
                        }
                        return <Cell key={`cell-${entry.date}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 14, right: 12, left: -20, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="analyticsUsageArea" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isDark ? '#3b82f6' : '#1d4ed8'}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={isDark ? '#3b82f6' : '#1d4ed8'}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={gridStrokeColor}
                    />
                    <XAxis
                      dataKey="displayDay"
                      tickLine={false}
                      axisLine={{ stroke: gridStrokeColor }}
                      tick={{ fontSize: 11, fill: axisTickColor, fontWeight: 500 }}
                    />
                    <YAxis
                      domain={[0, yAxisMax]}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: axisTickColor, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ stroke: targetStrokeColor, strokeWidth: 1, strokeDasharray: '3 3' }}
                      content={
                        <AnalyticsTooltip
                          goal={progress.goal}
                          isUrdu={isUrdu}
                          labels={{
                            todayTag: t.analyticsDashboard.todayTag,
                            toolsUnit: t.analyticsDashboard.toolsUnit,
                            toolSingular: t.analyticsDashboard.toolSingular,
                            goalMet: t.analyticsDashboard.goalMet,
                            targetSummary: t.analyticsDashboard.targetSummary,
                          }}
                        />
                      }
                    />
                    <ReferenceLine
                      y={progress.goal}
                      stroke={targetStrokeColor}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: t.analyticsDashboard.goalLineLabel.replace(
                          '{goal}',
                          String(progress.goal)
                        ),
                        position: 'insideTopRight',
                        fill: targetStrokeColor,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={isDark ? '#3b82f6' : '#1d4ed8'}
                      strokeWidth={2.25}
                      fill="url(#analyticsUsageArea)"
                      isAnimationActive={false}
                      dot={(dotProps: any) => {
                        const { cx, cy, payload } = dotProps;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
                          return null;
                        }
                        const dotFill = payload.reachedGoal
                          ? isDark
                            ? '#10b981'
                            : '#059669'
                          : isDark
                          ? '#3b82f6'
                          : '#1d4ed8';
                        return (
                          <circle
                            key={`dot-${payload.date}`}
                            cx={cx}
                            cy={cy}
                            r={payload.isToday ? 4.5 : 3.5}
                            fill={dotFill}
                            stroke={isDark ? '#0f172a' : '#ffffff'}
                            strokeWidth={1.5}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Empty-State Action Row */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              {metrics.total7Days === 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
                  <span className="break-words">{t.analyticsDashboard.emptyNotice}</span>
                  <button
                    type="button"
                    onClick={onExploreTools}
                    className="min-h-[34px] self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{t.analyticsDashboard.openDirectory}</span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isUrdu ? '-scale-x-100' : ''}`} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t.analyticsDashboard.goalMet}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="w-2.5 h-2.5 rounded-xs bg-blue-700 dark:bg-blue-500 inline-block shrink-0"
                      />
                      <span>{t.analyticsDashboard.inProgress}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="w-3.5 border-b border-dashed border-blue-700 dark:border-blue-400 inline-block shrink-0"
                      />
                      <span>
                        {t.analyticsDashboard.goalLineLabel.replace(
                          '{goal}',
                          String(progress.goal)
                        )}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onExploreTools}
                    className="self-start sm:self-auto inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{t.analyticsDashboard.openDirectory}</span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isUrdu ? '-scale-x-100' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Compact 7-Day Frequency Table (Separated by Hairline Divider, Zero Nested Cards) */}
          <div className="lg:col-span-4 lg:border-s border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80 pt-4 lg:pt-0 lg:ps-6 flex flex-col justify-between min-w-0">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5">
                {t.analyticsDashboard.dailyBreakdown}
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[...chartData].reverse().map((row) => (
                  <div
                    key={row.date}
                    className="py-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-1.5 -mx-1.5 rounded-md transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-medium truncate ${
                          row.isToday
                            ? 'text-blue-700 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {row.displayDay}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                        {row.shortDate}
                      </span>
                      {row.isToday && (
                        <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 shrink-0">
                          · {t.analyticsDashboard.todayTag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                      {row.reachedGoal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">{t.analyticsDashboard.goalMet}</span>
                        </span>
                      ) : row.count === 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-sans text-slate-400 dark:text-slate-500">
                          <Minus className="w-3 h-3 shrink-0" />
                        </span>
                      ) : null}

                      <span
                        className={`font-semibold min-w-[2ch] text-end ${
                          row.reachedGoal
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : row.count > 0
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {row.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
