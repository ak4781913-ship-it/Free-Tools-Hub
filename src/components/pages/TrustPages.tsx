import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { TOOLS_LIST } from '../../data/tools';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Mail,
  Info,
  Home,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Globe,
  Scale,
} from 'lucide-react';

export type TrustPageType = 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer';

interface TrustPageViewProps {
  page: TrustPageType;
  onNavigateTo: (path: string) => void;
}

export const TrustPageView: React.FC<TrustPageViewProps> = ({ page, onNavigateTo }) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    topic: 'general',
    message: '',
  });
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedMessage = contactForm.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setContactError(
        isUrdu
          ? 'براہ کرم نام، ای میل، اور پیغام کے تمام مطلوبہ خانے پُر کریں۔'
          : 'Please complete your name, email address, and message before submitting.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setContactError(
        isUrdu
          ? 'براہ کرم درست ای میل ایڈریس درج کریں۔'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setContactError(null);
    try {
      const existing = JSON.parse(localStorage.getItem('freetools_contact_submissions') || '[]');
      existing.unshift({
        ...contactForm,
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('freetools_contact_submissions', JSON.stringify(existing.slice(0, 20)));
    } catch {
      // ignore localStorage quota errors
    }
    setContactSubmitted(true);
  };

  const pageLabels: Record<TrustPageType, { en: string; ur: string }> = {
    about: { en: 'About FreeTools Hub', ur: 'فری ٹولز ہب کے بارے میں' },
    contact: { en: 'Contact & Feedback', ur: 'رابطہ اور تجاویز' },
    privacy: { en: 'Privacy Policy', ur: 'رازداری کی پالیسی' },
    terms: { en: 'Terms of Use', ur: 'شرائطِ استعمال' },
    disclaimer: { en: 'Legal & Calculator Disclaimer', ur: 'قانونی دستبرداری (Disclaimer)' },
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Breadcrumb Bar */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <a
              href="/"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onNavigateTo('/');
                }
              }}
              className="hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 transition-colors font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہوم' : 'Home'}</span>
            </a>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
            <span aria-current="page" className="font-semibold text-slate-900 dark:text-white">
              {isUrdu ? pageLabels[page].ur : pageLabels[page].en}
            </span>
          </nav>

          <a
            href="/"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateTo('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isUrdu ? 'ہوم پیج' : 'Back to Home'}</span>
          </a>
        </div>
      </div>

      {/* Sub-navigation across Trust Pages */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-800">
          {(['about', 'contact', 'privacy', 'terms', 'disclaimer'] as TrustPageType[]).map((tab) => {
            const active = page === tab;
            return (
              <a
                key={tab}
                href={`/${tab}`}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo(`/${tab}`);
                  }
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isUrdu ? pageLabels[tab].ur : pageLabels[tab].en}
              </a>
            );
          })}
        </div>

        {/* ABOUT US */}
        {page === 'about' && (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-8">
            <header className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4" />
                <span>AbbasPro · FreeTools Hub Platform Overview</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'فری ٹولز ہب کے بارے میں' : 'About AbbasPro / FreeTools Hub'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {isUrdu
                  ? 'فری ٹولز ہب ایک براؤزر پر مبنی پلیٹ فارم ہے جو سی وی تیاری، متحدہ عرب امارات کے ملازمین کے مالیاتی تخمینے، اے آئی پرامپٹ انجینئرنگ، اور روزمرہ ڈیجیٹل ٹولز مفت اور رازداری کے ساتھ فراہم کرتا ہے۔'
                  : `FreeTools Hub is a privacy-focused collection of ${TOOLS_LIST.length} practical browser utilities designed for job seekers, UAE professionals, creators, and software developers.`}
              </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <Lock className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Client-Side Architecture
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Resume drafts, salary figures, compressed images, QR codes, and generated passwords are processed locally in your browser memory and local storage without requiring account registration.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <Cpu className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Transparent Methodologies
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Calculators display explicit step-by-step formulas, statutory tier assumptions, and clear educational disclaimers so you can verify every figure independently.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <Globe className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bilingual & Offline-Ready
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Built with English (LTR) and Urdu (RTL) interface support plus Progressive Web App caching so core calculators and editors continue working reliably offline.
                </p>
              </div>
            </section>

            <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                What You Can Do on FreeTools Hub
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Career & CV Preparation:</strong> Create ATS-readable resumes using structured templates with live A4 preview, JSON draft backup, and direct PDF export.
                </li>
                <li>
                  <strong>UAE Employment Estimators:</strong> Estimate monthly gross-to-net compensation in AED and model end-of-service gratuity scenarios under UAE Federal Decree-Law No. 33 of 2021.
                </li>
                <li>
                  <strong>Structured AI Prompt Builders:</strong> Organize camera optics, lighting, aspect ratios, and multi-scene video scripts for modern image and video generation models.
                </li>
                <li>
                  <strong>Everyday Web & Developer Utilities:</strong> Compress images locally, generate QR codes, audit on-page SEO HTML tags, format JSON, convert units/currencies, and calculate loan amortization schedules.
                </li>
              </ul>
            </section>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
              <a
                href="/tools"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo('/tools');
                  }
                }}
                className="px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
              >
                Explore All {TOOLS_LIST.length} Tools
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo('/contact');
                  }
                }}
                className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Contact or Report an Issue
              </a>
            </div>
          </article>
        )}

        {/* CONTACT US */}
        {page === 'contact' && (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-6">
            <header className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Mail className="w-4 h-4" />
                <span>Support, Bug Reports & Tool Suggestions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'ہم سے رابطہ کریں' : 'Contact FreeTools Hub'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {isUrdu
                  ? 'اگر آپ کو کسی کیلکولیٹر میں کوئی تکنیکی مسئلہ درپیش ہو یا آپ نیا ٹول تجویز کرنا چاہتے ہوں تو نیچے دیے گئے فارم کے ذریعے اپنا پیغام درج کریں۔'
                  : 'Found a calculation edge case, broken export, or want to suggest an improvement to an existing utility? Submit a detailed note below.'}
              </p>
            </header>

            {contactSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    {isUrdu ? 'آپ کا پیغام ریکارڈ کر لیا گیا ہے!' : 'Feedback Recorded Locally'}
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                  Thank you, <strong>{contactForm.name}</strong>. Because FreeTools Hub operates without a remote user-tracking database, your message has been saved in your browser feedback log. You can also copy your formatted report below if you wish to share it externally.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContactSubmitted(false);
                    setContactForm({ name: '', email: '', topic: 'general', message: '' });
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} noValidate className="space-y-4 max-w-2xl">
                {contactError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Alex Khan"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="alex@example.com"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-topic"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Inquiry Category
                  </label>
                  <select
                    id="contact-topic"
                    value={contactForm.topic}
                    onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="general">General Question</option>
                    <option value="bug">Report a Calculation or Export Bug</option>
                    <option value="feature">Suggest a Tool Improvement</option>
                    <option value="privacy">Privacy or Legal Question</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe the tool name, input values tested, or feature suggestion..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Message
                </button>
              </form>
            )}
          </article>
        )}

        {/* PRIVACY POLICY */}
        {page === 'privacy' && (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <header className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Data Handling & Browser Storage Transparency</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500">
                Effective for AbbasPro / FreeTools Hub Web Application
              </p>
            </header>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Local Client-Side Processing
              </h2>
              <p>
                FreeTools Hub is engineered so that core document builders, calculators, image compressors, QR generators, and text utilities execute directly inside your web browser. Personal resume entries, salary and gratuity inputs, uploaded images, and generated passwords are not uploaded to or stored on a central user-profile database.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. When Network Requests Occur
              </h2>
              <p>
                Certain optional features make standard network requests strictly to fulfill their stated function:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li>
                  <strong>SEO Page Analyzer (URL Mode):</strong> When you explicitly enter a public URL to audit, the application fetches that target webpage&apos;s public HTML headers and markup to analyze its meta tags.
                </li>
                <li>
                  <strong>Web Fonts & Static Assets:</strong> Standard typography stylesheets (such as Google Fonts) are cached locally by your browser and Service Worker for offline reuse.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Browser Local Storage & Offline Cache
              </h2>
              <p>
                We use your browser&apos;s built-in <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">localStorage</code> to remember your theme preference (light/dark), interface language (English/Urdu), starred favorite tools, tool ratings, and auto-saved drafts (such as CV Builder and AI Prompt drafts). You can erase tool drafts at any time using the <strong>Reset</strong> button on any tool page or by clearing site data in your browser settings.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                4. Third-Party Advertising & Trackers
              </h2>
              <p>
                FreeTools Hub does not sell personal information and does not embed hidden keystroke loggers or third-party behavioral ad networks.
              </p>
            </section>
          </article>
        )}

        {/* TERMS OF USE & DISCLAIMERS */}
        {page === 'terms' && (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <header className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <FileCheck className="w-4 h-4" />
                <span>Usage Terms & Calculator Disclaimers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Terms of Use & Legal Disclaimer
              </h1>
            </header>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Scale className="w-4 h-4 shrink-0" />
                <span>Important Financial, Employment & Health Calculator Disclaimer</span>
              </div>
              <p>
                All calculators on FreeTools Hub—including the UAE Salary Calculator, UAE Gratuity Calculator, Loan & EMI Calculator, Currency/Crypto Converters, and BMI Calculator—provide <strong>informational and educational estimates only</strong>. They do not constitute legal advice, certified accounting advice, official MOHRE determinations, or medical diagnosis.
              </p>
            </div>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Permitted Use & User Ownership
              </h2>
              <p>
                You may use FreeTools Hub free of charge for personal, academic, and commercial workflows. You retain full ownership and responsibility for any CVs, resumes, prompts, QR codes, or documents you generate and download using these tools.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. UAE Employment & Gratuity Estimations
              </h2>
              <p>
                UAE Gratuity calculations reference standard private-sector provisions of UAE Federal Decree-Law No. 33 of 2021 (and optional historical comparisons to Federal Law No. 8 of 1980). Actual end-of-service settlements may vary depending on your registered employment contract, free-zone regulations (such as DIFC DEWS or ADGM rules), unpaid absences, workplace savings plans, or official Ministry of Human Resources and Emiratisation (MOHRE) guidance. Always confirm final figures with your employer&apos;s HR department or qualified legal counsel.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. No Warranty & Limitation of Liability
              </h2>
              <p>
                All utilities are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of completeness, uninterrupted availability, or fitness for a specific legal or financial filing. You agree to verify critical outputs before relying on them in formal employment, financial, or technical production environments.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                4. Acceptable Conduct
              </h2>
              <p>
                Users must not use QR generators, URL analyzers, or text utilities to generate deceptive phishing links, unlawful content, or automated denial-of-service traffic.
              </p>
            </section>
          </article>
        )}

        {/* DEDICATED DISCLAIMER PAGE */}
        {page === 'disclaimer' && (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <header className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Scale className="w-4 h-4" />
                <span>Educational, Financial, Employment & Health Disclaimers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'قانونی اور معلوماتی دستبرداری (Disclaimer)' : 'Legal & Calculator Disclaimer'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                {isUrdu
                  ? 'فری ٹولز ہب کے تمام کیلکولیٹرز اور جنریٹرز صرف معلوماتی اور تعلیمی مقاصد کے لیے فراہم کیے گئے ہیں۔ یہ قانونی، مالیاتی، یا طبی مشورے کا متبادل نہیں ہیں۔'
                  : 'All calculators, document templates, and prompt generators on FreeTools Hub are provided strictly for informational, planning, and educational purposes.'}
              </p>
            </header>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. UAE Gratuity & Salary Calculators (Not Legal or MOHRE Advice)
              </h2>
              <p>
                The UAE End-of-Service Gratuity Calculator and UAE Monthly Salary Calculator model standard private-sector formulas published under UAE Federal Decree-Law No. 33 of 2021 (and optional historical reference tiers from Federal Law No. 8 of 1980). Calculations assume a 365-day year, basic salary excluding allowances, and continuous service after deducting entered unpaid leave days. They do <strong>not</strong> account for company-specific HR policies, free-zone regimes (such as DIFC DEWS or ADGM rules), judicial interpretations, or collective agreements. Always verify final settlements with your employer&apos;s HR department, the Ministry of Human Resources and Emiratisation (MOHRE), or licensed UAE legal counsel.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. Loan, Currency, Crypto & Financial Utilities
              </h2>
              <p>
                Loan EMI schedules, discount/VAT breakdowns, fiat currency conversions, and cryptocurrency estimates are indicative mathematical models. Exchange rates and digital asset prices may use delayed public feeds or reference fallback rates when offline and exclude bank remittance spreads, brokerage fees, or tax obligations. Nothing on this site constitutes financial, investment, or tax advice.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Health & BMI Calculator
              </h2>
              <p>
                Body Mass Index (BMI) classifications use general World Health Organization (WHO) adult reference ranges and do not account for muscle mass, bone density, age, pregnancy, or individual medical history. Consult a qualified healthcare professional for medical evaluation.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                4. CV Builder, SEO Analyzer & AI Prompt Generators
              </h2>
              <p>
                Resume templates, SEO audit scores, and structured AI photo/video prompts are productivity aids. FreeTools Hub does not guarantee job placement, Applicant Tracking System (ATS) ranking outcomes, search engine indexing, or specific third-party AI model outputs.
              </p>
            </section>
          </article>
        )}
      </div>
    </div>
  );
};
