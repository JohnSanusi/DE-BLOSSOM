'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';
import { ActionResult } from './contributions';

/**
 * Member submits a new loan request
 */
export async function submitLoanApplicationAction(formData: FormData): Promise<ActionResult> {
  const rawAmt = formData.get('amount') || formData.get('requestedAmount');
  const amountRequested = parseFloat(rawAmt as string);
  const rawDuration = formData.get('tenureMonths') || formData.get('duration');
  const tenureMonths = parseInt(rawDuration as string, 10);
  const purpose = (formData.get('purpose') as string) || '';
  const additionalInfo = (formData.get('additionalInfo') as string) || null;
  const guarantor1Name = (formData.get('guarantor1Name') as string) || null;
  const guarantor1Phone = (formData.get('guarantor1Phone') as string) || null;
  const guarantor2Name = (formData.get('guarantor2Name') as string) || null;
  const guarantor2Phone = (formData.get('guarantor2Phone') as string) || null;

  if (!amountRequested || isNaN(amountRequested) || amountRequested < 20000) {
    return { success: false, error: 'Minimum loan amount is ₦20,000' };
  }
  if (!tenureMonths || tenureMonths < 1 || tenureMonths > 12) {
    return { success: false, error: 'Tenure must be between 1 and 12 months' };
  }
  if (!purpose || purpose.trim().length < 10) {
    return { success: false, error: 'Please describe the loan purpose (at least 10 characters)' };
  }

  // Principal-only monthly repayment estimate (interest ratified later by General Assembly)
  const monthlyEstimate = Math.round(amountRequested / tenureMonths);

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Loan application submitted for committee review (Mock Mode)',
      data: { amountRequested, tenureMonths, monthlyEstimate },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data, error } = await supabase
      .from('loan_applications')
      .insert({
        member_id: user.id,
        requested_amount: amountRequested,
        repayment_duration_months: tenureMonths,
        purpose: purpose.trim(),
        additional_info: additionalInfo,
        guarantor1_name: guarantor1Name?.trim() || null,
        guarantor1_phone: guarantor1Phone?.trim() || null,
        guarantor2_name: guarantor2Name?.trim() || null,
        guarantor2_phone: guarantor2Phone?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/member/loans');
    revalidatePath('/admin/loans');

    return {
      success: true,
      message: `Loan application for ₦${amountRequested.toLocaleString()} submitted for Credit Committee review.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Loan application failed' };
  }
}

/**
 * Admin / Credit Committee approves or rejects a loan application
 */
export async function reviewLoanApplicationAction(
  applicationId: string,
  decision: 'approved' | 'rejected',
  notes?: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: `Loan application marked as ${decision} (Mock Mode)`,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data, error } = await supabase
      .from('loan_applications')
      .update({
        status: decision,
        admin_notes: notes || null,
        rejection_reason: decision === 'rejected' ? (notes || 'Application declined') : null,
        approved_by: decision === 'approved' ? user.id : null,
        approved_at: decision === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/loans');
    revalidatePath('/member/loans');

    return {
      success: true,
      message: `Loan application has been ${decision}.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Action failed' };
  }
}

/**
 * Admin disburses funds for an approved loan application.
 * Calls atomic stored procedure `disburse_loan()` to create the active loan,
 * post a debit to the financial ledger, and log audit history.
 */
export async function disburseLoanAction(loanId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Loan disbursed and active loan created (Mock Mode)',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data, error } = await supabase.rpc('disburse_loan', {
      p_loan_id: loanId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/loans');
    revalidatePath('/admin/transactions');
    revalidatePath('/admin');
    revalidatePath('/member/loans');

    return {
      success: true,
      message: 'Loan disbursed successfully. Capital debited from society ledger.',
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Disbursement failed' };
  }
}
