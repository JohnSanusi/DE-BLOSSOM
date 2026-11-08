'use client';

import React, { use, useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { disburseLoanAction } from '@/app/actions/loans';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminLoanDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const loanId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loan, setLoan] = useState<any>(null);
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [memberSavings, setMemberSavings] = useState<{ regularSavings: number; specialSavings: number; totalSavings: number }>({
    regularSavings: 0,
    specialSavings: 0,
    totalSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  const loadLoanDetail = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const [loanRes, repaysRes] = await Promise.all([
        supabase
          .from('loans')
          .select('*, profiles:member_id(full_name, member_ref)')
          .eq('id', loanId)
          .maybeSingle(),
        supabase
          .from('repayments')
          .select('*')
          .eq('loan_id', loanId)
          .order('payment_date', { ascending: false }),
      ]);

      if (loanRes.data) {
        const l = loanRes.data;
        setLoan({
          id: l.id,
          ref: l.ref,
          applicationId: l.application_id,
          memberId: l.member_id,
          memberName: l.profiles?.full_name || 'Member',
          memberRef: l.profiles?.member_ref || 'Pending',
          principalAmount: Number(l.principal_amount),
          disbursedAmount: Number(l.disbursed_amount || 0),
          outstandingPrincipal: Number(l.outstanding_principal),
          purpose: l.purpose,
          status: l.status,
          approvalDate: l.approved_date,
          disbursementDate: l.disbursement_date,
          disbursedBy: l.disbursed_by,
        });

        // Load member savings
        const { data: summary } = await supabase
          .from('member_financial_summary')
          .select('regular_savings, special_savings, total_savings')
          .eq('member_id', l.member_id)
          .maybeSingle();

        if (summary) {
          setMemberSavings({
            regularSavings: Number(summary.regular_savings || 0),
            specialSavings: Number(summary.special_savings || 0),
            totalSavings: Number(summary.total_savings || 0),
          });
        }
      }

      if (repaysRes.data) {
        setLoanRepayments(
          repaysRes.data.map((r) => ({
            id: r.id,
            ref: r.ref,
            paymentDate: r.payment_date,
            transferReference: r.transfer_reference || r.ref,
            principalComponent: Number(r.principal_component || r.amount),
            interestComponent: Number(r.interest_component || 0),
            status: r.status,
            verifiedBy: r.verified_by,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching loan detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoanDetail();
  }, [user, loanId]);

  const handleDisburseLoan = async () => {
    setDisbursing(true);
    try {
      const res = await disburseLoanAction(loanId);
      if (res.success) {
        setDisburseModalOpen(false);
        addToast(
          'success',
          'Loan Disbursed',
          `₦${loan.principalAmount.toLocaleString()} has been marked as disbursed and debited to the society ledger.`
        );
        await loadLoanDetail();
      } else {
        addToast('error', 'Disbursement Failed', res.error || 'Failed to disburse loan');
      }
    } catch (err: any) {
      addToast('error', 'Action Error', err?.message || 'Something went wrong');
    } finally {
      setDisbursing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-surface-400">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        <p className="text-xs">Loading loan facility details...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="py-12 text-center space-y-4">
        <Landmark className="h-12 w-12 text-surface-300 dark:text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">Loan Facility Not Found</h2>
        <p className="text-xs text-surface-500 dark:text-slate-400 max-w-sm mx-auto">
          The requested loan record does not exist in the administrative ledger.
        </p>
        <Link href="/admin/loans" className="btn-primary text-xs inline-flex">
          Back to Loans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Disburse CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/loans" className="btn-ghost p-2 text-surface-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-surface-900 dark:text-white">
                Loan Facility {loan.ref}
              </h1>
              <StatusBadge status={loan.status} />
            </div>
            <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">
              Borrower: <strong className="text-surface-700 dark:text-slate-200">{loan.memberName}</strong> ({loan.memberRef})
            </p>
          </div>
        </div>

        {loan.status === 'approved' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDisburseModalOpen(true)}
              className="btn-primary text-xs px-4 py-2 font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Disburse Payout
            </button>
            <InfoTooltip content="Disbursement marks the loan as actively amortizing and records an immutable debit outflow on the cooperative general ledger." />
          </div>
        )}
      </div>

      {/* Financial Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Principal Facility"
          value={formatCurrency(loan.principalAmount)}
          subtitle="Approved principal capital"
          icon={<DollarSign className="h-5 w-5 text-brand-900 dark:text-sky-400" />}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(loan.outstandingPrincipal)}
          subtitle="Capital remaining to amortize"
          icon={<Clock className="h-5 w-5 text-amber-700 dark:text-amber-400" />}
          className={loan.outstandingPrincipal > 0 ? 'border-amber-200 dark:border-amber-900/60' : ''}
        />
        <StatCard
          title="Total Repaid to Date"
          value={formatCurrency(
            loanRepayments
              .filter((r) => r.status === 'approved')
              .reduce((sum, r) => sum + r.principalComponent, 0)
          )}
          subtitle="Verified settlements"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      {/* Two columns: Details & Applicant Savings Record */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h2 className="text-sm font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-darkSurface-border">
            Loan Facility Specification & Audit Records
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Facility Reference</span>
              <span className="font-mono font-bold text-surface-900 dark:text-white">{loan.ref}</span>
            </div>
            <div>
              <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Approval Date</span>
              <span className="text-surface-700 dark:text-slate-300">{formatDateTime(loan.approvalDate)}</span>
            </div>
            <div>
              <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Disbursement Date</span>
              <span className="text-surface-700 dark:text-slate-300">
                {loan.disbursementDate ? formatDateTime(loan.disbursementDate) : 'Pending Disbursement'}
              </span>
            </div>
            <div>
              <span className="text-surface-400 dark:text-slate-400 block text-[11px]">Applied Interest Formula</span>
              <span className="font-semibold text-brand-900 dark:text-emerald-400">Principal-Only (Zero Interest Mode)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-200/60 dark:border-darkSurface-border">
            <span className="text-[11px] text-surface-400 dark:text-slate-400 block">Stated Loan Purpose</span>
            <p className="text-xs text-surface-700 dark:text-slate-300 mt-1 leading-relaxed bg-surface-50 dark:bg-darkSurface-bg p-3 rounded-lg border border-surface-200 dark:border-darkSurface-border">
              {loan.purpose}
            </p>
          </div>
        </div>

        {/* Member Savings Overview */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-darkSurface-border flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-brand-900 dark:text-sky-400" />
            Borrower Equity Standing
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-50 dark:bg-darkSurface-bg rounded-lg border border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
              <span className="text-surface-500 dark:text-slate-400">Regular Savings:</span>
              <span className="font-bold text-brand-900 dark:text-emerald-400">
                {formatCurrency(memberSavings.regularSavings)}
              </span>
            </div>
            <div className="p-3 bg-surface-50 dark:bg-darkSurface-bg rounded-lg border border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
              <span className="text-surface-500 dark:text-slate-400">Special Savings:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(memberSavings.specialSavings)}
              </span>
            </div>
            <div className="p-3 bg-surface-50 dark:bg-darkSurface-bg rounded-lg border border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
              <span className="text-surface-500 dark:text-slate-400">Total Savings:</span>
              <span className="font-bold text-surface-900 dark:text-white">
                {formatCurrency(memberSavings.totalSavings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Repayments Ledger Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Facility Repayment Journal</h3>
            <p className="text-xs text-surface-500 dark:text-slate-400">
              Principal amortization installments logged against this loan
            </p>
          </div>
          <Link href="/admin/repayments" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
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
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Repayment Ref</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Bank Reference</th>
                  <th className="table-header">Principal Settled</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {loanRepayments.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover">
                    <td className="table-cell font-mono font-bold text-surface-900 dark:text-white">{r.ref}</td>
                    <td className="table-cell text-surface-600 dark:text-slate-300">{formatDate(r.paymentDate)}</td>
                    <td className="table-cell font-mono text-surface-600 dark:text-slate-400">{r.transferReference}</td>
                    <td className="table-cell font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.principalComponent)}</td>
                    <td className="table-cell"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Disburse Modal */}
      <ConfirmDialog
        open={disburseModalOpen}
        title="Disburse Cooperative Loan Funds"
        message={`Confirm disbursement of ₦${loan.principalAmount.toLocaleString()} to ${loan.memberName}? This will record a financial ledger debit outflow and initiate loan amortization.`}
        confirmLabel={disbursing ? 'Disbursing...' : 'Confirm Disbursement'}
        variant="primary"
        onConfirm={handleDisburseLoan}
        onCancel={() => setDisburseModalOpen(false)}
      />
    </div>
  );
}
