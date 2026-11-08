'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  PiggyBank,
  Sparkles,
  Landmark,
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Lock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Tabs,
  Badge,
  Avatar,
  ConfirmDialog,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { AccountStatus } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminMemberDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const memberId = resolvedParams.id;
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'loans' | 'transactions'>('overview');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [member, setMember] = useState<any>(null);
  const [memberContribs, setMemberContribs] = useState<any[]>([]);
  const [memberLoans, setMemberLoans] = useState<any[]>([]);
  const [memberTxns, setMemberTxns] = useState<any[]>([]);

  useEffect(() => {
    async function loadMemberDetail() {
      if (!user) return;
      try {
        const supabase = createClient();
        const [summaryRes, profileRes, contribsRes, loansRes, txnsRes] = await Promise.all([
          supabase
            .from('member_financial_summary')
            .select('*')
            .eq('member_id', memberId)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('*')
            .eq('id', memberId)
            .maybeSingle(),
          supabase
            .from('contributions')
            .select('*')
            .eq('member_id', memberId)
            .order('submission_date', { ascending: false }),
          supabase
            .from('loans')
            .select('*')
            .eq('member_id', memberId)
            .order('approved_date', { ascending: false }),
          supabase
            .from('transactions')
            .select('*')
            .eq('member_id', memberId)
            .order('posting_date', { ascending: false }),
        ]);

        const profileData = profileRes.data || {};
        const summaryData = summaryRes.data || {};

        if (profileRes.data || summaryRes.data) {
          setMember({
            id: memberId,
            fullName: summaryData.full_name || profileData.full_name || 'Member',
            email: summaryData.email || profileData.email || '',
            phone: summaryData.phone || profileData.phone || 'N/A',
            memberRef: summaryData.member_ref || profileData.member_ref || 'Pending',
            status: (profileData.status || summaryData.status || 'active') as AccountStatus,
            role: profileData.role || summaryData.role || 'member',
            createdAt: profileData.created_at || new Date().toISOString(),
            regularSavings: Number(summaryData.regular_savings || 0),
            specialSavings: Number(summaryData.special_savings || 0),
            totalSavings: Number(summaryData.total_savings || 0),
            outstandingPrincipal: Number(summaryData.outstanding_loan_principal || 0),
          });
        }

        if (contribsRes.data) {
          setMemberContribs(
            contribsRes.data.map((c) => ({
              id: c.id,
              ref: c.ref,
              amount: Number(c.amount),
              type: c.type,
              status: c.status,
              paymentDate: c.payment_date,
              transferReference: c.transfer_reference || c.ref,
            }))
          );
        }

        if (loansRes.data) {
          setMemberLoans(
            loansRes.data.map((l) => ({
              id: l.id,
              ref: l.ref,
              principalAmount: Number(l.principal_amount),
              disbursedAmount: Number(l.disbursed_amount || l.principal_amount),
              outstandingPrincipal: Number(l.outstanding_principal),
              purpose: l.purpose,
              status: l.status,
              approvedDate: l.approved_date,
            }))
          );
        }

        if (txnsRes.data) {
          setMemberTxns(
            txnsRes.data.map((t) => ({
              id: t.id,
              ref: t.ref,
              category: t.category,
              type: t.type,
              description: t.description,
              credit: Number(t.credit),
              debit: Number(t.debit),
              postingDate: t.posting_date,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching member details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMemberDetail();
  }, [user, memberId]);

  const handleToggleStatus = async () => {
    if (!member) return;
    const nextStatus: AccountStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;

      setMember((prev: any) => ({ ...prev, status: nextStatus }));
      setSuspendDialogOpen(false);
      addToast(
        'info',
        'Account Status Updated',
        `Member account is now ${nextStatus.toUpperCase()}.`
      );
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err?.message || 'Could not update status');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-surface-400">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        <p className="text-xs">Loading member profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-12 text-center space-y-4">
        <Users className="h-12 w-12 text-surface-300 dark:text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">Member Not Found</h2>
        <p className="text-xs text-surface-500 dark:text-slate-400 max-w-sm mx-auto">
          The member profile does not exist in the cooperative directory.
        </p>
        <Link href="/admin/members" className="btn-primary text-xs inline-flex">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/members" className="btn-ghost p-2 text-surface-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={member.fullName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-surface-900 dark:text-white">{member.fullName}</h1>
                <StatusBadge status={member.status} />
              </div>
              <p className="font-mono text-xs text-brand-900 dark:text-emerald-400 font-semibold mt-0.5">
                {member.memberRef} • {member.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSuspendDialogOpen(true)}
            className={member.status === 'active' ? 'btn-danger text-xs' : 'btn-primary text-xs'}
          >
            {member.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
          </button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Regular Savings"
          value={formatCurrency(member.regularSavings)}
          subtitle="Non-withdrawable equity"
          icon={<PiggyBank className="h-5 w-5 text-brand-800 dark:text-sky-400" />}
        />
        <StatCard
          title="Special Savings"
          value={formatCurrency(member.specialSavings)}
          subtitle="Voluntary flex balance"
          icon={<Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(member.totalSavings)}
          subtitle="Combined capital"
          icon={<CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <StatCard
          title="Outstanding Loan"
          value={formatCurrency(member.outstandingPrincipal)}
          subtitle="Active amortization"
          icon={<Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          className={member.outstandingPrincipal > 0 ? 'border-amber-200 dark:border-amber-900/60' : ''}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Member Overview' },
          { id: 'contributions', label: `Contributions (${memberContribs.length})` },
          { id: 'loans', label: `Loans (${memberLoans.length})` },
          { id: 'transactions', label: `Transactions (${memberTxns.length})` },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Contact & Account Details</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Official Full Name</span>
                <span className="font-semibold text-surface-900 dark:text-white">{member.fullName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Email Address</span>
                <span className="font-semibold text-surface-900 dark:text-white">{member.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Phone Number</span>
                <span className="font-mono font-semibold text-surface-900 dark:text-white">{member.phone}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Member Reference</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{member.memberRef}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-surface-500 dark:text-slate-400">Registration Date</span>
                <span className="font-semibold text-surface-900 dark:text-white">{formatDate(member.createdAt)}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Account Standing & Audit</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Membership Role</span>
                <span className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{member.role}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Account Standing</span>
                <StatusBadge status={member.status} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-darkSurface-border">
                <span className="text-surface-500 dark:text-slate-400">Total Approved Contributions</span>
                <span className="font-semibold text-surface-900 dark:text-white">{memberContribs.length} submissions</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-surface-500 dark:text-slate-400">Active Loan Facilities</span>
                <span className="font-semibold text-surface-900 dark:text-white">{memberLoans.length} records</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'contributions' && (
        <Card padding="none">
          {memberContribs.length === 0 ? (
            <div className="py-12 text-center text-xs text-surface-400">No contributions recorded for this member.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                    <th className="table-header">Reference</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Payment Date</th>
                    <th className="table-header">Bank Reference</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border text-xs">
                  {memberContribs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover">
                      <td className="table-cell font-mono font-semibold">{c.ref}</td>
                      <td className="table-cell capitalize">{c.type}</td>
                      <td className="table-cell font-bold">{formatCurrency(c.amount)}</td>
                      <td className="table-cell">{formatDate(c.paymentDate)}</td>
                      <td className="table-cell font-mono text-surface-500">{c.transferReference}</td>
                      <td className="table-cell"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'loans' && (
        <Card padding="none">
          {memberLoans.length === 0 ? (
            <div className="py-12 text-center text-xs text-surface-400">No loan records for this member.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                    <th className="table-header">Reference</th>
                    <th className="table-header">Purpose</th>
                    <th className="table-header">Disbursed Principal</th>
                    <th className="table-header">Outstanding</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border text-xs">
                  {memberLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover">
                      <td className="table-cell font-mono font-semibold">{l.ref}</td>
                      <td className="table-cell">{l.purpose}</td>
                      <td className="table-cell font-bold">{formatCurrency(l.disbursedAmount)}</td>
                      <td className="table-cell font-bold text-amber-600">{formatCurrency(l.outstandingPrincipal)}</td>
                      <td className="table-cell">{formatDate(l.approvedDate)}</td>
                      <td className="table-cell"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card padding="none">
          {memberTxns.length === 0 ? (
            <div className="py-12 text-center text-xs text-surface-400">No ledger transactions posted for this member.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                    <th className="table-header">Reference</th>
                    <th className="table-header">Description</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Credit (+)</th>
                    <th className="table-header">Debit (-)</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border text-xs">
                  {memberTxns.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover">
                      <td className="table-cell font-mono font-semibold">{t.ref}</td>
                      <td className="table-cell">{t.description}</td>
                      <td className="table-cell capitalize">{t.category.replace('_', ' ')}</td>
                      <td className="table-cell font-bold text-emerald-600">{t.credit > 0 ? `+${formatCurrency(t.credit)}` : '—'}</td>
                      <td className="table-cell font-bold text-slate-800 dark:text-slate-200">{t.debit > 0 ? `-${formatCurrency(t.debit)}` : '—'}</td>
                      <td className="table-cell">{formatDate(t.postingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Suspend confirmation dialog */}
      <ConfirmDialog
        open={suspendDialogOpen}
        title={member.status === 'active' ? 'Suspend Member Account' : 'Reactivate Member Account'}
        message={
          member.status === 'active'
            ? `Are you sure you want to suspend ${member.fullName}? Suspended members cannot submit new loan requests or payment proofs.`
            : `Reactivate ${member.fullName}'s account to restore full cooperative privileges?`
        }
        confirmLabel={member.status === 'active' ? 'Suspend Account' : 'Reactivate'}
        variant={member.status === 'active' ? 'danger' : 'primary'}
        onConfirm={handleToggleStatus}
        onCancel={() => setSuspendDialogOpen(false)}
      />
    </div>
  );
}
