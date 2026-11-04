'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Home,
  Landmark,
  Menu,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'

type Account = { id: string; account_type: 'Savings' | 'Shares' | 'Special Savings'; balance: number; created_at: string }
type Transaction = {
  id: string
  description: string
  amount: number
  transaction_date: string
  transaction_type: 'Credit' | 'Debit'
  account_type: 'Savings' | 'Shares' | 'Special Savings'
}
type Loan = { id: string; outstanding_balance: number; status: string; due_date: string | null }
type Profile = { id: string; full_name: string; email: string; member_number: string; role: 'member' | 'admin'; phone: string | null }

export type MemberPortalData = {
  profile: Profile
  accounts: Account[]
  transactions: Transaction[]
  loans: Loan[]
}
export type MemberSection = 'overview' | 'accounts' | 'payment' | 'history' | 'loans' | 'profile'

const navigation: { href: MemberSection; label: string; icon: typeof Home }[] = [
  { href: 'overview', label: 'Overview', icon: Home },
  { href: 'accounts', label: 'My accounts', icon: WalletCards },
  { href: 'payment', label: 'Make payment', icon: Plus },
  { href: 'history', label: 'Payment history', icon: ReceiptText },
  { href: 'loans', label: 'Loans', icon: Landmark },
  { href: 'profile', label: 'Profile', icon: UserRound },
]

const accountLabels: Record<Account['account_type'], string> = {
  Savings: 'Regular savings',
  Shares: 'Shares',
  'Special Savings': 'Special savings',
}

const accountDescriptions: Record<Account['account_type'], string> = {
  Savings: 'Your everyday cooperative savings',
  Shares: 'Your ownership in the society',
  'Special Savings': 'A dedicated goal-based balance',
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-heading">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  )
}

function StatusBadge({ status }: { status: 'Pending' | 'Approved' | 'Rejected' }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><span className="status-dot" />{status}</span>
}

function AccountCard({ account, featured = false }: { account: Account; featured?: boolean }) {
  return (
    <article className={`account-card ${featured ? 'featured' : ''}`}>
      <div className="account-card-top">
        <div className="metric-icon"><WalletCards /></div>
        <span className="account-type">{accountLabels[account.account_type]}</span>
      </div>
      <p className="account-description">{accountDescriptions[account.account_type]}</p>
      <p className="account-balance">{formatMoney(Number(account.balance ?? 0))}</p>
      <div className="account-footer"><span>Current balance</span><span className="account-arrow"><ArrowUpRight /></span></div>
    </article>
  )
}

function TransactionsTable({ transactions, compact = false }: { transactions: Transaction[]; compact?: boolean }) {
  const rows = compact ? transactions.slice(0, 5) : transactions
  return (
    <div className="table-wrap">
      {rows.length ? (
        <table>
          <thead><tr><th>Activity</th><th>Account</th><th>Date</th><th className="amount-cell">Amount</th></tr></thead>
          <tbody>{rows.map((transaction) => {
            const credit = transaction.transaction_type === 'Credit'
            return <tr key={transaction.id}>
              <td><div className="activity-cell"><span className={`activity-icon ${credit ? 'credit' : 'debit'}`}>{credit ? <ArrowDownLeft /> : <ArrowUpRight />}</span><span><strong>{transaction.description}</strong><small>{credit ? 'Contribution received' : 'Debit recorded'}</small></span></div></td>
              <td>{accountLabels[transaction.account_type]}</td>
              <td>{formatDate(transaction.transaction_date)}</td>
              <td className={`amount-cell ${credit ? 'amount-credit' : 'amount-debit'}`}>{credit ? '+' : '-'}{formatMoney(Number(transaction.amount ?? 0))}</td>
            </tr>
          })}</tbody>
        </table>
      ) : <div className="empty-state"><BookOpen /><span>No verified account transactions yet.</span></div>}
    </div>
  )
}

function Overview({ data }: { data: MemberPortalData }) {
  const { profile, accounts, transactions, loans } = data
  const totalSavings = accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0)
  const loanBalance = loans.reduce((sum, loan) => sum + Number(loan.outstanding_balance ?? 0), 0)
  return <div className="content-stack">
    <div className="welcome-row">
      <div><p className="eyebrow">Member overview</p><h1 className="welcome-title">Good morning, {profile.full_name.split(' ')[0]}</h1><p className="welcome-copy">Here&apos;s a clear view of your cooperative finances.</p></div>
      <Link className="primary-action" href="/member/payment"><Plus /> Make a payment <ArrowRight /></Link>
    </div>
    <section className="hero-balance">
      <div><p className="eyebrow light">Total across savings</p><p className="hero-value">{formatMoney(totalSavings)}</p><p className="hero-helper">Across {accounts.length} account{accounts.length === 1 ? '' : 's'} · Member {profile.member_number}</p></div>
      <div className="hero-mark"><ShieldCheck /></div>
    </section>
    <section className="metric-grid">
      {accounts.map((account, index) => <AccountCard key={account.id} account={account} featured={index === 0} />)}
      {loans.length > 0 && <article className="metric-card loan-card"><div className="metric-icon yellow"><Landmark /></div><div><p className="metric-label">Loan balance</p><p className="metric-value">{formatMoney(loanBalance)}</p><p className="metric-helper">{loans.filter((loan) => loan.status === 'Active').length} active loan{loans.filter((loan) => loan.status === 'Active').length === 1 ? '' : 's'}</p></div></article>}
    </section>
    <section className="dashboard-grid">
      <div className="panel"><div className="panel-header"><div><h3>Recent account activity</h3><p>Verified transactions from your accounts</p></div><Link className="text-link" href="/member/history">View all <ChevronRight /></Link></div><TransactionsTable transactions={transactions} compact /></div>
      <div className="panel status-panel"><div className="panel-header"><div><h3>Member snapshot</h3><p>Your details at a glance</p></div><UserRound className="panel-icon" /></div><div className="snapshot-list"><div><span>Member number</span><strong className="member-number">{profile.member_number}</strong></div><div><span>Email</span><strong>{profile.email}</strong></div><div><span>Phone</span><strong>{profile.phone || 'Not added'}</strong></div><div><span>Account status</span><strong className="status-good"><span className="status-dot" />Active</strong></div></div><Link className="panel-link" href="/member/profile">View profile <ArrowRight /></Link></div>
    </section>
    <section className="quick-actions"><div><p className="eyebrow">Shortcuts</p><h2>What would you like to do?</h2></div><div className="quick-action-grid"><Link href="/member/payment"><CreditCard /><span><strong>Make a payment</strong><small>Record a bank transfer</small></span><ArrowRight /></Link><Link href="/member/accounts"><WalletCards /><span><strong>View accounts</strong><small>See all balances</small></span><ArrowRight /></Link><Link href="/member/profile"><Settings /><span><strong>Update profile</strong><small>Keep details current</small></span><ArrowRight /></Link></div></section>
  </div>
}

function Accounts({ data }: { data: MemberPortalData }) {
  return <div className="content-stack"><PageIntro eyebrow="My accounts" title="Your cooperative accounts" description="A single view of the balances held in your name." action={<Link className="secondary-action" href="/member/payment"><Plus /> Make a payment</Link>} /><section className="account-grid">{data.accounts.map((account) => <AccountCard key={account.id} account={account} />)}</section><section className="panel"><div className="panel-header"><div><h3>Recent activity across accounts</h3><p>These are verified records already posted to your accounts.</p></div></div><TransactionsTable transactions={data.transactions} /></section></div>
}

function History({ data }: { data: MemberPortalData }) {
  const [query, setQuery] = useState('')
  const transactions = data.transactions.filter((transaction) => `${transaction.description} ${transaction.account_type}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="content-stack"><PageIntro eyebrow="Payment history" title="Your verified activity" description="Review contributions and debits already reflected in your cooperative accounts." action={<Link className="secondary-action" href="/member/payment"><Plus /> Record a payment</Link>} /><div className="notice"><ShieldCheck /><p><strong>Verified account transactions</strong> are separate from submitted bank-transfer receipts. A payment only affects your balance after administrative verification.</p></div><section className="panel"><div className="filter-bar"><div><h3>Transaction history</h3><p>{transactions.length} record{transactions.length === 1 ? '' : 's'} found</p></div><label className="search-field"><Search /><input aria-label="Search transaction history" placeholder="Search activity" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div><TransactionsTable transactions={transactions} /></section><section className="panel"><div className="panel-header"><div><h3>Submitted payments</h3><p>Pending, approved, and rejected receipt submissions will appear here.</p></div><StatusBadge status="Pending" /></div><div className="empty-state submission-empty"><ReceiptText /><span>Payment submission history is not connected yet. Your verified account transactions remain available above.</span></div></section></div>
}

function PaymentForm() {
  const [submitted, setSubmitted] = useState(false)
  const [receiptName, setReceiptName] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitted(true) }
  if (submitted) return <div className="confirmation-card"><div className="confirmation-icon"><Check /></div><p className="eyebrow">Review complete</p><h2>Your payment details are ready</h2><p>This frontend flow is ready for administrative verification. No balance has been changed because payment submissions are not connected to a backend table yet.</p><div className="confirmation-actions"><button className="primary-action" type="button" onClick={() => setSubmitted(false)}>Record another payment</button><Link className="secondary-action" href="/member">Return to overview</Link></div></div>
  return <form className="payment-layout" onSubmit={submit}><div className="panel form-panel"><div className="panel-header"><div><h3>Transfer details</h3><p>Tell us which cooperative account should receive your transfer.</p></div><span className="step-count">1 of 2</span></div><div className="form-body"><label className="field"><span>Account to credit</span><select required defaultValue=""><option value="" disabled>Select an account</option><option>Regular savings</option><option>Shares</option><option>Special savings</option></select></label><label className="field"><span>Amount</span><div className="input-prefix"><span>₦</span><input required min="1" type="number" placeholder="0.00" /></div></label><div className="form-grid"><label className="field"><span>Transfer date</span><input required type="date" /></label><label className="field"><span>Transfer reference <small>Optional</small></span><input placeholder="e.g. TRF-12345" /></label></div><label className="field"><span>Receipt upload <small>Optional for now</small></span><label className="upload-field"><Upload /><span>{receiptName || 'Choose a PDF, JPG or PNG receipt'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setReceiptName(event.target.files?.[0]?.name || '')} /></label></label><div className="form-actions"><button className="primary-action" type="submit">Review payment <ArrowRight /></button></div></div></div><aside className="payment-aside"><div className="panel"><div className="panel-header"><div><h3>Cooperative bank details</h3><p>Configured details will appear here.</p></div><Landmark className="panel-icon" /></div><div className="missing-config"><CircleHelp /><p>Bank transfer details have not been configured in the current application. Please contact the cooperative administrator before transferring funds.</p></div></div><div className="notice"><ShieldCheck /><p>Receipts are subject to administrative verification. Submitting a receipt does not update your balance automatically.</p></div></aside></form>
}

function Loans({ data }: { data: MemberPortalData }) {
  return <div className="content-stack"><PageIntro eyebrow="Loans" title="Your loan commitments" description="Track outstanding balances from loans already recorded for your membership." />{data.loans.length ? <div className="loan-list">{data.loans.map((loan) => <article className="panel loan-row" key={loan.id}><div className="metric-icon yellow"><Landmark /></div><div className="loan-info"><strong>{loan.status} loan</strong><span>{loan.due_date ? `Due ${formatDate(loan.due_date)}` : 'No due date recorded'}</span></div><div className="loan-amount"><small>Outstanding</small><strong>{formatMoney(Number(loan.outstanding_balance ?? 0))}</strong></div></article>)}</div> : <div className="panel empty-panel"><Landmark /><h3>No loans recorded</h3><p>There are no loan records linked to your member profile.</p></div>}</div>
}

function Profile({ profile }: { profile: Profile }) {
  return <div className="content-stack"><PageIntro eyebrow="Profile" title="Your member profile" description="The identity details attached to your cooperative membership." /><section className="profile-layout"><div className="panel profile-banner"><div className="avatar large">{initials(profile.full_name)}</div><div><p className="eyebrow">Member since</p><h2>{profile.full_name}</h2><p>{profile.member_number}</p></div><span className="status-badge approved"><span className="status-dot" />Active member</span></div><div className="panel form-panel"><div className="panel-header"><div><h3>Personal information</h3><p>Contact the cooperative administrator if these details need to change.</p></div></div><div className="form-body profile-fields"><label className="field"><span>Full name</span><input value={profile.full_name} readOnly /></label><label className="field"><span>Email address</span><input value={profile.email} readOnly /></label><label className="field"><span>Phone number</span><input value={profile.phone || 'Not added'} readOnly /></label><label className="field"><span>Member number</span><input value={profile.member_number} readOnly /></label></div></div></section></div>
}

export default function MemberPortalClient({ data, section }: { data: MemberPortalData; section: MemberSection }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = navigation.find((item) => item.href === section)?.label || 'Overview'
  return <div className="portal"><aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}><div className="brand"><div className="brand-mark">D</div><div><p className="brand-name">De-Blossom</p><p className="brand-subtitle">Cooperative Society</p></div><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X /></button></div><div className="member-mini"><div className="avatar">{initials(data.profile.full_name)}</div><div><strong>{data.profile.full_name}</strong><p className="member-id">{data.profile.member_number}</p></div></div><nav className="sidebar-nav" aria-label="Member navigation"><div className="nav-section"><p className="nav-label">Workspace</p>{navigation.slice(0, 5).map((item) => { const Icon = item.icon; return <Link key={item.href} className={`nav-item ${section === item.href ? 'active' : ''}`} href={`/member/${item.href}`} onClick={() => setMobileOpen(false)}><Icon />{item.label}</Link> })}</div><div className="nav-section"><p className="nav-label">Account</p>{navigation.slice(5).map((item) => { const Icon = item.icon; return <Link key={item.href} className={`nav-item ${section === item.href ? 'active' : ''}`} href={`/member/${item.href}`} onClick={() => setMobileOpen(false)}><Icon />{item.label}</Link> })}</div></nav><div className="sidebar-footer"><div className="help-card"><div className="help-icon"><CircleHelp /></div><div><strong>Need help?</strong><small>Contact the cooperative office</small></div></div><p className="version">Member portal · v1.0</p></div></aside>{mobileOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}<div className="main-shell"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu /></button><div><p className="eyebrow">Member portal</p><p className="page-title">{title}</p></div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell /><span className="notification-dot" /></button><div className="profile-chip"><div className="avatar">{initials(data.profile.full_name)}</div><span>{data.profile.full_name}</span></div></div></header><main className="portal-content">{section === 'overview' && <Overview data={data} />}{section === 'accounts' && <Accounts data={data} />}{section === 'payment' && <><PageIntro eyebrow="Make a payment" title="Record a bank transfer" description="Submit your transfer details for the cooperative team to verify." /><PaymentForm /></>}{section === 'history' && <History data={data} />}{section === 'loans' && <Loans data={data} />}{section === 'profile' && <Profile profile={data.profile} />}</main></div></div>
}
