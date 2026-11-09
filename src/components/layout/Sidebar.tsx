import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Image as ImageIcon,
  Video,
  Code,
  FileText,
  Calculator,
  Briefcase,
  Type,
  Gauge,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Star,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/tools';
import { TOOL_ROUTES, getToolPrimaryPath } from '../../data/toolsRouting';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';

interface SidebarProps {
  currentPath: string;
  onNavigateTo: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

interface NavCategory {
  id: string;
  label: string;
  labelUrdu: string;
  icon: React.ElementType;
  path: string; // target URL (e.g. /tools?category=...)
  toolIds: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigateTo,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenHelp,
}) => {
  const { language } = useLanguage();
  const { favorites } = useFavorites();
  const isUrdu = language === 'ur';

  // State to track which categories are expanded in the sidebar
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => ({
    'ai-tools': false,
    'calculators': false,
  }));

  const toggleCategoryExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Structured categories matching user prompt and real tools
  const navCategories: NavCategory[] = [
    {
      id: 'ai-tools',
      label: 'AI Tools',
      labelUrdu: 'اے آئی ٹولز',
      icon: Sparkles,
      path: '/tools?category=ai-tools',
      toolIds: ['gemini-photo-prompt', 'ai-video-prompt', 'seo-meta-generator'],
    },
    {
      id: 'photo-image',
      label: 'Photo Tools',
      labelUrdu: 'تصویری ٹولز',
      icon: ImageIcon,
      path: '/tools?category=photo-image',
      toolIds: ['image-compressor', 'qr-generator', 'color-picker'],
    },
    {
      id: 'video-content',
      label: 'Video Tools',
      labelUrdu: 'ویڈیو ٹولز',
      icon: Video,
      path: '/tools?category=video-content',
      toolIds: ['ai-video-prompt', 'markdown-editor'],
    },
    {
      id: 'developer-tools',
      label: 'Developer Tools',
      labelUrdu: 'ڈویلپر ٹولز',
      icon: Code,
      path: '/tools?category=other-utilities',
      toolIds: ['json-formatter', 'base64-converter', 'seo-page-analyzer', 'password-generator'],
    },
    {
      id: 'pdf-tools',
      label: 'PDF & Documents',
      labelUrdu: 'پی ڈی ایف اور دستاویزات',
      icon: FileText,
      path: '/tools/cv-maker',
      toolIds: ['resume-builder', 'markdown-editor'],
    },
    {
      id: 'calculators',
      label: 'Calculators',
      labelUrdu: 'کیلکولیٹرز',
      icon: Calculator,
      path: '/tools?category=uae-calculators',
      toolIds: [
        'uae-salary-calculator',
        'uae-gratuity',
        'loan-calculator',
        'currency-converter',
        'discount-calculator',
        'percentage-calculator',
        'age-calculator',
        'date-difference',
        'bmi-calculator',
        'crypto-converter',
        'unit-converter',
      ],
    },
    {
      id: 'career-cv',
      label: 'CV & Resume Tools',
      labelUrdu: 'سی وی اور ریزیومے',
      icon: Briefcase,
      path: '/tools/cv-maker',
      toolIds: ['resume-builder'],
    },
    {
      id: 'text-tools',
      label: 'Text Tools',
      labelUrdu: 'متن ٹولز',
      icon: Type,
      path: '/tools?category=video-content',
      toolIds: ['word-counter', 'text-case-converter', 'markdown-editor'],
    },
    {
      id: 'productivity-tools',
      label: 'Productivity Tools',
      labelUrdu: 'پروڈکٹیوٹی ٹولز',
      icon: Gauge,
      path: '/tools?category=other-utilities',
      toolIds: ['timezone-converter', 'password-generator', 'password-strength', 'unit-converter', 'qr-generator'],
    },
  ];

  const handleNav = (path: string, e?: React.MouseEvent) => {
    if (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
    }
    onNavigateTo(path);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const isCurrentActive = (path: string) => {
    if (path === '/' && (currentPath === '/' || currentPath === '')) return true;
    if (path !== '/' && currentPath === path) return true;
    return false;
  };

  const isCategoryActive = (cat: NavCategory) => {
    if (currentPath === cat.path) return true;
    if (currentPath.startsWith('/tools/')) {
      const slug = currentPath.replace(/^\/tools\//, '');
      const config = Object.values(TOOL_ROUTES).find((r) => r.primarySlug === slug || r.aliases.includes(slug));
      if (config && cat.toolIds.includes(config.id)) {
        return true;
      }
    }
    return false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <a
          href="/"
          onClick={(e) => handleNav('/', e)}
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center font-black text-base shadow-sm shadow-blue-900/20 shrink-0 group-hover:scale-105 transition-transform">
            AP
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Abbas<span className="text-blue-700 dark:text-blue-400">Pro</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Tools Dashboard
              </span>
            </div>
          )}
        </a>

        {/* Mobile close button */}
        {isMobileOpen ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          /* Desktop collapse toggle */
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {/* Dashboard Home */}
        <a
          href="/"
          onClick={(e) => handleNav('/', e)}
          title={isCollapsed ? (isUrdu ? 'ڈیش بورڈ' : 'Dashboard') : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
            isCurrentActive('/')
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 shadow-2xs ring-1 ring-blue-600/20'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
              isCurrentActive('/') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          {!isCollapsed && (
            <span className="truncate flex-1">
              {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
            </span>
          )}
        </a>

        {/* All Tools Directory */}
        <a
          href="/tools"
          onClick={(e) => handleNav('/tools', e)}
          title={isCollapsed ? (isUrdu ? 'تمام ٹولز' : 'All Tools') : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
            isCurrentActive('/tools')
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 shadow-2xs ring-1 ring-blue-600/20'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass
            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
              isCurrentActive('/tools') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">{isUrdu ? 'تمام ٹولز ڈائرکٹری' : 'All Tools Directory'}</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {TOOLS_LIST.length}
              </span>
            </div>
          )}
        </a>

        {/* Section Divider */}
        {!isCollapsed && (
          <div className="pt-3 pb-1 px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {isUrdu ? 'کیٹیگریز' : 'Tool Categories'}
            </span>
          </div>
        )}

        {/* Category List */}
        {navCategories.map((category) => {
          const Icon = category.icon;
          const isActive = isCategoryActive(category);
          const isExpanded = !!expandedCategories[category.id];
          const hasChildren = category.toolIds.length > 0;

          return (
            <div key={category.id} className="space-y-1">
              <div
                className={`flex items-center justify-between rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <a
                  href={category.path}
                  onClick={(e) => handleNav(category.path, e)}
                  title={isCollapsed ? (isUrdu ? category.labelUrdu : category.label) : undefined}
                  className="flex items-center gap-3 px-3 py-2 text-xs flex-1 min-w-0 group"
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1">
                      {isUrdu ? category.labelUrdu : category.label}
                    </span>
                  )}
                </a>

                {/* Expand / Collapse sub-menu toggle */}
                {!isCollapsed && hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => toggleCategoryExpand(category.id, e)}
                    aria-label={`Toggle ${category.label} tools`}
                    className="p-1.5 mr-2 rtl:mr-0 rtl:ml-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Sub-menu Tools list when expanded */}
              {!isCollapsed && isExpanded && hasChildren && (
                <div className="pl-8 rtl:pl-0 rtl:pr-8 pr-2 py-1 space-y-1 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 dark:border-slate-800 ml-4 rtl:ml-0 rtl:mr-4 animate-in fade-in slide-in-from-top-1 duration-150">
                  {category.toolIds.map((toolId) => {
                    const tool = TOOLS_LIST.find((t) => t.id === toolId);
                    if (!tool) return null;
                    const path = getToolPrimaryPath(tool.id);
                    const isToolActive = currentPath === path;

                    return (
                      <a
                        key={tool.id}
                        href={path}
                        onClick={(e) => handleNav(path, e)}
                        className={`block px-2.5 py-1.5 rounded-lg text-[11px] truncate transition-colors ${
                          isToolActive
                            ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/50'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {isUrdu ? tool.nameUrdu : tool.name}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Bottom Actions */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title={isCollapsed ? (isUrdu ? 'سیٹنگز' : 'Settings') : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:rotate-45 transition-transform" />
          {!isCollapsed && <span>{isUrdu ? 'سیٹنگز' : 'Settings'}</span>}
        </button>

        {/* Help & Support button */}
        <button
          type="button"
          onClick={onOpenHelp}
          title={isCollapsed ? (isUrdu ? 'مدد اور رہنمائی' : 'Help & Support') : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span>{isUrdu ? 'مدد اور رہنمائی' : 'Help & Support'}</span>}
        </button>

        {/* Privacy badge */}
        {!isCollapsed && (
          <div className="pt-2 px-3 flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
            <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">100% Client-Side Privacy</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky / Fixed Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 z-30 no-print ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer with Backdrop */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Sidebar"
          className="fixed inset-0 z-50 lg:hidden flex no-print"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer Pane */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
