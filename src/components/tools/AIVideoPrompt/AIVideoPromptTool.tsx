import React, { useState } from 'react';
import { VideoPromptInputs, VideoScene, buildCompleteVideoPrompt, VIDEO_PRESETS } from '../../../utils/promptGenerators';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Video,
  Plus,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  CheckCircle,
  FileText,
  Sliders,
  Sparkles,
  Layers,
  Wand2,
  Printer,
  FileDown,
  Loader2,
} from 'lucide-react';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';
import { downloadVideoPromptPDF } from '../../../utils/creativePromptPdfGenerator';
import { useAutoSave, formatSavedTime } from '../../../utils/useAutoSave';
import { copyTextToClipboard } from '../../../utils/toolResultExtractor';
import { emitCalculationSuccess } from '../../../utils/calculationToastNotifier';

const DEFAULT_VIDEO_INPUTS: VideoPromptInputs = {
  purpose: 'advertisement',
  mainSubject: 'Protagonist exploring coastal clifftop villa at sunset',
  totalDurationSeconds: 30,
  aspectRatio: '16:9',
  visualStyle: 'Cinematic 35mm film aesthetic, slow-motion elegance',
  lightingEnvironment: 'Warm golden hour dusk merging into deep twilight',
  characterConsistency: true,
  consistentCharacterDetails: 'Brunette female in silk ivory evening gown with emerald drop earrings',
  musicMood: 'Swelling orchestral strings and ambient Mediterranean waves',
  languageAndAccent: 'Soft French-accented English whisper',
  resolution: '4K Ultra HD',
  scenes: [
    {
      id: 's1',
      sceneNumber: 1,
      durationSeconds: 10,
      visualDescription: 'Drone glides over azure Mediterranean coastline toward an open minimalist clifftop terrace.',
      cameraMovement: 'Slow forward dolly expanding into panoramic reveal',
      characterAction: 'Protagonist stands at terrace edge, evening breeze catching silk gown.',
      dialogue: 'Some memories never fade...',
      voiceStyle: 'Whispered, evocative, intimate',
      audioSfx: 'Gentle ocean swells and breeze',
      transition: 'Crossfade',
    },
    {
      id: 's2',
      sceneNumber: 2,
      durationSeconds: 10,
      visualDescription: 'Extreme close-up of crystal perfume bottle on travertine plinth; light prisms refract across flacon.',
      cameraMovement: 'Subtle slow orbit with focal rack to protagonist in background',
      characterAction: 'Protagonist picks up the bottle and gently spritzes wrist with a serene glance.',
      dialogue: 'They become your signature.',
      voiceStyle: 'Confident, sophisticated',
      audioSfx: 'Delicate atomized spray mist sound, glass clink',
      transition: 'Match cut',
    },
    {
      id: 's3',
      sceneNumber: 3,
      durationSeconds: 10,
      visualDescription: 'Wide twilight shot of the infinity pool looking out over the open sea; twilight stars beginning to emerge.',
      cameraMovement: 'Smooth crane upward tilt to twilight sky',
      characterAction: 'Protagonist turns with a subtle enigmatic smile, silhouette against ambient villa lantern glow.',
      dialogue: 'Eternity, captured.',
      voiceStyle: 'Echoing whisper, cinematic fade',
      audioSfx: 'Orchestral peak crescendo fading to ambient evening crickets and gentle surf',
      transition: 'Fade to black',
    },
  ],
};

export const AIVideoPromptTool: React.FC = () => {
  const { language, t } = useLanguage();

  const {
    data: inputs,
    setData: setInputs,
    lastSaved,
    isSaving,
    clearDraft: resetVideoInputs,
  } = useAutoSave<VideoPromptInputs>('ft_video_prompt_inputs', DEFAULT_VIDEO_INPUTS, 300);

  const initialOutput = buildCompleteVideoPrompt(inputs);
  const {
    data: outputPrompt,
    setData: setOutputPrompt,
  } = useAutoSave<string>('ft_video_prompt_output', initialOutput, 300);

  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  const isUrdu = language === 'ur';

  const showToast = (msg: string, isError = false) => {
    setToastIsError(isError);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleDownloadPDF = () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    showToast(isUrdu ? 'پروڈکشن اسکرپٹ پی ڈی ایف تیار ہو رہا ہے...' : 'Generating production script PDF...');

    try {
      const fileName = downloadVideoPromptPDF(inputs, outputPrompt);
      showToast(isUrdu ? `پی ڈی ایف "${fileName}" ڈاؤن لوڈ ہو گئی!` : `Downloaded "${fileName}" successfully!`);
    } catch (err) {
      console.error('Error generating PDF script:', err);
      showToast(isUrdu ? 'پی ڈی ایف میں خرابی، پرنٹ ونڈو کھولی جا رہی ہے...' : 'PDF generation failed. Opening print dialog...');
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    recordPrintDocument('ai-video-prompt', `AI Video Script – ${inputs.mainSubject.slice(0, 40)}`, {
      toolName: 'AI Video Production Script',
      format: 'Production Script Print',
      summary: `${inputs.totalDurationSeconds}s ${inputs.aspectRatio} • ${inputs.scenes.length} Scenes`,
    });
    window.print();
  };

  // Auto calculate sum of scenes duration
  const currentScenesDurationSum = inputs.scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  const autoBalanceSceneDurations = () => {
    if (inputs.scenes.length === 0) return;
    const count = inputs.scenes.length;
    const base = Math.floor(inputs.totalDurationSeconds / count);
    const remainder = inputs.totalDurationSeconds % count;

    const updated = inputs.scenes.map((s, idx) => ({
      ...s,
      durationSeconds: base + (idx === 0 ? remainder : 0),
    }));

    setInputs({ ...inputs, scenes: updated });
  };

  const handleGenerate = () => {
    if (!inputs.mainSubject.trim()) {
      showToast(
        isUrdu
          ? 'براہ کرم ویڈیو کے مرکزی موضوع (Main Subject) کی تفصیل درج کریں۔'
          : 'Please enter a Main Subject / Concept before generating the video script.',
        true
      );
      return;
    }
    const hasEmptyScene = inputs.scenes.every((s) => !s.visualDescription.trim());
    if (inputs.scenes.length === 0 || hasEmptyScene) {
      showToast(
        isUrdu
          ? 'براہ کرم کم از کم ایک منظر (Scene) کی بصری تفصیل درج کریں۔'
          : 'Please describe the visual action in at least one scene before generating.',
        true
      );
      return;
    }
    const generated = buildCompleteVideoPrompt(inputs);
    setOutputPrompt(generated);
    showToast(isUrdu ? 'مکمل ویڈیو پرامپٹ اسکرپٹ تیار ہو گیا!' : 'Video production prompt generated successfully.');
    emitCalculationSuccess({
      toolId: 'ai-video-prompt',
      title: 'Video Script Generated',
      titleUrdu: 'ویڈیو پرامپٹ اسکرپٹ تیار ہو گیا',
      message: `${inputs.scenes.length} scenes · ${inputs.totalDurationSeconds}s (${inputs.aspectRatio})`,
      messageUrdu: `${inputs.scenes.length} مناظر · ${inputs.totalDurationSeconds} سیکنڈ تیار`,
    });
  };

  const updateGlobalVideoSetting = (nextInputs: VideoPromptInputs) => {
    setInputs(nextInputs);
    if (nextInputs.mainSubject.trim() && nextInputs.scenes.some((s) => s.visualDescription.trim())) {
      setOutputPrompt(buildCompleteVideoPrompt(nextInputs));
    }
  };

  const handleResetScript = () => {
    resetVideoInputs();
    const defaultGenerated = buildCompleteVideoPrompt(DEFAULT_VIDEO_INPUTS);
    setInputs(DEFAULT_VIDEO_INPUTS);
    setOutputPrompt(defaultGenerated);
    showToast(isUrdu ? 'ویڈیو پرامپٹ ڈیفالٹ سیٹنگز پر ری سیٹ کر دیا گیا۔' : 'Video script reset to default studio template.');
  };

  const addScene = () => {
    const newNum = inputs.scenes.length + 1;
    const newScene: VideoScene = {
      id: `s-${Date.now()}`,
      sceneNumber: newNum,
      durationSeconds: 5,
      visualDescription: '',
      cameraMovement: 'Slow forward dolly',
      characterAction: '',
      dialogue: '',
      voiceStyle: 'Natural narration',
      audioSfx: 'Ambient soundscape',
      transition: 'Cut',
    };
    setInputs({ ...inputs, scenes: [...inputs.scenes, newScene] });
  };

  const removeScene = (id: string) => {
    const filtered = inputs.scenes
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setInputs({ ...inputs, scenes: filtered });
  };

  const updateScene = (id: string, field: keyof VideoScene, val: any) => {
    setInputs({
      ...inputs,
      scenes: inputs.scenes.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    });
  };

  const copyScene = async (scene: VideoScene) => {
    const text = `[SCENE ${scene.sceneNumber} - ${scene.durationSeconds}s]
Visual Description: ${scene.visualDescription}
Camera Movement: ${scene.cameraMovement}
Character Action: ${scene.characterAction}
Spoken Dialogue: ${scene.dialogue ? `"${scene.dialogue}" (${scene.voiceStyle})` : 'None'}
Audio & SFX: ${scene.audioSfx}
Transition: ${scene.transition}`;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedSceneId(scene.id);
      showToast(`Scene #${scene.sceneNumber} copied to clipboard.`);
      setTimeout(() => setCopiedSceneId(null), 2000);
    } else {
      showToast('Failed to copy scene to clipboard.', true);
    }
  };

  const handleCopyAll = async () => {
    if (!outputPrompt || !outputPrompt.trim()) {
      showToast('Output prompt is empty. Click "Generate Complete Video Script" first.', true);
      return;
    }
    const ok = await copyTextToClipboard(outputPrompt);
    if (ok) {
      setCopiedAll(true);
      showToast(isUrdu ? 'مکمل پرامپٹ کلپ بورڈ پر کاپی ہو گیا!' : 'Complete video prompt copied to clipboard!');
      setTimeout(() => setCopiedAll(false), 2500);
    } else {
      showToast('Could not copy automatically. Please select text and press Ctrl+C.', true);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([outputPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_video_production_script_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadPreset = (idx: number) => {
    const p = VIDEO_PRESETS[idx];
    if (p) {
      const nextInputs = p.inputs as VideoPromptInputs;
      const generated = buildCompleteVideoPrompt(nextInputs);
      setInputs(nextInputs);
      setOutputPrompt(generated);
      emitCalculationSuccess({
        toolId: 'ai-video-prompt',
        title: 'Video Script Generated',
        titleUrdu: 'ویڈیو پرامپٹ اسکرپٹ تیار ہو گیا',
        message: `${p.title} · ${nextInputs.scenes.length} scenes`,
        messageUrdu: `${p.title} · ${nextInputs.scenes.length} مناظر`,
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Video className="w-4 h-4" />
              <span>Multi-Scene AI Video Script Engine</span>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              title="Your video scenes and script prompts are automatically saved to local storage"
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
            AI Video Prompt Generator
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Architect scene-by-scene directorial prompts for Google Flow, Runway Gen-3, Sora, Kling, and Luma with character consistency.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">Presets:</span>
          {VIDEO_PRESETS.map((p, idx) => (
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
        {/* Left Column: Form & Scenes (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Global Video Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Global Video Parameters
            </h2>

            {/* Main Subject / Concept */}
            <div>
              <label htmlFor="video-main-subject" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Main Subject / Core Concept *
              </label>
              <input
                id="video-main-subject"
                type="text"
                value={inputs.mainSubject}
                onChange={(e) => setInputs({ ...inputs, mainSubject: e.target.value })}
                placeholder="e.g. Protagonist exploring coastal clifftop villa at sunset..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Purpose / Genre
                </label>
                <select
                  value={inputs.purpose}
                  onChange={(e) => updateGlobalVideoSetting({ ...inputs, purpose: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="advertisement">Commercial Advertisement</option>
                  <option value="product promotion">Product Teaser</option>
                  <option value="storytelling">Cinematic Storytelling</option>
                  <option value="social media">Social Media Short / Reel</option>
                  <option value="educational">Explainer / Educational</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Runtime
                </label>
                <select
                  value={inputs.totalDurationSeconds}
                  onChange={(e) => updateGlobalVideoSetting({ ...inputs, totalDurationSeconds: parseInt(e.target.value, 10) })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={inputs.aspectRatio}
                  onChange={(e) => updateGlobalVideoSetting({ ...inputs, aspectRatio: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="9:16">9:16 Vertical</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="21:9">21:9 Cinema</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Resolution
                </label>
                <select
                  value={inputs.resolution}
                  onChange={(e) => updateGlobalVideoSetting({ ...inputs, resolution: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="4K Ultra HD">4K Ultra HD</option>
                  <option value="1080p Full HD">1080p Full HD</option>
                  <option value="720p HD Preview">720p HD Preview</option>
                </select>
              </div>
            </div>

            {/* Character Consistency Toggle */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.characterConsistency}
                  onChange={(e) => updateGlobalVideoSetting({ ...inputs, characterConsistency: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Mandatory Character Consistency (Across All Cuts)
                </span>
              </label>

              {inputs.characterConsistency && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={inputs.consistentCharacterDetails}
                    onChange={(e) => setInputs({ ...inputs, consistentCharacterDetails: e.target.value })}
                    placeholder="e.g. Brunette woman in ivory silk dress, amber eyes, consistent hairstyle..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Ensures AI model locks subject's face, attire, and hair across consecutive camera angles.
                  </span>
                </div>
              )}
            </div>

            {/* Audio & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Visual Style
                </label>
                <input
                  type="text"
                  value={inputs.visualStyle}
                  onChange={(e) => setInputs({ ...inputs, visualStyle: e.target.value })}
                  placeholder="e.g. Cinematic 35mm film, hyper-realistic slow-motion..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Soundtrack & Audio Mood
                </label>
                <input
                  type="text"
                  value={inputs.musicMood}
                  onChange={(e) => setInputs({ ...inputs, musicMood: e.target.value })}
                  placeholder="e.g. Rising synth arpeggios, atmospheric strings..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Scene by Scene Timeline Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Scene Breakdown ({inputs.scenes.length} Scenes)
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  currentScenesDurationSum === inputs.totalDurationSeconds
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {currentScenesDurationSum}s / {inputs.totalDurationSeconds}s total
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentScenesDurationSum !== inputs.totalDurationSeconds && (
                  <button
                    type="button"
                    onClick={autoBalanceSceneDurations}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    Auto-balance durations
                  </button>
                )}
                <button
                  type="button"
                  onClick={addScene}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Scene</span>
                </button>
              </div>
            </div>

            {/* List of Scenes */}
            <div className="space-y-4">
              {inputs.scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Scene #{scene.sceneNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 text-[11px]">Duration:</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={scene.durationSeconds}
                          onChange={(e) =>
                            updateScene(scene.id, 'durationSeconds', Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          className="w-12 px-1.5 py-0.5 text-xs font-mono text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                        <span className="text-slate-400 text-[11px]">sec</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyScene(scene)}
                        title="Copy this single scene"
                        className="p-1 text-slate-500 hover:text-blue-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {inputs.scenes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScene(scene.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                      Visual Description & Action
                    </label>
                    <input
                      type="text"
                      value={scene.visualDescription}
                      onChange={(e) => updateScene(scene.id, 'visualDescription', e.target.value)}
                      placeholder="e.g. Drone pushes forward toward protagonist standing on balcony..."
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                        Camera Motion
                      </label>
                      <input
                        type="text"
                        value={scene.cameraMovement}
                        onChange={(e) => updateScene(scene.id, 'cameraMovement', e.target.value)}
                        placeholder="e.g. Slow push-in dolly, 360 orbit..."
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                        Transition Out
                      </label>
                      <select
                        value={scene.transition}
                        onChange={(e) => updateScene(scene.id, 'transition', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Cut">Hard Cut</option>
                        <option value="Crossfade">Crossfade</option>
                        <option value="Match cut">Match Cut</option>
                        <option value="Whip pan">Whip Pan</option>
                        <option value="Fade to black">Fade to Black</option>
                      </select>
                    </div>
                  </div>

                  {/* Dialogue & Voice separation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                        Spoken Dialogue Line (Optional)
                      </label>
                      <input
                        type="text"
                        value={scene.dialogue}
                        onChange={(e) => updateScene(scene.id, 'dialogue', e.target.value)}
                        placeholder='e.g. "Some memories never fade..."'
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                        Audio / SFX Cue
                      </label>
                      <input
                        type="text"
                        value={scene.audioSfx}
                        onChange={(e) => updateScene(scene.id, 'audioSfx', e.target.value)}
                        placeholder="e.g. Wave swell, subtle perfume spritz..."
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetScript}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'ری سیٹ کریں' : 'Reset Script'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate Complete Video Script</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output Script Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Complete Production Prompt
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer"
                >
                  {copiedAll ? <CheckCircle className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAll ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  title={isUrdu ? 'TXT فائل ڈاؤن لوڈ کریں' : 'Download Script as TXT'}
                  aria-label={isUrdu ? 'TXT فائل ڈاؤن لوڈ کریں' : 'Download video script as TXT'}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  title={isUrdu ? 'اسکرپٹ پرنٹ کریں (پرنٹ ہسٹری میں محفوظ ہوگا)' : 'Print Script (saved in Print History)'}
                  aria-label={isUrdu ? 'اسکرپٹ پرنٹ کریں' : 'Print video script'}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  title={isUrdu ? 'پروڈکشن اسکرپٹ کو پی ڈی ایف کے طور پر محفوظ کریں' : 'Download formatted Production Script PDF'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 rounded-md transition-all shadow-2xs cursor-pointer"
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

            {/* Editable output */}
            <div>
              <textarea
                aria-label="Generated video production script output"
                rows={14}
                value={outputPrompt}
                onChange={(e) => setOutputPrompt(e.target.value)}
                className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Directorial script formatted with discrete visual actions, camera movements, dialogue tags, and audio cues.
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Compatible Video AI Platforms (Prompt Script Only)
            </span>
            <p>
              Paste individual scenes or the complete production script into external video models such as Google Flow, Runway, Sora, Kling, Luma, or Pika. Final clip duration, audio synthesis, and visual fidelity depend on your chosen external model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
