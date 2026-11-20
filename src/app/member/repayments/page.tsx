'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RefreshCw,
  Landmark,
  PlusCircle,
  FileCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Loader2,
  Copy,
  Info,
  Calendar,
  Upload,
  FileText,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Badge,
} from '@/components/ui/shared';
import { ReceiptPreviewModal } from '@/components/ui/receipt-modal';
import { formatCurrency, formatDate, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { submitRepaymentAction } from '@/app/actions/repayments';
import { uploadReceiptAction, getReceiptSignedUrl } from '@/app/actions/storage';
import type { Repayment } from '@/lib/types';

const cooperativeSettingsFallback = {
  bankName: 'Zenith Bank Plc',
  bankAccountNumber: '1012345678',
  bankAccountName: 'DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD',
};

function MemberRepaymentsContent() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const preselectedLoanId = searchParams.get('loanId');

  const [bankSettings, setBankSettings] = useState(cooperativeSettingsFallback);
  const [memberLoans, setMemberLoans] = useState<any[]>([]);
  const [memberRepaymentsList, setMemberRepaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submission modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transferRef, setTransferRef] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Preview state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    ref: string;
    amount: string;
    date: string;
  } | null>(null);

  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  const loadRepaymentsData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const [loansRes, repaysRes, settingsRes] = await Promise.all([
        supabase
          .from('loans')
          .select('*')
          .eq('member_id', user.id)
          .order('approved_date', { ascending: false }),
        supabase
          .from('repayments')
          .select('*')
          .eq('member_id', user.id)
          .order('submission_date', { ascending: false }),
        supabase
          .from('cooperative_settings')
          .select('bank_name, bank_account_number, bank_account_name')
          .limit(1)
          .maybeSingle(),
      ]);

      if (settingsRes?.data) {
        setBankSettings({
          bankName: settingsRes.data.bank_name || cooperativeSettingsFallback.bankName,
          bankAccountNumber: settingsRes.data.bank_account_number || cooperativeSettingsFallback.bankAccountNumber,
          bankAccountName: settingsRes.data.bank_account_name || cooperativeSettingsFallback.bankAccountName,
        });
      }

      if (!loansRes.error && loansRes.data) {
        setMemberLoans(
          loansRes.data.map((l) => ({
            id: l.id,
            ref: l.ref,
            purpose: l.purpose,
            principalAmount: Number(l.principal_amount),
            disbursedAmount: Number(l.disbursed_amount || l.principal_amount),
            outstandingPrincipal: Number(l.outstanding_principal),
            status: l.status,
          }))
        );
      }

      if (!repaysRes.error && repaysRes.data) {
        setMemberRepaymentsList(
          repaysRes.data.map((r) => ({
            id: r.id,
            ref: r.ref,
            loanId: r.loan_id,
            memberId: r.member_id,
            amount: Number(r.amount),
            principalComponent: Number(r.principal_component || r.amount),
            interestComponent: Number(r.interest_component || 0),
            status: r.status,
            transferReference: r.transfer_reference || r.ref,
            receiptUrl: r.receipt_url,
            paymentDate: r.payment_date,
            auditNote: r.remarks || r.rejection_reason || '',
            verifiedBy: r.verified_by,
            createdAt: r.submission_date || r.created_at,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching repayment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepaymentsData();
  }, [user]);

  const activeLoans = memberLoans.filter(
    (l) => (l.status === 'disbursed' || l.status === 'repaying') && l.outstandingPrincipal > 0
  );

  // If query parameter ?loanId=... is present, auto-select it and open modal
  useEffect(() => {
    if (preselectedLoanId && activeLoans.length > 0) {
      const match = activeLoans.find((l) => l.id === preselectedLoanId);
      if (match) {
        setSelectedLoanId(match.id);
        setSubmitModalOpen(true);
      }
    } else if (activeLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].id);
    }
  }, [preselectedLoanId, activeLoans, selectedLoanId]);

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalRepaid = memberRepaymentsList
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCount = memberRepaymentsList.filter((r) => r.status === 'pending').length;

  const currentSelectedLoan = activeLoans.find((l) => l.id === selectedLoanId) || activeLoans[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!allowedFormats.includes(selected.type)) {
        setFileError('Unsupported format. Please upload JPG, PNG, WebP or PDF.');
        setFile(null);
        setFilePreview(null);
        return;
      }
      if (selected.size > 8 * 1024 * 1024) {
        setFileError('Receipt file size exceeds 8MB limit.');
        setFile(null);
        setFilePreview(null);
        return;
      }
      setFile(selected);
      if (selected.type.startsWith('image/') || selected.type === 'application/pdf') {
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

  const openReceiptViewer = async (repayment: any) => {
    if (!repayment.receiptUrl) return;
    try {
      const signed = await getReceiptSignedUrl(repayment.receiptUrl);
      setSelectedReceipt({
        url: signed || repayment.receiptUrl,
        ref: repayment.ref,
        amount: formatCurrency(repayment.amount),
        date: formatDate(repayment.paymentDate),
      });
      setPreviewModalOpen(true);
    } catch {
      setSelectedReceipt({
        url: repayment.receiptUrl,
        ref: repayment.ref,
        amount: formatCurrency(repayment.amount),
        date: formatDate(repayment.paymentDate),
      });
      setPreviewModalOpen(true);
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(repayAmount);

    if (!selectedLoanId) {
      addToast('error', 'Select Loan', 'Please select which loan facility you are repaying.');
      return;
    }

    const loan = activeLoans.find((l) => l.id === selectedLoanId);
    if (!loan) {
      addToast('error', 'Invalid Loan', 'Selected loan was not found or is already completed.');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      addToast('error', 'Invalid Amount', 'Please specify a valid payment amount.');
      return;
    }

    if (amountNum > loan.outstandingPrincipal) {
      addToast(
        'error',
        'Overpayment Prevented',
        `Maximum repayment amount for this facility is ${formatCurrency(loan.outstandingPrincipal)}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      let uploadedReceiptUrl: string | null = null;
      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await uploadReceiptAction(uploadData);
        if (uploadRes.success && uploadRes.url) {
          uploadedReceiptUrl = uploadRes.url;
        }
      }

      const formData = new FormData();
      formData.append('loanId', selectedLoanId);
      formData.append('amount', repayAmount);
      formData.append('paymentMethod', 'bank_transfer');
      if (transferRef.trim()) {
        formData.append('bankReference', transferRef.trim().toUpperCase());
      }
      if (uploadedReceiptUrl) {
        formData.append('receiptUrl', uploadedReceiptUrl);
      }

      const res = await submitRepaymentAction(formData);

      if (!res.success) {
        addToast('error', 'Submission Failed', res.error || 'Failed to submit repayment.');
        setSubmitting(false);
        return;
      }

      addToast(
        'success',
        'Repayment Evidence Submitted',
        `Your installment of ${formatCurrency(amountNum)} has been submitted. It will amortize your loan balance upon administrator reconciliation.`
      );

      setSubmitModalOpen(false);
      setRepayAmount('');
      setTransferRef('');
      setFile(null);
      setFilePreview(null);
      await loadRepaymentsData();
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Repayment submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Repayments"
        description="Monitor your loan amortization, submit installment proof, and track administrator reconciliation. Repayments deduct 100% directly from outstanding principal."
        actions={
          activeLoans.length > 0 ? (
            <button
              onClick={() => {
                if (!selectedLoanId && activeLoans.length > 0) {
                  setSelectedLoanId(activeLoans[0].id);
                }
                setSubmitModalOpen(true);
              }}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Submit Repayment Proof
            </button>
          ) : (
            <Link href="/member/loans" className="btn-secondary text-xs flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              View Loan Facilities
            </Link>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Outstanding Principal"
          value={formatCurrency(totalOutstanding)}
          subtitle={
            activeLoans.length > 0
              ? `Across ${activeLoans.length} active loan facility`
              : 'Zero debt / Completed'
          }
          icon={<Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={totalOutstanding > 0 ? 'border-amber-200 dark:border-amber-900/40' : ''}
        />
        <StatCard
          title="Total Principal Settled"
          value={formatCurrency(totalRepaid)}
          subtitle="Lifetime verified repayments"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Pending Verification"
          value={pendingCount.toString()}
          subtitle="Installments in review"
          icon={<Clock className="h-5 w-5 text-surface-400" />}
        />
      </div>

      {/* Active Loans Quick Callout */}
      {activeLoans.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-600" />
                Active Facilities Requiring Installments
              </h3>
              <p className="text-xs text-surface-600 dark:text-slate-300 mt-1">
                You have {activeLoans.length} active loan facility with outstanding balance. Click below to submit transfer evidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeLoans.map((loan) => (
                <button
                  key={loan.id}
                  onClick={() => {
                    setSelectedLoanId(loan.id);
                    setSubmitModalOpen(true);
                  }}
                  className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="h-3 w-3" />
                  Repay {loan.ref} ({formatCurrency(loan.outstandingPrincipal)})
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Repayments History */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Repayment History & Ledger</h3>
            <p className="text-xs text-surface-500 dark:text-slate-400">
              Submitted installment proofs and administrator verification status
            </p>
          </div>
          {activeLoans.length > 0 && (
            <button
              onClick={() => {
                if (!selectedLoanId && activeLoans.length > 0) {
                  setSelectedLoanId(activeLoans[0].id);
                }
                setSubmitModalOpen(true);
              }}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              + Make Repayment
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading repayment history...</p>
          </div>
        ) : memberRepaymentsList.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <RefreshCw className="h-10 w-10 text-surface-300 mx-auto" />
            <p className="text-sm font-semibold text-surface-700 dark:text-slate-300">No repayment entries found</p>
            <p className="text-xs text-surface-400 max-w-sm mx-auto">
              You have not submitted any loan repayment receipts yet.
            </p>
            {activeLoans.length > 0 && (
              <button
                onClick={() => {
                  setSelectedLoanId(activeLoans[0].id);
                  setSubmitModalOpen(true);
                }}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Submit First Repayment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Transfer Date</th>
                  <th className="table-header">Session / Bank Ref</th>
                  <th className="table-header">Amount Paid</th>
                  <th className="table-header">Principal Amortized</th>
                  <th className="table-header">Receipt Proof</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {memberRepaymentsList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                      {r.ref}
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">
                      {formatDate(r.paymentDate)}
                    </td>
                    <td className="table-cell font-mono text-xs text-surface-600 dark:text-slate-400">
                      {r.transferReference}
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900 dark:text-white">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="table-cell font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(r.principalComponent)}
                    </td>
                    <td className="table-cell">
                      {r.receiptUrl ? (
                        <button
                          onClick={() => openReceiptViewer(r)}
                          className="btn-ghost text-xs px-2 py-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 inline-flex items-center gap-1 font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Proof
                        </button>
                      ) : (
                        <span className="text-xs text-surface-400 italic">None</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-xs text-surface-500 dark:text-slate-400">
                      {r.status === 'approved' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Verified & Deducted
                        </span>
                      ) : r.status === 'pending' ? (
                        <span className="text-amber-600 dark:text-amber-400">Awaiting admin check</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">{r.auditNote || 'Rejected'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SUBMISSION MODAL */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setSubmitModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-darkSurface-card p-6 shadow-modal border border-surface-200 dark:border-darkSurface-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-200 dark:border-darkSurface-border">
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">Submit Loan Repayment Proof</h3>
                <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">
                  Repayments deduct 100% directly from outstanding principal upon admin verification.
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRepaymentSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="selectLoan" className="label text-surface-700 dark:text-slate-300">
                  Target Loan Facility
                </label>
                <select
                  id="selectLoan"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="select-field"
                  required
                >
                  {activeLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.ref} — Outstanding: {formatCurrency(loan.outstandingPrincipal)} ({loan.purpose})
                    </option>
                  ))}
                </select>
                {currentSelectedLoan && (
                  <div className="mt-1 flex items-center justify-between text-xs text-surface-500 dark:text-slate-400">
                    <span>Remaining Balance: <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(currentSelectedLoan.outstandingPrincipal)}</strong></span>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(currentSelectedLoan.outstandingPrincipal.toString())}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Pay Full Balance
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repayAmount" className="label text-surface-700 dark:text-slate-300">
                    Installment Amount (₦)
                  </label>
                  <input
                    id="repayAmount"
                    type="number"
                    step="1000"
                    min="1000"
                    max={currentSelectedLoan ? currentSelectedLoan.outstandingPrincipal : undefined}
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="paymentDate" className="label text-surface-700 dark:text-slate-300">
                    Transfer Date
                  </label>
                  <input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="transferRef" className="label flex items-center justify-between text-surface-700 dark:text-slate-300">
                  <span>Bank Session ID / Reference</span>
                  <span className="text-[10px] text-surface-400 dark:text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  id="transferRef"
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. 090... (from transfer receipt)"
                  className="input-field font-mono text-xs uppercase"
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="label text-surface-700 dark:text-slate-300">
                  Payment Slip / Transfer Proof
                </label>
                {!file ? (
                  <label
                    htmlFor="repaymentReceiptFile"
                    className="border-2 border-dashed border-surface-200 dark:border-darkSurface-border hover:border-emerald-600 dark:hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-50/50 dark:bg-darkSurface-bg/50"
                  >
                    <Upload className="h-6 w-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-surface-800 dark:text-slate-200">
                      Upload bank slip or screenshot
                    </span>
                    <span className="text-[11px] text-surface-400 mt-0.5">
                      JPG, PNG, WebP or PDF (up to 8MB)
                    </span>
                    <input
                      id="repaymentReceiptFile"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-100 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-surface-400">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 rounded-md text-surface-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
              </div>

              {/* Official Cooperative Bank Account Card */}
              <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-surface-900 dark:text-white flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                    Official Cooperative Bank Account:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankSettings.bankAccountNumber, 'Account number')}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <div className="font-mono text-surface-800 dark:text-slate-200 font-bold">
                  {bankSettings.bankName} — {bankSettings.bankAccountNumber}
                </div>
                <div className="text-[11px] text-surface-500 dark:text-slate-400">
                  {bankSettings.bankAccountName}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSubmitModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading & Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit Repayment Proof
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <ReceiptPreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedReceipt(null);
          }}
          imageUrl={selectedReceipt.url}
          reference={selectedReceipt.ref}
          amount={selectedReceipt.amount}
          date={selectedReceipt.date}
          title="Repayment Proof Slip"
        />
      )}
    </div>
  );
}

export default function MemberRepaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-surface-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs">Loading repayments portal...</p>
        </div>
      }
    >
      <MemberRepaymentsContent />
    </Suspense>
  );
}
