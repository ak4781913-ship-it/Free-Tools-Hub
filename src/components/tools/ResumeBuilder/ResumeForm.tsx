import React, { useState, useRef } from 'react';
import { ResumeData, WorkExperience, Education, SkillItem, LanguageItem, Certification, ProjectItem } from '../../../types/resume';
import { Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Palette, Camera, Upload, Image as ImageIcon, Loader2, Check, X } from 'lucide-react';
import { processProfilePhoto, validatePhotoFile } from './photoUploadHelper';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'experience' | 'education' | 'skills' | 'more' | 'design'>('info');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileSelected = async (file: File) => {
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setIsProcessingPhoto(true);
      setPhotoError(null);
      const processed = await processProfilePhoto(file);
      updatePersonalInfo('photo', processed.dataUrl);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to process image.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: any) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value,
      },
    });
  };

  const updateDesign = (field: keyof ResumeData['designSettings'], value: any) => {
    onChange({
      ...data,
      designSettings: {
        ...data.designSettings,
        [field]: value,
      },
    });
  };

  const toggleSection = (section: keyof ResumeData['sectionVisibility']) => {
    onChange({
      ...data,
      sectionVisibility: {
        ...data.sectionVisibility,
        [section]: !data.sectionVisibility[section],
      },
    });
  };

  // Work experience helpers
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      highlights: [''],
    };
    onChange({ ...data, experience: [newExp, ...data.experience] });
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    });
  };

  const addHighlight = (expId: string) => {
    onChange({
      ...data,
      experience: data.experience.map((e) =>
        e.id === expId ? { ...e, highlights: [...e.highlights, ''] } : e
      ),
    });
  };

  const updateHighlight = (expId: string, index: number, text: string) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => {
        if (e.id !== expId) return e;
        const h = [...e.highlights];
        h[index] = text;
        return { ...e, highlights: h };
      }),
    });
  };

  const removeHighlight = (expId: string, index: number) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => {
        if (e.id !== expId) return e;
        return { ...e, highlights: e.highlights.filter((_, i) => i !== index) };
      }),
    });
  };

  // Education helpers
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      scoreOrGrade: '',
      description: '',
    };
    onChange({ ...data, education: [newEdu, ...data.education] });
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    });
  };

  // Skills helpers
  const [skillInput, setSkillInput] = useState('');
  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const newSkill: SkillItem = {
      id: `sk-${Date.now()}`,
      name: skillInput.trim(),
    };
    onChange({ ...data, skills: [...data.skills, newSkill] });
    setSkillInput('');
  };

  const removeSkill = (id: string) => {
    onChange({
      ...data,
      skills: data.skills.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Sub-nav tabs for forms */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none bg-slate-50 dark:bg-slate-950">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'info'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Contact & Summary
        </button>
        <button
          onClick={() => setActiveTab('experience')}
          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'experience'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Experience ({data.experience.length})
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'education'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Education ({data.education.length})
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'skills'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Skills ({data.skills.length})
        </button>
        <button
          onClick={() => setActiveTab('more')}
          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'more'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Languages & Projects
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'design'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Design & Layout
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* TAB 1: PERSONAL INFO */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            {/* PROFILE PHOTO SECTION */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Profile Photo (Optional)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add a professional headshot for Modern, Classic, or Minimal templates.
                    </p>
                  </div>
                </div>

                {data.personalInfo.photo && (
                  <button
                    type="button"
                    onClick={() => {
                      updatePersonalInfo('photo', '');
                      if (photoInputRef.current) photoInputRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Photo Input (Hidden) - File selection from device */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await handlePhotoFileSelected(file);
                  if (photoInputRef.current) photoInputRef.current.value = '';
                }}
              />

              {/* Camera Input (Hidden) - Direct camera capture on mobile devices */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await handlePhotoFileSelected(file);
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                }}
              />

              {photoError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300">
                  {photoError}
                </div>
              )}

              {/* Photo Upload & Preview Display */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Photo Preview Thumbnail */}
                <div className="relative shrink-0">
                  {data.personalInfo.photo ? (
                    <div
                      className={`w-20 h-20 bg-slate-100 dark:bg-slate-800 border-2 border-blue-600/60 shadow-sm overflow-hidden flex items-center justify-center ${
                        data.personalInfo.photoShape === 'square' ? 'rounded-xl' : 'rounded-full'
                      }`}
                    >
                      <img
                        src={data.personalInfo.photo}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[9px] font-semibold">No Photo</span>
                    </div>
                  )}

                  {isProcessingPhoto && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-full flex items-center justify-center backdrop-blur-2xs">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Upload Buttons & Customization Controls */}
                <div className="space-y-2.5 flex-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {data.personalInfo.photo ? (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace Photo</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingPhoto}
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      title="Capture photo using camera on supported mobile or desktop devices"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Take Photo</span>
                    </button>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      JPG, PNG, WebP (Max 5MB)
                    </span>
                  </div>

                  {/* Photo Customization Options (Shape & Position) */}
                  {data.personalInfo.photo && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/80 dark:border-slate-800">
                      {/* Shape toggle */}
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium">Shape:</span>
                        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => updatePersonalInfo('photoShape', 'circle')}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                              (data.personalInfo.photoShape || 'circle') === 'circle'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Circle
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePersonalInfo('photoShape', 'square')}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                              data.personalInfo.photoShape === 'square'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Square
                          </button>
                        </div>
                      </div>

                      {/* Position toggle */}
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium">Position:</span>
                        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => updatePersonalInfo('photoPosition', 'right')}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                              (data.personalInfo.photoPosition || 'right') === 'right'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Upper Right
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePersonalInfo('photoPosition', 'left')}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                              data.personalInfo.photoPosition === 'left'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Beside Name
                          </button>
                        </div>
                      </div>

                      {/* ATS toggle */}
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(data.personalInfo.showPhotoInAts)}
                          onChange={(e) => updatePersonalInfo('showPhotoInAts', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>Show in ATS template</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500" title="Required for PDF export">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-600 ${
                    !data.personalInfo.fullName.trim()
                      ? 'border-amber-400 dark:border-amber-600'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {!data.personalInfo.fullName.trim() && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    Full Name is required before downloading your PDF.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Professional Title
                </label>
                <input
                  type="text"
                  value={data.personalInfo.jobTitle}
                  onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="alex@example.com"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-600 ${
                    data.personalInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalInfo.email.trim())
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {data.personalInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalInfo.email.trim()) && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                    Enter a valid email format (e.g. name@domain.com).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={data.personalInfo.city}
                  onChange={(e) => updatePersonalInfo('city', e.target.value)}
                  placeholder="Dubai"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={data.personalInfo.country}
                  onChange={(e) => updatePersonalInfo('country', e.target.value)}
                  placeholder="United Arab Emirates"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={data.personalInfo.linkedinUrl || ''}
                  onChange={(e) => updatePersonalInfo('linkedinUrl', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Portfolio / Website
                </label>
                <input
                  type="text"
                  value={data.personalInfo.portfolioUrl || ''}
                  onChange={(e) => updatePersonalInfo('portfolioUrl', e.target.value)}
                  placeholder="myportfolio.dev"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Profile
                </label>
                <input
                  type="text"
                  value={data.personalInfo.githubUrl || ''}
                  onChange={(e) => updatePersonalInfo('githubUrl', e.target.value)}
                  placeholder="github.com/username"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Executive Professional Summary
              </label>
              <textarea
                rows={4}
                value={data.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                placeholder="2-4 concise sentences highlighting your professional expertise, leadership, and quantitative achievements..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: WORK EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Work Experience</h3>
                <p className="text-xs text-slate-500">Add past and current roles in reverse chronological order.</p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            {data.experience.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">No work experiences added yet.</p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Add your first position
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.experience.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Position #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                          placeholder="e.g. Technical Product Lead"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Location
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                          placeholder="e.g. Dubai, UAE"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1/2">
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                            Start Date
                          </label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            placeholder="YYYY-MM"
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                            End Date
                          </label>
                          <input
                            type="text"
                            disabled={exp.current}
                            value={exp.current ? 'Present' : exp.endDate}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            placeholder="YYYY-MM"
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`curr-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`curr-${exp.id}`} className="text-xs text-slate-700 dark:text-slate-300">
                        I currently work in this role
                      </label>
                    </div>

                    {/* Bullet points */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Responsibilities & Key Achievements
                        </label>
                        <button
                          type="button"
                          onClick={() => addHighlight(exp.id)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        >
                          + Add bullet
                        </button>
                      </div>
                      {exp.highlights.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateHighlight(exp.id, bIdx, e.target.value)}
                            placeholder="Action verb + quantified impact (e.g. Scaled database throughput by 40%)..."
                            className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          {exp.highlights.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHighlight(exp.id, bIdx)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Education & Degrees</h3>
                <p className="text-xs text-slate-500">Add university, college, or academic qualifications.</p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            {data.education.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">No education entries added yet.</p>
                <button
                  type="button"
                  onClick={addEducation}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Add education
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <div
                    key={edu.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Degree #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Degree / Major
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="e.g. Bachelor of Science in Information Tech"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Institution / University
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          placeholder="e.g. Dubai University"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Dates
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                            placeholder="Start (2018)"
                            className="w-1/2 px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                            placeholder="End (2022)"
                            className="w-1/2 px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                          Grade / Honors (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.scoreOrGrade || ''}
                          onChange={(e) => updateEducation(edu.id, 'scoreOrGrade', e.target.value)}
                          placeholder="e.g. Magna Cum Laude / 3.8 GPA"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Core Competencies & Skills</h3>
            <form onSubmit={addSkill} className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Type skill name (e.g. React, Python, Cloud Architecture) and press Enter"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shrink-0"
              >
                + Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {data.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <span>{skill.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MORE (LANGUAGES, PROJECTS, CERTS) */}
        {activeTab === 'more' && (
          <div className="space-y-6">
            {/* Languages */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Languages</h3>
              <button
                type="button"
                onClick={() => {
                  const newLang: LanguageItem = {
                    id: `lang-${Date.now()}`,
                    language: '',
                    proficiency: 'Fluent',
                  };
                  onChange({ ...data, languages: [...data.languages, newLang] });
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3 block hover:underline"
              >
                + Add Language
              </button>
              <div className="space-y-2">
                {data.languages.map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={l.language}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          languages: data.languages.map((x) =>
                            x.id === l.id ? { ...x, language: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Language (e.g. English, Arabic)"
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <select
                      value={l.proficiency}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          languages: data.languages.map((x) =>
                            x.id === l.id ? { ...x, proficiency: e.target.value as any } : x
                          ),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Native">Native</option>
                      <option value="Bilingual">Bilingual</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          languages: data.languages.filter((x) => x.id !== l.id),
                        })
                      }
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Certifications</h3>
              <button
                type="button"
                onClick={() => {
                  const newCert: Certification = {
                    id: `cert-${Date.now()}`,
                    name: '',
                    issuer: '',
                    date: '',
                  };
                  onChange({ ...data, certifications: [...data.certifications, newCert] });
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3 block hover:underline"
              >
                + Add Certification
              </button>
              <div className="space-y-2">
                {data.certifications.map((c) => (
                  <div key={c.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          certifications: data.certifications.map((x) =>
                            x.id === c.id ? { ...x, name: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Certification name"
                      className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={c.issuer}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          certifications: data.certifications.map((x) =>
                            x.id === c.id ? { ...x, issuer: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Issuing authority (e.g. AWS)"
                      className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={c.date}
                        onChange={(e) =>
                          onChange({
                            ...data,
                            certifications: data.certifications.map((x) =>
                              x.id === c.id ? { ...x, date: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="Year (2024)"
                        className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...data,
                            certifications: data.certifications.filter((x) => x.id !== c.id),
                          })
                        }
                        className="text-slate-400 hover:text-red-500 px-1"
                        aria-label="Remove certification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Projects */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Key Projects</h3>
              <button
                type="button"
                onClick={() => {
                  const newProject: ProjectItem = {
                    id: `proj-${Date.now()}`,
                    title: '',
                    link: '',
                    technologies: '',
                    description: '',
                  };
                  onChange({ ...data, projects: [...data.projects, newProject] });
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3 block hover:underline cursor-pointer"
              >
                + Add Project
              </button>
              <div className="space-y-3">
                {data.projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) =>
                          onChange({
                            ...data,
                            projects: data.projects.map((x) =>
                              x.id === p.id ? { ...x, title: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="Project title (e.g. Cloud Payroll Portal)"
                        className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...data,
                            projects: data.projects.filter((x) => x.id !== p.id),
                          })
                        }
                        aria-label="Remove project"
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={p.link || ''}
                        onChange={(e) =>
                          onChange({
                            ...data,
                            projects: data.projects.map((x) =>
                              x.id === p.id ? { ...x, link: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="Project link / URL (optional)"
                        className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={p.technologies || ''}
                        onChange={(e) =>
                          onChange({
                            ...data,
                            projects: data.projects.map((x) =>
                              x.id === p.id ? { ...x, technologies: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="Tech stack (e.g. React, TypeScript, PostgreSQL)"
                        className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={p.description}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          projects: data.projects.map((x) =>
                            x.id === p.id ? { ...x, description: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Brief summary of impact, architecture, or measurable outcome..."
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DESIGN & SETTINGS */}
        {activeTab === 'design' && (
          <div className="space-y-5">
            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                Resume Template Layout
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'modern', label: 'Modern Accent' },
                  { id: 'classic', label: 'Classic Serif' },
                  { id: 'minimal', label: 'Minimal Clean' },
                  { id: 'ats', label: 'ATS-Friendly' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => updateDesign('template', tpl.id)}
                    className={`p-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      data.designSettings.template === tpl.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'Indigo', hex: '#4f46e5' },
                  { label: 'Royal Blue', hex: '#2563eb' },
                  { label: 'Emerald', hex: '#059669' },
                  { label: 'Burgundy', hex: '#991b1b' },
                  { label: 'Charcoal', hex: '#1e293b' },
                  { label: 'Teal', hex: '#0d9488' },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => updateDesign('accentColor', color.hex)}
                    title={color.label}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      data.designSettings.accentColor === color.hex ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={data.designSettings.accentColor}
                  onChange={(e) => updateDesign('accentColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
                  title="Custom Color"
                />
              </div>
            </div>

            {/* Font Family & Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  Typography Style
                </label>
                <select
                  value={data.designSettings.fontFamily}
                  onChange={(e) => updateDesign('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="sans">Clean Modern Sans (Plus Jakarta)</option>
                  <option value="serif">Timeless Serif</option>
                  <option value="mono">Technical Monospace</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  Content Spacing / Density
                </label>
                <select
                  value={data.designSettings.fontSize}
                  onChange={(e) => updateDesign('fontSize', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="compact">Compact (Fit more on 1 page)</option>
                  <option value="normal">Standard A4 Balance</option>
                  <option value="relaxed">Relaxed / Spacious</option>
                </select>
              </div>
            </div>

            {/* Section Visibility Toggles */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                Section Visibility Controls
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    ['experience', 'Work Experience'],
                    ['education', 'Education'],
                    ['skills', 'Core Skills'],
                    ['languages', 'Languages'],
                    ['certifications', 'Certifications'],
                    ['projects', 'Projects'],
                  ] as const
                ).map(([key, label]) => {
                  const visible = data.sectionVisibility[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSection(key)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        visible
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          : 'bg-transparent text-slate-400 border-dashed border-slate-300 dark:border-slate-700 line-through'
                      }`}
                    >
                      <span>{label}</span>
                      {visible ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
