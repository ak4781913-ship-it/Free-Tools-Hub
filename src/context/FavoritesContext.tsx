import React, { createContext, useContext, useEffect, useState } from 'react';

export const DEFAULT_FAVORITES = [
  'resume-builder',
  'uae-gratuity',
  'gemini-photo-prompt',
  'image-compressor',
  'color-picker'
];

export interface HistoryEntry {
  toolId: string;
  timestamp: number;
  visitCount: number;
}

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (toolId: string) => boolean;
  toggleFavorite: (toolId: string) => void;
  addFavorite: (toolId: string) => void;
  removeFavorite: (toolId: string) => void;
  clearFavorites: () => void;
  resetFavorites: () => void;
  history: HistoryEntry[];
  recentTools: string[];
  addRecentTool: (toolId: string) => void;
  removeHistoryItem: (toolId: string) => void;
  clearRecents: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('freetools_hub_favorites');
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const savedHistory = localStorage.getItem('freetools_hub_history');
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
      const savedRecents =
        localStorage.getItem('freetools_hub_recent_tools') ||
        localStorage.getItem('freetools_hub_recents');
      if (savedRecents) {
        const parsed: string[] = JSON.parse(savedRecents);
        const now = Date.now();
        return parsed.map((id, idx) => ({
          toolId: id,
          timestamp: now - (idx + 1) * 300000,
          visitCount: 1,
        }));
      }
      // Initial helpful starter history of 5 common workflows so user immediately sees how it works
      const now = Date.now();
      return [
        { toolId: 'resume-builder', timestamp: now - 180000, visitCount: 3 },
        { toolId: 'uae-gratuity', timestamp: now - 450000, visitCount: 2 },
        { toolId: 'gemini-photo-prompt', timestamp: now - 900000, visitCount: 4 },
        { toolId: 'image-compressor', timestamp: now - 1800000, visitCount: 2 },
        { toolId: 'color-picker', timestamp: now - 3600000, visitCount: 3 },
      ];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('freetools_hub_favorites', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('freetools_hub_history', JSON.stringify(history));
      const recentIds = history.map((h) => h.toolId);
      localStorage.setItem('freetools_hub_recents', JSON.stringify(recentIds));
      localStorage.setItem('freetools_hub_recent_tools', JSON.stringify(recentIds.slice(0, 5)));
    } catch {
      // ignore
    }
  }, [history]);

  const isFavorite = (toolId: string) => favorites.includes(toolId);

  const toggleFavorite = (toolId: string) => {
    setFavorites((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const addFavorite = (toolId: string) => {
    setFavorites((prev) => (prev.includes(toolId) ? prev : [...prev, toolId]));
  };

  const removeFavorite = (toolId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== toolId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const resetFavorites = () => {
    setFavorites(DEFAULT_FAVORITES);
  };

  const addRecentTool = (toolId: string) => {
    setHistory((prev) => {
      const existing = prev.find((item) => item.toolId === toolId);
      const visitCount = (existing?.visitCount || 0) + 1;
      const filtered = prev.filter((item) => item.toolId !== toolId);
      const updated: HistoryEntry = {
        toolId,
        timestamp: Date.now(),
        visitCount,
      };
      return [updated, ...filtered].slice(0, 25);
    });
  };

  const removeHistoryItem = (toolId: string) => {
    setHistory((prev) => prev.filter((item) => item.toolId !== toolId));
  };

  const clearRecents = () => {
    setHistory([]);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  // Derived array of string tool IDs for backward compatibility
  const recentTools = history.map((h) => h.toolId);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        resetFavorites,
        history,
        recentTools,
        addRecentTool,
        removeHistoryItem,
        clearRecents,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
