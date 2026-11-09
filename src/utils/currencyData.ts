export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
}

export const MAJOR_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', country: 'United Arab Emirates' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦', country: 'Saudi Arabia' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', country: 'India' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', country: 'Pakistan' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Japan' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$', flag: '🇦🇺', country: 'Australia' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'China' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'SG$', flag: '🇸🇬', country: 'Singapore' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', country: 'Hong Kong' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', country: 'New Zealand' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', flag: '🇶🇦', country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', flag: '🇰🇼', country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD', flag: '🇧🇭', country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', flag: '🇴🇲', country: 'Oman' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', country: 'Turkey' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', country: 'Brazil' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', country: 'South Africa' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', country: 'South Korea' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽', country: 'Mexico' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', country: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', country: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', country: 'Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', country: 'Poland' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', country: 'Thailand' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', country: 'Indonesia' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', country: 'Malaysia' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', country: 'Egypt' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', country: 'Philippines' },
];

// Fallback baseline exchange rates against USD = 1.0 (recent market standard)
export const BASELINE_RATES_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.6725,
  SAR: 3.75,
  INR: 83.35,
  PKR: 278.5,
  JPY: 154.2,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.91,
  CNY: 7.24,
  SGD: 1.35,
  HKD: 7.82,
  NZD: 1.67,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.385,
  TRY: 32.5,
  BRL: 5.15,
  ZAR: 18.65,
  KRW: 1375.0,
  MXN: 16.85,
  SEK: 10.75,
  NOK: 10.85,
  DKK: 6.87,
  PLN: 3.98,
  THB: 36.75,
  IDR: 16200.0,
  MYR: 4.75,
  EGP: 48.2,
  PHP: 57.5,
};

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isLive: boolean;
  source: string;
}

export async function fetchLiveExchangeRates(): Promise<ExchangeRatesData> {
  // Try Open Exchange API free endpoint
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && Object.keys(data.rates).length > 0) {
        return {
          base: data.base_code || 'USD',
          rates: { ...BASELINE_RATES_USD, ...data.rates },
          lastUpdated: data.time_last_update_utc || new Date().toUTCString(),
          isLive: true,
          source: 'ExchangeRate-API (Live)',
        };
      }
    }
  } catch (err) {
    // try fallback endpoint
  }

  try {
    const fallbackRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data && data.rates) {
        return {
          base: data.base || 'USD',
          rates: { ...BASELINE_RATES_USD, ...data.rates },
          lastUpdated: data.date ? new Date(data.date).toUTCString() : new Date().toUTCString(),
          isLive: true,
          source: 'ExchangeRate-API V4 (Live)',
        };
      }
    }
  } catch (err) {
    // fallback to pre-seeded baseline
  }

  // Return standard market baseline if offline or network failure
  return {
    base: 'USD',
    rates: BASELINE_RATES_USD,
    lastUpdated: new Date().toUTCString(),
    isLive: false,
    source: 'Market Standard Reference (Offline Backup)',
  };
}

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>
): { result: number; rate: number; inverseRate: number } {
  if (amount <= 0 || isNaN(amount)) {
    return { result: 0, rate: 0, inverseRate: 0 };
  }

  const fromRate = rates[fromCode] || BASELINE_RATES_USD[fromCode] || 1;
  const toRate = rates[toCode] || BASELINE_RATES_USD[toCode] || 1;

  // Since rates are base USD:
  // 1 FromCode = (1 / fromRate) USD = (toRate / fromRate) ToCode
  const exchangeRate = toRate / fromRate;
  const inverseRate = exchangeRate > 0 ? 1 / exchangeRate : 0;
  const result = amount * exchangeRate;

  return {
    result,
    rate: exchangeRate,
    inverseRate,
  };
}
