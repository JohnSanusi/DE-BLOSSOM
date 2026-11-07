'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCircle,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';
import { currentMember } from '@/lib/mock-data';
import { Card, PageHeader, Avatar, StatusBadge } from '@/components/ui/shared';
import { formatDate, validatePhone } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function MemberProfilePage() {
  const { addToast } = useToast();

  const [fullName, setFullName] = useState(currentMember.fullName);
  const [phone, setPhone] = useState(currentMember.phone);
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      addToast('error', 'Validation Error', 'Full name cannot be blank.');
      return;
    }

    if (!validatePhone(phone)) {
      addToast('error', 'Validation Error', 'Please provide a valid phone number.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      currentMember.fullName = fullName.trim();
      currentMember.phone = phone.trim();
      setSaving(false);
      addToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="My Member Profile"
        description="View your cooperative membership identification and update your contact preferences."
      />

      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={fullName} size="lg" className="h-16 w-16 text-xl" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-surface-900">{fullName}</h2>
              <StatusBadge status={currentMember.status} />
            </div>
            <p className="font-mono text-xs font-semibold text-brand-900">
              Cooperative ID: {currentMember.memberRef}
            </p>
            <p className="text-xs text-surface-400">
              Member since {formatDate(currentMember.createdAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* Editable & Immutable Details Form */}
      <Card>
        <form onSubmit={handleProfileUpdate} className="space-y-5">
          <h3 className="text-sm font-bold text-surface-900 pb-2 border-b border-surface-200">
            Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Permitted update: Full Name */}
            <div>
              <label htmlFor="fullName" className="label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="input-field"
              />
              <p className="text-[11px] text-surface-400 mt-1">Official legal name</p>
            </div>

            {/* Permitted update: Phone */}
            <div>
              <label htmlFor="phone" className="label">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field"
              />
              <p className="text-[11px] text-surface-400 mt-1">For SMS transaction alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Immutable: Email */}
            <div>
              <label className="label text-surface-500">
                Email Address <span className="text-[10px] text-surface-400">(Immutable)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={currentMember.email}
                  disabled
                  className="input-field bg-surface-100 text-surface-500 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              </div>
              <p className="text-[11px] text-surface-400 mt-1">
                Email change requires administrator verification.
              </p>
            </div>

            {/* Immutable: Member Ref */}
            <div>
              <label className="label text-surface-500">
                Member Reference ID <span className="text-[10px] text-surface-400">(Immutable)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentMember.memberRef}
                  disabled
                  className="input-field font-mono bg-surface-100 text-surface-500 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              </div>
              <p className="text-[11px] text-surface-400 mt-1">Permanently assigned identifier</p>
            </div>
          </div>

          {/* Non-negotiable security notice */}
          <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-200 flex items-start gap-3">
            <Shield className="h-4 w-4 text-surface-500 shrink-0 mt-0.5" />
            <div className="text-xs text-surface-600 leading-relaxed">
              <strong>Account Protection:</strong> Member role, member identifier, registration date,
              and account approval statuses are locked to prevent unauthorized tampering. Only verified
              contact details can be updated directly.
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-surface-200">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
