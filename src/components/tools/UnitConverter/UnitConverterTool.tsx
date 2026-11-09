import React, { useState, useMemo } from 'react';
import { UNIT_CATEGORIES, UnitCategory, convertUnit } from '../../../utils/unitConversions';
import { useLanguage } from '../../../context/LanguageContext';
import { Scale, ArrowRightLeft, Copy, CheckCircle, RotateCcw } from 'lucide-react';

export const UnitConverterTool: React.FC = () => {
  const { t } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [copied, setCopied] = useState(false);

  // When active category changes, update default units
  const currentCategoryUnits = UNIT_CATEGORIES[activeCategory].units;

  const handleCategoryChange = (cat: UnitCategory) => {
    setActiveCategory(cat);
    const keys = Object.keys(UNIT_CATEGORIES[cat].units);
    setFromUnit(keys[0] || '');
    setToUnit(keys[1] || keys[0] || '');
  };

  const convertedResult = useMemo(() => {
    return convertUnit(activeCategory, fromUnit, toUnit, inputValue);
  }, [activeCategory, fromUnit, toUnit, inputValue]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const handleCopy = () => {
    const text = `${inputValue} ${currentCategoryUnits[fromUnit]?.symbol || fromUnit} = ${convertedResult} ${currentCategoryUnits[toUnit]?.symbol || toUnit}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Scale className="w-4 h-4" />
            <span>Multi-Metric Scientific Conversion</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Universal Unit Converter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Convert length, weight, temperature, area, volume, speed, and digital data storage units with precision.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInputValue(1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Value</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(UNIT_CATEGORIES) as UnitCategory[]).map((catKey) => (
          <button
            key={catKey}
            type="button"
            onClick={() => handleCategoryChange(catKey)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === catKey
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {UNIT_CATEGORIES[catKey].name}
          </button>
        ))}
      </div>

      {/* Conversion Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* From Input (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              From ({currentCategoryUnits[fromUnit]?.name || fromUnit})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-36 px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {Object.values(currentCategoryUnits).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button (1 col) */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              type="button"
              onClick={swapUnits}
              title="Swap units"
              aria-label="Swap source and target units"
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* To Output (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              To ({currentCategoryUnits[toUnit]?.name || toUnit})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={Number(convertedResult.toFixed(6)).toString()}
                className="flex-1 px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 select-all"
              />
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-36 px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {Object.values(currentCategoryUnits).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Copy Result Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-600 dark:text-slate-400 font-mono">
            {inputValue} {currentCategoryUnits[fromUnit]?.symbol} ={' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {Number(convertedResult.toFixed(6)).toString()} {currentCategoryUnits[toUnit]?.symbol}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Result'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
