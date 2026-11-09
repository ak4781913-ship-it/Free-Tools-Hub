import React, { useState, useMemo } from 'react';
import { calculateDateDifference } from '../../../utils/dateCalculations';
import { useLanguage } from '../../../context/LanguageContext';
import { Clock, Calendar, CheckSquare, RotateCcw } from 'lucide-react';

export const DateDifferenceTool: React.FC = () => {
  const { t } = useLanguage();

  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [includeEndDate, setIncludeEndDate] = useState(true);

  const diff = useMemo(
    () => calculateDateDifference(startDate, endDate, includeEndDate),
    [startDate, endDate, includeEndDate]
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Clock className="w-4 h-4" />
            <span>Time Span & Working Days Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Date Difference Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculate the exact calendar days, working business days, weeks, and months between two dates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setStartDate('2025-01-01');
            setEndDate('2025-06-30');
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Dates</span>
        </button>
      </div>

      {/* Date Pickers */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeEndDate}
              onChange={(e) => setIncludeEndDate(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Include end date in calculation (+1 day)</span>
          </label>
          {startDate && endDate && endDate < startDate && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Note: End date precedes start date — showing absolute span between dates.
            </span>
          )}
        </div>
      </div>

      {diff ? (
        <div className="space-y-6">
          {/* Main output */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Calendar Duration
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {diff.totalDays} Days
            </div>
            <p className="text-xs text-slate-500">
              Equivalent to {diff.weeks} weeks · ~{diff.months} months · {diff.years} years
            </p>
          </div>

          {/* Business vs Weekend days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                Working Business Days (Mon - Fri)
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {diff.businessDays} Days
              </div>
              <p className="text-[11px] text-slate-400">Excludes standard Saturday and Sunday weekends.</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">
                Weekend Days
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {diff.weekendDays} Days
              </div>
              <p className="text-[11px] text-slate-400">Total non-working weekend days within period.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-center text-xs text-amber-800 dark:text-amber-300">
          Please select both a valid Start Date and End Date to calculate the calendar duration.
        </div>
      )}
    </div>
  );
};
