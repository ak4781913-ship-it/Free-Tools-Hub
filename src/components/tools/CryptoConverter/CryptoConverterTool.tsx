import React, { useState, useEffect, useMemo } from 'react';
import {
  SUPPORTED_CRYPTOS,
  SUPPORTED_FIATS,
  fetchLiveCryptoPrices,
  convertCryptoOrFiat,
  CryptoPriceData,
  CryptoAsset,
  FiatAsset,
  BASELINE_CRYPTO_USD,
  BASELINE_FIAT_RATES_USD,
} from '../../../utils/cryptoData';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ArrowRightLeft,
  RefreshCw,
  Copy,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Sparkles,
  Zap,
  Globe,
  Coins,
  DollarSign,
  ShieldCheck,
  Calculator,
} from 'lucide-react';

export const CryptoConverterTool: React.FC = () => {
  const { language } = useLanguage();

  // Selected state
  const [amount, setAmount] = useState<number>(1);
  const [fromAssetId, setFromAssetId] = useState<string>('bitcoin'); // bitcoin ID or USD code
  const [toAssetId, setToAssetId] = useState<string>('USD');

  // Market prices state
  const [priceData, setPriceData] = useState<CryptoPriceData>({
    pricesUSD: Object.fromEntries(
      Object.entries(BASELINE_CRYPTO_USD).map(([k, v]) => [k, v.price])
    ),
    changes24h: Object.fromEntries(
      Object.entries(BASELINE_CRYPTO_USD).map(([k, v]) => [k, v.change24h])
    ),
    fiatRatesUSD: BASELINE_FIAT_RATES_USD,
    lastUpdated: new Date().toLocaleTimeString(),
    isLive: false,
    source: 'Loading market feed...',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Search filter for dropdowns
  const [fromSearch, setFromSearch] = useState<string>('');
  const [toSearch, setToSearch] = useState<string>('');
  const [fromFilterTab, setFromFilterTab] = useState<'all' | 'crypto' | 'fiat'>('all');
  const [toFilterTab, setToFilterTab] = useState<'all' | 'crypto' | 'fiat'>('all');

  // Load live prices
  const loadPrices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveCryptoPrices();
      setPriceData(data);
    } catch {
      // handled internally with baseline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  // Compute conversion
  const conversion = useMemo(() => {
    return convertCryptoOrFiat(
      amount,
      fromAssetId,
      toAssetId,
      priceData.pricesUSD,
      priceData.fiatRatesUSD
    );
  }, [amount, fromAssetId, toAssetId, priceData.pricesUSD, priceData.fiatRatesUSD]);

  // Asset helper functions
  const getAssetDetails = (id: string): {
    name: string;
    symbol: string;
    isCrypto: boolean;
    color?: string;
    iconBg?: string;
    flag?: string;
    decimals: number;
    priceUSD?: number;
    change24h?: number;
  } => {
    const crypto = SUPPORTED_CRYPTOS.find((c) => c.id === id);
    if (crypto) {
      return {
        name: language === 'ur' ? crypto.nameUrdu : crypto.name,
        symbol: crypto.symbol,
        isCrypto: true,
        color: crypto.color,
        iconBg: crypto.iconBg,
        decimals: crypto.decimals,
        priceUSD: priceData.pricesUSD[crypto.id],
        change24h: priceData.changes24h[crypto.id],
      };
    }
    const fiat = SUPPORTED_FIATS.find((f) => f.code === id);
    if (fiat) {
      return {
        name: language === 'ur' ? fiat.nameUrdu : fiat.name,
        symbol: fiat.code,
        isCrypto: false,
        flag: fiat.flag,
        decimals: 2,
        priceUSD: 1 / (priceData.fiatRatesUSD[fiat.code] || 1),
      };
    }
    return {
      name: id,
      symbol: id,
      isCrypto: false,
      decimals: 2,
    };
  };

  const fromInfo = getAssetDetails(fromAssetId);
  const toInfo = getAssetDetails(toAssetId);

  // Swap From and To
  const handleSwap = () => {
    const temp = fromAssetId;
    setFromAssetId(toAssetId);
    setToAssetId(temp);
  };

  // Copy result
  const handleCopy = () => {
    const fromSymbol = fromInfo.symbol;
    const toSymbol = toInfo.symbol;
    const formattedResult = formatAssetValue(conversion.result, toInfo.decimals);
    const summary = `${amount.toLocaleString()} ${fromSymbol} = ${formattedResult} ${toSymbol} (1 ${fromSymbol} ≈ ${formatAssetValue(
      conversion.unitRate,
      toInfo.decimals
    )} ${toSymbol})`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format asset values with smart decimals
  const formatAssetValue = (val: number, maxDecimals = 4): string => {
    if (val === 0) return '0.00';
    if (val < 0.000001) return val.toExponential(4);
    if (val < 0.01) {
      return val.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: Math.min(maxDecimals, 8),
      });
    }
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });
  };

  // Quick preset amounts
  const cryptoPresets = [0.01, 0.1, 0.5, 1, 5, 10];
  const fiatPresets = [50, 100, 500, 1000, 5000, 10000];
  const activePresets = fromInfo.isCrypto ? cryptoPresets : fiatPresets;

  // Filtered lists for selector
  const filterAssets = (search: string, tab: 'all' | 'crypto' | 'fiat') => {
    const q = search.toLowerCase().trim();
    let cryptos = SUPPORTED_CRYPTOS;
    let fiats = SUPPORTED_FIATS;

    if (q) {
      cryptos = cryptos.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.nameUrdu.includes(q)
      );
      fiats = fiats.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.nameUrdu.includes(q)
      );
    }

    return {
      cryptos: tab === 'fiat' ? [] : cryptos,
      fiats: tab === 'crypto' ? [] : fiats,
    };
  };

  const fromFiltered = filterAssets(fromSearch, fromFilterTab);
  const toFiltered = filterAssets(toSearch, toFilterTab);

  // Popular cryptos summary card list
  const popularCryptos = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Coins className="w-3.5 h-3.5" />
                Live Crypto & Forex
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  priceData.isLive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    priceData.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {priceData.isLive ? 'Market Feed Online' : 'Standard Baseline'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === 'ur' ? 'کرپٹو کرنسی کنورٹر' : 'Cryptocurrency & Fiat Converter'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {language === 'ur'
                ? 'بٹ کوائن، ایتھیریم، سولانا اور دیگر بڑی کرپٹو کرنسیوں کا امریکی ڈالر، درہم اور عالمی کرنسیوں میں تبادلہ۔'
                : 'Convert instantly between Bitcoin, Ethereum, Solana, and major global fiat currencies with real-time exchange rates.'}
            </p>
          </div>

          {/* Refresh & Last Updated */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Updated</p>
              <p className="text-xs font-medium font-mono text-slate-600 dark:text-slate-300">
                {priceData.lastUpdated}
              </p>
            </div>
            <button
              onClick={loadPrices}
              disabled={isLoading}
              title="Refresh live prices"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Converter Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {language === 'ur' ? 'رقم درج کریں' : 'Amount to Convert'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmount(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full pl-4 pr-24 py-3.5 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/80 px-2.5 py-1 rounded-md">
                    {fromInfo.symbol}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] text-slate-400 mr-1">Quick:</span>
                {activePresets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      amount === val
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {`${val.toLocaleString()} ${fromInfo.symbol}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Selectors with Swap */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center mb-6">
              {/* From Asset */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'ur' ? 'سے (تبدیل کریں)' : 'From'}
                  </span>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      onClick={() => setFromFilterTab('all')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        fromFilterTab === 'all'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFromFilterTab('crypto')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        fromFilterTab === 'crypto'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      Crypto
                    </button>
                    <button
                      onClick={() => setFromFilterTab('fiat')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        fromFilterTab === 'fiat'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      Fiat
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={fromSearch}
                    onChange={(e) => setFromSearch(e.target.value)}
                    placeholder="Search coin or currency..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={fromAssetId}
                  onChange={(e) => setFromAssetId(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {fromFiltered.cryptos.length > 0 && (
                    <optgroup label="Cryptocurrencies">
                      {fromFiltered.cryptos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.symbol} – {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {fromFiltered.fiats.length > 0 && (
                    <optgroup label="Fiat Currencies">
                      {fromFiltered.fiats.map((f) => (
                        <option key={f.code} value={f.code}>
                          {f.code} ({f.flag}) – {f.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap currencies"
                  aria-label="Swap source and target assets"
                  className="p-3 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 hover:rotate-180 transition-all duration-300 border border-indigo-200 dark:border-slate-700 shadow-sm"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To Asset */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'ur' ? 'تک (حاصل کریں)' : 'To'}
                  </span>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      onClick={() => setToFilterTab('all')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        toFilterTab === 'all'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setToFilterTab('crypto')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        toFilterTab === 'crypto'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      Crypto
                    </button>
                    <button
                      onClick={() => setToFilterTab('fiat')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        toFilterTab === 'fiat'
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      Fiat
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={toSearch}
                    onChange={(e) => setToSearch(e.target.value)}
                    placeholder="Search coin or currency..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={toAssetId}
                  onChange={(e) => setToAssetId(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {toFiltered.fiats.length > 0 && (
                    <optgroup label="Fiat Currencies">
                      {toFiltered.fiats.map((f) => (
                        <option key={f.code} value={f.code}>
                          {f.code} ({f.flag}) – {f.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {toFiltered.cryptos.length > 0 && (
                    <optgroup label="Cryptocurrencies">
                      {toFiltered.cryptos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.symbol} – {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Conversion Result Hero Display */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-amber-50/40 dark:from-indigo-950/20 dark:via-slate-800/50 dark:to-amber-950/20 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700/80">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {amount.toLocaleString()} {fromInfo.name} ({fromInfo.symbol}) =
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-md border border-indigo-200 dark:border-slate-700 hover:bg-indigo-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>
              </div>

              {/* Big Result Number */}
              <div className="flex flex-wrap items-baseline gap-2 mb-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white break-all">
                  {formatAssetValue(conversion.result, toInfo.decimals)}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {toInfo.symbol}
                </span>
              </div>

              {/* Rate Breakdown */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/80 pt-3">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Rate:</span>
                  <span className="font-mono">
                    1 {fromInfo.symbol} = {formatAssetValue(conversion.unitRate, toInfo.decimals)}{' '}
                    {toInfo.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Inverse:</span>
                  <span className="font-mono">
                    1 {toInfo.symbol} = {formatAssetValue(conversion.inverseRate, fromInfo.decimals)}{' '}
                    {fromInfo.symbol}
                  </span>
                </div>
                {conversion.valueInUSD > 0 && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Value:</span>
                    <span className="font-mono font-medium">
                      ≈ ${conversion.valueInUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
                      USD
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Fiat Conversion Matrix for Selected Asset */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {fromInfo.name} ({fromInfo.symbol}) Across Global Currencies
                </h3>
                <p className="text-xs text-slate-500">
                  Instant comparative rates for {amount} {fromInfo.symbol}
                </p>
              </div>
              <Globe className="w-5 h-5 text-indigo-500" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'PKR', 'JPY'].map((fiatCode) => {
                const res = convertCryptoOrFiat(
                  amount,
                  fromAssetId,
                  fiatCode,
                  priceData.pricesUSD,
                  priceData.fiatRatesUSD
                );
                const fItem = SUPPORTED_FIATS.find((f) => f.code === fiatCode);

                return (
                  <div
                    key={fiatCode}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {fItem?.flag} {fiatCode}
                      </span>
                      <span className="text-[10px] font-mono">{fItem?.symbol}</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                      {formatAssetValue(res.result, 2)}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      1 {fromInfo.symbol} = {formatAssetValue(res.unitRate, 2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Market Overview & Popular Cryptos */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Cryptos Quick Prices */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Major Cryptocurrencies
              </h3>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-2.5">
              {popularCryptos.map((cId) => {
                const crypto = SUPPORTED_CRYPTOS.find((c) => c.id === cId);
                if (!crypto) return null;
                const price = priceData.pricesUSD[crypto.id] || 0;
                const change = priceData.changes24h[crypto.id] || 0;
                const isPositive = change >= 0;

                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => {
                      setFromAssetId(crypto.id);
                      setToAssetId('USD');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border border-slate-100 dark:border-slate-800/80 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${crypto.iconBg}`}
                      >
                        {crypto.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {crypto.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {crypto.symbol}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`flex items-center justify-end text-[10px] font-semibold font-mono ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                        )}
                        {isPositive ? '+' : ''}
                        {change.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crypto Investment / Cost Estimator Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Dollar-Cost Averaging Tip
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              At today’s price of{' '}
              <span className="font-bold text-amber-400">
                ${(priceData.pricesUSD['bitcoin'] || 68000).toLocaleString()} USD
              </span>
              , investing <span className="font-bold text-white">$100 USD</span> monthly gets you
              approximately{' '}
              <span className="font-mono text-white font-semibold">
                {(100 / (priceData.pricesUSD['bitcoin'] || 68000)).toFixed(6)} BTC
              </span>{' '}
              per allocation.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calculated with zero hidden broker markups</span>
            </div>
          </div>

          {/* Informational Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Market Rate Information
            </span>
            Cryptocurrency exchange rates are derived from global aggregated liquidity feeds. Actual
            execution prices on individual exchanges (e.g. Binance, Coinbase, Kraken) or P2P
            marketplaces may differ due to local order books, network gas fees, and spread.
          </div>
        </div>
      </div>
    </div>
  );
};
