'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  transactions,
  members,
  currentAdmin,
} from '@/lib/mock-data';
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
import type { Transaction } from '@/lib/types';

export default function AdminTransactionsPage() {
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | '30d' | '90d' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Text search
      const matchesSearch =
        t.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          // include end of that day
          const endTimestamp = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          matchesDate = matchesDate && txnDate <= endTimestamp;
        }
      }

      return matchesSearch && matchesCategory && matchesType && matchesMember && matchesDate;
    });
  }, [searchTerm, categoryFilter, typeFilter, memberFilter, datePreset, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
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
    addToast('info', 'Filters Reset', 'Displaying all financial ledger records.');
  };

  const handleExportCSV = (exportMode: 'filtered' | 'all' = 'filtered') => {
    const dataToExport = exportMode === 'all' ? transactions : filteredTransactions;

    if (dataToExport.length === 0) {
      addToast('error', 'Export Failed', 'No ledger records match the active criteria.');
      return;
    }

    const headers = [
      'Transaction Ref',
      'Posting Date',
      'Member Name',
      'Member ID',
      'Type',
      'Category',
      'Description',
      'Credit (NGN)',
      'Debit (NGN)',
      'Related Facility Ref',
      'Source Bank Slip Ref',
      'Journal Status',
    ];

    const rows = dataToExport.map((t) => [
      t.ref,
      t.date,
      `"${t.memberName}"`,
      t.memberId,
      t.type,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.credit,
      t.debit,
      t.relatedRef || '',
      t.sourceRef || '',
      t.status,
    ]);

    const filterDescriptor = exportMode === 'all' ? 'complete_all' : isFiltered ? 'filtered' : 'complete';
    const timestamp = new Date().toISOString().split('T')[0];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `# DE-BLOSSOM COOPERATIVE GENERAL FINANCIAL JOURNAL`,
        `# Export Mode: ${filterDescriptor.toUpperCase()} (${dataToExport.length} entries)`,
        `# Exported By: ${currentAdmin.fullName} on ${new Date().toLocaleString()}`,
        `# Total Credits: NGN ${totalCredits} | Total Debits: NGN ${totalDebits}`,
        '',
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `de_blossom_general_ledger_${filterDescriptor}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(
      'success',
      'Ledger Exported',
      `Exported ${dataToExport.length} journal postings to CSV file.`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Authoritative Financial Ledger"
        description="The permanent, immutable journal of all verified financial debits and credits across the cooperative society."
        actions={
          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Clear all active filters"
              >
                <X className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
            <button
              onClick={() => handleExportCSV('filtered')}
              className="btn-primary text-xs flex items-center gap-2"
              title="Download currently filtered ledger as CSV"
            >
              <Download className="h-4 w-4" />
              Export Journal ({filteredTransactions.length})
            </button>
          </div>
        }
      />

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={isFiltered ? 'Filtered Inflow / Credits' : 'Total Ledger Inflow / Credits'}
          value={formatCurrency(totalCredits)}
          subtitle={`${filteredTransactions.filter((t) => t.credit > 0).length} credit postings`}
          tooltip="Total Verified Credits: Sum of all approved money entering the cooperative ledger across regular savings, special savings, and loan repayments."
          icon={<ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title={isFiltered ? 'Filtered Outflow / Debits' : 'Total Ledger Outflow / Debits'}
          value={formatCurrency(totalDebits)}
          subtitle={`${filteredTransactions.filter((t) => t.debit > 0).length} disbursement debits`}
          tooltip="Total Authorized Outflows: Sum of all verified money leaving the cooperative ledger, including authorized loan disbursements and approved withdrawals."
          icon={<ArrowUpRight className="h-5 w-5 text-surface-600 dark:text-slate-400" />}
        />
        <StatCard
          title={isFiltered ? 'Filtered Net Movement' : 'Total Verified Postings'}
          value={isFiltered ? formatCurrency(netMovement) : `${transactions.length} entries`}
          subtitle={isFiltered ? 'Net balance of current view' : 'All transactions reconciled'}
          tooltip="Immutable Journal: Reconciled postings in the general ledger. Each entry is tied to an audited source payment or disbursement slip."
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      {/* Strict Immutability Notice Banner */}
      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-darkSurface-card border border-emerald-200 dark:border-darkSurface-border text-slate-800 dark:text-slate-200 flex items-start gap-3 shadow-sm transition-colors">
        <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong className="text-emerald-950 dark:text-white">Strict Ledger Immutability Architecture:</strong> The
          financial ledger cannot be modified or deleted via ordinary member or administrator
          interfaces. Every entry represents an immutable financial movement. Corrections must be
          executed exclusively through controlled, audited adjustment transactions.
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <Card padding="sm" className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              setCurrentPage(1);
            }}
            placeholder="Search reference, note, ID..."
          />

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
              { label: 'Loan Facility', value: 'loan' },
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All Transaction Types', value: 'all' },
              { label: 'Member Contribution', value: 'contribution' },
              { label: 'Loan Disbursement', value: 'loan_disbursement' },
              { label: 'Loan Repayment', value: 'loan_repayment' },
              { label: 'Special Withdrawal', value: 'withdrawal' },
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
              ...members.map((m) => ({ label: m.fullName, value: m.id })),
            ]}
          />
        </div>

        {/* Date Filter Presets Row */}
        <div className="pt-2 border-t border-surface-100 dark:border-darkSurface-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-600 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Date Preset:
            </span>
            <div className="inline-flex rounded-lg border border-surface-200 dark:border-darkSurface-border p-0.5 bg-surface-50 dark:bg-darkSurface-bg">
              {(
                [
                  { id: 'all', label: 'All Time' },
                  { id: 'this_month', label: 'This Month' },
                  { id: '30d', label: 'Last 30 Days' },
                  { id: '90d', label: 'Last 90 Days' },
                  { id: 'custom', label: 'Custom Range' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setDatePreset(preset.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    datePreset === preset.id
                      ? 'bg-white dark:bg-darkSurface-hover text-surface-900 dark:text-white shadow-sm font-semibold'
                      : 'text-surface-600 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Pickers (visible if custom selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field text-xs py-1 px-2.5 w-36"
                placeholder="From date"
              />
              <span className="text-surface-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field text-xs py-1 px-2.5 w-36"
                placeholder="To date"
              />
            </div>
          )}

          {/* Quick Active Filter Pill */}
          <div className="text-xs text-surface-500 dark:text-slate-400">
            Showing <strong className="text-surface-900 dark:text-white">{filteredTransactions.length}</strong> of{' '}
            {transactions.length} entries
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card padding="none">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight className="h-8 w-8" />}
            title="No ledger entries found"
            description="No transaction journal entries match your active search filters."
            action={
              isFiltered ? (
                <button onClick={resetFilters} className="btn-secondary text-xs">
                  Reset All Filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Transaction Ref</th>
                  <th className="table-header">Posting Date</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Credit (+)</th>
                  <th className="table-header">Debit (-)</th>
                  <th className="table-header">Source Ref</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono font-bold text-surface-900 dark:text-white">{t.ref}</td>
                    <td className="table-cell text-surface-600 dark:text-slate-400">{formatDate(t.date)}</td>
                    <td className="table-cell font-semibold text-surface-900 dark:text-white">{t.memberName}</td>
                    <td className="table-cell capitalize">
                      <Badge
                        variant={
                          t.category === 'regular_savings'
                            ? 'default'
                            : t.category === 'special_savings'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {t.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="table-cell text-surface-700 dark:text-slate-300 max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="table-cell font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {t.credit > 0 ? `+${formatCurrency(t.credit)}` : '—'}
                    </td>
                    <td className="table-cell font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {t.debit > 0 ? `-${formatCurrency(t.debit)}` : '—'}
                    </td>
                    <td className="table-cell font-mono text-[11px] text-surface-500 dark:text-slate-400">
                      {t.sourceRef || t.relatedRef || '—'}
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                        {t.status}
                      </span>
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
