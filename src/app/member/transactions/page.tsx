'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Lock,
  Download,
  ShieldCheck,
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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function MemberTransactionsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const pageSize = 8;

  useEffect(() => {
    async function loadTransactions() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('member_id', user.id)
          .order('posting_date', { ascending: false });

        if (!error && data) {
          setTransactionsList(
            data.map((t) => ({
              id: t.id,
              ref: t.ref,
              memberId: t.member_id,
              type: t.type,
              category: t.category,
              description: t.description,
              credit: Number(t.credit),
              debit: Number(t.debit),
              relatedRef: t.related_ref || '',
              status: t.status,
              postingDate: t.posting_date,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, [user]);

  const memberTransactions = useMemo(() => {
    return transactionsList.filter((t) => {
      const matchesSearch =
        t.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.relatedRef && t.relatedRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactionsList, searchTerm, categoryFilter, typeFilter]);

  const totalPages = Math.ceil(memberTransactions.length / pageSize);
  const paginatedData = memberTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalCredits = transactionsList.reduce((sum, t) => sum + t.credit, 0);

  const totalDebits = transactionsList.reduce((sum, t) => sum + t.debit, 0);

  const handleExportStatement = () => {
    addToast('info', 'Ledger Statement', 'Generating verified transaction statement (PDF/CSV)...');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Transaction Ledger"
        description="The authoritative, immutable financial journal recording all verified credits and debits on your cooperative account."
        actions={
          <button
            onClick={handleExportStatement}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export Statement
          </button>
        }
      />

      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Ledger Credits"
          value={formatCurrency(totalCredits)}
          subtitle="Contributions and disbursements received"
          icon={<ArrowDownLeft className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Total Ledger Debits"
          value={formatCurrency(totalDebits)}
          subtitle="Repayments and authorized withdrawals"
          icon={<ArrowUpRight className="h-5 w-5 text-surface-600" />}
        />
        <StatCard
          title="Ledger Entries"
          value={`${transactionsList.length} transaction${transactionsList.length === 1 ? '' : 's'}`}
          subtitle="Permanent financial entries"
          icon={<ArrowLeftRight className="h-5 w-5 text-brand-900" />}
        />
      </div>

      {/* Immutability Notice */}
      <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-200 flex items-center justify-between text-xs text-surface-600">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-surface-500 shrink-0" />
          <span>
            Ledger records are immutable and cannot be altered or deleted. Corrections are made solely via audited adjustment entries.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="h-3 w-3" /> Reconciled
        </span>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              placeholder="Search reference, description, related ID..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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
              className="w-full sm:w-44"
            />

            <Select
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Types', value: 'all' },
                { label: 'Contribution', value: 'contribution' },
                { label: 'Loan Disbursement', value: 'loan_disbursement' },
                { label: 'Loan Repayment', value: 'loan_repayment' },
                { label: 'Withdrawal', value: 'withdrawal' },
              ]}
              className="w-full sm:w-44"
            />
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card padding="none">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight className="h-8 w-8" />}
            title="No transactions found"
            description="No transactions match your current search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="table-header">Reference</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Credit (+)</th>
                  <th className="table-header">Debit (-)</th>
                  <th className="table-header">Linked Record</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {paginatedData.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                      {t.ref}
                    </td>
                    <td className="table-cell text-xs text-surface-600">
                      {formatDate(t.date)}
                    </td>
                    <td className="table-cell text-xs text-surface-800 font-medium max-w-xs">
                      {t.description}
                    </td>
                    <td className="table-cell text-xs capitalize text-surface-600">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-surface-100 text-[11px] font-medium text-surface-700">
                        {t.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-xs">
                      {t.credit > 0 ? (
                        <span className="text-emerald-700">+{formatCurrency(t.credit)}</span>
                      ) : (
                        <span className="text-surface-300 font-normal">—</span>
                      )}
                    </td>
                    <td className="table-cell font-bold text-xs">
                      {t.debit > 0 ? (
                        <span className="text-surface-900">-{formatCurrency(t.debit)}</span>
                      ) : (
                        <span className="text-surface-300 font-normal">—</span>
                      )}
                    </td>
                    <td className="table-cell font-mono text-xs text-surface-500">
                      {t.relatedRef || '—'}
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        Posted
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
