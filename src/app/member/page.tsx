'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PiggyBank,
  Sparkles,
  CheckCircle,
  Landmark,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Calendar,
  CreditCard,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Badge,
} from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const cooperativeSettings = {
  bankName: 'First Bank of Nigeria',
  bankAccountNumber: '1012345678',
  bankAccountName: 'DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD',
};

export default function MemberDashboardPage() {
  const { user, profile, isMock } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [liveSummary, setLiveSummary] = useState<any>(null);
  const [liveContributions, setLiveContributions] = useState<any[] | null>(null);
  const [liveLoans, setLiveLoans] = useState<any[] | null>(null);
  const [liveTransactions, setLiveTransactions] = useState<any[] | null>(null);
  const [pendingRepayment, setPendingRepayment] = useState<{ amount: number; paymentDate: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isMock && user) {
      const supabase = createClient();
      supabase
        .from('member_financial_summary')
        .select('*')
        .eq('member_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setLiveSummary(data);
        });

      supabase
        .from('contributions')
        .select('*')
        .eq('member_id', user.id)
        .order('submission_date', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setLiveContributions(data);
        });

      supabase
        .from('loans')
        .select('*')
        .eq('member_id', user.id)
        .in('status', ['disbursed', 'repaying'])
        .then(({ data }) => {
          if (data) setLiveLoans(data);
        });

      supabase
        .from('transactions')
        .select('*')
        .eq('member_id', user.id)
        .order('posting_date', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setLiveTransactions(data);
        });

      supabase
        .from('repayments')
        .select('*')
        .eq('member_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPendingRepayment({
              amount: Number(data.amount),
              paymentDate: data.payment_date,
            });
          }
        });
    }
  }, [user, isMock]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member';
  const displayRef = profile?.member_number || (profile as any)?.member_ref || 'Pending ID';

  const summary = {
    regularSavings: liveSummary ? Number(liveSummary.regular_savings || 0) : 0,
    specialSavings: liveSummary ? Number(liveSummary.special_savings || 0) : 0,
    totalApprovedContributions: liveSummary ? Number(liveSummary.total_savings || 0) : 0,
    outstandingLoanBalance: liveSummary ? Number(liveSummary.outstanding_loan_principal || 0) : 0,
    pendingContributions: liveSummary ? Number(liveSummary.pending_contributions_count || 0) : 0,
    activeLoans: liveSummary ? Number(liveSummary.active_loans_count || 0) : 0,
  };

  const chartData = [
    { label: 'Jan', amount: 0 },
    { label: 'Feb', amount: 0 },
    { label: 'Mar', amount: 0 },
    { label: 'Apr', amount: 0 },
    { label: 'May', amount: 0 },
    { label: 'Jun', amount: summary.regularSavings + summary.specialSavings },
  ];

  const memberContributions = liveContributions
    ? liveContributions.map((c: any) => ({
        id: c.id,
        ref: c.ref,
        amount: Number(c.amount),
        type: c.type,
        status: c.status,
        paymentDate: c.payment_date,
        transferReference: c.transfer_reference || c.ref,
      }))
    : [];

  const activeLoans = liveLoans
    ? liveLoans.map((l: any) => ({
        id: l.id,
        ref: l.ref,
        principalAmount: Number(l.principal_amount),
        disbursedAmount: Number(l.disbursed_amount || l.principal_amount),
        outstandingPrincipal: Number(l.outstanding_principal),
        purpose: l.purpose,
        status: l.status,
      }))
    : [];

  const recentTransactions = liveTransactions
    ? liveTransactions.map((t: any) => ({
        id: t.id,
        ref: t.ref,
        type: t.type,
        category: t.category,
        description: t.description,
        credit: Number(t.credit),
        debit: Number(t.debit),
        date: t.posting_date,
        postingDate: t.posting_date,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Welcome & quick actions banner */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-accent-300 border border-white/10 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Cooperative Member #{displayRef}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good day, {displayName.split(' ')[0]}
            </h1>
            <p className="text-surface-200 text-sm mt-1.5 max-w-xl leading-relaxed">
              Here is an overview of your cooperative savings, loan balances, and recent payment activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/member/contributions/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Make Contribution
            </Link>
            <Link
              href="/member/loans/apply"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <Landmark className="h-4 w-4" />
              Apply for Loan
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards with Guided Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Regular Savings"
          value={formatCurrency(summary.regularSavings)}
          subtitle="Non-withdrawable; counts toward loan eligibility"
          tooltip="Cooperative Equity Shares: Regular savings represent your permanent stake in the society. They cannot be withdrawn on demand; they build your borrowing eligibility for loans."
          icon={<PiggyBank className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
          className="border-emerald-100 dark:border-emerald-900/40"
        />
        <StatCard
          title="Special Savings"
          value={formatCurrency(summary.specialSavings)}
          subtitle="Interest-free deposits; withdrawable on request"
          tooltip="Voluntary Withdrawable Savings: Special savings are interest-free personal deposits. You can request a withdrawal at any time for emergencies, fees, or personal projects."
          icon={<Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          className="border-emerald-100 dark:border-emerald-900/40"
        />
        <StatCard
          title="Approved Contributions"
          value={formatCurrency(summary.totalApprovedContributions)}
          subtitle="Total verified deposits entered into ledger"
          tooltip="Reconciliation Guard: Only administrator-approved bank payments appear in this total. Pending submissions are held in review until reconciled against cooperative statements."
          icon={<CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
        />
        <StatCard
          title="Outstanding Loan Principal"
          value={formatCurrency(summary.outstandingLoanBalance)}
          subtitle={
            summary.activeLoans > 0
              ? `${summary.activeLoans} active cooperative loan(s)`
              : 'No active loans'
          }
          tooltip="100% Principal Deduction: Total remaining balance on disbursed loans. In accordance with cooperative bylaws, payments deduct strictly from your principal."
          icon={<Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={summary.outstandingLoanBalance > 0 ? 'border-amber-200 dark:border-amber-800/60' : ''}
        />
      </div>

      {/* Main Grid: Chart & Active Loan Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Growth Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Cumulative Savings Growth
              </h2>
              <p className="text-xs text-surface-500">
                Verified regular and special savings trajectory over the year
              </p>
            </div>
            <Link
              href="/member/savings"
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Savings details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#102a43" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#102a43" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Balance']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#102a43"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#savingsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-100 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        {/* Loan & Repayment Information Widget */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-200">
              <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-brand-900" />
                Active Loan Profile
              </h2>
              <Link
                href="/member/loans"
                className="text-xs font-semibold text-brand-700 hover:text-brand-900"
              >
                View all
              </Link>
            </div>

            {activeLoans.length > 0 ? (
              <div className="mt-4 space-y-4">
                {activeLoans.map((l) => (
                  <div key={l.id} className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-surface-900">{l.ref}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="text-xs text-surface-600 font-medium line-clamp-1">{l.purpose}</p>
                    <div className="pt-2 border-t border-surface-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-surface-400 block text-[10px]">Disbursed</span>
                        <span className="font-semibold text-surface-800">{formatCurrency(l.disbursedAmount)}</span>
                      </div>
                      <div>
                        <span className="text-surface-400 block text-[10px]">Outstanding</span>
                        <span className="font-bold text-amber-700">{formatCurrency(l.outstandingPrincipal)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingRepayment && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-amber-900">Pending Repayment Verification</p>
                      <p className="text-amber-800 mt-0.5">
                        {formatCurrency(pendingRepayment.amount)} submitted on {formatDate(pendingRepayment.paymentDate)}. Awaiting admin check.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-800">No Outstanding Loans</p>
                  <p className="text-xs text-surface-500 mt-1 max-w-xs mx-auto">
                    You currently have no active debt with the cooperative.
                  </p>
                </div>
                <Link href="/member/loans/apply" className="btn-secondary text-xs inline-flex">
                  Check Loan Eligibility
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-surface-400" />
              Repayment Cycle: Monthly
            </span>
            <span className="font-medium text-brand-800">Principal-only</span>
          </div>
        </div>
      </div>

      {/* Two columns: Recent Contributions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contributions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-200">
            <div>
              <h2 className="text-base font-bold text-surface-900">Recent Contributions</h2>
              <p className="text-xs text-surface-500">Latest payment submissions and verification status</p>
            </div>
            <Link
              href="/member/contributions"
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-surface-100 dark:divide-darkSurface-border">
            {memberContributions.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-400">
                No contribution records yet. Use &ldquo;Make Contribution&rdquo; above to submit payment proof.
              </div>
            ) : (
              memberContributions.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-surface-900 dark:text-white">{c.ref}</span>
                      <Badge variant={c.type === 'regular' ? 'default' : 'info'}>
                        {c.type === 'regular' ? 'Regular' : 'Special'}
                      </Badge>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Paid {formatDate(c.paymentDate)} • Ref: {c.transferReference}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-surface-900 dark:text-white">{formatCurrency(c.amount)}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-200">
            <div>
              <h2 className="text-base font-bold text-surface-900">Financial Ledger Activity</h2>
              <p className="text-xs text-surface-500">Official posted transactions on your account</p>
            </div>
            <Link
              href="/member/transactions"
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1"
            >
              Full ledger <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-surface-100 dark:divide-darkSurface-border">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-400">
                No ledger activity posted yet. Verified transactions will appear here.
              </div>
            ) : (
              recentTransactions.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">{t.description}</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">
                      {formatDate(t.date)} • {t.ref}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {t.credit > 0 ? (
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(t.credit)}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-surface-800 dark:text-slate-200">
                        -{formatCurrency(t.debit)}
                      </span>
                    )}
                    <span className="block text-[10px] text-surface-400 capitalize">
                      {t.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Official Cooperative Payment Account Notice */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-100/70 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-900 text-white flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500">
              Cooperative Bank Account for Transfers
            </h3>
            <p className="text-sm font-semibold text-surface-900">
              {cooperativeSettings.bankName} •{' '}
              <span className="font-mono">{cooperativeSettings.bankAccountNumber}</span> •{' '}
              {cooperativeSettings.bankAccountName}
            </p>
          </div>
        </div>
        <Link
          href="/member/contributions/new"
          className="btn-secondary text-xs shrink-0 self-start sm:self-auto"
        >
          Submit Transfer Receipt
        </Link>
      </div>
    </div>
  );
}
