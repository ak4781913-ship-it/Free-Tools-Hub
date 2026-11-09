import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Camera,
  Calendar,
  Sliders,
  X,
  ExternalLink,
  Info,
  Check,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { ParsedExifData } from './exifUtils';
import { CompressedImageItem } from './ImageCompressorTool';

interface ExifModalProps {
  item: CompressedImageItem | null;
  stripExifEnabled: boolean;
  onClose: () => void;
  onToggleStripExif?: () => void;
}

export const ExifModal: React.FC<ExifModalProps> = ({
  item,
  stripExifEnabled,
  onClose,
  onToggleStripExif,
}) => {
  if (!item) return null;

  const exif = item.exifData;
  const hasExif = exif?.hasExif;
  const hasGps = exif?.hasGps && exif.gpsLatitude !== undefined && exif.gpsLongitude !== undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exif-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                stripExifEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
              }`}
            >
              {stripExifEnabled ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="exif-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                EXIF Metadata & Privacy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm">
                {item.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close EXIF details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`px-5 py-3 border-b text-xs flex items-center justify-between gap-3 ${
            stripExifEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {stripExifEnabled ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className="font-medium">
              {stripExifEnabled
                ? 'EXIF Stripping Active: Location, camera, and date are stripped from output.'
                : 'EXIF Retained: Metadata will remain embedded in the compressed image.'}
            </span>
          </div>

          {onToggleStripExif && (
            <button
              type="button"
              onClick={onToggleStripExif}
              className="text-xs font-semibold underline hover:no-underline shrink-0 cursor-pointer"
            >
              {stripExifEnabled ? 'Keep EXIF' : 'Strip EXIF'}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {!hasExif ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                No EXIF Metadata Detected
              </h4>
              <p className="text-slate-500 max-w-sm mx-auto text-xs">
                This image does not contain embedded EXIF tags (such as GPS coordinates or camera specifications). It is already privacy-clean.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* GPS Location Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>GPS Location Coordinates</span>
                  </div>
                  {hasGps ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                      Sensitive Data
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Not recorded</span>
                  )}
                </div>

                {hasGps ? (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Latitude</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {exif?.gpsLatitude}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Longitude</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {exif?.gpsLongitude}
                        </span>
                      </div>
                    </div>
                    {exif?.gpsAltitude !== undefined && (
                      <div className="text-[11px]">
                        <span className="text-slate-400">Altitude: </span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {exif.gpsAltitude} m
                        </span>
                      </div>
                    )}
                    <div className="pt-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-500">
                        {stripExifEnabled
                          ? '✅ Removed from compressed output'
                          : '⚠️ Exposes physical location'}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${exif?.gpsLatitude},${exif?.gpsLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>Preview on Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No GPS coordinates were embedded in this image.
                  </p>
                )}
              </div>

              {/* Camera & Device Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white mb-2.5">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <span>Camera & Hardware Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Camera Make</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {exif?.make || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Model</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {exif?.model || 'Unknown'}
                    </span>
                  </div>
                  {exif?.lensModel && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block">Lens</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {exif.lensModel}
                      </span>
                    </div>
                  )}
                  {exif?.software && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block">Software / OS</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {exif.software}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Exposure Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white mb-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>Capture Date</span>
                  </div>
                  <div className="text-[11px] font-mono font-medium text-slate-800 dark:text-slate-200">
                    {exif?.dateTimeOriginal || exif?.dateTime || 'No date tag'}
                  </div>
                </div>

                {/* Technical / Exposure */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white mb-2">
                    <Sliders className="w-4 h-4 text-purple-500" />
                    <span>Exposure Settings</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {exif?.focalLength && (
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono">
                        {exif.focalLength}
                      </span>
                    )}
                    {exif?.fNumber !== undefined && (
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono">
                        f/{exif.fNumber}
                      </span>
                    )}
                    {exif?.exposureTime && (
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono">
                        {exif.exposureTime}
                      </span>
                    )}
                    {exif?.iso !== undefined && (
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono">
                        ISO {exif.iso}
                      </span>
                    )}
                    {!exif?.focalLength && !exif?.fNumber && !exif?.exposureTime && !exif?.iso && (
                      <span className="text-slate-400">Standard settings</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Educational Footer */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2.5 text-[11px] text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Why strip EXIF metadata?</span>
              Photos taken by modern smartphones and digital cameras silently save personal information—such as the exact GPS location of your home, time stamps, and camera serial numbers. Stripping EXIF metadata before sharing online keeps your identity and location private.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {exif?.rawTagsCount ? `${exif.rawTagsCount} EXIF tags identified` : '0 EXIF tags'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
