import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  FileText,
  Sliders,
  Type,
  ListOrdered,
} from 'lucide-react';
import { CompressedImageItem, getExtensionForMime } from './ImageCompressorTool';

interface BulkRenameModalProps {
  isOpen: boolean;
  items: CompressedImageItem[];
  selectedBatchIds: Set<string>;
  initialPrefix: string;
  initialSuffix: string;
  onClose: () => void;
  onApplyRename: (renamedMap: Record<string, string>, prefix: string, suffix: string) => void;
  onResetAllNames: () => void;
}

export const BulkRenameModal: React.FC<BulkRenameModalProps> = ({
  isOpen,
  items,
  selectedBatchIds,
  initialPrefix,
  initialSuffix,
  onClose,
  onApplyRename,
  onResetAllNames,
}) => {
  const [prefix, setPrefix] = useState<string>(initialPrefix);
  const [suffix, setSuffix] = useState<string>(initialSuffix);
  const [namingMode, setNamingMode] = useState<'original' | 'sequence'>('original');
  const [customBase, setCustomBase] = useState<string>('image');
  const [startIndex, setStartIndex] = useState<number>(1);
  const [paddingDigits, setPaddingDigits] = useState<number>(2);
  const [toLowerCase, setToLowerCase] = useState<boolean>(false);
  const [replaceSpaces, setReplaceSpaces] = useState<boolean>(true);
  const [applyOnlyToSelected, setApplyOnlyToSelected] = useState<boolean>(false);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrefix(initialPrefix);
      setSuffix(initialSuffix);
      setApplyOnlyToSelected(selectedBatchIds.size > 0 && selectedBatchIds.size < items.length);
    }
  }, [isOpen, initialPrefix, initialSuffix, selectedBatchIds.size, items.length]);

  if (!isOpen) return null;

  const targetItems = applyOnlyToSelected && selectedBatchIds.size > 0
    ? items.filter((it) => selectedBatchIds.has(it.id))
    : items;

  // Helper to compute formatted filename for an item
  const computeNewName = (item: CompressedImageItem, indexInBatch: number): string => {
    let base = '';
    if (namingMode === 'sequence') {
      const num = startIndex + indexInBatch;
      const paddedNum = String(num).padStart(paddingDigits, '0');
      base = `${customBase}_${paddedNum}`;
    } else {
      base = item.name.replace(/\.[^/.]+$/, '');
    }

    if (replaceSpaces) {
      base = base.replace(/\s+/g, '_');
    }

    let finalBase = `${prefix}${base}${suffix}`;
    if (toLowerCase) {
      finalBase = finalBase.toLowerCase();
    }

    const ext = getExtensionForMime(item.targetFormat);
    return `${finalBase}.${ext}`;
  };

  const handleApply = () => {
    const renamedMap: Record<string, string> = {};
    targetItems.forEach((item, idx) => {
      let base = '';
      if (namingMode === 'sequence') {
        const num = startIndex + idx;
        const paddedNum = String(num).padStart(paddingDigits, '0');
        base = `${customBase}_${paddedNum}`;
      } else {
        base = item.name.replace(/\.[^/.]+$/, '');
      }

      if (replaceSpaces) {
        base = base.replace(/\s+/g, '_');
      }

      let finalBase = `${prefix}${base}${suffix}`;
      if (toLowerCase) {
        finalBase = finalBase.toLowerCase();
      }
      renamedMap[item.id] = finalBase;
    });

    onApplyRename(renamedMap, prefix, suffix);
    onClose();
  };

  const prefixPresets = [
    { label: 'compressed_', value: 'compressed_' },
    { label: 'web_', value: 'web_' },
    { label: 'opt_', value: 'opt_' },
    { label: 'photo_', value: 'photo_' },
  ];

  const suffixPresets = [
    { label: '_min', value: '_min' },
    { label: '_optimized', value: '_optimized' },
    { label: '_small', value: '_small' },
    { label: '_web', value: '_web' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-rename-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 id="bulk-rename-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Rename Images Before Download
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apply prefixes, suffixes, or sequential numbering across {targetItems.length} images
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close bulk rename dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Target Selection scope */}
          {selectedBatchIds.size > 0 && selectedBatchIds.size < items.length && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Rename Scope:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  {applyOnlyToSelected ? `${selectedBatchIds.size} Selected Images` : `All ${items.length} Images`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApplyOnlyToSelected(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    !applyOnlyToSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApplyOnlyToSelected(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    applyOnlyToSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Selected Only ({selectedBatchIds.size})
                </button>
              </div>
            </div>
          )}

          {/* Naming Mode Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
              Naming Pattern Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNamingMode('original')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  namingMode === 'original'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Type className="w-4 h-4 text-emerald-600" />
                  <span>Preserve Original Filenames</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Keep each file's source name and attach prefix and/or suffix.
                </p>
                <div className="mt-2 text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {prefix}[original_name]{suffix}.ext
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNamingMode('sequence')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  namingMode === 'sequence'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <ListOrdered className="w-4 h-4 text-emerald-600" />
                  <span>Sequential Numbering Pattern</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Replace with custom base name and ascending numbers (01, 02...).
                </p>
                <div className="mt-2 text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {prefix}[basename]_[01]{suffix}.ext
                </div>
              </button>
            </div>
          </div>

          {/* Sequential Pattern Settings (only visible in sequence mode) */}
          {namingMode === 'sequence' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Custom Base Name
                </label>
                <input
                  type="text"
                  value={customBase}
                  onChange={(e) => setCustomBase(e.target.value)}
                  placeholder="e.g. photo, trip, product"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Start Index Number
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={startIndex}
                  onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Number Padding
                </label>
                <select
                  value={paddingDigits}
                  onChange={(e) => setPaddingDigits(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                >
                  <option value={1}>1 digit (1, 2, 3...)</option>
                  <option value={2}>2 digits (01, 02, 03...)</option>
                  <option value={3}>3 digits (001, 002, 003...)</option>
                  <option value={4}>4 digits (0001, 0002...)</option>
                </select>
              </div>
            </div>
          )}

          {/* Prefix & Suffix Inputs with Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prefix Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>File Prefix</span>
                  <span className="text-[10px] text-slate-400 font-normal">(added to start)</span>
                </label>
                {prefix && (
                  <button
                    type="button"
                    onClick={() => setPrefix('')}
                    className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. compressed_ or web_"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {/* Presets */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400">Presets:</span>
                {prefixPresets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrefix(p.value)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                  >
                    +{p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suffix Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>File Suffix</span>
                  <span className="text-[10px] text-slate-400 font-normal">(added before extension)</span>
                </label>
                {suffix && (
                  <button
                    type="button"
                    onClick={() => setSuffix('')}
                    className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. _min or _optimized"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {/* Presets */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400">Presets:</span>
                {suffixPresets.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSuffix(s.value)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                  >
                    +{s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick formatting options */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={replaceSpaces}
                onChange={(e) => setReplaceSpaces(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>Replace whitespace with underscore (_)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={toLowerCase}
                onChange={(e) => setToLowerCase(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>Convert filename to lowercase</span>
            </label>
          </div>

          {/* Live Preview List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Live Rename Preview ({targetItems.length} images)
              </span>
              <span className="text-[10.5px] text-slate-400">
                Extension reflects target format conversion
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {targetItems.slice(0, 15).map((item, idx) => {
                const newName = computeNewName(item, idx);
                return (
                  <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-2 min-w-0 max-w-[45%]">
                      <span className="font-mono text-slate-400 shrink-0 font-bold">#{idx + 1}</span>
                      <span className="truncate text-slate-600 dark:text-slate-400 font-mono" title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />

                    <div className="min-w-0 max-w-[50%] flex items-center gap-1.5 justify-end">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate" title={newName}>
                        {newName}
                      </span>
                    </div>
                  </div>
                );
              })}

              {targetItems.length > 15 && (
                <div className="p-2 text-center text-[10.5px] text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 font-mono">
                  + {targetItems.length - 15} more files will be renamed with this pattern
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setPrefix('');
              setSuffix('');
              setNamingMode('original');
              onResetAllNames();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Names to Original</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply to {targetItems.length} Images</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
