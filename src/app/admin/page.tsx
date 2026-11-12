'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  HandCoins,
  FileText,
  Landmark,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  Activity,
  ShieldCheck,
  Eye,
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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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

export default function AdminDashboardPage() {
  const { user, isMock } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [liveStats, setLiveStats] = useState<any>(null);
  const [livePendingContribs, setLivePendingContribs] = useState<any[] | null>(null);
  const [livePendingLoanApps, setLivePendingLoanApps] = useState<any[] | null>(null);
  const [liveTransactions, setLiveTransactions] = useState<any[] | null>(null);
  const [liveAudit, setLiveAudit] = useState<any[] | null>(null);
  const [approvedContribs, setApprovedContribs] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!isMock && user) {
      const supabase = createClient();

      // Fetch live executive stats via database stored procedure
      supabase.rpc('get_admin_dashboard_summary').then(({ data, error }) => {
        if (data && !error) setLiveStats(data);
      });

      // Fetch live pending contributions
      supabase
        .from('contributions')
        .select('*, profiles:member_id(full_name, member_ref)')
        .eq('status', 'pending')
        .order('submission_date', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setLivePendingContribs(data);
        });

      // Fetch live pending loan applications
      supabase
        .from('loan_applications')
        .select('*, profiles:member_id(full_name, member_ref)')
        .in('status', ['pending', 'under_review'])
        .order('application_date', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setLivePendingLoanApps(data);
        });

      // Fetch recent transactions
      supabase
        .from('transactions')
        .select('*, profiles:member_id(full_name)')
        .order('posting_date', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setLiveTransactions(data);
        });

      // Fetch recent audit logs
      supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setLiveAudit(data);
        });

      // Fetch approved contributions for dynamic chart
      supabase
        .from('contributions')
        .select('amount, type, payment_date, submission_date')
        .eq('status', 'approved')
        .then(({ data }) => {
          if (data) setApprovedContribs(data);
        });

      // Fetch profiles for dynamic member growth chart
      supabase
        .from('profiles')
        .select('created_at, status')
        .then(({ data }) => {
          if (data) setAllProfiles(data);
        });
    }
  }, [user, isMock]);

  const summary = {
    totalMembers: liveStats ? Number(liveStats.total_members) : 0,
    totalApprovedContributions: liveStats ? Number(liveStats.total_society_capital) : 0,
    pendingVerifications: liveStats ? Number(liveStats.pending_contributions_count) : 0,
    activeLoans: liveStats ? Number(liveStats.active_loans_count) : 0,
    outstandingLoanPrincipal: liveStats ? Number(liveStats.outstanding_loan_principal) : 0,
    pendingLoanApplications: liveStats ? Number(liveStats.pending_loan_apps_count) : 0,
    totalRegularSavings: liveStats ? Number(liveStats.total_regular_savings) : 0,
    totalSpecialSavings: liveStats ? Number(liveStats.total_special_savings) : 0,
  };

  // Dynamic Chart 1: Monthly Approved Contributions
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

  // Dynamic Chart 2: Cumulative Member Growth
  const memberGrowthChart = months.map((m) => {
    const endOfMonth = new Date(m.year, m.month + 1, 0, 23, 59, 59);
    const count = allProfiles.filter((p) => {
      const d = new Date(p.created_at || 0);
      return d <= endOfMonth;
    }).length;
    return { label: m.label, value: count || allProfiles.length };
  });

  const pendingContributions = livePendingContribs
    ? livePendingContribs.map((c: any) => ({
        id: c.id,
        ref: c.ref,
        memberName: c.profiles?.full_name || c.sender_name || 'Member',
        amount: Number(c.amount),
        type: c.type,
        status: c.status,
        submissionDate: c.submission_date,
        transferReference: c.transfer_reference || c.ref,
        receiptUrl: c.receipt_url,
      }))
    : [];

  const pendingLoanApps = livePendingLoanApps
    ? livePendingLoanApps.map((la: any) => ({
        id: la.id,
        ref: la.ref,
        memberName: la.profiles?.full_name || 'Member',
        amount: Number(la.requested_amount),
        requestedAmount: Number(la.requested_amount),
        duration: la.repayment_duration_months,
        purpose: la.purpose,
        status: la.status,
        date: la.application_date,
      }))
    : [];

  const recentTransactions = liveTransactions
    ? liveTransactions.map((t: any) => ({
        id: t.id,
        ref: t.ref,
        memberName: t.profiles?.full_name || 'Member',
        type: t.type,
        category: t.category,
        description: t.description,
        credit: Number(t.credit),
        debit: Number(t.debit),
        date: t.posting_date,
        postingDate: t.posting_date,
      }))
    : [];

  const recentAudit = liveAudit
    ? liveAudit.map((a: any) => ({
        id: a.id,
        action: a.action,
        actorName: a.actor_name,
        performedByName: a.actor_name,
        details: a.details,
        timestamp: a.created_at,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Top Header & Range Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Cooperative Operations Overview
          </h1>
          <p className="text-xs text-surface-500 dark:text-slate-400 mt-1">
            Real-time administrative ledger status, verification queues, and member portfolio health.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-surface-400 dark:text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select-field text-xs py-1.5 px-3 w-40"
          >
            <option value="all">All Financial History</option>
            <option value="90d">Last 90 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* 6 Key Executive StatCards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Members"
          value={summary.totalMembers.toString()}
          subtitle="Registered"
          icon={<Users className="h-4 w-4 text-brand-900 dark:text-sky-400" />}
        />
        <StatCard
          title="Contributions"
          value={formatCurrency(summary.totalApprovedContributions)}
          subtitle="Verified equity"
          tooltip="Verified Ledger Postings: Cumulative sum of all member contributions that have been reconciled and permanently posted into member accounts."
          icon={<CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Pending Verif."
          value={summary.pendingVerifications.toString()}
          subtitle="Receipt review"
          tooltip="Action Required: Bank payment slips uploaded by members awaiting verification against official cooperative bank statements."
          icon={<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          className={summary.pendingVerifications > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20' : ''}
        />
        <StatCard
          title="Active Loans"
          value={summary.activeLoans.toString()}
          subtitle="Disbursed"
          tooltip="Active Credit Facilities: Loans that have been approved and formally disbursed by the treasurer to member bank accounts."
          icon={<Landmark className="h-4 w-4 text-emerald-600 dark:text-sky-400" />}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(summary.outstandingLoanPrincipal)}
          subtitle="Principal"
          tooltip="Cooperative Credit Exposure: Total disbursed loan capital currently held by members awaiting recovery via verified repayments."
          icon={<DollarSign className="h-4 w-4 text-amber-700 dark:text-amber-400" />}
        />
        <StatCard
          title="Loan Apps"
          value={summary.pendingLoanApplications.toString()}
          subtitle="Awaiting vote"
          tooltip="Committee Queue: Loan applications awaiting committee credit evaluation against regular savings equity."
          icon={<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          className={summary.pendingLoanApplications > 0 ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20' : ''}
        />
      </div>

      {/* Verification Action Banner (if pending items exist) */}
      {summary.pendingVerifications > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Action Required: {summary.pendingVerifications} Contribution Payment(s) Pending Verification
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                Members have uploaded bank transfer slips. Review and compare with cooperative bank records before posting to the ledger.
              </p>
            </div>
          </div>
          <Link
            href="/admin/contributions"
            className="btn-accent text-xs py-1.5 px-4 shrink-0 self-start sm:self-auto"
          >
            Review Payments Queue
          </Link>
        </div>
      )}

      {/* Visual Analytics Grid: Contributions Breakdown & Member Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributions by Month */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-200 dark:border-darkSurface-border">
            <div>
              <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Monthly Approved Contributions
              </h2>
              <p className="text-xs text-surface-500 dark:text-slate-400">Regular Savings vs Special Savings (₦)</p>
            </div>
            <Link href="/admin/reports" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
              Detailed Reports
            </Link>
          </div>

          <div className="h-64 w-full">
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
                      name === 'value' ? 'Regular Savings' : 'Special Savings',
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
                    formatter={(name) => (name === 'value' ? 'Regular Savings' : 'Special Savings')}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Regular Savings" />
                  <Bar dataKey="value2" fill="#22c55e" radius={[4, 4, 0, 0]} name="Special Savings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        {/* Member Growth Chart */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-200 dark:border-darkSurface-border">
            <div>
              <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-900 dark:text-sky-400" />
                Cooperative Membership Growth
              </h2>
              <p className="text-xs text-surface-500 dark:text-slate-400">Cumulative verified member registration count</p>
            </div>
            <Link href="/admin/members" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
              Manage Members
            </Link>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memberGrowthChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f293d" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: unknown) => [Number(val), 'Total Members']}
                    contentStyle={{
                      backgroundColor: '#161e2e',
                      borderRadius: '8px',
                      border: '1px solid #1f293d',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#memberGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            )}
          </div>
        </div>
      </div>

      {/* Two operational queues: Pending Contributions Verification & Pending Loan Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Contributions Queue */}
        <Card padding="none">
          <div className="p-4 sm:p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Pending Payment Verifications ({pendingContributions.length})
              </h3>
              <p className="text-xs text-surface-500 dark:text-slate-400">Unverified payment submissions awaiting action</p>
            </div>
            <Link href="/admin/contributions" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
              View all
            </Link>
          </div>

          {pendingContributions.length === 0 ? (
            <div className="p-8 text-center text-xs text-surface-400">
              Queue clear. All contributions have been reconciled.
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-darkSurface-border">
              {pendingContributions.slice(0, 4).map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-surface-900 dark:text-white">{c.memberName}</span>
                      <Badge variant={c.type === 'regular' ? 'default' : 'info'}>
                        {c.type === 'regular' ? 'Regular' : 'Special'}
                      </Badge>
                    </div>
                    <p className="font-mono text-[11px] text-surface-500 dark:text-slate-400 mt-0.5">
                      Ref: {c.ref} • {c.transferReference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-surface-900 dark:text-white">{formatCurrency(c.amount)}</p>
                    <Link
                      href={`/admin/contributions/${c.id}`}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      Review <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Loan Applications */}
        <Card padding="none">
          <div className="p-4 sm:p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                Loan Applications Queue ({pendingLoanApps.length})
              </h3>
              <p className="text-xs text-surface-500 dark:text-slate-400">Awaiting committee assessment</p>
            </div>
            <Link href="/admin/loan-applications" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
              View all
            </Link>
          </div>

          {pendingLoanApps.length === 0 ? (
            <div className="p-8 text-center text-xs text-surface-400">
              No pending loan applications requiring review.
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-darkSurface-border">
              {pendingLoanApps.slice(0, 4).map((la) => (
                <div key={la.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-surface-900 dark:text-white">{la.memberName}</span>
                      <StatusBadge status={la.status} />
                    </div>
                    <p className="text-surface-600 dark:text-slate-300 mt-0.5 line-clamp-1">{la.purpose}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-surface-900 dark:text-white">
                      {formatCurrency(la.requestedAmount)}
                    </p>
                    <Link
                      href="/admin/loan-applications"
                      className="text-[11px] font-semibold text-brand-800 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      Assess <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Authoritative Ledger Entries & Administrative Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ledger Entries */}
        <Card padding="none">
          <div className="p-4 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Recent Ledger Postings</h3>
              <p className="text-xs text-surface-500 dark:text-slate-400">Authoritative immutable financial entries</p>
            </div>
            <Link href="/admin/transactions" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
              Full ledger
            </Link>
          </div>

          <div className="divide-y divide-surface-100 dark:divide-darkSurface-border">
            {recentTransactions.map((t) => (
              <div key={t.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-surface-900 dark:text-white">{t.memberName}</p>
                  <p className="text-surface-500 dark:text-slate-400 text-[11px] truncate max-w-xs">{t.description}</p>
                </div>
                <div className="text-right">
                  {t.credit > 0 ? (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">+{formatCurrency(t.credit)}</span>
                  ) : (
                    <span className="font-bold text-surface-900 dark:text-white">-{formatCurrency(t.debit)}</span>
                  )}
                  <span className="block text-[10px] text-surface-400 capitalize">
                    {t.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Audit Log Trail */}
        <Card padding="none">
          <div className="p-4 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                Administrative Activity Trail
              </h3>
              <p className="text-xs text-surface-500 dark:text-slate-400">Accountability records of admin decisions</p>
            </div>
          </div>

          <div className="divide-y divide-surface-100 dark:divide-darkSurface-border">
            {recentAudit.map((a) => (
              <div key={a.id} className="p-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-surface-900 dark:text-white">{a.performedByName}</span>
                  <span className="text-[10px] text-surface-400">{formatDate(a.timestamp)}</span>
                </div>
                <p className="text-surface-600 dark:text-slate-300 mt-0.5 leading-relaxed">{a.details}</p>
                <span className="inline-block font-mono text-[10px] text-surface-400 mt-1">
                  Action: {a.action}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
