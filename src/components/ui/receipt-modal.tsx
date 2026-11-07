'use client';

import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title?: string;
  reference?: string;
  amount?: string;
  senderName?: string;
  date?: string;
}

export function ReceiptPreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Payment Transfer Slip',
  reference,
  amount,
  senderName,
  date,
}: ReceiptModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `receipt-${reference || 'slip'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If no image is provided, display a fallback mock bank slip graphic
  const hasValidImage = imageUrl && imageUrl.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-darkSurface-card border border-surface-200 dark:border-darkSurface-border shadow-2xl overflow-hidden z-10">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between bg-surface-50/70 dark:bg-darkSurface-bg/60">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">{title}</h3>
              {reference && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-200 dark:bg-slate-800 text-surface-700 dark:text-slate-300">
                  {reference}
                </span>
              )}
            </div>
            {(amount || senderName || date) && (
              <p className="text-xs text-surface-500 dark:text-slate-400 mt-1">
                {amount && <span className="font-bold text-surface-900 dark:text-white mr-2">{amount}</span>}
                {senderName && <span className="mr-2">From: <strong>{senderName}</strong></span>}
                {date && <span>• {date}</span>}
              </p>
            )}
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-surface-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-surface-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 rounded-lg text-surface-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors"
              title="Rotate 90°"
              aria-label="Rotate 90 degrees"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-1 rounded-lg text-xs font-medium text-surface-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors hidden sm:block"
              title="Reset view"
            >
              Reset
            </button>
            <div className="h-4 w-px bg-surface-200 dark:bg-darkSurface-border mx-1" />
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-surface-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors"
              title="Download Slip"
              aria-label="Download Slip"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Canvas / Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-900/90 min-h-[380px] max-h-[65vh]">
          {hasValidImage ? (
            <div
              className="transition-transform duration-200 ease-out origin-center"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={imageUrl}
                alt="Payment receipt proof"
                className="max-h-[500px] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-slate-700 select-none"
              />
            </div>
          ) : (
            /* Styled Realistic Mock Bank Slip graphic */
            <div
              className="transition-transform duration-200 ease-out origin-center w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl text-slate-800 font-sans border border-slate-200 select-none"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
            >
              {/* Bank Transfer Slip Graphic */}
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 font-bold text-lg">
                  ✓
                </div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Electronic Funds Transfer
                </h4>
                <p className="text-2xl font-black text-slate-900 mt-1">{amount || '₦50,000.00'}</p>
                <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Transaction Successful
                </span>
              </div>

              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sender:</span>
                  <span className="font-semibold text-slate-800">{senderName || 'Adaeze Okafor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-semibold text-slate-800">DE-BLOSSOM COOP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Receiving Bank:</span>
                  <span className="font-semibold text-slate-800">Zenith Bank Plc</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account No:</span>
                  <span className="font-mono font-semibold text-slate-800">1012345678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="text-slate-700">{date || 'Today, 10:45 AM'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Session ID / Ref:</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 break-all">
                    {reference || 'NIP-09026724020188941200'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 text-center">
                <p className="text-[10px] text-slate-400">
                  Verified Payment Instrument • Stored in Secure Cooperative Vault
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 border-t border-surface-200 dark:border-darkSurface-border bg-surface-50 dark:bg-darkSurface-bg/50 flex items-center justify-between text-xs text-surface-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>Click & drag or use zoom controls to inspect session reference.</span>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-3 py-1 font-medium"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
