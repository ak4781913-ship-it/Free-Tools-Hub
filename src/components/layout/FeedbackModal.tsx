import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Bug,
  Lightbulb,
  Send,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/tools';
import { useLanguage } from '../../context/LanguageContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView?: string;
}

type FeedbackType = 'feature' | 'bug' | 'general';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentView = 'home',
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // Identify active tool if viewing one
  const initialToolId = currentView.startsWith('tool:') ? currentView.replace('tool:', '') : 'general';

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [selectedTool, setSelectedTool] = useState<string>(initialToolId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDiagnosticsPreview, setShowDiagnosticsPreview] = useState(false);

  // Sync selected tool when opening
  useEffect(() => {
    if (isOpen) {
      const toolId = currentView.startsWith('tool:') ? currentView.replace('tool:', '') : 'general';
      setSelectedTool(toolId);
      setIsSubmitted(false);
      setIsCopied(false);
    }
  }, [isOpen, currentView]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeToolDef = selectedTool !== 'general' ? TOOLS_LIST.find((t) => t.id === selectedTool) : null;
  const toolNameStr = activeToolDef ? activeToolDef.name : 'General Tools Hub';

  // Format Email Template
  const generateEmailTemplate = () => {
    const typeLabel =
      feedbackType === 'bug'
        ? 'BUG REPORT'
        : feedbackType === 'feature'
        ? 'FEATURE REQUEST'
        : 'USER FEEDBACK';

    const diagnostics = includeDiagnostics
      ? `
--------------------------------------------------
DIAGNOSTIC SYSTEM SPECS:
URL: ${window.location.href}
Tool Context: ${toolNameStr} (${selectedTool})
Browser: ${navigator.userAgent}
Screen: ${window.screen.width}x${window.screen.height} (DPR: ${window.devicePixelRatio})
Language Mode: ${language.toUpperCase()}
Timestamp: ${new Date().toISOString()}
--------------------------------------------------`
      : '';

    const bodyText = `[${typeLabel}] ${title || 'Feedback from FreeTools Hub'}

Tool / Area:
${toolNameStr}

Feedback & Description:
${description || '(No description provided)'}

Sender:
${userEmail || 'Anonymous User'}
${diagnostics}
`;

    return {
      subject: `[FreeTools Hub ${typeLabel}] ${title || toolNameStr}`,
      body: bodyText,
    };
  };

  const configuredContactEmail = ((import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || '').trim();

  const saveFeedbackLocally = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('freetools_feedback_submissions') || '[]');
      existing.unshift({
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        email: userEmail.trim(),
        tool: toolNameStr,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('freetools_feedback_submissions', JSON.stringify(existing.slice(0, 50)));
    } catch {}
  };

  const handleSaveReport = () => {
    saveFeedbackLocally();
    setIsSubmitted(true);
  };

  const handleLaunchEmailClient = () => {
    if (!configuredContactEmail) {
      handleSaveReport();
      return;
    }
    const { subject, body } = generateEmailTemplate();
    saveFeedbackLocally();
    const mailtoUrl = `mailto:${configuredContactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setIsSubmitted(true);
  };

  const handleCopyTemplate = () => {
    const { subject, body } = generateEmailTemplate();
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    handleSaveReport();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Feedback & Bug Report"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'رائے اور بگ رپورٹ' : 'Send Feedback & Feature Requests'}
              </h2>
              <p className="text-xs text-slate-500">
                {isUrdu ? 'ہمیں بتائیں کہ ہم کون سا نیا ٹول بنائیں یا کیا بہتر کریں۔' : 'Help us build new utilities or report an issue.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'آپ کی رپورٹ مقامی طور پر محفوظ ہو گئی' : 'Feedback Saved Locally'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isUrdu
                  ? 'یہ رپورٹ آپ کے براؤزر میں محفوظ ہو گئی ہے۔ آپ نیچے دیے گئے بٹن سے مکمل فارمیٹ شدہ رپورٹ کاپی کر سکتے ہیں۔'
                  : 'Your formatted report has been saved in this browser. Copy the formatted report below to share it via your preferred channel.'}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Formatted Report'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDirectSubmit} className="space-y-4">
            {/* Feedback Type Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType('feature')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  feedbackType === 'feature'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Feature Request</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('bug')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  feedbackType === 'bug'
                    ? 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Bug className="w-3.5 h-3.5 text-red-500" />
                <span>Report Bug</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('general')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  feedbackType === 'general'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>General Feedback</span>
              </button>
            </div>

            {/* Target Tool Selection */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-tool-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Related Tool or Category:
              </label>
              <select
                id="feedback-tool-select"
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="general">Platform-Wide / General Utilities</option>
                <optgroup label="All Tools">
                  {TOOLS_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.categoryName})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Title / Subject */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-title-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {feedbackType === 'bug'
                  ? 'Issue Summary:'
                  : feedbackType === 'feature'
                  ? 'Proposed Feature Name:'
                  : 'Subject:'}
              </label>
              <input
                id="feedback-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  feedbackType === 'bug'
                    ? 'e.g., PDF export text overlap on mobile Safari'
                    : feedbackType === 'feature'
                    ? 'e.g., Add SVG to PNG converter tool'
                    : 'Brief summary of your feedback'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Details & Description */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-description-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {feedbackType === 'bug'
                  ? 'Steps to Reproduce & Expected Behavior:'
                  : 'Detailed Description & Use Case:'}
              </label>
              <textarea
                id="feedback-description-input"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  feedbackType === 'bug'
                    ? '1. Go to...\n2. Click on...\n3. Error seen:\nExpected behavior:'
                    : 'Explain how this feature would help you or what improvements you would like to see...'
                }
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="feedback-email-input" className="font-semibold text-slate-700 dark:text-slate-300">
                  Your Email Address:
                </label>
                <span className="text-slate-400 text-[11px]">(Optional)</span>
              </div>
              <input
                id="feedback-email-input"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Include Diagnostics Toggle */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={includeDiagnostics}
                    onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                  />
                  <span>Attach diagnostic system specifications (URL, browser, screen)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowDiagnosticsPreview((p) => !p)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>{showDiagnosticsPreview ? 'Hide' : 'Preview'}</span>
                  {showDiagnosticsPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showDiagnosticsPreview && (
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto">
                  {`URL: ${window.location.href}
Tool Context: ${toolNameStr} (${selectedTool})
Browser: ${navigator.userAgent.slice(0, 70)}...
Resolution: ${window.screen.width}x${window.screen.height}`}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy complete pre-formatted report to clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Formatted Report'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {configuredContactEmail ? (
                  <button
                    type="button"
                    onClick={handleLaunchEmailClient}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open Email Draft</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Feedback Log</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
