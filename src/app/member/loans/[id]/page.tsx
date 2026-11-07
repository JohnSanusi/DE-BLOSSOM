'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Landmark,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { loans, repayments, loanApplications } from '@/lib/mock-data';
import { Card, PageHeader, StatusBadge, Badge } from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MemberLoanDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const loanId = resolvedParams.id;

  const loan = loans.find((l) => l.id === loanId);
  const application = loan ? loanApplications.find((a) => a.id === loan.applicationId) : null;
  const loanRepayments = loan ? repayments.filter((r) => r.loanId === loan.id) : [];

  if (!loan) {
    return (
      <div className="py-12 text-center space-y-4">
        <Landmark className="h-12 w-12 text-surface-300 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900">Loan Facility Not Found</h2>
        <p className="text-xs text-surface-500 max-w-sm mx-auto">
          The requested loan facility does not exist or you do not have permission to access it.
        </p>
        <Link href="/member/loans" className="btn-primary text-xs inline-flex">
          Return to Loans
        </Link>
      </div>
    );
  }

  const totalRepaid = loanRepayments
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.principalComponent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/member/loans" className="btn-ghost p-2 text-surface-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-surface-900 font-mono">
              {loan.ref}
            </h1>
            <StatusBadge status={loan.status} />
          </div>
          <p className="text-xs text-surface-500 mt-0.5">{loan.purpose}</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-brand-100">
          <span className="text-xs text-surface-500 block">Principal Disbursed</span>
          <span className="text-xl font-bold text-surface-900 block mt-1">
            {formatCurrency(loan.disbursedAmount)}
          </span>
          <span className="text-[11px] text-surface-400 block mt-0.5">Approved loan sum</span>
        </Card>

        <Card className="border-amber-100">
          <span className="text-xs text-surface-500 block">Outstanding Principal</span>
          <span className="text-xl font-bold text-amber-700 block mt-1">
            {formatCurrency(loan.outstandingPrincipal)}
          </span>
          <span className="text-[11px] text-surface-400 block mt-0.5">Remaining to amortize</span>
        </Card>

        <Card className="border-emerald-100">
          <span className="text-xs text-surface-500 block">Principal Repaid</span>
          <span className="text-xl font-bold text-emerald-700 block mt-1">
            {formatCurrency(totalRepaid)}
          </span>
          <span className="text-[11px] text-surface-400 block mt-0.5">Verified settlements</span>
        </Card>

        <Card>
          <span className="text-xs text-surface-500 block">Repayment Progress</span>
          <div className="mt-2 space-y-1">
            <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totalRepaid / (loan.disbursedAmount || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-surface-700 block">
              {Math.min(100, Math.round((totalRepaid / (loan.disbursedAmount || 1)) * 100))}% settled
            </span>
          </div>
        </Card>
      </div>

      {/* Facility Lifecycle & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
            Loan Facility Specification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-surface-400 block text-[11px]">Loan Reference</span>
              <span className="font-mono font-semibold text-surface-900">{loan.ref}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Application Reference</span>
              <span className="font-mono text-surface-700">{loan.applicationId}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Approved Amount</span>
              <span className="font-semibold text-surface-900">
                {formatCurrency(loan.principalAmount)}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursed Amount</span>
              <span className="font-semibold text-surface-900">
                {formatCurrency(loan.disbursedAmount)}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Approval Date</span>
              <span className="text-surface-700">{formatDateTime(loan.approvalDate)}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursement Date</span>
              <span className="text-surface-700">
                {loan.disbursementDate ? formatDateTime(loan.disbursementDate) : 'Pending'}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursed By</span>
              <span className="text-surface-700">{loan.disbursedBy || 'Authorized Officer'}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Interest Policy</span>
              <span className="text-brand-800 font-semibold">
                Principal-only (Policy pending committee ratification)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-200/60">
            <span className="text-[11px] text-surface-400 block">Stated Loan Purpose</span>
            <p className="text-xs text-surface-700 mt-1 leading-relaxed bg-surface-50 p-3 rounded-lg border border-surface-200">
              {loan.purpose}
            </p>
          </div>
        </div>

        {/* Quick repayment guidance */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              How to Repay
            </h3>
            <p className="text-xs text-surface-600 mt-3 leading-relaxed">
              Loan repayments are transferred to the official cooperative bank account with your loan
              reference in the narration. Once transferred, submit the transfer slip on the repayments
              page for verification.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <strong>Repayment Rule:</strong> Repayments are applied 100% directly toward reducing
              outstanding principal.
            </div>
          </div>

          <Link href="/member/repayments" className="btn-primary text-xs mt-6 text-center">
            Go to Repayments
          </Link>
        </div>
      </div>

      {/* Repayments Ledger on this loan */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Repayment Records for this Facility</h3>
            <p className="text-xs text-surface-500">
              Historical installments verified and deducted from outstanding principal
            </p>
          </div>
        </div>

        {loanRepayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">
            No repayment installments submitted for this loan yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Bank Reference</th>
                  <th className="table-header">Total Paid</th>
                  <th className="table-header">Principal Settled</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {loanRepayments.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                      {r.ref}
                    </td>
                    <td className="table-cell text-xs text-surface-600">{formatDate(r.paymentDate)}</td>
                    <td className="table-cell font-mono text-xs text-surface-600">
                      {r.transferReference}
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="table-cell font-bold text-xs text-emerald-700">
                      {formatCurrency(r.principalComponent)}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-xs text-surface-500">
                      {r.status === 'approved' && r.verifiedBy ? (
                        <span>Verified by {r.verifiedBy}</span>
                      ) : r.status === 'pending' ? (
                        <span className="text-amber-600">Awaiting admin review</span>
                      ) : (
                        <span className="text-red-600">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
