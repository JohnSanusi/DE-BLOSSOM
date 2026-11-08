'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Download,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Calendar,
  X,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import {
  Card,
  StatCard,
  PageHeader,
  Badge,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
} from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | '30d' | '90d' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    async function loadTransactions() {
      if (!user) return;
      try {
        const supabase = createClient();
        const [txnsRes, membersRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('*, profiles:member_id(full_name, member_ref)')
            .order('posting_date', { ascending: false }),
          supabase
            .from('profiles')
            .select('id, full_name, member_ref')
            .order('full_name', { ascending: true }),
        ]);

        if (txnsRes.data) {
          setTransactionsList(
            txnsRes.data.map((t) => ({
              id: t.id,
              ref: t.ref,
              memberId: t.member_id,
              memberName: t.profiles?.full_name || 'Member',
              memberRef: t.profiles?.member_ref || 'Pending',
              type: t.type,
              category: t.category,
              description: t.description,
              credit: Number(t.credit),
              debit: Number(t.debit),
              relatedRef: t.related_ref || '',
              sourceRef: t.source_ref || '',
              status: t.status,
              date: t.posting_date,
              postingDate: t.posting_date,
            }))
          );
        }

        if (membersRes.data) {
          setMembersList(membersRes.data);
        }
      } catch (err) {
        console.error('Error fetching admin transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((t) => {
      // 1. Text search
      const matchesSearch =
        (t.ref && t.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.memberName && t.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.relatedRef && t.relatedRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.sourceRef && t.sourceRef.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Category & type & member filters
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesMember = memberFilter === 'all' || t.memberId === memberFilter;

      // 3. Date range filtering
      let matchesDate = true;
      const txnDate = new Date(t.date).getTime();
      const now = new Date().getTime();

      if (datePreset === '30d') {
        matchesDate = txnDate >= now - 30 * 24 * 60 * 60 * 1000;
      } else if (datePreset === '90d') {
        matchesDate = txnDate >= now - 90 * 24 * 60 * 60 * 1000;
      } else if (datePreset === 'this_month') {
        const d = new Date(t.date);
        const today = new Date();
        matchesDate = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      } else if (datePreset === 'custom') {
        if (startDate) {
          matchesDate = matchesDate && txnDate >= new Date(startDate).getTime();
        }
        if (endDate) {
          const endTimestamp = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          matchesDate = matchesDate && txnDate <= endTimestamp;
        }
      }

      return matchesSearch && matchesCategory && matchesType && matchesMember && matchesDate;
    });
  }, [transactionsList, searchTerm, categoryFilter, typeFilter, memberFilter, datePreset, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedData = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalCredits = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
  const totalDebits = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
  const netMovement = totalCredits - totalDebits;

  const isFiltered =
    searchTerm !== '' ||
    categoryFilter !== 'all' ||
    typeFilter !== 'all' ||
    memberFilter !== 'all' ||
    datePreset !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setMemberFilter('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="General Financial Ledger"
          description="Authoritative, append-only financial journal. Records are strictly immutable under cooperative governance."
        />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Append-Only Immutability Active
          </span>
        </div>
      </div>

      {/* Financial Movement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Ledger Credits (+)"
          value={formatCurrency(totalCredits)}
          subtitle={`${filteredTransactions.filter((t) => t.credit > 0).length} cash inflow entries`}
          icon={<ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Total Ledger Debits (-)"
          value={formatCurrency(totalDebits)}
          subtitle={`${filteredTransactions.filter((t) => t.debit > 0).length} cash outflow entries`}
          icon={<ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />}
        />
        <StatCard
          title="Net Cash Movement"
          value={formatCurrency(netMovement)}
          subtitle="Inflows minus outflows"
          icon={<ArrowLeftRight className="h-5 w-5 text-brand-900 dark:text-sky-400" />}
          className={netMovement >= 0 ? '' : 'border-red-200 dark:border-red-900/60'}
        />
      </div>

      {/* Filters Card */}
      <Card padding="sm" className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              placeholder="Search reference (TXN-...), member name, description, or external bank reference..."
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Select
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Categories', value: 'all' },
                { label: 'Regular Savings', value: 'regular_savings' },
                { label: 'Special Savings', value: 'special_savings' },
                { label: 'Loan Book', value: 'loan' },
                { label: 'General Society', value: 'general' },
              ]}
            />

            <Select
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Movement Types', value: 'all' },
                { label: 'Contributions', value: 'contribution' },
                { label: 'Disbursements', value: 'loan_disbursement' },
                { label: 'Repayments', value: 'loan_repayment' },
                { label: 'Withdrawals', value: 'withdrawal' },
              ]}
            />

            <Select
              value={memberFilter}
              onChange={(val) => {
                setMemberFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Members', value: 'all' },
                ...membersList.map((m) => ({
                  label: m.full_name,
                  value: m.id,
                })),
              ]}
            />
          </div>
        </div>

        {/* Date presets & reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-100 dark:border-darkSurface-border text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-surface-500 dark:text-slate-400 text-[11px] font-semibold mr-1">Time Period:</span>
            {(['all', '30d', '90d', 'this_month'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setDatePreset(preset);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  datePreset === preset
                    ? 'bg-brand-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'text-surface-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-darkSurface-hover'
                }`}
              >
                {preset === 'all'
                  ? 'All History'
                  : preset === '30d'
                  ? 'Past 30 Days'
                  : preset === '90d'
                  ? 'Past 90 Days'
                  : 'This Month'}
              </button>
            ))}
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters ({filteredTransactions.length} results)
            </button>
          )}
        </div>
      </Card>

      {/* Ledger Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading immutable ledger...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight className="h-8 w-8" />}
            title="No ledger entries found"
            description="No transactions matched your active filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Posting Date</th>
                  <th className="table-header">Journal Ref</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Description</th>
                  <th className="table-header text-right">Credit (+)</th>
                  <th className="table-header text-right">Debit (-)</th>
                  <th className="table-header">Linked Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300 font-mono whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                      {t.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 dark:text-white block">
                        {t.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 dark:text-slate-400 font-mono">
                        Ref: {t.memberRef}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {t.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="table-cell text-xs text-surface-700 dark:text-slate-300 max-w-sm leading-snug">
                      {t.description}
                    </td>
                    <td className="table-cell text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {t.credit > 0 ? `+${formatCurrency(t.credit)}` : '—'}
                    </td>
                    <td className="table-cell text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {t.debit > 0 ? `-${formatCurrency(t.debit)}` : '—'}
                    </td>
                    <td className="table-cell font-mono text-xs text-surface-500 dark:text-slate-400">
                      {t.relatedRef || t.sourceRef || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredTransactions.length > pageSize && (
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
