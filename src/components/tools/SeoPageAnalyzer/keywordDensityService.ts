import {
  KeywordItem,
  ContentBlockItem,
  KeywordAnalysisData,
} from './seoAnalysisTypes';

// Comprehensive set of English stop words to filter out filler words from keyword analysis
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in',
  'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
  'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where',
  'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'also', 'just', 'like', 'get', 'use', 'will', 'many', 'well', 'see', 'make', 'may', 'much', 'even',
]);

/**
 * Extracts visible text and structured content blocks from an HTML DOM Document
 */
export function extractContentBlocks(doc: Document): {
  blocks: ContentBlockItem[];
  rawText: string;
} {
  const cloned = doc.cloneNode(true) as Document;

  // Remove non-content elements
  const tagsToRemove = ['script', 'style', 'noscript', 'svg', 'canvas', 'iframe', 'template'];
  tagsToRemove.forEach((tag) => {
    cloned.querySelectorAll(tag).forEach((el) => el.remove());
  });

  const body = cloned.body || cloned.documentElement;
  const blocks: ContentBlockItem[] = [];

  // Query significant text-bearing blocks
  const targetElements = body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote');
  let blockIndex = 0;

  targetElements.forEach((el) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 2) {
      blocks.push({
        tag: el.tagName.toLowerCase(),
        text,
        index: blockIndex++,
      });
    }
  });

  // Extract raw body text
  const rawText = (body.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();

  return { blocks, rawText };
}

/**
 * Tokenizes text into lowercase words
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Match words with letters, digits, and internal hyphens
  const matches = text.toLowerCase().match(/\b[a-z0-9]+(?:-[a-z0-9]+)*\b/g);
  return matches || [];
}

/**
 * Checks where a given keyword appears across the page's metadata and structure
 */
export function checkKeywordPresence(
  keyword: string,
  title: string,
  metaDescription: string,
  h1Text: string,
  headings: string[],
  first100Words: string[]
): {
  inTitle: boolean;
  inMetaDescription: boolean;
  inH1: boolean;
  inHeadings: boolean;
  inFirst100Words: boolean;
} {
  const normKw = keyword.toLowerCase().trim();
  const kwRegex = new RegExp(`\\b${escapeRegExp(normKw)}\\b`, 'i');

  const inTitle = kwRegex.test(title || '');
  const inMetaDescription = kwRegex.test(metaDescription || '');
  const inH1 = kwRegex.test(h1Text || '');
  const inHeadings = headings.some((h) => kwRegex.test(h));
  const first100Text = first100Words.join(' ');
  const inFirst100Words = kwRegex.test(first100Text);

  return {
    inTitle,
    inMetaDescription,
    inH1,
    inHeadings,
    inFirst100Words,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Computes Keyword Density Analysis across 1-word, 2-word, and 3-word phrases
 */
export function analyzeKeywordDensity(
  doc: Document,
  title: string = '',
  metaDescription: string = '',
  h1Text: string = '',
  headingsList: string[] = []
): KeywordAnalysisData {
  const { blocks, rawText } = extractContentBlocks(doc);
  const words = tokenizeWords(rawText);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      readingTimeMinutes: 0,
      topKeywords1: [],
      topKeywords2: [],
      topKeywords3: [],
      contentBlocks: [],
      rawVisibleText: '',
      hasKeywordStuffing: false,
      stuffingKeywords: [],
    };
  }

  const uniqueWords = new Set(words).size;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));
  const first100Words = words.slice(0, 100);

  // 1. Single Word Frequencies
  const freq1: Record<string, number> = {};
  words.forEach((w) => {
    if (w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
      freq1[w] = (freq1[w] || 0) + 1;
    }
  });

  // 2. Two-Word Phrases (Bigrams)
  const freq2: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];

    // Filter out if both are stop words, or starts/ends with trivial stop word
    if (STOP_WORDS.has(w1) && STOP_WORDS.has(w2)) continue;
    if (w1.length < 2 || w2.length < 2) continue;
    if (/^\d+$/.test(w1) && /^\d+$/.test(w2)) continue;

    const phrase = `${w1} ${w2}`;
    freq2[phrase] = (freq2[phrase] || 0) + 1;
  }

  // 3. Three-Word Phrases (Trigrams)
  const freq3: Record<string, number> = {};
  for (let i = 0; i < words.length - 2; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    const w3 = words[i + 2];

    if (STOP_WORDS.has(w1) && STOP_WORDS.has(w3)) continue;
    if (w1.length < 2 || w3.length < 2) continue;

    const phrase = `${w1} ${w2} ${w3}`;
    freq3[phrase] = (freq3[phrase] || 0) + 1;
  }

  // Helper to build KeywordItem array
  const buildKeywordItems = (
    freqMap: Record<string, number>,
    wordLen: number,
    minCount: number,
    limit: number
  ): KeywordItem[] => {
    return Object.entries(freqMap)
      .filter(([_, count]) => count >= minCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword, count]) => {
        const density = parseFloat((((count * wordLen) / totalWords) * 100).toFixed(2));
        let status: 'optimal' | 'low' | 'high' = 'optimal';

        if (density > 3.5) {
          status = 'high';
        } else if (density < 1.0) {
          status = 'low';
        }

        const presence = checkKeywordPresence(
          keyword,
          title,
          metaDescription,
          h1Text,
          headingsList,
          first100Words
        );

        return {
          keyword,
          count,
          density,
          status,
          wordCount: wordLen,
          ...presence,
        };
      });
  };

  const topKeywords1 = buildKeywordItems(freq1, 1, 2, 12);
  const topKeywords2 = buildKeywordItems(freq2, 2, 2, 10);
  const topKeywords3 = buildKeywordItems(freq3, 3, 2, 8);

  // Check for Keyword Stuffing Risks (>3.5% density with at least 4 occurrences)
  const stuffingKeywords = topKeywords1
    .filter((k) => k.count >= 4 && k.density > 3.5)
    .map((k) => `${k.keyword} (${k.density}%)`);

  const hasKeywordStuffing = stuffingKeywords.length > 0;

  return {
    totalWords,
    uniqueWords,
    readingTimeMinutes,
    topKeywords1,
    topKeywords2,
    topKeywords3,
    contentBlocks: blocks,
    rawVisibleText: rawText,
    hasKeywordStuffing,
    stuffingKeywords,
  };
}

export interface KeywordOccurrenceSnippet {
  blockTag: string;
  blockIndex: number;
  snippetBefore: string;
  matchedText: string;
  snippetAfter: string;
  fullBlockText: string;
}

/**
 * Searches and extracts contextual occurrence snippets of a keyword from content blocks
 */
export function findKeywordOccurrences(
  blocks: ContentBlockItem[],
  keyword: string
): {
  totalMatches: number;
  occurrences: KeywordOccurrenceSnippet[];
} {
  if (!keyword || !keyword.trim()) {
    return { totalMatches: 0, occurrences: [] };
  }

  const cleaned = keyword.trim().toLowerCase();
  const regex = new RegExp(`\\b(${escapeRegExp(cleaned)})\\b`, 'gi');
  const occurrences: KeywordOccurrenceSnippet[] = [];
  let totalMatches = 0;

  blocks.forEach((block) => {
    const text = block.text;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      totalMatches++;
      const matchIndex = match.index;
      const matchLength = match[0].length;

      // Create a context window around the match
      const start = Math.max(0, matchIndex - 45);
      const end = Math.min(text.length, matchIndex + matchLength + 45);

      const snippetBefore = (start > 0 ? '...' : '') + text.substring(start, matchIndex);
      const matchedText = match[0];
      const snippetAfter = text.substring(matchIndex + matchLength, end) + (end < text.length ? '...' : '');

      occurrences.push({
        blockTag: block.tag,
        blockIndex: block.index,
        snippetBefore,
        matchedText,
        snippetAfter,
        fullBlockText: text,
      });

      // Avoid infinite loop on zero-width match
      if (regex.lastIndex === matchIndex) regex.lastIndex++;
    }
  });

  return { totalMatches, occurrences };
}

/**
 * Evaluates a custom user-typed keyword on the fly
 */
export function evaluateCustomKeyword(
  keyword: string,
  rawText: string,
  totalWords: number,
  title: string,
  metaDescription: string,
  h1Text: string,
  headingsList: string[],
  blocks: ContentBlockItem[]
): KeywordItem & { occurrences: KeywordOccurrenceSnippet[] } {
  const cleaned = keyword.trim().toLowerCase();
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length || 1;

  if (!cleaned || totalWords === 0) {
    return {
      keyword: cleaned,
      count: 0,
      density: 0,
      status: 'low',
      inTitle: false,
      inMetaDescription: false,
      inH1: false,
      inHeadings: false,
      inFirst100Words: false,
      wordCount,
      occurrences: [],
    };
  }

  const { totalMatches, occurrences } = findKeywordOccurrences(blocks, cleaned);
  const density = parseFloat((((totalMatches * wordCount) / totalWords) * 100).toFixed(2));

  let status: 'optimal' | 'low' | 'high' = 'optimal';
  if (density > 3.5) status = 'high';
  else if (density < 1.0) status = 'low';

  const first100Words = tokenizeWords(rawText).slice(0, 100);
  const presence = checkKeywordPresence(
    cleaned,
    title,
    metaDescription,
    h1Text,
    headingsList,
    first100Words
  );

  return {
    keyword: cleaned,
    count: totalMatches,
    density,
    status,
    wordCount,
    ...presence,
    occurrences,
  };
}
