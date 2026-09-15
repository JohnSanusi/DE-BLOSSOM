'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Profile = {
  full_name: string
  email: string
  member_number: string
  role: 'member' | 'admin'
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function AdminPortalApp() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ members: 0, savings: 0, loans: 0 })

  useEffect(() => { void loadSession() }, [])

  async function loadSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: currentProfile } = await supabase.from('profiles').select('full_name, email, member_number, role').eq('id', user.id).maybeSingle()
    if (!currentProfile || currentProfile.role !== 'admin') {
      await supabase.auth.signOut()
      setMessage('This account does not have admin access.')
      setLoading(false)
      return
    }

    const [{ count: members }, { data: accounts }, { data: loans }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('savings_accounts').select('balance'),
      supabase.from('loans').select('outstanding_balance'),
    ])

    setProfile(currentProfile)
    setStats({
      members: members ?? 0,
      savings: (accounts ?? []).reduce((sum, account) => sum + Number(account.balance ?? 0), 0),
      loans: (loans ?? []).reduce((sum, loan) => sum + Number(loan.outstanding_balance ?? 0), 0),
    })
    setLoading(false)
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(error.message); setLoading(false); return }
    await loadSession()
  }

  async function signInWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { setMessage(error.message); setLoading(false) }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  if (loading) return <main className="page"><p className="muted">Loading De-Blossom...</p></main>

  if (!profile) return (
    <main className="page">
      <section className="auth-layout">
        <div className="intro"><span className="mark">D</span><p className="kicker">De-Blossom Cooperative Society</p><h1>One clear view of the society&apos;s financial health.</h1><p className="intro-copy">Securely manage members, savings, loans, and repayments from one workspace.</p></div>
        <form className="panel form" onSubmit={signIn}><p className="kicker">Admin workspace</p><h2>Sign in</h2><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{message && <p className="error">{message}</p>}<button type="submit" disabled={loading}>Sign in</button><div className="divider">or</div><button type="button" className="secondary" onClick={signInWithGoogle} disabled={loading}>Continue with Google</button></form>
      </section>
    </main>
  )

  return <main className="page"><div className="dashboard"><header className="topbar"><div><span className="mark small">D</span><span className="brand">De-Blossom</span></div><button className="link-button" onClick={signOut}>Sign out</button></header><section className="welcome"><p className="kicker">Admin dashboard</p><h1>Welcome back, {profile.full_name}</h1><p className="muted">Live data from your Supabase project.</p></section><section className="stats"><article className="panel"><span className="muted">Members</span><strong>{stats.members}</strong></article><article className="panel"><span className="muted">Savings balance</span><strong>{formatMoney(stats.savings)}</strong></article><article className="panel"><span className="muted">Outstanding loans</span><strong>{formatMoney(stats.loans)}</strong></article></section><section className="panel table-panel"><div><h2>Admin access confirmed</h2><p className="muted">{profile.email} · {profile.member_number}</p></div><span className="status">Live</span></section></div></main>
}
