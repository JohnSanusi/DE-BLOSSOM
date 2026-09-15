import { redirect } from 'next/navigation'
import { getMemberPortalData } from '@/lib/queries/portal'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function CooperativePortal() {
  const data = await getMemberPortalData()

  if (!data || !data.profile) {
    redirect('/sign-in')
  }

  const accounts = (data.accounts ?? []) as Array<{ account_type: string; balance: number }>
  const transactions = (data.transactions ?? []) as Array<{ id: string; description: string; amount: number; transaction_date: string; transaction_type: string; account_type: string }>
  const loans = (data.loans ?? []) as Array<{ id: string; outstanding_balance: number; principal_amount: number; total_payable: number; amount_paid: number; due_date: string | null; status: string }>

  const totalSavings = accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0)
  const outstandingBalance = loans.reduce(
    (sum, loan) => sum + Number(loan.outstanding_balance ?? 0),
    0,
  )

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Member portal</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {data.profile.full_name}</h1>
              <p className="mt-1 text-slate-500">Member {data.profile.member_number}</p>
            </div>
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">
              Active member
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Savings balance</p>
            <p className="mt-3 text-3xl font-bold">{formatMoney(totalSavings)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Outstanding loan</p>
            <p className="mt-3 text-3xl font-bold">{formatMoney(outstandingBalance)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="mt-3 text-3xl font-bold">{transactions.length}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent activity</h2>
              <span className="text-sm text-slate-500">Live from Supabase</span>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-slate-500">
                      {transaction.account_type} · {transaction.transaction_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.transaction_type === 'Credit' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {transaction.transaction_type === 'Credit' ? '+' : '-'}{formatMoney(Number(transaction.amount ?? 0))}
                    </p>
                  </div>
                </div>
              ))}
              {!transactions.length && (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No transactions are available yet. Add your first live record in Supabase.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">Account summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{data.profile.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{data.profile.phone ?? 'Not added'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Member no.</span><span>{data.profile.member_number}</span></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
