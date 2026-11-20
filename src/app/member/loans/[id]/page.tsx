'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
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
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { loans as mockLoans, repayments as mockRepayments, loanApplications as mockApplications } from '@/lib/mock-data';
import { Card, PageHeader, StatusBadge, Badge } from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MemberLoanDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const loanId = resolvedParams.id;
  const { user } = useAuth();

  const [loan, setLoan] = useState<any | null>(null);
  const [application, setApplication] = useState<any | null>(null);
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLoanDetails() {
      try {
        const supabase = createClient();
        // Fetch loan from Supabase
        const { data: dbLoan, error: loanErr } = await supabase
          .from('loans')
          .select('*, loan_applications(*)')
          .eq('id', loanId)
          .maybeSingle();

        if (dbLoan && !loanErr) {
          const mappedLoan = {
            id: dbLoan.id,
            ref: dbLoan.ref,
            applicationId: dbLoan.application_id,
            memberId: dbLoan.member_id,
            principalAmount: Number(dbLoan.principal_amount),
            disbursedAmount: Number(dbLoan.disbursed_amount || dbLoan.principal_amount),
            outstandingPrincipal: Number(dbLoan.outstanding_principal),
            purpose: dbLoan.purpose,
            status: dbLoan.status,
            approvalDate: dbLoan.approved_date,
            disbursementDate: dbLoan.disbursement_date,
            disbursedBy: dbLoan.disbursed_by ? 'Executive Admin' : 'Authorized Officer',
            repaymentDurationMonths: dbLoan.repayment_duration_months || 12,
          };
          setLoan(mappedLoan);

          if (dbLoan.loan_applications) {
            setApplication(dbLoan.loan_applications);
          }

          // Fetch repayments for this loan
          const { data: dbRepays } = await supabase
            .from('repayments')
            .select('*')
            .eq('loan_id', loanId)
            .order('payment_date', { ascending: false });

          if (dbRepays) {
            setLoanRepayments(
              dbRepays.map((r) => ({
                id: r.id,
                ref: r.ref,
                paymentDate: r.payment_date,
                transferReference: r.transfer_reference || r.ref,
                amount: Number(r.amount),
                principalComponent: Number(r.principal_component || r.amount),
                status: r.status,
                verifiedBy: r.verified_by ? 'Finance Admin' : null,
              }))
            );
          }
          setLoading(false);
          return;
        }

        // Fallback to mock data if not found in DB
        const fallbackLoan = mockLoans.find((l) => l.id === loanId);
        if (fallbackLoan) {
          setLoan(fallbackLoan);
          const fallbackApp = mockApplications.find((a) => a.id === fallbackLoan.applicationId);
          setApplication(fallbackApp || null);
          const fallbackRepays = mockRepayments.filter((r) => r.loanId === fallbackLoan.id);
          setLoanRepayments(fallbackRepays);
        }
      } catch (err) {
        console.error('Error fetching loan detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLoanDetails();
  }, [loanId, user]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-surface-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-xs">Loading loan facility details...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="py-12 text-center space-y-4">
        <Landmark className="h-12 w-12 text-surface-300 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">Loan Facility Not Found</h2>
        <p className="text-xs text-surface-500 dark:text-slate-400 max-w-sm mx-auto">
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

  const canRepay = (loan.status === 'disbursed' || loan.status === 'repaying') && loan.outstandingPrincipal > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/member/loans" className="btn-ghost p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white font-mono">
                {loan.ref}
              </h1>
              <StatusBadge status={loan.status} />
            </div>
            <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">{loan.purpose}</p>
          </div>
        </div>

        {canRepay && (
          <Link
            href={`/member/repayments?loanId=${loan.id}`}
            className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2 shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Make a Repayment ({formatCurrency(loan.outstandingPrincipal)} remaining)
          </Link>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-brand-100 dark:border-brand-900/40">
          <span className="text-xs text-surface-500 dark:text-slate-400 block">Principal Disbursed</span>
          <span className="text-xl font-bold text-surface-900 dark:text-white block mt-1">
            {formatCurrency(loan.disbursedAmount)}
          </span>
          <span className="text-[11px] text-surface-400 block mt-0.5">Approved capital sum</span>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20">
          <span className="text-xs text-surface-500 dark:text-slate-400 block">Outstanding Principal</span>
          <span className="text-xl font-bold text-amber-700 dark:text-amber-400 block mt-1">
            {formatCurrency(loan.outstandingPrincipal)}
          </span>
          <span className="text-[11px] text-surface-400 block mt-0.5">Remaining to amortize</span>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900/40">
          <span className="text-xs text-surface-500 dark:text-slate-400 block">Principal Repaid</span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 block mt-1">
            {formatCurrency(totalRepaid)}
          </span>
          <span className="text-[11px] text-surface-400 block mt-0.5">Verified settlements</span>
        </Card>

        <Card>
          <span className="text-xs text-surface-500 dark:text-slate-400 block">Amortization Progress</span>
          <div className="mt-2 space-y-1">
            <div className="w-full bg-surface-200 dark:bg-darkSurface-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totalRepaid / (loan.disbursedAmount || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-surface-700 dark:text-slate-300 block">
              {Math.min(100, Math.round((totalRepaid / (loan.disbursedAmount || 1)) * 100))}% settled
            </span>
          </div>
        </Card>
      </div>

      {/* Facility Lifecycle & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-darkSurface-border">
            Loan Facility Specification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-surface-400 block text-[11px]">Loan Reference</span>
              <span className="font-mono font-semibold text-surface-900 dark:text-white">{loan.ref}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Application Reference</span>
              <span className="font-mono text-surface-700 dark:text-slate-300">
                {application?.ref || loan.applicationId || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Approved Principal</span>
              <span className="font-semibold text-surface-900 dark:text-white">
                {formatCurrency(loan.principalAmount)}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursed Capital</span>
              <span className="font-semibold text-surface-900 dark:text-white">
                {formatCurrency(loan.disbursedAmount)}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Approval Date</span>
              <span className="text-surface-700 dark:text-slate-300">{loan.approvalDate ? formatDateTime(loan.approvalDate) : 'N/A'}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursement Date</span>
              <span className="text-surface-700 dark:text-slate-300">
                {loan.disbursementDate ? formatDateTime(loan.disbursementDate) : 'Pending Disbursement'}
              </span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Disbursed By</span>
              <span className="text-surface-700 dark:text-slate-300">{loan.disbursedBy || 'Authorized Officer'}</span>
            </div>
            <div>
              <span className="text-surface-400 block text-[11px]">Repayment Bylaw</span>
              <span className="text-brand-800 dark:text-emerald-400 font-semibold">
                100% Principal Deduction
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-200/60 dark:border-darkSurface-border">
            <span className="text-[11px] text-surface-400 block">Stated Loan Purpose</span>
            <p className="text-xs text-surface-700 dark:text-slate-300 mt-1 leading-relaxed bg-surface-50 dark:bg-darkSurface-bg p-3 rounded-lg border border-surface-200 dark:border-darkSurface-border">
              {loan.purpose}
            </p>
          </div>
        </div>

        {/* Quick repayment guidance */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-darkSurface-border flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              How to Repay
            </h3>
            <p className="text-xs text-surface-600 dark:text-slate-300 mt-3 leading-relaxed">
              Transfer your installment to the official cooperative bank account, then submit your payment slip for administrator reconciliation.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Repayment Rule:</strong> All repayments deduct 100% directly from outstanding principal.
            </div>
          </div>

          {canRepay ? (
            <Link
              href={`/member/repayments?loanId=${loan.id}`}
              className="btn-primary text-xs mt-6 text-center flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Make a Repayment Now
            </Link>
          ) : (
            <Link href="/member/loans" className="btn-secondary text-xs mt-6 text-center">
              Back to Loan Facilities
            </Link>
          )}
        </div>
      </div>

      {/* Repayments Ledger on this loan */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Repayment Records for this Facility</h3>
            <p className="text-xs text-surface-500 dark:text-slate-400">
              Historical installments verified and deducted from outstanding principal
            </p>
          </div>
          {canRepay && (
            <Link
              href={`/member/repayments?loanId=${loan.id}`}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              + Submit Installment Proof
            </Link>
          )}
        </div>

        {loanRepayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-surface-400">
            No repayment installments submitted for this loan yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Bank Reference</th>
                  <th className="table-header">Total Paid</th>
                  <th className="table-header">Principal Settled</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {loanRepayments.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-surface-900 dark:text-white">
                      {r.ref}
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">{formatDate(r.paymentDate)}</td>
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
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-xs text-surface-500 dark:text-slate-400">
                      {r.status === 'approved' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified & Deducted</span>
                      ) : r.status === 'pending' ? (
                        <span className="text-amber-600 dark:text-amber-400">Awaiting admin review</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">Rejected</span>
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
