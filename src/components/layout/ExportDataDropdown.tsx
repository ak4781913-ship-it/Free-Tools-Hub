/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  ShieldCheck,
  Check,
  HardDriveDownload,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ToolDefinition } from '../../types';
import { exportDataAsJson, exportDataAsCsv, ExportExecutionResult } from '../../utils/toolDataExporter';

interface ExportDataDropdownProps {
  tool: ToolDefinition;
  variant?: 'header' | 'reader';
  onExportComplete: (result: ExportExecutionResult, format: 'json' | 'csv') => void;
}

export const ExportDataDropdown: React.FC<ExportDataDropdownProps> = ({
  tool,
  variant = 'header',
  onExportComplete,
}) => {
  const { language, dir, t } = useLanguage();
  const isUrdu = language === 'ur';
  const [isOpen, setIsOpen] = useState(false);
  const [lastExportedFormat, setLastExportedFormat] = useState<'json' | 'csv' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toolTitle = isUrdu ? tool.nameUrdu : tool.name;

  const handleExport = (format: 'json' | 'csv') => {
    setIsOpen(false);
    let result: ExportExecutionResult;
    if (format === 'json') {
      result = exportDataAsJson(tool.id, toolTitle);
    } else {
      result = exportDataAsCsv(tool.id, toolTitle);
    }

    if (result.success) {
      setLastExportedFormat(format);
      setTimeout(() => setLastExportedFormat(null), 3000);
    }

    onExportComplete(result, format);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={
          isUrdu
            ? 'ٹول کا ڈیٹا بطور JSON یا CSV ڈاؤن لوڈ کریں'
            : 'Export input data as JSON or CSV to save your work locally'
        }
        aria-label={isUrdu ? 'ڈیٹا ایکسپورٹ کریں' : 'Export Data'}
        className={`inline-flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs group ${
          variant === 'reader'
            ? 'px-2.5 py-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
            : 'px-3 py-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-750'
        } ${isOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500 dark:border-emerald-500' : ''}`}
      >
        <HardDriveDownload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className={variant === 'reader' ? 'hidden xs:inline' : ''}>
          {isUrdu ? 'ڈیٹا ایکسپورٹ' : 'Export Data'}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu Modal/Popover */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`fixed left-3 right-3 mt-2 sm:absolute sm:w-80 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            dir === 'rtl' ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isUrdu ? 'ان پٹ ڈیٹا ایکسپورٹ کریں' : 'Export Input Data'}</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {isUrdu ? 'مقامی فائل' : 'Local File'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isUrdu
                ? 'اپنے ان پٹس اور ترتیبات کو اپنے کمپیوٹر یا فون میں محفوظ کریں۔'
                : 'Download your inputs and configuration directly to your device.'}
            </p>
          </div>

          {/* Export Options */}
          <div className="p-2 space-y-1">
            {/* 1. JSON Option */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleExport('json')}
              className="w-full text-start flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <FileJson className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {isUrdu ? 'بطور JSON ڈاؤن لوڈ کریں (.json)' : 'Download JSON (.json)'}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    JSON
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {isUrdu
                    ? 'بیک اپ اور تکنیکی استعمال کے لیے معیاری فارمیٹ'
                    : 'Structured machine-readable backup format'}
                </p>
              </div>
            </button>

            {/* 2. CSV Option */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleExport('csv')}
              className="w-full text-start flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isUrdu ? 'بطور CSV ڈاؤن لوڈ کریں (.csv)' : 'Download CSV (.csv)'}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    CSV
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {isUrdu
                    ? 'مائیکروسافٹ ایکسل اور گوگل شیٹس کے لیے جدول فارمیٹ'
                    : 'Spreadsheet table for Excel & Google Sheets'}
                </p>
              </div>
            </button>
          </div>

          {/* Privacy Footer */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isUrdu
                ? '100% نجی، براؤزر پروسیس شدہ۔ سرور پر کچھ نہیں بھیجا جاتا۔'
                : '100% private & client-side. Zero server storage.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
