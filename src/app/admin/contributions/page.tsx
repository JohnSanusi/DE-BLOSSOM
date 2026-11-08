'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
} from 'lucide-react';
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
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function AdminContributionsPage() {
  const { user } = useAuth();
  const [contributionsList, setContributionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  useEffect(() => {
    async function loadContributions() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contributions')
          .select('*, profiles:member_id(full_name, member_ref)')
          .order('submission_date', { ascending: false });

        if (!error && data) {
          setContributionsList(
            data.map((c) => ({
              id: c.id,
              ref: c.ref,
              memberId: c.member_id,
              memberName: c.profiles?.full_name || c.sender_name || 'Member',
              memberRef: c.profiles?.member_ref || 'Pending',
              amount: Number(c.amount),
              type: c.type,
              status: c.status,
              paymentDate: c.payment_date,
              transferReference: c.transfer_reference || c.ref,
              receiptUrl: c.receipt_url,
              submissionDate: c.submission_date,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching admin contributions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContributions();
  }, [user]);

  const filteredContributions = useMemo(() => {
    return contributionsList.filter((c) => {
      const matchesSearch =
        (c.ref && c.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.memberName && c.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.transferReference && c.transferReference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTab = activeTab === 'all' || c.status === activeTab;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;

      return matchesSearch && matchesTab && matchesType;
    });
  }, [contributionsList, searchTerm, activeTab, typeFilter]);

  const totalPages = Math.ceil(filteredContributions.length / pageSize) || 1;
  const paginatedData = filteredContributions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = contributionsList.filter((c) => c.status === 'pending').length;
  const approvedCount = contributionsList.filter((c) => c.status === 'approved').length;
  const rejectedCount = contributionsList.filter((c) => c.status === 'rejected').length;

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
          icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={pendingCount > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20' : ''}
        />
        <StatCard
          title="Approved Ledger Contributions"
          value={approvedCount.toString()}
          subtitle="Posted into members equity"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Rejected Submissions"
          value={rejectedCount.toString()}
          subtitle="Mismatched or invalid"
          icon={<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
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
          { label: 'All Submissions', value: 'all', count: contributionsList.length },
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
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading contribution records...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="h-8 w-8" />}
            title="No contribution records found"
            description="No submissions match the selected tab or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
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
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                      {c.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 dark:text-white block">
                        {c.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 dark:text-slate-400 font-mono">
                        Ref: {c.memberRef}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge variant={c.type === 'regular' ? 'default' : 'info'}>
                        {c.type === 'regular' ? 'Regular' : 'Special'}
                      </Badge>
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900 dark:text-white">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">
                      {formatDate(c.paymentDate)}
                    </td>
                    <td className="table-cell font-mono text-xs text-surface-600 dark:text-slate-400">
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

        {!loading && filteredContributions.length > pageSize && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
}
