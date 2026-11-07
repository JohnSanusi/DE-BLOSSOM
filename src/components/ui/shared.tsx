'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { InfoTooltip } from './tooltip';

// ─── Badge ───────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const badgeVariants = {
  default: 'bg-surface-100 text-surface-700 border-surface-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60',
  danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/60',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors',
        getStatusColor(status)
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cn('card animate-fade-in', paddingMap[padding], className)}>
      {children}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  tooltip?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, tooltip, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-start gap-4 hover:-translate-y-0.5 transition-transform duration-200', className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-surface-600 dark:text-slate-300 truncate">{title}</p>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        <p className="text-xl font-bold text-surface-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-surface-500 dark:text-slate-300 mt-0.5 truncate">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs font-semibold mt-1 flex items-center gap-1',
              trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400 dark:bg-slate-800 dark:text-slate-500 mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-bold text-surface-900 dark:text-white">{title}</h3>
      <p className="text-xs text-surface-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Shimmer Loading Skeleton ────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton-shimmer rounded-md', className)} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </Card>
  );
}

// ─── Avatar ──────────────────────────────────────────────────
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold dark:bg-emerald-950 dark:text-emerald-300',
        sizeMap[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-surface-200 dark:border-darkSurface-border px-4 py-3">
      <p className="text-xs text-surface-500 dark:text-slate-400">
        Page <span className="font-semibold text-surface-900 dark:text-white">{page}</span> of {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-ghost text-xs px-2.5 py-1 disabled:opacity-30"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          let pageNum: number;
          if (totalPages <= 5) pageNum = i + 1;
          else if (page <= 3) pageNum = i + 1;
          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = page - 2 + i;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                page === pageNum
                  ? 'bg-brand-900 text-white dark:bg-emerald-600'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-slate-300 dark:hover:bg-darkSurface-hover'
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost text-xs px-2.5 py-1 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'accent';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  const btnClass =
    variant === 'danger' ? 'btn-danger' : variant === 'accent' ? 'btn-accent' : 'btn-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-darkSurface-card dark:border dark:border-darkSurface-border p-6 shadow-modal animate-scale-in">
        <h3 className="text-base font-bold text-surface-900 dark:text-white">{title}</h3>
        <p className="text-xs text-surface-600 dark:text-slate-300 mt-2 leading-relaxed">{message}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="flex justify-end gap-2.5 mt-6">
          <button onClick={onCancel} className="btn-secondary text-xs">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={cn(btnClass, 'text-xs')}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────
interface TabsProps {
  tabs: { label: string; value: string; count?: number }[];
  activeTab: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-surface-200 dark:border-darkSurface-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition-all duration-150',
            activeTab === tab.value
              ? 'border-brand-900 text-brand-900 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-surface-500 hover:text-surface-800 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                activeTab === tab.value
                  ? 'bg-brand-100 text-brand-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-surface-100 text-surface-600 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Search Input ────────────────────────────────────────────
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 dark:text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 text-xs"
      />
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
  placeholder?: string;
}

export function Select({ value, onChange, options, className, placeholder }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-field pr-9 text-xs"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400 dark:text-slate-500 pointer-events-none" />
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-xs text-surface-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

// ─── Mock Banner ─────────────────────────────────────────────
export function MockBanner() {
  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 text-center transition-colors">
      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium tracking-wide">
        Prototype Mode — Operating on verified mock financial records. No real funds are moved.
      </p>
    </div>
  );
}

// ─── Tooltips ────────────────────────────────────────────────
export { Tooltip, InfoTooltip } from './tooltip';
