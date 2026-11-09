import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { DailyUsageHistoryPoint } from '../../utils/dailyGoalTracking';
import { useLanguage } from '../../context/LanguageContext';
import { TrendingUp, Award, CheckCircle2, Download } from 'lucide-react';

interface DailyUsageSparklineProps {
  history: DailyUsageHistoryPoint[];
  goal: number;
  onExportCSV?: () => void;
}

export const DailyUsageSparkline: React.FC<DailyUsageSparklineProps> = ({
  history,
  goal,
  onExportCSV,
}) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dimensions
  const width = 360;
  const height = 96;
  const margin = { top: 12, right: 16, bottom: 22, left: 16 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Compute statistics
  const { maxCount, avgCount, bestDayCount, total7Days } = useMemo(() => {
    if (!history.length) return { maxCount: goal, avgCount: '0', bestDayCount: 0, total7Days: 0 };
    const counts = history.map((d) => d.count);
    const max = Math.max(...counts, goal + 1, 4);
    const total = counts.reduce((sum, c) => sum + c, 0);
    const avg = (total / history.length).toFixed(1);
    const best = Math.max(...counts);
    return { maxCount: max, avgCount: avg, bestDayCount: best, total7Days: total };
  }, [history, goal]);

  // D3 Scales and Curves
  const { pathD, areaD, points, goalY } = useMemo(() => {
    if (!history.length) return { pathD: '', areaD: '', points: [], goalY: 0 };

    // X Scale: 7 evenly spaced horizontal positions
    const xScale = d3
      .scalePoint<number>()
      .domain(history.map((_, i) => i))
      .range([0, innerWidth]);

    // Y Scale: 0 to maxCount
    const yScale = d3
      .scaleLinear()
      .domain([0, maxCount])
      .range([innerHeight, 0])
      .nice();

    // D3 Line Generator with smooth monotone curve
    const lineGenerator = d3
      .line<{ count: number; index: number }>()
      .x((d) => xScale(d.index) ?? 0)
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // D3 Area Generator for gradient fill underneath
    const areaGenerator = d3
      .area<{ count: number; index: number }>()
      .x((d) => xScale(d.index) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const indexedData = history.map((d, index) => ({ ...d, index }));
    const pD = lineGenerator(indexedData) || '';
    const aD = areaGenerator(indexedData) || '';

    const pts = history.map((d, index) => ({
      ...d,
      x: (xScale(index) ?? 0) + margin.left,
      y: yScale(d.count) + margin.top,
      label: isUrdu ? d.dayLabelUrdu : d.dayLabel,
    }));

    const gY = yScale(goal) + margin.top;

    return { pathD: pD, areaD: aD, points: pts, goalY: gY };
  }, [history, goal, maxCount, innerWidth, innerHeight, margin.left, margin.top, isUrdu]);

  const activeHoverItem = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="w-full bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 transition-all">
      {/* Sparkline Header with Mini Stats */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.dailyGoal.activityTrend}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
            {t.dailyGoal.avgPerDay.replace('{avg}', avgCount)}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
            <Award className="w-3 h-3 text-amber-500" />
            <span>{isUrdu ? `بہترین: ${bestDayCount}` : `Peak: ${bestDayCount}`}</span>
          </span>
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer shadow-2xs active:scale-95"
              title={t.dailyGoal.exportCsvTooltip}
            >
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{isUrdu ? 'سی ایس وی' : 'CSV'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="7-day tool usage sparkline chart"
        >
          <defs>
            {/* Area Fill Gradient */}
            <linearGradient id="sparklineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Line Stroke Gradient */}
            <linearGradient id="sparklineLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Subtle drop shadow for data point handles */}
            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Horizontal Grid Baseline */}
            <line
              x1="0"
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
            />

            {/* Target Daily Goal Reference Line */}
            {goalY >= margin.top && goalY <= margin.top + innerHeight && (
              <g>
                <line
                  x1="0"
                  y1={goalY - margin.top}
                  x2={innerWidth}
                  y2={goalY - margin.top}
                  stroke="#6366f1"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.55"
                />
                <text
                  x={innerWidth}
                  y={goalY - margin.top - 3}
                  textAnchor="end"
                  className="fill-indigo-500/80 text-[8px] font-mono font-bold tracking-wider"
                >
                  {t.dailyGoal.dailyTargetLine} ({goal})
                </text>
              </g>
            )}

            {/* Filled Area */}
            {areaD && (
              <path
                d={areaD}
                fill="url(#sparklineAreaGrad)"
                className="transition-all duration-300"
              />
            )}

            {/* Sparkline Path Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#sparklineLineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}
          </g>

          {/* Interactive Data Points & Day Labels */}
          {points.map((pt, index) => {
            const isHovered = hoveredIndex === index;
            const reached = pt.count >= goal;

            return (
              <g key={pt.date} className="cursor-pointer group">
                {/* Vertical hover guideline */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={margin.top}
                    x2={pt.x}
                    y2={margin.top + innerHeight}
                    stroke="currentColor"
                    className="text-indigo-400 dark:text-indigo-500"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Day of Week Label */}
                <text
                  x={pt.x}
                  y={height - 2}
                  textAnchor="middle"
                  className={`text-[9px] font-mono transition-colors font-medium ${
                    pt.isToday
                      ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                      : isHovered
                      ? 'fill-slate-900 dark:fill-white font-semibold'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {pt.label}
                </text>

                {/* Outer Glow Ring for Today or Hovered */}
                {(pt.isToday || isHovered) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 8 : 6}
                    fill={reached ? '#10b981' : '#6366f1'}
                    opacity={isHovered ? 0.25 : 0.15}
                    className="animate-pulse"
                  />
                )}

                {/* Main Data Point Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : pt.isToday ? 4.5 : 3.5}
                  fill={reached ? '#10b981' : '#6366f1'}
                  stroke="white"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  filter="url(#pointShadow)"
                  className="transition-all duration-150 dark:stroke-slate-900"
                />

                {/* Invisible larger hit target for smooth mouse/touch interaction */}
                <rect
                  x={pt.x - 16}
                  y={0}
                  width={32}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(index)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovering over a sparkline node */}
        {activeHoverItem && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -top-1 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-950 text-white shadow-lg border border-slate-700/80 text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${(activeHoverItem.x / width) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span>{activeHoverItem.label}</span>
              <span className="text-slate-400 font-normal">({activeHoverItem.date})</span>
              {activeHoverItem.isToday && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-semibold uppercase">
                  {isUrdu ? 'آج' : 'Today'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-amber-300">
                {t.dailyGoal.toolsUsedDay.replace('{count}', String(activeHoverItem.count))}
              </span>
              {activeHoverItem.reachedGoal ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isUrdu ? 'ہدف مکمل' : 'Goal met'}</span>
                </span>
              ) : (
                <span className="text-slate-400">
                  {isUrdu
                    ? `${goal - activeHoverItem.count} باقی`
                    : `${goal - activeHoverItem.count} to goal`}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Legend / Note */}
      <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{isUrdu ? 'ہدف حاصل ہوا' : 'Goal Met'}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            <span>{isUrdu ? 'جاری سرگرمی' : 'Active Progress'}</span>
          </span>
        </div>

        <span>
          {isUrdu
            ? `7 دنوں کا مجموعہ: ${total7Days} ٹولز`
            : `7-Day Total: ${total7Days} tools`}
        </span>
      </div>
    </div>
  );
};
