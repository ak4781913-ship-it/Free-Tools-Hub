import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { copyTextToClipboard } from '../../../utils/toolResultExtractor';
import { Print } from '../../common/Print';
import {
  Calculator,
  Wallet,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  Info,
  ArrowRight,
  Building2,
} from 'lucide-react';

export interface UAESalaryInputs {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  fixedDeductions: number;
  unpaidLeaveDays: number;
  weeklyHours: number;
  includeUAEGPSSA: boolean; // Optional 5% pension contribution for UAE nationals
}

const DEFAULT_SALARY_INPUTS: UAESalaryInputs = {
  basicSalary: 12000,
  housingAllowance: 5000,
  transportAllowance: 1500,
  otherAllowances: 1500,
  fixedDeductions: 0,
  unpaidLeaveDays: 0,
  weeklyHours: 48,
  includeUAEGPSSA: false,
};

function formatAED(amount: number): string {
  return `AED ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface UAESalaryToolProps {
  onNavigateTo?: (path: string) => void;
}

export const UAESalaryTool: React.FC<UAESalaryToolProps> = ({ onNavigateTo }) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [inputs, setInputs] = useState<UAESalaryInputs>(() => {
    try {
      const saved = localStorage.getItem('ft_uae-salary-calculator_inputs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SALARY_INPUTS, ...parsed };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SALARY_INPUTS;
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [csvExported, setCsvExported] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ft_uae-salary-calculator_inputs', JSON.stringify(inputs));
    } catch {
      // ignore storage errors
    }
  }, [inputs]);

  // Listen for global ToolPageLayout reset event
  useEffect(() => {
    const handleGlobalReset = (e: Event) => {
      const custom = e as CustomEvent<{ toolId: string }>;
      if (!custom.detail || custom.detail.toolId === 'uae-salary-calculator') {
        setInputs(DEFAULT_SALARY_INPUTS);
        setValidationError(null);
      }
    };
    window.addEventListener('freetools-reset-active-tool', handleGlobalReset);
    return () => window.removeEventListener('freetools-reset-active-tool', handleGlobalReset);
  }, []);

  const handleNumericChange = (field: keyof UAESalaryInputs, rawValue: string, maxLimit?: number) => {
    if (rawValue === '') {
      setValidationError(null);
      setInputs((prev) => ({ ...prev, [field]: 0 }));
      return;
    }

    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) {
      setValidationError(
        isUrdu
          ? 'براہ کرم درست عددی رقم درج کریں۔'
          : 'Please enter a valid numeric amount.'
      );
      return;
    }

    if (parsed < 0) {
      setValidationError(
        isUrdu
          ? 'منفی رقوم درج نہیں کی جا سکتیں۔ تمام فیلڈز صفر یا مثبت ہونی چاہئیں۔'
          : 'Negative values are not allowed. Salary and deduction amounts must be zero or positive.'
      );
      setInputs((prev) => ({ ...prev, [field]: 0 }));
      return;
    }

    if (maxLimit !== undefined && parsed > maxLimit) {
      setValidationError(
        isUrdu
          ? `یہ فیلڈ زیادہ سے زیادہ ${maxLimit} ہو سکتی ہے۔`
          : `Value capped at maximum allowed (${maxLimit}).`
      );
      setInputs((prev) => ({ ...prev, [field]: maxLimit }));
      return;
    }

    setValidationError(null);
    setInputs((prev) => ({ ...prev, [field]: parsed }));
  };

  const breakdown = useMemo(() => {
    const basic = Math.max(0, inputs.basicSalary);
    const housing = Math.max(0, inputs.housingAllowance);
    const transport = Math.max(0, inputs.transportAllowance);
    const other = Math.max(0, inputs.otherAllowances);
    const totalAllowances = housing + transport + other;
    const grossMonthly = basic + totalAllowances;

    const dailyGross30 = grossMonthly / 30;
    const dailyBasic365 = (basic * 12) / 365;
    const unpaidLeaveDays = Math.min(30, Math.max(0, inputs.unpaidLeaveDays));
    const unpaidLeaveDeduction = dailyGross30 * unpaidLeaveDays;

    // Optional UAE National pension contribution (standard 5% employee share on pensionable salary when toggled by user)
    const gpssaContribution = inputs.includeUAEGPSSA ? grossMonthly * 0.05 : 0;
    const fixedDed = Math.max(0, inputs.fixedDeductions);
    const totalDeductions = fixedDed + unpaidLeaveDeduction + gpssaContribution;
    const netMonthly = Math.max(0, grossMonthly - totalDeductions);
    const exceedsGross = totalDeductions > grossMonthly && grossMonthly > 0;

    const annualGross = grossMonthly * 12;
    const annualBasic = basic * 12;
    const annualAllowances = totalAllowances * 12;
    const annualDeductions = totalDeductions * 12;
    const annualNet = netMonthly * 12;

    const weeklyHrs = Math.max(1, inputs.weeklyHours || 48);
    const monthlyHours = (weeklyHrs * 52) / 12;
    const hourlyGrossRate = monthlyHours > 0 ? grossMonthly / monthlyHours : 0;

    const basicSharePct = grossMonthly > 0 ? (basic / grossMonthly) * 100 : 0;
    const allowanceSharePct = grossMonthly > 0 ? (totalAllowances / grossMonthly) * 100 : 0;

    return {
      basic,
      housing,
      transport,
      other,
      totalAllowances,
      grossMonthly,
      unpaidLeaveDays,
      unpaidLeaveDeduction,
      gpssaContribution,
      fixedDed,
      totalDeductions,
      netMonthly,
      exceedsGross,
      annualGross,
      annualBasic,
      annualAllowances,
      annualDeductions,
      annualNet,
      dailyGross30,
      dailyBasic365,
      hourlyGrossRate,
      basicSharePct,
      allowanceSharePct,
    };
  }, [inputs]);

  const handleReset = () => {
    setInputs(DEFAULT_SALARY_INPUTS);
    setValidationError(null);
  };

  const handleCopySummary = async () => {
    const summaryText = `--- UAE MONTHLY & ANNUAL SALARY BREAKDOWN ---
Monthly Basic Salary: ${formatAED(breakdown.basic)} (${breakdown.basicSharePct.toFixed(1)}%)
Housing Allowance: ${formatAED(breakdown.housing)}
Transport Allowance: ${formatAED(breakdown.transport)}
Other Allowances: ${formatAED(breakdown.other)}
Total Monthly Allowances: ${formatAED(breakdown.totalAllowances)} (${breakdown.allowanceSharePct.toFixed(1)}%)
---------------------------------------------
Gross Monthly Salary: ${formatAED(breakdown.grossMonthly)}
Fixed Contractual Deductions: ${formatAED(breakdown.fixedDed)}
Unpaid Leave Deduction (${breakdown.unpaidLeaveDays} days): ${formatAED(breakdown.unpaidLeaveDeduction)}${
      inputs.includeUAEGPSSA
        ? `\nOptional UAE National Pension (5% Estimate): ${formatAED(breakdown.gpssaContribution)}`
        : ''
    }
Total Monthly Deductions: ${formatAED(breakdown.totalDeductions)}
---------------------------------------------
Estimated Net Monthly Take-Home: ${formatAED(breakdown.netMonthly)}
Estimated Annual Gross Package: ${formatAED(breakdown.annualGross)}
Estimated Annual Net Compensation: ${formatAED(breakdown.annualNet)}
Daily Gross Rate (30-Day Basis): ${formatAED(breakdown.dailyGross30)}
Daily Basic Wage (Basic×12/365): ${formatAED(breakdown.dailyBasic365)}
Note: Informational estimate only (0% UAE personal income tax). Calculated via FreeTools Hub (${typeof window !== 'undefined' ? window.location.origin : ''}/tools/uae-salary-calculator)`;

    const ok = await copyTextToClipboard(summaryText);
    if (ok) {
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleDownloadCSV = () => {
    const rows = [
      ['Item', 'Monthly (AED)', 'Annual (AED)', 'Notes'],
      ['Basic Salary', breakdown.basic.toFixed(2), breakdown.annualBasic.toFixed(2), `${breakdown.basicSharePct.toFixed(1)}% of Gross Package`],
      ['Housing Allowance', breakdown.housing.toFixed(2), (breakdown.housing * 12).toFixed(2), 'Allowance'],
      ['Transport Allowance', breakdown.transport.toFixed(2), (breakdown.transport * 12).toFixed(2), 'Allowance'],
      ['Other Allowances', breakdown.other.toFixed(2), (breakdown.other * 12).toFixed(2), 'Allowance'],
      ['Gross Salary', breakdown.grossMonthly.toFixed(2), breakdown.annualGross.toFixed(2), 'Total Before Deductions'],
      ['Fixed Deductions', breakdown.fixedDed.toFixed(2), (breakdown.fixedDed * 12).toFixed(2), 'User-entered deductions'],
      ['Unpaid Leave Deduction', breakdown.unpaidLeaveDeduction.toFixed(2), (breakdown.unpaidLeaveDeduction * 12).toFixed(2), `${breakdown.unpaidLeaveDays} unpaid days (30-day rate)`],
    ];

    if (inputs.includeUAEGPSSA) {
      rows.push([
        'Optional UAE National Pension (5%)',
        breakdown.gpssaContribution.toFixed(2),
        (breakdown.gpssaContribution * 12).toFixed(2),
        'Optional estimate toggled by user',
      ]);
    }

    rows.push(
      ['Total Deductions', breakdown.totalDeductions.toFixed(2), breakdown.annualDeductions.toFixed(2), 'Sum of deductions'],
      ['Estimated Net Take-Home Pay', breakdown.netMonthly.toFixed(2), breakdown.annualNet.toFixed(2), '0% UAE Personal Income Tax']
    );

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uae_salary_breakdown_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvExported(true);
    setTimeout(() => setCsvExported(false), 2500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
            <Wallet className="w-4 h-4" />
            <span>{isUrdu ? 'متحدہ عرب امارات سیلری بریک ڈاؤن' : 'UAE Compensation & Take-Home Estimator'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isUrdu ? 'یو اے ای سیلری کیلکولیٹر' : 'UAE Salary Calculator'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
            {isUrdu
              ? 'ماہانہ بنیادی تنخواہ، الاؤنسز، اور کٹوتیوں کے ساتھ خالص تنخواہ (AED) کا شفاف حساب لگائیں۔'
              : 'Calculate monthly and annual gross-to-net compensation in AED across basic salary, allowances, and contractual deductions.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {csvExported ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            )}
            <span>{csvExported ? (isUrdu ? 'ڈاؤن لوڈ ہو گیا' : 'CSV Saved') : (isUrdu ? 'سی ایس وی ایکسپورٹ' : 'Export CSV')}</span>
          </button>

          <Print
            variant="secondary"
            toolId="uae-salary-calculator"
            toolName="UAE Salary Calculator"
            documentTitle={`UAE Salary Breakdown – ${formatAED(breakdown.netMonthly)} Net`}
            documentFormat="Compensation Breakdown Report"
            documentSummary={`Gross: ${formatAED(breakdown.grossMonthly)} • Net: ${formatAED(breakdown.netMonthly)}`}
          />

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ری سیٹ' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          {/* Section 1: Monthly Earnings & Allowances */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {isUrdu ? '۱. ماہانہ تنخواہ اور الاؤنسز (AED)' : '1. Monthly Earnings & Allowances (AED)'}
            </h2>

            <div>
              <label
                htmlFor="salary-basic"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1"
              >
                {isUrdu ? 'بنیادی ماہانہ تنخواہ (Basic Salary)' : 'Monthly Basic Salary (AED)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">
                  AED
                </span>
                <input
                  id="salary-basic"
                  type="number"
                  min="0"
                  step="100"
                  value={inputs.basicSalary === 0 ? '' : inputs.basicSalary}
                  onChange={(e) => handleNumericChange('basicSalary', e.target.value)}
                  placeholder="12000"
                  className="w-full pl-12 pr-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? 'آپ کے ملازمت کے معاہدے میں درج بنیادی تنخواہ (گریجویٹی کا حساب اسی پر ہوتا ہے)۔'
                  : 'Contractual base wage stated in your employment offer (used as the basis for end-of-service gratuity).'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="salary-housing"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {isUrdu ? 'ہاؤسنگ الاؤنس (رہائش)' : 'Housing Allowance (AED)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 select-none">
                    AED
                  </span>
                  <input
                    id="salary-housing"
                    type="number"
                    min="0"
                    step="100"
                    value={inputs.housingAllowance === 0 ? '' : inputs.housingAllowance}
                    onChange={(e) => handleNumericChange('housingAllowance', e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="salary-transport"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {isUrdu ? 'ٹرانسپورٹ الاؤنس' : 'Transport Allowance (AED)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 select-none">
                    AED
                  </span>
                  <input
                    id="salary-transport"
                    type="number"
                    min="0"
                    step="50"
                    value={inputs.transportAllowance === 0 ? '' : inputs.transportAllowance}
                    onChange={(e) => handleNumericChange('transportAllowance', e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="salary-other"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                {isUrdu ? 'دیگر ماہانہ الاؤنسز (فون، تعلیم، یوٹیلیٹیز، کمیشن)' : 'Other Monthly Allowances (Utilities, Education, Phone, Bonus)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 select-none">
                  AED
                </span>
                <input
                  id="salary-other"
                  type="number"
                  min="0"
                  step="50"
                  value={inputs.otherAllowances === 0 ? '' : inputs.otherAllowances}
                  onChange={(e) => handleNumericChange('otherAllowances', e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Applicable Deductions & Schedule */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-1">
              {isUrdu ? '۲. ماہانہ کٹوتیاں اور اوقاتِ کار' : '2. Contractual Deductions & Work Schedule'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="salary-deductions"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {isUrdu ? 'ماہانہ کٹوتیاں / لون ایڈوانس (AED)' : 'Fixed Monthly Deductions (AED)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 select-none">
                    AED
                  </span>
                  <input
                    id="salary-deductions"
                    type="number"
                    min="0"
                    step="50"
                    value={inputs.fixedDeductions === 0 ? '' : inputs.fixedDeductions}
                    onChange={(e) => handleNumericChange('fixedDeductions', e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  {isUrdu ? 'تنخواہ ایڈوانس یا معاہدے کی منظور شدہ کٹوتی' : 'Salary advance repayments or agreed payroll deductions.'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="salary-unpaid-days"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {isUrdu ? 'بغیر تنخواہ چھٹیاں (اس ماہ)' : 'Unpaid Leave Days (This Month)'}
                </label>
                <input
                  id="salary-unpaid-days"
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={inputs.unpaidLeaveDays === 0 ? '' : inputs.unpaidLeaveDays}
                  onChange={(e) => handleNumericChange('unpaidLeaveDays', e.target.value, 30)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  {isUrdu ? '30 دن کے ماہانہ حساب سے کٹوتی' : 'Calculated pro-rata on a 30-day calendar month.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label
                  htmlFor="salary-weekly-hours"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {isUrdu ? 'ہفتہ وار کام کے گھنٹے' : 'Weekly Working Hours'}
                </label>
                <select
                  id="salary-weekly-hours"
                  value={inputs.weeklyHours}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, weeklyHours: Number(e.target.value) || 48 }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={40}>40 hours / week (5 days × 8h)</option>
                  <option value={45}>45 hours / week (5 days × 9h)</option>
                  <option value={48}>48 hours / week (6 days × 8h)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.includeUAEGPSSA}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, includeUAEGPSSA: e.target.checked }))
                    }
                    className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                    <strong className="block text-slate-900 dark:text-white">
                      {isUrdu ? 'اماراتی شہری پنشن تخمینہ (اختیاری 5%)' : 'UAE National Pension Estimate (Optional 5%)'}
                    </strong>
                    {isUrdu
                      ? 'صرف اماراتی شہریوں کے لیے اختیاری تخمینہ؛ غیر ملکی ملازمین پر 0٪ انکم ٹیکس ہے۔'
                      : 'Optional 5% employee share estimate. Expatriate employees pay 0% personal income tax.'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Transparent Breakdown Card (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            {/* Primary Net Take-Home Hero Metric */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isUrdu ? 'تخمینی خالص ماہانہ تنخواہ (Net Take-Home)' : 'Estimated Net Monthly Take-Home'}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-400 font-mono tabular-nums mt-0.5">
                  {formatAED(breakdown.netMonthly)}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {isUrdu ? 'سالانہ خالص پیکیج:' : 'Annual Net:'} {formatAED(breakdown.annualNet)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {copied
                    ? isUrdu
                      ? 'کاپی ہو گیا!'
                      : 'Copied Breakdown'
                    : copyError
                    ? 'Copy Failed'
                    : isUrdu
                    ? 'تفصیل کاپی کریں'
                    : 'Copy Breakdown'}
                </span>
              </button>
            </div>

            {breakdown.exceedsGross && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isUrdu
                    ? 'درج کردہ کٹوتیاں مجموعی ماہانہ تنخواہ سے زیادہ ہیں؛ خالص تنخواہ صفر پر محدود کر دی گئی ہے۔'
                    : 'Entered deductions exceed gross monthly salary; net take-home pay is floored at AED 0.00.'}
                </span>
              </div>
            )}

            {/* Compensation Composition Bar */}
            {breakdown.grossMonthly > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>
                    {isUrdu ? 'بنیادی تنخواہ کا تناسب:' : 'Basic Salary Share:'}{' '}
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {breakdown.basicSharePct.toFixed(1)}%
                    </strong>
                  </span>
                  <span>
                    {isUrdu ? 'الاؤنسز کا تناسب:' : 'Allowances Share:'}{' '}
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {breakdown.allowanceSharePct.toFixed(1)}%
                    </strong>
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-blue-700 transition-all duration-300"
                    style={{ width: `${breakdown.basicSharePct}%` }}
                  />
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${breakdown.allowanceSharePct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Transparent Line-by-Line Calculation Table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Monthly Basic Salary</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatAED(breakdown.basic)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Housing Allowance</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                  {formatAED(breakdown.housing)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Transport & Other Allowances</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                  {formatAED(breakdown.transport + breakdown.other)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 px-2 rounded">
                <span className="font-bold text-slate-900 dark:text-white">Gross Monthly Salary</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatAED(breakdown.grossMonthly)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Personal Income Tax (UAE Standard)</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  AED 0.00 (0%)
                </span>
              </div>

              {breakdown.fixedDed > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-700 dark:text-rose-400">
                  <span>Fixed Contractual Deductions</span>
                  <span className="font-mono tabular-nums">-{formatAED(breakdown.fixedDed)}</span>
                </div>
              )}

              {breakdown.unpaidLeaveDeduction > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-700 dark:text-rose-400">
                  <span>Unpaid Leave ({breakdown.unpaidLeaveDays} days × Gross/30)</span>
                  <span className="font-mono tabular-nums">-{formatAED(breakdown.unpaidLeaveDeduction)}</span>
                </div>
              )}

              {inputs.includeUAEGPSSA && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-700 dark:text-rose-400">
                  <span>Optional UAE National Pension Estimate (5%)</span>
                  <span className="font-mono tabular-nums">-{formatAED(breakdown.gpssaContribution)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Annual Gross Package (12 Months)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatAED(breakdown.annualGross)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Daily Rate (Gross ÷ 30) / Hourly ({inputs.weeklyHours}h/wk)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatAED(breakdown.dailyGross30)} / {formatAED(breakdown.hourlyGrossRate)}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Daily Basic Wage (Basic × 12 ÷ 365)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatAED(breakdown.dailyBasic365)}
                </span>
              </div>
            </div>

            {/* Cross-link to UAE Gratuity Calculator */}
            {onNavigateTo && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>Need to estimate End-of-Service Gratuity on your Basic Salary?</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTo('/tools/uae-gratuity-calculator')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                >
                  <span>Gratuity Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Informational Disclaimer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Info className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Calculation Assumptions & Disclaimer</span>
            </div>
            <p>
              The United Arab Emirates currently levies 0% personal income tax on employment salaries. Daily leave pro-ration above uses a standard 30-day calendar month, while the daily basic wage reference uses `(Basic × 12) ÷ 365`. If the optional UAE National pension checkbox is enabled, a 5% employee contribution estimate is applied; actual GPSSA or Abu Dhabi Pension Fund rates depend on nationality, sector, and hire date. Always verify payroll figures against your signed employment contract and Wage Protection System (WPS) payslip.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
