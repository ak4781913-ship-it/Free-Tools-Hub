import React, { useState, useMemo } from 'react';
import { ToolDefinition } from '../../types';
import { TOOLS_LIST } from '../../data/tools';
import { ToolCard } from './ToolCard';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  Layers,
  Zap,
  Landmark,
  Code,
  Calculator,
  Sparkles,
  Star,
  SearchX,
  X,
} from 'lucide-react';

export type FilterTabId =
  | 'all'
  | 'productivity'
  | 'finance'
  | 'development'
  | 'calculators'
  | 'ai-prompts'
  | 'favorites';

interface ToolsGridProps {
  searchQuery: string;
  onSelectTool: (toolId: string) => void;
  onClearSearch: () => void;
}

const FEATURED_TOOL_IDS = [
  'resume-builder',
  'uae-salary-calculator',
  'uae-gratuity',
  'gemini-photo-prompt',
  'ai-video-prompt',
  'seo-page-analyzer',
];

const FINANCE_TOOL_IDS = new Set([
  'uae-salary-calculator',
  'uae-gratuity',
  'loan-calculator',
  'currency-converter',
  'discount-calculator',
  'percentage-calculator',
  'crypto-converter',
]);

const DEVELOPMENT_TOOL_IDS = new Set([
  'seo-page-analyzer',
  'seo-meta-generator',
  'json-formatter',
  'base64-converter',
  'color-picker',
  'qr-generator',
  'markdown-editor',
  'password-generator',
  'password-strength',
]);

const PRODUCTIVITY_TOOL_IDS = new Set([
  'resume-builder',
  'unit-converter',
  'timezone-converter',
  'word-counter',
  'text-case-converter',
  'password-generator',
  'password-strength',
  'markdown-editor',
  'qr-generator',
  'image-compressor',
]);

const CALCULATOR_TOOL_IDS = new Set([
  'uae-salary-calculator',
  'uae-gratuity',
  'age-calculator',
  'date-difference',
  'percentage-calculator',
  'currency-converter',
  'discount-calculator',
  'bmi-calculator',
  'loan-calculator',
  'crypto-converter',
  'unit-converter',
]);

const AI_PROMPT_TOOL_IDS = new Set([
  'gemini-photo-prompt',
  'ai-video-prompt',
]);

export const ToolsGrid: React.FC<ToolsGridProps> = ({
  searchQuery,
  onSelectTool,
  onClearSearch,
}) => {
  const { language } = useLanguage();
  const { favorites } = useFavorites();
  const isUrdu = language === 'ur';

  const [activeTab, setActiveTab] = useState<FilterTabId>('all');
  const totalTools = TOOLS_LIST.length;

  const featuredTools = useMemo(() => {
    return FEATURED_TOOL_IDS.map((id) => TOOLS_LIST.find((t) => t.id === id)).filter(
      (t): t is ToolDefinition => Boolean(t)
    );
  }, []);

  const tabDefinitions: {
    id: FilterTabId;
    label: string;
    labelUrdu: string;
    icon: React.ElementType;
    description: string;
    descriptionUrdu: string;
  }[] = [
    {
      id: 'all',
      label: 'All Tools',
      labelUrdu: 'تمام ٹولز',
      icon: Layers,
      description: `Browse all ${totalTools} standalone web utilities and calculators running directly in your browser.`,
      descriptionUrdu: `تمام ${totalTools} تیز رفتار اور مکمل پرائیویسی کے ساتھ چلنے والے براؤزر ٹولز کا جائزہ لیں۔`,
    },
    {
      id: 'finance',
      label: 'UAE & Finance',
      labelUrdu: 'یو اے ای و مالیات',
      icon: Landmark,
      description: 'UAE monthly salary breakdown, end-of-service gratuity estimator, loan EMI, live currency, and discount calculators.',
      descriptionUrdu: 'یو اے ای سیلری، گریجویٹی، بینک لون، کرنسی ریٹس اور ڈسکاؤنٹ کے مالیاتی کیلکولیٹرز۔',
    },
    {
      id: 'productivity',
      label: 'Career & Productivity',
      labelUrdu: 'کیریئر و پروڈکٹیوٹی',
      icon: Zap,
      description: 'ATS CV & resume builder, image compressor, QR generator, text transformers, and daily utilities.',
      descriptionUrdu: 'سی وی جنریٹر، امیج کمپریسر، کیو آر جنریٹر، ٹیکسٹ ٹرانسفارمرز اور روزمرہ اوزار۔',
    },
    {
      id: 'ai-prompts',
      label: 'AI Prompts',
      labelUrdu: 'اے آئی پرامپٹس',
      icon: Sparkles,
      description: 'Structured prompt builders for AI image generation and multi-scene AI video storyboards.',
      descriptionUrdu: 'اے آئی فوٹو جنریشن اور سنیمیٹک اے آئی ویڈیوز کے لیے تیار کردہ پرامپٹ بلڈرز۔',
    },
    {
      id: 'development',
      label: 'Web & SEO',
      labelUrdu: 'ڈویلپمنٹ و ایس ای او',
      icon: Code,
      description: 'Technical SEO page analyzer, meta tag generator, JSON formatter, Base64 encoder, and color picker.',
      descriptionUrdu: 'ایس ای او تجزیہ کار، میٹا جنریٹر، جیسن فارمیٹر، بیس 64 اور کلر پکر۔',
    },
    {
      id: 'calculators',
      label: 'Calculators',
      labelUrdu: 'کیلکولیٹرز',
      icon: Calculator,
      description: 'Age, date difference, percentage, BMI, loan amortization, and unit conversion calculators.',
      descriptionUrdu: 'عمر، تاریخوں کا فرق، فیصد، بی ایم آئی، قرض اور یونٹ کنورٹر کیلکولیٹرز۔',
    },
    {
      id: 'favorites',
      label: 'Saved',
      labelUrdu: 'پسندیدہ',
      icon: Star,
      description: 'Your starred utilities saved locally in your browser for quick access.',
      descriptionUrdu: 'آپ کے محفوظ کردہ پسندیدہ ٹولز جنہیں آپ فوری طور پر ایک کلک سے استعمال کر سکتے ہیں۔',
    },
  ];

  const isToolInTab = (tool: ToolDefinition, tab: FilterTabId) => {
    switch (tab) {
      case 'all':
        return true;
      case 'productivity':
        return PRODUCTIVITY_TOOL_IDS.has(tool.id) || tool.category === 'productivity' || tool.category === 'career';
      case 'finance':
        return FINANCE_TOOL_IDS.has(tool.id) || tool.category === 'uae-employee';
      case 'development':
        return DEVELOPMENT_TOOL_IDS.has(tool.id);
      case 'calculators':
        return CALCULATOR_TOOL_IDS.has(tool.id) || tool.category === 'calculators';
      case 'ai-prompts':
        return AI_PROMPT_TOOL_IDS.has(tool.id) || tool.category === 'ai-photo-prompts' || tool.category === 'ai-video-prompts';
      case 'favorites':
        return favorites.includes(tool.id);
      default:
        return true;
    }
  };

  const tabCounts = useMemo(() => {
    const counts: Record<FilterTabId, number> = {
      all: TOOLS_LIST.length,
      productivity: 0,
      finance: 0,
      development: 0,
      calculators: 0,
      'ai-prompts': 0,
      favorites: favorites.length,
    };

    TOOLS_LIST.forEach((tool) => {
      if (isToolInTab(tool, 'productivity')) counts.productivity += 1;
      if (isToolInTab(tool, 'finance')) counts.finance += 1;
      if (isToolInTab(tool, 'development')) counts.development += 1;
      if (isToolInTab(tool, 'calculators')) counts.calculators += 1;
      if (isToolInTab(tool, 'ai-prompts')) counts['ai-prompts'] += 1;
    });

    return counts;
  }, [favorites]);

  const filteredTools = useMemo(() => {
    let list = TOOLS_LIST.filter((tool) => isToolInTab(tool, activeTab));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.nameUrdu.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.shortDescriptionUrdu.toLowerCase().includes(q) ||
          tool.categoryName.toLowerCase().includes(q) ||
          tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
          tool.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, activeTab, favorites]);

  const currentTabDef = tabDefinitions.find((t) => t.id === activeTab) || tabDefinitions[0];

  return (
    <section id="tools-directory-section" className="w-full max-w-7xl mx-auto py-10 sm:py-12 px-4 sm:px-6 lg:px-8 scroll-mt-20 space-y-10 sm:space-y-12 min-w-0">
      {/* Featured Tools Section (Shown when not filtering by search query and on 'all' tab) */}
      {!searchQuery.trim() && activeTab === 'all' && (
        <div className="min-w-0">
          <div className="mb-5">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              {isUrdu ? 'نمایاں ٹولز' : 'Essential Utilities'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 break-words">
              {isUrdu ? 'سب سے زیادہ استعمال ہونے والے ٹولز' : 'Featured Tools'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">
              {isUrdu
                ? 'سی وی تیاری، یو اے ای تنخواہ اور گریجویٹی کا تخمینہ، اے آئی پرامپٹس اور ٹیکنیکل ایس ای او آڈٹ۔'
                : 'Jump directly into our core career, UAE payroll & end-of-service, AI prompt, and technical SEO workspaces.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0">
            {featuredTools.map((tool) => (
              <ToolCard key={`featured-${tool.id}`} tool={tool} onSelect={onSelectTool} />
            ))}
          </div>
        </div>
      )}

      {/* Full Filterable Tool Catalog */}
      <div className="min-w-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isUrdu ? 'مکمل ڈائرکٹری' : 'Complete Catalog'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 break-words">
              {isUrdu ? currentTabDef.labelUrdu : currentTabDef.label}
              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-base font-normal text-slate-400 tabular-nums">
                ({filteredTools.length})
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed break-words">
              {isUrdu ? currentTabDef.descriptionUrdu : currentTabDef.description}
            </p>
          </div>

          {searchQuery.trim() && (
            <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 self-start md:self-auto max-w-full min-w-0">
              <span className="text-xs text-blue-800 dark:text-blue-300 font-medium truncate min-w-0">
                {isUrdu ? 'تلاش جاری:' : 'Filtered by:'} <strong className="font-semibold">"{searchQuery}"</strong>
              </span>
              <button
                type="button"
                onClick={onClearSearch}
                aria-label={isUrdu ? 'تلاش ختم کریں' : 'Clear search'}
                className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center rounded-md text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 transition-colors cursor-pointer shrink-0"
                title={isUrdu ? 'تلاش ختم کریں' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Interactive Category Filter Bar (Wraps cleanly onto multiple rows on mobile, single row on desktop) */}
        <div id="tour-category-tabs" className="relative mb-6 sm:mb-8 w-full max-w-full min-w-0">
          <div
            role="tablist"
            aria-label="Tool Categories"
            className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 lg:overflow-x-auto scrollbar-none w-full max-w-full"
          >
            {tabDefinitions.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const count = tabCounts[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{isUrdu ? tab.labelUrdu : tab.label}</span>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      isActive ? 'text-blue-100 font-bold' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Cards Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {isUrdu ? 'اس کیٹیگری میں کوئی ٹول نہیں ملا' : 'No tools found in this category'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
              {searchQuery
                ? isUrdu
                  ? `"${searchQuery}" کے لیے ${currentTabDef.labelUrdu} میں کوئی نتیجہ نہیں ملا۔ تمام ٹولز میں تلاش کریں یا تلاش دوبارہ ترتیب دیں۔`
                  : `No results matching "${searchQuery}" under ${currentTabDef.label}. Try searching all tools or clearing your search term.`
                : activeTab === 'favorites'
                ? isUrdu
                  ? 'آپ نے ابھی تک کوئی ٹول پسندیدہ میں شامل نہیں کیا۔ کسی بھی ٹول کارڈ پر موجود ستارے کے آئیکون پر کلک کریں۔'
                  : 'You have not starred any utilities yet. Click the star icon on any tool card to save it here.'
                : isUrdu
                ? 'کسی دوسری کیٹیگری کا انتخاب کریں۔'
                : 'Try selecting a different category filter above.'}
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  {isUrdu ? 'تلاش صاف کریں' : 'Clear Search'}
                </button>
              )}
              {activeTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {isUrdu ? 'تمام ٹولز دکھائیں' : 'View All Tools'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
