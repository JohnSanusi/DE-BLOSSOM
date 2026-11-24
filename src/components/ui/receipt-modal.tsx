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
  ExternalLink,
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

/** Detect if a URL or data URI points to a PDF */
function isPdfUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('data:application/pdf')) return true;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.endsWith('.pdf')) return true;
    if (parsed.search.toLowerCase().includes('.pdf')) return true;
  } catch {
    // Relative paths or data URIs
  }
  return clean.includes('.pdf') || clean.includes('application/pdf');
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
    const ext = isPdf ? 'pdf' : 'png';
    link.download = `receipt-${reference || 'slip'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasValidFile = imageUrl && imageUrl.trim().length > 0;
  const isPdf = hasValidFile ? isPdfUrl(imageUrl!) : false;

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
        <div className="px-3.5 py-3 sm:px-5 sm:py-4 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between gap-2 bg-surface-50/70 dark:bg-darkSurface-bg/60">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-white truncate max-w-[140px] sm:max-w-none">
                {title}
              </h3>
              {isPdf && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                  PDF Slip
                </span>
              )}
              {reference && (
                <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-surface-200 dark:bg-slate-800 text-surface-700 dark:text-slate-300 max-w-[110px] sm:max-w-[200px] truncate shrink-0">
                  {reference}
                </span>
              )}
            </div>
            {(amount || senderName || date) && (
              <p className="text-[11px] sm:text-xs text-surface-500 dark:text-slate-400 mt-1 truncate">
                {amount && <span className="font-bold text-surface-900 dark:text-white mr-1.5">{amount}</span>}
                {senderName && <span className="mr-1.5">From: <strong>{senderName}</strong></span>}
                {date && <span className="hidden xs:inline">• {date}</span>}
              </p>
            )}
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {!isPdf && (
              <div className="hidden sm:flex items-center gap-1">
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
                  className="px-2 py-1 rounded-lg text-xs font-medium text-surface-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors"
                  title="Reset view"
                >
                  Reset
                </button>
                <div className="h-4 w-px bg-surface-200 dark:bg-darkSurface-border mx-1" />
              </div>
            )}
            {/* Open in new tab (native viewer) */}
            {hasValidFile && (
              <a
                href={imageUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                title="Open in native viewer"
                aria-label="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Full</span>
              </a>
            )}
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
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-darkSurface-hover transition-colors ml-0.5"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Canvas / Viewport */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900/95 min-h-[340px] max-h-[65vh] p-3 sm:p-6">
          {hasValidFile ? (
            isPdf ? (
              /* ── PDF Handling (Desktop inline iframe + Mobile dedicated card) ── */
              <div className="w-full h-full flex flex-col items-center justify-center">
                {/* Desktop Inline PDF Viewer */}
                <div className="hidden md:block w-full h-full min-h-[500px]">
                  <iframe
                    src={imageUrl!}
                    title="Payment receipt PDF"
                    className="w-full h-full min-h-[500px] rounded-lg border border-slate-700 bg-white"
                  />
                </div>

                {/* Mobile PDF Document Card */}
                <div className="block md:hidden w-full max-w-sm rounded-2xl bg-white dark:bg-darkSurface-card p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-darkSurface-border text-center space-y-4 animate-scale-in">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                    <FileText className="h-8 w-8" />
                  </div>

                  <div>
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 uppercase tracking-wider mb-1.5">
                      PDF Document Receipt
                    </span>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                      Official Transfer Evidence Slip
                    </h4>
                    <p className="text-xs text-surface-500 dark:text-slate-400 mt-1">
                      High-resolution bank transmission record attached to this transaction.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border text-left text-xs space-y-1.5">
                    {amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-surface-400 dark:text-slate-400">Amount:</span>
                        <span className="font-bold text-surface-900 dark:text-white">{amount}</span>
                      </div>
                    )}
                    {senderName && (
                      <div className="flex justify-between items-center">
                        <span className="text-surface-400 dark:text-slate-400">Sender:</span>
                        <span className="font-medium text-surface-800 dark:text-slate-200 truncate max-w-[160px]">{senderName}</span>
                      </div>
                    )}
                    {reference && (
                      <div className="flex justify-between items-center pt-1 border-t border-surface-200/50 dark:border-darkSurface-border">
                        <span className="text-surface-400 dark:text-slate-400">Session Ref:</span>
                        <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate max-w-[160px]">{reference}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions */}
                  <div className="space-y-2 pt-1">
                    <a
                      href={imageUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 shadow-sm font-semibold"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Full PDF Slip
                    </a>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF Document
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Image Viewer (JPG / PNG / WebP) ── */
              <div
                className="p-2 sm:p-8 flex items-center justify-center transition-transform duration-200 ease-out origin-center max-w-full"
                style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
              >
                <img
                  src={imageUrl!}
                  alt="Payment receipt proof"
                  className="max-h-[500px] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-slate-700 select-none"
                />
              </div>
            )
          ) : (
            /* ── Fallback mock slip (no receipt uploaded) ── */
            <div
              className="transition-transform duration-200 ease-out origin-center w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl text-slate-800 font-sans border border-slate-200 select-none m-6"
              style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
            >
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
                  <span className="font-semibold text-slate-800">{senderName || 'Member'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-semibold text-slate-800">DE-BLOSSOM COOP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="text-slate-700">{date || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Session ID / Ref:</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 break-all">
                    {reference || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 text-center">
                <p className="text-[10px] text-slate-400">
                  No receipt image was uploaded with this submission.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-t border-surface-200 dark:border-darkSurface-border bg-surface-50 dark:bg-darkSurface-bg/50 flex items-center justify-between gap-2 text-xs text-surface-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              {isPdf
                ? 'PDF document — tap "Open Full" to view with mobile native reader.'
                : 'Pinch, drag or use toolbar controls to inspect slip.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-3 py-1 font-medium shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
