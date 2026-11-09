export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  nameUrdu: string;
  coingeckoId: string;
  binanceSymbol?: string;
  color: string;
  iconBg: string;
  decimals: number;
}

export interface FiatAsset {
  code: string;
  name: string;
  nameUrdu: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CRYPTOS: CryptoAsset[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    nameUrdu: 'بٹ کوائن',
    coingeckoId: 'bitcoin',
    binanceSymbol: 'BTCUSDT',
    color: '#F7931A',
    iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    decimals: 8,
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    nameUrdu: 'ایتھیریم',
    coingeckoId: 'ethereum',
    binanceSymbol: 'ETHUSDT',
    color: '#627EEA',
    iconBg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    decimals: 6,
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    nameUrdu: 'سولانا',
    coingeckoId: 'solana',
    binanceSymbol: 'SOLUSDT',
    color: '#14F195',
    iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    decimals: 4,
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    nameUrdu: 'بی این بی',
    coingeckoId: 'binancecoin',
    binanceSymbol: 'BNBUSDT',
    color: '#F3BA2F',
    iconBg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    decimals: 4,
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    nameUrdu: 'ایکس آر پی',
    coingeckoId: 'ripple',
    binanceSymbol: 'XRPUSDT',
    color: '#23292F',
    iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    decimals: 4,
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    nameUrdu: 'کارڈانو',
    coingeckoId: 'cardano',
    binanceSymbol: 'ADAUSDT',
    color: '#0033AD',
    iconBg: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    decimals: 4,
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    nameUrdu: 'ڈوج کوائن',
    coingeckoId: 'dogecoin',
    binanceSymbol: 'DOGEUSDT',
    color: '#C2A633',
    iconBg: 'bg-amber-600/10 text-amber-600 border-amber-600/20',
    decimals: 2,
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    nameUrdu: 'ایوا لانچ',
    coingeckoId: 'avalanche-2',
    binanceSymbol: 'AVAXUSDT',
    color: '#E84142',
    iconBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    decimals: 4,
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    nameUrdu: 'پولکا ڈاٹ',
    coingeckoId: 'polkadot',
    binanceSymbol: 'DOTUSDT',
    color: '#E6007A',
    iconBg: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    decimals: 4,
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    nameUrdu: 'چین لنک',
    coingeckoId: 'chainlink',
    binanceSymbol: 'LINKUSDT',
    color: '#375BD2',
    iconBg: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    decimals: 4,
  },
  {
    id: 'litecoin',
    symbol: 'LTC',
    name: 'Litecoin',
    nameUrdu: 'لائٹ کوائن',
    coingeckoId: 'litecoin',
    binanceSymbol: 'LTCUSDT',
    color: '#345D9D',
    iconBg: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    decimals: 4,
  },
  {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    nameUrdu: 'یونی سویپ',
    coingeckoId: 'uniswap',
    binanceSymbol: 'UNIUSDT',
    color: '#FF007A',
    iconBg: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
    decimals: 4,
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether USD',
    nameUrdu: 'ٹیتھر',
    coingeckoId: 'tether',
    binanceSymbol: 'USDCUSDT',
    color: '#26A17B',
    iconBg: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    decimals: 2,
  },
];

export const SUPPORTED_FIATS: FiatAsset[] = [
  { code: 'USD', name: 'US Dollar', nameUrdu: 'امریکی ڈالر', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameUrdu: 'یورو', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', nameUrdu: 'برطانوی پاؤنڈ', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', nameUrdu: 'اماراتی درہم', symbol: 'AED', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', nameUrdu: 'سعودی ریال', symbol: 'SAR', flag: '🇸🇦' },
  { code: 'INR', name: 'Indian Rupee', nameUrdu: 'بھارتی روپیہ', symbol: '₹', flag: '🇮🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', nameUrdu: 'پاکستانی روپیہ', symbol: '₨', flag: '🇵🇰' },
  { code: 'JPY', name: 'Japanese Yen', nameUrdu: 'جاپانی ین', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', nameUrdu: 'کینیڈین ڈالر', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', nameUrdu: 'آسٹریلین ڈالر', symbol: 'AU$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', nameUrdu: 'سوئس فرانک', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', nameUrdu: 'چینی یوآن', symbol: '¥', flag: '🇨🇳' },
  { code: 'SGD', name: 'Singapore Dollar', nameUrdu: 'سنگاپور ڈالر', symbol: 'SG$', flag: '🇸🇬' },
  { code: 'QAR', name: 'Qatari Riyal', nameUrdu: 'قطری ریال', symbol: 'QAR', flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', nameUrdu: 'کویتی دینار', symbol: 'KWD', flag: '🇰🇼' },
  { code: 'TRY', name: 'Turkish Lira', nameUrdu: 'ترکی لیرا', symbol: '₺', flag: '🇹🇷' },
];

// Baseline Crypto Prices in USD (Resilient Market Reference)
export const BASELINE_CRYPTO_USD: Record<string, { price: number; change24h: number }> = {
  bitcoin: { price: 68450.0, change24h: 2.14 },
  ethereum: { price: 3520.0, change24h: 1.85 },
  solana: { price: 154.2, change24h: 4.62 },
  binancecoin: { price: 585.0, change24h: -0.45 },
  ripple: { price: 0.54, change24h: 1.12 },
  cardano: { price: 0.46, change24h: -1.05 },
  dogecoin: { price: 0.125, change24h: 3.28 },
  'avalanche-2': { price: 28.5, change24h: 2.75 },
  polkadot: { price: 6.4, change24h: -0.82 },
  chainlink: { price: 14.8, change24h: 1.95 },
  litecoin: { price: 74.5, change24h: 0.4 },
  uniswap: { price: 8.9, change24h: -1.2 },
  tether: { price: 1.0, change24h: 0.01 },
};

// Baseline Fiat Rates relative to USD = 1.0 (1 USD = X Fiat)
export const BASELINE_FIAT_RATES_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.6725,
  SAR: 3.75,
  INR: 83.4,
  PKR: 278.5,
  JPY: 154.2,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.91,
  CNY: 7.24,
  SGD: 1.35,
  QAR: 3.64,
  KWD: 0.308,
  TRY: 32.5,
};

export interface CryptoPriceData {
  pricesUSD: Record<string, number>;
  changes24h: Record<string, number>;
  fiatRatesUSD: Record<string, number>;
  lastUpdated: string;
  isLive: boolean;
  source: string;
}

export async function fetchLiveCryptoPrices(): Promise<CryptoPriceData> {
  const pricesUSD: Record<string, number> = {};
  const changes24h: Record<string, number> = {};
  const fiatRates: Record<string, number> = { ...BASELINE_FIAT_RATES_USD };

  // Initialize with baseline
  Object.entries(BASELINE_CRYPTO_USD).forEach(([id, data]) => {
    pricesUSD[id] = data.price;
    changes24h[id] = data.change24h;
  });

  // Try Binance public API (high availability & CORS-friendly for top cryptos)
  try {
    const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (binanceRes.ok) {
      const tickers: Array<{ symbol: string; lastPrice: string; priceChangePercent: string }> =
        await binanceRes.json();
      
      const tickerMap = new Map<string, { price: number; change: number }>();
      tickers.forEach((t) => {
        tickerMap.set(t.symbol, {
          price: parseFloat(t.lastPrice),
          change: parseFloat(t.priceChangePercent),
        });
      });

      SUPPORTED_CRYPTOS.forEach((crypto) => {
        if (crypto.binanceSymbol && tickerMap.has(crypto.binanceSymbol)) {
          const item = tickerMap.get(crypto.binanceSymbol)!;
          if (item.price > 0) {
            pricesUSD[crypto.id] = item.price;
            changes24h[crypto.id] = item.change;
          }
        }
      });

      // Also try to fetch latest USD fiat exchange rates
      try {
        const fiatRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (fiatRes.ok) {
          const fData = await fiatRes.json();
          if (fData?.rates) {
            Object.assign(fiatRates, fData.rates);
          }
        }
      } catch {
        // use baseline fiat rates
      }

      return {
        pricesUSD,
        changes24h,
        fiatRatesUSD: fiatRates,
        lastUpdated: new Date().toLocaleTimeString(),
        isLive: true,
        source: 'Binance & Forex Market Feed (Live)',
      };
    }
  } catch {
    // Fallback to CoinGecko
  }

  // Try CoinGecko Public API
  try {
    const ids = SUPPORTED_CRYPTOS.map((c) => c.coingeckoId).join(',');
    const cgRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (cgRes.ok) {
      const data = await cgRes.json();
      SUPPORTED_CRYPTOS.forEach((c) => {
        if (data[c.coingeckoId]?.usd) {
          pricesUSD[c.id] = data[c.coingeckoId].usd;
          if (data[c.coingeckoId].usd_24h_change !== undefined) {
            changes24h[c.id] = data[c.coingeckoId].usd_24h_change;
          }
        }
      });

      return {
        pricesUSD,
        changes24h,
        fiatRatesUSD: fiatRates,
        lastUpdated: new Date().toLocaleTimeString(),
        isLive: true,
        source: 'CoinGecko Market Feed (Live)',
      };
    }
  } catch {
    // fallback to baseline
  }

  return {
    pricesUSD,
    changes24h,
    fiatRatesUSD: fiatRates,
    lastUpdated: new Date().toLocaleTimeString(),
    isLive: false,
    source: 'Market Standard Reference (Offline Backup)',
  };
}

export interface ConvertResult {
  amount: number;
  fromId: string;
  toId: string;
  result: number;
  unitRate: number; // 1 From = X To
  inverseRate: number; // 1 To = X From
  valueInUSD: number;
}

export function convertCryptoOrFiat(
  amount: number,
  fromId: string,
  toId: string,
  pricesUSD: Record<string, number>,
  fiatRatesUSD: Record<string, number>
): ConvertResult {
  if (amount <= 0 || isNaN(amount)) {
    return {
      amount: 0,
      fromId,
      toId,
      result: 0,
      unitRate: 0,
      inverseRate: 0,
      valueInUSD: 0,
    };
  }

  // Helper to get USD value of 1 unit of symbol
  const getUSDValue = (id: string): number => {
    // Check if crypto
    if (pricesUSD[id] !== undefined) {
      return pricesUSD[id];
    }
    // Check if fiat: 1 Fiat = (1 / fiatRatesUSD[id]) USD
    const rate = fiatRatesUSD[id] || BASELINE_FIAT_RATES_USD[id] || 1;
    return 1 / rate;
  };

  const fromUSDValue = getUSDValue(fromId);
  const toUSDValue = getUSDValue(toId);

  const totalUSD = amount * fromUSDValue;
  const result = toUSDValue > 0 ? totalUSD / toUSDValue : 0;
  const unitRate = toUSDValue > 0 ? fromUSDValue / toUSDValue : 0;
  const inverseRate = unitRate > 0 ? 1 / unitRate : 0;

  return {
    amount,
    fromId,
    toId,
    result,
    unitRate,
    inverseRate,
    valueInUSD: totalUSD,
  };
}
