import React, { useState } from 'react';
import { calculateDiscount } from '../../../utils/dateCalculations';
import { useLanguage } from '../../../context/LanguageContext';
import { Percent, Tag, TrendingUp, RotateCcw } from 'lucide-react';

export const PercentageCalculatorTool: React.FC = () => {
  const { t } = useLanguage();

  // Mode 1: What is X% of Y?
  const [valPercent, setValPercent] = useState<number>(20);
  const [valBase, setValBase] = useState<number>(150);

  // Mode 2: % change from A to B
  const [changeFrom, setChangeFrom] = useState<number>(80);
  const [changeTo, setChangeTo] = useState<number>(120);

  // Mode 3: Retail discount
  const [originalPrice, setOriginalPrice] = useState<number>(250);
  const [discountPercent, setDiscountPercent] = useState<number>(30);

  // Calculations
  const partResult = +((valPercent / 100) * valBase).toFixed(2);

  const percentChange =
    changeFrom !== 0
      ? +(((changeTo - changeFrom) / Math.abs(changeFrom)) * 100).toFixed(2)
      : 0;

  const discountResult = calculateDiscount(originalPrice, discountPercent);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Percent className="w-4 h-4" />
            <span>Financial & Mathematical Utilities</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Percentage & Discount Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compute percentage portions, growth/decline rates, and retail sales price discounts with total savings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setValPercent(20);
            setValBase(150);
            setChangeFrom(80);
            setChangeTo(120);
            setOriginalPrice(250);
            setDiscountPercent(30);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: X% of Y */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Percent className="w-4 h-4" />
              <span>Percentage of a Value</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">What is (%)</label>
                <input
                  type="number"
                  value={valPercent}
                  onChange={(e) => setValPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Of number</label>
                <input
                  type="number"
                  value={valBase}
                  onChange={(e) => setValBase(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Result</span>
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {partResult}
            </span>
          </div>
        </div>

        {/* Module 2: Percentage Change */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
              <span>Percentage Growth / Decline</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Initial Value (From)</label>
                <input
                  type="number"
                  value={changeFrom}
                  onChange={(e) => setChangeFrom(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Final Value (To)</label>
                <input
                  type="number"
                  value={changeTo}
                  onChange={(e) => setChangeTo(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Percentage Change</span>
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                percentChange >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`}
            </span>
          </div>
        </div>

        {/* Module 3: Retail Discount Calculator */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Tag className="w-4 h-4" />
              <span>Retail Sale Discount</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Original Price ($ / AED)</label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Discount Off (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) =>
                    setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-center">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">You Save:</span>
              <span className="font-bold text-emerald-600 font-mono">
                ${discountResult.discountAmount}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-900 dark:text-white">Final Price:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                ${discountResult.finalPrice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
