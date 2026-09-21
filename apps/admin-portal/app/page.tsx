'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { getSupabaseBrowserClient } from '../lib/supabase-browser'

export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { void redirectExistingSession() }, [])

  async function redirectExistingSession() {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await redirectByRole(user.id)
  }

  async function redirectByRole(userId: string) {
    const supabase = getSupabaseBrowserClient()
    const { data: profile } = await supabase.from('profiles').select('role, username').eq('id', userId).maybeSingle()
    if (profile?.role === 'admin') {
      window.location.replace('/admin')
      return
    }
    window.location.replace(profile?.username ? '/member' : '/onboarding')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const supabase = getSupabaseBrowserClient()

    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } })

    if (result.error) {
      setMessage(result.error.message)
      setLoading(false)
      return
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Account created. Check your email to confirm your account, then sign in.')
      setLoading(false)
      return
    }

    if (result.data.user) await redirectByRole(result.data.user.id)
  }

  async function googleSignIn() {
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  return <main className="page"><section className="auth-layout"><div className="intro"><span className="mark">D</span><p className="kicker">De-Blossom Cooperative Society</p><h1>Your cooperative records, made simple.</h1><p className="intro-copy">Create an account or sign in to view your savings, shares, loans, and repayments.</p><div className="trust-note"><LockKeyhole size={16} /><span>Secure access powered by Supabase</span></div></div><div className="panel form"><div className="auth-switch" role="tablist" aria-label="Authentication mode"><button className={mode === 'sign-in' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'sign-in'} onClick={() => { setMode('sign-in'); setMessage('') }}>Sign in</button><button className={mode === 'sign-up' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'sign-up'} onClick={() => { setMode('sign-up'); setMessage('') }}>Create account</button></div><p className="kicker">{mode === 'sign-in' ? 'Welcome back' : 'Join De-Blossom'}</p><h2>{mode === 'sign-in' ? 'Sign in to your account' : 'Create your account'}</h2><p className="muted">{mode === 'sign-in' ? 'Enter your details to continue.' : 'Your new account starts with member access.'}</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{message && <p className="error">{message}</p>}<button className="primary-action" type="submit" disabled={loading}>{loading ? 'Please wait...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form><div className="divider"><span>or continue with</span></div><button className="secondary" type="button" onClick={googleSignIn} disabled={loading}>Continue with Google</button></div></section></main>
}
