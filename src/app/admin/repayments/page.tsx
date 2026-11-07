'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import {
  repayments,
  loans,
  transactions,
  auditLog,
  currentAdmin,
} from '@/lib/mock-data';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Badge,
  SearchInput,
  Select,
  Pagination,
  Tabs,
  EmptyState,
  ConfirmDialog,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { Repayment, RepaymentStatus, Transaction, AuditEntry } from '@/lib/types';

export default function AdminRepaymentsPage() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Review modal state
  const [reviewRepayment, setReviewRepayment] = useState<Repayment | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = 8;

  const filteredRepayments = useMemo(() => {
    return repayments.filter((r) => {
      const matchesSearch =
        r.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.loanRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.transferReference.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === 'all' || r.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredRepayments.length / pageSize);
  const paginatedData = filteredRepayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = repayments.filter((r) => r.status === 'pending').length;
  const approvedCount = repayments.filter((r) => r.status === 'approved').length;
  const rejectedCount = repayments.filter((r) => r.status === 'rejected').length;

  const totalApprovedRepaid = repayments
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleApprove = () => {
    if (!reviewRepayment) return;
    setActionLoading(true);

    setTimeout(() => {
      // 1. Update repayment status
      reviewRepayment.status = 'approved';
      reviewRepayment.verifiedBy = currentAdmin.fullName;
      reviewRepayment.verifiedAt = new Date().toISOString();
      reviewRepayment.remarks = reviewRemarks || 'Bank transfer verified against loan account.';

      // 2. Reduce outstanding principal on related loan
      const targetLoan = loans.find((l) => l.id === reviewRepayment.loanId);
      if (targetLoan) {
        targetLoan.outstandingPrincipal = Math.max(
          0,
          targetLoan.outstandingPrincipal - reviewRepayment.principalComponent
        );
        if (targetLoan.outstandingPrincipal === 0) {
          targetLoan.status = 'repaid';
          targetLoan.completionDate = new Date().toISOString();
        }
      }

      // 3. Post to financial ledger
      const newTxn: Transaction = {
        id: `txn_${Date.now()}`,
        ref: generateRef('TXN'),
        memberId: reviewRepayment.memberId,
        memberName: reviewRepayment.memberName,
        type: 'loan_repayment',
        category: 'loan',
        description: `Loan repayment installment for ${reviewRepayment.loanRef}`,
        credit: 0,
        debit: reviewRepayment.principalComponent,
        currency: 'NGN',
        relatedRef: reviewRepayment.ref,
        sourceRef: reviewRepayment.transferReference,
        date: new Date().toISOString(),
        status: 'posted',
      };
      transactions.unshift(newTxn);

      // 4. Log in audit trail
      const audit: AuditEntry = {
        id: `aud_${Date.now()}`,
        performedBy: currentAdmin.id,
        performedByName: currentAdmin.fullName,
        action: 'repayment.approved',
        targetType: 'repayment',
        targetId: reviewRepayment.id,
        targetRef: reviewRepayment.ref,
        details: `Approved loan repayment of ₦${reviewRepayment.amount.toLocaleString()} from ${
          reviewRepayment.memberName
        }`,
        timestamp: new Date().toISOString(),
      };
      auditLog.unshift(audit);

      setActionLoading(false);
      setApproveModalOpen(false);
      setReviewRepayment(null);
      addToast(
        'success',
        'Repayment Verified',
        `Installment of ${formatCurrency(reviewRepayment.amount)} verified and deducted from loan balance.`
      );
    }, 1200);
  };

  const handleReject = () => {
    if (!reviewRepayment) return;
    if (!rejectReason.trim()) {
      addToast('error', 'Reason Required', 'Please specify why this repayment is rejected.');
      return;
    }

    setActionLoading(true);

    setTimeout(() => {
      reviewRepayment.status = 'rejected';
      reviewRepayment.verifiedBy = currentAdmin.fullName;
      reviewRepayment.verifiedAt = new Date().toISOString();
      reviewRepayment.remarks = rejectReason.trim();

      const audit: AuditEntry = {
        id: `aud_${Date.now()}`,
        performedBy: currentAdmin.id,
        performedByName: currentAdmin.fullName,
        action: 'repayment.rejected',
        targetType: 'repayment',
        targetId: reviewRepayment.id,
        targetRef: reviewRepayment.ref,
        details: `Rejected loan repayment ${reviewRepayment.ref} from ${reviewRepayment.memberName}: ${rejectReason.trim()}`,
        timestamp: new Date().toISOString(),
      };
      auditLog.unshift(audit);

      setActionLoading(false);
      setRejectModalOpen(false);
      setReviewRepayment(null);
      addToast('warning', 'Repayment Rejected', 'Repayment submission rejected. No ledger impact.');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repayment Verification Queue"
        description="Verify member installment transfers against bank records. Verified repayments reduce outstanding loan principal directly."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Verification"
          value={pendingCount.toString()}
          subtitle="Unverified installment receipts"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          className={pendingCount > 0 ? 'border-amber-300 bg-amber-50/20' : ''}
        />
        <StatCard
          title="Total Approved Repayments"
          value={formatCurrency(totalApprovedRepaid)}
          subtitle="Directly amortized from debt"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Rejected Submissions"
          value={rejectedCount.toString()}
          subtitle="Invalid transfer slips"
          icon={<XCircle className="h-5 w-5 text-red-600" />}
        />
      </div>

      {/* Principal-Only Policy Alert */}
      <div className="p-4 rounded-xl bg-surface-100 border border-surface-200 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-brand-800 shrink-0 mt-0.5" />
        <div className="text-xs text-surface-700 leading-relaxed">
          <strong className="text-surface-900">Principal-Only Amortization:</strong> Interest and fee
          components are currently inactive. All approved repayments reduce outstanding loan principal
          by 100% of the verified amount. Overpayments beyond the facility&apos;s outstanding balance
          are strictly disallowed.
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(v) => {
          setActiveTab(v as typeof activeTab);
          setCurrentPage(1);
        }}
        tabs={[
          { label: 'Pending Verification', value: 'pending', count: pendingCount },
          { label: 'Approved Repayments', value: 'approved', count: approvedCount },
          { label: 'Rejected Repayments', value: 'rejected', count: rejectedCount },
          { label: 'All Records', value: 'all', count: repayments.length },
        ]}
      />

      {/* Search */}
      <Card padding="sm">
        <SearchInput
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setCurrentPage(1);
          }}
          placeholder="Search by member name, repayment ref, or loan ID..."
        />
      </Card>

      {/* Repayments Table */}
      <Card padding="none">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="h-8 w-8" />}
            title="No repayment submissions found"
            description="No records match your selected filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Facility Link</th>
                  <th className="table-header">Total Amount</th>
                  <th className="table-header">Principal Component</th>
                  <th className="table-header">Interest / Fees</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {paginatedData.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900">
                      {r.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 block">
                        {r.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 font-mono">
                        {r.transferReference}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-xs text-brand-800">
                      <Link href={`/admin/loans/${r.loanId}`} className="hover:underline">
                        {r.loanRef}
                      </Link>
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="table-cell font-bold text-xs text-emerald-700">
                      {formatCurrency(r.principalComponent)}
                    </td>
                    <td className="table-cell text-xs text-surface-400">₦0.00 / ₦0.00</td>
                    <td className="table-cell text-xs text-surface-600">
                      {formatDate(r.paymentDate)}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setReviewRepayment(r);
                              setRejectModalOpen(true);
                            }}
                            className="btn-danger text-[11px] px-2 py-1"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setReviewRepayment(r);
                              setApproveModalOpen(true);
                            }}
                            className="btn-accent text-[11px] px-2.5 py-1 font-bold"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-surface-400">
                          {r.verifiedBy ? `By ${r.verifiedBy}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* APPROVE REPAYMENT DIALOG */}
      {approveModalOpen && reviewRepayment && (
        <ConfirmDialog
          open={approveModalOpen}
          title="Verify & Post Loan Repayment?"
          message={`Confirm receipt of ${formatCurrency(
            reviewRepayment.amount
          )} from ${reviewRepayment.memberName} for loan ${reviewRepayment.loanRef}. This will reduce outstanding loan principal and post a debit entry to the ledger.`}
          confirmLabel={actionLoading ? 'Posting...' : 'Confirm Repayment'}
          variant="accent"
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />
      )}

      {/* REJECT REPAYMENT MODAL */}
      {rejectModalOpen && reviewRepayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setRejectModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-modal border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Reject Repayment Submission</h3>
            <p className="text-xs text-surface-500 mt-1">
              Provide an administrative reason for declining this repayment proof.
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
                  placeholder="e.g. Bank statement does not reflect transfer session ID."
                  className="input-field text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 mt-4">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setRejectModalOpen(false)}
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
    </div>
  );
}
