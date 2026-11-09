import React from 'react';
import {
  Sparkles,
  Briefcase,
  Calculator,
  Image as ImageIcon,
  Video,
  Code,
  ArrowRight,
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/tools';
import { TOOL_ROUTES } from '../../data/toolsRouting';
import { useLanguage } from '../../context/LanguageContext';

interface CategoryCardsSectionProps {
  onSelectCategory: (categoryId: string) => void;
  onViewAllTools: () => void;
}

interface DisplayCategory {
  id: string;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  icon: React.ElementType;
  count: number;
  gradient: string;
  iconColor: string;
}

export const CategoryCardsSection: React.FC<CategoryCardsSectionProps> = ({
  onSelectCategory,
  onViewAllTools,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // Count tools in each group dynamically from real project data
  const categories: DisplayCategory[] = [
    {
      id: 'ai-tools',
      name: 'AI & Generative Prompts',
      nameUrdu: 'اے آئی و پرامپٹ ٹولز',
      description: 'Studio-grade photo prompts, directorial video scripts, and SEO AI tools.',
      descriptionUrdu: 'جیمینائی فوٹو پرامپٹس، ویڈیو اسکرپٹس اور ایس ای او اے آئی اوزار۔',
      icon: Sparkles,
      count: Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === 'ai-tools').length,
      gradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-950/40 dark:to-indigo-950/40',
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      id: 'career-cv',
      name: 'Career & CV Builder',
      nameUrdu: 'کیریئر اور سی وی میکر',
      description: 'Professional ATS-compliant resumes with live multi-template PDF exports.',
      descriptionUrdu: 'پیشہ ورانہ سی وی میکر، ٹیمپلیٹس اور فوری پی ڈی ایف ڈاؤن لوڈ۔',
      icon: Briefcase,
      count: Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === 'career-cv').length,
      gradient: 'from-indigo-500/10 to-blue-500/10 dark:from-indigo-950/40 dark:to-blue-950/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      id: 'uae-calculators',
      name: 'UAE Payroll & Gratuity',
      nameUrdu: 'یو اے ای سیلری اور گریجویٹی',
      description: 'Official calculation engines under UAE Federal Decree-Law No. 33 of 2021.',
      descriptionUrdu: 'متحدہ عرب امارات کے لیبر قانون کے مطابق اختتامِ ملازمت کے فوائد کا درست حساب۔',
      icon: Calculator,
      count: Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === 'uae-calculators').length,
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      id: 'photo-image',
      name: 'Photo & Image Studio',
      nameUrdu: 'تصویری اور فوٹو ٹولز',
      description: 'Client-side image compressor, custom QR generator, and color studio.',
      descriptionUrdu: 'امیج کمپریسر، کیو آر کوڈ جنریٹر اور ایڈوانس کلر پکر۔',
      icon: ImageIcon,
      count: Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === 'photo-image').length,
      gradient: 'from-cyan-500/10 to-blue-500/10 dark:from-cyan-950/40 dark:to-blue-950/40',
      iconColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60',
    },
    {
      id: 'video-content',
      name: 'Video & Markdown Writing',
      nameUrdu: 'ویڈیو اور کنٹینٹ رائٹنگ',
      description: 'Scene-by-scene directorial video scripts, live markdown, and text counters.',
      descriptionUrdu: 'ویڈیو پرامپٹس، مارک ڈاؤن ایڈیٹر، اور الفاظ کاؤنٹر۔',
      icon: Video,
      count: Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === 'video-content').length,
      gradient: 'from-purple-500/10 to-indigo-500/10 dark:from-purple-950/40 dark:to-indigo-950/40',
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      id: 'other-utilities',
      name: 'Developer & Everyday Utilities',
      nameUrdu: 'ڈویلپر اور روزمرہ اوزار',
      description: 'JSON formatters, Base64 converters, password generators, and unit converters.',
      descriptionUrdu: 'جیسن فارمیٹر، بیس 64، پاس ورڈ جنریٹر اور یونٹ کنورٹر۔',
      icon: Code,
      count: Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === 'other-utilities').length,
      gradient: 'from-slate-500/10 to-blue-500/10 dark:from-slate-950/40 dark:to-blue-950/40',
      iconColor: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isUrdu ? 'ٹول کیٹیگریز' : 'Explore by Category'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isUrdu
              ? 'اپنی ضرورت کے مطابق کیٹیگری منتخب کریں اور متعلقہ ٹولز دیکھیں'
              : 'Choose a specialized category to find the right tool for your task'}
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAllTools}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
        >
          <span>{isUrdu ? 'تمام دیکھیں' : 'View All'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl ${cat.iconColor} flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    {cat.count} {isUrdu ? 'ٹولز' : 'Tools'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {isUrdu ? cat.nameUrdu : cat.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {isUrdu ? cat.descriptionUrdu : cat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
                <span>{isUrdu ? 'کیٹیگری کھولیں' : 'View Category'}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
