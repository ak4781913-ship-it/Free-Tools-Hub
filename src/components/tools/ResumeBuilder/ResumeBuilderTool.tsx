import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { toCanvas } from 'html-to-image';
import html2canvas from 'html2canvas-pro';
import { ResumeData } from '../../../types/resume';
import { INITIAL_EMPTY_RESUME, EXAMPLE_RESUME } from './resumeConstants';
import { ResumeForm } from './ResumeForm';
import { ResumePreview } from './ResumePreview';
import { generateResumePDF } from './resumePdfGenerator';
import { useLanguage } from '../../../context/LanguageContext';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';
import { useAutoSave, formatSavedTime } from '../../../utils/useAutoSave';
import { Print } from '../../common/Print';
import {
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  FileDown,
  Loader2,
  ChevronDown,
  FileText,
  Eye,
  Edit3,
  Columns,
  Layers,
} from 'lucide-react';

export const ResumeBuilderTool: React.FC = () => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const {
    data: resumeData,
    setData: setResumeData,
    updateData,
    lastSaved,
    isSaving,
    hasSavedDraft,
    clearDraft,
    restoreBackup,
  } = useAutoSave<ResumeData>('freetools_resume_saved', EXAMPLE_RESUME, 300);

  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportTypeState, setExportTypeState] = useState<'vector' | 'visual'>('vector');
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3800);
  };

  const validateResumeForExport = (): boolean => {
    const trimmedName = (resumeData.personalInfo.fullName || '').trim();
    if (!trimmedName) {
      const msg = isUrdu
        ? 'پی ڈی ایف ڈاؤن لوڈ کرنے سے پہلے براہ کرم اپنا پورا نام درج کریں۔'
        : 'Please enter your Full Name under Personal Information before exporting or printing your CV.';
      setValidationError(msg);
      setMobileTab('form');
      showToast(msg);
      return false;
    }

    const trimmedEmail = (resumeData.personalInfo.email || '').trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      const msg = isUrdu
        ? 'براہ کرم پی ڈی ایف بنانے سے پہلے درست ای میل ایڈریس درج کریں۔'
        : 'Please enter a valid email address (or leave Email blank) before exporting your CV.';
      setValidationError(msg);
      setMobileTab('form');
      showToast(msg);
      return false;
    }

    setValidationError(null);
    return true;
  };

  /**
   * PDF Export Handler
   * @param exportMode 'vector' for native ATS-friendly vector PDF, 'visual' for pixel-accurate canvas capture
   */
  const handleDownloadPDF = async (exportMode: 'vector' | 'visual' = 'vector') => {
    if (isExportingPDF) return;
    if (!validateResumeForExport()) return;

    setIsExportingPDF(true);
    setExportTypeState(exportMode);
    setShowPdfOptions(false);
    showToast(isUrdu ? 'اعلیٰ معیار کا پی ڈی ایف تیار ہو رہا ہے...' : 'Generating high-resolution PDF document...');

    try {
      const rawName = (resumeData.personalInfo.fullName || 'Resume').trim();
      const sanitizedName = rawName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || 'Resume';
      const fileName = `${sanitizedName}_CV.pdf`;

      if (exportMode === 'vector') {
        // Method 1: High-Resolution, Vector-Rendered, Multi-Page ATS-Compliant PDF
        const pdf = await generateResumePDF(resumeData);
        pdf.save(fileName);
        recordPrintDocument('resume-builder', `${rawName} – ${resumeData.personalInfo.jobTitle || 'CV Resume'}`, {
          toolName: 'CV & Resume Generator',
          format: 'A4 Vector PDF',
          summary: `${resumeData.experience.length} experiences, ${resumeData.education.length} education entries`,
        });
        showToast(isUrdu ? `پی ڈی ایف "${fileName}" کامیابی سے ڈاؤن لوڈ ہو گئی!` : `Downloaded "${fileName}" (ATS Vector PDF) successfully!`);
      } else {
        // Method 2: Pixel-Accurate DOM Canvas Rasterization
        const resumeElement = document.getElementById('printable-resume-area');
        if (!resumeElement) {
          throw new Error('Resume preview area not found.');
        }

        let canvas: HTMLCanvasElement;
        try {
          canvas = await toCanvas(resumeElement, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            cacheBust: true,
          });
        } catch (toCanvasErr) {
          console.warn('Primary toCanvas renderer encountered an issue, trying html2canvas-pro fallback...', toCanvasErr);
          canvas = await html2canvas(resumeElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: resumeElement.scrollWidth,
          });
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }

        pdf.save(fileName);
        showToast(isUrdu ? `پی ڈی ایف "${fileName}" کامیابی سے ڈاؤن لوڈ ہو گئی!` : `Downloaded "${fileName}" (Visual Snapshot PDF) successfully!`);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Seamless Fallback: Generate vector PDF if visual failed
      try {
        const rawName = (resumeData.personalInfo.fullName || 'Resume').trim();
        const sanitizedName = rawName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || 'Resume';
        const fileName = `${sanitizedName}_CV.pdf`;
        const pdf = await generateResumePDF(resumeData);
        pdf.save(fileName);
        showToast(isUrdu ? `پی ڈی ایف "${fileName}" کامیابی سے ڈاؤن لوڈ ہو گئی!` : `Downloaded "${fileName}" successfully!`);
      } catch (fallbackErr) {
        console.error('Vector fallback also failed:', fallbackErr);
        showToast(isUrdu ? 'براہ راست پی ڈی ایف میں مسئلہ آیا۔ پرنٹ ڈائیلاگ کھولا جا رہا ہے...' : 'Direct PDF export failed. Opening print dialog...');
        window.print();
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${resumeData.personalInfo.fullName.replace(/\s+/g, '_') || 'Resume'}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Resume JSON data exported successfully!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_JSON_BYTES = 2 * 1024 * 1024; // 2 MB cap
    if (file.size > MAX_JSON_BYTES) {
      const msg = isUrdu
        ? 'فائل کا سائز 2MB کی حد سے زیادہ ہے۔'
        : 'Resume JSON file exceeds the 2 MB size limit.';
      setValidationError(msg);
      showToast(msg);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || ''));
        if (parsed && typeof parsed === 'object' && parsed.personalInfo && typeof parsed.personalInfo === 'object') {
          const safeData: ResumeData = {
            personalInfo: {
              ...INITIAL_EMPTY_RESUME.personalInfo,
              ...parsed.personalInfo,
            },
            experience: Array.isArray(parsed.experience) ? parsed.experience : [],
            education: Array.isArray(parsed.education) ? parsed.education : [],
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            languages: Array.isArray(parsed.languages) ? parsed.languages : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            sectionVisibility: {
              ...INITIAL_EMPTY_RESUME.sectionVisibility,
              ...(parsed.sectionVisibility && typeof parsed.sectionVisibility === 'object' ? parsed.sectionVisibility : {}),
            },
            designSettings: {
              ...INITIAL_EMPTY_RESUME.designSettings,
              ...(parsed.designSettings && typeof parsed.designSettings === 'object' ? parsed.designSettings : {}),
            },
          };
          setValidationError(null);
          updateData(safeData);
          showToast(isUrdu ? 'سی وی ڈیٹا کامیابی سے لوڈ ہو گیا!' : 'Resume imported successfully!');
        } else {
          showToast(isUrdu ? 'درست سی وی JSON فارمیٹ نہیں ملا۔' : 'Invalid resume JSON format.');
        }
      } catch {
        showToast(isUrdu ? 'فائل پڑھنے میں خرابی۔ براہ کرم درست JSON فائل منتخب کریں۔' : 'Error reading file. Ensure valid JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = () => {
    clearDraft();
    updateData(INITIAL_EMPTY_RESUME);
    setShowClearConfirm(false);
    showToast(isUrdu ? 'تمام فیلڈز صاف ہو گئیں۔ پچھلا ڈرافٹ بیک اپ میں محفوظ ہے۔' : 'All fields cleared. Previous draft backed up in local storage.');
  };

  const handleRestoreBackup = () => {
    const success = restoreBackup();
    if (success) {
      showToast(isUrdu ? 'پچھلا ڈرافٹ بحال ہو گیا!' : 'Previous draft restored successfully!');
    } else {
      showToast(isUrdu ? 'کوئی سابقہ بیک اپ دستیاب نہیں ہے' : 'No previous draft backup found.');
    }
  };

  const handleLoadExample = () => {
    updateData(EXAMPLE_RESUME);
    showToast(isUrdu ? 'مثالی سی وی ڈیٹا لوڈ ہو گیا (خودکار محفوظ)' : 'Loaded example resume data (auto-saved).');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast notification */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isUrdu ? 'سی وی اور ریزیومے جنریٹر' : 'CV & Resume Generator'}
            </h1>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
              title="Your resume changes are automatically saved to browser local storage on every keystroke"
            >
              {isSaving
                ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving draft...')
                : (isUrdu ? `خودکار محفوظ: ${formatSavedTime(lastSaved, true)}` : `Auto-saved ${formatSavedTime(lastSaved)}`)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isUrdu
              ? 'چار پیشہ ورانہ ٹیمپلیٹس، خودکار محفوظ، لائیو پریویو اور اعلیٰ معیار کی پی ڈی ایف ایکسپورٹ کے ساتھ اپنی سی وی بنائیں۔'
              : 'Build ATS-compliant resumes with real-time preview, four distinct templates, and clean vector PDF export. Saved locally in your browser.'}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Load Example */}
          <button
            type="button"
            onClick={handleLoadExample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isUrdu ? 'مثال لوڈ کریں' : 'Load Example'}</span>
          </button>

          {/* Restore Draft */}
          <button
            type="button"
            onClick={handleRestoreBackup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-2xs transition-colors cursor-pointer"
            title="Restore previously saved draft backup"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ڈرافٹ بحال کریں' : 'Restore Draft'}</span>
          </button>

          {/* Import JSON */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'درآمد' : 'Import JSON'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'بیک اپ' : 'Backup JSON'}</span>
          </button>

          {/* Clear All */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'صاف کریں' : 'Clear'}</span>
          </button>

          {/* Print (Secondary) */}
          <Print
            variant="secondary"
            targetId="printable-resume-area"
            toolId="resume-builder"
            toolName="CV & Resume Generator"
            onBeforePrint={validateResumeForExport}
            documentTitle={() => {
              const rawName = (resumeData.personalInfo.fullName || 'Professional').trim();
              return `${rawName} – ${resumeData.personalInfo.jobTitle || 'CV Resume'}`;
            }}
            documentFormat="A4 Vector PDF / Print"
            documentSummary={() =>
              `${resumeData.experience.length} experiences, ${resumeData.education.length} education entries, ${resumeData.skills.length} skills`
            }
            tooltip={isUrdu ? 'پرنٹر یا سسٹم پرنٹ ڈائیلاگ' : 'Print or system print-to-PDF'}
          />

          {/* Primary Split Action: Download as PDF Button with format dropdown */}
          <div className="relative inline-flex items-center shadow-xs rounded-lg">
            <button
              type="button"
              onClick={() => handleDownloadPDF('vector')}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 rounded-l-lg transition-all cursor-pointer"
              title={isUrdu ? 'ریزیومے کو باقاعدہ پی ڈی ایف فائل کے طور پر ڈاؤن لوڈ کریں' : 'Save your generated resume as a professionally formatted PDF'}
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{isUrdu ? 'پی ڈی ایف تیار ہو رہا ہے...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>{isUrdu ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download PDF'}</span>
                </>
              )}
            </button>

            {/* Dropdown toggle for PDF export modes */}
            <button
              type="button"
              onClick={() => setShowPdfOptions(!showPdfOptions)}
              disabled={isExportingPDF}
              className="p-1.5 border-l border-blue-600 text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 rounded-r-lg transition-colors cursor-pointer"
              title="More PDF export options"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPdfOptions ? 'rotate-180' : ''}`} />
            </button>

            {/* PDF Options Menu */}
            {showPdfOptions && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isUrdu ? 'پی ڈی ایف ایکسپورٹ فارمیٹس' : 'PDF Export Formats'}
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF('vector')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>ATS Vector PDF</span>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold">
                        ({isUrdu ? 'تجویز کردہ' : 'Recommended'})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isUrdu
                        ? '100٪ قابل تلاش وکتور ٹیکسٹ، اے ٹی ایس مطابقت اور کرسٹل واضح معیار۔'
                        : 'Vector-sharp selectable text, fast ATS parsing, and lightweight file.'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF('visual')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer group mt-0.5"
                >
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      <span>Visual Canvas Snapshot</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isUrdu
                        ? 'لائیو ایچ ٹی ایم ایل پریویو کا ہو بہو تصویری پی ڈی ایف نچوڑ۔'
                        : 'Exact high-DPI raster replica of your on-screen preview.'}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-red-600 dark:text-red-400 font-semibold hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile / Tablet View Switcher (< lg) */}
      <div className="flex lg:hidden items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'form'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isUrdu ? 'فارم ایڈیٹر' : 'Edit Resume'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'preview'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isUrdu ? 'دستاویز پریویو' : 'Document Preview'}</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clear all resume fields?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will erase all personal details, work experience, and educational records. You can export a JSON backup beforehand.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form */}
        <div className={`lg:col-span-6 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <ResumeForm
            data={resumeData}
            onChange={(updated) => {
              if (validationError && (updated.personalInfo.fullName || '').trim()) {
                setValidationError(null);
              }
              updateData(updated);
            }}
          />
        </div>

        {/* Right: Live Resume Document Preview */}
        <div className={`lg:col-span-6 sticky top-20 space-y-3 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isUrdu ? 'لائیو دستاویز پریویو (A4 فارمیٹ)' : 'Live Document Preview (A4 Format)'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">
                {isUrdu ? 'خودکار محفوظ' : 'Auto-saved'}
              </span>
            </div>

            {/* Quick Download as PDF button directly over preview */}
            <button
              type="button"
              onClick={() => handleDownloadPDF('vector')}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                  <span>{isUrdu ? 'تیاری...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'پی ڈی ایف ڈاؤن لوڈ' : 'Download PDF'}</span>
                </>
              )}
            </button>
          </div>

          <div className="max-h-[82vh] overflow-y-auto p-2 bg-slate-200/50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <ResumePreview data={resumeData} />
          </div>
        </div>
      </div>
    </div>
  );
};
