'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

export default function AdminLoansPage() {
  const { user } = useAuth();
  const [loansList, setLoansList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'approved' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  useEffect(() => {
    async function loadLoans() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('loans')
          .select('*, profiles:member_id(full_name, member_ref)')
          .order('approved_date', { ascending: false });

        if (!error && data) {
          setLoansList(
            data.map((l) => ({
              id: l.id,
              ref: l.ref,
              memberId: l.member_id,
              memberName: l.profiles?.full_name || 'Member',
              memberRef: l.profiles?.member_ref || 'Pending',
              principalAmount: Number(l.principal_amount),
              disbursedAmount: Number(l.disbursed_amount || 0),
              outstandingPrincipal: Number(l.outstanding_principal),
              tenureMonths: l.repayment_duration_months,
              purpose: l.purpose,
              status: l.status,
              approvedDate: l.approved_date,
              disbursementDate: l.disbursement_date,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching admin loans:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLoans();
  }, [user]);

  const filteredLoans = useMemo(() => {
    return loansList.filter((loan) => {
      const matchesSearch =
        (loan.ref && loan.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (loan.memberName && loan.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (loan.purpose && loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesTab = true;
      if (activeTab === 'active') {
        matchesTab = loan.status === 'disbursed' || loan.status === 'repaying';
      } else if (activeTab === 'completed') {
        matchesTab = loan.status === 'completed' || loan.status === 'repaid';
      } else if (activeTab === 'approved') {
        matchesTab = loan.status === 'approved';
      }

      return matchesSearch && matchesTab;
    });
  }, [loansList, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredLoans.length / pageSize) || 1;
  const paginatedData = filteredLoans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalDisbursed = loansList.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const totalOutstanding = loansList
    .filter((l) => l.status === 'disbursed' || l.status === 'repaying')
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  const activeCount = loansList.filter((l) => l.status === 'disbursed' || l.status === 'repaying').length;
  const approvedUndisbursed = loansList.filter((l) => l.status === 'approved').length;

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
          icon={<Landmark className="h-5 w-5 text-brand-900 dark:text-sky-400" />}
        />
        <StatCard
          title="Total Outstanding Principal"
          value={formatCurrency(totalOutstanding)}
          subtitle="Capital currently amortizing"
          icon={<DollarSign className="h-5 w-5 text-amber-700 dark:text-amber-400" />}
          className={totalOutstanding > 0 ? 'border-amber-200 dark:border-amber-900/60' : ''}
        />
        <StatCard
          title="Cumulative Principal Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle="All-time cooperative lending"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
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
          { label: 'Settled / Repaid', value: 'completed' },
          { label: 'All Facilities', value: 'all', count: loansList.length },
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
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading loan book...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon={<Landmark className="h-8 w-8" />}
            title="No loan facilities found"
            description="No loan accounts match the current filter or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Loan Reference</th>
                  <th className="table-header">Member Name</th>
                  <th className="table-header">Disbursed Principal</th>
                  <th className="table-header">Outstanding</th>
                  <th className="table-header">Disbursement Date</th>
                  <th className="table-header">Facility Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedData.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                      {loan.ref}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold text-surface-900 dark:text-white block">
                        {loan.memberName}
                      </span>
                      <span className="text-[10px] text-surface-400 dark:text-slate-400 font-mono">
                        Ref: {loan.memberRef}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-xs text-surface-900 dark:text-white">
                      {formatCurrency(loan.disbursedAmount)}
                    </td>
                    <td className="table-cell font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formatCurrency(loan.outstandingPrincipal)}
                    </td>
                    <td className="table-cell text-xs text-surface-600 dark:text-slate-300">
                      {loan.disbursementDate ? formatDate(loan.disbursementDate) : 'Pending Disbursement'}
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
                        {loan.status === 'approved' ? 'Disburse Payout' : 'Manage'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredLoans.length > pageSize && (
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
