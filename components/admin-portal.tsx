import { redirect } from 'next/navigation'
import { getAdminPortalData } from '@/lib/queries/portal'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function AdminPortal() {
  const data = await getAdminPortalData()

  if (!data || !data.profile) {
    redirect('/sign-in')
  }

  const members = data.members ?? []
  const accounts = (data.accounts ?? []) as Array<{ balance: number; account_type: string }>
  const loans = (data.loans ?? []) as Array<{ outstanding_balance: number; status: string }>

  const totalSavings = accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0)
  const outstandingBalance = loans.reduce(
    (sum, loan) => sum + Number(loan.outstanding_balance ?? 0),
    0,
  )

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Admin dashboard</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Operations overview</h1>
              <p className="mt-1 text-slate-500">Signed in as {data.profile.full_name}</p>
            </div>
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
              Admin access
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Members</p>
            <p className="mt-3 text-3xl font-bold">{members.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Savings balance</p>
            <p className="mt-3 text-3xl font-bold">{formatMoney(totalSavings)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Outstanding loans</p>
            <p className="mt-3 text-3xl font-bold">{formatMoney(outstandingBalance)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Member directory</h2>
            <span className="text-sm text-slate-500">Live profile table</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Member no.</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 font-medium">{member.full_name}</td>
                    <td className="py-3">{member.member_number}</td>
                    <td className="py-3 text-slate-500">{member.email}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
                {!members.length && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No member records are available yet. Seed the profiles table in Supabase.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
