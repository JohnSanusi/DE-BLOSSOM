'use client';

import React, { useState, useMemo } from 'react';
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
  loanApplications,
  loans,
  getMemberSavings,
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
import { formatCurrency, formatDate, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { LoanApplication, Loan, LoanApplicationStatus, AuditEntry } from '@/lib/types';

export default function AdminLoanApplicationsPage() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Review modal state
  const [reviewApp, setReviewApp] = useState<LoanApplication | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'under_review' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = 8;

  const filteredApps = useMemo(() => {
    return loanApplications.filter((app) => {
      const matchesSearch =
        app.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.purpose.toLowerCase().includes(searchTerm.toLowerCase());

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
  }, [searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredApps.length / pageSize);
  const paginatedData = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = loanApplications.filter(
    (la) => la.status === 'pending' || la.status === 'under_review'
  ).length;
  const approvedCount = loanApplications.filter((la) => la.status === 'approved').length;
  const rejectedCount = loanApplications.filter((la) => la.status === 'rejected').length;

  const openReviewModal = (app: LoanApplication) => {
    setReviewApp(app);
    setApprovedAmount(app.approvedAmount?.toString() || app.requestedAmount.toString());
    setReviewRemarks(app.remarks || '');
    setReviewAction(null);
  };

  const handleDecision = (decision: 'approve' | 'reject' | 'under_review') => {
    if (!reviewApp) return;

    if (decision === 'reject' && !reviewRemarks.trim()) {
      addToast('error', 'Reason Required', 'Please provide a formal reason for rejection.');
      return;
    }

    const appAmt = parseFloat(approvedAmount);
    if (decision === 'approve' && (isNaN(appAmt) || appAmt <= 0)) {
      addToast('error', 'Invalid Amount', 'Please set an approved principal amount.');
      return;
    }

    setActionLoading(true);

    setTimeout(() => {
      reviewApp.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : decision;
      reviewApp.reviewedBy = currentAdmin.fullName;
      reviewApp.reviewedAt = new Date().toISOString();
      reviewApp.remarks = reviewRemarks.trim();

      if (decision === 'approve') {
        reviewApp.approvedAmount = appAmt;

        // Create approved loan record (Status: 'approved' - NOT YET DISBURSED!)
        const newLoan: Loan = {
          id: `ln_${Date.now()}`,
          ref: generateRef('LN'),
          applicationId: reviewApp.id,
          memberId: reviewApp.memberId,
          memberName: reviewApp.memberName,
          principalAmount: appAmt,
          disbursedAmount: 0,
          outstandingPrincipal: appAmt,
          purpose: reviewApp.purpose,
          status: 'approved',
          approvalDate: new Date().toISOString(),
          remarks: reviewRemarks.trim(),
        };
        loans.unshift(newLoan);
      }

      // Log audit
      const audit: AuditEntry = {
        id: `aud_${Date.now()}`,
        performedBy: currentAdmin.id,
        performedByName: currentAdmin.fullName,
        action: `loan_application.${decision}`,
        targetType: 'loan_application',
        targetId: reviewApp.id,
        targetRef: reviewApp.ref,
        details: `${decision.toUpperCase()} loan application for ${reviewApp.memberName} (₦${
          decision === 'approve' ? appAmt.toLocaleString() : reviewApp.requestedAmount.toLocaleString()
        })`,
        timestamp: new Date().toISOString(),
      };
      auditLog.unshift(audit);

      setActionLoading(false);
      setReviewApp(null);
      addToast(
        decision === 'approve' ? 'success' : decision === 'reject' ? 'warning' : 'info',
        `Application ${decision.toUpperCase()}`,
        decision === 'approve'
          ? 'Loan approved! Note: Loan disbursement is a separate administrator step.'
          : 'Decision recorded successfully.'
      );
    }, 1200);
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
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          className={pendingCount > 0 ? 'border-amber-300 bg-amber-50/20' : ''}
        />
        <StatCard
          title="Approved Facilities"
          value={approvedCount.toString()}
          subtitle="Passed committee review"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Declined Applications"
          value={rejectedCount.toString()}
          subtitle="Did not meet criteria"
          icon={<XCircle className="h-5 w-5 text-red-600" />}
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
          { label: 'All Applications', value: 'all', count: loanApplications.length },
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
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No loan applications found"
            description="No applications match the current filter or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
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
              <tbody className="divide-y divide-surface-100">
                {paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900">
                      {app.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 block">
                        {app.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 font-mono">
                        {app.memberId}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-surface-600">
                      {formatDate(app.applicationDate)}
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900">
                      {formatCurrency(app.requestedAmount)}
                    </td>
                    <td className="table-cell text-xs text-surface-600">
                      {app.repaymentDuration} months
                    </td>
                    <td className="table-cell text-xs text-surface-700 max-w-xs truncate">
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

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* DEDICATED LOAN REVIEW MODAL */}
      {reviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setReviewApp(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-7 shadow-modal border border-surface-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-surface-400">
                  Credit Committee Assessment
                </span>
                <h3 className="text-base font-bold text-surface-900 font-mono">
                  {reviewApp.ref} — {reviewApp.memberName}
                </h3>
              </div>
              <StatusBadge status={reviewApp.status} />
            </div>

            {/* Applicant Financial Record Snapshot */}
            {(() => {
              const memSavings = getMemberSavings(reviewApp.memberId);
              return (
                <div className="mt-4 p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                  <span className="text-[11px] font-bold text-surface-500 uppercase tracking-wider block">
                    Applicant Cooperative Savings Health
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-surface-400 block text-[10px]">Regular Savings</span>
                      <span className="font-bold text-brand-900">
                        {formatCurrency(memSavings.regularSavings)}
                      </span>
                    </div>
                    <div>
                      <span className="text-surface-400 block text-[10px]">Special Savings</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(memSavings.specialSavings)}
                      </span>
                    </div>
                    <div>
                      <span className="text-surface-400 block text-[10px]">Total Savings</span>
                      <span className="font-bold text-surface-900">
                        {formatCurrency(memSavings.totalSavings)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Application Details */}
            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-surface-400 block text-[11px]">Requested Principal</span>
                  <span className="font-bold text-sm text-surface-900">
                    {formatCurrency(reviewApp.requestedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[11px]">Tenure</span>
                  <span className="font-medium text-surface-800">
                    {reviewApp.repaymentDuration} months
                  </span>
                </div>
              </div>

              <div>
                <span className="text-surface-400 block text-[11px]">Purpose</span>
                <p className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-surface-700">
                  {reviewApp.purpose}
                </p>
              </div>

              {reviewApp.additionalInfo && (
                <div>
                  <span className="text-surface-400 block text-[11px]">Additional Information</span>
                  <p className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-surface-700">
                    {reviewApp.additionalInfo}
                  </p>
                </div>
              )}
            </div>

            {/* Decision Controls (if pending or under_review) */}
            {(reviewApp.status === 'pending' || reviewApp.status === 'under_review') && (
              <div className="mt-5 pt-4 border-t border-surface-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="approvedAmt" className="label text-xs">
                      Approved Principal Amount (₦)
                    </label>
                    <input
                      id="approvedAmt"
                      type="number"
                      step="5000"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="input-field text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="commRemarks" className="label text-xs">
                      Committee Remarks / Conditions
                    </label>
                    <input
                      id="commRemarks"
                      type="text"
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      placeholder="e.g. Approved based on consistent 6-month equity."
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleDecision('under_review')}
                    className="btn-secondary text-xs"
                  >
                    Mark Under Review
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleDecision('reject')}
                    className="btn-danger text-xs"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleDecision('approve')}
                    className="btn-accent text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      'Approve Loan Facility'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Close button if already finalized */}
            {reviewApp.status !== 'pending' && reviewApp.status !== 'under_review' && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReviewApp(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
