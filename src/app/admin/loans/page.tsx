'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { loans } from '@/lib/mock-data';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Badge,
  SearchInput,
  Select,
  Pagination,
  Tabs,
  EmptyState,
} from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LoanStatus } from '@/lib/types';

export default function AdminLoansPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'repaid' | 'approved' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (activeTab === 'active') {
        matchesTab = loan.status === 'disbursed' || loan.status === 'repaying';
      } else if (activeTab === 'repaid') {
        matchesTab = loan.status === 'repaid';
      } else if (activeTab === 'approved') {
        matchesTab = loan.status === 'approved';
      }

      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredLoans.length / pageSize);
  const paginatedData = filteredLoans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalDisbursed = loans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const totalOutstanding = loans
    .filter((l) => l.status === 'disbursed' || l.status === 'repaying')
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  const activeCount = loans.filter((l) => l.status === 'disbursed' || l.status === 'repaying').length;
  const approvedUndisbursed = loans.filter((l) => l.status === 'approved').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Loans Management"
        description="Monitor outstanding principal balances, disbursements, and repayment schedules across the cooperative loan book."
      />

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Loan Facilities"
          value={activeCount.toString()}
          subtitle={`${approvedUndisbursed} approved awaiting disbursement`}
          icon={<Landmark className="h-5 w-5 text-brand-900" />}
        />
        <StatCard
          title="Total Outstanding Principal"
          value={formatCurrency(totalOutstanding)}
          subtitle="Capital currently amortizing"
          icon={<DollarSign className="h-5 w-5 text-amber-700" />}
          className={totalOutstanding > 0 ? 'border-amber-200' : ''}
        />
        <StatCard
          title="Cumulative Principal Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle="All-time cooperative lending"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(v) => {
          setActiveTab(v as typeof activeTab);
          setCurrentPage(1);
        }}
        tabs={[
          { label: 'Active (Amortizing)', value: 'active', count: activeCount },
          { label: 'Approved (Pending Payout)', value: 'approved', count: approvedUndisbursed },
          { label: 'Settled / Repaid', value: 'repaid', count: loans.filter((l) => l.status === 'repaid').length },
          { label: 'All Facilities', value: 'all', count: loans.length },
        ]}
      />

      {/* Search */}
      <Card padding="sm">
        <SearchInput
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setCurrentPage(1);
          }}
          placeholder="Search by loan reference (LN-xxxx), member name, or purpose..."
        />
      </Card>

      {/* Loans Table */}
      <Card padding="none">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<Landmark className="h-8 w-8" />}
            title="No loan facilities found"
            description="No loan facilities match your selected criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Loan Reference</th>
                  <th className="table-header">Member Name</th>
                  <th className="table-header">Disbursed Principal</th>
                  <th className="table-header">Outstanding</th>
                  <th className="table-header">Disbursement Date</th>
                  <th className="table-header">Facility Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {paginatedData.map((loan) => (
                  <tr key={loan.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900">
                      {loan.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 block">
                        {loan.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 font-mono">
                        {loan.memberId}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900">
                      {loan.disbursedAmount > 0
                        ? formatCurrency(loan.disbursedAmount)
                        : `${formatCurrency(loan.principalAmount)} (Approved)`}
                    </td>
                    <td className="table-cell font-bold text-xs text-amber-700">
                      {formatCurrency(loan.outstandingPrincipal)}
                    </td>
                    <td className="table-cell text-xs text-surface-600">
                      {loan.disbursementDate ? formatDate(loan.disbursementDate) : 'Not Disbursed'}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/admin/loans/${loan.id}`}
                        className={`text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center gap-1 ${
                          loan.status === 'approved'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            : 'btn-secondary'
                        }`}
                      >
                        {loan.status === 'approved' ? 'Disburse' : 'Manage'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
