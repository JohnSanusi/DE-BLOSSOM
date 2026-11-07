'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { validateEmail, validatePassword, cn } from '@/lib/utils';
import { members, admins } from '@/lib/mock-data';
import { signInAction, signUpAction } from '@/app/actions/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GoogleAuthButton({
  label,
  onStart,
  onError,
}: {
  label: string;
  onStart?: () => void;
  onError?: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleGoogleAuth = async () => {
    setLoading(true);
    onStart?.();

    if (!isSupabaseConfigured()) {
      setLoading(false);
      addToast(
        'info',
        'Demo Mode Active',
        'Google OAuth requires real Supabase credentials in your .env.local file.'
      );
      return;
    }

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setLoading(false);
        onError?.(error.message);
        addToast('error', 'Google Sign In Failed', error.message);
      }
    } catch (err: any) {
      setLoading(false);
      onError?.(err?.message || 'Authentication error');
      addToast('error', 'Authentication Error', err?.message || 'Unable to connect to Google');
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card hover:bg-surface-50 dark:hover:bg-darkSurface-subtle text-surface-700 dark:text-slate-200 text-sm font-medium shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-surface-500" />
      ) : (
        <GoogleIcon className="h-4 w-4 shrink-0" />
      )}
      <span>{loading ? 'Connecting to Google...' : label}</span>
    </button>
  );
}

type AuthTab = 'signin' | 'register';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">DB</span>
            </div>
            <span className="text-2xl font-bold text-white">DE-BLOSSOM</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Your cooperative finances,<br />
            managed with <span className="text-accent-400">clarity</span>.
          </h2>
          <p className="text-white/60 mt-4 max-w-md leading-relaxed">
            Track savings, manage contributions, apply for loans, and stay on top of your cooperative membership — all in one place.
          </p>
        </div>
        <p className="relative text-sm text-white/40">
          © {new Date().getFullYear()} DE-BLOSSOM Cooperative Society
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-brand-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DB</span>
            </div>
            <span className="text-lg font-bold text-brand-900">DE-BLOSSOM</span>
          </div>

          <h1 className="text-2xl font-bold text-surface-900">
            {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            {activeTab === 'signin'
              ? 'Sign in to access your cooperative account.'
              : 'Register as a new member of the cooperative.'}
          </p>

          {/* Tabs */}
          <div className="flex mt-6 bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('signin')}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                activeTab === 'signin'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                activeTab === 'register'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              Register
            </button>
          </div>

          <div className="mt-6">
            {activeTab === 'signin' ? <SignInForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Enter a valid email address';

    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    if (isSupabaseConfigured()) {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await signInAction(formData);
      setLoading(false);

      if (!res.success) {
        setErrors({ form: res.error || 'Failed to sign in. Please verify your credentials.' });
        return;
      }

      addToast('success', 'Signed in successfully', 'Welcome back!');
      if (res.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/member');
      }
      return;
    }

    // Simulate mock auth delay
    await new Promise((r) => setTimeout(r, 800));

    // Mock auth: check email against mock data
    const member = members.find((m) => m.email === email);
    const admin = admins.find((a) => a.email === email);
    const user = member || admin;

    if (!user) {
      setLoading(false);
      setErrors({ form: 'Invalid email or password. Try: adaeze.okafor@email.com or admin@deblossom.coop' });
      return;
    }

    if (!user.role || (user.role !== 'member' && user.role !== 'admin')) {
      setLoading(false);
      setErrors({ form: 'Your account has not been provisioned with a valid role. Please contact the cooperative administrator.' });
      return;
    }

    addToast('success', 'Signed in successfully', `Welcome back, ${user.fullName}!`);

    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/member');
    }
  };

  return (
    <div className="space-y-4">
      {/* Google OAuth Button */}
      <GoogleAuthButton label="Sign in with Google" />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200 dark:border-darkSurface-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-50 dark:bg-darkSurface-bg px-2.5 text-surface-400 font-medium">
            Or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{errors.form}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={cn('input-field pl-10', errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
          />
        </div>
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="label">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={cn('input-field pl-10 pr-10', errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded border-surface-300 text-brand-900 focus:ring-brand-500" />
          <span className="text-sm text-surface-600">Remember me</span>
        </label>
        <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          Forgot password?
        </Link>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
        ) : (
          <>Sign In <ArrowRight className="h-4 w-4" /></>
        )}
      </button>

      <div className="mt-4 rounded-lg bg-surface-100 border border-surface-200 p-3">
        <p className="text-xs text-surface-500 font-medium mb-1">Demo Accounts</p>
        <p className="text-xs text-surface-400">Member: adaeze.okafor@email.com</p>
        <p className="text-xs text-surface-400">Admin: admin@deblossom.coop</p>
        <p className="text-xs text-surface-400 mt-1">Any password works in demo mode.</p>
      </div>
    </form>
    </div>
  );
}

function RegisterForm() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!validateEmail(form.email)) newErrors.email = 'Enter a valid email address';
    if (!form.phone) newErrors.phone = 'Phone number is required';

    const pwResult = validatePassword(form.password);
    if (!form.password) newErrors.password = 'Password is required';
    else if (!pwResult.valid) newErrors.password = pwResult.errors[0];

    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    if (isSupabaseConfigured()) {
      const formData = new FormData();
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('fullName', form.fullName);
      formData.append('phone', form.phone);

      const res = await signUpAction(formData);
      setLoading(false);

      if (!res.success) {
        setErrors({ email: res.error || 'Failed to create account.' });
        return;
      }

      setSuccess(true);
      addToast('success', 'Registration successful', 'Please check your email to verify your account.');
      return;
    }

    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
    addToast('success', 'Registration successful', 'Please check your email to verify your account.');
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900">Check your email</h3>
        <p className="text-sm text-surface-500 mt-2 max-w-sm mx-auto">
          We&apos;ve sent a verification email to <strong>{form.email}</strong>. Please verify your email address to complete your registration.
        </p>
        <p className="text-xs text-surface-400 mt-4">
          Your account will be provisioned with the member role through a secure server-side process.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth Button */}
      <GoogleAuthButton label="Sign in with Google" />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200 dark:border-darkSurface-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-50 dark:bg-darkSurface-bg px-2.5 text-surface-400 font-medium">
            Or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="label">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input id="fullName" type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Enter your full name" className={cn('input-field pl-10', errors.fullName && 'border-red-300')} />
        </div>
        {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="regEmail" className="label">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input id="regEmail" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className={cn('input-field pl-10', errors.email && 'border-red-300')} />
        </div>
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="label">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input id="phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+234 xxx xxx xxxx" className={cn('input-field pl-10', errors.phone && 'border-red-300')} />
        </div>
        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="regPassword" className="label">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input id="regPassword" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Create a strong password" className={cn('input-field pl-10 pr-10', errors.password && 'border-red-300')} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
        <div className="mt-2 grid grid-cols-2 gap-1">
          {['8+ characters', 'Uppercase letter', 'Lowercase letter', 'Number'].map((rule) => (
            <p key={rule} className="text-xs text-surface-400 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-surface-300" />
              {rule}
            </p>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Confirm your password" className={cn('input-field pl-10 pr-10', errors.confirmPassword && 'border-red-300')} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
        ) : (
          <>Create Account <ArrowRight className="h-4 w-4" /></>
        )}
      </button>

      <p className="text-xs text-surface-400 text-center mt-2">
        By registering, you agree to the cooperative&apos;s terms and conditions.
      </p>
    </form>
    </div>
  );
}
