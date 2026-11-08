'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Landmark,
  PiggyBank,
  AlertCircle,
  Eye,
  ShieldCheck,
  Loader2,
  Calendar,
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { reviewLoanApplicationAction } from '@/app/actions/loans';

export default function AdminLoanApplicationsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Review modal state
  const [reviewApp, setReviewApp] = useState<any | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = 8;

  const loadLoanApplications = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*, profiles:member_id(full_name, member_ref)')
        .order('application_date', { ascending: false });

      if (!error && data) {
        setApplications(
          data.map((a) => ({
            id: a.id,
            ref: a.ref,
            memberId: a.member_id,
            memberName: a.profiles?.full_name || 'Member',
            memberRef: a.profiles?.member_ref || 'Pending',
            requestedAmount: Number(a.requested_amount),
            approvedAmount: a.approved_amount ? Number(a.approved_amount) : Number(a.requested_amount),
            repaymentDuration: a.repayment_duration_months,
            purpose: a.purpose,
            additionalInfo: a.additional_info,
            status: a.status,
            applicationDate: a.application_date,
            reviewRemarks: a.review_remarks,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching loan applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoanApplications();
  }, [user]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        (app.ref && app.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.memberName && app.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.purpose && app.purpose.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesTab = true;
      if (activeTab === 'pending') {
        matchesTab = app.status === 'pending' || app.status === 'under_review';
      } else if (activeTab === 'approved') {
        matchesTab = app.status === 'approved';
      } else if (activeTab === 'rejected') {
        matchesTab = app.status === 'rejected';
      }

      return matchesSearch && matchesTab;
    });
  }, [applications, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredApps.length / pageSize) || 1;
  const paginatedData = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = applications.filter(
    (la) => la.status === 'pending' || la.status === 'under_review'
  ).length;
  const approvedCount = applications.filter((la) => la.status === 'approved').length;
  const rejectedCount = applications.filter((la) => la.status === 'rejected').length;

  const openReviewModal = (app: any) => {
    setReviewApp(app);
    setApprovedAmount(app.approvedAmount?.toString() || app.requestedAmount.toString());
    setReviewRemarks(app.reviewRemarks || '');
  };

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!reviewApp) return;

    if (decision === 'rejected' && !reviewRemarks.trim()) {
      addToast('error', 'Reason Required', 'Please provide a formal reason for rejection.');
      return;
    }

    const appAmt = parseFloat(approvedAmount);
    if (decision === 'approved' && (isNaN(appAmt) || appAmt <= 0)) {
      addToast('error', 'Invalid Amount', 'Please set an approved principal amount.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await reviewLoanApplicationAction(
        reviewApp.id,
        decision,
        reviewRemarks.trim()
      );

      if (res.success) {
        addToast(
          decision === 'approved' ? 'success' : 'info',
          `Application ${decision.toUpperCase()}`,
          decision === 'approved'
            ? 'Loan approved! Note: Loan disbursement is a separate administrator step.'
            : 'Decision recorded successfully.'
        );
        setReviewApp(null);
        await loadLoanApplications();
      } else {
        addToast('error', 'Decision Error', res.error || 'Failed to update application');
      }
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Application Management"
        description="Assess member creditworthiness against verified regular savings equity. Loan approval creates an approved facility awaiting disbursement."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Committee Review"
          value={pendingCount.toString()}
          subtitle="Awaiting decision"
          icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={pendingCount > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20' : ''}
        />
        <StatCard
          title="Approved Facilities"
          value={approvedCount.toString()}
          subtitle="Passed committee review"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Declined Applications"
          value={rejectedCount.toString()}
          subtitle="Did not meet criteria"
          icon={<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
        />
      </div>

      {/* Separation of Approval and Disbursement Notice */}
      <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-darkSurface-card border border-blue-200 dark:border-darkSurface-border flex items-start gap-3 transition-colors">
        <AlertCircle className="h-5 w-5 text-blue-700 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-slate-200 leading-relaxed">
          <strong>Key Financial Workflow Rule:</strong> Approval does not automatically disburse
          funds or alter the ledger. Once approved, the loan must be formally disbursed via the Active
          Loans module by an authorized treasurer or administrator to record the bank outflow.
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
          { label: 'Pending & In Review', value: 'pending', count: pendingCount },
          { label: 'Approved Applications', value: 'approved', count: approvedCount },
          { label: 'Rejected Applications', value: 'rejected', count: rejectedCount },
          { label: 'All Applications', value: 'all', count: applications.length },
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
          placeholder="Search by applicant name, reference code, or stated purpose..."
        />
      </Card>

      {/* Applications Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading loan applications...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No loan applications found"
            description="No applications match the current filter or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Application Ref</th>
                  <th className="table-header">Applicant Member</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Requested</th>
                  <th className="table-header">Duration</th>
                  <th className="table-header">Stated Purpose</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Committee Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                      {app.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 dark:text-white block">
                        {app.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 dark:text-slate-400 font-mono">
                        Ref: {app.memberRef}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">
                      {formatDate(app.applicationDate)}
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900 dark:text-white">
                      {formatCurrency(app.requestedAmount)}
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">
                      {app.repaymentDuration} months
                    </td>
                    <td className="table-cell text-xs text-surface-700 dark:text-slate-300 max-w-xs truncate">
                      {app.purpose}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => openReviewModal(app)}
                        className={`text-xs px-3 py-1 rounded-md font-semibold ${
                          app.status === 'pending' || app.status === 'under_review'
                            ? 'bg-brand-900 hover:bg-brand-800 text-white shadow-sm'
                            : 'btn-secondary'
                        }`}
                      >
                        {app.status === 'pending' || app.status === 'under_review'
                          ? 'Assess'
                          : 'View Record'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredApps.length > pageSize && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* DEDICATED LOAN REVIEW MODAL */}
      {reviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !actionLoading && setReviewApp(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-darkSurface-card p-6 sm:p-7 shadow-modal border border-surface-200 dark:border-darkSurface-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-200 dark:border-darkSurface-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-surface-400 dark:text-slate-400">
                  Credit Committee Assessment
                </span>
                <h3 className="text-base font-bold text-surface-900 dark:text-white font-mono">
                  {reviewApp.ref} — {reviewApp.memberName}
                </h3>
              </div>
              <StatusBadge status={reviewApp.status} />
            </div>

            <div className="mt-4 p-4 rounded-xl bg-surface-50 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-surface-400 dark:text-slate-400 block text-[10px]">Requested Amount</span>
                  <span className="font-bold text-base text-brand-900 dark:text-emerald-400">{formatCurrency(reviewApp.requestedAmount)}</span>
                </div>
                <div>
                  <span className="text-surface-400 dark:text-slate-400 block text-[10px]">Tenure</span>
                  <span className="font-semibold text-surface-900 dark:text-white">{reviewApp.repaymentDuration} Months</span>
                </div>
              </div>
              <div className="pt-2 border-t border-surface-200 dark:border-darkSurface-border">
                <span className="text-surface-400 dark:text-slate-400 block text-[10px]">Purpose</span>
                <p className="text-surface-800 dark:text-slate-200">{reviewApp.purpose}</p>
              </div>
              {reviewApp.additionalInfo && (
                <div className="pt-2 border-t border-surface-200 dark:border-darkSurface-border">
                  <span className="text-surface-400 dark:text-slate-400 block text-[10px]">Additional Notes / Guarantor Details</span>
                  <p className="text-surface-700 dark:text-slate-300">{reviewApp.additionalInfo}</p>
                </div>
              )}
            </div>

            {/* Assessment Input */}
            {reviewApp.status === 'pending' || reviewApp.status === 'under_review' ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="label">Approved Amount (₦)</label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="input-field font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="label">Committee Remarks / Decision Notes</label>
                  <textarea
                    rows={3}
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="Enter approval conditions or rejection grounds..."
                    className="input-field text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-200 dark:border-darkSurface-border">
                  <button
                    disabled={actionLoading}
                    onClick={() => setReviewApp(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleDecision('rejected')}
                    className="btn-danger text-xs"
                  >
                    Decline Request
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleDecision('approved')}
                    className="btn-accent text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve Facility
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <button onClick={() => setReviewApp(null)} className="btn-secondary text-xs">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
