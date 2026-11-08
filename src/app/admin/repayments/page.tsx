'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { approveRepaymentAction, rejectRepaymentAction } from '@/app/actions/repayments';

export default function AdminRepaymentsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [repaymentsList, setRepaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Review modal state
  const [reviewRepayment, setReviewRepayment] = useState<any | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = 8;

  const loadRepayments = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('repayments')
        .select('*, profiles:member_id(full_name, member_ref), loans:loan_id(ref)')
        .order('submission_date', { ascending: false });

      if (!error && data) {
        setRepaymentsList(
          data.map((r) => ({
            id: r.id,
            ref: r.ref,
            loanId: r.loan_id,
            loanRef: r.loans?.ref || 'Loan',
            memberId: r.member_id,
            memberName: r.profiles?.full_name || 'Member',
            memberRef: r.profiles?.member_ref || 'Pending',
            amount: Number(r.amount),
            principalComponent: Number(r.principal_component || r.amount),
            paymentDate: r.payment_date,
            submissionDate: r.submission_date,
            transferReference: r.transfer_reference || r.ref,
            status: r.status,
            receiptUrl: r.receipt_url,
            remarks: r.remarks,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching admin repayments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepayments();
  }, [user]);

  const filteredRepayments = useMemo(() => {
    return repaymentsList.filter((r) => {
      const matchesSearch =
        (r.ref && r.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.memberName && r.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.loanRef && r.loanRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.transferReference && r.transferReference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTab = activeTab === 'all' || r.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [repaymentsList, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredRepayments.length / pageSize) || 1;
  const paginatedData = filteredRepayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = repaymentsList.filter((r) => r.status === 'pending').length;
  const approvedCount = repaymentsList.filter((r) => r.status === 'approved').length;
  const rejectedCount = repaymentsList.filter((r) => r.status === 'rejected').length;

  const totalApprovedRepaid = repaymentsList
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleApprove = async () => {
    if (!reviewRepayment) return;
    setActionLoading(true);
    try {
      const res = await approveRepaymentAction(reviewRepayment.id, reviewRemarks);
      if (res.success) {
        setApproveModalOpen(false);
        setReviewRepayment(null);
        addToast(
          'success',
          'Repayment Approved & Posted',
          `Payment ${reviewRepayment.ref} has been approved and loan balance amortized.`
        );
        await loadRepayments();
      } else {
        addToast('error', 'Approval Error', res.error || 'Failed to approve repayment');
      }
    } catch (err: any) {
      addToast('error', 'Action Error', err?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewRepayment || !rejectReason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a reason for rejecting this repayment proof.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await rejectRepaymentAction(reviewRepayment.id, rejectReason.trim());
      if (res.success) {
        setRejectModalOpen(false);
        setReviewRepayment(null);
        addToast('info', 'Repayment Rejected', `Installment ${reviewRepayment.ref} was marked as rejected.`);
        await loadRepayments();
      } else {
        addToast('error', 'Rejection Error', res.error || 'Failed to reject repayment');
      }
    } catch (err: any) {
      addToast('error', 'Action Error', err?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Repayment Management"
        description="Verify member repayment installments and amortize active loan principal balances."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Bank Reconciliation"
          value={pendingCount.toString()}
          subtitle="Installments awaiting verification"
          icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={pendingCount > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20' : ''}
        />
        <StatCard
          title="Verified Settlements"
          value={approvedCount.toString()}
          subtitle="Credited to loan accounts"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Total Principal Recovered"
          value={formatCurrency(totalApprovedRepaid)}
          subtitle="Lifetime amortization total"
          icon={<Landmark className="h-5 w-5 text-brand-900 dark:text-sky-400" />}
        />
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
          { label: 'Approved Entries', value: 'approved', count: approvedCount },
          { label: 'Rejected Proofs', value: 'rejected', count: rejectedCount },
          { label: 'All Submissions', value: 'all', count: repaymentsList.length },
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
          placeholder="Search by repayment ref, member name, loan code, or bank session ID..."
        />
      </Card>

      {/* Repayments Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading loan repayment entries...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="h-8 w-8" />}
            title="No repayment entries found"
            description="No records match your selected filter or search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Target Facility</th>
                  <th className="table-header">Amount Paid</th>
                  <th className="table-header">Transfer Date</th>
                  <th className="table-header">Bank Reference</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                      {r.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 dark:text-white block">
                        {r.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 dark:text-slate-400 font-mono">
                        Ref: {r.memberRef}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-xs text-brand-900 dark:text-sky-400 font-semibold">
                      {r.loanRef}
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900 dark:text-white">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">
                      {formatDate(r.paymentDate)}
                    </td>
                    <td className="table-cell font-mono text-xs text-surface-600 dark:text-slate-400">
                      {r.transferReference}
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
                              setRejectReason('');
                              setRejectModalOpen(true);
                            }}
                            className="btn-danger text-xs px-2.5 py-1"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setReviewRepayment(r);
                              setReviewRemarks('');
                              setApproveModalOpen(true);
                            }}
                            className="btn-accent text-xs px-3 py-1 font-bold inline-flex items-center gap-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Verify & Post
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-surface-400 dark:text-slate-500 font-medium">Reconciled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredRepayments.length > pageSize && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Approve Dialog */}
      {reviewRepayment && (
        <ConfirmDialog
          open={approveModalOpen}
          title="Approve Loan Repayment"
          message={`Confirm verification of ₦${reviewRepayment.amount.toLocaleString()} for loan ${reviewRepayment.loanRef}? This will permanently credit the society ledger and reduce the member's outstanding loan principal.`}
          confirmLabel={actionLoading ? 'Posting...' : 'Approve & Amortize'}
          variant="accent"
          onConfirm={handleApprove}
          onCancel={() => {
            setApproveModalOpen(false);
            setReviewRepayment(null);
          }}
        />
      )}

      {/* Reject Dialog */}
      {reviewRepayment && (
        <ConfirmDialog
          open={rejectModalOpen}
          title="Reject Repayment Proof"
          message="Please state why this repayment is rejected (e.g. transfer not received on bank statement)."
          confirmLabel={actionLoading ? 'Rejecting...' : 'Reject Proof'}
          variant="danger"
          onConfirm={handleReject}
          onCancel={() => {
            setRejectModalOpen(false);
            setReviewRepayment(null);
          }}
        >
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Document rejection reason for audit log..."
            className="input-field text-xs mt-2"
            required
          />
        </ConfirmDialog>
      )}
    </div>
  );
}
