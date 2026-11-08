'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PiggyBank,
  HandCoins,
  Landmark,
  RefreshCw,
  ArrowLeftRight,
  UserCircle,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Avatar } from '@/components/ui/shared';
import { ThemeToggle } from '@/components/ui/theme-provider';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/supabase/auth-context';

const navItems = [
  { name: 'Overview', href: '/member', icon: LayoutDashboard },
  { name: 'My Savings', href: '/member/savings', icon: PiggyBank },
  { name: 'Contributions', href: '/member/contributions', icon: HandCoins },
  { name: 'Loans', href: '/member/loans', icon: Landmark },
  { name: 'Repayments', href: '/member/repayments', icon: RefreshCw },
  { name: 'Transactions', href: '/member/transactions', icon: ArrowLeftRight },
  { name: 'My Profile', href: '/member/profile', icon: UserCircle },
  { name: 'Settings', href: '/member/settings', icon: Settings },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [memberNotifs, setMemberNotifs] = useState<any[]>([]);

  // When notifications table or user changes, notifications start empty for new real members
  useEffect(() => {
    // Leave notifications clean for live real accounts
    setMemberNotifs([]);
  }, [user]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const displayRef = profile?.member_ref || (profile as any)?.member_number || 'Pending ID';

  const unreadCount = memberNotifs.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setMemberNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'Notifications', 'All notifications marked as read.');
  };

  const handleLogout = async () => {
    await signOut();
    addToast('info', 'Signed Out', 'You have been signed out.');
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-darkSurface-bg flex flex-col transition-colors duration-200">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-darkSurface-card border-r border-surface-200 dark:border-darkSurface-border shrink-0 transition-colors duration-200">
          <div className="p-5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
            <Link href="/member" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand-900 dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
                DB
              </div>
              <div>
                <span className="font-bold text-base text-surface-900 dark:text-white tracking-tight block leading-tight">DE-BLOSSOM</span>
                <span className="text-[10px] font-semibold text-accent-700 dark:text-accent-400 tracking-wider uppercase block">Cooperative</span>
              </div>
            </Link>
          </div>

          {/* User quick badge */}
          <div className="px-5 py-4 border-b border-surface-100 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/40 flex items-center gap-3">
            <Avatar name={displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-surface-500 dark:text-slate-400 font-mono truncate">{displayRef}</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
              Member
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/member' && pathname.startsWith(item.href));
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
              <span className="text-xs text-surface-600 dark:text-slate-400">Appearance</span>
              <ThemeToggle />
            </div>

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
            <div className="relative w-72 bg-white dark:bg-darkSurface-card flex flex-col h-full shadow-2xl">
              <div className="p-4 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-brand-900 dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    DB
                  </div>
                  <span className="font-bold text-base text-surface-900 dark:text-white">DE-BLOSSOM</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-surface-100 dark:border-darkSurface-border bg-surface-50/50 dark:bg-darkSurface-bg/40 flex items-center gap-3">
                <Avatar name={displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-surface-500 dark:text-slate-400 font-mono truncate">{displayRef}</p>
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/member' && pathname.startsWith(item.href));
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

        {/* Main Content Area */}
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
                <span className="text-xs text-surface-400 dark:text-slate-400 font-medium">Cooperative Portal</span>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">Member Space</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Theme toggle in header for quick access */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Notification Center Popover */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-darkSurface-hover transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-subtle">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-darkSurface-card rounded-2xl shadow-modal border border-surface-200 dark:border-darkSurface-border z-50 overflow-hidden animate-scale-in">
                    <div className="p-3.5 border-b border-surface-200 dark:border-darkSurface-border flex items-center justify-between bg-surface-50 dark:bg-darkSurface-bg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} new
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
                      {memberNotifs.length === 0 ? (
                        <div className="p-6 text-center text-xs text-surface-400">
                          No notifications yet.
                        </div>
                      ) : (
                        memberNotifs.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              'p-3.5 transition-colors text-left',
                              !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-darkSurface-hover'
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

              {/* User Avatar & name */}
              <Link
                href="/member/profile"
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-darkSurface-hover transition-colors"
              >
                <Avatar name={displayName} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-surface-900 dark:text-white leading-tight">{displayName}</p>
                  <p className="text-[11px] text-surface-400 dark:text-slate-400 leading-tight font-mono">{displayRef}</p>
                </div>
              </Link>
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
