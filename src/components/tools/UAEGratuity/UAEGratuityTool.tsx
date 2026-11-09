import React, { useState, useMemo } from 'react';
import { GratuityInputs, UAESector, ContractType, SeparationReason } from '../../../types/gratuity';
import {
  calculateUAEGratuity,
  GRATUITY_TEST_CASES,
  downloadGratuityCSV,
  downloadGratuityPDF,
  compareContractScenarios,
} from '../../../utils/gratuityCalculator';
import { useLanguage } from '../../../context/LanguageContext';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';
import { copyTextToClipboard } from '../../../utils/toolResultExtractor';
import { Print } from '../../common/Print';
import {
  Calculator,
  Calendar,
  AlertTriangle,
  Copy,
  RotateCcw,
  CheckCircle,
  FileText,
  HelpCircle,
  PlayCircle,
  Download,
  FileSpreadsheet,
  FileDown,
  Loader2,
  X,
  ArrowLeftRight,
  Scale,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const UAEGratuityTool: React.FC = () => {
  const { t } = useLanguage();

  const [inputs, setInputs] = useState<GratuityInputs>({
    startDate: '2020-03-01',
    endDate: '2025-03-01',
    basicSalary: 15000,
    sector: 'private',
    contractType: 'limited',
    separationReason: 'resignation',
    unpaidLeaveDays: 0,
    lawRegime: 'new_law_2022',
  });

  const [showTestCasesModal, setShowTestCasesModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputWarning, setInputWarning] = useState<string | null>(null);
  const [csvDownloaded, setCsvDownloaded] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showCompareSection, setShowCompareSection] = useState(true);
  const [compareLawOverride, setCompareLawOverride] = useState<'current_active' | 'new_law_2022' | 'old_law_1980'>('current_active');

  // Real-time calculation
  const result = useMemo(() => calculateUAEGratuity(inputs), [inputs]);

  // Real-time Limited vs Unlimited contract scenario comparison
  const comparison = useMemo(() => {
    const regime = compareLawOverride === 'current_active' ? inputs.lawRegime : compareLawOverride;
    return compareContractScenarios(inputs, regime);
  }, [inputs, compareLawOverride]);

  const handleDownloadCSV = () => {
    downloadGratuityCSV(inputs, result);
    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 2500);
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    try {
      downloadGratuityPDF(inputs, result);
      recordPrintDocument('uae-gratuity', `UAE Gratuity Statement – AED ${inputs.basicSalary.toLocaleString()} Basic`, {
        toolName: 'UAE Gratuity Calculator',
        format: 'Official PDF Statement',
        summary: `${result.serviceBreakdown.years}y ${result.serviceBreakdown.months}m service • Net Gratuity: AED ${result.netGratuityAED.toLocaleString()}`,
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopySummary = async () => {
    const text = `--- UAE END-OF-SERVICE GRATUITY ESTIMATE ---
Service Dates: ${inputs.startDate} to ${inputs.endDate}
Total Service: ${result.serviceBreakdown.years} Years, ${result.serviceBreakdown.months} Months, ${result.serviceBreakdown.days} Days (${result.netWorkingDays} net working days)
Basic Monthly Salary: AED ${inputs.basicSalary.toLocaleString()}
Daily Basic Wage (Basic×12/365): AED ${result.dailyWage.toFixed(2)}
Estimated Net Gratuity: AED ${result.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Statutory Cap (2 Years Basic): AED ${result.maxCapAmount.toLocaleString()} ${result.isCapped ? '(CAP REACHED)' : ''}
Legal Assumptions: ${result.applicableLawNote}
Disclaimer: Estimate only; subject to employment contract and applicable UAE law.
Calculated via FreeTools Hub (${typeof window !== 'undefined' ? window.location.origin : ''}/tools/uae-gratuity-calculator)`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    setInputs({
      startDate: '2023-01-01',
      endDate: '2024-06-01',
      basicSalary: 10000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'resignation',
      unpaidLeaveDays: 0,
      lawRegime: 'new_law_2022',
    });
  };

  const applyTestCase = (testCaseId: string) => {
    const tc = GRATUITY_TEST_CASES.find((c) => c.id === testCaseId);
    if (tc) {
      setInputs(tc.inputs);
      setShowTestCasesModal(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
            <Calculator className="w-4 h-4" />
            <span>UAE Federal Decree-Law No. 33 of 2021 Estimator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            UAE Gratuity Calculator
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Estimate private-sector end-of-service gratuity using standard 21-day and 30-day basic salary tiers and 2-year cap rules.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCompareSection(true);
              const el = document.getElementById('compare-scenarios-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
            title="Compare Limited vs Unlimited contract payouts side-by-side"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Compare Scenarios</span>
            <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 px-1 py-0.2 rounded font-bold">
              Limited vs Unlimited
            </span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
              pdfDownloaded
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            }`}
            title="Download professional PDF summary document of calculation"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 dark:text-rose-400" />
                <span>Generating PDF...</span>
              </>
            ) : pdfDownloaded ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Downloaded PDF!</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Download PDF</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
              csvDownloaded
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
            }`}
            title="Download formatted CSV report of calculations"
          >
            {csvDownloaded ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Downloaded CSV!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Download CSV</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowTestCasesModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Scenarios ({GRATUITY_TEST_CASES.length})</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.reset}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Results Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Employment Details
          </h2>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Employment Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={inputs.startDate}
                  onChange={(e) => setInputs({ ...inputs, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Working Day (End Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={inputs.endDate}
                  onChange={(e) => setInputs({ ...inputs, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {inputWarning && (
            <div role="alert" className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{inputWarning}</span>
            </div>
          )}

          {/* Salary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Basic Monthly Salary (AED)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">AED</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={inputs.basicSalary || ''}
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value);
                    if (raw < 0) {
                      setInputWarning('Negative salary values are not permitted. Basic salary has been set to 0.');
                      setInputs({ ...inputs, basicSalary: 0 });
                    } else {
                      setInputWarning(null);
                      setInputs({ ...inputs, basicSalary: isNaN(raw) ? 0 : raw });
                    }
                  }}
                  placeholder="15,000"
                  className="w-full pl-12 pr-3 py-2 text-xs font-mono tabular-nums font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                Basic salary only. Exclude housing, transport, and other allowances.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unpaid Leave Days Taken
              </label>
              <input
                type="number"
                min="0"
                value={inputs.unpaidLeaveDays}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  if (raw < 0) {
                    setInputWarning('Unpaid leave days cannot be negative.');
                    setInputs({ ...inputs, unpaidLeaveDays: 0 });
                  } else {
                    setInputWarning(null);
                    setInputs({ ...inputs, unpaidLeaveDays: isNaN(raw) ? 0 : raw });
                  }
                }}
                placeholder="0"
                className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                Days of absence without pay are excluded from continuous service.
              </p>
            </div>
          </div>

          {/* Sector & Separation Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Employment Jurisdiction / Sector
              </label>
              <select
                value={inputs.sector}
                onChange={(e) => setInputs({ ...inputs, sector: e.target.value as UAESector })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="private">UAE Private Sector (Standard Labour Law)</option>
                <option value="difc">DIFC (DEWS Savings Scheme)</option>
                <option value="adgm">ADGM (Abu Dhabi Global Market)</option>
                <option value="government">Government / Public Sector</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason for Separation
              </label>
              <select
                value={inputs.separationReason}
                onChange={(e) =>
                  setInputs({ ...inputs, separationReason: e.target.value as SeparationReason })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="resignation">Employee Resignation</option>
                <option value="termination">Employer Termination (without cause)</option>
                <option value="contract_expiry">Fixed-Term Contract Expiration</option>
                <option value="mutual_consent">Mutual Consent Agreement</option>
              </select>
            </div>
          </div>

          {/* Contract Type Instant Toggle */}
          <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Contract Type
              </label>
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                Active:{' '}
                <strong className={inputs.contractType === 'limited' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}>
                  {inputs.contractType === 'limited' ? 'Limited (Fixed-Term)' : 'Unlimited (Open-Ended)'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, contractType: 'limited' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  inputs.contractType === 'limited'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Limited</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  inputs.contractType === 'limited' ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  MOHRE
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, contractType: 'unlimited' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  inputs.contractType === 'unlimited'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Unlimited</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  inputs.contractType === 'unlimited' ? 'bg-indigo-700/60 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  Legacy
                </span>
              </button>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Toggle between Limited and Unlimited to instantly recalculate and compare payouts.
            </p>
          </div>

          {/* Applicable Law toggle */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200/60 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Statutory Legal Framework
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputs({ ...inputs, lawRegime: 'new_law_2022' })}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    inputs.lawRegime === 'new_law_2022'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Current Law (2022+)
                </button>
                <button
                  type="button"
                  onClick={() => setInputs({ ...inputs, lawRegime: 'old_law_1980' })}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    inputs.lawRegime === 'old_law_1980'
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Old Law (Pre-2022)
                </button>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              {inputs.lawRegime === 'new_law_2022'
                ? 'UAE Federal Decree-Law No. 33 of 2021: 100% full gratuity entitlement after 1 year on all contracts.'
                : 'Historical Federal Law No. 8 of 1980: Applied resignation penalty reductions (1/3, 2/3, or forfeiture under 5 years).'}
            </p>
          </div>
        </div>

        {/* Right: Results Breakdown & Calculation Output (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            {/* Top result banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Estimated End-of-Service Gratuity
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                  AED {result.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    pdfDownloaded
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                      : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60'
                  }`}
                  title="Download professional PDF summary report of results"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 dark:text-rose-400" />
                  ) : pdfDownloaded ? (
                    <CheckCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{isGeneratingPDF ? 'Generating...' : pdfDownloaded ? 'PDF Saved!' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    csvDownloaded
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60'
                  }`}
                  title="Export complete calculation results to formatted CSV"
                >
                  {csvDownloaded ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  <span>{csvDownloaded ? 'CSV Saved!' : 'Download CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <Print
                  variant="subtle"
                  toolId="uae-gratuity"
                  toolName="UAE Gratuity Calculator"
                  documentTitle={`UAE Gratuity Statement – AED ${inputs.basicSalary.toLocaleString()} Basic`}
                  documentFormat="Official Calculation Statement / Print"
                  documentSummary={`${result.serviceBreakdown.years}y ${result.serviceBreakdown.months}m service • Net Gratuity: AED ${result.netGratuityAED.toLocaleString()} • ${inputs.sector === 'private' ? 'Private Sector' : 'Public Sector'}`}
                />
              </div>
            </div>

            {/* Ineligibility Warning if <1 year */}
            {!result.isEligible && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Not Eligible for End-of-Service Gratuity</span>
                  <p>{result.ineligibilityReason}</p>
                </div>
              </div>
            )}

            {/* Detailed metrics breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Service Tenure (Calendar)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {result.serviceBreakdown.years} Years, {result.serviceBreakdown.months} Months, {result.serviceBreakdown.days} Days
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Net Continuous Working Days</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {result.netWorkingDays} Days ({result.yearsOfService.toFixed(2)} fractional years)
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Statutory Daily Basic Wage</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  AED {result.dailyWage.toFixed(2)} / day
                </span>
              </div>

              {/* Tier 1: First 5 Years */}
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  First 5 Years Tier (21 days/yr):
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {result.firstFiveYearsDays.toFixed(1)} days = AED {result.firstFiveYearsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tier 2: Excess over 5 Years */}
              {result.afterFiveYearsDays > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">
                    Additional Years Tier (30 days/yr):
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                    {result.afterFiveYearsDays.toFixed(1)} days = AED {result.afterFiveYearsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Statutory Cap */}
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Statutory Max Cap (24 Months Basic)</span>
                <span className={`font-semibold font-mono tabular-nums ${result.isCapped ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                  AED {result.maxCapAmount.toLocaleString()} {result.isCapped ? '(Ceiling reached)' : ''}
                </span>
              </div>
            </div>

            {/* Notes & statutory clauses */}
            {result.notes.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Statutory Rules Applied
                </span>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {result.notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mandatory Legal Disclaimer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Legal & Accuracy Disclaimer</span>
            </div>
            <p>
              This calculation is an estimate for informational guidance based on UAE Federal Decree-Law No. 33 of 2021. It does not constitute official legal advice or guaranteed MOHRE payout. Final end-of-service settlements may reflect contractual stipulations, authorized leaves, employee debt deductions, or approved workplace savings schemes.
            </p>
          </div>
        </div>
      </div>

      {/* Compare Scenarios Section: Limited vs. Unlimited Contracts */}
      <div
        id="compare-scenarios-section"
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6"
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Contract Scenario Comparison</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Compare Scenarios: Limited vs. Unlimited Contracts</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant side-by-side payout comparison based on your monthly basic salary of AED {inputs.basicSalary.toLocaleString()} and tenure of {result.serviceBreakdown.years}Y {result.serviceBreakdown.months}M {result.serviceBreakdown.days}D ({result.yearsOfService.toFixed(2)} fractional years).
            </p>
          </div>

          {/* Quick Toggle Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Quick Contract Type Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10.5px] font-medium text-slate-500 px-1.5">Active:</span>
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, contractType: 'limited' })}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  inputs.contractType === 'limited'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Limited
              </button>
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, contractType: 'unlimited' })}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  inputs.contractType === 'unlimited'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unlimited
              </button>
            </div>

            {/* Comparison Framework Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setCompareLawOverride('new_law_2022')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  (compareLawOverride === 'new_law_2022' || (compareLawOverride === 'current_active' && inputs.lawRegime === 'new_law_2022'))
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Evaluate under UAE Federal Decree-Law No. 33 of 2021"
              >
                2021 Law (Current)
              </button>
              <button
                type="button"
                onClick={() => setCompareLawOverride('old_law_1980')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  (compareLawOverride === 'old_law_1980' || (compareLawOverride === 'current_active' && inputs.lawRegime === 'old_law_1980'))
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Evaluate under historical UAE Federal Law No. 8 of 1980"
              >
                Old Law (Pre-2022)
              </button>
            </div>
          </div>
        </div>

        {/* Delta / Variance Highlight Box */}
        {comparison.hasDifference ? (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 rounded-lg text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    Payout Variance Detected:
                  </span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-md">
                    AED {comparison.absoluteDifferenceAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Difference ({comparison.percentageDifference.toFixed(1)}%)
                  </span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    ({comparison.higherOption === 'unlimited' ? 'Unlimited' : 'Limited'} Contract pays more)
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {comparison.summary}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {comparison.legalNote}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {inputs.contractType !== comparison.higherOption && comparison.higherOption !== 'equal' && (
                <button
                  type="button"
                  onClick={() => setInputs({ ...inputs, contractType: comparison.higherOption as ContractType })}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Switch to {comparison.higherOption === 'unlimited' ? 'Unlimited' : 'Limited'} (+AED {comparison.absoluteDifferenceAED.toLocaleString('en-US', { maximumFractionDigits: 0 })})</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    No Payout Difference:
                  </span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md">
                    AED 0.00 Variance (Equal Entitlement)
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
                    AED {comparison.limitedResult.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {comparison.summary}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {comparison.legalNote}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setCompareLawOverride('old_law_1980')}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
              >
                See Historical Old Law Contrast →
              </button>
            </div>
          </div>
        )}

        {/* Side-by-Side Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Limited Contract */}
          <div
            className={`rounded-xl border p-5 space-y-4 transition-all relative ${
              inputs.contractType === 'limited'
                ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm ring-1 ring-emerald-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Limited Contract</span>
                  </h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    MOHRE Standard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fixed-term employment contract with defined start and end dates.
                </p>
              </div>

              {inputs.contractType === 'limited' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Active Selection
                </span>
              )}
            </div>

            {/* Payout Display */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Net Gratuity Payable
              </span>
              <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                AED {comparison.limitedResult.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Gross: AED {comparison.limitedResult.grossGratuity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={comparison.limitedResult.reductionPercentage > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                  {comparison.limitedResult.reductionPercentage > 0
                    ? `Reduction: -${comparison.limitedResult.reductionPercentage.toFixed(1)}%`
                    : '100% Full Entitlement'}
                </span>
              </div>
            </div>

            {/* Metric Rows */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Service Duration</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {comparison.limitedResult.serviceBreakdown.years}Y {comparison.limitedResult.serviceBreakdown.months}M {comparison.limitedResult.serviceBreakdown.days}D
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tier 1 Rate (1-5 Yrs)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  21 days/yr ({comparison.limitedResult.firstFiveYearsDays.toFixed(1)} days)
                </span>
              </div>
              {comparison.limitedResult.afterFiveYearsDays > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Tier 2 Rate (5+ Yrs)</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    30 days/yr ({comparison.limitedResult.afterFiveYearsDays.toFixed(1)} days)
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Resignation Impact</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {comparison.limitedResult.reductionPercentage === 100
                    ? '0% Gratuity (Forfeited <5 Yrs under Old Law)'
                    : comparison.limitedResult.reductionPercentage > 0
                    ? `${100 - comparison.limitedResult.reductionPercentage}% Entitled`
                    : '100% Entitlement (No Penalty)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Statutory 2-Year Cap</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  AED {comparison.limitedResult.maxCapAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Switch / Select Button */}
            {inputs.contractType === 'limited' ? (
              <div className="w-full py-2 px-3 text-xs font-semibold text-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Currently Selected Contract</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, contractType: 'limited' })}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Apply Limited Contract Scenario</span>
              </button>
            )}
          </div>

          {/* Card 2: Unlimited Contract */}
          <div
            className={`rounded-xl border p-5 space-y-4 transition-all relative ${
              inputs.contractType === 'unlimited'
                ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 shadow-sm ring-1 ring-indigo-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Unlimited Contract</span>
                  </h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Open-Ended / Historical
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Open-ended employment contract without fixed term expiration.
                </p>
              </div>

              {inputs.contractType === 'unlimited' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Active Selection
                </span>
              )}
            </div>

            {/* Payout Display */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Net Gratuity Payable
              </span>
              <div className="text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
                AED {comparison.unlimitedResult.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Gross: AED {comparison.unlimitedResult.grossGratuity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={comparison.unlimitedResult.reductionPercentage > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-medium'}>
                  {comparison.unlimitedResult.reductionPercentage > 0
                    ? `Reduction: -${comparison.unlimitedResult.reductionPercentage.toFixed(1)}%`
                    : '100% Full Entitlement'}
                </span>
              </div>
            </div>

            {/* Metric Rows */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Service Duration</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {comparison.unlimitedResult.serviceBreakdown.years}Y {comparison.unlimitedResult.serviceBreakdown.months}M {comparison.unlimitedResult.serviceBreakdown.days}D
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tier 1 Rate (1-5 Yrs)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  21 days/yr ({comparison.unlimitedResult.firstFiveYearsDays.toFixed(1)} days)
                </span>
              </div>
              {comparison.unlimitedResult.afterFiveYearsDays > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Tier 2 Rate (5+ Yrs)</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    30 days/yr ({comparison.unlimitedResult.afterFiveYearsDays.toFixed(1)} days)
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Resignation Impact</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {comparison.unlimitedResult.reductionPercentage === 66.67
                    ? '33.3% Entitlement (1/3rd payout under Old Law Art. 137)'
                    : comparison.unlimitedResult.reductionPercentage === 33.33
                    ? '66.7% Entitlement (2/3rd payout under Old Law Art. 137)'
                    : comparison.unlimitedResult.reductionPercentage > 0
                    ? `${100 - comparison.unlimitedResult.reductionPercentage}% Entitled`
                    : '100% Entitlement (No Penalty)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Statutory 2-Year Cap</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  AED {comparison.unlimitedResult.maxCapAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Switch / Select Button */}
            {inputs.contractType === 'unlimited' ? (
              <div className="w-full py-2 px-3 text-xs font-semibold text-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Currently Selected Contract</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, contractType: 'unlimited' })}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Apply Unlimited Contract Scenario</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Contract Comparison Matrix */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Statutory Contract Comparison Matrix (MOHRE Reference)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Statutory Provision</th>
                  <th className="py-2.5 px-3">Limited (Fixed-Term) Contract</th>
                  <th className="py-2.5 px-3">Unlimited Contract (Historical)</th>
                  <th className="py-2.5 px-3">Federal Decree-Law 33/2021 Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Legal Status</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-semibold">Mandatory for all private sector contracts</td>
                  <td className="py-2.5 px-3 text-slate-500">Phased out; all transitioned to fixed term</td>
                  <td className="py-2.5 px-3">Standardized single contract model</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Resignation: 1 to 3 Years</td>
                  <td className="py-2.5 px-3">100% under New Law (0% forfeit under Old Art. 138)</td>
                  <td className="py-2.5 px-3">100% under New Law (1/3rd pay under Old Art. 137)</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">Full 100% gratuity entitlement guaranteed</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Resignation: 3 to 5 Years</td>
                  <td className="py-2.5 px-3">100% under New Law (0% forfeit under Old Art. 138)</td>
                  <td className="py-2.5 px-3">100% under New Law (2/3rd pay under Old Art. 137)</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">Full 100% gratuity entitlement guaranteed</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Resignation: 5+ Years</td>
                  <td className="py-2.5 px-3">100% Full Gratuity (Tiered 21 + 30 days)</td>
                  <td className="py-2.5 px-3">100% Full Gratuity (Tiered 21 + 30 days)</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">100% Full Gratuity (Tiered 21 + 30 days)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Employer Termination</td>
                  <td className="py-2.5 px-3">100% Gratuity after 1 continuous year</td>
                  <td className="py-2.5 px-3">100% Gratuity after 1 continuous year</td>
                  <td className="py-2.5 px-3">Equal protection under Article 51</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Maximum Gratuity Cap</td>
                  <td className="py-2.5 px-3 font-mono">24 Months' Basic Salary</td>
                  <td className="py-2.5 px-3 font-mono">24 Months' Basic Salary</td>
                  <td className="py-2.5 px-3 font-mono">24 Months' Basic Salary</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Test Scenarios Modal */}
      {showTestCasesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Automated Test Scenarios
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestCasesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select any pre-configured test case to verify statutory UAE Gratuity rules:
            </p>

            <div className="space-y-2.5">
              {GRATUITY_TEST_CASES.map((tc) => (
                <div
                  key={tc.id}
                  onClick={() => applyTestCase(tc.id)}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {tc.name}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      Load Scenario →
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {tc.description}
                  </p>
                  {tc.expectedExpectedNote && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      {tc.expectedExpectedNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
