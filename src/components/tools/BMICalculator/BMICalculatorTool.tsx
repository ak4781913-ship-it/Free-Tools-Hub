import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Activity,
  Scale,
  Ruler,
  Copy,
  CheckCircle,
  RotateCcw,
  Heart,
  Info,
  TrendingUp,
} from 'lucide-react';

export interface BMICategoryInfo {
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity Class I' | 'Obesity Class II' | 'Obesity Class III';
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  healthRisk: string;
  rangeText: string;
}

export function getBMICategory(bmi: number): BMICategoryInfo {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      colorClass: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
      badgeText: 'text-sky-700 dark:text-sky-300',
      healthRisk: 'Risk of nutritional deficiency, weakened immunity, and osteoporosis.',
      rangeText: '< 18.5',
    };
  }
  if (bmi < 25) {
    return {
      category: 'Normal weight',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      healthRisk: 'Lowest risk of cardiovascular disease, diabetes, and metabolic complications.',
      rangeText: '18.5 – 24.9',
    };
  }
  if (bmi < 30) {
    return {
      category: 'Overweight',
      colorClass: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      badgeText: 'text-amber-700 dark:text-amber-300',
      healthRisk: 'Moderate risk of developing hypertension, elevated cholesterol, and type 2 diabetes.',
      rangeText: '25.0 – 29.9',
    };
  }
  if (bmi < 35) {
    return {
      category: 'Obesity Class I',
      colorClass: 'text-orange-600 dark:text-orange-400',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
      badgeText: 'text-orange-700 dark:text-orange-300',
      healthRisk: 'Elevated risk of cardiovascular strain, joint stress, and sleep apnea.',
      rangeText: '30.0 – 34.9',
    };
  }
  if (bmi < 40) {
    return {
      category: 'Obesity Class II',
      colorClass: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      badgeText: 'text-rose-700 dark:text-rose-300',
      healthRisk: 'High risk of chronic cardiometabolic disorders and vascular strain.',
      rangeText: '35.0 – 39.9',
    };
  }
  return {
    category: 'Obesity Class III',
    colorClass: 'text-red-700 dark:text-red-400',
    badgeBg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
    badgeText: 'text-red-700 dark:text-red-300',
    healthRisk: 'Very high clinical risk of severe metabolic and cardiovascular complications.',
    rangeText: '≥ 40.0',
  };
}

export const BMICalculatorTool: React.FC = () => {
  const { t } = useLanguage();

  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Metric inputs
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);

  // Imperial inputs
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);
  const [weightLbs, setWeightLbs] = useState<number>(154);

  // Demographics (for context)
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const [copied, setCopied] = useState<boolean>(false);

  // Handle unit system toggle with smooth sync
  const handleUnitSystemChange = (system: 'metric' | 'imperial') => {
    if (system === 'imperial' && unitSystem === 'metric') {
      const totalInches = heightCm / 2.54;
      setHeightFeet(Math.floor(totalInches / 12));
      setHeightInches(Math.round(totalInches % 12));
      setWeightLbs(Math.round(weightKg * 2.20462));
    } else if (system === 'metric' && unitSystem === 'imperial') {
      const totalInches = heightFeet * 12 + heightInches;
      setHeightCm(Math.round(totalInches * 2.54));
      setWeightKg(Math.round(weightLbs / 2.20462));
    }
    setUnitSystem(system);
  };

  // BMI Calculation
  const calculation = useMemo(() => {
    let hMeters = 0;
    let wKg = 0;

    if (unitSystem === 'metric') {
      hMeters = Math.max(0.5, heightCm / 100);
      wKg = Math.max(10, weightKg);
    } else {
      const totalInches = heightFeet * 12 + heightInches;
      hMeters = Math.max(0.5, (totalInches * 2.54) / 100);
      wKg = Math.max(10, weightLbs / 2.20462);
    }

    const bmi = +(wKg / (hMeters * hMeters)).toFixed(1);
    const categoryInfo = getBMICategory(bmi);

    // Normal BMI healthy weight range for this height (18.5 to 24.9)
    const minHealthyKg = +(18.5 * hMeters * hMeters).toFixed(1);
    const maxHealthyKg = +(24.9 * hMeters * hMeters).toFixed(1);

    const minHealthyLbs = Math.round(minHealthyKg * 2.20462);
    const maxHealthyLbs = Math.round(maxHealthyKg * 2.20462);

    // Weight difference from normal range
    let weightDifferenceNote = '';
    if (wKg < minHealthyKg) {
      const diffKg = +(minHealthyKg - wKg).toFixed(1);
      const diffLbs = Math.round(diffKg * 2.20462);
      weightDifferenceNote = `~${unitSystem === 'metric' ? `${diffKg} kg` : `${diffLbs} lbs`} below ideal lower bound.`;
    } else if (wKg > maxHealthyKg) {
      const diffKg = +(wKg - maxHealthyKg).toFixed(1);
      const diffLbs = Math.round(diffKg * 2.20462);
      weightDifferenceNote = `~${unitSystem === 'metric' ? `${diffKg} kg` : `${diffLbs} lbs`} above ideal upper bound.`;
    } else {
      weightDifferenceNote = 'You are within the optimal healthy weight range for your height.';
    }

    // Ponderal index (kg / m^3)
    const ponderalIndex = +(wKg / (hMeters * hMeters * hMeters)).toFixed(2);

    // BMI Prime (BMI / 25)
    const bmiPrime = +(bmi / 25).toFixed(2);

    return {
      bmi,
      hMeters,
      wKg,
      categoryInfo,
      minHealthyKg,
      maxHealthyKg,
      minHealthyLbs,
      maxHealthyLbs,
      weightDifferenceNote,
      ponderalIndex,
      bmiPrime,
    };
  }, [unitSystem, heightCm, weightKg, heightFeet, heightInches, weightLbs]);

  const handleCopy = () => {
    const text = `--- BODY MASS INDEX (BMI) REPORT ---
Height: ${unitSystem === 'metric' ? `${heightCm} cm` : `${heightFeet}ft ${heightInches}in`}
Weight: ${unitSystem === 'metric' ? `${weightKg} kg` : `${weightLbs} lbs`}
Calculated BMI: ${calculation.bmi} kg/m²
Health Category: ${calculation.categoryInfo.category} (Range: ${calculation.categoryInfo.rangeText})
Ideal Healthy Weight Range: ${unitSystem === 'metric' ? `${calculation.minHealthyKg} kg – ${calculation.maxHealthyKg} kg` : `${calculation.minHealthyLbs} lbs – ${calculation.maxHealthyLbs} lbs`}
Clinical Status: ${calculation.weightDifferenceNote}
Guidelines: WHO (World Health Organization) & CDC Standards
Calculated on FreeTools Hub (${typeof window !== 'undefined' ? window.location.origin : ''}/tools/bmi-calculator)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setUnitSystem('metric');
    setHeightCm(175);
    setWeightKg(70);
    setHeightFeet(5);
    setHeightInches(9);
    setWeightLbs(154);
    setAge(28);
    setGender('male');
  };

  // Position percentage along visual bar (clamped 15 to 45 BMI)
  const gaugePercent = Math.min(100, Math.max(0, ((calculation.bmi - 15) / (40 - 15)) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Activity className="w-4 h-4" />
            <span>WHO & CDC Standard Anthropometric Metrics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Body Mass Index (BMI) Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculate your BMI score, health risk category, and ideal target weight range in metric or imperial units.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          {/* Unit System Segmented Switch */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Unit System
            </label>
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleUnitSystemChange('metric')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Metric (cm / kg)
              </button>
              <button
                type="button"
                onClick={() => handleUnitSystemChange('imperial')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Imperial (ft, in / lbs)
              </button>
            </div>
          </div>

          {/* Height Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Height
            </label>
            {unitSystem === 'metric' ? (
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="260"
                  value={heightCm || ''}
                  onChange={(e) => setHeightCm(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="175"
                  className="w-full px-3 py-2.5 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold font-mono text-slate-400">
                  cm
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={heightFeet || ''}
                    onChange={(e) => setHeightFeet(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="5"
                    className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">ft</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightInches || ''}
                    onChange={(e) => setHeightInches(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="9"
                    className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">in</span>
                </div>
              </div>
            )}
          </div>

          {/* Weight Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Weight
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="300"
                step="any"
                value={unitSystem === 'metric' ? weightKg || '' : weightLbs || ''}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  if (unitSystem === 'metric') setWeightKg(val);
                  else setWeightLbs(val);
                }}
                placeholder={unitSystem === 'metric' ? '70' : '154'}
                className="w-full px-3 py-2.5 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold font-mono text-slate-400">
                {unitSystem === 'metric' ? 'kg' : 'lbs'}
              </span>
            </div>
          </div>

          {/* Demographic Context: Age & Gender */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                min="2"
                max="120"
                value={age}
                onChange={(e) => setAge(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: BMI Score & Clinical Analysis (6 cols) */}
        <div className="lg:col-span-6 space-y-5 sticky top-20">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            {/* Primary Score Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Body Mass Index (BMI)
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight mt-0.5">
                  {calculation.bmi}{' '}
                  <span className="text-sm font-sans font-medium text-slate-400">kg/m²</span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`p-3 rounded-xl border text-center self-start sm:self-auto ${calculation.categoryInfo.badgeBg}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  Health Category
                </span>
                <span className={`text-sm font-bold ${calculation.categoryInfo.badgeText}`}>
                  {calculation.categoryInfo.category}
                </span>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>15.0</span>
                <span>18.5</span>
                <span>25.0</span>
                <span>30.0</span>
                <span>40.0+</span>
              </div>

              {/* Colored spectrum track */}
              <div className="relative h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
                <div className="bg-sky-400 h-full w-[14%]" title="Underweight (< 18.5)" />
                <div className="bg-emerald-500 h-full w-[26%]" title="Normal (18.5 – 24.9)" />
                <div className="bg-amber-400 h-full w-[20%]" title="Overweight (25 – 29.9)" />
                <div className="bg-orange-500 h-full w-[20%]" title="Obese I (30 – 34.9)" />
                <div className="bg-red-500 h-full flex-1" title="Severe Obese (35+)" />
              </div>

              {/* Position Needle Marker */}
              <div className="relative h-2 w-full">
                <div
                  className="absolute -top-1 w-2.5 h-2.5 bg-slate-900 dark:bg-white rounded-full ring-2 ring-emerald-500 transition-all duration-300 -translate-x-1/2 shadow-xs"
                  style={{ left: `${gaugePercent}%` }}
                />
              </div>
            </div>

            {/* Ideal Weight Analysis Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span>Ideal Healthy Weight Range for Your Height</span>
              </div>

              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {unitSystem === 'metric'
                  ? `${calculation.minHealthyKg} kg – ${calculation.maxHealthyKg} kg`
                  : `${calculation.minHealthyLbs} lbs – ${calculation.maxHealthyLbs} lbs`}
              </div>

              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {calculation.weightDifferenceNote}
              </p>
            </div>

            {/* Health Risk Guidance */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Clinical Health Guidance:
              </span>
              <p className="text-[11.5px] leading-relaxed">
                {calculation.categoryInfo.healthRisk}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                BMI Prime: {calculation.bmiPrime} · Ponderal: {calculation.ponderalIndex}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 shadow-2xs"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>
          </div>

          {/* WHO BMI Classification Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
              WHO BMI Classification Standards
            </span>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex justify-between py-1.5">
                <span className="text-sky-600 font-medium">Underweight</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">&lt; 18.5</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-emerald-600 font-medium">Normal Weight (Optimal)</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">18.5 – 24.9</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-amber-600 font-medium">Overweight</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">25.0 – 29.9</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-orange-600 font-medium">Obesity (Class I)</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">30.0 – 34.9</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-rose-600 font-medium">Obesity (Class II)</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">35.0 – 39.9</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-red-700 font-medium">Severe Obesity (Class III)</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">&ge; 40.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
