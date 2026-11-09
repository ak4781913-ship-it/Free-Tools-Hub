import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '../../../context/LanguageContext';
import { copyTextToClipboard } from '../../../utils/toolResultExtractor';
import { QrCode, Download, Copy, RotateCcw, CheckCircle, AlertCircle, Link, Mail, Phone, Wifi } from 'lucide-react';

export const QRCodeTool: React.FC = () => {
  const { t } = useLanguage();

  const [dataType, setDataType] = useState<'url' | 'text' | 'wifi' | 'email' | 'phone'>('url');
  const [inputValue, setInputValue] = useState(() =>
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://example.com'
  );

  // WiFi specific fields
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Email specific fields
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Customization
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(300);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute final payload string based on data type
  const getPayload = () => {
    switch (dataType) {
      case 'url':
      case 'text':
        return inputValue.trim();
      case 'phone': {
        const trimmed = inputValue.trim();
        if (!trimmed) return '';
        return trimmed.toLowerCase().startsWith('tel:') ? trimmed : `tel:${trimmed}`;
      }
      case 'wifi':
        if (!wifiSsid) return '';
        return `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;
      case 'email':
        if (!emailTo) return '';
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
      default:
        return inputValue.trim();
    }
  };

  const currentPayload = getPayload();

  useEffect(() => {
    if (!currentPayload) {
      setErrorMsg(null);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    setErrorMsg(null);
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        currentPayload,
        {
          width: qrSize,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        },
        (error) => {
          if (error) setErrorMsg('Could not render QR code with selected parameters.');
        }
      );
    }
  }, [currentPayload, fgColor, bgColor, qrSize]);

  const handleDownload = () => {
    if (!canvasRef.current || !currentPayload) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode_${Date.now()}.png`;
    a.click();
  };

  const handleCopy = async () => {
    if (!currentPayload) return;
    const ok = await copyTextToClipboard(currentPayload);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setDataType('url');
    setInputValue(
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://example.com'
    );
    setWifiSsid('');
    setWifiPassword('');
    setWifiEncryption('WPA');
    setEmailTo('');
    setEmailSubject('');
    setFgColor('#0f172a');
    setBgColor('#ffffff');
    setQrSize(300);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <QrCode className="w-4 h-4" />
            <span>Client-Side Matrix Generator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            QR Code Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate high-resolution, custom colored QR codes for links, WiFi, contact cards, and text with instant PNG download.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input & Customization (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          {/* Data type tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
              Select Payload Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'url', label: 'URL Link', icon: Link },
                { id: 'text', label: 'Plain Text', icon: QrCode },
                { id: 'wifi', label: 'WiFi Access', icon: Wifi },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'phone', label: 'Phone', icon: Phone },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDataType(item.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      dataType === item.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic input area */}
          <div className="space-y-3">
            {dataType === 'url' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {dataType === 'text' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Text Content
                </label>
                <textarea
                  rows={4}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter message or notes..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {dataType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Office_WiFi_5G"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Network Password"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Encryption
                    </label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {dataType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Inquiry from QR code"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {dataType === 'phone' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="+971501234567"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Color & Size Customization */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Color & Dimension Styling
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Foreground Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                  />
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                  />
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  QR Resolution: {qrSize}px
                </label>
                <input
                  type="range"
                  min="180"
                  max="600"
                  step="20"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Download (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Scannable QR Preview
            </span>

            {/* Empty or error state while keeping canvas mounted for ref stability */}
            {(!currentPayload || errorMsg) && (
              <div className="w-64 h-64 flex flex-col items-center justify-center p-4 border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-800 dark:text-amber-300 text-xs text-center">
                <AlertCircle className="w-6 h-6 mb-2 text-amber-600" />
                <span>{errorMsg || 'Please enter valid text or URL to generate QR code.'}</span>
              </div>
            )}
            <div
              className={`p-4 rounded-xl shadow-xs border border-slate-200 items-center justify-center ${
                !currentPayload || errorMsg ? 'hidden' : 'flex'
              }`}
              style={{ backgroundColor: bgColor }}
            >
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-sm" />
            </div>

            {/* Download and copy controls */}
            <div className="w-full flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!currentPayload}
                className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!currentPayload}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
