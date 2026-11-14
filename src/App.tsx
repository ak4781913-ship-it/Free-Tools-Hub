/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import { TOOLS_LIST } from './data/tools';
import { findToolBySlugOrId, getToolPrimaryPath } from './data/toolsRouting';
import { applyRouteSeo, getSiteBaseUrl } from './utils/seoManager';

// Layout components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { Footer } from './components/layout/Footer';
import { ToolPageLayout } from './components/layout/ToolPageLayout';
import { LegalModal } from './components/layout/Modals/LegalModal';
import { SettingsModal } from './components/layout/Modals/SettingsModal';
import { HelpModal } from './components/layout/Modals/HelpModal';
import { FavoritesDrawer } from './components/layout/FavoritesDrawer';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { FeedbackModal } from './components/layout/FeedbackModal';
import { ShortcutsModal } from './components/layout/ShortcutsModal';
import { OnboardingTour } from './components/layout/OnboardingTour';
import { PrintHistoryModal } from './components/layout/PrintHistoryModal';
import { OfflineIndicator } from './components/layout/OfflineIndicator';

// Dedicated Pages
import { ToolsDirectoryPage } from './components/pages/ToolsDirectoryPage';
import { TrustPageView, TrustPageType } from './components/pages/TrustPages';

// Home & Modern Dashboard components
import { WelcomeBanner } from './components/home/WelcomeBanner';
import { StatsCards } from './components/home/StatsCards';
import { QuickAccessSection } from './components/home/QuickAccessSection';
import { CategoryCardsSection } from './components/home/CategoryCardsSection';
import { HeroSection } from './components/home/HeroSection';
import { DailyGoalTracker } from './components/home/DailyGoalTracker';
import { RecentlyUsedSection } from './components/home/RecentlyUsedSection';
import { FavoritesSection } from './components/home/FavoritesSection';
import { ToolsGrid } from './components/home/ToolsGrid';
import { FeaturedUAESection } from './components/home/FeaturedUAESection';
import { FeaturedAIPromptsSection } from './components/home/FeaturedAIPromptsSection';
import { HowItWorksSection } from './components/home/HowItWorksSection';
import { FAQSection } from './components/home/FAQSection';
import { logToolAccess } from './utils/toolTracking';
import { recordToolUseForDailyGoal } from './utils/dailyGoalTracking';

// Lazy-loaded standalone tool workspaces & heavy analytics chart for fast initial page load & bundle splitting
const AnalyticsDashboard = lazy(() =>
  import('./components/home/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))
);
const ResumeBuilderTool = lazy(() =>
  import('./components/tools/ResumeBuilder/ResumeBuilderTool').then((m) => ({ default: m.ResumeBuilderTool }))
);
const UAESalaryTool = lazy(() =>
  import('./components/tools/UAESalary/UAESalaryTool').then((m) => ({ default: m.UAESalaryTool }))
);
const UAEGratuityTool = lazy(() =>
  import('./components/tools/UAEGratuity/UAEGratuityTool').then((m) => ({ default: m.UAEGratuityTool }))
);
const GeminiPhotoPromptTool = lazy(() =>
  import('./components/tools/GeminiPhotoPrompt/GeminiPhotoPromptTool').then((m) => ({ default: m.GeminiPhotoPromptTool }))
);
const AIVideoPromptTool = lazy(() =>
  import('./components/tools/AIVideoPrompt/AIVideoPromptTool').then((m) => ({ default: m.AIVideoPromptTool }))
);
const QRCodeTool = lazy(() =>
  import('./components/tools/QRCodeGenerator/QRCodeTool').then((m) => ({ default: m.QRCodeTool }))
);
const ImageCompressorTool = lazy(() =>
  import('./components/tools/ImageCompressor/ImageCompressorTool').then((m) => ({ default: m.ImageCompressorTool }))
);
const WordCounterTool = lazy(() =>
  import('./components/tools/WordCounter/WordCounterTool').then((m) => ({ default: m.WordCounterTool }))
);
const TextCaseConverterTool = lazy(() =>
  import('./components/tools/TextCaseConverter/TextCaseConverterTool').then((m) => ({ default: m.TextCaseConverterTool }))
);
const PasswordGeneratorTool = lazy(() =>
  import('./components/tools/PasswordGenerator/PasswordGeneratorTool').then((m) => ({ default: m.PasswordGeneratorTool }))
);
const UnitConverterTool = lazy(() =>
  import('./components/tools/UnitConverter/UnitConverterTool').then((m) => ({ default: m.UnitConverterTool }))
);
const AgeCalculatorTool = lazy(() =>
  import('./components/tools/AgeCalculator/AgeCalculatorTool').then((m) => ({ default: m.AgeCalculatorTool }))
);
const DateDifferenceTool = lazy(() =>
  import('./components/tools/DateDifference/DateDifferenceTool').then((m) => ({ default: m.DateDifferenceTool }))
);
const PercentageCalculatorTool = lazy(() =>
  import('./components/tools/PercentageCalculator/PercentageCalculatorTool').then((m) => ({ default: m.PercentageCalculatorTool }))
);
const CurrencyConverterTool = lazy(() =>
  import('./components/tools/CurrencyConverter/CurrencyConverterTool').then((m) => ({ default: m.CurrencyConverterTool }))
);
const DiscountCalculatorTool = lazy(() =>
  import('./components/tools/DiscountCalculator/DiscountCalculatorTool').then((m) => ({ default: m.DiscountCalculatorTool }))
);
const BMICalculatorTool = lazy(() =>
  import('./components/tools/BMICalculator/BMICalculatorTool').then((m) => ({ default: m.BMICalculatorTool }))
);
const LoanCalculatorTool = lazy(() =>
  import('./components/tools/LoanCalculator/LoanCalculatorTool').then((m) => ({ default: m.LoanCalculatorTool }))
);
const TimeZoneConverterTool = lazy(() =>
  import('./components/tools/TimeZoneConverter/TimeZoneConverterTool').then((m) => ({ default: m.TimeZoneConverterTool }))
);
const CryptoConverterTool = lazy(() =>
  import('./components/tools/CryptoConverter/CryptoConverterTool').then((m) => ({ default: m.CryptoConverterTool }))
);
const MarkdownEditorTool = lazy(() =>
  import('./components/tools/MarkdownEditor/MarkdownEditorTool').then((m) => ({ default: m.MarkdownEditorTool }))
);
const PasswordStrengthTool = lazy(() =>
  import('./components/tools/PasswordStrength/PasswordStrengthTool').then((m) => ({ default: m.PasswordStrengthTool }))
);
const SeoMetaGeneratorTool = lazy(() =>
  import('./components/tools/SeoMetaGenerator/SeoMetaGeneratorTool').then((m) => ({ default: m.SeoMetaGeneratorTool }))
);
const SeoPageAnalyzerTool = lazy(() =>
  import('./components/tools/SeoPageAnalyzer/SeoPageAnalyzerTool').then((m) => ({ default: m.SeoPageAnalyzerTool }))
);
const JsonFormatterTool = lazy(() =>
  import('./components/tools/JsonFormatter/JsonFormatterTool').then((m) => ({ default: m.JsonFormatterTool }))
);
const Base64ConverterTool = lazy(() =>
  import('./components/tools/Base64Converter/Base64ConverterTool').then((m) => ({ default: m.Base64ConverterTool }))
);
const ColorPickerTool = lazy(() =>
  import('./components/tools/ColorPicker/ColorPickerTool').then((m) => ({ default: m.ColorPickerTool }))
);
const PdfToolsSuiteTool = lazy(() =>
  import('./components/tools/PdfToolsSuite/PdfToolsSuiteTool').then((m) => ({ default: m.PdfToolsSuiteTool }))
);

const TRUST_PATHS = new Set(['/about', '/contact', '/privacy', '/terms', '/disclaimer']);

function normalizeRoutePath(raw: string): string {
  const withoutQuery = raw.split('?')[0].split('#')[0];
  if (!withoutQuery || withoutQuery === '' || withoutQuery === '/') return '/';
  const cleaned = withoutQuery.endsWith('/') && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

/**
 * Extracts and normalizes current route from pathname or legacy hash fallback
 */
function parseCurrentPath(): string {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    return normalizeRoutePath(hash.slice(1));
  } else if (hash && hash.startsWith('#tools/')) {
    return normalizeRoutePath('/' + hash.slice(1));
  }
  return normalizeRoutePath(window.location.pathname || '/');
}

const ToolWorkspaceSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6" aria-busy="true" aria-label="Loading tool workspace">
    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
    <div className="h-4 w-96 max-w-full bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
      <div className="lg:col-span-6 h-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
        <div className="h-24 w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
      </div>
      <div className="lg:col-span-6 h-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-32 w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
        <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
      </div>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const { language } = useLanguage();
  const { addRecentTool, isDrawerOpen, closeDrawer, toggleDrawer } = useFavorites();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const initial = parseCurrentPath();
    if (initial.startsWith('/tools/') && initial !== '/tools') {
      const slug = initial.replace(/^\/tools\//, '');
      const config = findToolBySlugOrId(slug);
      if (config) {
        logToolAccess(config.id);
        recordToolUseForDailyGoal(config.id);
      }
    }
    return initial;
  });

  const [directoryCategory, setDirectoryCategory] = useState<string | undefined>(() => {
    try {
      const cat = new URLSearchParams(window.location.search).get('category');
      return cat || undefined;
    } catch {
      return undefined;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'disclaimer' | 'contact' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isPrintHistoryOpen, setIsPrintHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Responsive Sidebar state (persistent preference stored in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('abbaspro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('abbaspro_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [isReaderMode, setIsReaderMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('freetools_hub_reader_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Track initial tool access if loaded directly via URL
  useEffect(() => {
    if (currentPath.startsWith('/tools/') && currentPath !== '/tools') {
      const slug = currentPath.replace(/^\/tools\//, '');
      const config = findToolBySlugOrId(slug);
      if (config) {
        addRecentTool(config.id);
      }
    }
  }, []);

  // Listen to browser Back/Forward navigation and Hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = parseCurrentPath();
      setCurrentPath(path);
      try {
        const cat = new URLSearchParams(window.location.search).get('category');
        setDirectoryCategory(cat || undefined);
      } catch {
        setDirectoryCategory(undefined);
      }

      if (path.startsWith('/tools/') && path !== '/tools') {
        const slug = path.replace(/^\/tools\//, '');
        const config = findToolBySlugOrId(slug);
        if (config) {
          addRecentTool(config.id);
          logToolAccess(config.id);
          recordToolUseForDailyGoal(config.id);
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [addRecentTool]);

  /**
   * Dedicated page navigation router:
   * Supports "/", "/tools", "/about", "/contact", "/privacy", "/terms", "/tools/:slug", and legacy "tool:<id>"
   */
  const navigateTo = (pathOrId: string) => {
    let targetPath = '/';
    let targetQuery = '';

    if (pathOrId && pathOrId.includes('?')) {
      const qIndex = pathOrId.indexOf('?');
      targetQuery = pathOrId.slice(qIndex);
    }

    const cleanInput = pathOrId ? pathOrId.split('?')[0] : '/';

    if (!cleanInput || cleanInput === '/' || cleanInput === 'home') {
      targetPath = '/';
    } else if (cleanInput === '/tools' || cleanInput === 'tools') {
      targetPath = '/tools';
    } else if (TRUST_PATHS.has(normalizeRoutePath(cleanInput))) {
      targetPath = normalizeRoutePath(cleanInput);
    } else if (cleanInput.startsWith('/tools/')) {
      const normalized = normalizeRoutePath(cleanInput);
      const slug = normalized.replace(/^\/tools\//, '');
      const resolved = findToolBySlugOrId(slug);
      targetPath = resolved ? resolved.primaryPath : normalized;
    } else if (cleanInput.startsWith('tool:')) {
      const id = cleanInput.replace('tool:', '');
      targetPath = getToolPrimaryPath(id);
    } else if (cleanInput.startsWith('#/')) {
      targetPath = normalizeRoutePath(cleanInput.slice(1));
    } else {
      const resolved = findToolBySlugOrId(cleanInput);
      if (resolved) {
        targetPath = resolved.primaryPath;
      } else {
        targetPath = normalizeRoutePath(cleanInput.startsWith('/') ? cleanInput : `/tools/${cleanInput}`);
      }
    }

    const fullUrl = targetPath === '/tools' && targetQuery ? `${targetPath}${targetQuery}` : targetPath;
    if (targetPath === '/tools') {
      try {
        const cat = new URLSearchParams(targetQuery).get('category');
        setDirectoryCategory(cat || undefined);
      } catch {
        setDirectoryCategory(undefined);
      }
    } else {
      setDirectoryCategory(undefined);
    }

    try {
      const currentFull = `${window.location.pathname}${window.location.search}`;
      if (currentFull !== fullUrl || window.location.hash) {
        window.history.pushState({ path: fullUrl }, '', fullUrl);
      }
    } catch {
      window.location.hash = fullUrl;
    }

    setCurrentPath(targetPath);

    if (targetPath.startsWith('/tools/') && targetPath !== '/tools') {
      const slug = targetPath.replace(/^\/tools\//, '');
      const config = findToolBySlugOrId(slug);
      if (config) {
        addRecentTool(config.id);
        logToolAccess(config.id);
        recordToolUseForDailyGoal(config.id);
      }
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      if (e.key === 'Escape') {
        if (isTourOpen) {
          setIsTourOpen(false);
          return;
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
          return;
        }
        if (isFeedbackOpen) {
          setIsFeedbackOpen(false);
          return;
        }
        if (isPrintHistoryOpen) {
          setIsPrintHistoryOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (legalModalType) {
          setLegalModalType(null);
          return;
        }
        if (isDrawerOpen) {
          closeDrawer();
          return;
        }
        if (isReaderMode) {
          setIsReaderMode(false);
          try {
            localStorage.setItem('freetools_hub_reader_mode', 'false');
          } catch {}
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigateTo('/');
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        navigateTo('/tools');
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleDrawer();
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintHistoryOpen((prev) => !prev);
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'r') {
        if (currentPath.startsWith('/tools/') && currentPath !== '/tools') {
          e.preventDefault();
          setIsReaderMode((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('freetools_hub_reader_mode', String(next));
            } catch {}
            if (next) closeDrawer();
            return next;
          });
          return;
        }
      }

      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, isSearchOpen, isFeedbackOpen, isPrintHistoryOpen, isShortcutsOpen, legalModalType, isDrawerOpen, closeDrawer, toggleDrawer, isReaderMode, currentPath]);

  // Route matching
  const isTrustPage = TRUST_PATHS.has(currentPath);
  const activeTrustPage: TrustPageType | null = isTrustPage
    ? (currentPath.slice(1) as TrustPageType)
    : null;

  const isDirectoryPage = currentPath === '/tools';
  const isToolPage = currentPath.startsWith('/tools/') && currentPath !== '/tools';
  const isReaderModeActive = isReaderMode && isToolPage;
  const toolSlug = isToolPage ? currentPath.replace(/^\/tools\//, '') : null;
  const activeRouteConfig = toolSlug ? findToolBySlugOrId(toolSlug) : null;
  const activeToolDef = activeRouteConfig ? TOOLS_LIST.find((t) => t.id === activeRouteConfig.id) : null;

  const isNotFound =
    currentPath !== '/' &&
    !isDirectoryPage &&
    !isTrustPage &&
    (!activeToolDef || !activeRouteConfig);

  // Canonicalize legacy client-side alias paths (e.g., #/tools/qr-generator -> /tools/qr-code-generator)
  useEffect(() => {
    if (isToolPage && activeRouteConfig && currentPath !== activeRouteConfig.primaryPath) {
      try {
        window.history.replaceState({ path: activeRouteConfig.primaryPath }, '', activeRouteConfig.primaryPath);
        setCurrentPath(activeRouteConfig.primaryPath);
      } catch {}
    }
  }, [isToolPage, activeRouteConfig, currentPath]);

  // Centralized Technical SEO (Title, Meta Description, Canonical, Robots, OpenGraph, Twitter, JSON-LD)
  useEffect(() => {
    const siteBaseUrl = getSiteBaseUrl();

    if (currentPath === '/') {
      applyRouteSeo({
        title: 'FreeTools Hub – Free CV Generator, UAE Gratuity, AI Prompts & Utilities',
        description:
          'Free online CV & resume generator, UAE monthly salary & gratuity calculators, AI image & video prompt builders, technical SEO analyzer, image compressor, QR maker, and browser utilities.',
        canonicalPath: '/',
        robots: 'index, follow',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'FreeTools Hub',
          ...(siteBaseUrl ? { url: `${siteBaseUrl}/` } : {}),
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          description:
            'Free CV and Resume Generator, UAE Salary & Gratuity Calculators, AI Image & Video Prompt Generators, and client-side productivity utilities.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
      });
      return;
    }

    if (isDirectoryPage) {
      applyRouteSeo({
        title: `All ${TOOLS_LIST.length} Free Online Tools & Calculators | FreeTools Hub`,
        description:
          'Browse the complete FreeTools Hub directory: ATS CV builder, UAE monthly salary & gratuity calculators, AI image & video prompt generators, SEO analyzer, and developer utilities.',
        canonicalPath: '/tools',
        robots: 'index, follow',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'All Free Online Tools & Calculators – FreeTools Hub',
          ...(siteBaseUrl ? { url: `${siteBaseUrl}/tools` } : {}),
          description:
            'Complete directory of free browser-based career, UAE payroll & gratuity, AI prompt, image, and developer utilities.',
        },
      });
      return;
    }

    if (activeTrustPage === 'about') {
      applyRouteSeo({
        title: 'About FreeTools Hub – Architecture, Mission & Privacy | AbbasPro',
        description:
          'Learn how AbbasPro / FreeTools Hub builds fast, browser-based career, UAE financial, AI prompt, and developer tools with client-side privacy.',
        canonicalPath: '/about',
        robots: 'index, follow',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About FreeTools Hub',
          ...(siteBaseUrl ? { url: `${siteBaseUrl}/about` } : {}),
        },
      });
      return;
    }

    if (activeTrustPage === 'contact') {
      applyRouteSeo({
        title: 'Contact & Support – Report a Bug or Request a Tool | FreeTools Hub',
        description:
          'Contact AbbasPro / FreeTools Hub to report calculation issues, request new online utilities, or ask technical questions.',
        canonicalPath: '/contact',
        robots: 'index, follow',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact FreeTools Hub',
          ...(siteBaseUrl ? { url: `${siteBaseUrl}/contact` } : {}),
        },
      });
      return;
    }

    if (activeTrustPage === 'privacy') {
      applyRouteSeo({
        title: 'Privacy Policy – Client-Side Data & Local Storage | FreeTools Hub',
        description:
          'Read the FreeTools Hub Privacy Policy explaining how resume drafts, UAE salary inputs, and files stay locally inside your browser.',
        canonicalPath: '/privacy',
        robots: 'index, follow',
      });
      return;
    }

    if (activeTrustPage === 'terms') {
      applyRouteSeo({
        title: 'Terms of Use – Permitted Usage & Ownership | FreeTools Hub',
        description:
          'Review the FreeTools Hub Terms of Use covering free personal and commercial usage, user content ownership, and acceptable conduct.',
        canonicalPath: '/terms',
        robots: 'index, follow',
      });
      return;
    }

    if (activeTrustPage === 'disclaimer') {
      applyRouteSeo({
        title: 'Legal & Calculator Disclaimer – UAE Labour Law, Finance & Health | FreeTools Hub',
        description:
          'Important disclaimers for UAE Gratuity, UAE Salary, Loan EMI, Currency/Crypto, BMI, and AI Prompt calculators on FreeTools Hub.',
        canonicalPath: '/disclaimer',
        robots: 'index, follow',
      });
      return;
    }

    if (isToolPage && activeToolDef && activeRouteConfig) {
      applyRouteSeo({
        title: activeRouteConfig.seoTitle,
        description: activeRouteConfig.seoDescription,
        canonicalPath: activeRouteConfig.primaryPath,
        robots: 'index, follow',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: activeToolDef.name,
            ...(siteBaseUrl ? { url: `${siteBaseUrl}${activeRouteConfig.primaryPath}` } : {}),
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'All',
            description: activeRouteConfig.seoDescription,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          },
          ...(siteBaseUrl
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    {
                      '@type': 'ListItem',
                      position: 1,
                      name: 'Home',
                      item: `${siteBaseUrl}/`,
                    },
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: 'All Tools',
                      item: `${siteBaseUrl}/tools`,
                    },
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: activeToolDef.name,
                      item: `${siteBaseUrl}${activeRouteConfig.primaryPath}`,
                    },
                  ],
                },
              ]
            : []),
        ],
      });
      return;
    }

    if (isNotFound) {
      applyRouteSeo({
        title: 'Page Not Found (404) | FreeTools Hub',
        description: 'The requested page or utility could not be found on FreeTools Hub.',
        robots: 'noindex, follow',
      });
    }
  }, [currentPath, isDirectoryPage, activeTrustPage, isToolPage, activeToolDef, activeRouteConfig, isNotFound]);

  const toggleReaderMode = () => {
    setIsReaderMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('freetools_hub_reader_mode', String(next));
      } catch {}
      if (next) closeDrawer();
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded-lg focus:text-xs focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Left Sidebar Navigation (Fixed on Desktop, Slide-Out on Mobile, Collapsible, hidden in Reader Mode) */}
      {!isReaderModeActive && (
        <Sidebar
          currentPath={currentPath}
          onNavigateTo={navigateTo}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      )}

      {/* Main Content Column with Top Header */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Top Header with search, toggles, notifications, and user account */}
        {!isReaderModeActive && (
          <DashboardHeader
            onToggleSidebar={() => {
              if (window.innerWidth < 1024) {
                setIsMobileSidebarOpen((prev) => !prev);
              } else {
                toggleSidebarCollapse();
              }
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onNavigateTo={navigateTo}
          />
        )}

        {/* Main Route View Content Area */}
        <main id="main-content" className="flex-1 w-full max-w-full min-w-0">
          {/* Route 1: Modern Cards Dashboard ("/") */}
          {currentPath === '/' && (
            <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 min-w-0">
              {/* 1. Welcome Banner */}
              <WelcomeBanner
                onExploreClick={() => navigateTo('/tools')}
                onOpenCvClick={() => navigateTo('/tools/cv-maker')}
              />

              {/* 2. Dashboard Statistics Cards (4 compact cards calculated from real project data) */}
              <StatsCards />

              {/* 3. Quick Access Section (Grid of 8 most essential tools in modern SaaS cards) */}
              <QuickAccessSection
                onSelectTool={(toolId) => navigateTo(getToolPrimaryPath(toolId))}
                onViewAllTools={() => navigateTo('/tools')}
              />

              {/* 4. Tool Category Cards Section */}
              <CategoryCardsSection
                onSelectCategory={(categoryId) => navigateTo(`/tools?category=${categoryId}`)}
                onViewAllTools={() => navigateTo('/tools')}
              />

              {/* 5. Recently Used Tools (pulls actual real usage tracking from localStorage with empty state) */}
              <RecentlyUsedSection
                onSelectTool={(toolId) => navigateTo(getToolPrimaryPath(toolId))}
                onViewAllTools={() => navigateTo('/tools')}
              />

              {/* 6. Daily Goal Tracker Progress Widget */}
              <DailyGoalTracker
                onSelectTool={(toolId) => navigateTo(getToolPrimaryPath(toolId))}
                onExploreTools={() => navigateTo('/tools')}
              />

              {/* 7. 7-Day Tool Usage Analytics Dashboard (Recharts visualization) */}
              <Suspense fallback={null}>
                <AnalyticsDashboard
                  onExploreTools={() => navigateTo('/tools')}
                />
              </Suspense>

              {/* 8. Pinned Favorites Section */}
              <FavoritesSection
                onSelectTool={(toolId) => navigateTo(getToolPrimaryPath(toolId))}
              />

              {/* 9. Specialized Spotlight: UAE Salary & Gratuity Calculators */}
              <FeaturedUAESection
                onOpenSalary={() => navigateTo('/tools/uae-salary-calculator')}
                onOpenGratuity={() => navigateTo('/tools/uae-gratuity-calculator')}
              />

              {/* 10. Specialized Spotlight: AI Image & Video Prompt Generators */}
              <FeaturedAIPromptsSection
                onOpenPhotoPrompt={() => navigateTo('/tools/ai-photo-prompt-generator')}
                onOpenVideoPrompt={() => navigateTo('/tools/ai-video-prompt-generator')}
              />

              {/* 11. How It Works & FAQ sections */}
              <HowItWorksSection />
              <FAQSection />
            </div>
          )}

          {/* Route 2: Dedicated All Tools Directory Page ("/tools") */}
          {isDirectoryPage && (
            <ToolsDirectoryPage initialCategory={directoryCategory} onNavigateTo={navigateTo} />
          )}

          {/* Route 3: Dedicated Trust & Legal Pages ("/about", "/contact", "/privacy", "/terms", "/disclaimer") */}
          {activeTrustPage && (
            <TrustPageView page={activeTrustPage} onNavigateTo={navigateTo} />
          )}

        {/* Route 4: Dedicated Individual Tool Pages ("/tools/:slug") */}
        {isToolPage && activeToolDef && activeRouteConfig && (
          <ToolPageLayout
            tool={activeToolDef}
            routeConfig={activeRouteConfig}
            onNavigateTo={navigateTo}
            isReaderMode={isReaderModeActive}
            onToggleReaderMode={toggleReaderMode}
          >
            <Suspense fallback={<ToolWorkspaceSkeleton />}>
              {activeToolDef.id === 'resume-builder' && <ResumeBuilderTool />}
              {activeToolDef.id === 'uae-salary-calculator' && <UAESalaryTool onNavigateTo={navigateTo} />}
              {activeToolDef.id === 'uae-gratuity' && <UAEGratuityTool />}
              {activeToolDef.id === 'gemini-photo-prompt' && <GeminiPhotoPromptTool />}
              {activeToolDef.id === 'ai-video-prompt' && <AIVideoPromptTool />}
              {activeToolDef.id === 'qr-generator' && <QRCodeTool />}
              {activeToolDef.id === 'image-compressor' && <ImageCompressorTool />}
              {activeToolDef.id === 'word-counter' && <WordCounterTool />}
              {activeToolDef.id === 'text-case-converter' && <TextCaseConverterTool />}
              {activeToolDef.id === 'password-generator' && <PasswordGeneratorTool />}
              {activeToolDef.id === 'unit-converter' && <UnitConverterTool />}
              {activeToolDef.id === 'age-calculator' && <AgeCalculatorTool />}
              {activeToolDef.id === 'date-difference' && <DateDifferenceTool />}
              {activeToolDef.id === 'percentage-calculator' && <PercentageCalculatorTool />}
              {activeToolDef.id === 'currency-converter' && <CurrencyConverterTool />}
              {activeToolDef.id === 'discount-calculator' && <DiscountCalculatorTool />}
              {activeToolDef.id === 'bmi-calculator' && <BMICalculatorTool />}
              {activeToolDef.id === 'loan-calculator' && <LoanCalculatorTool />}
              {activeToolDef.id === 'timezone-converter' && <TimeZoneConverterTool />}
              {activeToolDef.id === 'crypto-converter' && <CryptoConverterTool />}
              {activeToolDef.id === 'markdown-editor' && <MarkdownEditorTool />}
              {activeToolDef.id === 'password-strength' && <PasswordStrengthTool />}
              {activeToolDef.id === 'seo-meta-generator' && <SeoMetaGeneratorTool />}
              {activeToolDef.id === 'seo-page-analyzer' && <SeoPageAnalyzerTool />}
              {activeToolDef.id === 'json-formatter' && <JsonFormatterTool />}
              {activeToolDef.id === 'base64-converter' && <Base64ConverterTool />}
              {activeToolDef.id === 'color-picker' && <ColorPickerTool />}
              {activeToolDef.id === 'pdf-tools-suite' && <PdfToolsSuiteTool />}
            </Suspense>
          </ToolPageLayout>
        )}

        {/* Route 5: Custom 404 Not Found Page */}
        {isNotFound && (
          <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl font-extrabold font-mono">
              404
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'ur' ? 'صفحہ دستیاب نہیں ہے' : 'Page or Tool Not Found'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {language === 'ur'
                  ? 'مطلوبہ یو آر ایل کے لیے کوئی صفحہ یا ٹول نہیں ملا۔ براہ کرم تمام ٹولز ڈائرکٹری دیکھیں۔'
                  : `The page or utility you requested may have moved or does not exist at this URL. Use the directory below to open any of our ${TOOLS_LIST.length} free tools.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <a
                href="/tools"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    navigateTo('/tools');
                  }
                }}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
              >
                {language === 'ur' ? 'تمام ٹولز ڈائرکٹری دیکھیں' : 'Browse All Tools'}
              </a>
              <a
                href="/"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    navigateTo('/');
                  }
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {language === 'ur' ? 'ہوم پیج پر جائیں' : 'Back to Homepage'}
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer with crawlable links (Collapsed in Reader Mode) */}
      {!isReaderModeActive && (
        <Footer
          onNavigate={navigateTo}
          onOpenLegal={setLegalModalType}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenPrintHistory={() => setIsPrintHistoryOpen(true)}
          onStartTour={() => setIsTourOpen(true)}
        />
      )}
      </div>

      {/* Saved & Recent Tools Drawer */}
      <FavoritesDrawer onNavigate={navigateTo} />

      {/* Legacy Legal Modal preserved for backward compatibility */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Settings Modal (Theme, Language, Storage Reset) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Help & Support Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onNavigateTo={navigateTo}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Global Search Palette */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={(toolId) => navigateTo(getToolPrimaryPath(toolId))}
      />

      {/* Feature Request & Issue Report Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentView={isToolPage && activeToolDef ? `tool:${activeToolDef.id}` : 'home'}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Print History Modal */}
      <PrintHistoryModal
        isOpen={isPrintHistoryOpen}
        onClose={() => setIsPrintHistoryOpen(false)}
        onNavigate={navigateTo}
      />

      {/* Optional Getting Started Tour (only opened on explicit user click) */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigate={navigateTo}
      />

      {/* PWA Offline / Sync Status Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FavoritesProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </FavoritesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
