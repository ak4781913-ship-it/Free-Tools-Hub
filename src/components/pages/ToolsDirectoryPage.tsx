import React, { useState, useMemo, useEffect } from 'react';
import { TOOLS_LIST } from '../../data/tools';
import { TOOL_ROUTES, CATEGORY_GROUPS, ToolCategoryGroup, getToolPrimaryPath } from '../../data/toolsRouting';
import { ToolCard } from '../home/ToolCard';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  getAllToolRatingsMap,
  subscribeToAllRatings,
  ToolRatingData,
} from '../../utils/toolRatingStorage';
import {
  Layers,
  Search,
  Sparkles,
  Briefcase,
  Calculator,
  Image as ImageIcon,
  FileText,
  Video,
  Wrench,
  Star,
  X,
  SlidersHorizontal,
  Home,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';

interface ToolsDirectoryPageProps {
  onNavigateTo: (path: string) => void;
  initialCategory?: string;
}

export type ToolSortOption = 'recommended' | 'name-asc' | 'name-desc' | 'my-rated';

export const ToolsDirectoryPage: React.FC<ToolsDirectoryPageProps> = ({
  onNavigateTo,
  initialCategory,
}) => {
  const { language, dir } = useLanguage();
  const { favorites } = useFavorites();
  const isUrdu = language === 'ur';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [sortBy, setSortBy] = useState<ToolSortOption>('recommended');

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  // Live map of local user ratings for all tools
  const [ratingsMap, setRatingsMap] = useState<Record<string, ToolRatingData>>(() =>
    getAllToolRatingsMap(TOOLS_LIST.map((t) => t.id))
  );

  useEffect(() => {
    const refreshRatings = () => {
      setRatingsMap(getAllToolRatingsMap(TOOLS_LIST.map((t) => t.id)));
    };
    const unsubscribe = subscribeToAllRatings(refreshRatings);
    return () => unsubscribe();
  }, []);

  const userRatedCount = useMemo(() => {
    return TOOLS_LIST.filter((tool) => ratingsMap[tool.id]?.userRating !== null).length;
  }, [ratingsMap]);

  const categories = useMemo(() => {
    return [
      { id: 'all', name: 'All Tools', nameUrdu: 'تمام ٹولز', icon: Layers, count: TOOLS_LIST.length },
      { id: 'career-cv', name: 'Career & CV', nameUrdu: 'کیریئر اور سی وی', icon: Briefcase, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'career-cv').length },
      { id: 'uae-calculators', name: 'UAE Calculators', nameUrdu: 'یو اے ای کیلکولیٹرز', icon: Calculator, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'uae-calculators').length },
      { id: 'ai-tools', name: 'AI Tools', nameUrdu: 'اے آئی ٹولز', icon: Sparkles, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'ai-tools').length },
      { id: 'photo-image', name: 'Photo & Image', nameUrdu: 'تصویری ٹولز', icon: ImageIcon, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'photo-image').length },
      { id: 'pdf-tools', name: 'PDF Tools Suite', nameUrdu: 'پی ڈی ایف ٹولز سوٹ', icon: FileText, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'pdf-tools').length },
      { id: 'video-content', name: 'Video & Content', nameUrdu: 'ویڈیو اور کنٹینٹ', icon: Video, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'video-content').length },
      { id: 'other-utilities', name: 'Other Utilities', nameUrdu: 'دیگر مفید اوزار', icon: Wrench, count: Object.values(TOOL_ROUTES).filter(r => r.categoryGroup === 'other-utilities').length },
      { id: 'favorites', name: 'Favorites', nameUrdu: 'پسندیدہ ٹولز', icon: Star, count: favorites.length },
      ...(userRatedCount > 0
        ? [{ id: 'rated-by-me', name: 'Rated by Me', nameUrdu: 'میری ریٹنگز', icon: Star, count: userRatedCount }]
        : []),
    ];
  }, [favorites.length, userRatedCount]);

  const filteredTools = useMemo(() => {
    let result = TOOLS_LIST.filter((tool) => {
      const route = TOOL_ROUTES[tool.id];

      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(tool.id)) return false;
      } else if (selectedCategory === 'rated-by-me') {
        if (ratingsMap[tool.id]?.userRating === null) return false;
      } else if (selectedCategory !== 'all') {
        if (route?.categoryGroup !== selectedCategory) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = tool.name.toLowerCase().includes(query) || (tool.nameUrdu && tool.nameUrdu.includes(query));
        const matchesDesc = tool.shortDescription.toLowerCase().includes(query) || (tool.shortDescriptionUrdu && tool.shortDescriptionUrdu.includes(query));
        const matchesKeywords = tool.keywords.some((k) => k.toLowerCase().includes(query));
        const matchesCategory = tool.categoryName.toLowerCase().includes(query);

        return matchesName || matchesDesc || matchesKeywords || matchesCategory;
      }

      return true;
    });

    // Sort order
    if (sortBy === 'my-rated') {
      result = [...result].sort((a, b) => {
        const ratingA = ratingsMap[a.id]?.userRating || 0;
        const ratingB = ratingsMap[b.id]?.userRating || 0;
        return ratingB - ratingA;
      });
    } else if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => {
        const nameA = isUrdu ? a.nameUrdu : a.name;
        const nameB = isUrdu ? b.nameUrdu : b.name;
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => {
        const nameA = isUrdu ? a.nameUrdu : a.name;
        const nameB = isUrdu ? b.nameUrdu : b.name;
        return nameB.localeCompare(nameA);
      });
    }

    return result;
  }, [selectedCategory, searchQuery, favorites, sortBy, ratingsMap, isUrdu]);


  const handleOpenTool = (toolId: string) => {
    const primaryPath = getToolPrimaryPath(toolId);
    onNavigateTo(primaryPath);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Breadcrumb Navigation Header */}
      <div className="w-full max-w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
            <a
              href="/"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onNavigateTo('/');
                }
              }}
              className="hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 transition-colors font-medium shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہوم' : 'Home'}</span>
            </a>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {isUrdu ? 'تمام ٹولز ڈائرکٹری' : 'All Tools Directory'}
            </span>
          </nav>

          <a
            href="/"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateTo('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[34px] text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
          >
            {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isUrdu ? 'واپس ہوم' : 'Back'}</span>
          </a>
        </div>
      </div>

      {/* Directory Hero Banner */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>{isUrdu ? `${TOOLS_LIST.length} مفت آن لائن ٹولز کی مکمل ڈائرکٹری` : `Complete Directory · ${TOOLS_LIST.length} Free Online Utilities`}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
            {isUrdu ? 'تمام ویب ٹولز اور کیلکولیٹرز' : 'All Tools & Calculators'}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {isUrdu
              ? 'پیشہ ورانہ سی وی میکر، یو اے ای سیلری و گریجویٹی کیلکولیٹرز، اے آئی امیج اور ویڈیو پرامپٹس، اور روزمرہ کے تمام ٹولز۔ ہر ٹول کا اپنا الگ صفحہ ہے۔'
              : 'Browse our complete catalog of career builders, UAE salary & end-of-service calculators, AI image & video prompt generators, and developer utilities. Every tool opens on its own dedicated page.'}
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto pt-3 w-full">
            <div className="relative w-full">
              <label htmlFor="directory-search-input" className="sr-only">
                {isUrdu ? 'ٹول تلاش کریں' : 'Search tools by name, category, or keyword'}
              </label>
              <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="directory-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUrdu ? 'نام، فیچر یا کی ورڈ سے ٹول تلاش کریں...' : 'Search by tool name, category, or keyword...'}
                className="w-full min-w-0 pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm shadow-2xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Directory Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-w-0">
        {/* Category Pills Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{isUrdu ? cat.nameUrdu : cat.name}</span>
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    isSelected
                      ? 'text-blue-100 font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Header & Sorting Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery ? (
              <span>
                {isUrdu ? `تلاش کے نتائج برائے "${searchQuery}":` : `Showing search results for "${searchQuery}":`}
                <strong className="text-slate-900 dark:text-white font-semibold ml-1">
                  {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
                </strong>
              </span>
            ) : (
              <span>
                {isUrdu ? 'دستیاب ٹولز کی تعداد:' : 'Showing:'}
                <strong className="text-slate-900 dark:text-white font-semibold ml-1">
                  {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
                </strong>
              </span>
            )}

            {selectedCategory === 'rated-by-me' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{isUrdu ? 'میری محفوظ کردہ ریٹنگز' : 'Rated in This Browser'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="tools-sort-select" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isUrdu ? 'ترتیب:' : 'Sort by:'}
              </label>
              <select
                id="tools-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ToolSortOption)}
                aria-label={isUrdu ? 'ٹولز کی ترتیب منتخب کریں' : 'Select sorting order'}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="recommended" className="dark:bg-slate-900">
                  {isUrdu ? 'تجویز کردہ' : 'Featured Order'}
                </option>
                <option value="name-asc" className="dark:bg-slate-900">
                  {isUrdu ? 'نام (الف تا ے)' : 'Name (A - Z)'}
                </option>
                <option value="name-desc" className="dark:bg-slate-900">
                  {isUrdu ? 'نام (ے تا الف)' : 'Name (Z - A)'}
                </option>
                <option value="my-rated" className="dark:bg-slate-900">
                  {isUrdu ? '★ میری ریٹنگز پہلے' : '★ Rated by Me First'}
                </option>
              </select>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Free · Client-Side Private</span>
            </div>
          </div>
        </div>

        {/* Tool Cards Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={(id) => handleOpenTool(id)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'کوئی ٹول نہیں ملا' : 'No tools matched your criteria'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isUrdu
                ? 'براہ کرم کوئی دوسرا لفظ تلاش کریں یا کیٹیگری فلٹر ختم کریں۔'
                : 'Try adjusting your search query or selecting a different category from above.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              {isUrdu ? 'تمام ٹولز دکھائیں' : 'Reset Filters & Show All'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
