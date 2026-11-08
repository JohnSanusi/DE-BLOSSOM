'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { AccountStatus } from '@/lib/types';

export default function AdminManagementPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [adminList, setAdminList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Status toggle
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  const loadAdmins = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setAdminList(
          data.map((a) => ({
            id: a.id,
            email: a.email,
            fullName: a.full_name,
            phone: a.phone || 'N/A',
            role: a.role,
            memberRef: a.member_ref || 'ADM',
            status: a.status || 'active',
            createdAt: a.created_at,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [user]);

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(newAdminEmail)) {
      addToast('error', 'Invalid Email', 'Please provide a valid registered member email address.');
      return;
    }

    setInviting(true);
    try {
      const supabase = createClient();
      // Look up member profile by email
      const { data: memberProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newAdminEmail.trim().toLowerCase())
        .maybeSingle();

      if (findError || !memberProfile) {
        addToast(
          'error',
          'Member Not Found',
          'No account with that email was found. The user must register first before being elevated to administrator.'
        );
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', memberProfile.id);

      if (updateError) throw updateError;

      addToast(
        'success',
        'Administrator Elevated',
        `${memberProfile.full_name} (${newAdminEmail}) is now an administrator.`
      );
      setInviteModalOpen(false);
      setNewAdminEmail('');
      await loadAdmins();
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Could not promote administrator');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleAdminStatus = async () => {
    if (!selectedAdmin) return;
    if (selectedAdmin.id === user?.id) {
      addToast('error', 'Action Restricted', 'You cannot suspend your own active administrator session.');
      setConfirmToggleOpen(false);
      return;
    }

    const nextStatus: AccountStatus = selectedAdmin.status === 'active' ? 'suspended' : 'active';
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      addToast(
        'info',
        'Status Changed',
        `${selectedAdmin.fullName}'s administrative access is now ${nextStatus.toUpperCase()}.`
      );
      setConfirmToggleOpen(false);
      await loadAdmins();
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Could not update status');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Access & Role Governance"
        description="Authorized administrative accounts with executive privileges over ledger entries, member verifications, and disbursements."
        actions={
          <button
            onClick={() => setInviteModalOpen(true)}
            className="btn-primary text-xs flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Promote Member to Admin
          </button>
        }
      />

      {/* Security Governance Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex items-start gap-3">
        <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Strict Role Governance:</strong> Ordinary members cannot
          create or elevate accounts to administrator status. Role assignment occurs strictly via
          privileged database rules. The Supabase service-role key is never exposed in client code.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Administrators"
          value={adminList.filter((a) => a.status === 'active').length.toString()}
          subtitle="Authorized operators"
          icon={<UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Suspended Accounts"
          value={adminList.filter((a) => a.status === 'suspended').length.toString()}
          subtitle="Revoked permissions"
          icon={<UserX className="h-5 w-5 text-red-600 dark:text-red-400" />}
        />
        <StatCard
          title="Dual-Role Separation"
          value="Enforced"
          subtitle="Member & Admin isolated"
          icon={<Shield className="h-5 w-5 text-brand-900 dark:text-sky-400" />}
        />
      </div>

      {/* Administrators Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Administrator Register</h3>
            <p className="text-xs text-surface-500 dark:text-slate-400">Authorized cooperative officers and system managers</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-xs">Loading administrator register...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-200 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/50">
                  <th className="table-header">Admin ID</th>
                  <th className="table-header">Full Name & Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Assigned Role</th>
                  <th className="table-header">Date Added</th>
                  <th className="table-header">Access Status</th>
                  <th className="table-header text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-darkSurface-border">
                {adminList.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50 dark:hover:bg-darkSurface-hover transition-colors">
                    <td className="table-cell font-mono font-bold text-surface-900 dark:text-white">{adm.memberRef}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={adm.fullName} size="sm" className="bg-emerald-700 text-white" />
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-white leading-tight">
                            {adm.fullName}
                            {adm.id === user?.id && (
                              <span className="ml-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-surface-400 dark:text-slate-400 leading-tight">{adm.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-surface-600 dark:text-slate-300">{adm.phone}</td>
                    <td className="table-cell uppercase font-bold text-[10px] text-emerald-700 dark:text-emerald-400">
                      {adm.role}
                    </td>
                    <td className="table-cell text-surface-500 dark:text-slate-400">{formatDate(adm.createdAt)}</td>
                    <td className="table-cell"><StatusBadge status={adm.status} /></td>
                    <td className="table-cell text-right">
                      {adm.id !== user?.id && (
                        <button
                          onClick={() => {
                            setSelectedAdmin(adm);
                            setConfirmToggleOpen(true);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            adm.status === 'active'
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {adm.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Promote Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !inviting && setInviteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-darkSurface-card p-6 shadow-modal border border-surface-200 dark:border-darkSurface-border">
            <h3 className="text-base font-bold text-surface-900 dark:text-white">Promote Member to Administrator</h3>
            <p className="text-xs text-surface-500 dark:text-slate-400 mt-1 leading-relaxed">
              Enter the registered email of an existing member to grant full administrator access to this console.
            </p>

            <form onSubmit={handlePromoteAdmin} className="space-y-4 mt-4">
              <div>
                <label className="label text-xs">Registered Member Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. member@email.com"
                  required
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
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
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Promote to Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Toggle Confirm */}
      {selectedAdmin && (
        <ConfirmDialog
          open={confirmToggleOpen}
          title={selectedAdmin.status === 'active' ? 'Suspend Administrator' : 'Reactivate Administrator'}
          message={`Are you sure you want to ${selectedAdmin.status === 'active' ? 'suspend' : 'reactivate'} ${selectedAdmin.fullName}?`}
          confirmLabel={selectedAdmin.status === 'active' ? 'Suspend Access' : 'Reactivate'}
          variant={selectedAdmin.status === 'active' ? 'danger' : 'primary'}
          onConfirm={handleToggleAdminStatus}
          onCancel={() => {
            setConfirmToggleOpen(false);
            setSelectedAdmin(null);
          }}
        />
      )}
    </div>
  );
}
