import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { CATEGORY_GROUPS, TOOL_ROUTES, findToolBySlugOrId } from '../../data/toolsRouting';
import { TOOLS_LIST } from '../../data/tools';
import { copyTextToClipboard } from '../../utils/toolResultExtractor';
import { LanguageToggleSwitch } from './LanguageToggleSwitch';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Sun,
  Moon,
  Bookmark,
  Globe,
  Search,
  Share2,
  Check,
  ChevronDown,
  Menu,
  X,
  Briefcase,
  Calculator,
  Sparkles,
  Layers,
  ArrowRight,
  Wallet,
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigateTo: (path: string) => void;
  onOpenLegal?: (type: 'privacy' | 'terms' | 'disclaimer' | 'contact') => void;
  onOpenSearch: () => void;
  onOpenShortcuts?: () => void;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigateTo,
  onOpenSearch,
}) => {
  const { language, t, dir } = useLanguage();
  const { theme } = useTheme();
  const { favorites, toggleDrawer } = useFavorites();
  const { toast } = useToast();
  const isUrdu = language === 'ur';

  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'shared' | 'copied'>('idle');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const shareFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile menu and reset transient share state when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAllToolsOpen(false);
    setShareFeedback('idle');
  }, [currentPath]);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdown & mobile menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAllToolsOpen(false);
      }
      if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAllToolsOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleNav = (path: string, e?: React.MouseEvent) => {
    if (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
    }
    setIsAllToolsOpen(false);
    setIsMobileMenuOpen(false);
    onNavigateTo(path);
  };

  const isCurrentActive = (path: string) => {
    if (path === '/' && (currentPath === '/' || currentPath === '')) return true;
    if (path !== '/' && currentPath === path) return true;
    return false;
  };

  const totalToolsCount = TOOLS_LIST.length;

  const activeToolRoute =
    currentPath && currentPath !== '/' && currentPath !== '/tools'
      ? findToolBySlugOrId(currentPath)
      : null;
  const activeToolDef = activeToolRoute
    ? TOOLS_LIST.find((tool) => tool.id === activeToolRoute.id) ?? null
    : null;
  const activeToolTitle = activeToolDef
    ? isUrdu
      ? activeToolDef.nameUrdu
      : activeToolDef.name
    : null;

  const shareAriaLabel = activeToolTitle
    ? isUrdu
      ? `${activeToolTitle} شیئر کریں`
      : `Share ${activeToolTitle}`
    : isUrdu
    ? 'یہ صفحہ شیئر کریں'
    : 'Share this page';

  const getShareUrl = (): string => {
    if (typeof window === 'undefined') return currentPath || '/';
    if (window.location.pathname === currentPath) {
      return window.location.href;
    }
    try {
      return new URL(currentPath || '/', window.location.origin).href;
    } catch {
      return window.location.href;
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    const shareUrl = getShareUrl();
    const shareTitle = activeToolTitle
      ? `${activeToolTitle} – ${t.siteName}`
      : typeof document !== 'undefined' && document.title
      ? document.title
      : t.siteName;
    const shareText = activeToolDef
      ? isUrdu
        ? activeToolDef.shortDescriptionUrdu
        : activeToolDef.shortDescription
      : isUrdu
      ? `${t.siteName} پر مفت آن لائن ٹولز استعمال کریں۔`
      : `Explore free, private online utilities on ${t.siteName}.`;

    const shareData: ShareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const canUseNativeShare =
          typeof navigator.canShare === 'function' ? navigator.canShare(shareData) : true;

        if (canUseNativeShare) {
          await navigator.share(shareData);
          setShareFeedback('shared');
          if (shareFeedbackTimeoutRef.current) {
            clearTimeout(shareFeedbackTimeoutRef.current);
          }
          shareFeedbackTimeoutRef.current = setTimeout(() => setShareFeedback('idle'), 2500);
          return;
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        return;
      }
    } finally {
      setIsSharing(false);
    }

    const copied = await copyTextToClipboard(shareUrl);
    if (copied) {
      setShareFeedback('copied');
      if (shareFeedbackTimeoutRef.current) {
        clearTimeout(shareFeedbackTimeoutRef.current);
      }
      shareFeedbackTimeoutRef.current = setTimeout(() => setShareFeedback('idle'), 2500);
      toast.success(
        isUrdu ? 'لنک کاپی ہو گیا' : 'Link Copied',
        activeToolTitle
          ? isUrdu
            ? `${activeToolTitle} کا لنک کلپ بورڈ میں کاپی کر دیا گیا ہے۔`
            : `${activeToolTitle} URL copied to clipboard.`
          : isUrdu
          ? 'صفحہ کا لنک کلپ بورڈ میں کاپی کر دیا گیا ہے۔'
          : 'Page URL copied to clipboard.',
        { duration: 3000, compact: true }
      );
    } else {
      toast.error(
        isUrdu ? 'لنک شیئر نہیں ہو سکا' : 'Could Not Share Link',
        isUrdu
          ? 'براہ کرم براؤزر کے ایڈریس بار سے لنک کاپی کریں۔'
          : 'Please copy the URL directly from your browser address bar.',
        { duration: 3500, compact: true }
      );
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 w-full max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors no-print"
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Zone 1: Clean Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => handleNav('/', e)}
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg group min-w-0 shrink"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs tracking-tight shadow-2xs group-hover:bg-blue-700 transition-colors shrink-0">
              FT
            </div>
            <span className="text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              {t.siteName}
            </span>
          </a>

          {/* Zone 2: Compact Desktop Primary Navigation */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            {/* 1. Home */}
            <a
              href="/"
              onClick={(e) => handleNav('/', e)}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isCurrentActive('/')
                  ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'ہوم' : 'Home'}
            </a>

            {/* 2. All Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-expanded={isAllToolsOpen}
                aria-haspopup="true"
                onClick={() => setIsAllToolsOpen(!isAllToolsOpen)}
                className={`inline-flex items-center gap-1.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                  isAllToolsOpen || currentPath.startsWith('/tools')
                    ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{isUrdu ? 'تمام ٹولز' : 'All Tools'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isAllToolsOpen ? 'rotate-180 text-blue-700 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Mega Dropdown Panel */}
              {isAllToolsOpen && (
                <div
                  className={`absolute top-full mt-3 w-[min(780px,calc(100vw-2rem))] max-h-[82vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-5 animate-in fade-in duration-150 ${
                    dir === 'rtl' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
                  }`}
                >
                  {/* Featured Quick Strip */}
                  <div className="pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {isUrdu ? 'نمایاں ٹولز' : `Featured Utilities · ${totalToolsCount} Free Tools`}
                      </span>
                      <a
                        href="/tools"
                        onClick={(e) => handleNav('/tools', e)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        <span>{isUrdu ? 'مکمل ڈائرکٹری دیکھیں' : 'View Full Directory'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <a
                        href="/tools/cv-maker"
                        onClick={(e) => handleNav('/tools/cv-maker', e)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors min-w-0"
                      >
                        <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {isUrdu ? 'سی وی / ریزیومے جنریٹر' : 'CV / Resume Generator'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            ATS templates & PDF export
                          </div>
                        </div>
                      </a>

                      <a
                        href="/tools/uae-salary-calculator"
                        onClick={(e) => handleNav('/tools/uae-salary-calculator', e)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors min-w-0"
                      >
                        <Wallet className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {isUrdu ? 'یو اے ای سیلری کیلکولیٹر' : 'UAE Salary Calculator'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            AED allowances & net pay
                          </div>
                        </div>
                      </a>

                      <a
                        href="/tools/uae-gratuity-calculator"
                        onClick={(e) => handleNav('/tools/uae-gratuity-calculator', e)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors min-w-0"
                      >
                        <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {isUrdu ? 'یو اے ای گریجویٹی کیلکولیٹر' : 'UAE Gratuity Calculator'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            End-of-service estimate
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* Categorized Grid (3 columns) */}
                  <div className="grid grid-cols-3 gap-5">
                    {CATEGORY_GROUPS.map((group) => {
                      const groupTools = Object.values(TOOL_ROUTES).filter(
                        (r) => r.categoryGroup === group.id
                      );

                      return (
                        <div key={group.id} className="space-y-1.5 min-w-0">
                          <a
                            href={`/tools?category=${group.id}`}
                            onClick={(e) => handleNav(`/tools?category=${group.id}`, e)}
                            className="block text-xs font-bold text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-1 truncate transition-colors"
                          >
                            {isUrdu ? group.nameUrdu : group.name}
                          </a>

                          <div className="space-y-0.5">
                            {groupTools.map((tRoute) => {
                              const def = TOOLS_LIST.find((t) => t.id === tRoute.id);
                              if (!def) return null;
                              const title = isUrdu ? def.nameUrdu : def.name;

                              return (
                                <a
                                  key={tRoute.id}
                                  href={tRoute.primaryPath}
                                  onClick={(e) => handleNav(tRoute.primaryPath, e)}
                                  className={`block w-full text-left rtl:text-right px-2 py-1.5 rounded-md text-xs transition-colors truncate ${
                                    currentPath === tRoute.primaryPath
                                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  {title}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2b. Direct CV / Resume Generator Link */}
            <a
              href="/tools/cv-maker"
              onClick={(e) => handleNav('/tools/cv-maker', e)}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentPath === '/tools/cv-maker'
                  ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'سی وی میکر' : 'CV / Resume'}
            </a>

            {/* 3. AI Prompts */}
            <a
              href="/tools/ai-photo-prompt-generator"
              onClick={(e) => handleNav('/tools/ai-photo-prompt-generator', e)}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentPath === '/tools/ai-photo-prompt-generator' || currentPath === '/tools/ai-video-prompt-generator'
                  ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'اے آئی پرامپٹس' : 'AI Prompts'}
            </a>

            {/* 4. About */}
            <a
              href="/about"
              onClick={(e) => handleNav('/about', e)}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isCurrentActive('/about')
                  ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'تعارف' : 'About'}
            </a>

            {/* 5. Contact */}
            <a
              href="/contact"
              onClick={(e) => handleNav('/contact', e)}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isCurrentActive('/contact')
                  ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'رابطہ' : 'Contact'}
            </a>
          </nav>

          {/* Zone 3: Essential Controls on Mobile + Full Toolbar on Tablet/Desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop/Tablet Search Button */}
            <button
              id="tour-search-header"
              type="button"
              onClick={onOpenSearch}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Quick search tools (Press / or Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{isUrdu ? 'ٹول تلاش کریں...' : 'Search tools...'}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-400 font-semibold">
                /
              </kbd>
            </button>

            {/* Mobile Essential Action 1: Search Button (>= 44x44px hit target) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label={isUrdu ? 'ٹولز تلاش کریں' : 'Search tools'}
            >
              <Search className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Mobile Essential Action 2: Web Share Button (>= 44x44px hit target) */}
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              title={shareAriaLabel}
              aria-label={shareAriaLabel}
              className={`md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                shareFeedback !== 'idle'
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {shareFeedback !== 'idle' ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {/* Tablet/Desktop Web Share Button */}
            <button
              id="header-share-button"
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              title={shareAriaLabel}
              aria-label={shareAriaLabel}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border cursor-pointer shrink-0 ${
                shareFeedback !== 'idle'
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {shareFeedback !== 'idle' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
              )}
              <span className="hidden xl:inline">
                {shareFeedback === 'copied'
                  ? isUrdu
                    ? 'کاپی ہو گیا'
                    : 'Copied'
                  : shareFeedback === 'shared'
                  ? isUrdu
                    ? 'شیئر ہو گیا'
                    : 'Shared'
                  : isUrdu
                  ? 'شیئر'
                  : 'Share'}
              </span>
            </button>

            {/* Tablet/Desktop Favorites Drawer Trigger (Moved into Hamburger Menu on small mobile screens) */}
            <button
              id="tour-favorites-header"
              type="button"
              onClick={toggleDrawer}
              title={t.favoritesSidebar?.title || 'Saved Tools'}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="hidden xl:inline">{t.favorites}</span>
              <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                {favorites.length}
              </span>
            </button>

            {/* Desktop PWA Install Button (Available inside Hamburger Menu on mobile/tablet) */}
            <PWAInstallButton className="hidden xl:inline-flex shrink-0" />

            {/* Tablet/Desktop Language Switcher */}
            <LanguageToggleSwitch className="hidden md:inline-flex shrink-0" />

            {/* Tablet/Desktop Theme Switcher */}
            <ThemeToggleSwitch className="hidden md:inline-flex shrink-0" />

            {/* Mobile/Tablet Essential Action 2: Hamburger Menu Button (>= 44x44px hit target) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={
                isMobileMenuOpen
                  ? isUrdu
                    ? 'مینو بند کریں'
                    : 'Close navigation menu'
                  : isUrdu
                  ? 'مینو کھولیں'
                  : 'Open navigation menu'
              }
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Viewport-Contained Mobile & Tablet Navigation Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-navigation-menu"
            role="region"
            aria-label={isUrdu ? 'موبائل نیویگیشن اور ترتیبات' : 'Mobile Navigation and Preferences'}
            className="lg:hidden w-full max-w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-4 space-y-4 shadow-xl max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden"
          >
            {/* Quick Secondary Controls (Bookmarks, Language, Theme, Install App) */}
            <div className="space-y-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
                {/* Saved / Bookmarks Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    toggleDrawer();
                  }}
                  className="min-h-[44px] w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate">{t.favorites || (isUrdu ? 'محفوظ کردہ ٹولز' : 'Saved Tools')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono tabular-nums text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {favorites.length}
                  </span>
                </button>

                {/* Quick Search Trigger inside Menu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSearch();
                  }}
                  className="min-h-[44px] w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Search className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{isUrdu ? 'ٹول تلاش کریں' : 'Quick Tool Search'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">{isUrdu ? '←' : '→'}</span>
                </button>
              </div>

              {/* Share Current Tool / Page inside Menu */}
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing}
                className={`min-h-[44px] w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  shareFeedback !== 'idle'
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {shareFeedback !== 'idle' ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Share2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {shareFeedback === 'copied'
                      ? isUrdu
                        ? 'لنک کاپی ہو گیا'
                        : 'Link Copied to Clipboard'
                      : shareFeedback === 'shared'
                      ? isUrdu
                        ? 'کامیابی سے شیئر ہو گیا'
                        : 'Shared Successfully'
                      : shareAriaLabel}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">{isUrdu ? '←' : '→'}</span>
              </button>

              {/* Language & Theme Controls */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 min-w-0">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{isUrdu ? 'زبان' : 'Language'}</span>
                  </span>
                  <LanguageToggleSwitch showGlobe={false} showFullLabels={true} size="sm" className="shrink-0" />
                </div>

                <div className="flex-1 min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 min-w-0">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 min-w-0">
                    {theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate">{isUrdu ? 'تھیم' : 'Theme'}</span>
                  </span>
                  <ThemeToggleSwitch showLabels={true} size="sm" className="shrink-0" />
                </div>
              </div>

              {/* PWA Install / iOS Home Screen Guide */}
              <PWAInstallButton variant="menu" />
            </div>

            {/* Primary Navigation Links */}
            <nav aria-label="Mobile Navigation" className="space-y-1">
              <a
                href="/"
                onClick={(e) => handleNav('/', e)}
                className={`min-h-[44px] flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isCurrentActive('/')
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isUrdu ? 'ہوم پیج' : 'Home'}
              </a>

              <a
                href="/tools"
                onClick={(e) => handleNav('/tools', e)}
                className={`min-h-[44px] flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isCurrentActive('/tools')
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Layers className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span className="truncate">
                    {isUrdu ? `تمام ٹولز (${totalToolsCount})` : `All Tools (${totalToolsCount})`}
                  </span>
                </span>
                <ArrowRight className={`w-4 h-4 text-slate-400 shrink-0 ${isUrdu ? '-scale-x-100' : ''}`} />
              </a>

              <a
                href="/tools/cv-maker"
                onClick={(e) => handleNav('/tools/cv-maker', e)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-0"
              >
                <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="truncate">{isUrdu ? 'سی وی / ریزیومے جنریٹر' : 'CV / Resume Generator'}</span>
              </a>

              <a
                href="/tools/uae-salary-calculator"
                onClick={(e) => handleNav('/tools/uae-salary-calculator', e)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-0"
              >
                <Wallet className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="truncate">{isUrdu ? 'یو اے ای سیلری کیلکولیٹر' : 'UAE Salary Calculator'}</span>
              </a>

              <a
                href="/tools/uae-gratuity-calculator"
                onClick={(e) => handleNav('/tools/uae-gratuity-calculator', e)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-0"
              >
                <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="truncate">{isUrdu ? 'یو اے ای گریجویٹی کیلکولیٹر' : 'UAE Gratuity Calculator'}</span>
              </a>

              <a
                href="/tools/ai-photo-prompt-generator"
                onClick={(e) => handleNav('/tools/ai-photo-prompt-generator', e)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-0"
              >
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="truncate">{isUrdu ? 'اے آئی امیج پرامپٹ جنریٹر' : 'AI Image Prompt Generator'}</span>
              </a>

              <a
                href="/tools/ai-video-prompt-generator"
                onClick={(e) => handleNav('/tools/ai-video-prompt-generator', e)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-0"
              >
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="truncate">{isUrdu ? 'اے آئی ویڈیو پرامپٹ جنریٹر' : 'AI Video Prompt Generator'}</span>
              </a>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <a
                  href="/about"
                  onClick={(e) => handleNav('/about', e)}
                  className="min-h-[44px] flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold text-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {isUrdu ? 'ہمارے بارے میں' : 'About'}
                </a>
                <a
                  href="/contact"
                  onClick={(e) => handleNav('/contact', e)}
                  className="min-h-[44px] flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold text-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {isUrdu ? 'رابطہ کریں' : 'Contact'}
                </a>
              </div>
            </nav>

            {/* Expandable Category Accordions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 block">
                {isUrdu ? 'کیٹیگریز کے لحاظ سے ٹولز' : 'Browse by Category'}
              </span>

              {CATEGORY_GROUPS.map((group) => {
                const isExpanded = expandedMobileCategory === group.id;
                const groupTools = Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === group.id);

                return (
                  <div key={group.id} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedMobileCategory(isExpanded ? null : group.id)}
                      className="min-h-[44px] w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <span className="truncate">{isUrdu ? group.nameUrdu : group.name}</span>
                      <span className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <span className="text-[11px] font-mono tabular-nums">{groupTools.length}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="p-1.5 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {groupTools.map((tRoute) => {
                          const def = TOOLS_LIST.find((t) => t.id === tRoute.id);
                          if (!def) return null;
                          return (
                            <a
                              key={tRoute.id}
                              href={tRoute.primaryPath}
                              onClick={(e) => handleNav(tRoute.primaryPath, e)}
                              className="min-h-[40px] flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
                            >
                              <span className="truncate">{isUrdu ? def.nameUrdu : def.name}</span>
                              <span className="text-[11px] text-slate-400 shrink-0">{isUrdu ? '←' : '→'}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Backdrop for comfortable tap-outside dismissal */}
      {isMobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] lg:hidden no-print"
        />
      )}
    </>
  );
};
