import React, { useState, useMemo } from 'react';
import { PhotoPromptInputs, buildGeminiPhotoPrompt, PHOTO_PRESETS } from '../../../utils/promptGenerators';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Sparkles,
  Copy,
  Download,
  RotateCcw,
  CheckCircle,
  FileText,
  Sliders,
  Shield,
  Layers,
  Wand2,
  Printer,
  FileDown,
  Loader2,
} from 'lucide-react';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';
import { downloadPhotoPromptPDF } from '../../../utils/creativePromptPdfGenerator';
import { useAutoSave, formatSavedTime } from '../../../utils/useAutoSave';
import { copyTextToClipboard } from '../../../utils/toolResultExtractor';
import { emitCalculationSuccess } from '../../../utils/calculationToastNotifier';

const DEFAULT_PHOTO_INPUTS: PhotoPromptInputs = {
  subjectType: 'woman',
  subjectDescription: 'High-fashion editorial model with confident posture',
  style: 'Vogue cover fashion editorial',
  setting: 'Minimalist travertine courtyard with archways and water reflections',
  clothing: 'Tailored oversized camel wool trench coat and structural black sunglasses',
  lighting: 'Crisp golden-hour direct sunlight with dramatic volumetric cast shadows',
  cameraAngle: 'Low-angle medium close-up shot, 85mm f/1.4 prime lens, soft bokeh',
  moodAndColor: 'Warm Mediterranean stone tones, rich contrast, authentic film grain',
  aspectRatio: '3:4',
  qualityLevel: 'Masterpiece, 8k resolution, raw commercial photography',
  preserveIdentity: false,
  enhanceOnly: false,
  negativeConstraints: 'Plastic skin, cartoon look, oversaturation, blurry eyes, extra limbs',
  customNotes: 'Highlight fine fabric weave textures and natural skin pores.',
};

export const GeminiPhotoPromptTool: React.FC = () => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const {
    data: inputs,
    setData: setInputs,
    lastSaved,
    isSaving,
    clearDraft: resetPhotoDraft,
  } = useAutoSave<PhotoPromptInputs>('ft_photo_prompt_inputs', DEFAULT_PHOTO_INPUTS, 300);

  const initialPrompt = buildGeminiPhotoPrompt(inputs);
  const {
    data: promptText,
    setData: setPromptText,
  } = useAutoSave<string>('ft_photo_prompt_text', initialPrompt, 300);

  const [copied, setCopied] = useState(false);
  const [isFavoriteSaved, setIsFavoriteSaved] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDownloadPDF = () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    showToast(isUrdu ? 'فوٹو پرامپٹ پی ڈی ایف تیار ہو رہا ہے...' : 'Generating creative photo brief PDF...');

    try {
      const fileName = downloadPhotoPromptPDF(inputs, promptText);
      showToast(isUrdu ? `پی ڈی ایف "${fileName}" ڈاؤن لوڈ ہو گئی!` : `Downloaded "${fileName}" successfully!`);
    } catch (err) {
      console.error('Error generating photo PDF:', err);
      showToast(isUrdu ? 'پی ڈی ایف میں خرابی، پرنٹ ونڈو کھولی جا رہی ہے...' : 'PDF generation failed. Opening print dialog...');
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    recordPrintDocument('gemini-photo-prompt', `Photo Spec – ${(inputs.subjectDescription || 'Creative Portrait').slice(0, 40)}`, {
      toolName: 'Photo Prompt Studio',
      format: 'Creative Brief Print',
      summary: `${inputs.aspectRatio} ${inputs.style || 'Photoreal'} • ${inputs.lighting || 'Natural Lighting'}`,
    });
    window.print();
  };

  const [toastIsError, setToastIsError] = useState(false);

  const showStatusToast = (msg: string, isError = false) => {
    setToastIsError(isError);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const generatePrompt = () => {
    if (!inputs.enhanceOnly && !inputs.subjectDescription.trim()) {
      showStatusToast(
        isUrdu
          ? 'براہ کرم پرامپٹ بنانے سے پہلے تصویر کے موضوع کی تفصیل درج کریں۔'
          : 'Please describe the subject before generating a prompt, or choose a preset above.',
        true
      );
      return;
    }
    const generated = buildGeminiPhotoPrompt(inputs);
    setPromptText(generated);
    showStatusToast(isUrdu ? 'نیا فوٹو پرامپٹ تیار ہو گیا!' : 'Prompt generated and ready to copy or edit.');
    emitCalculationSuccess({
      toolId: 'gemini-photo-prompt',
      title: 'Photo Prompt Generated',
      titleUrdu: 'فوٹو پرامپٹ تیار ہو گیا',
      message: `${inputs.aspectRatio} · ${generated.length.toLocaleString()} characters ready`,
      messageUrdu: `${inputs.aspectRatio} · ${generated.length.toLocaleString()} حروف تیار`,
    });
  };

  const handleCopy = async () => {
    if (!promptText || !promptText.trim()) {
      showStatusToast(
        isUrdu ? 'کاپی کرنے کے لیے کوئی پرامپٹ موجود نہیں۔' : 'Prompt is empty. Generate or enter a prompt before copying.',
        true
      );
      return;
    }
    const ok = await copyTextToClipboard(promptText);
    if (ok) {
      setCopied(true);
      showStatusToast(isUrdu ? 'پرامپٹ کلپ بورڈ پر کاپی ہو گیا!' : 'Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      showStatusToast(
        isUrdu ? 'کلپ بورڈ تک رسائی ممکن نہیں۔ براہ کرم دستی طور پر منتخب کر کے کاپی کریں۔' : 'Could not copy automatically. Please select the text and press Ctrl+C.',
        true
      );
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini_photo_prompt_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateInputsAndSyncPrompt = (next: PhotoPromptInputs) => {
    setInputs(next);
    if (next.enhanceOnly || next.subjectDescription.trim()) {
      setPromptText(buildGeminiPhotoPrompt(next));
    }
  };

  const handleClear = () => {
    const empty: PhotoPromptInputs = {
      subjectType: 'custom',
      subjectDescription: '',
      style: 'Cinematic photography',
      setting: '',
      clothing: '',
      lighting: '',
      cameraAngle: '',
      moodAndColor: '',
      aspectRatio: '1:1',
      qualityLevel: 'High resolution, photorealistic',
      preserveIdentity: false,
      enhanceOnly: false,
      negativeConstraints: '',
      customNotes: '',
    };
    setInputs(empty);
    setPromptText('');
  };

  const handleResetDefaults = () => {
    resetPhotoDraft();
    setInputs(DEFAULT_PHOTO_INPUTS);
    setPromptText(buildGeminiPhotoPrompt(DEFAULT_PHOTO_INPUTS));
    showStatusToast(isUrdu ? 'ڈیفالٹ سیٹنگز بحال کر دی گئیں۔' : 'Reset to default studio preset.');
  };

  const loadPreset = (presetIndex: number) => {
    const p = PHOTO_PRESETS[presetIndex];
    if (p) {
      const nextInputs = p.inputs as PhotoPromptInputs;
      const generated = buildGeminiPhotoPrompt(nextInputs);
      setInputs(nextInputs);
      setPromptText(generated);
      emitCalculationSuccess({
        toolId: 'gemini-photo-prompt',
        title: 'Photo Prompt Generated',
        titleUrdu: 'فوٹو پرامپٹ تیار ہو گیا',
        message: `${p.title} (${nextInputs.aspectRatio})`,
        messageUrdu: `${p.title} (${nextInputs.aspectRatio})`,
      });
    }
  };

  const handleSaveFavorite = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('freetools_saved_photo_prompts') || '[]');
      saved.push({ title: inputs.subjectDescription.slice(0, 30) || 'Photo Prompt', prompt: promptText, date: new Date().toISOString() });
      localStorage.setItem('freetools_saved_photo_prompts', JSON.stringify(saved));
      setIsFavoriteSaved(true);
      setTimeout(() => setIsFavoriteSaved(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>AI Image Prompt Generator</span>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              title="Your prompt inputs and custom photo specs are automatically saved to local storage"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>
                {isSaving
                  ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                  : (isUrdu ? `خودکار محفوظ: ${formatSavedTime(lastSaved, true)}` : `Auto-saved ${formatSavedTime(lastSaved)}`)}
              </span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gemini AI Photo Prompt Generator
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Craft structured image generation prompts for Gemini, Imagen, Midjourney, and Flux with camera optics, aspect ratios, and identity-lock options.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">Presets:</span>
          {PHOTO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(idx)}
              className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 transition-colors shadow-2xs cursor-pointer"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs ${
            toastIsError
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 shrink-0 ${toastIsError ? 'text-rose-600 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400'}`} />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 p-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          {/* Modes switch */}
          <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-800/60 space-y-2">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
              Advanced Generation Modes
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.preserveIdentity}
                  onChange={(e) => {
                    updateInputsAndSyncPrompt({ ...inputs, preserveIdentity: e.target.checked, enhanceOnly: false });
                  }}
                  className="rounded text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Preserve Face / Identity
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Creates edit instructions locking reference facial likeness while altering setting or attire.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.enhanceOnly}
                  onChange={(e) => {
                    updateInputsAndSyncPrompt({ ...inputs, enhanceOnly: e.target.checked, preserveIdentity: false });
                  }}
                  className="rounded text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Upscale / Enhance Only
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Prompts for 8K resolution, micro-texture clarification, without altering scene elements.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {!inputs.enhanceOnly && (
            <>
              {/* Subject Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject Type
                  </label>
                  <select
                    value={inputs.subjectType}
                    onChange={(e) => setInputs({ ...inputs, subjectType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="man">Man</option>
                    <option value="woman">Woman</option>
                    <option value="group">Group / Couple</option>
                    <option value="product">Product Commercial</option>
                    <option value="landscape">Landscape / Nature</option>
                    <option value="architecture">Modern Architecture</option>
                    <option value="custom">Custom Subject</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject Description
                  </label>
                  <input
                    type="text"
                    value={inputs.subjectDescription}
                    onChange={(e) => setInputs({ ...inputs, subjectDescription: e.target.value })}
                    placeholder="e.g. Confident architect reviewing blueprints..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Style & Setting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Visual Style
                  </label>
                  <select
                    value={inputs.style}
                    onChange={(e) => updateInputsAndSyncPrompt({ ...inputs, style: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Cinematic photography">Cinematic Photography</option>
                    <option value="Vogue cover fashion editorial">Fashion Editorial</option>
                    <option value="Luxury commercial studio">Luxury Commercial Studio</option>
                    <option value="Corporate executive portrait">Corporate Executive</option>
                    <option value="Street documentary photography">Street Documentary</option>
                    <option value="35mm film vintage Kodak Portra">Vintage 35mm Film</option>
                    <option value="Cyberpunk neon noir">Cyberpunk Neo-Noir</option>
                    <option value="Hyper-realistic natural documentary">National Geographic Style</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Setting / Background Environment
                  </label>
                  <input
                    type="text"
                    value={inputs.setting}
                    onChange={(e) => setInputs({ ...inputs, setting: e.target.value })}
                    placeholder="e.g. Minimalist concrete loft, rain-slicked Tokyo street..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Wardrobe & Lighting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Clothing & Wardrobe (Optional)
                  </label>
                  <input
                    type="text"
                    value={inputs.clothing}
                    onChange={(e) => setInputs({ ...inputs, clothing: e.target.value })}
                    placeholder="e.g. Bespoke Italian navy suit, casual oversized hoodie..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lighting Setup
                  </label>
                  <input
                    type="text"
                    value={inputs.lighting}
                    onChange={(e) => setInputs({ ...inputs, lighting: e.target.value })}
                    placeholder="e.g. Diffused north-facing softbox, golden hour rim light..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Camera Optics & Mood */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Camera Framing & Optics
                  </label>
                  <input
                    type="text"
                    value={inputs.cameraAngle}
                    onChange={(e) => setInputs({ ...inputs, cameraAngle: e.target.value })}
                    placeholder="e.g. Eye-level portrait, 85mm f/1.4 lens, shallow depth of field..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mood & Color Grading
                  </label>
                  <input
                    type="text"
                    value={inputs.moodAndColor}
                    onChange={(e) => setInputs({ ...inputs, moodAndColor: e.target.value })}
                    placeholder="e.g. Warm amber tones, cinematic teal-and-orange..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Aspect Ratio & Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={inputs.aspectRatio}
                    onChange={(e) => updateInputsAndSyncPrompt({ ...inputs, aspectRatio: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="1:1">1:1 Square (Avatars / Instagram)</option>
                    <option value="16:9">16:9 Landscape (Desktop / Cinematic)</option>
                    <option value="9:16">9:16 Vertical (Stories / TikTok)</option>
                    <option value="3:4">3:4 Portrait (Editorial / Print)</option>
                    <option value="4:3">4:3 Standard Photo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quality Specifier
                  </label>
                  <input
                    type="text"
                    value={inputs.qualityLevel}
                    onChange={(e) => setInputs({ ...inputs, qualityLevel: e.target.value })}
                    placeholder="e.g. Masterpiece, 8k resolution, raw commercial photography"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Negative constraints */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Negative Constraints (What to avoid)
                </label>
                <input
                  type="text"
                  value={inputs.negativeConstraints}
                  onChange={(e) => setInputs({ ...inputs, negativeConstraints: e.target.value })}
                  placeholder="e.g. plastic skin, cartoon, oversaturated, blurry, bad anatomy..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Form Trigger Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
            <button
              type="button"
              onClick={generatePrompt}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate Prompt</span>
            </button>
          </div>
          </div>

          {/* Right Column: Output Prompt Box (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-20">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Generated Prompt Output
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCircle className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  title={isUrdu ? 'TXT فائل ڈاؤن لوڈ کریں' : 'Download as TXT'}
                  aria-label={isUrdu ? 'TXT فائل ڈاؤن لوڈ کریں' : 'Download prompt as TXT'}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  title={isUrdu ? 'پرامپٹ شیٹ پرنٹ کریں (پرنٹ ہسٹری میں محفوظ ہوگا)' : 'Print prompt sheet (saved in Print History)'}
                  aria-label={isUrdu ? 'پرامپٹ شیٹ پرنٹ کریں' : 'Print prompt sheet'}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  title={isUrdu ? 'کریٹیو بریف کو پی ڈی ایف کے طور پر محفوظ کریں' : 'Download formatted Creative Brief PDF'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 rounded-md transition-all shadow-2xs cursor-pointer"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  ) : (
                    <FileDown className="w-3 h-3 text-white" />
                  )}
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Editable prompt text area */}
            <div>
              <textarea
                aria-label="Generated photo prompt output"
                rows={10}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Click 'Generate Prompt' or choose a preset to produce a studio prompt..."
                className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Tip: You can edit or fine-tune this prompt directly before copying.
              </span>
            </div>

            {/* Save / Favorite action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveFavorite}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                {isFavoriteSaved ? '✓ Saved to Local Favorites' : '+ Save to Prompt Favorites'}
              </button>
              <span className="text-[10.5px] font-mono text-slate-400">
                {promptText.length} chars
              </span>
            </div>
          </div>

          {/* Model compatibility note */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Compatible Image Generators
            </span>
            <p>
              Paste this prompt into Google Gemini, Imagen 3, Midjourney v6, Flux.1, or Stable Diffusion XL. This generator crafts prompt parameters; image rendering occurs within your chosen model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
