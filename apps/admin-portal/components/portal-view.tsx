'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Role = 'member' | 'admin'
type Profile = { full_name: string; email: string; member_number: string; role: Role }

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

export default function PortalView({ requiredRole }: { requiredRole: Role }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({ members: 0, savings: 0, loans: 0, transactions: 0 })
  const [message, setMessage] = useState('Loading De-Blossom...')

  useEffect(() => { void load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/'); return }

    const { data: currentProfile } = await supabase.from('profiles').select('full_name, email, member_number, role').eq('id', user.id).maybeSingle()
    if (!currentProfile || currentProfile.role !== requiredRole) {
      router.replace(currentProfile?.role === 'admin' ? '/admin' : '/member')
      return
    }

    const accountQuery = requiredRole === 'member' ? supabase.from('savings_accounts').select('balance').eq('user_id', user.id) : supabase.from('savings_accounts').select('balance')
    const loanQuery = requiredRole === 'member' ? supabase.from('loans').select('outstanding_balance').eq('user_id', user.id) : supabase.from('loans').select('outstanding_balance')
    const transactionQuery = requiredRole === 'member' ? supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id) : supabase.from('transactions').select('id', { count: 'exact', head: true })
    const [{ count: members }, { data: accounts }, { data: loans }, { count: transactions }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      accountQuery,
      loanQuery,
      transactionQuery,
    ])

    setProfile(currentProfile)
    setStats({ members: members ?? 0, savings: (accounts ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0), loans: (loans ?? []).reduce((sum, row) => sum + Number(row.outstanding_balance ?? 0), 0), transactions: transactions ?? 0 })
    setMessage('')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (!profile) return <main className="page"><p className="muted">{message}</p></main>

  return <main className="page"><div className="dashboard"><header className="topbar"><div><span className="mark small">D</span><span className="brand">De-Blossom</span></div><button className="link-button" onClick={signOut}>Sign out</button></header><section className="welcome"><p className="kicker">{requiredRole === 'admin' ? 'Admin dashboard' : 'Member dashboard'}</p><h1>Welcome back, {profile.full_name}</h1><p className="muted">{profile.email} · {profile.member_number}</p></section><section className="stats"><article className="panel"><span className="muted">{requiredRole === 'admin' ? 'Members' : 'Transactions'}</span><strong>{requiredRole === 'admin' ? stats.members : stats.transactions}</strong></article><article className="panel"><span className="muted">Savings balance</span><strong>{money(stats.savings)}</strong></article><article className="panel"><span className="muted">Outstanding loans</span><strong>{money(stats.loans)}</strong></article></section><section className="panel table-panel"><div><h2>{requiredRole === 'admin' ? 'Admin access confirmed' : 'Your account is ready'}</h2><p className="muted">Live data from Supabase.</p></div><span className="status">{requiredRole}</span></section></div></main>
}
