'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Member submits a monthly or special savings contribution
 */
export async function submitContributionAction(formData: FormData): Promise<ActionResult> {
  const amount = parseFloat(formData.get('amount') as string);
  const savingsType = (formData.get('savingsType') as string) || 'regular';
  const paymentMethod = (formData.get('paymentMethod') as string) || 'bank_transfer';
  const senderName = formData.get('senderName') as string;
  const bankReference = (formData.get('bankReference') as string) || null;
  const receiptUrl = (formData.get('receiptUrl') as string) || null;

  if (!amount || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Valid contribution amount is required' };
  }
  if (!senderName || senderName.trim().length === 0) {
    return { success: false, error: 'Payer / Account name is required' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Contribution submitted successfully (Mock Mode)',
      data: { amount, savingsType, senderName, bankReference },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized. Please sign in.' };
    }

    const { data, error } = await supabase
      .from('contributions')
      .insert({
        member_id: user.id,
        amount,
        type: savingsType,
        sender_name: senderName.trim(),
        transfer_reference: bankReference?.trim() || null,
        receipt_url: receiptUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/member/contributions');
    revalidatePath('/member');
    revalidatePath('/admin/contributions');

    return {
      success: true,
      message: `Contribution of ₦${amount.toLocaleString()} submitted for admin verification.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Submission failed' };
  }
}

/**
 * Admin verifies and approves a contribution (invokes atomic stored procedure)
 */
export async function approveContributionAction(
  contributionId: string,
  adminNotes?: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Contribution approved (Mock Mode)' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    // Call atomic stored procedure created in schema.sql
    const { data, error } = await supabase.rpc('approve_contribution', {
      p_contribution_id: contributionId,
      p_remarks: adminNotes || 'Verified by admin',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/contributions');
    revalidatePath('/admin/transactions');
    revalidatePath('/admin');
    revalidatePath('/member/contributions');
    revalidatePath('/member/savings');

    return { success: true, message: 'Contribution verified and posted to financial ledger', data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Approval failed' };
  }
}

/**
 * Admin rejects a contribution with reason (invokes atomic stored procedure)
 */
export async function rejectContributionAction(
  contributionId: string,
  reason: string
): Promise<ActionResult> {
  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'A rejection reason is required for audit compliance.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Contribution rejected (Mock Mode)' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data, error } = await supabase.rpc('reject_contribution', {
      p_contribution_id: contributionId,
      p_reason: reason.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/contributions');
    revalidatePath('/member/contributions');

    return { success: true, message: 'Contribution marked as rejected', data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Rejection failed' };
  }
}
