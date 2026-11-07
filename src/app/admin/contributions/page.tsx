'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { contributions } from '@/lib/mock-data';
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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { ContributionStatus } from '@/lib/types';

export default function AdminContributionsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const matchesSearch =
        c.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.transferReference.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === 'all' || c.status === activeTab;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;

      return matchesSearch && matchesTab && matchesType;
    });
  }, [searchTerm, activeTab, typeFilter]);

  const totalPages = Math.ceil(filteredContributions.length / pageSize);
  const paginatedData = filteredContributions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = contributions.filter((c) => c.status === 'pending').length;
  const approvedCount = contributions.filter((c) => c.status === 'approved').length;
  const rejectedCount = contributions.filter((c) => c.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contribution Management & Verification"
        description="Review member payment slips against official bank records. Verification posts entries to the financial ledger exactly once."
      />

      {/* Verification Queue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Bank Reconciliation"
          value={pendingCount.toString()}
          subtitle="Awaiting admin check"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          className={pendingCount > 0 ? 'border-amber-300 bg-amber-50/20' : ''}
        />
        <StatCard
          title="Approved Ledger Contributions"
          value={approvedCount.toString()}
          subtitle="Posted into members equity"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Rejected Submissions"
          value={rejectedCount.toString()}
          subtitle="Mismatched or invalid"
          icon={<XCircle className="h-5 w-5 text-red-600" />}
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
          { label: 'Pending Verification', value: 'pending', count: pendingCount },
          { label: 'Approved Entries', value: 'approved', count: approvedCount },
          { label: 'Rejected Submissions', value: 'rejected', count: rejectedCount },
          { label: 'All Submissions', value: 'all', count: contributions.length },
        ]}
      />

      {/* Filter and search */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              placeholder="Search by member name, contribution ID, or bank reference..."
            />
          </div>

          <Select
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All Savings Categories', value: 'all' },
              { label: 'Regular Savings', value: 'regular' },
              { label: 'Special Savings', value: 'special' },
            ]}
            className="w-full sm:w-52"
          />
        </div>
      </Card>

      {/* Contributions Table */}
      <Card padding="none">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="h-8 w-8" />}
            title="No contribution records found"
            description="No submissions match the selected tab or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Reference</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Bank Ref</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900">
                      {c.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 block">
                        {c.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 font-mono">
                        ID: {c.memberId}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge variant={c.type === 'regular' ? 'default' : 'info'}>
                        {c.type === 'regular' ? 'Regular' : 'Special'}
                      </Badge>
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="table-cell text-xs text-surface-600">
                      {formatDate(c.paymentDate)}
                    </td>
                    <td className="table-cell font-mono text-xs text-surface-600">
                      {c.transferReference}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/admin/contributions/${c.id}`}
                        className={`text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center gap-1 ${
                          c.status === 'pending'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                            : 'btn-secondary'
                        }`}
                      >
                        {c.status === 'pending' ? 'Review & Post' : 'View Details'}
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
