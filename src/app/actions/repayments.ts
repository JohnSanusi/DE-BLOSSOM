'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';
import { ActionResult } from './contributions';

/**
 * Member submits a loan repayment proof/entry
 */
export async function submitRepaymentAction(formData: FormData): Promise<ActionResult> {
  const loanId = formData.get('loanId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const paymentMethod = (formData.get('paymentMethod') as string) || 'bank_transfer';
  const bankReference = (formData.get('bankReference') as string) || null;
  const receiptUrl = (formData.get('receiptUrl') as string) || null;

  if (!loanId) {
    return { success: false, error: 'Loan selection is required' };
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Valid repayment amount is required' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Repayment submitted for admin verification (Mock Mode)',
      data: { loanId, amount, bankReference },
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
      .from('repayments')
      .insert({
        loan_id: loanId,
        member_id: user.id,
        amount,
        principal_component: amount,
        transfer_reference: bankReference?.trim() || null,
        receipt_url: receiptUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/member/repayments');
    revalidatePath('/member/loans');
    revalidatePath('/admin/repayments');

    return {
      success: true,
      message: `Repayment of ₦${amount.toLocaleString()} submitted for admin verification.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Repayment submission failed' };
  }
}

/**
 * Admin verifies and approves a loan repayment.
 * Calls atomic stored procedure `approve_repayment()`, which amortizes principal,
 * checks if loan balance reaches 0 to auto-complete, posts credit to ledger, and logs audit.
 */
export async function approveRepaymentAction(
  repaymentId: string,
  adminNotes?: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Repayment approved (Mock Mode)' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data, error } = await supabase.rpc('approve_repayment', {
      p_repayment_id: repaymentId,
      p_remarks: adminNotes || 'Repayment verified by admin',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/repayments');
    revalidatePath('/admin/loans');
    revalidatePath('/admin/transactions');
    revalidatePath('/member/repayments');
    revalidatePath('/member/loans');

    return {
      success: true,
      message: 'Repayment approved. Loan balance amortized & ledger updated.',
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Repayment approval failed' };
  }
}

/**
 * Admin rejects a repayment proof with audit reason
 */
export async function rejectRepaymentAction(
  repaymentId: string,
  reason: string
): Promise<ActionResult> {
  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'A rejection reason is required for audit compliance.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Repayment rejected (Mock Mode)' };
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
      .from('repayments')
      .update({
        status: 'rejected',
        remarks: reason.trim(),
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', repaymentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/repayments');
    revalidatePath('/member/repayments');

    return { success: true, message: 'Repayment marked as rejected', data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Rejection failed' };
  }
}
