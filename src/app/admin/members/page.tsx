'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Eye,
  Shield,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  ArrowRight,
} from 'lucide-react';
import { members, getMemberSavings } from '@/lib/mock-data';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
  Avatar,
} from '@/components/ui/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { User } from '@/lib/types';

export default function AdminMembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = members.filter((m) => m.status === 'active').length;
  const suspendedCount = members.filter((m) => m.status === 'suspended').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cooperative Member Roster"
        description="Comprehensive member register with live regular and special savings portfolio balances."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Members"
          value={activeCount.toString()}
          subtitle="Fully verified & contributing"
          icon={<UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Pending Approval"
          value={pendingCount.toString()}
          subtitle="New registrations"
          icon={<Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        />
        <StatCard
          title="Suspended Accounts"
          value={suspendedCount.toString()}
          subtitle="Temporarily restricted"
          icon={<UserX className="h-5 w-5 text-red-600 dark:text-red-400" />}
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
              placeholder="Search by member name, email, member ID (DBM-xxxx), or phone..."
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Active Members', value: 'active' },
              { label: 'Suspended Accounts', value: 'suspended' },
              { label: 'Pending Onboarding', value: 'pending' },
            ]}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Members Table */}
      <Card padding="none">
        {paginatedMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No members found"
            description="No cooperative member records match your query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Member ID</th>
                  <th className="table-header">Full Name & Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Registration</th>
                  <th className="table-header">Regular Savings</th>
                  <th className="table-header">Special Savings</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {paginatedMembers.map((member) => {
                  const savings = getMemberSavings(member.id);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors"
                    >
                      <td className="table-cell font-mono text-xs font-bold text-surface-900 dark:text-white">
                        {member.memberRef}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.fullName} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-surface-900 dark:text-white leading-tight">
                              {member.fullName}
                            </p>
                            <p className="text-[11px] text-surface-500 dark:text-slate-400 leading-tight">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-xs text-surface-600 dark:text-slate-300 font-mono">
                        {member.phone}
                      </td>
                      <td className="table-cell text-xs text-surface-500 dark:text-slate-400">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="table-cell font-bold text-xs text-surface-900 dark:text-white">
                        {formatCurrency(savings.regularSavings)}
                      </td>
                      <td className="table-cell font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(savings.specialSavings)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
