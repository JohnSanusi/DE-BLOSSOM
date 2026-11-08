'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Landmark,
  ShieldCheck,
  Loader2,
  Calendar,
  X,
  Eye,
  Info,
  HelpCircle,
} from 'lucide-react';
import { cooperativeSettings } from '@/lib/mock-data';
import { Card, PageHeader } from '@/components/ui/shared';
import { formatCurrency, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ReceiptPreviewModal } from '@/components/ui/receipt-modal';
import type { Contribution, SavingsType } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { submitContributionAction } from '@/app/actions/contributions';
import { uploadReceiptAction } from '@/app/actions/storage';
import { useAuth } from '@/lib/supabase/auth-context';

export default function NewContributionPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, profile } = useAuth();

  const [type, setType] = useState<SavingsType>('regular');
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');

  React.useEffect(() => {
    if (profile?.full_name) {
      setSenderName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setSenderName(user.user_metadata.full_name);
    }
  }, [profile, user]);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transferReference, setTransferReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [senderError, setSenderError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [showIdHelper, setShowIdHelper] = useState(false);

  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!allowedFormats.includes(selected.type)) {
        setFileError('Unsupported file format. Please upload JPG, PNG, WebP or PDF.');
        setFile(null);
        setFilePreview(null);
        return;
      }
      if (selected.size > 8 * 1024 * 1024) {
        setFileError('Receipt file size exceeds the 8MB limit.');
        setFile(null);
        setFilePreview(null);
        return;
      }

      setFile(selected);

      // Create preview for image files
      if (selected.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selected);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileError('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('info', 'Copied to Clipboard', `${label} copied: ${text}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1000) {
      setAmountError('Please enter a valid amount of at least ₦1,000.');
      hasError = true;
    } else {
      setAmountError('');
    }

    // Validate sender name
    if (!senderName.trim()) {
      setSenderError('Please provide the account name used for the bank transfer.');
      hasError = true;
    } else {
      setSenderError('');
    }

    // Validate receipt file
    if (!file) {
      setFileError('Please attach your bank transfer receipt proof or screenshot.');
      hasError = true;
    } else {
      setFileError('');
    }

    if (hasError) {
      addToast('error', 'Form Incomplete', 'Please review the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(20);

    try {
      let uploadedReceiptUrl: string | null = null;
      if (file) {
        setUploadProgress(40);
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await uploadReceiptAction(uploadData);
        if (uploadRes.success && uploadRes.url) {
          uploadedReceiptUrl = uploadRes.url;
        }
      }

      setUploadProgress(70);
      const contribData = new FormData();
      contribData.append('amount', amount);
      contribData.append('savingsType', type);
      contribData.append('senderName', senderName);
      contribData.append('paymentMethod', 'bank_transfer');
      if (transferReference.trim()) {
        contribData.append('bankReference', transferReference.trim().toUpperCase());
      }
      if (uploadedReceiptUrl) {
        contribData.append('receiptUrl', uploadedReceiptUrl);
      }

      const res = await submitContributionAction(contribData);
      setUploadProgress(100);
      setSubmitting(false);

      if (!res.success) {
        addToast('error', 'Submission Failed', res.error || 'Failed to submit contribution.');
        return;
      }

      setSubmittedSuccess(true);
      addToast(
        'success',
        'Payment Proof Submitted',
        'Your transfer slip was received and queued for administrative reconciliation.'
      );
    } catch (err: any) {
      setSubmitting(false);
      addToast('error', 'Submission Error', err?.message || 'Something went wrong.');
    }
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="text-center p-8 sm:p-10 space-y-5">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Payment Proof Submitted</h2>
            <p className="text-sm text-surface-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              Your contribution of{' '}
              <strong className="text-surface-900 dark:text-white">{formatCurrency(parseFloat(amount))}</strong> ({type === 'regular' ? 'Regular Equity' : 'Special Voluntary Savings'}) has been queued for reconciliation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 text-left space-y-1 transition-colors">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              Administrative Verification Notice:
            </p>
            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
              Uploading a receipt does not automatically update your cooperative balance. An
              administrator will compare the sender name, amount, and receipt with the cooperative&apos;s
              official bank records. Only verified submissions enter the permanent financial ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/member/contributions" className="btn-primary text-xs w-full sm:w-auto">
              View All Contributions
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedSuccess(false);
                setAmount('');
                setTransferReference('');
                setFile(null);
                setFilePreview(null);
                setUploadProgress(0);
              }}
              className="btn-secondary text-xs w-full sm:w-auto"
            >
              Submit Another Payment
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/member/contributions" className="btn-ghost p-2 text-surface-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
            Submit Contribution Evidence
          </h1>
          <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">
            Pay directly to the cooperative bank account and upload your payment slip for reconciliation.
          </p>
        </div>
      </div>

      {/* OFFICIAL BANK DETAILS CARD (Dynamic from cooperativeSettings) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-brand-950 to-brand-900 text-white shadow-md">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <Landmark className="h-4 w-4" />
          Official Cooperative Receiving Account
        </div>
        <p className="text-xs text-white/70 mb-4">
          Please transfer your contribution to the cooperative&apos;s verified bank account below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-white/60 block">Bank Name</span>
            <span className="font-semibold text-sm text-white">{cooperativeSettings.bankName}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-white/60 block">Account Number</span>
              <span className="font-mono font-bold text-base text-accent-300">
                {cooperativeSettings.bankAccountNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(cooperativeSettings.bankAccountNumber, 'Account Number')
              }
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Copy account number"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-white/60 block">Account Name</span>
            <span className="font-semibold text-xs text-white leading-tight block mt-0.5">
              {cooperativeSettings.bankAccountName}
            </span>
          </div>
        </div>
      </div>

      {/* SUBMISSION FORM */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contribution Type Selection */}
          <div>
            <label className="label">1. Select Savings Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  type === 'regular'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                    : 'border-surface-200 dark:border-darkSurface-border hover:bg-surface-50 dark:hover:bg-darkSurface-hover'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  checked={type === 'regular'}
                  onChange={() => setType('regular')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-bold text-surface-900 dark:text-white block">Regular Savings</span>
                  <span className="text-xs text-surface-500 dark:text-slate-400 block mt-0.5 leading-normal">
                    Monthly equity contribution. Non-withdrawable on demand; forms loan eligibility.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  type === 'special'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                    : 'border-surface-200 dark:border-darkSurface-border hover:bg-surface-50 dark:hover:bg-darkSurface-hover'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  checked={type === 'special'}
                  onChange={() => setType('special')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-bold text-surface-900 dark:text-white block">Special Savings</span>
                  <span className="text-xs text-surface-500 dark:text-slate-400 block mt-0.5 leading-normal">
                    Voluntary interest-free deposit. Can be withdrawn upon request.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="label">
                2. Amount Transferred (₦) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  min="1000"
                  step="500"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) setAmountError('');
                  }}
                  placeholder="e.g. 50000"
                  className={`input-field ${
                    amountError ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''
                  }`}
                />
              </div>
              {amountError ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {amountError}
                </p>
              ) : (
                <p className="text-[11px] text-surface-500 dark:text-slate-400 mt-1">
                  {amount ? `Exact figure: ${formatCurrency(parseFloat(amount) || 0)}` : 'Minimum contribution: ₦1,000'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="paymentDate" className="label">
                Date of Transfer <span className="text-red-500">*</span>
              </label>
              <input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input-field"
              />
              <p className="text-[11px] text-surface-500 dark:text-slate-400 mt-1">
                The date the transfer left your bank account.
              </p>
            </div>
          </div>

          {/* Sender Account Name (Zero friction helper) */}
          <div>
            <label htmlFor="senderName" className="label flex items-center justify-between">
              <span>3. Sender Account Name <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">Pre-filled with your name</span>
            </label>
            <input
              id="senderName"
              type="text"
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                if (senderError) setSenderError('');
              }}
              placeholder="e.g. Adaeze Okafor"
              className={`input-field ${
                senderError ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''
              }`}
            />
            {senderError ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {senderError}
              </p>
            ) : (
              <p className="text-[11px] text-surface-500 dark:text-slate-400 mt-1">
                The name that appears on your bank debit alert. If someone paid for you, enter their name here.
              </p>
            )}
          </div>

          {/* Bank Receipt Upload (Primary evidence) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">
                4. Bank Transfer Receipt / Screenshot <span className="text-red-500">*</span>
              </label>
              {filePreview && (
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Uploaded Slip
                </button>
              )}
            </div>

            {!file ? (
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors bg-surface-50/50 dark:bg-darkSurface-bg/40 ${
                  fileError
                    ? 'border-red-400 dark:border-red-600 bg-red-50/10'
                    : 'border-surface-300 dark:border-darkSurface-border hover:border-emerald-500'
                }`}
              >
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-8 w-8 text-surface-400 dark:text-slate-400" />
                  <div className="text-xs text-surface-600 dark:text-slate-300">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 focus-within:outline-none"
                    >
                      <span>Upload receipt photo or PDF</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <span className="text-surface-500 dark:text-slate-400"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-surface-400 dark:text-slate-400">
                    JPG, PNG, WebP or PDF receipt screenshot up to 8MB
                  </p>
                </div>
              </div>
            ) : (
              /* Attached File Card with Instant Preview */
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Receipt preview"
                      className="h-12 w-12 rounded-lg object-cover border border-emerald-300 shrink-0 cursor-pointer"
                      onClick={() => setReceiptModalOpen(true)}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCheck className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-surface-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-surface-500 dark:text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for submission
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(true)}
                    className="btn-secondary text-xs px-2.5 py-1.5"
                    title="View slip in lightbox"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fileError}
              </p>
            )}
          </div>

          {/* Optional Bank Reference / Session ID */}
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-darkSurface-bg/40 border border-surface-200 dark:border-darkSurface-border space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="transferReference" className="text-xs font-semibold text-surface-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>5. Bank Session ID / Reference Number</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-slate-400 bg-surface-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Optional
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowIdHelper(!showIdHelper)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{showIdHelper ? 'Hide guide' : 'Where is this?'}</span>
              </button>
            </div>

            <input
              id="transferReference"
              type="text"
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
              placeholder="e.g. 09026724020188941200 (or leave empty)"
              className="input-field font-mono text-xs uppercase"
            />

            <p className="text-[11px] text-surface-500 dark:text-slate-400 leading-relaxed">
              Don&apos;t know where to find this? <strong>Leave it blank!</strong> Our administrator will read it directly from your uploaded receipt slip.
            </p>

            {showIdHelper && (
              <div className="p-3 mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5 animate-fade-in">
                <p className="font-semibold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-emerald-600" /> Common Bank Labels:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-900 dark:text-emerald-300">
                  <li><strong>OPay / PalmPay:</strong> Look for <em>Transaction Reference</em> at the bottom.</li>
                  <li><strong>Moniepoint:</strong> Look for <em>Session ID</em> (starts with 090...).</li>
                  <li><strong>GTBank / Zenith:</strong> Look for <em>Reference Number</em> or <em>Payment ID</em>.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Submission Button & Progress */}
          <div className="pt-2">
            {submitting && (
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-xs text-surface-600 dark:text-slate-400">
                  <span>Uploading receipt proof...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-sm py-3 font-semibold shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Payment Proof...
                </>
              ) : (
                'Submit Contribution for Verification'
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Lightbox Receipt Viewer */}
      <ReceiptPreviewModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        imageUrl={filePreview}
        title="Attached Payment Slip"
        reference={transferReference || 'PENDING-RECONCILIATION'}
        amount={amount ? formatCurrency(parseFloat(amount) || 0) : undefined}
        senderName={senderName}
        date={paymentDate}
      />
    </div>
  );
}
