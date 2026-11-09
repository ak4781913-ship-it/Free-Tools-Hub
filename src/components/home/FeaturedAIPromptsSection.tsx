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
  const { t } = useLanguage();

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
          <Wand2 className="w-4 h-4" />
          <span>Generative AI Engineering</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.home.featuredAIHeading}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {t.home.featuredAISubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo Prompt Card */}
        <div className="flex flex-col justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-400">Gemini · Imagen · Midjourney</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Gemini AI Photo Prompt Generator
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Compose detailed natural language prompts specifying subjects, camera focal lengths, lighting setups, color grading, aspect ratios, and reference face preservation mode.
            </p>

            {/* Prompt preview snippet */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3">
              "Cinematic portrait of a high-fashion editorial model set in minimalist brutalist architecture, crisp late-afternoon sunlight, 85mm f/1.4 lens, 8k resolution, raw photography..."
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
            >
              <span>Build Photo Prompts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Video Prompt Card */}
        <div className="flex flex-col justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-400">Google Flow · Runway · Sora</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              AI Video Prompt Generator
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Direct complete AI video productions with scene-by-scene timing distributions, synchronized camera movement arcs, character consistency across cuts, and dialogue cue separation.
            </p>

            {/* Video preview snippet */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3">
              "[SCENE 1 - 8s]: Drone dolly reveal over clifftop villa. Character gazes toward ocean horizon. Spoken dialogue: 'Some memories never fade...' SFX: Mediterranean wave wash."
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
            >
              <span>Build Video Production Prompts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
