'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Synchronous execution on mount to avoid flash
  useEffect(() => {
    const savedTheme = localStorage.getItem('de-blossom-theme') as Theme | null;
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme)
      ? savedTheme
      : 'system';

    setThemeState(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: Theme) => {
      const systemDark = mediaQuery.matches;
      const effectiveTheme: 'light' | 'dark' =
        currentTheme === 'system' ? (systemDark ? 'dark' : 'light') : currentTheme;

      setResolvedTheme(effectiveTheme);

      const root = document.documentElement;
      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(initialTheme);

    const listener = () => {
      const active = localStorage.getItem('de-blossom-theme') as Theme | null;
      if (!active || active === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('de-blossom-theme', newTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemDark = mediaQuery.matches;
    const effectiveTheme: 'light' | 'dark' =
      newTheme === 'system' ? (systemDark ? 'dark' : 'light') : newTheme;

    setResolvedTheme(effectiveTheme);

    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Clean UI theme toggle pill / dropdown
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-darkSurface-input border border-surface-200 dark:border-darkSurface-border transition-colors',
        className
      )}
      role="radiogroup"
      aria-label="Theme selector"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
          theme === 'light'
            ? 'bg-white text-surface-900 shadow-sm dark:bg-darkSurface-hover dark:text-white'
            : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
        )}
        title="Light theme"
        aria-label="Light mode"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
          theme === 'dark'
            ? 'bg-white text-surface-900 shadow-sm dark:bg-darkSurface-hover dark:text-white'
            : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
        )}
        title="Dark theme"
        aria-label="Dark mode"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={cn(
          'p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
          theme === 'system'
            ? 'bg-white text-surface-900 shadow-sm dark:bg-darkSurface-hover dark:text-white'
            : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
        )}
        title="Auto device theme"
        aria-label="Follow device theme"
      >
        <Monitor className="h-3.5 w-3.5 text-emerald-500" />
      </button>
    </div>
  );
}
