import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { generatePassword } from '../../../utils/passwordGenerator';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  KeyRound,
  Sparkles,
  Lock,
  RefreshCw,
  Cpu,
  Server,
  Zap,
} from 'lucide-react';

// Common weak / leaked passwords list
const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'qwerty',
  'dragon',
  'pussy',
  'baseball',
  'football',
  'letmein',
  'monkey',
  'master',
  'shadow',
  'mustang',
  'michael',
  'superman',
  'access',
  'batman',
  'trustno1',
  'iloveyou',
  'welcome',
  'admin',
  'administrator',
  'password1',
  'password123',
  'pass1234',
  'login',
  'secret',
  'freedom',
  'default',
  'starwars',
  'sunshine',
  'princess',
  'charlie',
  'system',
  'testing',
  'test123',
  'guest',
]);

const KEYBOARD_PATTERNS = [
  'qwerty',
  'asdfgh',
  'zxcvbn',
  'qwertz',
  'azerty',
  '123456',
  '234567',
  '345678',
  '456789',
  '567890',
  'abcdef',
  'bcdefg',
  'cdefgh',
];

export const PasswordStrengthTool: React.FC = () => {
  const { language } = useLanguage();

  const [password, setPassword] = useState<string>('Tr0ub4dor&3#2026');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Analysis computation
  const analysis = useMemo(() => {
    const pwd = password;
    const len = pwd.length;

    if (!pwd) {
      return {
        score: 0,
        label: 'Empty',
        color: 'text-slate-400',
        barColor: 'bg-slate-300 dark:bg-slate-700',
        entropy: 0,
        crackTimeOnline: 'Instant',
        crackTimeGpu: 'Instant',
        crackTimeSupercomputer: 'Instant',
        checks: {
          length8: false,
          length12: false,
          length16: false,
          hasUpper: false,
          hasLower: false,
          hasNumber: false,
          hasSymbol: false,
          hasDiversity: false,
        },
        warnings: [],
        suggestions: ['Enter a password to begin real-time security analysis.'],
      };
    }

    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

    // Calculate pool size
    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSymbol) poolSize += 33;

    // Unique characters ratio
    const uniqueChars = new Set(pwd.split('')).size;
    const hasDiversity = uniqueChars / len >= 0.65;

    // Base Shannon Entropy (bits)
    let entropy = poolSize > 0 ? Math.round(len * Math.log2(poolSize)) : 0;

    // Warnings detection
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const lowerPwd = pwd.toLowerCase();

    // 1. Common password check
    if (COMMON_WEAK_PASSWORDS.has(lowerPwd)) {
      warnings.push('This is among the most frequently breached passwords in data dumps.');
      entropy = Math.min(entropy, 15);
    }

    // 2. Keyboard walks / sequences
    for (const pattern of KEYBOARD_PATTERNS) {
      if (lowerPwd.includes(pattern)) {
        warnings.push(`Contains predictable keyboard sequence ("${pattern}").`);
        entropy = Math.max(0, entropy - 15);
        break;
      }
    }

    // 3. Repeated consecutive characters
    if (/(.)\1{2,}/.test(pwd)) {
      warnings.push('Contains 3 or more repeated identical characters in a row.');
      entropy = Math.max(0, entropy - 10);
    }

    // 4. Common year pattern (1950 - 2035)
    if (/(19[5-9]\d|20[0-3]\d)/.test(pwd)) {
      warnings.push('Contains a 4-digit calendar year, making it prone to targeted dictionary attacks.');
      entropy = Math.max(0, entropy - 10);
    }

    // Suggestions based on missing criteria
    if (len < 12) {
      suggestions.push('Aim for at least 12 to 16 characters to prevent brute-force cracking.');
    }
    if (!hasUpper) {
      suggestions.push('Add uppercase letters (A-Z) to expand character space.');
    }
    if (!hasLower) {
      suggestions.push('Add lowercase letters (a-z).');
    }
    if (!hasNumber) {
      suggestions.push('Include numbers (0-9) distributed non-sequentially.');
    }
    if (!hasSymbol) {
      suggestions.push('Add special symbols (e.g., ! @ # $ % ^ & *).');
    }
    if (uniqueChars < 8 && len >= 8) {
      suggestions.push('Increase character variety; repeated letters reduce entropy.');
    }

    // Normalize Score: 0 to 100
    let score = 0;
    if (len >= 8) score += 20;
    if (len >= 12) score += 20;
    if (len >= 16) score += 15;
    if (hasLower && hasUpper) score += 15;
    if (hasNumber) score += 15;
    if (hasSymbol) score += 15;
    if (hasDiversity) score += 10;
    if (warnings.length > 0) score = Math.max(5, score - warnings.length * 20);
    score = Math.min(100, Math.max(5, score));

    // Score label & color
    let label = 'Very Weak';
    let color = 'text-rose-600 dark:text-rose-400';
    let barColor = 'bg-rose-500';

    if (score >= 85) {
      label = 'Very Strong';
      color = 'text-emerald-600 dark:text-emerald-400';
      barColor = 'bg-emerald-500';
    } else if (score >= 65) {
      label = 'Strong';
      color = 'text-teal-600 dark:text-teal-400';
      barColor = 'bg-teal-500';
    } else if (score >= 45) {
      label = 'Moderate';
      color = 'text-amber-600 dark:text-amber-400';
      barColor = 'bg-amber-500';
    } else if (score >= 25) {
      label = 'Weak';
      color = 'text-orange-600 dark:text-orange-400';
      barColor = 'bg-orange-500';
    }

    // Estimate crack times
    // Total combinations = 2^entropy
    // Online throttled: 100 guesses/sec (e.g. web login with rate limits)
    // Fast GPU hash (e.g. 10 billion hashes/sec for NTLM/MD5 or 100M/sec for bcrypt/sha256)
    // Supercomputer cluster (10 trillion guesses/sec)
    const formatTime = (seconds: number): string => {
      if (seconds < 1) return 'Instant (< 1 second)';
      if (seconds < 60) return `${Math.round(seconds)} seconds`;
      if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
      if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
      if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
      if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
      const years = seconds / 31536000;
      if (years < 1000) return `${Math.round(years).toLocaleString()} years`;
      if (years < 1000000) return `${Math.round(years / 1000).toLocaleString()} millennia (thousand years)`;
      if (years < 1000000000) return `${(years / 1000000).toFixed(1)} million years`;
      return `${(years / 1000000000).toFixed(1)} billion years (practically uncrackable)`;
    };

    const combinations = Math.pow(2, entropy);
    const crackTimeOnline = formatTime(combinations / 100);
    const crackTimeGpu = formatTime(combinations / 1000000000);
    const crackTimeSupercomputer = formatTime(combinations / 10000000000000);

    return {
      score,
      label,
      color,
      barColor,
      entropy,
      crackTimeOnline,
      crackTimeGpu,
      crackTimeSupercomputer,
      checks: {
        length8: len >= 8,
        length12: len >= 12,
        length16: len >= 16,
        hasUpper,
        hasLower,
        hasNumber,
        hasSymbol,
        hasDiversity,
      },
      warnings,
      suggestions: suggestions.length > 0 ? suggestions : ['Great job! This password meets recommended security standards.'],
    };
  }, [password]);

  // Generate a cryptographically secure password via Web Crypto API
  const generateNewPassword = () => {
    const securePwd = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: true,
    });
    setPassword(securePwd);
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Security Auditor
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                <Lock className="w-3 h-3 text-slate-500" />
                100% Client-Side Private
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === 'ur' ? 'پاس ورڈ کی طاقت کا تجزیہ کار' : 'Password Strength Checker'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {language === 'ur'
                ? 'اپنے پاس ورڈ کی لمبائی، اینٹروپی، اور کریک ہونے کے متوقع وقت کا فوری جائزہ لیں بغیر کسی ڈیٹا کو محفوظ کیے۔'
                : 'Evaluate entropy, brute-force resistance, dictionary vulnerabilities, and estimated crack times in real-time.'}
            </p>
          </div>

          <button
            type="button"
            onClick={generateNewPassword}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Strong Password</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Checker Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Password Input Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Enter Password to Test
            </label>
            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password..."
                spellCheck="false"
                className="w-full pl-4 pr-24 py-3.5 text-lg font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
              <div className="absolute inset-y-0 right-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy password"
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-6">
              <span className="text-[11px] text-slate-400">Test presets:</span>
              <button
                type="button"
                onClick={() => setPassword('password123')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] transition-colors"
              >
                password123
              </button>
              <button
                type="button"
                onClick={() => setPassword('Summer2026!')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] transition-colors"
              >
                Summer2026!
              </button>
              <button
                type="button"
                onClick={() => setPassword('CorrectHorseBatteryStaple')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] transition-colors"
              >
                Passphrase
              </button>
              <button
                type="button"
                onClick={() => setPassword('9#mK$2vL!pQ8~xR7')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] transition-colors"
              >
                High Entropy
              </button>
            </div>

            {/* Strength Score Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${analysis.color}`} />
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Security Level</span>
                    <span className={`text-lg font-black tracking-tight ${analysis.color}`}>
                      {analysis.label} ({analysis.score}/100)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Entropy</span>
                  <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                    {analysis.entropy} bits
                  </span>
                </div>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${analysis.barColor}`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 Very Weak</span>
                <span>40 Moderate</span>
                <span>80+ Resilient</span>
              </div>
            </div>
          </div>

          {/* Time to Crack Estimates */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Estimated Brute-Force Crack Times
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Online Attack */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <Server className="w-3.5 h-3.5 text-blue-500" />
                  <span>Online Attack</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">Rate-limited web login (100 guesses/sec)</p>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {analysis.crackTimeOnline}
                </p>
              </div>

              {/* Fast Consumer GPU */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Offline GPU Rig</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">Exposed hash dump (1B guesses/sec)</p>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {analysis.crackTimeGpu}
                </p>
              </div>

              {/* Supercomputer */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Supercomputer Cluster</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">Advanced nation-state (10T guesses/sec)</p>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {analysis.crackTimeSupercomputer}
                </p>
              </div>
            </div>
          </div>

          {/* Warnings & Suggestions */}
          {analysis.warnings.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Security Vulnerabilities</span>
              </div>
              <ul className="space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
                {analysis.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Requirements & Checklist Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Criteria Checklist */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Security Criteria Checklist
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Minimum 8 characters', ok: analysis.checks.length8 },
                { label: 'Recommended 12+ characters', ok: analysis.checks.length12 },
                { label: 'High security 16+ characters', ok: analysis.checks.length16 },
                { label: 'Contains uppercase letter (A-Z)', ok: analysis.checks.hasUpper },
                { label: 'Contains lowercase letter (a-z)', ok: analysis.checks.hasLower },
                { label: 'Contains numbers (0-9)', ok: analysis.checks.hasNumber },
                { label: 'Contains special symbols (!@#$%)', ok: analysis.checks.hasSymbol },
                { label: 'Character diversity ratio', ok: analysis.checks.hasDiversity },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span
                    className={
                      item.ok
                        ? 'text-slate-800 dark:text-slate-200 font-medium'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  >
                    {item.label}
                  </span>
                  {item.ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Recommendations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recommendations
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {analysis.suggestions.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Transmission Privacy</span>
            </div>
            All mathematical calculations and pattern heuristics occur strictly inside your local browser tab. No password or hash is ever sent over the network.
          </div>
        </div>
      </div>
    </div>
  );
};
