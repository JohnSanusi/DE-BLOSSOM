'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  HandCoins,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Landmark,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  contributions,
  transactions,
  auditLog,
  currentAdmin,
  cooperativeSettings,
} from '@/lib/mock-data';
import { Card, PageHeader, StatusBadge, Badge, ConfirmDialog, InfoTooltip } from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ReceiptPreviewModal } from '@/components/ui/receipt-modal';
import { Eye } from 'lucide-react';
import type { Contribution, ContributionStatus, Transaction, AuditEntry } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminContributionReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const contributionId = resolvedParams.id;
  const router = useRouter();
  const { addToast } = useToast();

  const contribution = contributions.find((c) => c.id === contributionId);

  // Local state for interactive review in demo
  const [status, setStatus] = useState<ContributionStatus>(
    contribution ? contribution.status : 'pending'
  );
  const [remarks, setRemarks] = useState(contribution?.remarks || '');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  if (!contribution) {
    return (
      <div className="py-12 text-center space-y-4">
        <HandCoins className="h-12 w-12 text-surface-300 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900">Contribution Record Not Found</h2>
        <p className="text-xs text-surface-500 max-w-sm mx-auto">
          The requested payment verification record does not exist.
        </p>
        <Link href="/admin/contributions" className="btn-primary text-xs inline-flex">
          Back to Contributions
        </Link>
      </div>
    );
  }

  // Check if already posted to financial ledger
  const existingLedgerTxn = transactions.find((t) => t.relatedRef === contribution.ref);

  const handleApprove = () => {
    setActionLoading(true);

    setTimeout(() => {
      // 1. Update contribution
      contribution.status = 'approved';
      contribution.verifiedBy = currentAdmin.fullName;
      contribution.verifiedAt = new Date().toISOString();
      contribution.remarks = remarks || 'Bank transfer verified and matched against statements.';

      // 2. Post to financial ledger exactly once (if not already posted)
      if (!existingLedgerTxn) {
        const newTxn: Transaction = {
          id: `txn_${Date.now()}`,
          ref: generateRef('TXN'),
          memberId: contribution.memberId,
          memberName: contribution.memberName,
          type: 'contribution',
          category: contribution.type === 'regular' ? 'regular_savings' : 'special_savings',
          description: `${
            contribution.type === 'regular' ? 'Regular savings' : 'Special savings'
          } contribution - verified payment`,
          credit: contribution.amount,
          debit: 0,
          currency: 'NGN',
          relatedRef: contribution.ref,
          sourceRef: contribution.transferReference,
          date: new Date().toISOString(),
          status: 'posted',
        };
        transactions.unshift(newTxn);
      }

      // 3. Log administrative audit action
      const newAudit: AuditEntry = {
        id: `aud_${Date.now()}`,
        performedBy: currentAdmin.id,
        performedByName: currentAdmin.fullName,
        action: 'contribution.approved',
        targetType: 'contribution',
        targetId: contribution.id,
        targetRef: contribution.ref,
        details: `Approved ${contribution.type} contribution of ₦${contribution.amount.toLocaleString()} from ${
          contribution.memberName
        }`,
        timestamp: new Date().toISOString(),
      };
      auditLog.unshift(newAudit);

      setStatus('approved');
      setActionLoading(false);
      setApproveDialogOpen(false);
      addToast(
        'success',
        'Payment Approved & Posted',
        `Contribution of ${formatCurrency(contribution.amount)} has entered the official financial ledger.`
      );
    }, 1200);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      addToast('error', 'Rejection Reason Required', 'Please provide an administrative reason for rejection.');
      return;
    }

    setActionLoading(true);

    setTimeout(() => {
      contribution.status = 'rejected';
      contribution.verifiedBy = currentAdmin.fullName;
      contribution.verifiedAt = new Date().toISOString();
      contribution.remarks = rejectReason.trim();

      // Log administrative audit action
      const newAudit: AuditEntry = {
        id: `aud_${Date.now()}`,
        performedBy: currentAdmin.id,
        performedByName: currentAdmin.fullName,
        action: 'contribution.rejected',
        targetType: 'contribution',
        targetId: contribution.id,
        targetRef: contribution.ref,
        details: `Rejected contribution ${contribution.ref} from ${contribution.memberName}: ${rejectReason.trim()}`,
        timestamp: new Date().toISOString(),
      };
      auditLog.unshift(newAudit);

      setStatus('rejected');
      setActionLoading(false);
      setRejectDialogOpen(false);
      addToast(
        'warning',
        'Contribution Rejected',
        'Payment was rejected and did not affect any ledger balance.'
      );
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/contributions" className="btn-ghost p-2 text-surface-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 font-mono">
                {contribution.ref}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-surface-500 mt-0.5">
              Submitted by{' '}
              <strong className="text-surface-800">{contribution.memberName}</strong> on{' '}
              {formatDateTime(contribution.submissionDate)}
            </p>
          </div>
        </div>

        {/* Action buttons if pending */}
        {status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRejectDialogOpen(true)}
              className="btn-danger text-xs px-3 py-2"
            >
              Reject Submission
            </button>
            <button
              onClick={() => setApproveDialogOpen(true)}
              className="btn-accent text-xs px-4 py-2 font-bold inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve & Post to Ledger
            </button>
            <InfoTooltip content="Irreversible Action: Approving writes an immutable entry directly into the financial ledger. It permanently credits the member's official balance." />
          </div>
        )}
      </div>

      {/* Financial Reconciliation Checklist Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payment submission specifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
              Payment Evidence Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-surface-400 block text-[11px]">Member Name</span>
                <span className="font-semibold text-surface-900">{contribution.memberName}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Member ID</span>
                <span className="font-mono text-surface-700">{contribution.memberId}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Savings Category</span>
                <span className="font-semibold text-surface-900 capitalize">
                  {contribution.type} Savings
                </span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Claimed Amount</span>
                <span className="font-bold text-base text-brand-900">
                  {formatCurrency(contribution.amount)}
                </span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Payment / Transfer Date</span>
                <span className="font-medium text-surface-800">
                  {formatDate(contribution.paymentDate)}
                </span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Bank Transfer Session ID / Ref</span>
                <span className="font-mono font-bold text-surface-900 bg-surface-100 px-2 py-0.5 rounded">
                  {contribution.transferReference}
                </span>
              </div>
            </div>

            {/* Official receiving bank account reference */}
            <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-200 text-xs text-surface-600">
              <span className="font-bold text-surface-800 block mb-1">
                Designated Cooperative Bank Account:
              </span>
              <span>
                {cooperativeSettings.bankName} • Account: {cooperativeSettings.bankAccountNumber} (
                {cooperativeSettings.bankAccountName})
              </span>
            </div>
          </Card>

          {/* Receipt Proof Document Box */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-200 dark:border-darkSurface-border">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Uploaded Transfer Evidence
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(true)}
                  className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Inspect Slip (Lightbox)
                </button>
              </div>
            </div>

            <div
              onClick={() => setReceiptModalOpen(true)}
              className="p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  SLIP
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-surface-900 dark:text-white truncate">
                    payment_proof_{contribution.transferReference}.png
                  </p>
                  <p className="text-[11px] text-surface-500 dark:text-slate-400">
                    Click to zoom, rotate 90°, and inspect NIP reference
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/60 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 shrink-0">
                Tap to Inspect Full Slip
              </span>
            </div>
          </Card>
        </div>

        {/* Right: Verification Status & Ledger Safeguard */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
              Ledger Reconciliation Status
            </h3>

            {status === 'approved' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" /> Posted to Financial Ledger
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Approved by {contribution.verifiedBy} on{' '}
                    {contribution.verifiedAt ? formatDateTime(contribution.verifiedAt) : 'N/A'}.
                  </p>
                  {contribution.remarks && (
                    <p className="text-[11px] text-emerald-800 font-medium pt-1">
                      Note: &quot;{contribution.remarks}&quot;
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-xs space-y-1">
                  <span className="text-surface-400 block text-[10px] uppercase font-bold">
                    Ledger Transaction Link
                  </span>
                  <span className="font-mono text-surface-800 font-semibold block">
                    {existingLedgerTxn ? existingLedgerTxn.ref : 'TXN-RECORDED'}
                  </span>
                  <span className="text-[10px] text-surface-400 block">
                    Financial approval posts exactly once to prevent double-crediting.
                  </span>
                </div>
              </div>
            ) : status === 'rejected' ? (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-red-800">
                  <XCircle className="h-4 w-4" /> Rejected Submission
                </p>
                <p className="text-[11px] text-red-700">
                  Rejected by {contribution.verifiedBy || currentAdmin.fullName}.
                </p>
                <p className="text-[11px] text-red-800 font-medium pt-1">
                  Reason: &quot;{contribution.remarks || rejectReason}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pending Administrator Action</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      This contribution has NOT been credited to the member&apos;s savings balance.
                      Verify the transfer in your bank portal before confirming approval.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="adminRemarks" className="label text-xs">
                    Verification Remarks <span className="text-surface-400">(optional)</span>
                  </label>
                  <input
                    id="adminRemarks"
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Matched statement line item #402"
                    className="input-field text-xs"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Core financial rule reminder */}
          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Non-Negotiable Financial Rule
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Pending or rejected submissions NEVER alter member balances. Once approved, the system
              creates an immutable journal entry. Subsequent balance queries derive strictly from
              ledger rows.
            </p>
          </div>
        </div>
      </div>

      {/* CONFIRM APPROVAL MODAL */}
      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Contribution and Post to Ledger?"
        message={`Are you sure you want to approve this ${contribution.type} savings contribution of ${formatCurrency(
          contribution.amount
        )} for ${contribution.memberName}? This will post a permanent credit entry to the financial ledger.`}
        confirmLabel={actionLoading ? 'Posting...' : 'Confirm Approval & Post'}
        variant="accent"
        onConfirm={handleApprove}
        onCancel={() => setApproveDialogOpen(false)}
      />

      {/* CONFIRM REJECTION MODAL */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setRejectDialogOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-modal border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Reject Payment Submission</h3>
            <p className="text-xs text-surface-500 mt-1">
              Please specify the exact reason for rejecting this submission. This note will be visible
              to the member.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="rejectReason" className="label text-xs">
                  Rejection Reason (Required)
                </label>
                <textarea
                  id="rejectReason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Bank statement does not reflect transfer reference. Amount discrepancy."
                  className="input-field text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-surface-200">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setRejectDialogOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="btn-danger text-xs inline-flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Receipt Viewer */}
      <ReceiptPreviewModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Verified Member Bank Slip"
        reference={contribution.transferReference}
        amount={formatCurrency(contribution.amount)}
        senderName={contribution.memberName}
        date={formatDate(contribution.paymentDate)}
      />
    </div>
  );
}
