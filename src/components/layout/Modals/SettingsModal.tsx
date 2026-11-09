import React, { useState } from 'react';
import { X, Settings, Moon, Sun, Monitor, Shield, Trash2, Check, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useFavorites } from '../../../context/FavoritesContext';
import { useToast } from '../../../context/ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { clearRecents, clearFavorites, resetFavorites } = useFavorites();
  const { toast } = useToast();
  const isUrdu = language === 'ur';

  const [confirmClearData, setConfirmClearData] = useState(false);

  if (!isOpen) return null;

  const handleClearAllData = () => {
    clearRecents();
    clearFavorites();
    try {
      localStorage.removeItem('freetools_resume_saved');
      localStorage.removeItem('freetools_hub_tool_popularity');
    } catch {}
    resetFavorites();
    setConfirmClearData(false);
    toast.success(
      isUrdu ? 'براؤزر ڈیٹا کامیابی سے صاف ہو گیا' : 'Browser Storage Cleared',
      isUrdu ? 'تمام ڈرافٹس اور تاریخ ری سیٹ کر دی گئی ہے۔' : 'All temporary drafts and usage history have been reset.'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-700/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'ترجیحات اور سیٹنگز' : 'Settings & Preferences'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUrdu ? 'تھیم، زبان اور براؤزر ڈیٹا کی ترتیب' : 'Customize theme, language, and client-side data'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Theme Preference */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              {isUrdu ? 'ڈیش بورڈ تھیم' : 'Dashboard Theme'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="text-left rtl:text-right">
                  <div className="font-bold">{isUrdu ? 'لائٹ موڈ' : 'Light Mode'}</div>
                  <div className="text-[10px] text-slate-500 font-normal">Clean white & blue</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="text-left rtl:text-right">
                  <div className="font-bold">{isUrdu ? 'ڈارک موڈ' : 'Dark Mode'}</div>
                  <div className="text-[10px] text-slate-400 font-normal">Deep navy slate</div>
                </div>
              </button>
            </div>
          </div>

          {/* Language Preference */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              {isUrdu ? 'انٹرفیس زبان' : 'Interface Language'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>English (US)</span>
                {language === 'en' && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  language === 'ur'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>اردو (Urdu)</span>
                {language === 'ur' && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>

          {/* Local Data & Privacy */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isUrdu ? 'مقامی براؤزر ڈیٹا' : 'Local Browser Storage'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isUrdu
                ? 'عباس پرو تمام ڈیٹا جیسے حالیہ ٹولز اور ڈرافٹس آپ کے براؤزر کے لوکل اسٹوریج میں محفوظ رکھتا ہے۔ سرور پر کوئی ذاتی ڈیٹا اپلوڈ نہیں ہوتا۔'
                : 'AbbasPro stores all your inputs, resume drafts, and recent activity strictly in your device browser storage. Zero private data is transmitted to external servers.'}
            </p>

            {confirmClearData ? (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl space-y-2">
                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                  {isUrdu
                    ? 'کیا آپ واقعی تمام مقامی ڈرافٹس اور تاریخ صاف کرنا چاہتے ہیں؟'
                    : 'Are you sure you want to clear all local drafts, recent tools, and favorites?'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isUrdu ? 'ہاں، سب مٹا دیں' : 'Yes, Clear All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearData(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearData(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-100/60 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'براؤزر کا تمام ڈیٹا صاف کریں' : 'Reset Local Storage Data'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {isUrdu ? 'مکمل' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
