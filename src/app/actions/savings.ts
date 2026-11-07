'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';
import { ActionResult } from './contributions';

/**
 * Member requests withdrawal from their Special Savings balance
 * (Regular savings is locked as cooperative equity / loan collateral)
 */
export async function requestSpecialSavingsWithdrawalAction(formData: FormData): Promise<ActionResult> {
  const amount = parseFloat(formData.get('amount') as string);
  const reason = formData.get('reason') as string;
  const bankDetails = (formData.get('bankDetails') as string) || null;

  if (!amount || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Valid withdrawal amount is required' };
  }
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'Please specify the purpose for withdrawal' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Withdrawal request submitted for admin review (Mock Mode)',
      data: { amount, reason },
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

    // Verify member has sufficient special savings balance via financial summary view
    const { data: summary } = await supabase
      .from('member_financial_summary')
      .select('special_savings')
      .eq('member_id', user.id)
      .single();

    const availableSpecial = summary?.special_savings || 0;
    if (availableSpecial < amount) {
      return {
        success: false,
        error: `Insufficient special savings balance. Available: ₦${availableSpecial.toLocaleString()}`,
      };
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        member_id: user.id,
        amount,
        reason: reason.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/member/savings');
    revalidatePath('/admin/savings');

    return {
      success: true,
      message: `Withdrawal request for ₦${amount.toLocaleString()} submitted for admin processing.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Withdrawal request failed' };
  }
}
