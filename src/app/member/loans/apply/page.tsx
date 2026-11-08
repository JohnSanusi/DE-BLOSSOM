'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Landmark,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Send,
  Loader2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/shared';
import { formatCurrency, generateRef } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { submitLoanApplicationAction } from '@/app/actions/loans';

export default function ApplyForLoanPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [regularSavings, setRegularSavings] = useState(0);
  const [specialSavings, setSpecialSavings] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);

  const [requestedAmount, setRequestedAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('6');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [amountError, setAmountError] = useState('');
  const [purposeError, setPurposeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadMemberFinances() {
      if (!user) return;
      try {
        const supabase = createClient();
        const [summaryRes, loansRes] = await Promise.all([
          supabase
            .from('member_financial_summary')
            .select('*')
            .eq('member_id', user.id)
            .maybeSingle(),
          supabase
            .from('loans')
            .select('outstanding_principal')
            .eq('member_id', user.id)
            .in('status', ['disbursed', 'repaying']),
        ]);

        if (summaryRes.data) {
          setRegularSavings(Number(summaryRes.data.regular_savings || 0));
          setSpecialSavings(Number(summaryRes.data.special_savings || 0));
        }

        if (loansRes.data) {
          const outstanding = loansRes.data.reduce(
            (sum, l) => sum + Number(l.outstanding_principal || 0),
            0
          );
          setTotalOutstanding(outstanding);
          setActiveLoansCount(loansRes.data.length);
        }
      } catch (err) {
        console.error('Error loading loan eligibility data:', err);
      }
    }
    loadMemberFinances();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const amountNum = parseFloat(requestedAmount);

    if (isNaN(amountNum) || amountNum < 20000) {
      setAmountError('Minimum loan application amount is ₦20,000.');
      hasError = true;
    } else {
      setAmountError('');
    }

    if (!purpose.trim()) {
      setPurposeError('Please explain the purpose of your loan request.');
      hasError = true;
    } else if (purpose.trim().length < 10) {
      setPurposeError('Please provide a slightly more descriptive purpose (min 10 characters).');
      hasError = true;
    } else {
      setPurposeError('');
    }

    if (hasError) {
      addToast('error', 'Form Incomplete', 'Please review the highlighted loan application fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('requestedAmount', amountNum.toString());
      formData.append('tenureMonths', duration);
      formData.append('purpose', purpose.trim());
      if (additionalInfo.trim()) {
        formData.append('additionalInfo', additionalInfo.trim());
      }

      const res = await submitLoanApplicationAction(formData);
      if (res.success) {
        setSuccess(true);
        addToast(
          'success',
          'Application Submitted',
          'Your loan application has been received and queued for committee review.'
        );
      } else {
        addToast('error', 'Submission Failed', res.error || 'Could not submit loan application.');
      }
    } catch (err: any) {
      addToast('error', 'Submission Error', err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="text-center p-8 sm:p-10 space-y-5">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Application Submitted</h2>
            <p className="text-sm text-surface-500 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              Your cooperative loan request of{' '}
              <strong className="text-surface-900 dark:text-white">
                {formatCurrency(parseFloat(requestedAmount))}
              </strong>{' '}
              has been recorded and sent to the cooperative committee.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-darkSurface-card border border-blue-200 dark:border-darkSurface-border text-xs text-blue-900 dark:text-slate-200 text-left space-y-1 transition-colors">
            <p className="font-semibold flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-700 dark:text-sky-400" />
              What Happens Next?
            </p>
            <p className="text-blue-800 dark:text-slate-300 leading-relaxed">
              The committee will review your regular savings track record and determine the approved
              amount and terms in line with cooperative policy. Once approved, the loan will require
              a separate administrative disbursement step before funds are transferred.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <Link href="/member/loans" className="btn-primary text-xs">
              Return to Loans
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/member/loans" className="btn-ghost p-2 text-surface-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
            Apply for a Cooperative Loan
          </h1>
          <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">
            Submit a financing request for review by the cooperative management committee.
          </p>
        </div>
      </div>

      {/* Member Financial Profile Overview */}
      <div className="p-5 rounded-2xl bg-white dark:bg-darkSurface-card border border-surface-200 dark:border-darkSurface-border shadow-card">
        <h3 className="text-xs font-bold text-surface-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Your Cooperative Financial Record
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border">
            <span className="text-[11px] text-surface-400 dark:text-slate-400 block">Regular Savings</span>
            <span className="font-bold text-base text-brand-900 dark:text-emerald-400">
              {formatCurrency(regularSavings)}
            </span>
            <span className="text-[10px] text-surface-400 dark:text-slate-400 block mt-0.5">
              Loan eligibility basis
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border">
            <span className="text-[11px] text-surface-400 dark:text-slate-400 block">Special Savings</span>
            <span className="font-bold text-base text-emerald-700 dark:text-emerald-300">
              {formatCurrency(specialSavings)}
            </span>
            <span className="text-[10px] text-surface-400 dark:text-slate-400 block mt-0.5">
              Voluntary deposits
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-darkSurface-bg border border-surface-200 dark:border-darkSurface-border">
            <span className="text-[11px] text-surface-400 dark:text-slate-400 block">Current Outstanding Debt</span>
            <span
              className={`font-bold text-base ${
                totalOutstanding > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-surface-700 dark:text-slate-300'
              }`}
            >
              {formatCurrency(totalOutstanding)}
            </span>
            <span className="text-[10px] text-surface-400 dark:text-slate-400 block mt-0.5">
              {activeLoansCount} active loan facility
            </span>
          </div>
        </div>
      </div>

      {/* Financial Policy Disclosure */}
      <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-darkSurface-card border border-amber-200 dark:border-darkSurface-border flex items-start gap-3 transition-colors">
        <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <span className="font-bold">Official Loan Terms Notice:</span> The cooperative&apos;s
          loan interest policy and exact eligibility thresholds are pending formal finalization by the
          General Assembly. Rather than generating arbitrary interest percentages or amortization
          schedules, the approved principal, tenure, and exact terms will be determined and communicated
          directly by the cooperative committee upon review.
        </div>
      </div>

      {/* Loan Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="requestedAmount" className="label">
                Requested Loan Amount (₦) <span className="text-red-500">*</span>
              </label>
              <input
                id="requestedAmount"
                type="number"
                step="5000"
                min="20000"
                value={requestedAmount}
                onChange={(e) => {
                  setRequestedAmount(e.target.value);
                  if (amountError) setAmountError('');
                }}
                placeholder="e.g. 200000"
                className={`input-field font-semibold text-base ${
                  amountError ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''
                }`}
              />
              {amountError ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {amountError}
                </p>
              ) : (
                <p className="text-[11px] text-surface-500 dark:text-slate-400 mt-1">
                  {requestedAmount
                    ? `Applying for ${formatCurrency(parseFloat(requestedAmount) || 0)}`
                    : 'Minimum loan request: ₦20,000'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="label">
                Requested Repayment Tenure <span className="text-red-500">*</span>
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="select-field"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="9">9 Months</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months (2 Years)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="purpose" className="label">
              Detailed Loan Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              rows={3}
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (purposeError) setPurposeError('');
              }}
              placeholder="Explain how the funds will be utilized (e.g. business inventory expansion, property acquisition, medical, or education fees)..."
              className={`input-field ${
                purposeError ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''
              }`}
            />
            {purposeError ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {purposeError}
              </p>
            ) : (
              <p className="text-[11px] text-surface-500 dark:text-slate-400 mt-1">
                Clearly explaining your use of funds assists the committee in approving your request.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="additionalInfo" className="label">
              Supporting Information / Collateral or Guarantor Notes{' '}
              <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="additionalInfo"
              rows={2}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Any additional details to aid committee review..."
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-darkSurface-border">
            <Link href="/member/loans" className="btn-secondary text-xs">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Loan Application
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
