'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Landmark,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Cooperative Profile state
  const [name, setName] = useState('DE-BLOSSOM Cooperative Society Limited');
  const [email, setEmail] = useState('contact@de-blossom.org');
  const [phone, setPhone] = useState('+234 802 000 1122');
  const [address, setAddress] = useState('Plot 12, Cooperative Way, Victoria Island, Lagos');

  // Official Receiving Bank Details state
  const [bankName, setBankName] = useState('Zenith Bank Plc');
  const [bankAccountName, setBankAccountName] = useState('DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD');
  const [bankAccountNumber, setBankAccountNumber] = useState('1012345678');
  const [currency, setCurrency] = useState('NGN');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('cooperative_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setSettingsId(data.id);
          if (data.cooperative_name) setName(data.cooperative_name);
          if (data.bank_name) setBankName(data.bank_name);
          if (data.bank_account_name) setBankAccountName(data.bank_account_name);
          if (data.bank_account_number) setBankAccountNumber(data.bank_account_number);
          if (data.currency) setCurrency(data.currency);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const supabase = createClient();
      if (settingsId) {
        await supabase
          .from('cooperative_settings')
          .update({
            cooperative_name: name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingsId);
      }
      addToast('success', 'Profile Updated', 'Cooperative organization profile updated.');
    } catch (err: any) {
      addToast('error', 'Update Error', err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const supabase = createClient();
      if (settingsId) {
        await supabase
          .from('cooperative_settings')
          .update({
            bank_name: bankName,
            bank_account_name: bankAccountName,
            bank_account_number: bankAccountNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingsId);
      }
      addToast(
        'success',
        'Bank Details Updated',
        'Official cooperative bank details updated. These instructions are now active for member contributions.'
      );
    } catch (err: any) {
      addToast('error', 'Update Error', err?.message || 'Failed to update bank details');
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Cooperative Configuration & Settings"
        description="Configure cooperative identity, official receiving bank accounts for member transfers, and financial operational policies."
      />

      {/* OFFICIAL BANK DETAILS CARD */}
      <Card>
        <form onSubmit={handleSaveBankDetails} className="space-y-4">
          <div className="pb-3 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                  Official Cooperative Bank Account (Receiving Account)
                </h2>
                <p className="text-xs text-surface-500 dark:text-slate-400">
                  These official bank details are displayed dynamically to members when making regular & special contributions.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Active Member Display
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Payment Integrity Warning:</strong> Updating these bank details immediately
              changes the transfer instructions presented to all members on the contribution page.
              Ensure the bank account belongs to the registered society entity.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bankName" className="label text-xs">
                Bank Name
              </label>
              <input
                id="bankName"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="bankAccountName" className="label text-xs">
                Beneficiary / Account Name
              </label>
              <input
                id="bankAccountName"
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="bankAccountNumber" className="label text-xs">
                10-Digit Account Number (NUBAN)
              </label>
              <input
                id="bankAccountNumber"
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                required
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingBank}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {savingBank ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Bank Records...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Receiving Bank Details
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* COOPERATIVE IDENTITY CARD */}
      <Card>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="pb-3 border-b border-surface-200 dark:border-darkSurface-border flex items-center gap-2">
            <Building className="h-5 w-5 text-brand-900 dark:text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                Cooperative Society Identity
              </h2>
              <p className="text-xs text-surface-500 dark:text-slate-400">
                Official entity name and primary administrative contact channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="label text-xs">
                Official Cooperative Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="email" className="label text-xs">
                Official Support Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="phone" className="label text-xs">
                Official Helpdesk Phone
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field font-mono"
              />
            </div>

            <div>
              <label htmlFor="address" className="label text-xs">
                Secretariat Physical Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Identity...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Organization Identity
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
