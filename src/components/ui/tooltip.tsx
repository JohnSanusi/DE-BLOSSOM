'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
  variant?: 'info' | 'help';
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  iconClassName,
  variant = 'help',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to dismiss on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center align-middle', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        className={cn(
          'inline-flex items-center justify-center p-0.5 rounded-full text-surface-400 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 focus:outline-none transition-colors cursor-help',
          iconClassName
        )}
        aria-label="More information"
      >
        {children ? (
          children
        ) : variant === 'info' ? (
          <Info className="h-3.5 w-3.5" />
        ) : (
          <HelpCircle className="h-3.5 w-3.5" />
        )}
      </button>

      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 w-64 sm:w-72 p-2.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-100 shadow-xl border border-slate-700/80 text-xs leading-relaxed font-normal pointer-events-auto select-text animate-fade-in transition-all',
            positionClasses[position]
          )}
        >
          {content}
          {/* Subtle Arrow */}
          <span
            className={cn(
              'absolute border-4 pointer-events-none',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Convenient standalone Info icon tooltip
 */
export function InfoTooltip({
  content,
  position = 'top',
  className,
}: {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return <Tooltip content={content} position={position} className={className} variant="help" />;
}
