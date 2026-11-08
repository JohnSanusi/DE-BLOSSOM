'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PiggyBank,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  FileCheck,
} from 'lucide-react';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Tabs,
  Badge,
  ConfirmDialog,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, formatDateTime, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { WithdrawalRequest } from '@/lib/types';

export default function MemberSavingsPage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'regular' | 'special'>('regular');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [contributionsList, setContributionsList] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const [contribRes, withRes] = await Promise.all([
          supabase
            .from('contributions')
            .select('*')
            .eq('member_id', user.id)
            .order('submission_date', { ascending: false }),
          supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('member_id', user.id)
            .order('request_date', { ascending: false }),
        ]);

        if (!contribRes.error && contribRes.data) {
          setContributionsList(
            contribRes.data.map((c) => ({
              id: c.id,
              ref: c.ref,
              amount: Number(c.amount),
              type: c.type,
              status: c.status,
              paymentDate: c.payment_date,
              transferReference: c.transfer_reference || c.ref,
              reviewedByName: 'Administrator',
            }))
          );
        }

        if (!withRes.error && withRes.data) {
          setWithdrawals(
            withRes.data.map((w) => ({
              id: w.id,
              ref: w.ref,
              memberId: w.member_id,
              memberName: profile?.full_name || 'Member',
              amount: Number(w.amount),
              savingsType: 'special' as const,
              status: w.status,
              reason: w.reason || '',
              requestDate: w.request_date,
              createdAt: w.request_date,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching savings data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Compute balances directly from live contributions
  const memberRegularContribs = contributionsList.filter((c) => c.type === 'regular');
  const memberSpecialContribs = contributionsList.filter((c) => c.type === 'special');

  const regularSavingsBalance = memberRegularContribs
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);

  const specialSavingsApproved = memberSpecialContribs
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);

  const specialWithdrawalsApproved = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  const specialSavingsBalance = Math.max(0, specialSavingsApproved - specialWithdrawalsApproved);

  const savings = {
    regularSavings: regularSavingsBalance,
    specialSavings: specialSavingsBalance,
    totalSavings: regularSavingsBalance + specialSavingsBalance,
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount of at least ₦1,000.');
      addToast('error', 'Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (amountNum > savings.specialSavings) {
      setWithdrawError(`Exceeds maximum available balance of ${formatCurrency(savings.specialSavings)}.`);
      addToast(
        'error',
        'Insufficient Balance',
        `You can only withdraw up to ${formatCurrency(savings.specialSavings)} from your special savings.`
      );
      return;
    }

    setWithdrawError('');
    setWithdrawSubmitting(true);
    setTimeout(() => {
      const newRequest: WithdrawalRequest = {
        id: `wr_${Date.now()}`,
        ref: generateRef('WR'),
        memberId: user?.id || '',
        memberName: profile?.full_name || user?.user_metadata?.full_name || 'Member',
        amount: amountNum,
        reason: withdrawReason || 'Member requested withdrawal',
        status: 'pending',
        requestDate: new Date().toISOString(),
      };

      setWithdrawals((prev) => [newRequest, ...prev]);
      setWithdrawSubmitting(false);
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawReason('');

      addToast(
        'success',
        'Withdrawal Request Submitted',
        'Your special savings withdrawal request has been submitted for administrative approval.'
      );
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cooperative Savings"
        description="DE-BLOSSOM maintains distinct regular and special savings accounts to protect your cooperative equity and withdrawal flexibility."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/member/contributions/new" className="btn-primary text-xs">
              Make Deposit / Contribution
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(val) => setActiveTab(val as 'regular' | 'special')}
        tabs={[
          { label: 'Regular Savings', value: 'regular', count: memberRegularContribs.length },
          { label: 'Special Savings', value: 'special', count: memberSpecialContribs.length },
        ]}
      />

      {/* REGULAR SAVINGS VIEW */}
      {activeTab === 'regular' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Approved Regular Savings"
              value={formatCurrency(savings.regularSavings)}
              subtitle="Current verified balance"
              tooltip="Non-Withdrawable Equity: Regular savings represent your capital base in the cooperative society. It forms the financial foundation for loan assessments."
              icon={<PiggyBank className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
              className="border-emerald-200 dark:border-emerald-900/40"
            />
            <StatCard
              title="Total Approved Regular Deposits"
              value={`${memberRegularContribs.filter((c) => c.status === 'approved').length} contributions`}
              subtitle="Verified monthly equity"
              icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <StatCard
              title="Pending Verification"
              value={`${memberRegularContribs.filter((c) => c.status === 'pending').length} pending`}
              subtitle="Awaiting admin confirmation"
              tooltip="Held in Verification Queue: Transfer receipts you have submitted that are awaiting treasurer reconciliation with corporate bank statements."
              icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            />
          </div>

          {/* Regular Savings Rules Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-darkSurface-card border border-blue-200 dark:border-darkSurface-border flex items-start gap-3 transition-colors">
            <Info className="h-5 w-5 text-blue-700 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-slate-200 leading-relaxed">
              <span className="font-bold">Understanding Regular Savings:</span> Regular savings
              are member equity contributions that determine your standing and eligibility for
              cooperative loans. These funds are not freely withdrawable on demand. Loan eligibility
              thresholds and policy limits will be officially defined by the cooperative management.
            </div>
          </div>

          {/* Regular Contributions Table */}
          <Card padding="none">
            <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-surface-900">Regular Savings History</h3>
                <p className="text-xs text-surface-500">Record of all monthly regular contributions</p>
              </div>
              <Link href="/member/contributions/new" className="text-xs font-semibold text-brand-800 hover:text-brand-950">
                + New Contribution
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50/50">
                    <th className="table-header">Reference</th>
                    <th className="table-header">Payment Date</th>
                    <th className="table-header">Transfer Ref</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Verified Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {memberRegularContribs.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                        {c.ref}
                      </td>
                      <td className="table-cell text-xs text-surface-600">{formatDate(c.paymentDate)}</td>
                      <td className="table-cell font-mono text-xs text-surface-600">{c.transferReference}</td>
                      <td className="table-cell font-bold text-xs text-surface-900">
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="table-cell text-xs text-surface-500">
                        {c.status === 'approved' && c.verifiedBy ? (
                          <span>Verified by {c.verifiedBy}</span>
                        ) : c.status === 'rejected' ? (
                          <span className="text-red-600 font-medium">{c.remarks || 'Rejected'}</span>
                        ) : (
                          <span className="text-amber-600">Awaiting admin review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SPECIAL SAVINGS VIEW */}
      {activeTab === 'special' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Available Special Savings"
              value={formatCurrency(savings.specialSavings)}
              subtitle="Available for authorized withdrawal"
              tooltip="Liquid Personal Savings: Voluntary interest-free deposits that can be freely withdrawn upon submission of an administrative withdrawal request."
              icon={<Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              className="border-emerald-200 dark:border-emerald-900/40"
            />
            <StatCard
              title="Total Special Deposits"
              value={formatCurrency(
                memberSpecialContribs
                  .filter((c) => c.status === 'approved')
                  .reduce((sum, c) => sum + c.amount, 0)
              )}
              subtitle="All-time approved deposits"
              icon={<ArrowDownLeft className="h-5 w-5 text-brand-700" />}
            />
            <StatCard
              title="Approved Withdrawals"
              value={formatCurrency(
                withdrawals
                  .filter((w) => w.status === 'approved' || w.status === 'completed')
                  .reduce((sum, w) => sum + w.amount, 0)
              )}
              subtitle="Processed withdrawals"
              icon={<ArrowUpRight className="h-5 w-5 text-surface-600" />}
            />
          </div>

          {/* Action Header Banner */}
          <div className="card p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-brand-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-medium border border-emerald-500/30 mb-2">
                Interest-Free Facility
              </div>
              <h3 className="text-lg font-bold">Special Savings Withdrawal Facility</h3>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-lg leading-relaxed">
                Special savings are voluntary, interest-free deposits. Members can request withdrawals
                at any time. All withdrawal requests are reviewed by an administrator before disbursement.
              </p>
            </div>
            <button
              onClick={() => setWithdrawModalOpen(true)}
              className="btn-accent shrink-0 text-xs py-2.5 px-4 self-start sm:self-auto"
            >
              Request Withdrawal
            </button>
          </div>

          {/* Two tables: Special Deposits & Withdrawal Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Special Deposits */}
            <Card padding="none">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-surface-900">Special Savings Deposits</h3>
                  <p className="text-xs text-surface-500">Approved and pending deposits</p>
                </div>
              </div>

              <div className="divide-y divide-surface-100">
                {memberSpecialContribs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-surface-400">
                    No special savings deposits recorded yet.
                  </div>
                ) : (
                  memberSpecialContribs.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-mono font-semibold text-surface-900">{c.ref}</p>
                        <p className="text-surface-500 mt-0.5">
                          Paid {formatDate(c.paymentDate)} • Ref: {c.transferReference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-surface-900">{formatCurrency(c.amount)}</p>
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Withdrawal Requests */}
            <Card padding="none">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-surface-900">Withdrawal Requests</h3>
                  <p className="text-xs text-surface-500">History of requested payouts</p>
                </div>
              </div>

              <div className="divide-y divide-surface-100">
                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-surface-400">
                    No withdrawal requests submitted.
                  </div>
                ) : (
                  withdrawals.map((w) => (
                    <div key={w.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-surface-900">{w.ref}</span>
                          <StatusBadge status={w.status} />
                        </div>
                        <p className="text-surface-600 mt-1 line-clamp-1">
                          {w.reason || 'No reason provided'}
                        </p>
                        <p className="text-[11px] text-surface-400 mt-0.5">
                          Requested: {formatDate(w.requestDate)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-surface-900">{formatCurrency(w.amount)}</p>
                        {w.reviewedBy && (
                          <p className="text-[10px] text-surface-400">By {w.reviewedBy}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !withdrawSubmitting && setWithdrawModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-modal border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Request Special Savings Withdrawal</h3>
            <p className="text-xs text-surface-500 mt-1">
              Available Special Savings Balance:{' '}
              <strong className="text-emerald-700 font-semibold">
                {formatCurrency(savings.specialSavings)}
              </strong>
            </p>

            <form onSubmit={handleWithdrawalSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="withdrawAmount" className="label">
                  Withdrawal Amount (₦)
                </label>
                <input
                  id="withdrawAmount"
                  type="number"
                  step="1000"
                  min="1000"
                  max={savings.specialSavings}
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value);
                    if (withdrawError) setWithdrawError('');
                  }}
                  placeholder="e.g. 50000"
                  required
                  className={`input-field ${
                    withdrawError ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''
                  }`}
                />
                {withdrawError ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {withdrawError}
                  </p>
                ) : (
                  <p className="text-[11px] text-surface-400 mt-1">
                    Available balance: {formatCurrency(savings.specialSavings)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="withdrawReason" className="label">
                  Reason for Withdrawal <span className="text-surface-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="withdrawReason"
                  rows={2}
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="e.g. School fees, emergency medical expenses..."
                  className="input-field"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                <strong>Policy notice:</strong> Submitting a withdrawal request does not automatically
                deduct funds from your ledger. An administrator must verify and authorize the bank
                transfer before the transaction is finalized.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={withdrawSubmitting}
                  onClick={() => setWithdrawModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawSubmitting}
                  className="btn-accent text-xs inline-flex items-center gap-1.5"
                >
                  {withdrawSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Confirm & Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
