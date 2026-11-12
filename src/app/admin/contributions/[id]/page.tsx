'use client';

import React, { use, useState, useEffect } from 'react';
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
  Eye,
} from 'lucide-react';
import { Card, PageHeader, StatusBadge, Badge, ConfirmDialog, InfoTooltip } from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ReceiptPreviewModal } from '@/components/ui/receipt-modal';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { approveContributionAction, rejectContributionAction } from '@/app/actions/contributions';
import type { ContributionStatus } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const cooperativeBankFallback = {
  bankName: 'First Bank of Nigeria',
  bankAccountNumber: '1012345678',
  bankAccountName: 'DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD',
};

export default function AdminContributionReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const contributionId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [contribution, setContribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingLedgerTxn, setExistingLedgerTxn] = useState<any>(null);

  const [remarks, setRemarks] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contributions')
          .select('*, profiles:member_id(full_name, member_ref, email, phone)')
          .eq('id', contributionId)
          .maybeSingle();

        if (data) {
          setContribution({
            id: data.id,
            ref: data.ref,
            memberId: data.member_id,
            memberName: data.profiles?.full_name || data.sender_name || 'Member',
            memberRef: data.profiles?.member_ref || 'Pending',
            amount: Number(data.amount),
            type: data.type,
            status: data.status,
            paymentDate: data.payment_date,
            submissionDate: data.submission_date,
            transferReference: data.transfer_reference || data.ref,
            receiptUrl: data.receipt_url,
            remarks: data.remarks || '',
            verifiedAt: data.verified_at,
          });
          setRemarks(data.remarks || '');

          // Check if already posted to transactions ledger
          const { data: txn } = await supabase
            .from('transactions')
            .select('*')
            .eq('related_ref', data.ref)
            .maybeSingle();
          if (txn) setExistingLedgerTxn(txn);
        }
      } catch (err) {
        console.error('Error loading contribution review:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [user, contributionId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await approveContributionAction(contributionId, remarks);
      if (res.success) {
        setContribution((prev: any) => ({ ...prev, status: 'approved' }));
        setApproveDialogOpen(false);
        addToast(
          'success',
          'Payment Approved & Posted',
          `Contribution ${contribution.ref} has been approved and permanently credited to member ledger.`
        );
      } else {
        addToast('error', 'Approval Error', res.error || 'Failed to approve contribution');
      }
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      addToast('error', 'Reason Required', 'You must provide a reason for rejecting this payment.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await rejectContributionAction(contributionId, rejectReason.trim());
      if (res.success) {
        setContribution((prev: any) => ({ ...prev, status: 'rejected' }));
        setRejectDialogOpen(false);
        addToast(
          'info',
          'Contribution Rejected',
          `Submission ${contribution.ref} marked as rejected. No balance added.`
        );
      } else {
        addToast('error', 'Rejection Error', res.error || 'Failed to reject contribution');
      }
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-surface-400">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        <p className="text-xs">Loading contribution evidence...</p>
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="py-12 text-center space-y-4">
        <HandCoins className="h-12 w-12 text-surface-300 dark:text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">Contribution Record Not Found</h2>
        <p className="text-xs text-surface-500 dark:text-slate-400 max-w-sm mx-auto">
          The requested payment verification record does not exist.
        </p>
        <Link href="/admin/contributions" className="btn-primary text-xs inline-flex">
          Back to Contributions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/contributions" className="btn-ghost p-2 text-surface-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-surface-900 dark:text-white">
                Reconcile Contribution {contribution.ref}
              </h1>
              <StatusBadge status={contribution.status} />
            </div>
            <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">
              Submitted on {formatDateTime(contribution.submissionDate || contribution.paymentDate)}
            </p>
          </div>
        </div>

        {contribution.status === 'pending' && (
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
            <h2 className="text-sm font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-darkSurface-border">
              Payment Evidence Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Member Name</span>
                <span className="font-semibold text-surface-900 dark:text-white">{contribution.memberName}</span>
              </div>
              <div>
                <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Member ID</span>
                <span className="font-mono text-surface-700 dark:text-slate-300">{contribution.memberRef}</span>
              </div>
              <div>
                <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Savings Category</span>
                <span className="font-semibold text-surface-900 dark:text-white capitalize">
                  {contribution.type} Savings
                </span>
              </div>
              <div>
                <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Claimed Amount</span>
                <span className="font-bold text-base text-brand-900 dark:text-emerald-400">
                  {formatCurrency(contribution.amount)}
                </span>
              </div>
              <div>
                <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Payment / Transfer Date</span>
                <span className="font-medium text-surface-800 dark:text-slate-200">
                  {formatDate(contribution.paymentDate)}
                </span>
              </div>
              <div>
                <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Bank Transfer Session ID / Ref</span>
                <span className="font-mono font-bold text-surface-900 dark:text-white bg-surface-100 dark:bg-darkSurface-input px-2 py-0.5 rounded">
                  {contribution.transferReference}
                </span>
              </div>
            </div>

            {/* Official receiving bank account reference */}
            <div className="p-3.5 rounded-xl bg-surface-100 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border text-xs text-surface-600 dark:text-slate-300">
              <span className="font-bold text-surface-800 dark:text-white block mb-1">
                Designated Cooperative Bank Account:
              </span>
              <span>
                {cooperativeBankFallback.bankName} • Account: {cooperativeBankFallback.bankAccountNumber} (
                {cooperativeBankFallback.bankAccountName})
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
              {contribution.receiptUrl && (
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(true)}
                  className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Inspect Slip (Lightbox)
                </button>
              )}
            </div>

            {contribution.receiptUrl ? (
              <div
                onClick={() => setReceiptModalOpen(true)}
                className="p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    SLIP
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-surface-900 dark:text-white truncate">
                      Proof of Transfer Attached
                    </p>
                    <p className="text-[11px] text-surface-500 dark:text-slate-400">
                      Click to inspect receipt in high resolution modal
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-surface-400 py-3">No receipt image uploaded with this submission.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Ledger Posting Status */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              General Ledger Status
            </h3>

            {existingLedgerTxn ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Posted to Ledger</span>
                <p className="text-emerald-700 dark:text-emerald-400 font-mono">Ref: {existingLedgerTxn.ref}</p>
                <p className="text-surface-600 dark:text-slate-400 text-[11px]">
                  Posted on {formatDateTime(existingLedgerTxn.posting_date)}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-surface-100 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border text-xs text-surface-600 dark:text-slate-400 space-y-1">
                <span className="font-semibold text-surface-800 dark:text-slate-200 block">Not Posted to Ledger</span>
                <p className="text-[11px]">
                  Funds will be credited to member balance once approved by an administrator.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Lightbox Modal */}
      {contribution.receiptUrl && (
        <ReceiptPreviewModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          imageUrl={contribution.receiptUrl}
          reference={contribution.transferReference}
          senderName={contribution.memberName}
          amount={formatCurrency(contribution.amount)}
          date={formatDate(contribution.paymentDate)}
        />
      )}

      {/* Approve Dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Contribution Payment"
        message={`Are you sure you want to approve this ₦${contribution.amount.toLocaleString()} ${contribution.type} savings payment? This will write an immutable credit to the financial ledger.`}
        confirmLabel={actionLoading ? 'Posting...' : 'Approve & Post'}
        variant="accent"
        onConfirm={handleApprove}
        onCancel={() => setApproveDialogOpen(false)}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        title="Reject Contribution Payment"
        message="Please document why this payment is being rejected. This reason will be logged for financial audit compliance."
        confirmLabel={actionLoading ? 'Rejecting...' : 'Reject Submission'}
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setRejectDialogOpen(false)}
      >
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Bank statement does not reflect payment; mismatched sender account name..."
          className="input-field text-xs mt-2"
          required
        />
      </ConfirmDialog>
    </div>
  );
}
