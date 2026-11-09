/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ToolAccessRecord {
  count: number;
  lastAccessed: number;
}

export type ToolPopularityMap = Record<string, ToolAccessRecord>;

const STORAGE_KEY = 'freetools_hub_tool_popularity';
const EVENT_NAME = 'freetools_tool_accessed';

// Initial baseline metrics so new visitors see a populated, helpful trending section
const BASELINE_POPULARITY: ToolPopularityMap = {
  'resume-builder': { count: 52, lastAccessed: Date.now() - 1000 * 60 * 15 },
  'uae-gratuity': { count: 47, lastAccessed: Date.now() - 1000 * 60 * 45 },
  'gemini-photo-prompt': { count: 39, lastAccessed: Date.now() - 1000 * 60 * 90 },
  'seo-page-analyzer': { count: 34, lastAccessed: Date.now() - 1000 * 60 * 120 },
  'image-compressor': { count: 28, lastAccessed: Date.now() - 1000 * 60 * 180 },
  'color-picker': { count: 22, lastAccessed: Date.now() - 1000 * 60 * 240 },
  'loan-calculator': { count: 18, lastAccessed: Date.now() - 1000 * 60 * 300 },
  'json-formatter': { count: 16, lastAccessed: Date.now() - 1000 * 60 * 360 },
};

/**
 * Loads the current access records from localStorage, falling back to baseline seed
 */
export function getStoredToolAccessMap(): ToolPopularityMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with baseline
      localStorage.setItem(STORAGE_KEY, JSON.stringify(BASELINE_POPULARITY));
      return { ...BASELINE_POPULARITY };
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : { ...BASELINE_POPULARITY };
  } catch {
    return { ...BASELINE_POPULARITY };
  }
}

/**
 * Logs a visit/access to a specific tool and increments its frequency counter in localStorage
 */
export function logToolAccess(toolId: string): void {
  if (!toolId) return;

  try {
    const map = getStoredToolAccessMap();
    const existing = map[toolId] || { count: 0, lastAccessed: 0 };

    map[toolId] = {
      count: existing.count + 1,
      lastAccessed: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));

    // Dispatch custom browser event for reactive UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { toolId, count: map[toolId].count },
        })
      );
    }
  } catch (err) {
    console.warn('Unable to log tool access in localStorage:', err);
  }
}

/**
 * Returns the most frequently accessed tool IDs ranked by launch count
 */
export function getPopularToolStats(limit = 6): { toolId: string; count: number; lastAccessed: number }[] {
  const map = getStoredToolAccessMap();

  return Object.entries(map)
    .map(([toolId, data]) => ({
      toolId,
      count: data.count || 0,
      lastAccessed: data.lastAccessed || 0,
    }))
    .sort((a, b) => {
      // First sort by access count descending
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Then tie-break by most recent access
      return b.lastAccessed - a.lastAccessed;
    })
    .slice(0, limit);
}

/**
 * Gets access count for a single tool
 */
export function getToolAccessCount(toolId: string): number {
  const map = getStoredToolAccessMap();
  return map[toolId]?.count || 0;
}

/**
 * Resets tracking metrics back to defaults
 */
export function resetToolTracking(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(BASELINE_POPULARITY));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  } catch {
    // ignore
  }
}

/**
 * Subscribes to tool access events for reactive UI re-renders
 */
export function subscribeToToolAccess(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  });

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
