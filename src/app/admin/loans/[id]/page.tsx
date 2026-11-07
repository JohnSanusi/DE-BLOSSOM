'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Landmark,
  PiggyBank,
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  DollarSign,
  ShieldCheck,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  loans,
  repayments,
  loanApplications,
  getMemberSavings,
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
  ConfirmDialog,
  InfoTooltip,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { Loan, LoanStatus, Transaction, AuditEntry } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminLoanDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const loanId = resolvedParams.id;
  const router = useRouter();
  const { addToast } = useToast();

  const loan = loans.find((l) => l.id === loanId);
  const [currentLoanStatus, setCurrentLoanStatus] = useState<LoanStatus>(
    loan ? loan.status : 'approved'
  );
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  if (!loan) {
    return (
      <div className="py-12 text-center space-y-4">
        <Landmark className="h-12 w-12 text-surface-300 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900">Loan Facility Not Found</h2>
        <p className="text-xs text-surface-500 max-w-sm mx-auto">
          The requested loan record does not exist in the administrative ledger.
        </p>
        <Link href="/admin/loans" className="btn-primary text-xs inline-flex">
          Back to Loans
        </Link>
      </div>
    );
  }

  const memberSavings = getMemberSavings(loan.memberId);
  const loanRepayments = repayments.filter((r) => r.loanId === loan.id);
  const relatedAuditEntries = auditLog.filter(
    (a) => a.targetId === loan.id || a.targetId === loan.applicationId
  );

  const handleDisburseLoan = () => {
    setDisbursing(true);

    setTimeout(() => {
      // 1. Update loan record
      loan.status = 'disbursed';
      loan.disbursedAmount = loan.principalAmount;
      loan.disbursementDate = new Date().toISOString();
      loan.disbursedBy = currentAdmin.fullName;

      // 2. Post disbursement transaction to the financial ledger
      const newTxn: Transaction = {
        id: `txn_${Date.now()}`,
        ref: generateRef('TXN'),
        memberId: loan.memberId,
        memberName: loan.memberName,
        type: 'loan_disbursement',
        category: 'loan',
        description: `Loan disbursement for ${loan.purpose}`,
        credit: loan.principalAmount,
        debit: 0,
        currency: 'NGN',
        relatedRef: loan.ref,
        sourceRef: `DISB-${loan.ref}`,
        date: new Date().toISOString(),
        status: 'posted',
      };
      transactions.unshift(newTxn);

      // 3. Record in audit trail
      const audit: AuditEntry = {
        id: `aud_${Date.now()}`,
        performedBy: currentAdmin.id,
        performedByName: currentAdmin.fullName,
        action: 'loan.disbursed',
        targetType: 'loan',
        targetId: loan.id,
        targetRef: loan.ref,
        details: `Disbursed ₦${loan.principalAmount.toLocaleString()} to ${
          loan.memberName
        } via cooperative bank transfer`,
        timestamp: new Date().toISOString(),
      };
      auditLog.unshift(audit);

      setCurrentLoanStatus('disbursed');
      setDisbursing(false);
      setDisburseModalOpen(false);

      addToast(
        'success',
        'Loan Disbursed & Posted',
        `₦${loan.principalAmount.toLocaleString()} disbursed to ${
          loan.memberName
        }. Outflow registered in the official ledger.`
      );
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header and Disburse action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/loans" className="btn-ghost p-2 text-surface-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 font-mono">
                {loan.ref}
              </h1>
              <StatusBadge status={currentLoanStatus} />
            </div>
            <p className="text-xs text-surface-500 mt-0.5">
              Borrower: <strong className="text-surface-900">{loan.memberName}</strong> (ID: {loan.memberId})
            </p>
          </div>
        </div>

        {/* Separate Disbursement Trigger */}
        {currentLoanStatus === 'approved' && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setDisburseModalOpen(true)}
              className="btn-accent text-xs px-4 py-2 font-bold shadow-sm inline-flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Disburse Loan Funds
            </button>
            <InfoTooltip content="Record Bank Outflow: Click this ONLY after executing the transfer to the member from your corporate banking portal. This registers the debit outflow in the official financial ledger." />
          </div>
        )}
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Principal Facility"
          value={formatCurrency(loan.principalAmount)}
          subtitle="Approved principal"
          icon={<Landmark className="h-5 w-5 text-brand-900" />}
        />
        <StatCard
          title="Disbursed to Member"
          value={formatCurrency(loan.disbursedAmount)}
          subtitle={loan.disbursedAmount > 0 ? 'Transferred to account' : 'Awaiting payout'}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Outstanding Principal"
          value={formatCurrency(loan.outstandingPrincipal)}
          subtitle="Current debtor liability"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          className={loan.outstandingPrincipal > 0 ? 'border-amber-200' : ''}
        />
        <StatCard
          title="Total Principal Repaid"
          value={formatCurrency(
            loanRepayments
              .filter((r) => r.status === 'approved')
              .reduce((sum, r) => sum + r.principalComponent, 0)
          )}
          subtitle="Verified settlements"
          icon={<CheckCircle className="h-5 w-5 text-brand-700" />}
        />
      </div>

      {/* Two columns: Details & Applicant Savings Record */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h2 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
            Loan Facility Specification & Audit Records
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-surface-400 block text-[11px]">Facility Reference</span>
              <span className="font-mono font-bold text-surface-900">{loan.ref}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Related Application</span>
              <span className="font-mono text-surface-700">{loan.applicationId}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Approval Date</span>
              <span className="text-surface-700">{formatDateTime(loan.approvalDate)}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursement Date</span>
              <span className="text-surface-700">
                {loan.disbursementDate ? formatDateTime(loan.disbursementDate) : 'Pending Disbursement'}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursing Officer</span>
              <span className="text-surface-700">{loan.disbursedBy || 'Pending'}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Applied Interest Formula</span>
              <span className="font-semibold text-brand-900">Principal-Only (Zero Interest Mode)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-200/60">
            <span className="text-[11px] text-surface-400 block">Stated Loan Purpose</span>
            <p className="text-xs text-surface-700 mt-1 leading-relaxed bg-surface-50 p-3 rounded-lg border border-surface-200">
              {loan.purpose}
            </p>
          </div>
        </div>

        {/* Member Savings Overview */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200 flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-brand-900" />
            Borrower Equity Standing
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-50 rounded-lg border border-surface-200 flex items-center justify-between">
              <span className="text-surface-500">Regular Savings:</span>
              <span className="font-bold text-brand-900">
                {formatCurrency(memberSavings.regularSavings)}
              </span>
            </div>
            <div className="p-3 bg-surface-50 rounded-lg border border-surface-200 flex items-center justify-between">
              <span className="text-surface-500">Special Savings:</span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(memberSavings.specialSavings)}
              </span>
            </div>
            <div className="p-3 bg-surface-50 rounded-lg border border-surface-200 flex items-center justify-between">
              <span className="text-surface-500">Total Savings:</span>
              <span className="font-bold text-surface-900">
                {formatCurrency(memberSavings.totalSavings)}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-surface-400 leading-relaxed">
            Borrower&apos;s regular savings equity serves as the benchmark against default.
          </div>
        </div>
      </div>

      {/* Repayments Ledger Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Facility Repayment Journal</h3>
            <p className="text-xs text-surface-500">
              Principal amortization installments logged against this loan
            </p>
          </div>
          <Link href="/admin/repayments" className="text-xs font-semibold text-brand-800 hover:underline">
            Manage Repayments
          </Link>
        </div>

        {loanRepayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">
            No repayment installments submitted for this facility.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Bank Reference</th>
                  <th className="table-header">Principal Settled</th>
                  <th className="table-header">Interest / Fees</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Verification Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {loanRepayments.map((r) => (
                  <tr key={r.id}>
                    <td className="table-cell font-mono font-bold text-surface-900">{r.ref}</td>
                    <td className="table-cell text-surface-600">{formatDate(r.paymentDate)}</td>
                    <td className="table-cell font-mono text-surface-600">{r.transferReference}</td>
                    <td className="table-cell font-bold text-emerald-700">
                      {formatCurrency(r.principalComponent)}
                    </td>
                    <td className="table-cell text-surface-400">₦0.00 / ₦0.00</td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-surface-500">{r.verifiedBy || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DISBURSEMENT CONFIRMATION MODAL */}
      <ConfirmDialog
        open={disburseModalOpen}
        title="Confirm Formal Loan Disbursement?"
        message={`Are you sure you want to disburse ₦${loan.principalAmount.toLocaleString()} to ${
          loan.memberName
        }? This will transition the facility to DISBURSED and post a debit outflow to the cooperative ledger.`}
        confirmLabel={disbursing ? 'Processing Disbursement...' : 'Confirm Disbursement'}
        variant="accent"
        onConfirm={handleDisburseLoan}
        onCancel={() => setDisburseModalOpen(false)}
      />
    </div>
  );
}
