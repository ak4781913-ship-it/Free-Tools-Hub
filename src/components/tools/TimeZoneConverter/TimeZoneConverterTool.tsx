import React, { useState, useMemo, useEffect } from 'react';
import { TIMEZONE_LIST, formatTimeInZone, TimezoneItem } from '../../../utils/timezoneData';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Clock,
  ArrowRightLeft,
  Calendar,
  Globe,
  Copy,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Briefcase,
} from 'lucide-react';

export const TimeZoneConverterTool: React.FC = () => {
  const { t } = useLanguage();

  // Selected date and time
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const [selectedTimeStr, setSelectedTimeStr] = useState<string>('14:30'); // 2:30 PM

  // From and To timezones
  const [fromTzId, setFromTzId] = useState<string>('America/New_York');
  const [toTzId, setToTzId] = useState<string>('Asia/Dubai');

  const [copied, setCopied] = useState<boolean>(false);

  // Set to current device time
  const handleSetToCurrent = () => {
    const now = new Date();
    setSelectedDateStr(now.toISOString().split('T')[0]);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setSelectedTimeStr(`${hh}:${mm}`);
  };

  // Construct absolute UTC reference date from fromTzId input
  // We can determine the exact UTC millisecond timestamp corresponding to the user's selected local time in fromTzId:
  const baseDate = useMemo(() => {
    const fallbackNow = new Date();
    const dateParts = selectedDateStr ? selectedDateStr.split('-').map(Number) : [];
    const year = Number.isFinite(dateParts[0]) && dateParts[0] > 0 ? dateParts[0] : fallbackNow.getUTCFullYear();
    const month = Number.isFinite(dateParts[1]) && dateParts[1] >= 1 && dateParts[1] <= 12 ? dateParts[1] : fallbackNow.getUTCMonth() + 1;
    const day = Number.isFinite(dateParts[2]) && dateParts[2] >= 1 && dateParts[2] <= 31 ? dateParts[2] : fallbackNow.getUTCDate();

    const timeParts = selectedTimeStr ? selectedTimeStr.split(':').map(Number) : [];
    const hours = Number.isFinite(timeParts[0]) ? Math.min(23, Math.max(0, timeParts[0])) : 0;
    const minutes = Number.isFinite(timeParts[1]) ? Math.min(59, Math.max(0, timeParts[1])) : 0;

    // Initial naive UTC Date
    const naiveDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    // Refine offset using Intl format parts in fromTzId
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: fromTzId,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).formatToParts(naiveDate);

      const partY = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
      const partM = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
      const partD = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
      let partH = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      if (partH === 24) partH = 0;
      const partMin = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

      const zonedTime = Date.UTC(partY, partM - 1, partD, partH, partMin);
      const diff = zonedTime - naiveDate.getTime();

      // The accurate UTC epoch is naiveDate - diff
      return new Date(naiveDate.getTime() - diff);
    } catch {
      return naiveDate;
    }
  }, [selectedDateStr, selectedTimeStr, fromTzId]);

  // Formatted source & destination details
  const fromDetails = useMemo(() => formatTimeInZone(baseDate, fromTzId), [baseDate, fromTzId]);
  const toDetails = useMemo(() => formatTimeInZone(baseDate, toTzId), [baseDate, toTzId]);

  const fromInfo = TIMEZONE_LIST.find((tz) => tz.id === fromTzId) || {
    id: fromTzId,
    city: fromTzId,
    country: '',
    flag: '🌐',
    utcOffsetDisplay: '',
  };

  const toInfo = TIMEZONE_LIST.find((tz) => tz.id === toTzId) || {
    id: toTzId,
    city: toTzId,
    country: '',
    flag: '🌐',
    utcOffsetDisplay: '',
  };

  // Swap timezones
  const handleSwap = () => {
    setFromTzId(toTzId);
    setToTzId(fromTzId);
  };

  const handleCopySummary = () => {
    const text = `--- TIME ZONE CONVERSION ---
Origin: ${fromInfo.flag} ${fromInfo.city} (${fromDetails.timeZoneAbbr})
Time: ${fromDetails.time12} (${fromDetails.time24}) · ${fromDetails.dayOfWeek}, ${fromDetails.dateString}

Destination: ${toInfo.flag} ${toInfo.city} (${toDetails.timeZoneAbbr})
Time: ${toDetails.time12} (${toDetails.time24}) · ${toDetails.dayOfWeek}, ${toDetails.dateString}
Converted on FreeTools Hub (${typeof window !== 'undefined' ? window.location.origin : ''}/tools/timezone-converter)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick compare list of major international business hubs
  const matrixZones = [
    'America/New_York',
    'Europe/London',
    'Asia/Dubai',
    'Asia/Riyadh',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Clock className="w-4 h-4" />
            <span>Global Meeting & Timezone Converter</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Time Zone Converter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Convert date and time across 35+ international time zones with daylight saving adjustments and business hour indicators.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSetToCurrent}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Set to Current Time</span>
        </button>
      </div>

      {/* Main Conversion Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        {/* Date and Time Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Time (24h or AM/PM)
            </label>
            <input
              type="time"
              value={selectedTimeStr}
              onChange={(e) => setSelectedTimeStr(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timezone Selectors & Swap */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* From Timezone (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Origin Time Zone (From)
            </label>
            <div className="relative">
              <select
                value={fromTzId}
                onChange={(e) => setFromTzId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                {TIMEZONE_LIST.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.flag} {tz.city} — {tz.utcOffsetDisplay}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Swap Button (1 col) */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap timezones"
              aria-label="Swap source and target time zones"
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-transform active:scale-95 shadow-2xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* To Timezone (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Target Time Zone (To)
            </label>
            <div className="relative">
              <select
                value={toTzId}
                onChange={(e) => setToTzId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                {TIMEZONE_LIST.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.flag} {tz.city} — {tz.utcOffsetDisplay}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Converted Output Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Origin Card */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{fromInfo.flag}</span>
                <span>{fromInfo.city}</span>
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                {fromDetails.timeZoneAbbr} ({fromInfo.utcOffsetDisplay})
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {fromDetails.time12}
              </div>
              <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                24h: {fromDetails.time24} · {fromDetails.dayOfWeek}, {fromDetails.dateString}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {fromDetails.isBusinessHours ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Briefcase className="w-3.5 h-3.5" /> Business Working Hours
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                  <Moon className="w-3.5 h-3.5" /> Outside Normal Work Hours
                </span>
              )}
            </div>
          </div>

          {/* Converted Target Card */}
          <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-800/60">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <span>{toInfo.flag}</span>
                <span>{toInfo.city}</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {toDetails.timeZoneAbbr} ({toInfo.utcOffsetDisplay})
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                {toDetails.time12}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5 block">
                24h: {toDetails.time24} · {toDetails.dayOfWeek}, {toDetails.dateString}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {toDetails.isBusinessHours ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Briefcase className="w-3.5 h-3.5" /> Ideal Business Meeting Window
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Moon className="w-3.5 h-3.5" /> Non-Business / Sleeping Hours
                </span>
              )}

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 24-Hour Interactive Timeline Slider for Meeting Coordination */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Interactive 24-Hour Slider (Drag to align meeting hours)
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              {fromDetails.time24} {fromInfo.city} = {toDetails.time24} {toInfo.city}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="23"
            value={Number.isFinite(parseInt(selectedTimeStr.split(':')[0], 10)) ? parseInt(selectedTimeStr.split(':')[0], 10) : 0}
            onChange={(e) => {
              const h = String(e.target.value).padStart(2, '0');
              const m = selectedTimeStr.split(':')[1] || '00';
              setSelectedTimeStr(`${h}:${m}`);
            }}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>12 AM (Midnight)</span>
            <span>6 AM</span>
            <span>12 PM (Noon)</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>
      </div>

      {/* Multi-City Global World Clock Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Simultaneous World Clock Overview
            </h3>
            <p className="text-xs text-slate-500">
              Corresponding time at this exact moment across major business hubs:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {matrixZones.map((zId) => {
            const zInfo = TIMEZONE_LIST.find((t) => t.id === zId);
            if (!zInfo) return null;
            const details = formatTimeInZone(baseDate, zId);

            return (
              <div
                key={zId}
                onClick={() => setToTzId(zId)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors space-y-1 ${
                  toTzId === zId
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {zInfo.flag} {zInfo.city}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {details.timeZoneAbbr}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {details.time12}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{details.dateString}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
