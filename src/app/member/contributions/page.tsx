'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  PlusCircle,
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  CreditCard,
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
  EmptyState,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Contribution } from '@/lib/types';

export default function MemberContributionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContribution, setSelectedContribution] = useState<any | null>(null);
  const [contributionsList, setContributionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const pageSize = 6;

  useEffect(() => {
    async function loadContributions() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contributions')
          .select('*')
          .eq('member_id', user.id)
          .order('submission_date', { ascending: false });

        if (!error && data) {
          setContributionsList(
            data.map((c) => ({
              id: c.id,
              ref: c.ref,
              memberId: c.member_id,
              amount: Number(c.amount),
              type: c.type,
              status: c.status,
              paymentMethod: 'bank_transfer',
              transferReference: c.transfer_reference || c.ref,
              senderName: c.sender_name || 'Member',
              paymentDate: c.payment_date,
              receiptUrl: c.receipt_url,
              remarks: c.rejection_reason || c.remarks || '',
              reviewedByName: null,
              reviewedAt: c.verified_at || null,
              createdAt: c.submission_date,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching contributions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContributions();
  }, [user]);

  // Filter contributions belonging to this member
  const memberContributions = useMemo(() => {
    return contributionsList.filter((c) => {
      const matchesSearch =
        c.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.transferReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.remarks && c.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [contributionsList, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(memberContributions.length / pageSize);
  const paginatedData = memberContributions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const approvedTotal = contributionsList
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingCount = contributionsList.filter(
    (c) => c.status === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contribution History"
        description="All payment submissions made to the cooperative official bank account. Only approved contributions enter your financial ledger."
        actions={
          <Link href="/member/contributions/new" className="btn-primary text-xs flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Submit Payment Proof
          </Link>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Approved Contributions"
          value={formatCurrency(approvedTotal)}
          subtitle="Directly credited to ledger"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Pending Verification"
          value={`${pendingCount} submission${pendingCount === 1 ? '' : 's'}`}
          subtitle="Does not count toward balance yet"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Total Submissions"
          value={`${contributionsList.length} record${contributionsList.length === 1 ? '' : 's'}`}
          subtitle="Lifetime payment submissions"
          icon={<HandCoins className="h-5 w-5 text-brand-800" />}
        />
      </div>

      {/* Search and Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              placeholder="Search reference, bank transfer code, notes..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Approved Only', value: 'approved' },
                { label: 'Pending Only', value: 'pending' },
                { label: 'Rejected Only', value: 'rejected' },
              ]}
              className="w-full sm:w-40"
            />

            <Select
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Types', value: 'all' },
                { label: 'Regular Savings', value: 'regular' },
                { label: 'Special Savings', value: 'special' },
              ]}
              className="w-full sm:w-44"
            />
          </div>
        </div>
      </Card>

      {/* Contributions Table */}
      <Card padding="none">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="h-8 w-8" />}
            title="No contributions found"
            description="No contribution submissions match your current search filters."
            action={
              <Link href="/member/contributions/new" className="btn-secondary text-xs">
                Submit a Contribution
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Reference</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Payment Date</th>
                  <th className="table-header">Bank Ref</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {paginatedData.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContribution(c)}
                    className="hover:bg-surface-50/70 cursor-pointer transition-colors"
                  >
                    <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                      {c.ref}
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
                    <td className="table-cell font-mono text-xs text-surface-500">
                      {c.transferReference}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContribution(c);
                        }}
                        className="btn-ghost text-xs p-1.5"
                        title="View details"
                      >
                        <Eye className="h-4 w-4 text-surface-500 hover:text-brand-900" />
                      </button>
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

      {/* Contribution Detail Modal */}
      {selectedContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedContribution(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-modal border border-surface-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-surface-400">Contribution Receipt</span>
                <h3 className="text-base font-bold text-surface-900 font-mono">
                  {selectedContribution.ref}
                </h3>
              </div>
              <StatusBadge status={selectedContribution.status} />
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-surface-400 block text-[11px]">Savings Category</span>
                  <span className="font-semibold text-surface-900 capitalize">
                    {selectedContribution.type} Savings
                  </span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[11px]">Paid Amount</span>
                  <span className="font-bold text-base text-brand-900">
                    {formatCurrency(selectedContribution.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[11px]">Payment Date</span>
                  <span className="font-medium text-surface-800">
                    {formatDate(selectedContribution.paymentDate)}
                  </span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[11px]">Bank Transfer Code</span>
                  <span className="font-mono font-medium text-surface-800">
                    {selectedContribution.transferReference}
                  </span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[11px]">Submission Date</span>
                  <span className="text-surface-600">
                    {formatDateTime(selectedContribution.submissionDate)}
                  </span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[11px]">Ledger Effect</span>
                  <span className="font-medium text-surface-800">
                    {selectedContribution.status === 'approved' ? (
                      <span className="text-emerald-700">Posted to ledger</span>
                    ) : (
                      <span className="text-amber-700">No balance impact</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Verification Info */}
              {selectedContribution.status === 'approved' && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <p className="font-semibold">Verified by Administrator</p>
                  <p className="mt-0.5">
                    Verified by {selectedContribution.verifiedBy || 'Administrator'} on{' '}
                    {selectedContribution.verifiedAt
                      ? formatDateTime(selectedContribution.verifiedAt)
                      : 'N/A'}
                    .
                  </p>
                  {selectedContribution.remarks && (
                    <p className="mt-1 text-emerald-700 font-medium">
                      Remarks: &quot;{selectedContribution.remarks}&quot;
                    </p>
                  )}
                </div>
              )}

              {selectedContribution.status === 'rejected' && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  <p className="font-semibold">Submission Rejected</p>
                  <p className="mt-0.5 text-red-700">
                    Reason: {selectedContribution.remarks || 'Receipt could not be reconciled with cooperative bank statements.'}
                  </p>
                </div>
              )}

              {selectedContribution.status === 'pending' && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Awaiting Bank Reconciliation</p>
                    <p className="mt-0.5 text-amber-700">
                      An administrator will cross-reference your transfer code with official cooperative bank statements. Pending contributions never increase savings balances.
                    </p>
                  </div>
                </div>
              )}

              {/* Receipt preview box */}
              <div className="border border-surface-200 rounded-xl p-4 bg-surface-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-surface-900">
                      transfer_receipt_{selectedContribution.transferReference}.pdf
                    </p>
                    <p className="text-[10px] text-surface-400">PDF Document • 428 KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Demo: Downloading payment proof receipt.')}
                  className="btn-secondary text-xs p-2 flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Receipt
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedContribution(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
