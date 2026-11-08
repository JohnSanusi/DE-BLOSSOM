'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Landmark,
  PlusCircle,
  FileCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Loader2,
  Copy,
  Info,
  Calendar,
} from 'lucide-react';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Badge,
  Pagination,
} from '@/components/ui/shared';
import { formatCurrency, formatDate, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Repayment } from '@/lib/types';

const cooperativeSettings = {
  bankName: 'First Bank of Nigeria',
  bankAccountNumber: '1012345678',
  bankAccountName: 'DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD',
};

export default function MemberRepaymentsPage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [memberLoans, setMemberLoans] = useState<any[]>([]);
  const [memberRepaymentsList, setMemberRepaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transferRef, setTransferRef] = useState('');

  useEffect(() => {
    async function loadRepayments() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const [loansRes, repaysRes] = await Promise.all([
          supabase
            .from('loans')
            .select('*')
            .eq('member_id', user.id)
            .order('approved_date', { ascending: false }),
          supabase
            .from('repayments')
            .select('*')
            .eq('member_id', user.id)
            .order('submission_date', { ascending: false }),
        ]);

        if (!loansRes.error && loansRes.data) {
          setMemberLoans(
            loansRes.data.map((l) => ({
              id: l.id,
              ref: l.ref,
              purpose: l.purpose,
              principalAmount: Number(l.principal_amount),
              disbursedAmount: Number(l.disbursed_amount || l.principal_amount),
              outstandingPrincipal: Number(l.outstanding_principal),
              status: l.status,
            }))
          );
        }

        if (!repaysRes.error && repaysRes.data) {
          setMemberRepaymentsList(
            repaysRes.data.map((r) => ({
              id: r.id,
              ref: r.ref,
              loanId: r.loan_id,
              memberId: r.member_id,
              amount: Number(r.amount),
              principalComponent: Number(r.principal_component || r.amount),
              interestComponent: Number(r.interest_component || 0),
              status: r.status,
              transferReference: r.transfer_reference || r.ref,
              paymentDate: r.payment_date,
              auditNote: r.rejection_reason || r.notes || '',
              reviewedByName: r.reviewed_by_name || null,
              createdAt: r.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching repayment data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRepayments();
  }, [user]);
  const [submitting, setSubmitting] = useState(false);

  const activeLoans = memberLoans.filter(
    (l) => l.status === 'disbursed' || l.status === 'repaying'
  );

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalRepaid = memberRepaymentsList
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCount = memberRepaymentsList.filter((r) => r.status === 'pending').length;

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(repayAmount);

    if (!selectedLoanId) {
      addToast('error', 'Select Loan', 'Please select which loan facility you are repaying.');
      return;
    }

    const loan = activeLoans.find((l) => l.id === selectedLoanId);
    if (!loan) return;

    if (isNaN(amountNum) || amountNum <= 0) {
      addToast('error', 'Invalid Amount', 'Please specify a valid payment amount.');
      return;
    }

    if (amountNum > loan.outstandingPrincipal) {
      addToast(
        'error',
        'Overpayment Prevented',
        `Maximum repayment amount for this loan is ${formatCurrency(loan.outstandingPrincipal)}.`
      );
      return;
    }

    const finalRef = transferRef.trim()
      ? transferRef.trim().toUpperCase()
      : `SLIP-RPY-${Date.now().toString().slice(-8)}`;

    setSubmitting(true);
    setTimeout(() => {
      const newRepayment: Repayment = {
        id: `rp_${Date.now()}`,
        ref: generateRef('RP'),
        loanId: loan.id,
        loanRef: loan.ref,
        memberId: user?.id || '',
        memberName: profile?.full_name || user?.user_metadata?.full_name || 'Member',
        amount: amountNum,
        principalComponent: amountNum,
        interestComponent: 0,
        feeComponent: 0,
        paymentDate,
        submissionDate: new Date().toISOString(),
        transferReference: finalRef,
        status: 'pending',
      };

      setMemberRepaymentsList((prev) => [newRepayment, ...prev]);
      setSubmitting(false);
      setSubmitModalOpen(false);
      setRepayAmount('');
      setTransferRef('');

      addToast(
        'success',
        'Repayment Evidence Submitted',
        'Your repayment evidence has been submitted. It will be verified by an administrator before principal is deducted.'
      );
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Repayments"
        description="Monitor your loan amortization, submit installment proof, and track administrator verification. Repayments are strictly principal-only."
        actions={
          activeLoans.length > 0 && (
            <button
              onClick={() => {
                setSelectedLoanId(activeLoans[0].id);
                setSubmitModalOpen(true);
              }}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Submit Repayment Proof
            </button>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Outstanding Principal"
          value={formatCurrency(totalOutstanding)}
          subtitle={
            activeLoans.length > 0
              ? `Across ${activeLoans.length} active loan facility`
              : 'Zero outstanding principal'
          }
          icon={<Landmark className="h-5 w-5 text-amber-600" />}
          className={totalOutstanding > 0 ? 'border-amber-200' : ''}
        />
        <StatCard
          title="Total Verified Principal Repaid"
          value={formatCurrency(totalRepaid)}
          subtitle="All-time approved settlements"
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Pending Verification"
          value={`${pendingCount} installment${pendingCount === 1 ? '' : 's'}`}
          subtitle="Awaiting bank statement match"
          icon={<Clock className="h-5 w-5 text-brand-800" />}
        />
      </div>

      {/* Principal-Only Policy Notice */}
      <div className="p-4 rounded-xl bg-surface-100 border border-surface-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-brand-800 shrink-0 mt-0.5" />
        <div className="text-xs text-surface-700 leading-relaxed">
          <strong className="text-surface-900">Principal-Only Repayment Rule:</strong> For the
          current cooperative implementation, interest and fee components are not yet active. All
          approved repayments are credited 100% directly toward reducing your outstanding principal
          balance. Submitting payment proof does not automatically adjust your loan balance until
          verified by an administrator.
        </div>
      </div>

      {/* Active Loans Quick View */}
      {activeLoans.length > 0 && (
        <Card padding="none">
          <div className="p-4 border-b border-surface-200">
            <h3 className="text-sm font-bold text-surface-900">Active Loan Repayment Status</h3>
          </div>
          <div className="divide-y divide-surface-100">
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-surface-900">{loan.ref}</span>
                    <StatusBadge status={loan.status} />
                  </div>
                  <p className="text-xs text-surface-600 mt-1">{loan.purpose}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-surface-400 block uppercase">Outstanding</span>
                    <span className="font-bold text-sm text-amber-700">
                      {formatCurrency(loan.outstandingPrincipal)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLoanId(loan.id);
                      setSubmitModalOpen(true);
                    }}
                    className="btn-accent text-xs py-1.5 px-3"
                  >
                    Submit Installment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Repayments History Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Repayment Installment History</h3>
            <p className="text-xs text-surface-500">Record of submitted repayments and ledger postings</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50/50">
                <th className="table-header">Reference</th>
                <th className="table-header">Facility Ref</th>
                <th className="table-header">Payment Date</th>
                <th className="table-header">Bank Reference</th>
                <th className="table-header">Amount Paid</th>
                <th className="table-header">Principal Component</th>
                <th className="table-header">Interest / Fees</th>
                <th className="table-header">Status</th>
                <th className="table-header">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {memberRepaymentsList.map((r) => (
                <tr key={r.id} className="hover:bg-surface-50/70 transition-colors">
                  <td className="table-cell font-mono text-xs font-semibold text-surface-900">
                    {r.ref}
                  </td>
                  <td className="table-cell font-mono text-xs text-surface-600">
                    <Link
                      href={`/member/loans/${r.loanId}`}
                      className="text-brand-700 hover:underline"
                    >
                      {r.loanRef}
                    </Link>
                  </td>
                  <td className="table-cell text-xs text-surface-600">{formatDate(r.paymentDate)}</td>
                  <td className="table-cell font-mono text-xs text-surface-600">
                    {r.transferReference}
                  </td>
                  <td className="table-cell font-bold text-xs text-surface-900">
                    {formatCurrency(r.amount)}
                  </td>
                  <td className="table-cell font-bold text-xs text-emerald-700">
                    {formatCurrency(r.principalComponent)}
                  </td>
                  <td className="table-cell text-xs text-surface-400">
                    ₦0.00 / ₦0.00
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="table-cell text-xs text-surface-500">
                    {r.status === 'approved' && r.verifiedBy ? (
                      <span>Verified by {r.verifiedBy}</span>
                    ) : r.status === 'pending' ? (
                      <span className="text-amber-600">Awaiting admin verification</span>
                    ) : (
                      <span className="text-red-600">{r.remarks || 'Rejected'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SUBMISSION MODAL */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && setSubmitModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-modal border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Submit Loan Repayment Proof</h3>
            <p className="text-xs text-surface-500 mt-1">
              Repayments are applied toward principal reduction upon administrator confirmation.
            </p>

            <form onSubmit={handleRepaymentSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="selectLoan" className="label">
                  Target Loan Facility
                </label>
                <select
                  id="selectLoan"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="select-field"
                  required
                >
                  {activeLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.ref} — Outstanding: {formatCurrency(loan.outstandingPrincipal)} (
                      {loan.purpose})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repayAmount" className="label">
                    Installment Amount (₦)
                  </label>
                  <input
                    id="repayAmount"
                    type="number"
                    step="1000"
                    min="1000"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="e.g. 40000"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="paymentDate" className="label">
                    Transfer Date
                  </label>
                  <input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="transferRef" className="label flex items-center justify-between">
                  <span>Bank Session ID / Reference Number</span>
                  <span className="text-[10px] text-surface-400 dark:text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  id="transferRef"
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. 090... (or leave empty if unsure)"
                  className="input-field font-mono text-xs uppercase"
                />
                <p className="text-[11px] text-surface-500 dark:text-slate-400 mt-1">
                  Optional — the administrator will verify directly from your transfer record.
                </p>
              </div>

              {/* Official Account Reminder */}
              <div className="p-3 rounded-lg bg-surface-100 border border-surface-200 text-xs space-y-1">
                <span className="font-semibold text-surface-800">Cooperative Bank Account:</span>
                <p className="text-surface-600">
                  {cooperativeSettings.bankName} • Account: {cooperativeSettings.bankAccountNumber} (
                  {cooperativeSettings.bankAccountName})
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSubmitModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting Proof...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit Repayment Proof
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
