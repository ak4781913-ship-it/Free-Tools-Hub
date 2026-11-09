import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  PrintHistoryItem,
  getPrintHistory,
  removePrintDocument,
  clearPrintHistory,
  subscribeToPrintHistory,
  downloadPrintHistoryCSV,
  seedSamplePrintHistory,
} from '../../utils/printHistoryTracking';
import {
  Printer,
  X,
  Clock,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  Sparkles,
  Check,
  AlertCircle,
  FileCheck,
  Layers,
  Calculator,
  Briefcase,
  Globe,
  Type,
  Video,
} from 'lucide-react';

interface PrintHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

export const PrintHistoryModal: React.FC<PrintHistoryModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [history, setHistory] = useState<PrintHistoryItem[]>([]);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Sync history on mount and updates
  useEffect(() => {
    if (!isOpen) return;
    setHistory(getPrintHistory());

    const unsubscribe = subscribeToPrintHistory((updated) => {
      setHistory(updated);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Keyboard escape listener
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

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removePrintDocument(id);
    setHistory(updated);
    showToast(isUrdu ? 'دستاویز ہسٹری سے ہٹا دی گئی' : 'Document removed from print history');
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    clearPrintHistory();
    setHistory([]);
    setConfirmClear(false);
    showToast(isUrdu ? 'پرنٹ ہسٹری صاف کر دی گئی' : 'Print history cleared');
  };

  const handleOpenTool = (toolId: string) => {
    onClose();
    onNavigate(`tool:${toolId}`);
  };

  const handleReprint = (item: PrintHistoryItem) => {
    onClose();
    onNavigate(`tool:${item.toolId}`);
    // Small timeout to give the view time to render before triggering print
    setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 600);
  };

  const handleLoadSamples = () => {
    const samples = seedSamplePrintHistory();
    setHistory(samples);
    showToast(isUrdu ? 'نمونہ پرنٹ دستاویزات شامل کر دی گئیں' : 'Sample print documents loaded');
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;
    downloadPrintHistoryCSV(history);
    showToast(isUrdu ? 'سی ایس وی فائل ڈاؤن لوڈ ہو گئی' : 'Print history CSV downloaded');
  };

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  const getToolIcon = (toolId: string) => {
    switch (toolId) {
      case 'resume-builder':
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      case 'uae-gratuity':
        return <Calculator className="w-4 h-4 text-emerald-500" />;
      case 'seo-page-analyzer':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'word-counter':
        return <Type className="w-4 h-4 text-violet-500" />;
      case 'ai-video-prompt':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'gemini-photo-prompt':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Feedback */}
        {copiedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{copiedToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="print-history-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  {isUrdu ? 'پرنٹ ہسٹری ٹریکر' : 'Print History Tracker'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                  {history.length}/5 {isUrdu ? 'محفوظ' : 'Saved'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {isUrdu
                  ? 'پرنٹ یا پی ڈی ایف کے ذریعے بنائی گئی آخری 5 دستاویزات'
                  : 'Automatically stores the last 5 documents generated using the print or export functions.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / History List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {history.length === 0 ? (
            /* Empty State */
            <div className="py-10 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/60">
                <Printer className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isUrdu ? 'ابھی تک کوئی دستاویز پرنٹ نہیں ہوئی' : 'No Print History Recorded Yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isUrdu
                    ? 'جب بھی آپ سی وی جنریٹر، مارک ڈاؤن ایڈیٹر، یو اے ای گریجویٹی کیلکولیٹر یا ایس ای او پیج اینالائزر سے کوئی دستاویز پرنٹ یا پی ڈی ایف ڈاؤن لوڈ کریں گے، وہ خودکار طور پر یہاں محفوظ ہو جائے گی (زیادہ سے زیادہ 5 دستاویزات)۔'
                    : 'Whenever you trigger the print function or generate an A4 document from tools like CV Generator, Markdown Editor, or UAE Gratuity, your last 5 documents will be tracked right here.'}
                </p>
              </div>

              {/* Quick Launch Recommendations */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isUrdu ? 'پرنٹ ایبل ٹولز آزمائیں:' : 'Try Printing With These Tools:'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenTool('resume-builder')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>CV Generator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenTool('markdown-editor')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Markdown Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenTool('uae-gratuity')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>UAE Gratuity</span>
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleLoadSamples}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'نمونہ پرنٹ ہسٹری لوڈ کریں' : 'Load Sample Print Documents to Preview'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* History List Cards */
            history.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 space-y-2.5 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10.5px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                          {getToolIcon(item.toolId)}
                          <span>{item.toolName}</span>
                        </span>
                      </div>

                      {item.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.formattedDate}</span>
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                          {item.format}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on card */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReprint(item)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title={isUrdu ? 'دوبارہ پرنٹ کریں' : 'Re-open and print document'}
                    >
                      <Printer className="w-3 h-3" />
                      <span className="hidden sm:inline">{isUrdu ? 'پرنٹ' : 'Re-Print'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTool(item.toolId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title={isUrdu ? 'ٹول کھولیں' : 'Open tool'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={isUrdu ? 'ہسٹری سے ہٹائیں' : 'Remove from print history'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Toolbar */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11.5px]">
            {isUrdu
              ? 'صرف آخری 5 دستاویزات خودکار طور پر محفوظ کی جاتی ہیں۔'
              : 'Retains your 5 most recent documents locally on this device.'}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {history.length < 5 && (
              <button
                type="button"
                onClick={handleLoadSamples}
                className="px-3 py-1.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isUrdu ? 'نمونہ ڈیٹا' : 'Seed Sample Data'}
              </button>
            )}

            {history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Export print history to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isUrdu ? 'سی ایس وی ایکسپورٹ' : 'Export CSV'}</span>
                </button>

                {confirmClear ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                    >
                      {isUrdu ? 'تصدیق کریں' : 'Confirm Clear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isUrdu ? 'منسوخ' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1.5 rounded-xl font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'تمام صاف کریں' : 'Clear History'}</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors cursor-pointer shadow-xs"
            >
              {isUrdu ? 'بند کریں' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
