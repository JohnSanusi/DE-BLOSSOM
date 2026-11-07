'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  PiggyBank,
  Sparkles,
  Landmark,
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import {
  members,
  contributions,
  loans,
  loanApplications,
  transactions,
  getMemberSavings,
} from '@/lib/mock-data';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Tabs,
  Badge,
  Avatar,
  ConfirmDialog,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { AccountStatus } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminMemberDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const memberId = resolvedParams.id;
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'loans' | 'transactions'>('overview');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const member = members.find((m) => m.id === memberId);

  // Local state for account status so toggle works live in demo
  const [currentStatus, setCurrentStatus] = useState<AccountStatus>(
    member ? member.status : 'active'
  );

  if (!member) {
    return (
      <div className="py-12 text-center space-y-4">
        <Users className="h-12 w-12 text-surface-300 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900">Member Not Found</h2>
        <p className="text-xs text-surface-500 max-w-sm mx-auto">
          The member profile does not exist in the cooperative directory.
        </p>
        <Link href="/admin/members" className="btn-primary text-xs inline-flex">
          Back to Members
        </Link>
      </div>
    );
  }

  const savings = getMemberSavings(member.id);
  const memberContribs = contributions.filter((c) => c.memberId === member.id);
  const memberLoans = loans.filter((l) => l.memberId === member.id);
  const memberApplications = loanApplications.filter((la) => la.memberId === member.id);
  const memberTxns = transactions.filter((t) => t.memberId === member.id);

  const activeLoanPrincipal = memberLoans
    .filter((l) => l.status === 'disbursed' || l.status === 'repaying')
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  const handleToggleStatus = () => {
    const nextStatus: AccountStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setCurrentStatus(nextStatus);
    member.status = nextStatus;
    setSuspendDialogOpen(false);
    addToast(
      'info',
      'Account Status Updated',
      `Member account is now ${nextStatus.toUpperCase()}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/members" className="btn-ghost p-2 text-surface-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={member.fullName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-surface-900">{member.fullName}</h1>
                <StatusBadge status={currentStatus} />
              </div>
              <p className="font-mono text-xs text-brand-900 font-semibold mt-0.5">
                {member.memberRef} • {member.email}
              </p>
            </div>
          </div>
        </div>

        {/* Status action button */}
        <button
          onClick={() => setSuspendDialogOpen(true)}
          className={currentStatus === 'active' ? 'btn-danger text-xs' : 'btn-accent text-xs'}
        >
          {currentStatus === 'active' ? 'Suspend Account' : 'Reactivate Account'}
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Regular Savings"
          value={formatCurrency(savings.regularSavings)}
          subtitle="Non-withdrawable equity"
          icon={<PiggyBank className="h-5 w-5 text-brand-900" />}
        />
        <StatCard
          title="Special Savings"
          value={formatCurrency(savings.specialSavings)}
          subtitle="Interest-free withdrawable"
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Total Member Savings"
          value={formatCurrency(savings.totalSavings)}
          subtitle="Approved net ledger balance"
          icon={<CheckCircle className="h-5 w-5 text-brand-700" />}
        />
        <StatCard
          title="Outstanding Loan Principal"
          value={formatCurrency(activeLoanPrincipal)}
          subtitle={activeLoanPrincipal > 0 ? 'Active cooperative debt' : 'Zero outstanding debt'}
          icon={<Landmark className="h-5 w-5 text-amber-600" />}
          className={activeLoanPrincipal > 0 ? 'border-amber-200' : ''}
        />
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(v) => setActiveTab(v as typeof activeTab)}
        tabs={[
          { label: 'Member Profile Overview', value: 'overview' },
          { label: 'Contributions', value: 'contributions', count: memberContribs.length },
          { label: 'Loans & Applications', value: 'loans', count: memberLoans.length + memberApplications.length },
          { label: 'Ledger Transactions', value: 'transactions', count: memberTxns.length },
        ]}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
              Personal & Membership Records
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-surface-400 block text-[11px]">Official Full Name</span>
                <span className="font-semibold text-surface-900">{member.fullName}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Member Reference ID</span>
                <span className="font-mono font-semibold text-surface-900">{member.memberRef}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Primary Email</span>
                <span className="text-surface-700">{member.email}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Contact Phone</span>
                <span className="font-mono text-surface-700">{member.phone}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Registration Date</span>
                <span className="text-surface-700">{formatDateTime(member.createdAt)}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Assigned Role</span>
                <span className="font-semibold uppercase tracking-wider text-brand-900">
                  {member.role}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-200/60">
              <span className="text-[11px] text-surface-400 block">Cooperative Standing</span>
              <p className="text-xs text-surface-600 mt-1 leading-relaxed bg-surface-50 p-3 rounded-lg border border-surface-200">
                {currentStatus === 'active'
                  ? 'Account is active in good standing. Member has verified contribution records and is eligible for cooperative services according to savings history.'
                  : 'Account is currently suspended. Submissions and withdrawal privileges are restricted until reactivated by an executive administrator.'}
              </p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
              Administrative Safeguards
            </h3>
            <div className="space-y-3 text-xs text-surface-600 leading-relaxed">
              <p className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <strong>Immutable Fields:</strong> Member identity references and historical balances
                are derived from posted ledger transactions. Ordinary CRUD updates to ledger records
                are strictly blocked.
              </p>
              <p className="p-3 bg-surface-100 border border-surface-200 rounded-lg">
                <strong>Audit Trail:</strong> Any status modifications or adjustments to this profile
                will be permanently logged in the cooperative audit journal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <Card padding="none">
          <div className="p-4 border-b border-surface-200">
            <h3 className="text-sm font-bold text-surface-900">Member Contribution Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Reference</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Transfer Ref</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {memberContribs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50/70 text-xs">
                    <td className="table-cell font-mono font-semibold text-surface-900">{c.ref}</td>
                    <td className="table-cell capitalize">{c.type} Savings</td>
                    <td className="table-cell font-bold text-surface-900">{formatCurrency(c.amount)}</td>
                    <td className="table-cell text-surface-600">{formatDate(c.paymentDate)}</td>
                    <td className="table-cell font-mono text-surface-600">{c.transferReference}</td>
                    <td className="table-cell">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/admin/contributions/${c.id}`}
                        className="btn-secondary text-xs px-2.5 py-1"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: LOANS */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <Card padding="none">
            <div className="p-4 border-b border-surface-200">
              <h3 className="text-sm font-bold text-surface-900">Active & Settled Loans</h3>
            </div>
            {memberLoans.length === 0 ? (
              <div className="p-8 text-center text-xs text-surface-400">
                No active or past loans on record for this member.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50/50">
                      <th className="table-header">Loan Ref</th>
                      <th className="table-header">Disbursed Principal</th>
                      <th className="table-header">Outstanding</th>
                      <th className="table-header">Disbursed Date</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {memberLoans.map((l) => (
                      <tr key={l.id}>
                        <td className="table-cell font-mono font-semibold text-surface-900">{l.ref}</td>
                        <td className="table-cell font-bold">{formatCurrency(l.disbursedAmount)}</td>
                        <td className="table-cell font-bold text-amber-700">
                          {formatCurrency(l.outstandingPrincipal)}
                        </td>
                        <td className="table-cell text-surface-600">
                          {l.disbursementDate ? formatDate(l.disbursementDate) : 'Pending'}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="table-cell text-right">
                          <Link href={`/admin/loans/${l.id}`} className="btn-secondary text-xs px-2.5 py-1">
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card padding="none">
            <div className="p-4 border-b border-surface-200">
              <h3 className="text-sm font-bold text-surface-900">Loan Applications History</h3>
            </div>
            {memberApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-surface-400">
                No loan applications filed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50/50">
                      <th className="table-header">Application Ref</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Requested</th>
                      <th className="table-header">Duration</th>
                      <th className="table-header">Purpose</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {memberApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="table-cell font-mono font-semibold text-surface-900">{app.ref}</td>
                        <td className="table-cell text-surface-600">{formatDate(app.applicationDate)}</td>
                        <td className="table-cell font-bold">{formatCurrency(app.requestedAmount)}</td>
                        <td className="table-cell text-surface-600">{app.repaymentDuration} months</td>
                        <td className="table-cell text-surface-700 max-w-xs truncate">{app.purpose}</td>
                        <td className="table-cell">
                          <StatusBadge status={app.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <Card padding="none">
          <div className="p-4 border-b border-surface-200">
            <h3 className="text-sm font-bold text-surface-900">Immutable Ledger Entries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Reference</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Credit (+)</th>
                  <th className="table-header">Debit (-)</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {memberTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-50/70">
                    <td className="table-cell font-mono font-semibold text-surface-900">{t.ref}</td>
                    <td className="table-cell text-surface-600">{formatDate(t.date)}</td>
                    <td className="table-cell text-surface-800 font-medium">{t.description}</td>
                    <td className="table-cell capitalize">{t.category.replace('_', ' ')}</td>
                    <td className="table-cell font-bold text-emerald-700">
                      {t.credit > 0 ? `+${formatCurrency(t.credit)}` : '—'}
                    </td>
                    <td className="table-cell font-bold text-surface-900">
                      {t.debit > 0 ? `-${formatCurrency(t.debit)}` : '—'}
                    </td>
                    <td className="table-cell">
                      <Badge variant="success">Posted</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      <ConfirmDialog
        open={suspendDialogOpen}
        title={currentStatus === 'active' ? 'Suspend Member Account?' : 'Reactivate Member Account?'}
        message={
          currentStatus === 'active'
            ? `Suspending ${member.fullName}'s account will block new contribution submissions, loan requests, and withdrawals. Existing ledger balances remain intact.`
            : `Reactivating ${member.fullName}'s account will restore normal member permissions and portal access.`
        }
        confirmLabel={currentStatus === 'active' ? 'Confirm Suspension' : 'Reactivate Account'}
        variant={currentStatus === 'active' ? 'danger' : 'accent'}
        onConfirm={handleToggleStatus}
        onCancel={() => setSuspendDialogOpen(false)}
      />
    </div>
  );
}
