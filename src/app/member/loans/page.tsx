'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  currentMember,
  loans,
  loanApplications,
  getMemberSavings,
} from '@/lib/mock-data';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Tabs,
  Badge,
} from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MemberLoansPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'applications'>('active');

  const memberLoans = loans.filter((l) => l.memberId === currentMember.id);
  const memberApplications = loanApplications.filter((la) => la.memberId === currentMember.id);
  const savings = getMemberSavings(currentMember.id);

  const totalBorrowed = memberLoans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const outstandingPrincipal = memberLoans.reduce(
    (sum, l) => sum + l.outstandingPrincipal,
    0
  );
  const activeCount = memberLoans.filter(
    (l) => l.status === 'disbursed' || l.status === 'repaying'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cooperative Loans"
        description="Track your cooperative loan facilities, disbursement status, application history, and principal repayment progress."
        actions={
          <Link href="/member/loans/apply" className="btn-primary text-xs flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Apply for Loan
          </Link>
        }
      />

      {/* 3 Summary Cards with Guided Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Borrowed to Date"
          value={formatCurrency(totalBorrowed)}
          subtitle="Cumulative principal disbursed"
          tooltip="Cumulative Principal: The total amount of cooperative loan funds that have been formally disbursed to your bank account across all time."
          icon={<DollarSign className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
        />
        <StatCard
          title="Outstanding Principal"
          value={formatCurrency(outstandingPrincipal)}
          subtitle={
            outstandingPrincipal > 0
              ? 'Active balance to be amortized'
              : 'All loans settled'
          }
          tooltip="Current Debt Balance: Total unpaid principal. In accordance with cooperative policy, 100% of your verified repayments reduce this principal directly."
          icon={<Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={outstandingPrincipal > 0 ? 'border-amber-200 dark:border-amber-800/60' : ''}
        />
        <StatCard
          title="Active Loan Facilities"
          value={`${activeCount} active loan${activeCount === 1 ? '' : 's'}`}
          subtitle={`${memberApplications.length} total applications filed`}
          tooltip="Active Facilities: Approved applications become active loans only after the treasurer executes the bank transfer disbursement."
          icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      {/* Policy Notice Box */}
      <div className="p-4 rounded-xl bg-surface-100 border border-surface-200 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
        <div className="text-xs text-surface-600 leading-relaxed">
          <span className="font-bold text-surface-900">Cooperative Loan Policy Notice:</span> In
          accordance with cooperative society guidelines, loan interest policy and exact eligibility
          thresholds are governed by the managing committee and are formally determined at approval.
          DE-BLOSSOM does not calculate arbitrary interest figures.
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(val) => setActiveTab(val as 'active' | 'applications')}
        tabs={[
          { label: 'Active & Historical Loans', value: 'active', count: memberLoans.length },
          { label: 'Loan Applications', value: 'applications', count: memberApplications.length },
        ]}
      />

      {/* Tab 1: Loans */}
      {activeTab === 'active' && (
        <Card padding="none">
          <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Loan Facilities</h3>
              <p className="text-xs text-surface-500">
                Disbursed cooperative loans and repayment track record
              </p>
            </div>
          </div>

          {memberLoans.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Landmark className="h-10 w-10 text-surface-300 mx-auto" />
              <p className="text-sm font-semibold text-surface-700">No active or past loans</p>
              <p className="text-xs text-surface-400 max-w-sm mx-auto">
                You have not yet taken a loan from DE-BLOSSOM Cooperative.
              </p>
              <Link href="/member/loans/apply" className="btn-secondary text-xs inline-flex">
                Apply for a Loan
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50/50">
                    <th className="table-header">Reference</th>
                    <th className="table-header">Purpose</th>
                    <th className="table-header">Principal Disbursed</th>
                    <th className="table-header">Outstanding Principal</th>
                    <th className="table-header">Disbursed Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {memberLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                        {loan.ref}
                      </td>
                      <td className="table-cell text-xs text-surface-700 max-w-xs truncate">
                        {loan.purpose}
                      </td>
                      <td className="table-cell font-bold text-xs text-surface-900">
                        {formatCurrency(loan.disbursedAmount)}
                      </td>
                      <td className="table-cell font-bold text-xs text-amber-600 dark:text-amber-400">
                        {formatCurrency(loan.outstandingPrincipal)}
                      </td>
                      <td className="table-cell text-xs text-surface-600">
                        {loan.disbursementDate ? formatDate(loan.disbursementDate) : 'Pending'}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          href={`/member/loans/${loan.id}`}
                          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                        >
                          Details <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Applications */}
      {activeTab === 'applications' && (
        <Card padding="none">
          <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Loan Applications</h3>
              <p className="text-xs text-surface-500">Submitted loan requests and committee review</p>
            </div>
            <Link href="/member/loans/apply" className="text-xs font-semibold text-brand-800 hover:text-brand-950">
              + New Application
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Application Ref</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Requested Amount</th>
                  <th className="table-header">Duration</th>
                  <th className="table-header">Purpose</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Review Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {memberApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                      {app.ref}
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
                    <td className="table-cell text-xs text-surface-500">
                      {app.remarks || (
                        <span className="text-surface-400 italic">Under evaluation</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
