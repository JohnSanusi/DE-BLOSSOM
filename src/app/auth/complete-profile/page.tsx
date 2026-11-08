'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Hash, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import { useToast } from '@/components/ui/toast';
import { validatePhone, cn } from '@/lib/utils';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberRef, setMemberRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
      if (profile?.phone) {
        setPhone(profile.phone);
      }
      if (profile?.member_ref || profile?.member_number) {
        setMemberRef(profile.member_ref || profile.member_number || '');
      }
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full legal name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(phone.trim())) newErrors.phone = 'Provide a valid phone number (+234...)';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();
      if (!user) throw new Error('Not authenticated');

      const updatePayload: Record<string, any> = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        updated_at: new Date().toISOString(),
      };

      // Only update member_ref if user entered one and none is assigned yet
      if (memberRef.trim() && !profile?.member_ref && !profile?.member_number) {
        updatePayload.member_ref = memberRef.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      addToast('success', 'Profile Completed', 'Welcome to DE-BLOSSOM Cooperative Society!');
      router.push('/member');
    } catch (err: any) {
      setLoading(false);
      setErrors({ form: err?.message || 'Failed to complete profile registration.' });
      addToast('error', 'Update Failed', err?.message || 'Could not complete profile.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-darkSurface-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white dark:bg-darkSurface-card rounded-2xl border border-surface-200 dark:border-darkSurface-border shadow-modal p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            DB
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white leading-tight">Complete Membership Info</h1>
            <p className="text-xs text-surface-500 dark:text-slate-400">Step 2: Finalize your cooperative records</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Your Google account was authenticated successfully. Please confirm your official cooperative member details below. Once registered, membership identification is locked for financial audit integrity.
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
            <p className="text-xs text-red-700 dark:text-red-300">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="label">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Sanusi"
                className={cn('input-field pl-10', errors.fullName && 'border-red-300')}
              />
            </div>
            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Phone Number <span className="text-[10px] text-surface-400">(for alerts & receipts)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className={cn('input-field pl-10', errors.phone && 'border-red-300')}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="memberRef" className="label">
              Member Number / Cooperative ID <span className="text-[10px] text-surface-400">(Optional / Auto-assigned if blank)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                id="memberRef"
                type="text"
                value={memberRef}
                onChange={(e) => setMemberRef(e.target.value)}
                placeholder="e.g. DBM-2026-001 (or leave blank to auto-generate)"
                className="input-field pl-10 font-mono"
              />
            </div>
            <p className="text-[11px] text-surface-400 mt-1">
              If left blank, the system automatically assigns your sequential cooperative member ID.
            </p>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Finalizing Profile...
                </>
              ) : (
                <>
                  Continue to Member Space <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
