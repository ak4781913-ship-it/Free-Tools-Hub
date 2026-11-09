import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Tag,
  Percent,
  DollarSign,
  Copy,
  CheckCircle,
  RotateCcw,
  Receipt,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const DiscountCalculatorTool: React.FC = () => {
  const { t } = useLanguage();

  // Primary Inputs
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [originalPrice, setOriginalPrice] = useState<number>(120);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountPercentage, setDiscountPercentage] = useState<number>(25);
  const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(30);

  // Advanced Shopping Options
  const [hasExtraDiscount, setHasExtraDiscount] = useState<boolean>(false);
  const [extraDiscountPercent, setExtraDiscountPercent] = useState<number>(10); // e.g. extra 10% coupon
  const [hasSalesTax, setHasSalesTax] = useState<boolean>(false);
  const [salesTaxPercent, setSalesTaxPercent] = useState<number>(5); // e.g. 5% VAT
  const [quantity, setQuantity] = useState<number>(1);

  const [copied, setCopied] = useState<boolean>(false);

  // Quick percentage presets
  const percentPresets = [5, 10, 15, 20, 25, 30, 40, 50, 70, 75];

  // Calculation Engine
  const calculation = useMemo(() => {
    const orig = Math.max(0, originalPrice);
    const qty = Math.max(1, quantity);

    // Primary discount calculation
    let primaryDiscountPerItem = 0;
    if (discountType === 'percentage') {
      const p = Math.min(100, Math.max(0, discountPercentage));
      primaryDiscountPerItem = (orig * p) / 100;
    } else {
      primaryDiscountPerItem = Math.min(orig, Math.max(0, discountFixedAmount));
    }

    const priceAfterPrimary = Math.max(0, orig - primaryDiscountPerItem);

    // Secondary / Stackable discount (applied on the already reduced price)
    let extraDiscountPerItem = 0;
    if (hasExtraDiscount && extraDiscountPercent > 0) {
      const extraP = Math.min(100, Math.max(0, extraDiscountPercent));
      extraDiscountPerItem = (priceAfterPrimary * extraP) / 100;
    }

    const priceBeforeTaxPerItem = Math.max(0, priceAfterPrimary - extraDiscountPerItem);
    const totalSavingsPerItem = primaryDiscountPerItem + extraDiscountPerItem;
    const effectiveDiscountPercent = orig > 0 ? (totalSavingsPerItem / orig) * 100 : 0;

    // Tax calculation
    let taxAmountPerItem = 0;
    if (hasSalesTax && salesTaxPercent > 0) {
      taxAmountPerItem = (priceBeforeTaxPerItem * Math.max(0, salesTaxPercent)) / 100;
    }

    const finalPricePerItem = priceBeforeTaxPerItem + taxAmountPerItem;

    // Totals for quantity
    const totalOriginal = orig * qty;
    const totalSavings = totalSavingsPerItem * qty;
    const totalPayable = finalPricePerItem * qty;
    const totalTax = taxAmountPerItem * qty;

    return {
      orig,
      qty,
      primaryDiscountPerItem,
      extraDiscountPerItem,
      totalSavingsPerItem,
      effectiveDiscountPercent,
      taxAmountPerItem,
      finalPricePerItem,
      totalOriginal,
      totalSavings,
      totalPayable,
      totalTax,
    };
  }, [
    originalPrice,
    discountType,
    discountPercentage,
    discountFixedAmount,
    hasExtraDiscount,
    extraDiscountPercent,
    hasSalesTax,
    salesTaxPercent,
    quantity,
  ]);

  const handleCopy = () => {
    const text = `--- DISCOUNT CALCULATION SUMMARY ---
Original Price: ${currencySymbol}${calculation.orig.toFixed(2)}${calculation.qty > 1 ? ` (Qty: ${calculation.qty} = ${currencySymbol}${calculation.totalOriginal.toFixed(2)})` : ''}
Discount Applied: ${discountType === 'percentage' ? `${discountPercentage}%` : `${currencySymbol}${discountFixedAmount.toFixed(2)}`}
${hasExtraDiscount ? `Extra Stackable Discount: ${extraDiscountPercent}%\n` : ''}${hasSalesTax ? `Sales Tax / VAT: ${salesTaxPercent}% (${currencySymbol}${calculation.totalTax.toFixed(2)})\n` : ''}Total Saved: ${currencySymbol}${calculation.totalSavings.toFixed(2)} (${calculation.effectiveDiscountPercent.toFixed(1)}% off)
Final Price to Pay: ${currencySymbol}${calculation.totalPayable.toFixed(2)}
Calculated on FreeTools Hub (${typeof window !== 'undefined' ? window.location.origin : ''}/tools/discount-calculator)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setOriginalPrice(100);
    setDiscountType('percentage');
    setDiscountPercentage(20);
    setDiscountFixedAmount(20);
    setHasExtraDiscount(false);
    setExtraDiscountPercent(10);
    setHasSalesTax(false);
    setSalesTaxPercent(5);
    setQuantity(1);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Tag className="w-4 h-4" />
            <span>Retail & Shopping Savings Calculator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Discount Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instantly calculate final sale prices, exact money saved, stackable coupons, and local VAT/sales tax.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          {/* Currency Symbol & Original Price */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Original Price
              </label>

              {/* Currency Selector */}
              <div className="flex items-center gap-1">
                {['$', 'AED', '€', '£', 'SAR', '₹', '₨'].map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrencySymbol(cur)}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                      currencySymbol === cur
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-base font-bold font-mono text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={originalPrice || ''}
                onChange={(e) => setOriginalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="100.00"
                className="w-full pl-12 pr-4 py-2.5 text-xl font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Discount Type Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Discount Mode
              </label>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Percentage Off (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Custom Amount Off ({currencySymbol})
                </button>
              </div>
            </div>

            {discountType === 'percentage' ? (
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={discountPercentage || ''}
                    onChange={(e) =>
                      setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                    }
                    placeholder="20"
                    className="w-full pr-10 pl-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">
                    %
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 mr-1">Popular:</span>
                  {percentPresets.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercentage(pct)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        discountPercentage === pct
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountFixedAmount || ''}
                    onChange={(e) =>
                      setDiscountFixedAmount(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    placeholder="25.00"
                    className="w-full pl-10 pr-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Direct dollar/currency voucher or store gift credit off the original price.
                </p>
              </div>
            )}
          </div>

          {/* Advanced Shopping Modifiers: Stackable Coupon, VAT/Sales Tax, Quantity */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Additional Modifiers
            </span>

            {/* Stackable Extra Discount */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Extra Stackable Coupon / Member Discount
                </span>
                <input
                  type="checkbox"
                  checked={hasExtraDiscount}
                  onChange={(e) => setHasExtraDiscount(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {hasExtraDiscount && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Extra off:</span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={extraDiscountPercent}
                      onChange={(e) =>
                        setExtraDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                      }
                      className="w-full pr-7 pl-2.5 py-1 text-xs font-mono font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                    <span className="absolute right-2 top-1 text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    (applied onto the discounted subtotal)
                  </span>
                </div>
              )}
            </div>

            {/* Sales Tax / VAT */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Sales Tax / VAT
                </span>
                <input
                  type="checkbox"
                  checked={hasSalesTax}
                  onChange={(e) => setHasSalesTax(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {hasSalesTax && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Tax rate:</span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={salesTaxPercent}
                      onChange={(e) =>
                        setSalesTaxPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                      }
                      className="w-full pr-7 pl-2.5 py-1 text-xs font-mono font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                    <span className="absolute right-2 top-1 text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    (e.g., 5% UAE VAT, 8.25% Sales Tax)
                  </span>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Quantity (Item Count)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 text-sm font-bold flex items-center justify-center hover:bg-slate-100"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 text-sm font-bold flex items-center justify-center hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary & Receipt (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            {/* Primary Result Banner */}
            <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Final Payable Price
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {currencySymbol}
                {calculation.totalPayable.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>

              {/* Total savings highlight */}
              <div className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <TrendingDown className="w-4 h-4" />
                <span>
                  You save {currencySymbol}
                  {calculation.totalSavings.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  ({calculation.effectiveDiscountPercent.toFixed(1)}% total discount)
                </span>
              </div>
            </div>

            {/* Visual Proportion Bar (Paid vs Saved) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Pay: {((calculation.totalPayable / Math.max(1, calculation.totalOriginal)) * 100).toFixed(0)}%</span>
                <span>Save: {calculation.effectiveDiscountPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 w-full bg-emerald-100 dark:bg-emerald-950/60 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, (calculation.totalPayable / Math.max(1, calculation.totalOriginal)) * 100)
                    )}%`,
                  }}
                  title="Final Price"
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 flex-1"
                  title="Total Savings"
                />
              </div>
            </div>

            {/* Itemized Receipt Breakdown */}
            <div className="space-y-2 text-xs pt-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  Original Price {calculation.qty > 1 ? `(${calculation.qty} items)` : ''}
                </span>
                <span className="font-semibold font-mono text-slate-700 dark:text-slate-300 line-through">
                  {currencySymbol}
                  {calculation.totalOriginal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  Initial Discount ({discountType === 'percentage' ? `${discountPercentage}%` : 'Fixed'})
                </span>
                <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  -{currencySymbol}
                  {(calculation.primaryDiscountPerItem * calculation.qty).toFixed(2)}
                </span>
              </div>

              {hasExtraDiscount && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Stackable Coupon ({extraDiscountPercent}%)</span>
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    -{currencySymbol}
                    {(calculation.extraDiscountPerItem * calculation.qty).toFixed(2)}
                  </span>
                </div>
              )}

              {hasSalesTax && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Sales Tax / VAT ({salesTaxPercent}%)</span>
                  <span className="font-semibold font-mono text-slate-900 dark:text-white">
                    +{currencySymbol}
                    {calculation.totalTax.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1.5 font-bold text-sm text-slate-900 dark:text-white pt-2">
                <span>Final Price:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}
                  {calculation.totalPayable.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Copy Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Summary Copied to Clipboard' : 'Copy Calculation Summary'}</span>
              </button>
            </div>
          </div>

          {/* Quick Comparison Strip at Common Discount Percentages */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Quick Price Table at {currencySymbol}{calculation.orig.toFixed(2)}
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[10, 25, 50, 70].map((tier) => {
                const finalAtTier = calculation.orig * (1 - tier / 100);
                return (
                  <div
                    key={tier}
                    onClick={() => {
                      setDiscountType('percentage');
                      setDiscountPercentage(tier);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-colors"
                  >
                    <span className="text-[10px] text-slate-400 block">{tier}% Off</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {currencySymbol}{finalAtTier.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
