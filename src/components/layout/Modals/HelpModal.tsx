import React from 'react';
import { X, HelpCircle, BookOpen, Compass, ExternalLink, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (path: string) => void;
  onOpenFeedback: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onNavigateTo,
  onOpenFeedback,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  if (!isOpen) return null;

  const faqs = [
    {
      q: isUrdu ? 'کیا تمام ٹولز مفت ہیں؟' : 'Are all AbbasPro tools 100% free?',
      a: isUrdu
        ? 'ہاں! تمام ٹولز بشمول سی وی بلڈر اور یو اے ای گریجویٹی بغیر کسی سبسکرپشن کے مفت ہیں۔'
        : 'Yes. All 27 tools run completely free in your browser with zero subscription or mandatory sign-up.',
    },
    {
      q: isUrdu ? 'میرا ڈیٹا کہاں محفوظ ہوتا ہے؟' : 'Where is my data processed and stored?',
      a: isUrdu
        ? 'آپ کی تمام تر معلومات اور فائلیں آپ کے اپنے براؤزر کے اندر پروسیس ہوتی ہیں۔'
        : 'Everything executes client-side within your browser sandbox. None of your resume drafts, salary figures, or images are sent to external databases.',
    },
    {
      q: isUrdu ? 'کیا میں آف لائن بھی کام کر سکتا ہوں؟' : 'Can I use AbbasPro offline?',
      a: isUrdu
        ? 'جی ہاں، پروگریسو ویب ایپ (PWA) کے ذریعے زیادہ تر ٹولز آف لائن بھی کام کرتے ہیں۔'
        : 'Yes. With our built-in Progressive Web App (PWA) support, calculators, text tools, and offline engines work without an internet connection.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-700/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'مدد اور رہنمائی' : 'Help & Documentation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUrdu ? 'اکثر پوچھے جانے والے سوالات اور سپورٹ' : 'Frequently asked questions and support guide'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTo('/tools');
              }}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 text-left rtl:text-right transition-colors"
            >
              <Compass className="w-4 h-4 text-blue-600 mb-1" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'ٹولز ڈائرکٹری' : 'All 27 Tools'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isUrdu ? 'تمام ٹولز کی فہرست' : 'Browse full directory'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFeedback();
              }}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 text-left rtl:text-right transition-colors"
            >
              <Mail className="w-4 h-4 text-indigo-600 mb-1" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'رپورٹ یا فیڈ بیک' : 'Send Feedback'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isUrdu ? 'نئے فیچر کی تجویز دیں' : 'Report an issue or idea'}
              </div>
            </button>
          </div>

          {/* FAQs */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {isUrdu ? 'عام سوالات' : 'Common Questions'}
            </h3>
            <div className="space-y-2.5">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs"
                >
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{faq.q}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTo('/about');
            }}
            className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            {isUrdu ? 'ہمارے بارے میں مزید پڑھیں' : 'About AbbasPro Architecture'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
