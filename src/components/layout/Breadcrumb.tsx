import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  toolName: string;
  categoryName: string;
  onBack: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  toolName,
  categoryName,
  onBack,
}) => {
  const { dir, t } = useLanguage();

  return (
    <div className="w-full bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
        >
          {dir === 'rtl' ? (
            <ArrowRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowLeft className="w-3.5 h-3.5" />
          )}
          <span>{t.backToHome}</span>
        </button>

        {/* Unboxed Metadata Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-hidden">
          <button
            onClick={onBack}
            className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.nav.home}</span>
          </button>
          <span aria-hidden="true" className="text-slate-400">/</span>
          <span className="truncate">{categoryName}</span>
          <span aria-hidden="true" className="text-slate-400">/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {toolName}
          </span>
        </nav>
      </div>
    </div>
  );
};
