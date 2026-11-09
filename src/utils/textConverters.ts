export interface TextAnalysisStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  topWords: { word: string; count: number }[];
}

export function analyzeText(text: string): TextAnalysisStats {
  if (!text || text.trim() === '') {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      topWords: [],
    };
  }

  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s/g, '').length;

  const rawWords = text.trim().match(/\b[A-Za-z0-9_\u0600-\u06FF'-]+\b/g) || [];
  const words = rawWords.length;

  // Sentences delimited by ., !, ? followed by space or end
  const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length || (text.trim().length > 0 ? 1 : 0);

  // Paragraphs delimited by non-empty newlines
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;

  // Average reading speed: 200 wpm; speaking speed: 130 wpm
  const readingTimeMinutes = Math.max(0.1, +(words / 200).toFixed(1));
  const speakingTimeMinutes = Math.max(0.1, +(words / 130).toFixed(1));

  // Word frequency
  const frequencyMap: Record<string, number> = {};
  const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said']);

  rawWords.forEach((w) => {
    const clean = w.toLowerCase();
    if (clean.length > 2 && !stopWords.has(clean)) {
      frequencyMap[clean] = (frequencyMap[clean] || 0) + 1;
    }
  });

  const topWords = Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  return {
    words,
    charactersWithSpaces,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    readingTimeMinutes: words === 0 ? 0 : readingTimeMinutes,
    speakingTimeMinutes: words === 0 ? 0 : speakingTimeMinutes,
    topWords,
  };
}

export type CaseConversionType =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'snake'
  | 'kebab'
  | 'alternating';

export function convertTextCase(text: string, type: CaseConversionType): string {
  if (!text) return '';

  switch (type) {
    case 'upper':
      return text.toUpperCase();

    case 'lower':
      return text.toLowerCase();

    case 'title':
      return text
        .toLowerCase()
        .replace(/(?:^|\s|-|\/)[a-z]/g, (match) => match.toUpperCase());

    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase());

    case 'camel': {
      const words = text
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/);
      if (words.length === 0) return '';
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }

    case 'snake':
      return text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .toLowerCase()
        .replace(/^_+|_+$/g, '');

    case 'kebab':
      return text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .toLowerCase()
        .replace(/^-+|-+$/g, '');

    case 'alternating':
      return text
        .split('')
        .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
        .join('');

    default:
      return text;
  }
}

export function cleanExtraSpaces(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
