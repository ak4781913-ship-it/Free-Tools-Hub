export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalHours: number;
  totalWeeks: number;
  dayOfWeekBorn: string;
  nextBirthdayDays: number;
  nextBirthdayDayOfWeek: string;
}

export function calculateAge(birthDateStr: string, targetDateStr?: string): AgeResult | null {
  const birth = new Date(birthDateStr);
  const now = targetDateStr ? new Date(targetDateStr) : new Date();

  if (isNaN(birth.getTime()) || isNaN(now.getTime()) || now < birth) {
    return null;
  }

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffMs = now.getTime() - birth.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalWeeks = Math.floor(totalDays / 7);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekBorn = daysOfWeek[birth.getDay()];

  // Next birthday calculation
  let nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < now) {
    nextBirthday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }

  const msToNext = nextBirthday.getTime() - now.getTime();
  const nextBirthdayDays = Math.ceil(msToNext / (1000 * 60 * 60 * 24));
  const nextBirthdayDayOfWeek = daysOfWeek[nextBirthday.getDay()];

  return {
    years,
    months,
    days,
    totalDays,
    totalHours,
    totalWeeks,
    dayOfWeekBorn,
    nextBirthdayDays,
    nextBirthdayDayOfWeek,
  };
}

export interface DateDiffResult {
  totalDays: number;
  businessDays: number;
  weekendDays: number;
  weeks: number;
  months: number;
  years: number;
  formattedDifference: string;
}

export function calculateDateDifference(
  startDateStr: string,
  endDateStr: string,
  includeEndDate: boolean = false
): DateDiffResult | null {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  // Ensure chronological order
  const [d1, d2] = start <= end ? [start, end] : [end, start];

  let totalDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  if (includeEndDate) {
    totalDays += 1;
  }

  // Count business days (Mon-Fri or custom)
  let businessDays = 0;
  let weekendDays = 0;
  const cur = new Date(d1);
  const targetEnd = new Date(d2);
  if (!includeEndDate) {
    targetEnd.setDate(targetEnd.getDate() - 1);
  }

  while (cur <= targetEnd) {
    const day = cur.getDay();
    if (day === 0 || day === 6) {
      weekendDays++;
    } else {
      businessDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const weeks = +(totalDays / 7).toFixed(1);
  const months = +(totalDays / 30.4375).toFixed(1);
  const years = +(totalDays / 365.25).toFixed(2);

  return {
    totalDays,
    businessDays,
    weekendDays,
    weeks,
    months,
    years,
    formattedDifference: `${totalDays} days (${weeks} weeks or ~${months} months)`,
  };
}

export interface DiscountResult {
  discountAmount: number;
  finalPrice: number;
  savingsPercentage: number;
}

export function calculateDiscount(originalPrice: number, discountPercent: number): DiscountResult {
  if (originalPrice < 0 || discountPercent < 0) {
    return { discountAmount: 0, finalPrice: 0, savingsPercentage: 0 };
  }
  const discountAmount = +(originalPrice * (discountPercent / 100)).toFixed(2);
  const finalPrice = +(Math.max(0, originalPrice - discountAmount)).toFixed(2);
  return {
    discountAmount,
    finalPrice,
    savingsPercentage: discountPercent,
  };
}
