import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { X, CheckCircle, Shield, FileCheck, AlertTriangle, Mail } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'disclaimer' | 'contact' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const { t } = useLanguage();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'privacy' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-6 h-6" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.legal.privacyTitle}
              </h2>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>Privacy-First Guarantee:</strong> FreeTools Hub operates primarily on client-side technology. When you generate a resume, calculate UAE gratuity, craft AI prompts, compress images, or generate passwords, your data is processed directly inside your browser.
              </p>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                1. No Server-Side Storage of Personal Documents
              </h3>
              <p>
                We do not transmit, log, sell, or retain your personal resumes, employment details, basic salary data, generated passwords, or uploaded photos on any remote database. Everything remains in your device's memory.
              </p>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                2. Local Storage
              </h3>
              <p>
                We use your browser's standard <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">localStorage</code> solely to save your local UI preferences (such as selected language, dark/light theme, and your starred favorite tools). You can clear this anytime through your browser settings or our Reset buttons.
              </p>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                3. Third-Party Tracking
              </h3>
              <p>
                We do not include intrusive third-party advertising trackers, keystroke loggers, or telemetry trackers.
              </p>
            </div>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <FileCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.legal.termsTitle}
              </h2>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                Welcome to FreeTools Hub. By accessing and using our web utilities, you agree to these terms:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>FreeTools Hub utilities are offered free of charge for personal and commercial productivity.</li>
                <li>You retain 100% intellectual property ownership of any resumes, text prompts, or documents you create using our generators.</li>
                <li>Tools are provided on an "as is" and "as available" basis without warranties of any kind.</li>
                <li>You agree not to use the password or QR generators for malicious, unlawful, or phishing activities.</li>
              </ul>
            </div>
          </div>
        )}

        {type === 'disclaimer' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.legal.disclaimerTitle}
              </h2>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 text-xs">
                <strong>Important Notice on UAE Gratuity Calculations:</strong> The UAE Gratuity Calculator is strictly an estimation and educational utility based on UAE Federal Decree-Law No. 33 of 2021 (and historical references to Law No. 8 of 1980). It does not constitute binding legal, financial, or employment advice.
              </div>
              <p>
                Actual end-of-service benefits determined by the Ministry of Human Resources and Emiratisation (MOHRE), Free Zone Authorities (DIFC, ADGM, JAFZA, etc.), or UAE Labour Courts may vary based on:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Specific contract clauses, allowances excluded from the statutory basic salary definition.</li>
                <li>Deduction of authorized unpaid leaves or disciplinary matters under Article 44.</li>
                <li>Special workplace savings schemes (such as DEWS in DIFC or voluntary pension funds).</li>
                <li>Pre-existing settlement agreements or company bylaws.</li>
              </ul>
              <p>
                Always verify your final settlement with your human resources department or official MOHRE channels before executing separation paperwork.
              </p>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-6 h-6" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.legal.contactTitle}
              </h2>
            </div>
            {contactSubmitted ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-sm space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    Your message has been saved locally in this browser. You can copy the formatted note below to share it directly.
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `Name: ${contactForm.name}\nEmail: ${contactForm.email}\nMessage:\n${contactForm.message}`
                      );
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100/50 cursor-pointer"
                  >
                    Copy Formatted Message
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (contactForm.email && contactForm.message) {
                    try {
                      const existing = JSON.parse(localStorage.getItem('freetools_contact_submissions') || '[]');
                      existing.unshift({
                        ...contactForm,
                        createdAt: new Date().toISOString(),
                      });
                      localStorage.setItem('freetools_contact_submissions', JSON.stringify(existing.slice(0, 20)));
                    } catch {}
                    setContactSubmitted(true);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="legal-contact-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    id="legal-contact-name"
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="legal-contact-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="legal-contact-email"
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="legal-contact-message" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message / Tool Request
                  </label>
                  <textarea
                    id="legal-contact-message"
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Suggest a new tool, report an issue, or ask a question..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    {t.legal.close}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    Save Message
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
