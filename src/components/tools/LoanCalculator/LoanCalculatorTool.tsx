import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Landmark,
  Calculator,
  Calendar,
  Percent,
  Copy,
  Download,
  RotateCcw,
  CheckCircle,
  TrendingDown,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';

export interface AmortizationScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export const LoanCalculatorTool: React.FC = () => {
  const { t } = useLanguage();

  // Primary Inputs
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [principal, setPrincipal] = useState<number>(50000);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(6.5);
  const [termMonths, setTermMonths] = useState<number>(36);

  // Optional Extra Monthly Payment
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);
  const [viewScheduleMode, setViewScheduleMode] = useState<'yearly' | 'monthly'>('yearly');

  const [copied, setCopied] = useState<boolean>(false);

  // Quick Preset Chips
  const principalPresets = [10000, 25000, 50000, 100000, 250000];
  const termPresets = [
    { label: '12 mos (1 yr)', val: 12 },
    { label: '24 mos (2 yrs)', val: 24 },
    { label: '36 mos (3 yrs)', val: 36 },
    { label: '48 mos (4 yrs)', val: 48 },
    { label: '60 mos (5 yrs)', val: 60 },
    { label: '120 mos (10 yrs)', val: 120 },
    { label: '240 mos (20 yrs)', val: 240 },
    { label: '360 mos (30 yrs)', val: 360 },
  ];

  // Calculation Engine
  const loanSummary = useMemo(() => {
    const P = Math.max(0, principal);
    const n = Math.max(1, termMonths);
    const r = annualInterestRate / 100 / 12;

    let baseMonthlyPayment = 0;
    if (P === 0) {
      baseMonthlyPayment = 0;
    } else if (r === 0) {
      baseMonthlyPayment = P / n;
    } else {
      baseMonthlyPayment = (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    }

    // Generate month-by-month amortization schedule
    const monthlyRows: AmortizationScheduleRow[] = [];
    let balance = P;
    let totalInterestPaid = 0;
    let actualMonthsPaid = 0;

    const actualMonthlyPayment = baseMonthlyPayment + Math.max(0, extraMonthlyPayment);

    for (let m = 1; m <= n && balance > 0.01; m++) {
      actualMonthsPaid = m;
      const interestForMonth = balance * r;
      let principalForMonth = actualMonthlyPayment - interestForMonth;

      if (principalForMonth > balance) {
        principalForMonth = balance;
      }

      const totalPaidThisMonth = principalForMonth + interestForMonth;
      balance = Math.max(0, balance - principalForMonth);
      totalInterestPaid += interestForMonth;

      monthlyRows.push({
        month: m,
        payment: totalPaidThisMonth,
        principal: principalForMonth,
        interest: interestForMonth,
        remainingBalance: balance,
      });
    }

    const totalAmountPaid = P + totalInterestPaid;
    const principalPercent = totalAmountPaid > 0 ? (P / totalAmountPaid) * 100 : 100;
    const interestPercent = totalAmountPaid > 0 ? (totalInterestPaid / totalAmountPaid) * 100 : 0;

    // Aggregate into yearly rows
    const yearlyRows: {
      year: number;
      payment: number;
      principal: number;
      interest: number;
      remainingBalance: number;
    }[] = [];

    let currentYearTotalPay = 0;
    let currentYearTotalPrinc = 0;
    let currentYearTotalInt = 0;
    let endYearBalance = P;

    monthlyRows.forEach((row, idx) => {
      currentYearTotalPay += row.payment;
      currentYearTotalPrinc += row.principal;
      currentYearTotalInt += row.interest;
      endYearBalance = row.remainingBalance;

      if (row.month % 12 === 0 || idx === monthlyRows.length - 1) {
        const yearNum = Math.ceil(row.month / 12);
        yearlyRows.push({
          year: yearNum,
          payment: currentYearTotalPay,
          principal: currentYearTotalPrinc,
          interest: currentYearTotalInt,
          remainingBalance: endYearBalance,
        });
        currentYearTotalPay = 0;
        currentYearTotalPrinc = 0;
        currentYearTotalInt = 0;
      }
    });

    return {
      P,
      n,
      baseMonthlyPayment,
      actualMonthlyPayment,
      totalInterestPaid,
      totalAmountPaid,
      principalPercent,
      interestPercent,
      actualMonthsPaid,
      monthlyRows,
      yearlyRows,
    };
  }, [principal, annualInterestRate, termMonths, extraMonthlyPayment]);

  const handleCopy = () => {
    const text = `--- LOAN PAYMENT & AMORTIZATION SUMMARY ---
Principal Borrowed: ${currencySymbol}${loanSummary.P.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Annual Interest Rate: ${annualInterestRate.toFixed(2)}%
Loan Term: ${termMonths} Months (${(termMonths / 12).toFixed(1)} Years)
Monthly Payment: ${currencySymbol}${loanSummary.baseMonthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${extraMonthlyPayment > 0 ? `Extra Monthly Prepayment: ${currencySymbol}${extraMonthlyPayment.toFixed(2)}\nTotal Monthly Outflow: ${currencySymbol}${loanSummary.actualMonthlyPayment.toFixed(2)}\nPayoff Time: ${loanSummary.actualMonthsPaid} Months\n` : ''}Total Interest Payable: ${currencySymbol}${loanSummary.totalInterestPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Total Cost of Loan: ${currencySymbol}${loanSummary.totalAmountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Calculated on FreeTools Hub (${typeof window !== 'undefined' ? window.location.origin : ''}/tools/loan-calculator)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    let csv = 'Month,Monthly Payment,Principal Paid,Interest Paid,Remaining Balance\n';
    loanSummary.monthlyRows.forEach((r) => {
      csv += `${r.month},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.remainingBalance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_amortization_schedule_${termMonths}months.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPrincipal(50000);
    setAnnualInterestRate(6.5);
    setTermMonths(36);
    setExtraMonthlyPayment(0);
    setViewScheduleMode('yearly');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Landmark className="w-4 h-4" />
            <span>Standard Fixed-Rate Amortization Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Loan Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculate exact monthly payments, total interest costs, and full amortization schedules for personal, auto, or home loans.
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
          {/* Currency Selection & Principal */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Principal Loan Amount
              </label>

              {/* Currency Selector */}
              <div className="flex flex-wrap items-center gap-1">
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
                step="500"
                value={principal || ''}
                onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="50,000"
                className="w-full pl-14 pr-4 py-2.5 text-xl font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Principal Preset Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {principalPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPrincipal(val)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    principal === val
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {currencySymbol}{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Annual Interest Rate (%) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Annual Interest Rate (APR)
              </label>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {annualInterestRate.toFixed(2)}%
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                max="50"
                step="0.05"
                value={annualInterestRate || ''}
                onChange={(e) =>
                  setAnnualInterestRate(Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)))
                }
                placeholder="6.5"
                className="w-full pr-10 pl-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">
                %
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="20"
              step="0.25"
              value={annualInterestRate}
              onChange={(e) => setAnnualInterestRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Loan Term in Months */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Loan Term (in Months)
              </label>
              <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                {termMonths} months ({(termMonths / 12).toFixed(1)} yrs)
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max="480"
                value={termMonths || ''}
                onChange={(e) => setTermMonths(Math.max(1, parseInt(e.target.value, 10) || 1))}
                placeholder="36"
                className="w-full pr-16 pl-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-slate-400 font-medium text-xs font-mono">
                months
              </span>
            </div>

            {/* Term preset buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {termPresets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setTermMonths(p.val)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border text-center transition-colors font-medium ${
                    termMonths === p.val
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Prepayment Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Extra Monthly Prepayment (Optional)
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  Accelerate Payoff
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold font-mono text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={extraMonthlyPayment || ''}
                  onChange={(e) =>
                    setExtraMonthlyPayment(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary & Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            {/* Monthly Payment Banner */}
            <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Monthly Loan Payment
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {currencySymbol}
                {loanSummary.baseMonthlyPayment.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>

              {extraMonthlyPayment > 0 && (
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 pt-1 font-mono">
                  + {currencySymbol}{extraMonthlyPayment.toFixed(2)} extra ={' '}
                  <span className="text-emerald-600 font-bold">
                    {currencySymbol}{loanSummary.actualMonthlyPayment.toFixed(2)} total / month
                  </span>
                </div>
              )}
            </div>

            {/* Proportion Bar: Principal vs Interest */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Principal: {loanSummary.principalPercent.toFixed(0)}%</span>
                <span>Interest: {loanSummary.interestPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 w-full bg-amber-100 dark:bg-amber-950/60 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${loanSummary.principalPercent}%` }}
                  title="Principal"
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-300 flex-1"
                  title="Total Interest"
                />
              </div>
            </div>

            {/* Key Totals Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Principal Borrowed</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {currencySymbol}{loanSummary.P.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Interest Payable</span>
                <span className="font-semibold font-mono text-amber-600 dark:text-amber-400">
                  {currencySymbol}{loanSummary.totalInterestPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1.5 font-bold text-sm text-slate-900 dark:text-white pt-1">
                <span>Total Amount to Pay</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{loanSummary.totalAmountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Summary Copied' : 'Copy Loan Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Amortization Payment Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Complete breakdown of principal reduction, interest charges, and remaining balance over time.
            </p>
          </div>

          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 p-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewScheduleMode('yearly')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                viewScheduleMode === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              type="button"
              onClick={() => setViewScheduleMode('monthly')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                viewScheduleMode === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Monthly Breakdown ({loanSummary.monthlyRows.length} mos)
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-sans font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-right">Payment</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Interest</th>
                <th className="py-2.5 px-3 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {viewScheduleMode === 'yearly'
                ? loanSummary.yearlyRows.map((row) => (
                    <tr
                      key={row.year}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        Year {row.year}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {currencySymbol}{row.payment.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                        {currencySymbol}{row.principal.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {currencySymbol}{row.interest.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white font-bold">
                        {currencySymbol}{row.remainingBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                : loanSummary.monthlyRows.map((row) => (
                    <tr
                      key={row.month}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-1.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                        Mo {row.month}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {currencySymbol}{row.payment.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {currencySymbol}{row.principal.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {currencySymbol}{row.interest.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-slate-900 dark:text-white font-semibold">
                        {currencySymbol}{row.remainingBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
