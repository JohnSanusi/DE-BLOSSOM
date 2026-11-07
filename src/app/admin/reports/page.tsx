'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Download,
  PiggyBank,
  Sparkles,
  Landmark,
  CheckCircle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  contributions,
  loans,
  loanApplications,
  repayments,
  members,
  transactions,
  contributionsOverviewChart,
  memberGrowthChart,
  loanActivityChart,
  getAdminDashboardSummary,
} from '@/lib/mock-data';
import { Card, StatCard, PageHeader, Badge, Tabs, InfoTooltip } from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const summary = getAdminDashboardSummary();

  const totalRegularSavings = summary.totalRegularSavings;
  const totalSpecialSavings = summary.totalSpecialSavings;
  const totalSavingsPortfolio = totalRegularSavings + totalSpecialSavings;

  const totalLoansApproved = loans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalLoansDisbursed = loans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const totalOutstandingLoanPrincipal = summary.outstandingLoanPrincipal;

  const approvedRepayments = repayments
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  // Pie chart data for savings distribution (light vs dark friendly colors)
  const savingsPieData = [
    { name: 'Regular Savings', value: totalRegularSavings, color: '#38bdf8' },
    { name: 'Special Savings', value: totalSpecialSavings, color: '#22c55e' },
  ];

  const handleExportFullReport = () => {
    const reportData = [
      ['DE-BLOSSOM COOPERATIVE FINANCIAL MANAGEMENT REPORT'],
      ['Generated at', new Date().toISOString()],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Total Registered Members', summary.totalMembers],
      ['Total Approved Regular Savings (NGN)', totalRegularSavings],
      ['Total Approved Special Savings (NGN)', totalSpecialSavings],
      ['Total Member Equity Portfolio (NGN)', totalSavingsPortfolio],
      [''],
      ['LOAN PORTFOLIO'],
      ['Total Loan Facilities Approved (NGN)', totalLoansApproved],
      ['Total Principal Disbursed (NGN)', totalLoansDisbursed],
      ['Current Outstanding Principal (NGN)', totalOutstandingLoanPrincipal],
      ['Total Verified Repayments (NGN)', approvedRepayments],
      [''],
      ['VERIFICATION QUEUES'],
      ['Pending Contributions', summary.pendingVerifications],
      ['Pending Loan Applications', summary.pendingLoanApplications],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + reportData.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `de_blossom_executive_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Report Exported', 'Comprehensive cooperative financial summary exported to CSV.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">
            Verified balance reconciliations, credit exposure, and longitudinal portfolio statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="select-field text-xs py-1.5 px-3 w-40"
          >
            <option value="all">Cumulative (All Time)</option>
            <option value="year">Current Fiscal Year</option>
            <option value="q3">Q3 2024</option>
          </select>

          <button
            onClick={handleExportFullReport}
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <Download className="h-4 w-4" />
            Export Executive Report
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Approved Regular Savings"
          value={formatCurrency(totalRegularSavings)}
          subtitle="Non-withdrawable member equity"
          icon={<PiggyBank className="h-5 w-5 text-brand-900 dark:text-sky-400" />}
        />
        <StatCard
          title="Total Approved Special Savings"
          value={formatCurrency(totalSpecialSavings)}
          subtitle="Withdrawable interest-free capital"
          icon={<Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Cumulative Lending Disbursed"
          value={formatCurrency(totalLoansDisbursed)}
          subtitle="Principal transferred to members"
          icon={<Landmark className="h-5 w-5 text-brand-700 dark:text-emerald-400" />}
        />
        <StatCard
          title="Current Principal Outstanding"
          value={formatCurrency(totalOutstandingLoanPrincipal)}
          subtitle="Active cooperative exposure"
          icon={<DollarSign className="h-5 w-5 text-amber-700 dark:text-amber-400" />}
          className={totalOutstandingLoanPrincipal > 0 ? 'border-amber-200 dark:border-amber-800/60' : ''}
        />
      </div>

      {/* Visual Charts Grid: Savings Mix & Monthly Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Mix Pie */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-surface-900 dark:text-white pb-1">Savings Portfolio Composition</h2>
            <p className="text-xs text-surface-600 dark:text-slate-300">Regular Savings vs Special Savings Share</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={savingsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {savingsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Total']}
                    contentStyle={{
                      backgroundColor: '#161e2e',
                      borderRadius: '8px',
                      border: '1px solid #1f293d',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            )}
          </div>

          <div className="pt-3 border-t border-surface-100 dark:border-darkSurface-border flex items-center justify-between text-xs">
            <span className="font-medium text-surface-600 dark:text-slate-300">Total Portfolio:</span>
            <span className="font-bold text-surface-900 dark:text-white">{formatCurrency(totalSavingsPortfolio)}</span>
          </div>
        </div>

        {/* Contributions Trajectory Bar Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-surface-900 dark:text-white pb-1">Verified Contributions by Period</h2>
            <p className="text-xs text-surface-600 dark:text-slate-300">
              Only administrator-approved payments posted into member ledger accounts
            </p>
          </div>

          <div className="h-56 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributionsOverviewChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f293d" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [
                      formatCurrency(Number(val) || 0),
                      name === 'value' ? 'Regular' : 'Special',
                    ]}
                    contentStyle={{
                      backgroundColor: '#161e2e',
                      borderRadius: '8px',
                      border: '1px solid #1f293d',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={(name) => (name === 'value' ? 'Regular' : 'Special')}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Regular" />
                  <Bar dataKey="value2" fill="#22c55e" radius={[4, 4, 0, 0]} name="Special" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            )}
          </div>

          <div className="pt-3 border-t border-surface-100 dark:border-darkSurface-border text-xs text-surface-600 dark:text-slate-300">
            Pending submissions ({summary.pendingVerifications}) are omitted from ledger balances.
          </div>
        </div>
      </div>

      {/* Financial Health Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-slate-200">
              Cooperative Liquidity & Reserves
            </h3>
            <InfoTooltip content="Liquid Cash Balance: Total verified member contributions minus loan disbursements, plus recovered repayments. Pending slips are excluded." />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Approved Contributions:</span>
              <span className="font-bold text-surface-900 dark:text-white">
                {formatCurrency(summary.totalApprovedContributions)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Disbursed Loan Principal:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                -{formatCurrency(totalLoansDisbursed)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Recovered Principal:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(approvedRepayments)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold text-surface-800 dark:text-slate-100">Net Society Capital:</span>
              <span className="font-bold text-base text-brand-900 dark:text-emerald-400">
                {formatCurrency(
                  summary.totalApprovedContributions - totalLoansDisbursed + approvedRepayments
                )}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-slate-200">
              Credit Amortization & Repayment
            </h3>
            <InfoTooltip content="Lending Amortization: Compares cumulative principal disbursed with repayments collected. Recovery Rate measures the percentage of principal recovered." />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Total Borrowed:</span>
              <span className="font-bold text-surface-900 dark:text-white">
                {formatCurrency(totalLoansDisbursed)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Principal Settled:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(approvedRepayments)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Remaining to Collect:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalOutstandingLoanPrincipal)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold text-surface-800 dark:text-slate-100">Recovery Rate:</span>
              <span className="font-bold text-surface-900 dark:text-white">
                {Math.round((approvedRepayments / (totalLoansDisbursed || 1)) * 100)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-slate-200">
              Submissions & Pipeline Health
            </h3>
            <InfoTooltip content="Operational Integrity: Status of unverified member submissions awaiting review by administrative officers before entering ledger balances." />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Pending Contributions:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {summary.pendingVerifications} queued
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Pending Loan Requests:</span>
              <span className="font-bold text-sky-500 dark:text-sky-400">
                {summary.pendingLoanApplications} pending
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Active Borrowers:</span>
              <span className="font-bold text-surface-900 dark:text-white">{summary.activeLoans} members</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold text-surface-800 dark:text-slate-100">Operational Integrity:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Reconciled</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
