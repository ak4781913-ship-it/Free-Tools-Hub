/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ToolRatingData {
  toolId: string;
  averageRating: number;
  totalVotes: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  userRating: number | null;
  lastRatedAt: string | null;
}

const STORAGE_RATINGS_KEY = 'freetools_hub_ratings_v2';
const USER_RATING_PREFIX = 'freetools_user_rating_';
const RATING_EVENT_NAME = 'freetools_rating_changed';

function createEmptyDistribution(): ToolRatingData['distribution'] {
  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
}

/**
 * Retrieves the user's real local-browser rating for a tool.
 * Never fabricates pre-seeded community votes, fake review counts, or synthetic star averages.
 */
export function getToolRating(toolId: string): ToolRatingData {
  const emptyDistribution = createEmptyDistribution();

  if (typeof localStorage === 'undefined') {
    return {
      toolId,
      averageRating: 0,
      totalVotes: 0,
      distribution: emptyDistribution,
      userRating: null,
      lastRatedAt: null,
    };
  }

  try {
    const rawUserRating = localStorage.getItem(`${USER_RATING_PREFIX}${toolId}`);
    const parsedUserRating = rawUserRating ? parseInt(rawUserRating, 10) : NaN;
    const validUserRating =
      Number.isInteger(parsedUserRating) && parsedUserRating >= 1 && parsedUserRating <= 5
        ? parsedUserRating
        : null;
    const lastRatedAt = localStorage.getItem(`${USER_RATING_PREFIX}${toolId}_time`);

    if (validUserRating !== null) {
      const dist = createEmptyDistribution();
      dist[validUserRating as keyof typeof dist] = 1;
      return {
        toolId,
        averageRating: validUserRating,
        totalVotes: 1,
        distribution: dist,
        userRating: validUserRating,
        lastRatedAt,
      };
    }

    return {
      toolId,
      averageRating: 0,
      totalVotes: 0,
      distribution: emptyDistribution,
      userRating: null,
      lastRatedAt: null,
    };
  } catch (err) {
    console.warn('[ToolRating] Failed to read rating data from localStorage:', err);
    return {
      toolId,
      averageRating: 0,
      totalVotes: 0,
      distribution: emptyDistribution,
      userRating: null,
      lastRatedAt: null,
    };
  }
}

/**
 * Submits or updates the user's 5-star rating for a tool and persists it locally in this browser.
 */
export function submitToolRating(toolId: string, rating: number): ToolRatingData {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  const now = new Date().toISOString();
  const newDist = createEmptyDistribution();
  newDist[rating as keyof typeof newDist] = 1;

  const updatedData: ToolRatingData = {
    toolId,
    averageRating: rating,
    totalVotes: 1,
    distribution: newDist,
    userRating: rating,
    lastRatedAt: now,
  };

  try {
    localStorage.setItem(`${USER_RATING_PREFIX}${toolId}`, rating.toString());
    localStorage.setItem(`${USER_RATING_PREFIX}${toolId}_time`, now);

    const rawAll = localStorage.getItem(STORAGE_RATINGS_KEY);
    const allRatings = rawAll ? JSON.parse(rawAll) : {};
    allRatings[toolId] = {
      averageRating: rating,
      totalVotes: 1,
      distribution: newDist,
      lastUpdated: now,
    };
    localStorage.setItem(STORAGE_RATINGS_KEY, JSON.stringify(allRatings));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(RATING_EVENT_NAME, { detail: { toolId, data: updatedData } })
      );
    }
  } catch (err) {
    console.warn('[ToolRating] Failed to persist rating to localStorage:', err);
  }

  return updatedData;
}

/**
 * Subscribes to rating changes for a specific tool.
 */
export function subscribeToToolRating(
  toolId: string,
  callback: (data: ToolRatingData) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<{ toolId: string; data: ToolRatingData }>;
    if (customEvent.detail && customEvent.detail.toolId === toolId) {
      callback(customEvent.detail.data);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_RATINGS_KEY || e.key === `${USER_RATING_PREFIX}${toolId}`) {
      callback(getToolRating(toolId));
    }
  };

  window.addEventListener(RATING_EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(RATING_EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Subscribes to any tool rating changes.
 */
export function subscribeToAllRatings(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => {
    callback();
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_RATINGS_KEY || (e.key && e.key.startsWith(USER_RATING_PREFIX))) {
      callback();
    }
  };

  window.addEventListener(RATING_EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(RATING_EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Returns a dictionary of ratings for all given tool IDs.
 */
export function getAllToolRatingsMap(toolIds: string[]): Record<string, ToolRatingData> {
  const map: Record<string, ToolRatingData> = {};
  for (const id of toolIds) {
    map[id] = getToolRating(id);
  }
  return map;
}
