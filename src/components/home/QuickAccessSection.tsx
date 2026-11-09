import React from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { ToolCard } from './ToolCard';
import { useLanguage } from '../../context/LanguageContext';

interface QuickAccessSectionProps {
  onSelectTool: (toolId: string) => void;
  onViewAllTools: () => void;
}

// 8 most frequently accessed and highly useful tools in AbbasPro
const QUICK_ACCESS_TOOL_IDS = [
  'resume-builder',
  'uae-salary-calculator',
  'uae-gratuity',
  'gemini-photo-prompt',
  'ai-video-prompt',
  'image-compressor',
  'qr-generator',
  'seo-page-analyzer',
];

export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({
  onSelectTool,
  onViewAllTools,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const tools: ToolDefinition[] = QUICK_ACCESS_TOOL_IDS.map((id) =>
    TOOLS_LIST.find((t) => t.id === id)
  ).filter((t): t is ToolDefinition => Boolean(t));

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isUrdu ? 'فوری رسائی ٹولز' : 'Quick Access Tools'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isUrdu
              ? 'روزمرہ کاموں کے لیے سب سے زیادہ مقبول اور کارآمد ٹولز'
              : 'Our most popular and essential tools, accessible in one click'}
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAllTools}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isUrdu ? 'مکمل ڈائرکٹری دیکھیں' : 'View All Tools'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Modern Tool Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
        ))}
      </div>
    </section>
  );
};
