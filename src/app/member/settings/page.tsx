'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Bell,
  Eye,
  EyeOff,
  User,
  Shield,
  CheckCircle,
  Save,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/shared';
import { validatePassword } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function MemberSettingsPage() {
  const { addToast } = useToast();

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Notification preferences
  const [notifContrib, setNotifContrib] = useState(true);
  const [notifLoan, setNotifLoan] = useState(true);
  const [notifRepay, setNotifRepay] = useState(true);
  const [notifAnnounce, setNotifAnnounce] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPw) {
      addToast('error', 'Current Password Required', 'Please input your existing password.');
      return;
    }

    const valResult = validatePassword(newPw);
    if (!valResult.valid) {
      addToast('error', 'Weak Password', valResult.errors[0]);
      return;
    }

    if (newPw !== confirmPw) {
      addToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    setTimeout(() => {
      setPwSaving(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      addToast('success', 'Security Updated', 'Your password has been successfully changed.');
    }, 1200);
  };

  const handleSavePreferences = () => {
    addToast('success', 'Preferences Saved', 'Your communication preferences have been saved.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Settings & Security"
        description="Configure account credentials, security preferences, and cooperative communication channels."
      />

      {/* Profile Link Card */}
      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-100 text-brand-900 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900">Personal & Contact Information</h3>
            <p className="text-xs text-surface-500">
              Update legal name, phone number, and view your cooperative ID.
            </p>
          </div>
        </div>
        <Link href="/member/profile" className="btn-secondary text-xs flex items-center gap-1.5">
          View Profile <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>

      {/* Password Change Card */}
      <Card>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="pb-3 border-b border-surface-200 flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand-900" />
            <h3 className="text-sm font-bold text-surface-900">Change Password</h3>
          </div>

          <div>
            <label htmlFor="currentPw" className="label">
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPw"
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPw" className="label">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPw"
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPw" className="label">
                Confirm New Password
              </label>
              <input
                id="confirmPw"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwSaving}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {pwSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Notification Preferences Card */}
      <Card>
        <div className="space-y-4">
          <div className="pb-3 border-b border-surface-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-900" />
              <h3 className="text-sm font-bold text-surface-900">Communication Alerts</h3>
            </div>
            <button onClick={handleSavePreferences} className="btn-secondary text-xs">
              Save Preferences
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-surface-900 block">
                  Contribution Verification Alerts
                </span>
                <span className="text-[11px] text-surface-500 block mt-0.5">
                  Receive email notification whenever an administrator approves or rejects a contribution.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifContrib}
                onChange={(e) => setNotifContrib(e.target.checked)}
                className="h-4 w-4 rounded text-brand-900 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-surface-900 block">
                  Loan Decision & Disbursement Notifications
                </span>
                <span className="text-[11px] text-surface-500 block mt-0.5">
                  Get notified immediately when your loan application is reviewed or disbursed.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifLoan}
                onChange={(e) => setNotifLoan(e.target.checked)}
                className="h-4 w-4 rounded text-brand-900 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-surface-900 block">
                  Monthly Repayment Reminders
                </span>
                <span className="text-[11px] text-surface-500 block mt-0.5">
                  Reminders 3 days prior to your monthly loan installment due date.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifRepay}
                onChange={(e) => setNotifRepay(e.target.checked)}
                className="h-4 w-4 rounded text-brand-900 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-surface-900 block">
                  Cooperative General Announcements
                </span>
                <span className="text-[11px] text-surface-500 block mt-0.5">
                  Annual General Meeting (AGM) notices and cooperative policy updates.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifAnnounce}
                onChange={(e) => setNotifAnnounce(e.target.checked)}
                className="h-4 w-4 rounded text-brand-900 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}
