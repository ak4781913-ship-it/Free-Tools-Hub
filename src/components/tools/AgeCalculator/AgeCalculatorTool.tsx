import React, { useState, useMemo } from 'react';
import { calculateAge } from '../../../utils/dateCalculations';
import { useLanguage } from '../../../context/LanguageContext';
import { Calendar, Cake, Clock, RotateCcw } from 'lucide-react';

export const AgeCalculatorTool: React.FC = () => {
  const { t } = useLanguage();

  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);

  const result = useMemo(() => calculateAge(birthDate, targetDate), [birthDate, targetDate]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Chronological Life Metrics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Exact Age Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculate your exact age in years, months, days, total days lived, hours, and countdown to your next birthday.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBirthDate('2000-01-01');
            setTargetDate(new Date().toISOString().split('T')[0]);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Dates</span>
        </button>
      </div>

      {/* Date Pickers */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Calculate Age As Of (Target Date)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {result ? (
        <div className="space-y-6">
          {/* Prominent result card */}
          <div className="bg-indigo-600 text-white rounded-2xl p-6 sm:p-8 shadow-md text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
              Your Current Age
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono">
              {result.years} <span className="text-xl sm:text-2xl font-sans font-medium text-indigo-200">years</span>{' '}
              {result.months} <span className="text-xl sm:text-2xl font-sans font-medium text-indigo-200">months</span>{' '}
              {result.days} <span className="text-xl sm:text-2xl font-sans font-medium text-indigo-200">days</span>
            </div>
            <p className="text-xs text-indigo-100 pt-1">
              Born on a {result.dayOfWeekBorn}
            </p>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Days Lived</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {result.totalDays.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Weeks</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {result.totalWeeks.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Hours</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {result.totalHours.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <Cake className="w-3.5 h-3.5 text-pink-500" />
                <span>Next Birthday</span>
              </div>
              <span className="text-xl font-bold font-mono text-pink-600 dark:text-pink-400">
                {result.nextBirthdayDays} days
              </span>
              <span className="text-[10.5px] text-slate-400 block mt-0.5">({result.nextBirthdayDayOfWeek})</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-center text-xs text-amber-800">
          Please enter a valid birth date in the past.
        </div>
      )}
    </div>
  );
};
