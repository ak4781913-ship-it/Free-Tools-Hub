import React, { useState, useEffect } from 'react';
import { generatePassword, evaluatePasswordStrength, PasswordOptions } from '../../../utils/passwordGenerator';
import { useLanguage } from '../../../context/LanguageContext';
import { ShieldCheck, Copy, RotateCcw, CheckCircle, RefreshCw, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';

export const PasswordGeneratorTool: React.FC = () => {
  const { t } = useLanguage();

  const [options, setOptions] = useState<PasswordOptions>({
    length: 18,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true,
  });

  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const generate = () => {
    const pw = generatePassword(options);
    setPassword(pw);
  };

  useEffect(() => {
    generate();
  }, [options]);

  const toggleCharSet = (
    field: 'includeUppercase' | 'includeLowercase' | 'includeNumbers' | 'includeSymbols',
    checked: boolean
  ) => {
    const next = { ...options, [field]: checked };
    if (
      !next.includeUppercase &&
      !next.includeLowercase &&
      !next.includeNumbers &&
      !next.includeSymbols
    ) {
      return; // Keep at least one character set enabled
    }
    setOptions(next);
  };

  const strength = evaluatePasswordStrength(password);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographically Secure (Web Crypto API)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Strong Password Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate high-entropy, unbreakable passwords directly in your browser without network transmission.
          </p>
        </div>

        <button
          type="button"
          onClick={generate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Random Key</span>
        </button>
      </div>

      {/* Main Password Output Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="relative flex items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            readOnly
            value={password}
            className="w-full p-4 pr-28 text-base sm:text-xl font-mono tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white select-all focus:outline-none"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Entropy & Security Strength:</span>
            <span className="font-bold font-mono">
              {strength.label} (~{strength.entropyBits} bits)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`h-full flex-1 transition-all duration-300 ${
                  lvl <= strength.score ? strength.colorClass.split(' ')[1] : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            <span>Password Length</span>
            <span className="font-mono font-bold text-indigo-600 text-sm">{options.length} characters</span>
          </div>
          <input
            type="range"
            min="6"
            max="64"
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value, 10) })}
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={(e) => toggleCharSet('includeUppercase', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Uppercase Letters
              </span>
              <span className="text-[11px] font-mono text-slate-400">A-Z</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={(e) => toggleCharSet('includeLowercase', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Lowercase Letters
              </span>
              <span className="text-[11px] font-mono text-slate-400">a-z</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.includeNumbers}
              onChange={(e) => toggleCharSet('includeNumbers', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Numbers
              </span>
              <span className="text-[11px] font-mono text-slate-400">0-9</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={(e) => toggleCharSet('includeSymbols', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Symbols & Special Characters
              </span>
              <span className="text-[11px] font-mono text-slate-400">!@#$%^&*()_+</span>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Exclude ambiguous characters (avoid confusing 0 and O, or 1, l and I)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
