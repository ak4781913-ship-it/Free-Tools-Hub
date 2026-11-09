export interface TimezoneItem {
  id: string; // IANA identifier e.g. "Asia/Dubai"
  city: string;
  country: string;
  region: string;
  flag: string;
  utcOffsetDisplay: string;
}

export const TIMEZONE_LIST: TimezoneItem[] = [
  { id: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪', utcOffsetDisplay: 'UTC+4' },
  { id: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', region: 'Middle East', flag: '🇸🇦', utcOffsetDisplay: 'UTC+3' },
  { id: 'Asia/Qatar', city: 'Doha', country: 'Qatar', region: 'Middle East', flag: '🇶🇦', utcOffsetDisplay: 'UTC+3' },
  { id: 'Asia/Kuwait', city: 'Kuwait City', country: 'Kuwait', region: 'Middle East', flag: '🇰🇼', utcOffsetDisplay: 'UTC+3' },
  { id: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', region: 'South Asia', flag: '🇵🇰', utcOffsetDisplay: 'UTC+5' },
  { id: 'Asia/Kolkata', city: 'New Delhi / Mumbai', country: 'India', region: 'South Asia', flag: '🇮🇳', utcOffsetDisplay: 'UTC+5:30' },
  { id: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', region: 'South Asia', flag: '🇧🇩', utcOffsetDisplay: 'UTC+6' },
  { id: 'Europe/London', city: 'London', country: 'United Kingdom', region: 'Europe', flag: '🇬🇧', utcOffsetDisplay: 'UTC+1 / UTC+0' },
  { id: 'Europe/Paris', city: 'Paris', country: 'France', region: 'Europe', flag: '🇫🇷', utcOffsetDisplay: 'UTC+2 / UTC+1' },
  { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany', region: 'Europe', flag: '🇩🇪', utcOffsetDisplay: 'UTC+2 / UTC+1' },
  { id: 'Europe/Rome', city: 'Rome', country: 'Italy', region: 'Europe', flag: '🇮🇹', utcOffsetDisplay: 'UTC+2 / UTC+1' },
  { id: 'Europe/Madrid', city: 'Madrid', country: 'Spain', region: 'Europe', flag: '🇪🇸', utcOffsetDisplay: 'UTC+2 / UTC+1' },
  { id: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', region: 'Europe', flag: '🇳🇱', utcOffsetDisplay: 'UTC+2 / UTC+1' },
  { id: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', region: 'Europe', flag: '🇨🇭', utcOffsetDisplay: 'UTC+2 / UTC+1' },
  { id: 'America/New_York', city: 'New York', country: 'United States (Eastern)', region: 'North America', flag: '🇺🇸', utcOffsetDisplay: 'UTC-4 / UTC-5' },
  { id: 'America/Chicago', city: 'Chicago', country: 'United States (Central)', region: 'North America', flag: '🇺🇸', utcOffsetDisplay: 'UTC-5 / UTC-6' },
  { id: 'America/Denver', city: 'Denver', country: 'United States (Mountain)', region: 'North America', flag: '🇺🇸', utcOffsetDisplay: 'UTC-6 / UTC-7' },
  { id: 'America/Los_Angeles', city: 'Los Angeles / San Francisco', country: 'United States (Pacific)', region: 'North America', flag: '🇺🇸', utcOffsetDisplay: 'UTC-7 / UTC-8' },
  { id: 'America/Toronto', city: 'Toronto', country: 'Canada', region: 'North America', flag: '🇨🇦', utcOffsetDisplay: 'UTC-4 / UTC-5' },
  { id: 'America/Vancouver', city: 'Vancouver', country: 'Canada', region: 'North America', flag: '🇨🇦', utcOffsetDisplay: 'UTC-7 / UTC-8' },
  { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', region: 'East Asia', flag: '🇯🇵', utcOffsetDisplay: 'UTC+9' },
  { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', region: 'Southeast Asia', flag: '🇸🇬', utcOffsetDisplay: 'UTC+8' },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', region: 'East Asia', flag: '🇭🇰', utcOffsetDisplay: 'UTC+8' },
  { id: 'Asia/Shanghai', city: 'Shanghai / Beijing', country: 'China', region: 'East Asia', flag: '🇨🇳', utcOffsetDisplay: 'UTC+8' },
  { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', region: 'East Asia', flag: '🇰🇷', utcOffsetDisplay: 'UTC+9' },
  { id: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', region: 'Southeast Asia', flag: '🇹🇭', utcOffsetDisplay: 'UTC+7' },
  { id: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', region: 'Southeast Asia', flag: '🇲🇾', utcOffsetDisplay: 'UTC+8' },
  { id: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', region: 'Southeast Asia', flag: '🇮🇩', utcOffsetDisplay: 'UTC+7' },
  { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia', region: 'Oceania', flag: '🇦🇺', utcOffsetDisplay: 'UTC+10 / UTC+11' },
  { id: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', region: 'Oceania', flag: '🇦🇺', utcOffsetDisplay: 'UTC+10 / UTC+11' },
  { id: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', region: 'Oceania', flag: '🇳🇿', utcOffsetDisplay: 'UTC+12 / UTC+13' },
  { id: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', region: 'Africa', flag: '🇪🇬', utcOffsetDisplay: 'UTC+3 / UTC+2' },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', region: 'Africa', flag: '🇿🇦', utcOffsetDisplay: 'UTC+2' },
  { id: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', region: 'South America', flag: '🇧🇷', utcOffsetDisplay: 'UTC-3' },
  { id: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', region: 'Europe / Asia', flag: '🇹🇷', utcOffsetDisplay: 'UTC+3' },
  { id: 'UTC', city: 'UTC / GMT', country: 'Coordinated Universal Time', region: 'Global', flag: '🌐', utcOffsetDisplay: 'UTC+0' },
];

export interface ConvertedTimeDetails {
  dateString: string;
  time12: string;
  time24: string;
  dayOfWeek: string;
  timeZoneAbbr: string;
  hours: number;
  minutes: number;
  fullFormatted: string;
  isBusinessHours: boolean; // 9am - 5pm
}

export function formatTimeInZone(date: Date, timeZone: string): ConvertedTimeDetails {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return {
      dateString: 'Select a valid date',
      time12: '--:--',
      time24: '--:--',
      dayOfWeek: '—',
      timeZoneAbbr: timeZone,
      hours: 12,
      minutes: 0,
      fullFormatted: 'Invalid date/time',
      isBusinessHours: false,
    };
  }

  try {
    const formatter12 = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const formatter24 = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const formatterDate = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const formatterDay = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
    });

    const formatterParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZoneName: 'short',
    }).formatToParts(date);

    const timeZoneAbbr = formatterParts.find((p) => p.type === 'timeZoneName')?.value || '';
    const hourPart = parseInt(formatterParts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minutePart = parseInt(formatterParts.find((p) => p.type === 'minute')?.value || '0', 10);

    const time12 = formatter12.format(date);
    const time24 = formatter24.format(date);
    const dateString = formatterDate.format(date);
    const dayOfWeek = formatterDay.format(date);

    // Business hours between 09:00 and 17:00 (5 PM)
    const isBusinessHours = hourPart >= 9 && hourPart < 17;

    return {
      dateString,
      time12,
      time24,
      dayOfWeek,
      timeZoneAbbr,
      hours: hourPart,
      minutes: minutePart,
      fullFormatted: `${time12} (${dayOfWeek}, ${dateString})`,
      isBusinessHours,
    };
  } catch {
    return {
      dateString: 'Unavailable',
      time12: '--:--',
      time24: '--:--',
      dayOfWeek: 'Unknown',
      timeZoneAbbr: timeZone,
      hours: 12,
      minutes: 0,
      fullFormatted: 'Unavailable',
      isBusinessHours: true,
    };
  }
}
