import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, Video, Camera, ArrowRight, Wand2 } from 'lucide-react';

interface FeaturedAIPromptsSectionProps {
  onOpenPhotoPrompt: () => void;
  onOpenVideoPrompt: () => void;
}

export const FeaturedAIPromptsSection: React.FC<FeaturedAIPromptsSectionProps> = ({
  onOpenPhotoPrompt,
  onOpenVideoPrompt,
}) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  return (
    <section className="w-full py-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
          <Wand2 className="w-4 h-4" />
          <span>{isUrdu ? 'جنریٹو اے آئی انجینئرنگ' : 'Generative AI Engineering'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.home.featuredAIHeading}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {t.home.featuredAISubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Prompt Card */}
        <article className="flex flex-col justify-between p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Gemini · Imagen · Midjourney
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isUrdu ? 'جیمینائی اے آئی فوٹو پرامپٹ جنریٹر' : 'Gemini AI Photo Prompt Generator'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {isUrdu
                ? 'کیمرہ فوکل لینتھ، لائٹنگ، کلر گریڈنگ، اسپیکٹ ریشو اور چہرے کی شناخت محفوظ رکھنے والے تفصیلی فوٹو پرامپٹس بنائیں۔'
                : 'Compose detailed natural language prompts specifying subjects, camera focal lengths, lighting setups, color grading, aspect ratios, and reference face preservation mode.'}
            </p>

            {/* Prompt preview snippet */}
            <div dir="ltr" className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3 text-left">
              &quot;Cinematic portrait of a high-fashion editorial model set in minimalist brutalist architecture, crisp late-afternoon sunlight, 85mm f/1.4 lens, 8k resolution, raw photography...&quot;
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <a
              href="/tools/ai-photo-prompt-generator"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onOpenPhotoPrompt();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline transition-colors"
            >
              <span>{isUrdu ? 'فوٹو پرامپٹس بنائیں' : 'Build Photo Prompts'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>
        </article>

        {/* Video Prompt Card */}
        <article className="flex flex-col justify-between p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Google Flow · Runway · Sora
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isUrdu ? 'اے آئی ویڈیو پرامپٹ جنریٹر' : 'AI Video Prompt Generator'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {isUrdu
                ? 'سین بائی سین ٹائمنگ، کیمرہ موومنٹ، کرداروں کے تسلسل اور ڈائیلاگ اشاروں کے ساتھ مکمل ویڈیو پرامپٹس تیار کریں۔'
                : 'Direct complete AI video productions with scene-by-scene timing distributions, synchronized camera movement arcs, character consistency across cuts, and dialogue cue separation.'}
            </p>

            {/* Video preview snippet */}
            <div dir="ltr" className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3 text-left">
              &quot;[SCENE 1 - 8s]: Drone dolly reveal over clifftop villa. Character gazes toward ocean horizon. Spoken dialogue: &apos;Some memories never fade...&apos; SFX: Mediterranean wave wash.&quot;
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <a
              href="/tools/ai-video-prompt-generator"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onOpenVideoPrompt();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline transition-colors"
            >
              <span>{isUrdu ? 'ویڈیو پروڈکشن پرامپٹس بنائیں' : 'Build Video Production Prompts'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          </div>
        </article>
      </div>
    </section>
  );
};
