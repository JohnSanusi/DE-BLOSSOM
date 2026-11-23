'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';
import { ActionResult } from './contributions';
import { notifyAdminsAction, createNotificationAction } from './notifications';

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

    // Notify administrators
    notifyAdminsAction({
      title: 'New Loan Application',
      message: `A member applied for a loan of ₦${amountRequested.toLocaleString()} (${tenureMonths} months).`,
      type: 'loan_application_received',
      link: '/admin/loan-applications',
    }).catch(() => {});

    revalidatePath('/member/loans');
    revalidatePath('/admin/loans');
    revalidatePath('/admin/loan-applications');

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

    // Verify existing status to guard against multiple simultaneous reviews
    const { data: existingApp, error: fetchErr } = await supabase
      .from('loan_applications')
      .select('status, ref')
      .eq('id', applicationId)
      .maybeSingle();

    if (fetchErr || !existingApp) {
      return { success: false, error: 'Loan application not found.' };
    }

    if (existingApp.status !== 'pending' && existingApp.status !== 'under_review') {
      return {
        success: false,
        error: `Loan application ${existingApp.ref} has already been ${existingApp.status} by another administrator.`,
      };
    }

    const { data: app, error: appError } = await supabase
      .from('loan_applications')
      .update({
        status: decision,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_remarks: notes || (decision === 'approved' ? 'Approved by Credit Committee' : 'Application declined'),
      })
      .eq('id', applicationId)
      .in('status', ['pending', 'under_review'])
      .select()
      .single();

    if (appError) {
      return {
        success: false,
        error: 'This loan application was already modified or approved by another administrator.',
      };
    }

    // If approved, create loan facility record awaiting disbursement
    if (decision === 'approved' && app) {
      const approvedAmt = Number(app.approved_amount || app.requested_amount);
      await supabase.from('loans').insert({
        application_id: app.id,
        member_id: app.member_id,
        principal_amount: approvedAmt,
        disbursed_amount: 0.00,
        outstanding_principal: approvedAmt,
        repayment_duration_months: app.repayment_duration_months,
        purpose: app.purpose,
        status: 'approved',
      });

      createNotificationAction({
        userId: app.member_id,
        title: 'Loan Application Approved!',
        message: `Your loan application for ₦${approvedAmt.toLocaleString()} has been approved. Awaiting executive disbursement.`,
        type: 'loan_approved',
        link: '/member/loans',
      }).catch(() => {});
    } else if (decision === 'rejected' && app) {
      createNotificationAction({
        userId: app.member_id,
        title: 'Loan Application Decision',
        message: `Your loan application was not approved: ${notes || 'Review remarks on your application.'}`,
        type: 'loan_rejected',
        link: '/member/loans',
      }).catch(() => {});
    }

    revalidatePath('/admin/loans');
    revalidatePath('/admin/loan-applications');
    revalidatePath('/member/loans');

    return {
      success: true,
      message: `Loan application has been ${decision}.`,
      data: app,
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
      const isAlreadyDisbursed = error.message.toLowerCase().includes('cannot be disbursed') || error.message.toLowerCase().includes('already');
      return {
        success: false,
        error: isAlreadyDisbursed ? 'This loan has already been disbursed by another administrator.' : error.message,
      };
    }

    // Notify member of disbursement
    const { data: loan } = await supabase
      .from('loans')
      .select('member_id, ref, principal_amount')
      .eq('id', loanId)
      .maybeSingle();

    if (loan) {
      createNotificationAction({
        userId: loan.member_id,
        title: 'Loan Disbursed to Bank Account',
        message: `Loan ${loan.ref} (₦${Number(loan.principal_amount).toLocaleString()}) has been disbursed. You can now track your repayment schedule.`,
        type: 'loan_disbursed',
        link: `/member/loans/${loanId}`,
      }).catch(() => {});
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
