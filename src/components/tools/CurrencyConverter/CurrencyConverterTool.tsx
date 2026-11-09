import React, { useState, useEffect, useMemo } from 'react';
import {
  MAJOR_CURRENCIES,
  BASELINE_RATES_USD,
  fetchLiveExchangeRates,
  convertCurrency,
  ExchangeRatesData,
} from '../../../utils/currencyData';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Coins,
  ArrowRightLeft,
  RefreshCw,
  Copy,
  CheckCircle,
  TrendingUp,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';

export const CurrencyConverterTool: React.FC = () => {
  const { t } = useLanguage();

  const [amount, setAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('AED');
  const [spreadPercent, setSpreadPercent] = useState<number>(0); // 0% mid-market, 1.5% bank, 3% airport

  // Rate state
  const [ratesData, setRatesData] = useState<ExchangeRatesData>({
    base: 'USD',
    rates: BASELINE_RATES_USD,
    lastUpdated: new Date().toUTCString(),
    isLive: false,
    source: 'Loading initial market rates...',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch rates on mount
  const loadRates = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveExchangeRates();
      setRatesData(data);
    } catch {
      // fallback handled inside fetcher
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  // Compute conversion
  const conversion = useMemo(() => {
    return convertCurrency(amount, fromCurrency, toCurrency, ratesData.rates);
  }, [amount, fromCurrency, toCurrency, ratesData.rates]);

  // Adjust for fee / spread
  const adjustedResult = useMemo(() => {
    if (spreadPercent === 0) return conversion.result;
    return conversion.result * (1 - spreadPercent / 100);
  }, [conversion.result, spreadPercent]);

  const feeAmount = conversion.result - adjustedResult;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleCopy = () => {
    const text = `${amount.toLocaleString()} ${fromCurrency} = ${adjustedResult.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} ${toCurrency} (1 ${fromCurrency} = ${conversion.rate.toFixed(4)} ${toCurrency})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fromInfo = MAJOR_CURRENCIES.find((c) => c.code === fromCurrency) || {
    code: fromCurrency,
    name: fromCurrency,
    symbol: fromCurrency,
    flag: '🌐',
  };

  const toInfo = MAJOR_CURRENCIES.find((c) => c.code === toCurrency) || {
    code: toCurrency,
    name: toCurrency,
    symbol: toCurrency,
    flag: '🌐',
  };

  // Quick compare list
  const matrixCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'PKR', 'CAD', 'JPY'];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Coins className="w-4 h-4" />
            <span>Real-Time Foreign Exchange Rates</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Currency Converter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Convert between major world currencies with real-time mid-market exchange rates and banking spread estimation.
          </p>
        </div>

        {/* Live sync status & refresh button */}
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            <span className="block font-medium text-slate-700 dark:text-slate-300">
              {ratesData.source}
            </span>
            <span className="font-mono text-[10px]">
              {ratesData.isLive ? 'Live Sync' : 'Offline Baseline'}
            </span>
          </div>

          <button
            type="button"
            onClick={loadRates}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Refresh Rates'}</span>
          </button>
        </div>
      </div>

      {/* Main Conversion Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        {/* Amount Input & Fast Preset Chips */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Transfer / Conversion Amount
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {fromInfo.symbol} {fromInfo.code}
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={amount || ''}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="1,000"
              className="w-full px-4 py-3.5 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick amount chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] text-slate-400 mr-1">Quick Select:</span>
            {[50, 100, 500, 1000, 5000, 10000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                  amount === val
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selectors & Swap Control */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* From Currency (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              From Currency (Base)
            </label>
            <div className="relative">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full pl-3 pr-8 py-3 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
              >
                {MAJOR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Swap Button (1 col) */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap currencies"
              aria-label="Swap source and target currencies"
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-transform active:scale-95 shadow-2xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* To Currency (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              To Currency (Target)
            </label>
            <div className="relative">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full pl-3 pr-8 py-3 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
              >
                {MAJOR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Big Converted Output Card */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">
                {amount.toLocaleString()} {fromInfo.name} equals
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
                {adjustedResult.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 font-sans">
                  {toInfo.code}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 shadow-2xs self-start sm:self-auto"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Result'}</span>
            </button>
          </div>

          {/* Clean Unboxed Exchange Rate Telemetry */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3 font-mono">
              <span>
                1 {fromCurrency} ={' '}
                <strong className="text-slate-900 dark:text-white">
                  {conversion.rate.toFixed(4)}
                </strong>{' '}
                {toCurrency}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>
                1 {toCurrency} ={' '}
                <strong className="text-slate-900 dark:text-white">
                  {conversion.inverseRate.toFixed(4)}
                </strong>{' '}
                {fromCurrency}
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              {ratesData.isLive ? 'Live Mid-Market Rate' : 'Baseline Reference Rate (Offline Fallback)'}
            </div>
          </div>
        </div>

        {/* Banking Spread & Fee Estimator */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Exchange Fee & Banking Spread Estimator</span>
            </span>
            {spreadPercent > 0 && (
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                Estimated Bank Fee: ~{feeAmount.toFixed(2)} {toCurrency}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: 'Mid-Market (0% Markup)', val: 0, sub: 'Real Interbank Rate' },
              { label: 'Standard Bank (1.5% Spread)', val: 1.5, sub: 'Typical Wire / Transfer' },
              { label: 'Airport / Card (3.0% Spread)', val: 3.0, sub: 'Credit Card / Bureau' },
            ].map((tier) => (
              <button
                key={tier.val}
                type="button"
                onClick={() => setSpreadPercent(tier.val)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  spreadPercent === tier.val
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-semibold">{tier.label}</div>
                <div className="text-[10.5px] text-slate-400">{tier.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Currency Quick Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Converted Equivalents Across Major Currencies
            </h3>
            <p className="text-xs text-slate-500">
              {amount.toLocaleString()} {fromCurrency} converted into popular global currencies at current mid-market rates:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {matrixCurrencies
            .filter((c) => c !== fromCurrency)
            .map((targetCode) => {
              const info = MAJOR_CURRENCIES.find((c) => c.code === targetCode) || {
                code: targetCode,
                name: targetCode,
                symbol: targetCode,
                flag: '🌐',
              };
              const conv = convertCurrency(amount, fromCurrency, targetCode, ratesData.rates);

              return (
                <div
                  key={targetCode}
                  onClick={() => setToCurrency(targetCode)}
                  className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {info.flag} {info.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      1={conv.rate.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {conv.result.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{info.name}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
