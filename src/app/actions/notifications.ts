'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { revalidatePath } from 'next/cache';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationResult {
  success: boolean;
  notifications?: AppNotification[];
  error?: string;
}

/**
 * Fetch notifications for current user.
 * Gracefully synthesizes notifications from active operational records if table does not exist or is empty,
 * ensuring in-dashboard notifications work out-of-the-box.
 */
export async function getNotificationsAction(): Promise<NotificationResult> {
  if (!isSupabaseConfigured()) {
    // Return sample mock notifications for demonstration
    return {
      success: true,
      notifications: [
        {
          id: 'mock-1',
          userId: 'mock-user',
          type: 'contribution_approved',
          title: 'Contribution Approved',
          message: 'Your regular savings contribution of ₦25,000 was verified and posted to the ledger.',
          read: false,
          link: '/member/contributions',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 'mock-2',
          userId: 'mock-user',
          type: 'loan_approved',
          title: 'Loan Facility Active',
          message: 'Your loan application was approved and disbursed. Repayment cycle is active.',
          read: false,
          link: '/member/loans',
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
      ],
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

    // Check user profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';

    // Try fetching from `notifications` table
    let dbNotifications: AppNotification[] = [];
    const { data: notifsData, error: notifsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!notifsError && notifsData && notifsData.length > 0) {
      dbNotifications = notifsData.map((n) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: Boolean(n.read),
        link: n.link,
        createdAt: n.created_at,
      }));
    }

    // If dbNotifications are empty or table doesn't exist yet, synthesize live notifications from recent events
    if (dbNotifications.length === 0) {
      if (isAdmin) {
        // Synthesize for admin from pending submissions
        const [pendingContribs, pendingLoans, pendingRepays] = await Promise.all([
          supabase
            .from('contributions')
            .select('id, ref, amount, sender_name, submission_date, profiles:member_id(full_name)')
            .eq('status', 'pending')
            .order('submission_date', { ascending: false })
            .limit(5),
          supabase
            .from('loan_applications')
            .select('id, ref, requested_amount, application_date, profiles:member_id(full_name)')
            .eq('status', 'pending')
            .order('application_date', { ascending: false })
            .limit(5),
          supabase
            .from('repayments')
            .select('id, ref, amount, submission_date, profiles:member_id(full_name)')
            .eq('status', 'pending')
            .order('submission_date', { ascending: false })
            .limit(5),
        ]);

        const synthetic: AppNotification[] = [];

        (pendingContribs.data || []).forEach((c: any) => {
          synthetic.push({
            id: `notif-con-${c.id}`,
            userId: user.id,
            type: 'contribution_submitted',
            title: 'Pending Contribution Verification',
            message: `${(c.profiles as any)?.full_name || c.sender_name || 'A member'} submitted ₦${Number(c.amount).toLocaleString()} (${c.ref}) awaiting review.`,
            read: false,
            link: `/admin/contributions/${c.id}`,
            createdAt: c.submission_date || new Date().toISOString(),
          });
        });

        (pendingLoans.data || []).forEach((l: any) => {
          synthetic.push({
            id: `notif-la-${l.id}`,
            userId: user.id,
            type: 'loan_application_received',
            title: 'New Loan Request Pending Review',
            message: `${(l.profiles as any)?.full_name || 'A member'} requested ₦${Number(l.requested_amount).toLocaleString()} (${l.ref}).`,
            read: false,
            link: '/admin/loan-applications',
            createdAt: l.application_date || new Date().toISOString(),
          });
        });

        (pendingRepays.data || []).forEach((r: any) => {
          synthetic.push({
            id: `notif-rp-${r.id}`,
            userId: user.id,
            type: 'repayment_submitted',
            title: 'Loan Repayment Awaiting Reconciliation',
            message: `${(r.profiles as any)?.full_name || 'A member'} submitted an installment of ₦${Number(r.amount).toLocaleString()} (${r.ref}).`,
            read: false,
            link: '/admin/repayments',
            createdAt: r.submission_date || new Date().toISOString(),
          });
        });

        synthetic.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { success: true, notifications: synthetic };
      } else {
        // Synthesize for member from recent user activity
        const [recentContribs, recentLoans, recentRepays] = await Promise.all([
          supabase
            .from('contributions')
            .select('id, ref, amount, status, submission_date, verified_at, rejection_reason')
            .eq('member_id', user.id)
            .order('submission_date', { ascending: false })
            .limit(5),
          supabase
            .from('loans')
            .select('id, ref, principal_amount, status, approved_date, disbursement_date')
            .eq('member_id', user.id)
            .order('approved_date', { ascending: false })
            .limit(3),
          supabase
            .from('repayments')
            .select('id, ref, amount, status, submission_date, verified_at, remarks')
            .eq('member_id', user.id)
            .order('submission_date', { ascending: false })
            .limit(5),
        ]);

        const synthetic: AppNotification[] = [];

        (recentContribs.data || []).forEach((c) => {
          if (c.status === 'approved') {
            synthetic.push({
              id: `notif-con-appr-${c.id}`,
              userId: user.id,
              type: 'contribution_approved',
              title: 'Contribution Approved',
              message: `Your payment of ₦${Number(c.amount).toLocaleString()} (${c.ref}) was verified and added to your savings.`,
              read: false,
              link: '/member/contributions',
              createdAt: c.verified_at || c.submission_date,
            });
          } else if (c.status === 'rejected') {
            synthetic.push({
              id: `notif-con-rej-${c.id}`,
              userId: user.id,
              type: 'contribution_rejected',
              title: 'Contribution Flagged / Rejected',
              message: `Payment ${c.ref} was rejected: ${c.rejection_reason || 'Bank reference not verified'}.`,
              read: false,
              link: '/member/contributions',
              createdAt: c.verified_at || c.submission_date,
            });
          } else {
            synthetic.push({
              id: `notif-con-pend-${c.id}`,
              userId: user.id,
              type: 'contribution_submitted',
              title: 'Contribution Under Review',
              message: `Transfer slip for ₦${Number(c.amount).toLocaleString()} (${c.ref}) is currently pending admin verification.`,
              read: false,
              link: '/member/contributions',
              createdAt: c.submission_date,
            });
          }
        });

        (recentLoans.data || []).forEach((l) => {
          if (l.status === 'disbursed' || l.status === 'repaying') {
            synthetic.push({
              id: `notif-loan-disb-${l.id}`,
              userId: user.id,
              type: 'loan_disbursed',
              title: 'Loan Disbursed',
              message: `Loan facility ${l.ref} for ₦${Number(l.principal_amount).toLocaleString()} is active. Monthly repayments apply directly to principal.`,
              read: false,
              link: `/member/loans/${l.id}`,
              createdAt: l.disbursement_date || l.approved_date,
            });
          } else if (l.status === 'approved') {
            synthetic.push({
              id: `notif-loan-appr-${l.id}`,
              userId: user.id,
              type: 'loan_approved',
              title: 'Loan Facility Approved',
              message: `Loan application for ₦${Number(l.principal_amount).toLocaleString()} was approved and is queued for bank disbursement.`,
              read: false,
              link: `/member/loans/${l.id}`,
              createdAt: l.approved_date,
            });
          }
        });

        (recentRepays.data || []).forEach((r) => {
          if (r.status === 'approved') {
            synthetic.push({
              id: `notif-rp-appr-${r.id}`,
              userId: user.id,
              type: 'repayment_verified',
              title: 'Loan Repayment Reconciled',
              message: `Installment of ₦${Number(r.amount).toLocaleString()} (${r.ref}) was verified. Outstanding principal reduced.`,
              read: false,
              link: '/member/repayments',
              createdAt: r.verified_at || r.submission_date,
            });
          } else if (r.status === 'pending') {
            synthetic.push({
              id: `notif-rp-pend-${r.id}`,
              userId: user.id,
              type: 'repayment_submitted',
              title: 'Repayment Proof Submitted',
              message: `Installment proof of ₦${Number(r.amount).toLocaleString()} (${r.ref}) submitted for admin review.`,
              read: false,
              link: '/member/repayments',
              createdAt: r.submission_date,
            });
          }
        });

        synthetic.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { success: true, notifications: synthetic };
      }
    }

    return { success: true, notifications: dbNotifications };
  } catch (err: any) {
    console.error('Error in getNotificationsAction:', err);
    return { success: false, error: err?.message || 'Failed to fetch notifications' };
  }
}

/**
 * Creates a notification record for a specific user
 */
export async function createNotificationAction({
  userId,
  title,
  message,
  type = 'info',
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link,
      read: false,
    });

    if (error) {
      // If table doesn't exist, ignore error gracefully
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Notify all administrative users (e.g. on new submission)
 */
export async function notifyAdminsAction({
  title,
  message,
  type = 'action_required',
  link,
}: {
  title: string;
  message: string;
  type?: string;
  link?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = await createClient();
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) return;

    const inserts = admins.map((admin) => ({
      user_id: admin.id,
      title,
      message,
      type,
      link,
      read: false,
    }));

    await supabase.from('notifications').insert(inserts);
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationReadAction(notificationId: string): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured() || notificationId.startsWith('notif-') || notificationId.startsWith('mock-')) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * Mark all notifications for the current user as read
 */
export async function markAllNotificationsReadAction(): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: true };

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id);

    return { success: true };
  } catch {
    return { success: true };
  }
}
