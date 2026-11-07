'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  HandCoins,
  FileText,
  Landmark,
  RefreshCw,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Bell,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { currentAdmin, notifications } from '@/lib/mock-data';
import { Avatar, MockBanner } from '@/components/ui/shared';
import { ThemeToggle } from '@/components/ui/theme-provider';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const adminNavItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Members', href: '/admin/members', icon: Users },
  { name: 'Contributions', href: '/admin/contributions', icon: HandCoins },
  { name: 'Loan Applications', href: '/admin/loan-applications', icon: FileText },
  { name: 'Active Loans', href: '/admin/loans', icon: Landmark },
  { name: 'Repayments', href: '/admin/repayments', icon: RefreshCw },
  { name: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { name: 'Cooperative Settings', href: '/admin/settings', icon: Settings },
  { name: 'Admin Management', href: '/admin/administrators', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState(
    notifications.filter(
      (n) =>
        n.userId === currentAdmin.id ||
        n.type === 'loan_application_received' ||
        n.type === 'contribution_submitted'
    )
  );

  const unreadCount = adminNotifs.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setAdminNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'Notifications', 'All administrative alerts marked as read.');
  };

  const handleLogout = () => {
    addToast('info', 'Signed Out', 'You have been signed out from the administrative portal.');
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-darkSurface-bg flex flex-col transition-colors duration-200">
      <MockBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Admin Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-darkSurface-card border-r border-surface-200 dark:border-darkSurface-border shrink-0 transition-colors duration-200">
          {/* Logo & Admin Badge */}
          <div className="p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand-900 dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
                DB
              </div>
              <div>
                <span className="font-bold text-base text-surface-900 dark:text-white tracking-tight block leading-tight">DE-BLOSSOM</span>
                <span className="text-[10px] font-semibold text-accent-700 dark:text-emerald-400 tracking-wider uppercase block">Admin Console</span>
              </div>
            </Link>
          </div>

          {/* Admin user quick badge */}
          <div className="px-5 py-4 border-b border-surface-100 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/40 flex items-center gap-3">
            <Avatar name={currentAdmin.fullName} size="sm" className="bg-emerald-700 text-white" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{currentAdmin.fullName}</p>
              <p className="text-xs text-surface-500 dark:text-slate-400 font-mono truncate">{currentAdmin.memberRef}</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
              Admin
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                      : 'text-surface-700 hover:text-surface-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-darkSurface-hover'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-surface-500 dark:text-slate-400')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme switcher & Logout */}
          <div className="p-3 border-t border-surface-200 dark:border-darkSurface-border space-y-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-surface-600 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>

            <Link
              href="/member"
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-surface-600 dark:text-slate-400 hover:text-surface-900 hover:bg-slate-100 dark:hover:text-white rounded-lg dark:hover:bg-darkSurface-hover transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Switch to Member View
              </span>
              <span className="bg-surface-200 dark:bg-slate-800 text-surface-700 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-medium">Demo</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex animate-fade-in">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-white dark:bg-darkSurface-card flex flex-col h-full shadow-2xl transition-colors">
              <div className="p-4 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-brand-900 dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    DB
                  </div>
                  <div>
                    <span className="font-bold text-base text-surface-900 dark:text-white block">DE-BLOSSOM</span>
                    <span className="text-[10px] text-accent-700 dark:text-emerald-400 uppercase font-semibold">Admin Console</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-surface-100 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/40 flex items-center gap-3">
                <Avatar name={currentAdmin.fullName} size="sm" className="bg-emerald-700 text-white" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{currentAdmin.fullName}</p>
                  <p className="text-xs text-surface-500 dark:text-slate-400 font-mono truncate">{currentAdmin.memberRef}</p>
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-900 text-white dark:bg-emerald-600'
                          : 'text-surface-700 dark:text-slate-300 hover:text-surface-900 hover:bg-slate-100 dark:hover:bg-darkSurface-hover'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-surface-400 dark:text-slate-400')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-surface-200 dark:border-darkSurface-border space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs text-surface-500 dark:text-slate-400">Theme</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header Bar */}
          <header className="h-16 bg-white dark:bg-darkSurface-card border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:text-slate-400 dark:hover:text-white"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-xs text-surface-400 dark:text-slate-400 font-medium">Cooperative Operations</span>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">Administrator Workbench</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Notification Popover */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-darkSurface-hover transition-colors"
                  aria-label="View admin alerts"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-subtle">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-darkSurface-card rounded-2xl shadow-modal border border-surface-200 dark:border-darkSurface-border z-50 overflow-hidden animate-scale-in">
                    <div className="p-3.5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between bg-surface-50 dark:bg-darkSurface-bg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-900 dark:text-white">Operations Feed</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} pending
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-700 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 dark:divide-darkSurface-border">
                      {adminNotifs.length === 0 ? (
                        <div className="p-6 text-center text-xs text-surface-400">
                          No pending operations alerts.
                        </div>
                      ) : (
                        adminNotifs.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              'p-3.5 transition-colors text-left',
                              !n.read ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-darkSurface-hover'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-surface-900 dark:text-white">{n.title}</p>
                              <span className="text-[10px] text-surface-400 whitespace-nowrap">
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-surface-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Administrator Avatar */}
              <div className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-surface-100/60 dark:bg-darkSurface-input">
                <Avatar name={currentAdmin.fullName} size="sm" className="bg-emerald-700 text-white" />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-surface-900 dark:text-white leading-tight">{currentAdmin.fullName}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-tight uppercase tracking-wider">
                    Executive Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
