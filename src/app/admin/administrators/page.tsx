'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  UserPlus,
  Lock,
  Mail,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { admins, currentAdmin } from '@/lib/mock-data';
import {
  Card,
  StatCard,
  StatusBadge,
  PageHeader,
  Badge,
  Avatar,
  ConfirmDialog,
} from '@/components/ui/shared';
import { formatDate, formatDateTime, validateEmail } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { User, AccountStatus } from '@/lib/types';

export default function AdminManagementPage() {
  const { addToast } = useToast();

  const [adminList, setAdminList] = useState<User[]>(admins);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [inviting, setInviting] = useState(false);

  // Status toggle
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  const handleInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminName.trim()) {
      addToast('error', 'Name Required', 'Please enter administrator full name.');
      return;
    }

    if (!validateEmail(newAdminEmail)) {
      addToast('error', 'Invalid Email', 'Please provide a valid work email address.');
      return;
    }

    setInviting(true);

    setTimeout(() => {
      const newAdmin: User = {
        id: `adm_${Date.now()}`,
        email: newAdminEmail.trim().toLowerCase(),
        fullName: newAdminName.trim(),
        phone: newAdminPhone.trim() || '+234 800 000 0000',
        role: 'admin',
        memberRef: `DBA-000${adminList.length + 1}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAdminList((prev) => [...prev, newAdmin]);
      setInviting(false);
      setInviteModalOpen(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');

      addToast(
        'success',
        'Administrator Provisioned',
        `Invitation and secure role provisioning dispatched to ${newAdmin.email}.`
      );
    }, 1500);
  };

  const handleToggleAdminStatus = () => {
    if (!selectedAdmin) return;

    if (selectedAdmin.id === currentAdmin.id) {
      addToast('error', 'Action Restricted', 'You cannot suspend your own active administrator session.');
      setConfirmToggleOpen(false);
      return;
    }

    const nextStatus: AccountStatus = selectedAdmin.status === 'active' ? 'suspended' : 'active';
    selectedAdmin.status = nextStatus;

    setAdminList([...adminList]);
    setConfirmToggleOpen(false);

    addToast(
      'info',
      'Administrator Status Changed',
      `${selectedAdmin.fullName}'s administrative access is now ${nextStatus.toUpperCase()}.`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Access & Role Governance"
        description="Authorized administrative accounts with executive privileges over ledger entries, member verifications, and disbursements."
        actions={
          <button
            onClick={() => setInviteModalOpen(true)}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Provision Administrator
          </button>
        }
      />

      {/* Security Governance Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex items-start gap-3">
        <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Strict Role Governance:</strong> Ordinary members cannot
          create or elevate accounts to administrator status. Role assignment occurs strictly via
          trusted server-side auth procedures (`app_metadata.role`). The Supabase service-role key is
          never exposed in client code.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Administrators"
          value={adminList.filter((a) => a.status === 'active').length.toString()}
          subtitle="Authorized operators"
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Suspended Accounts"
          value={adminList.filter((a) => a.status === 'suspended').length.toString()}
          subtitle="Revoked permissions"
          icon={<UserX className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Dual-Role Separation"
          value="Enforced"
          subtitle="Member & Admin isolated"
          icon={<Shield className="h-5 w-5 text-brand-900" />}
        />
      </div>

      {/* Administrators Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Administrator Register</h3>
            <p className="text-xs text-surface-500">Authorized cooperative officers and system managers</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50/50">
                <th className="table-header">Admin ID</th>
                <th className="table-header">Full Name & Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Assigned Role</th>
                <th className="table-header">Date Added</th>
                <th className="table-header">Access Status</th>
                <th className="table-header text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {adminList.map((adm) => (
                <tr key={adm.id} className="hover:bg-surface-50/70 transition-colors">
                  <td className="table-cell font-mono font-bold text-surface-900">{adm.memberRef}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={adm.fullName} size="sm" className="bg-emerald-700 text-white" />
                      <div>
                        <p className="font-semibold text-surface-900 leading-tight">
                          {adm.fullName}
                          {adm.id === currentAdmin.id && (
                            <span className="ml-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-surface-400 leading-tight">{adm.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-surface-600">{adm.phone}</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                      Administrator
                    </span>
                  </td>
                  <td className="table-cell text-surface-600">{formatDate(adm.createdAt)}</td>
                  <td className="table-cell">
                    <StatusBadge status={adm.status} />
                  </td>
                  <td className="table-cell text-right">
                    {adm.id !== currentAdmin.id ? (
                      <button
                        onClick={() => {
                          setSelectedAdmin(adm);
                          setConfirmToggleOpen(true);
                        }}
                        className={`text-xs px-2.5 py-1 rounded font-medium ${
                          adm.status === 'active'
                            ? 'text-red-700 hover:bg-red-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {adm.status === 'active' ? 'Suspend Access' : 'Reactivate'}
                      </button>
                    ) : (
                      <span className="text-surface-400 italic text-[11px]">Active Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PROVISION ADMINISTRATOR MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !inviting && setInviteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-modal border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Provision Administrator Account</h3>
            <p className="text-xs text-surface-500 mt-1">
              Add an authorized officer to manage member verification and disbursements.
            </p>

            <form onSubmit={handleInviteAdmin} className="mt-4 space-y-4 text-xs">
              <div>
                <label htmlFor="admName" className="label text-xs">
                  Full Name
                </label>
                <input
                  id="admName"
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Samuel Adebayo"
                  required
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label htmlFor="admEmail" className="label text-xs">
                  Official Email Address
                </label>
                <input
                  id="admEmail"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="samuel@deblossom.coop"
                  required
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label htmlFor="admPhone" className="label text-xs">
                  Phone Number
                </label>
                <input
                  id="admPhone"
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+234 802 xxx xxxx"
                  className="input-field text-xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                <strong>Server-Side Workflow:</strong> Account credentials and administrative claims
                (`app_metadata.role: &quot;admin&quot;`) are generated through trusted server-side Auth
                provisioning.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-200">
                <button
                  type="button"
                  disabled={inviting}
                  onClick={() => setInviteModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    'Provision Administrator'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      {selectedAdmin && (
        <ConfirmDialog
          open={confirmToggleOpen}
          title={
            selectedAdmin.status === 'active'
              ? `Suspend ${selectedAdmin.fullName}?`
              : `Reactivate ${selectedAdmin.fullName}?`
          }
          message={
            selectedAdmin.status === 'active'
              ? 'This will immediately revoke their administrative console access and verification permissions.'
              : 'This will restore their full administrative privileges.'
          }
          confirmLabel={selectedAdmin.status === 'active' ? 'Suspend Access' : 'Restore Access'}
          variant={selectedAdmin.status === 'active' ? 'danger' : 'accent'}
          onConfirm={handleToggleAdminStatus}
          onCancel={() => setConfirmToggleOpen(false)}
        />
      )}
    </div>
  );
}
