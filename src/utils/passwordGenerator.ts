export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

export interface PasswordStrength {
  score: 1 | 2 | 3 | 4 | 5;
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  entropyBits: number;
  colorClass: string;
}

const UPPERCASE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const UPPERCASE_AMBIGUOUS = 'IO';
const LOWERCASE_CHARS = 'abcdefghijkmnopqrstuvwxyz';
const LOWERCASE_AMBIGUOUS = 'l';
const NUMBER_CHARS = '23456789';
const NUMBER_AMBIGUOUS = '01';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export function generatePassword(options: PasswordOptions): string {
  let charPool = '';
  const guaranteedChars: string[] = [];

  // Helper to pick random from string securely
  const pickRandom = (str: string): string => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return str[array[0] % str.length];
  };

  let upper = UPPERCASE_CHARS;
  if (!options.excludeAmbiguous) upper += UPPERCASE_AMBIGUOUS;
  if (options.includeUppercase) {
    charPool += upper;
    guaranteedChars.push(pickRandom(upper));
  }

  let lower = LOWERCASE_CHARS;
  if (!options.excludeAmbiguous) lower += LOWERCASE_AMBIGUOUS;
  if (options.includeLowercase) {
    charPool += lower;
    guaranteedChars.push(pickRandom(lower));
  }

  let numbers = NUMBER_CHARS;
  if (!options.excludeAmbiguous) numbers += NUMBER_AMBIGUOUS;
  if (options.includeNumbers) {
    charPool += numbers;
    guaranteedChars.push(pickRandom(numbers));
  }

  if (options.includeSymbols) {
    charPool += SYMBOL_CHARS;
    guaranteedChars.push(pickRandom(SYMBOL_CHARS));
  }

  if (!charPool) {
    return '';
  }

  const length = Math.max(guaranteedChars.length, options.length);
  const remainingLength = length - guaranteedChars.length;
  const result: string[] = [...guaranteedChars];

  const randomValues = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(randomValues);

  for (let i = 0; i < remainingLength; i++) {
    result.push(charPool[randomValues[i] % charPool.length]);
  }

  // Cryptographically shuffle the result array (Fisher-Yates with crypto)
  for (let i = result.length - 1; i > 0; i--) {
    const jRand = new Uint32Array(1);
    window.crypto.getRandomValues(jRand);
    const j = jRand[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 1, label: 'Very Weak', entropyBits: 0, colorClass: 'text-red-500 bg-red-500' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropyBits = Math.round(password.length * Math.log2(Math.max(1, poolSize)));

  if (entropyBits < 32 || password.length < 8) {
    return { score: 1, label: 'Very Weak', entropyBits, colorClass: 'text-red-500 bg-red-500' };
  }
  if (entropyBits < 48 || password.length < 10) {
    return { score: 2, label: 'Weak', entropyBits, colorClass: 'text-orange-500 bg-orange-500' };
  }
  if (entropyBits < 64 || password.length < 12) {
    return { score: 3, label: 'Medium', entropyBits, colorClass: 'text-amber-500 bg-amber-500' };
  }
  if (entropyBits < 80 || password.length < 16) {
    return { score: 4, label: 'Strong', entropyBits, colorClass: 'text-emerald-500 bg-emerald-500' };
  }
  return { score: 5, label: 'Very Strong', entropyBits, colorClass: 'text-teal-500 bg-teal-500' };
}
