'use client';

import React, { useState } from 'react';
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
import { cooperativeSettings } from '@/lib/mock-data';
import { Card, PageHeader } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast';

export default function AdminSettingsPage() {
  const { addToast } = useToast();

  // Cooperative Profile state
  const [name, setName] = useState(cooperativeSettings.name);
  const [email, setEmail] = useState(cooperativeSettings.email);
  const [phone, setPhone] = useState(cooperativeSettings.phone);
  const [address, setAddress] = useState(cooperativeSettings.address);

  // Official Receiving Bank Details state (members consume this!)
  const [bankName, setBankName] = useState(cooperativeSettings.bankName);
  const [bankAccountName, setBankAccountName] = useState(cooperativeSettings.bankAccountName);
  const [bankAccountNumber, setBankAccountNumber] = useState(cooperativeSettings.bankAccountNumber);

  // Financial Config
  const [currency, setCurrency] = useState(cooperativeSettings.currency);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    setTimeout(() => {
      cooperativeSettings.name = name;
      cooperativeSettings.email = email;
      cooperativeSettings.phone = phone;
      cooperativeSettings.address = address;

      setSavingProfile(false);
      addToast('success', 'Profile Updated', 'Cooperative organization profile updated.');
    }, 1000);
  };

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);

    setTimeout(() => {
      cooperativeSettings.bankName = bankName;
      cooperativeSettings.bankAccountName = bankAccountName;
      cooperativeSettings.bankAccountNumber = bankAccountNumber;

      setSavingBank(false);
      addToast(
        'success',
        'Bank Details Updated',
        'Official cooperative bank details updated. These instructions are now active for member contributions.'
      );
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Cooperative Configuration & Settings"
        description="Configure cooperative identity, official receiving bank accounts for member transfers, and financial operational policies."
      />

      {/* OFFICIAL BANK DETAILS CARD - KEY REQUIREMENT */}
      <Card>
        <form onSubmit={handleSaveBankDetails} className="space-y-4">
          <div className="pb-3 border-b border-surface-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-surface-900">
                  Official Cooperative Bank Account (Receiving Account)
                </h2>
                <p className="text-xs text-surface-500">
                  These official bank details are displayed dynamically to members when making regular & special contributions.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Member Display
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
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
                className="input-field text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="accountNumber" className="label text-xs">
                Account Number
              </label>
              <input
                id="accountNumber"
                type="text"
                maxLength={10}
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                required
                className="input-field text-xs font-mono font-bold tracking-wider"
              />
            </div>

            <div>
              <label htmlFor="accountName" className="label text-xs">
                Official Account Name
              </label>
              <input
                id="accountName"
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                required
                className="input-field text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingBank}
              className="btn-accent text-xs inline-flex items-center gap-2"
            >
              {savingBank ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Bank Details...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Update Receiving Bank Details
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* COOPERATIVE SOCIETY PROFILE */}
      <Card>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="pb-3 border-b border-surface-200 flex items-center gap-2">
            <Building className="h-5 w-5 text-brand-900" />
            <div>
              <h2 className="text-sm font-bold text-surface-900">Cooperative Society Profile</h2>
              <p className="text-xs text-surface-500">Official legal identity and communication channels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coopName" className="label text-xs">
                Cooperative Legal Entity Name
              </label>
              <input
                id="coopName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field text-xs"
              />
            </div>

            <div>
              <label htmlFor="coopEmail" className="label text-xs">
                Official Contact Email
              </label>
              <input
                id="coopEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coopPhone" className="label text-xs">
                Official Telephone Number
              </label>
              <input
                id="coopPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field text-xs"
              />
            </div>

            <div>
              <label htmlFor="coopAddress" className="label text-xs">
                Registered Secretariat Address
              </label>
              <input
                id="coopAddress"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="input-field text-xs"
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Cooperative Profile
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* FINANCIAL POLICY CONFIGURATION */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-brand-900" />
            <div>
              <h2 className="text-sm font-bold text-surface-900">Financial Rules & Savings Framework</h2>
              <p className="text-xs text-surface-500">Configured savings categories and currency parameters</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-surface-500">Standard Framework</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-surface-400 block text-[11px]">System Currency</span>
            <span className="font-bold text-sm text-surface-900 block mt-1">NGN (₦) — Nigerian Naira</span>
            <span className="text-[10px] text-surface-400 block mt-0.5">Authoritative currency token</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-surface-400 block text-[11px]">Supported Savings Portfolios</span>
            <span className="font-bold text-sm text-surface-900 block mt-1">Regular & Special</span>
            <span className="text-[10px] text-surface-400 block mt-0.5">Dual distinct ledger categories</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-surface-400 block text-[11px]">Loan Interest Engine</span>
            <span className="font-bold text-sm text-brand-900 block mt-1">Principal-Only Mode</span>
            <span className="text-[10px] text-surface-400 block mt-0.5">Interest policy pending AGM</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-200 text-xs text-surface-600 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-surface-500 shrink-0 mt-0.5" />
          <span>
            <strong>Policy Configuration Rule:</strong> Financial rules cannot be fabricated on the frontend.
            When loan interest or reserve formulas are ratified by the cooperative by-laws, they are
            provisioned via secure server-side migration.
          </span>
        </div>
      </Card>
    </div>
  );
}
