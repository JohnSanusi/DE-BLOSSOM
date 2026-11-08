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
  Loader2,
} from 'lucide-react';
import { Card, StatCard, PageHeader, Badge, Tabs, InfoTooltip } from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart,
  Bar,
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

function getLast6Months() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: months[d.getMonth()],
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return result;
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [liveStats, setLiveStats] = useState<any>(null);
  const [approvedContribs, setApprovedContribs] = useState<any[]>([]);
  const [loansList, setLoansList] = useState<any[]>([]);
  const [repaymentsList, setRepaymentsList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    async function loadReportData() {
      if (!user) return;
      try {
        const supabase = createClient();
        const [statsRes, contribsRes, loansRes, repaysRes] = await Promise.all([
          supabase.rpc('get_admin_dashboard_summary'),
          supabase
            .from('contributions')
            .select('amount, type, payment_date, submission_date')
            .eq('status', 'approved'),
          supabase
            .from('loans')
            .select('principal_amount, disbursed_amount, outstanding_principal, status'),
          supabase
            .from('repayments')
            .select('amount, principal_component, status')
            .eq('status', 'approved'),
        ]);

        if (statsRes.data) setLiveStats(statsRes.data);
        if (contribsRes.data) setApprovedContribs(contribsRes.data);
        if (loansRes.data) setLoansList(loansRes.data);
        if (repaysRes.data) setRepaymentsList(repaysRes.data);
      } catch (err) {
        console.error('Error fetching admin reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [user]);

  const totalMembers = liveStats ? Number(liveStats.total_members || 0) : 0;
  const totalRegularSavings = liveStats ? Number(liveStats.total_regular_savings || 0) : 0;
  const totalSpecialSavings = liveStats ? Number(liveStats.total_special_savings || 0) : 0;
  const totalSavingsPortfolio = totalRegularSavings + totalSpecialSavings;

  const totalLoansApproved = loansList.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);
  const totalLoansDisbursed = loansList.reduce((sum, l) => sum + Number(l.disbursed_amount || 0), 0);
  const totalOutstandingLoanPrincipal = liveStats ? Number(liveStats.outstanding_loan_principal || 0) : 0;
  const approvedRepayments = repaymentsList.reduce((sum, r) => sum + Number(r.principal_component || r.amount || 0), 0);
  const pendingVerifications = liveStats ? Number(liveStats.pending_contributions_count || 0) : 0;
  const pendingLoanApps = liveStats ? Number(liveStats.pending_loan_apps_count || 0) : 0;

  // Pie chart data
  const savingsPieData = [
    { name: 'Regular Savings', value: totalRegularSavings, color: '#38bdf8' },
    { name: 'Special Savings', value: totalSpecialSavings, color: '#22c55e' },
  ];

  // Dynamic Monthly Approved Contributions Bar Chart
  const months = getLast6Months();
  const contributionsOverviewChart = months.map((m) => {
    let regular = 0;
    let special = 0;
    approvedContribs.forEach((c) => {
      const d = c.payment_date || c.submission_date;
      if (d && String(d).startsWith(m.key)) {
        if (c.type === 'regular') regular += Number(c.amount || 0);
        else special += Number(c.amount || 0);
      }
    });
    return { label: m.label, value: regular, value2: special };
  });

  const handleExportFullReport = () => {
    const reportData = [
      ['DE-BLOSSOM COOPERATIVE FINANCIAL MANAGEMENT REPORT'],
      ['Generated at', new Date().toISOString()],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Total Registered Members', totalMembers],
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
      ['Pending Contributions', pendingVerifications],
      ['Pending Loan Applications', pendingLoanApps],
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

    addToast('success', 'Report Exported', 'Executive financial summary downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Financial Reports & Analytics"
          description="Audited financial summaries, savings equity breakdown, and credit risk exposure metrics."
        />
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportFullReport}
            className="btn-primary text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export Executive Report (CSV)
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            Pending submissions ({pendingVerifications}) are omitted from ledger balances.
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
                {formatCurrency(totalSavingsPortfolio)}
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
                  totalSavingsPortfolio - totalLoansDisbursed + approvedRepayments
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
                {totalLoansDisbursed > 0
                  ? `${((approvedRepayments / totalLoansDisbursed) * 100).toFixed(1)}%`
                  : 'N/A (No Loans Disbursed)'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-slate-200">
              Active Member Base
            </h3>
            <InfoTooltip content="Total members registered in DE-BLOSSOM Cooperative Society." />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Registered Members:</span>
              <span className="font-bold text-surface-900 dark:text-white">{totalMembers}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Average Savings / Member:</span>
              <span className="font-bold text-surface-900 dark:text-white">
                {formatCurrency(totalMembers > 0 ? totalSavingsPortfolio / totalMembers : 0)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100 dark:border-darkSurface-border">
              <span className="text-surface-700 dark:text-slate-200">Pending Submissions Queue:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{pendingVerifications}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold text-surface-800 dark:text-slate-100">Pending Loan Requests:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{pendingLoanApps}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
