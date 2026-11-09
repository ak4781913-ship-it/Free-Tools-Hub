import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
  Clock,
  Layers,
  Activity,
  Binary,
  Calculator,
  Calendar,
  CaseSensitive,
  Coins,
  FileJson,
  FileText,
  Globe,
  Landmark,
  Minimize2,
  Percent,
  Pipette,
  QrCode,
  Scale,
  ShieldCheck,
  Tag,
  Type,
  Video,
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

// Icon mapping helper
const renderToolIcon = (name: string, className = 'w-4 h-4') => {
  switch (name) {
    case 'FileText': return <FileText className={className} />;
    case 'Landmark': return <Landmark className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Video': return <Video className={className} />;
    case 'QrCode': return <QrCode className={className} />;
    case 'Minimize2': return <Minimize2 className={className} />;
    case 'Type': return <Type className={className} />;
    case 'CaseSensitive': return <CaseSensitive className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Scale': return <Scale className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Percent': return <Percent className={className} />;
    case 'Coins': return <Coins className={className} />;
    case 'Tag': return <Tag className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Calculator': return <Calculator className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Search': return <Search className={className} />;
    case 'FileJson': return <FileJson className={className} />;
    case 'Binary': return <Binary className={className} />;
    case 'Pipette': return <Pipette className={className} />;
    default: return <Layers className={className} />;
  }
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const { language } = useLanguage();
  const { recentTools } = useFavorites();
  const isUrdu = language === 'ur';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Compute matched tools
  const filteredTools = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Default: Return popular tools first, then recents
      return TOOLS_LIST.filter((t) => t.isPopular || t.isFeatured).slice(0, 8);
    }

    return TOOLS_LIST.filter((tool) => {
      const matchName = tool.name.toLowerCase().includes(trimmed);
      const matchUrduName = tool.nameUrdu.includes(trimmed);
      const matchDesc = tool.shortDescription.toLowerCase().includes(trimmed);
      const matchCategory = tool.categoryName.toLowerCase().includes(trimmed);
      const matchKeywords = tool.keywords.some((kw) => kw.toLowerCase().includes(trimmed));
      const matchId = tool.id.toLowerCase().includes(trimmed);

      return matchName || matchUrduName || matchDesc || matchCategory || matchKeywords || matchId;
    });
  }, [query]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        handleSelect(filteredTools[selectedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (toolId: string) => {
    onSelectTool(toolId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Tool Search"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={isUrdu ? 'کوئی بھی ٹول تلاش کریں (مثلاً: ریزیوم، جی پی ٹی، کمپریس)...' : 'Search all tools by name, keyword, or category...'}
            className="w-full pl-3 pr-10 py-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base focus:outline-hidden font-medium"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / List Area */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40"
        >
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isUrdu ? 'کوئی ٹول نہیں ملا' : `No tools found matching "${query}"`}
              </p>
              <p className="text-xs text-slate-400">
                {isUrdu ? 'الفاظ کی درستگی چیک کریں یا کیٹیگری سے تلاش کریں۔' : 'Try searching for keywords like "pdf", "image", "seo", or "password".'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>{query.trim() ? `${filteredTools.length} Tools Found` : 'Recommended & Popular Tools'}</span>
                <span className="text-[10px] font-mono text-slate-400">Use ↑↓ to navigate, ↵ to open</span>
              </div>

              {filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleSelect(tool.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {renderToolIcon(tool.iconName, 'w-4 h-4')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                          {isUrdu ? tool.nameUrdu : tool.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {isUrdu ? tool.categoryNameUrdu : tool.categoryName}
                        </span>
                        {tool.isPopular && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription}
                      </p>
                    </div>

                    <div className="shrink-0 self-center">
                      <ArrowRight
                        className={`w-4 h-4 transition-transform ${isUrdu ? '-scale-x-100' : ''} ${
                          isSelected
                            ? isUrdu ? 'text-indigo-600 dark:text-indigo-400 -translate-x-1' : 'text-indigo-600 dark:text-indigo-400 translate-x-1'
                            : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Hotkey Hints */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              <span className="text-[11px] ml-0.5">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              <span className="text-[11px] ml-0.5">Open Tool</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">ESC</kbd>
              <span className="text-[11px] ml-0.5">Close</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            FreeTools Hub · 100% Client-Side
          </span>
        </div>
      </div>
    </div>
  );
};
