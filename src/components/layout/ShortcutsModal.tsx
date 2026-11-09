import React, { useEffect } from 'react';
import { X, Keyboard, Search, CornerDownLeft, ArrowUpDown, Bookmark, Home, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: isUrdu ? 'تلاش اور کمانڈ' : 'Search & Command Palette',
      items: [
        { keys: ['/'], description: isUrdu ? 'گلوبل سرچ کھولیں' : 'Focus global search / open command palette' },
        { keys: ['⌘', 'K'], altKeys: ['Ctrl', 'K'], description: isUrdu ? 'فوری ٹول نیویگیشن' : 'Quick tool switcher command palette' },
        { keys: ['↑', '↓'], description: isUrdu ? 'نتائج میں نیویگیٹ کریں' : 'Navigate search results' },
        { keys: ['↵'], description: isUrdu ? 'منتخب ٹول کھولیں' : 'Open selected tool' },
      ],
    },
    {
      category: isUrdu ? 'نیویگیشن اور ڈراز' : 'Navigation & Drawers',
      items: [
        { keys: ['ESC'], description: isUrdu ? 'ڈائیلاگ یا ڈراور بند کریں / ریڈر موڈ سے باہر نکلیں' : 'Close any open drawer, modal, or exit Reader Mode' },
        { keys: ['Alt', 'R'], description: isUrdu ? 'ریڈر موڈ (خلفشار سے پاک فوکس ٹول ویو)' : 'Toggle Reader / Focus Mode (Tool pages)' },
        { keys: ['Alt', 'H'], description: isUrdu ? 'ہوم پیج پر جائیں' : 'Navigate directly to Home / Tools Hub' },
        { keys: ['Alt', 'F'], description: isUrdu ? 'محفوظ کردہ ٹولز ڈراور' : 'Toggle Saved & Favorites drawer' },
        { keys: ['Alt', 'P'], description: isUrdu ? 'پرنٹ ہسٹری ٹریکر (آخری 5 دستاویزات)' : 'Open Print History tracker (last 5 documents)' },
        { keys: ['?'], description: isUrdu ? 'کی بورڈ شارٹ کٹس گائیڈ' : 'Open keyboard shortcuts cheat sheet' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <Keyboard className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'کی بورڈ شارٹ کٹس' : 'Keyboard Shortcuts'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.category}
              </span>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="px-3.5 py-2.5 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                      {item.altKeys && (
                        <>
                          <span className="text-[10px] text-slate-400 mx-0.5">/</span>
                          {item.altKeys.map((ak, akIdx) => (
                            <kbd
                              key={akIdx}
                              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                            >
                              {ak}
                            </kbd>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">ESC</kbd> anytime to dismiss</span>
          <span>FreeTools Hub Accessibility</span>
        </div>
      </div>
    </div>
  );
};
