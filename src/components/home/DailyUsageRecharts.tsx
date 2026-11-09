import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { DailyUsageHistoryPoint } from '../../utils/dailyGoalTracking';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  BarChart2,
  LineChart as LineChartIcon,
  Award,
  CheckCircle2,
  Download,
  Calendar,
  Flame,
} from 'lucide-react';

interface DailyUsageRechartsProps {
  history: DailyUsageHistoryPoint[];
  goal: number;
  streakDays?: number;
  onExportCSV?: () => void;
}

type ChartType = 'area' | 'bar';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  goal: number;
  isUrdu: boolean;
}

const CustomRechartsTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  goal,
  isUrdu,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as {
    date: string;
    day: string;
    count: number;
    goal: number;
    isToday: boolean;
    reachedGoal: boolean;
  };

  const count = data.count ?? 0;
  const reached = count >= goal;
  const diff = goal - count;

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-xl text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150 z-50 pointer-events-none">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5 font-bold">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{data.day}</span>
          <span className="text-[11px] font-normal text-slate-400">({data.date})</span>
        </div>
        {data.isToday && (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-extrabold uppercase tracking-wide">
            {isUrdu ? 'آج' : 'Today'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-0.5">
        <span className="text-slate-300">
          {isUrdu ? 'استعمال شدہ ٹولز:' : 'Tools used:'}
        </span>
        <span className="font-mono font-bold text-sm text-white tabular-nums">
          {count} <span className="text-[10px] text-slate-400 font-normal">/ {goal} target</span>
        </span>
      </div>

      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80 text-[11px]">
        {reached ? (
          <div className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{isUrdu ? 'ہدف مکمل ہوگیا!' : 'Daily Goal Achieved!'}</span>
          </div>
        ) : (
          <div className="text-amber-400 font-medium">
            <span>
              {isUrdu ? `${diff} ٹولز باقی ہیں` : `${diff} more needed to hit goal`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const DailyUsageRecharts: React.FC<DailyUsageRechartsProps> = ({
  history,
  goal,
  streakDays = 0,
  onExportCSV,
}) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const [chartType, setChartType] = useState<ChartType>('area');

  // Format data for Recharts
  const chartData = useMemo(() => {
    return history.map((item) => ({
      ...item,
      day: isUrdu ? item.dayLabelUrdu : item.dayLabel,
      goal,
    }));
  }, [history, isUrdu, goal]);

  // Derived statistics
  const { total7Days, avgPerDay, peakCount, daysGoalMet } = useMemo(() => {
    if (!history.length) return { total7Days: 0, avgPerDay: '0', peakCount: 0, daysGoalMet: 0 };
    const counts = history.map((d) => d.count);
    const total = counts.reduce((sum, c) => sum + c, 0);
    const avg = (total / history.length).toFixed(1);
    const peak = Math.max(...counts, 0);
    const met = history.filter((d) => d.count >= goal).length;
    return {
      total7Days: total,
      avgPerDay: avg,
      peakCount: peak,
      daysGoalMet: met,
    };
  }, [history, goal]);

  const maxChartValue = useMemo(() => {
    const counts = history.map((d) => d.count);
    return Math.max(...counts, goal + 2, 5);
  }, [history, goal]);

  return (
    <div className="w-full bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 transition-all flex flex-col justify-between">
      {/* Top Header: Title, Statistics & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {t.dailyGoal.activityTrend}
            </h4>
            <div className="flex items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{t.dailyGoal.avgPerDay.replace('{avg}', avgPerDay)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {isUrdu ? `7 دنوں کا مجموعہ: ${total7Days}` : `7-Day Total: ${total7Days}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {isUrdu ? `${daysGoalMet}/7 دن مکمل` : `${daysGoalMet}/7 days met`}
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher (Area vs Bar) & CSV Export */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show Area Trend Curve"
            >
              <LineChartIcon className="w-3 h-3" />
              <span className="hidden xs:inline">{isUrdu ? 'کرو' : 'Curve'}</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show Bar Breakdown"
            >
              <BarChart2 className="w-3 h-3" />
              <span className="hidden xs:inline">{isUrdu ? 'بارز' : 'Bars'}</span>
            </button>
          </div>

          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer active:scale-95"
              title={t.dailyGoal.exportCsvTooltip}
            >
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full h-36 min-h-[144px] relative select-none">
        <ResponsiveContainer width="100%" height={144}>
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -24, bottom: 0 }}>
              <defs>
                {/* Area Gradient */}
                <linearGradient id="rechartsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                {/* Stroke Gradient */}
                <linearGradient id="rechartsStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="70%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
              />

              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
              />

              <YAxis
                domain={[0, maxChartValue]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }}
                allowDecimals={false}
              />

              <Tooltip
                content={<CustomRechartsTooltip goal={goal} isUrdu={isUrdu} />}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              {/* Goal Target Line */}
              <ReferenceLine
                y={goal}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                strokeOpacity={0.65}
                label={{
                  value: `${t.dailyGoal.dailyTargetLine} (${goal})`,
                  position: 'insideTopRight',
                  fill: '#6366f1',
                  fontSize: 9,
                  fontWeight: 700,
                  offset: 4,
                }}
              />

              <Area
                type="monotone"
                dataKey="count"
                stroke="url(#rechartsStrokeGrad)"
                strokeWidth={2.5}
                fill="url(#rechartsAreaGrad)"
                activeDot={{
                  r: 5.5,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                  fill: '#6366f1',
                }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const reached = payload.count >= goal;
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={payload.isToday ? 4.5 : 3.5}
                      fill={reached ? '#10b981' : '#6366f1'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-150"
                    />
                  );
                }}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 12, right: 10, left: -24, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
              />

              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
              />

              <YAxis
                domain={[0, maxChartValue]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }}
                allowDecimals={false}
              />

              <Tooltip
                content={<CustomRechartsTooltip goal={goal} isUrdu={isUrdu} />}
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
              />

              {/* Goal Target Line */}
              <ReferenceLine
                y={goal}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                strokeOpacity={0.65}
                label={{
                  value: `${t.dailyGoal.dailyTargetLine} (${goal})`,
                  position: 'insideTopRight',
                  fill: '#6366f1',
                  fontSize: 9,
                  fontWeight: 700,
                  offset: 4,
                }}
              />

              <Bar
                dataKey="count"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              >
                {chartData.map((entry) => {
                  const reached = entry.count >= goal;
                  const isToday = entry.isToday;
                  let fill = reached ? '#10b981' : '#6366f1';
                  if (isToday && !reached) fill = '#4f46e5';

                  return (
                    <Cell
                      key={`bar-${entry.date}`}
                      fill={fill}
                      opacity={entry.count === 0 ? 0.25 : 1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs" />
            <span>{isUrdu ? 'ہدف مکمل' : 'Goal Met'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block shadow-xs" />
            <span>{isUrdu ? 'سرگرمی جاری' : 'Active Progress'}</span>
          </span>
          <span className="hidden xs:inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-indigo-400 inline-block" />
            <span>{isUrdu ? 'ہدف کی لکیر' : 'Target Line'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px]">
          <Award className="w-3 h-3 text-amber-500" />
          <span>{isUrdu ? `بہترین دن: ${peakCount}` : `Peak: ${peakCount}`}</span>
        </div>
      </div>
    </div>
  );
};
