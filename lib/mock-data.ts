export type AccountType = 'Savings' | 'Shares' | 'Special Savings'
export type TransactionType = 'Credit' | 'Debit'

export type Member = {
  id: string
  fullName: string
  memberNumber: string
  email: string
  phone: string
  joined: string
  status: 'Active' | 'Pending'
  savings: number
  shares: number
  specialSavings: number
  loanBalance: number
}

export type Transaction = {
  id: string
  memberNumber: string
  date: string
  accountType: AccountType
  transactionType: TransactionType
  description: string
  amount: number
  balance: number
}

export type Loan = {
  id: string
  memberNumber: string
  principal: number
  interestAmount: number
  interestRate: number
  totalPayable: number
  amountPaid: number
  outstanding: number
  status: 'Active' | 'Completed'
  startDate: string
  dueDate: string
}

export type LoanPayment = {
  id: string
  loanId: string
  date: string
  payment: number
  interest: number
  principal: number
  remaining: number
}

export const members: Member[] = [
  { id: 'm1', fullName: 'Amina Yusuf', memberNumber: 'COOP-001', email: 'amina.yusuf@example.com', phone: '+234 803 441 2090', joined: '12 Jan 2024', status: 'Active', savings: 55000, shares: 10000, specialSavings: 25000, loanBalance: 92500 },
  { id: 'm2', fullName: 'Chinedu Okafor', memberNumber: 'COOP-002', email: 'chinedu.okafor@example.com', phone: '+234 806 112 3490', joined: '18 Jan 2024', status: 'Active', savings: 82000, shares: 15000, specialSavings: 12000, loanBalance: 0 },
  { id: 'm3', fullName: 'Fatima Bello', memberNumber: 'COOP-003', email: 'fatima.bello@example.com', phone: '+234 805 928 1134', joined: '26 Feb 2024', status: 'Active', savings: 67000, shares: 10000, specialSavings: 18000, loanBalance: 46500 },
  { id: 'm4', fullName: 'Ifeanyi Eze', memberNumber: 'COOP-004', email: 'ifeanyi.eze@example.com', phone: '+234 813 450 7712', joined: '04 Mar 2024', status: 'Active', savings: 43000, shares: 5000, specialSavings: 8500, loanBalance: 120000 },
  { id: 'm5', fullName: 'Ngozi Adeyemi', memberNumber: 'COOP-005', email: 'ngozi.adeyemi@example.com', phone: '+234 802 777 4401', joined: '11 Mar 2024', status: 'Active', savings: 91000, shares: 20000, specialSavings: 30000, loanBalance: 0 },
  { id: 'm6', fullName: 'Tunde Balogun', memberNumber: 'COOP-006', email: 'tunde.balogun@example.com', phone: '+234 809 331 6408', joined: '19 Apr 2024', status: 'Active', savings: 38000, shares: 5000, specialSavings: 7000, loanBalance: 75000 },
  { id: 'm7', fullName: 'Grace Nwosu', memberNumber: 'COOP-007', email: 'grace.nwosu@example.com', phone: '+234 810 100 2234', joined: '22 Apr 2024', status: 'Active', savings: 74000, shares: 15000, specialSavings: 22000, loanBalance: 0 },
  { id: 'm8', fullName: 'Musa Ibrahim', memberNumber: 'COOP-008', email: 'musa.ibrahim@example.com', phone: '+234 807 441 0021', joined: '03 May 2024', status: 'Active', savings: 51000, shares: 10000, specialSavings: 15000, loanBalance: 42000 },
  { id: 'm9', fullName: 'Bisi Akinola', memberNumber: 'COOP-009', email: 'bisi.akinola@example.com', phone: '+234 803 990 5510', joined: '14 Jun 2024', status: 'Active', savings: 63500, shares: 10000, specialSavings: 11000, loanBalance: 0 },
  { id: 'm10', fullName: 'Emeka Umeh', memberNumber: 'COOP-010', email: 'emeka.umeh@example.com', phone: '+234 814 902 1200', joined: '27 Jun 2024', status: 'Active', savings: 47000, shares: 5000, specialSavings: 9000, loanBalance: 88000 },
]

export const transactions: Transaction[] = [
  { id: 't1', memberNumber: 'COOP-001', date: '30 Apr 2026', accountType: 'Savings', transactionType: 'Credit', description: 'Monthly contribution', amount: 5000, balance: 55000 },
  { id: 't2', memberNumber: 'COOP-001', date: '30 Apr 2026', accountType: 'Special Savings', transactionType: 'Credit', description: 'Monthly special savings', amount: 2500, balance: 25000 },
  { id: 't3', memberNumber: 'COOP-001', date: '28 Mar 2026', accountType: 'Savings', transactionType: 'Credit', description: 'Monthly contribution', amount: 5000, balance: 50000 },
  { id: 't4', memberNumber: 'COOP-001', date: '28 Mar 2026', accountType: 'Shares', transactionType: 'Credit', description: 'Share purchase', amount: 5000, balance: 10000 },
  { id: 't5', memberNumber: 'COOP-001', date: '28 Feb 2026', accountType: 'Savings', transactionType: 'Credit', description: 'Monthly contribution', amount: 5000, balance: 45000 },
  { id: 't6', memberNumber: 'COOP-002', date: '30 Apr 2026', accountType: 'Savings', transactionType: 'Credit', description: 'Monthly contribution', amount: 10000, balance: 82000 },
  { id: 't7', memberNumber: 'COOP-003', date: '30 Apr 2026', accountType: 'Savings', transactionType: 'Credit', description: 'Monthly contribution', amount: 5000, balance: 67000 },
  { id: 't8', memberNumber: 'COOP-004', date: '29 Apr 2026', accountType: 'Savings', transactionType: 'Debit', description: 'Emergency withdrawal', amount: 3000, balance: 43000 },
]

export const loans: Loan[] = [
  { id: 'l1', memberNumber: 'COOP-001', principal: 185000, interestAmount: 18500, interestRate: 10, totalPayable: 203500, amountPaid: 111000, outstanding: 92500, status: 'Active', startDate: '10 Jan 2026', dueDate: '10 Dec 2026' },
  { id: 'l2', memberNumber: 'COOP-003', principal: 60000, interestAmount: 6000, interestRate: 10, totalPayable: 66000, amountPaid: 19500, outstanding: 46500, status: 'Active', startDate: '02 Feb 2026', dueDate: '02 Aug 2026' },
  { id: 'l3', memberNumber: 'COOP-004', principal: 150000, interestAmount: 15000, interestRate: 10, totalPayable: 165000, amountPaid: 45000, outstanding: 120000, status: 'Active', startDate: '15 Mar 2026', dueDate: '15 Dec 2026' },
  { id: 'l4', memberNumber: 'COOP-006', principal: 90000, interestAmount: 9000, interestRate: 10, totalPayable: 99000, amountPaid: 24000, outstanding: 75000, status: 'Active', startDate: '08 Apr 2026', dueDate: '08 Jan 2027' },
  { id: 'l5', memberNumber: 'COOP-008', principal: 50000, interestAmount: 5000, interestRate: 10, totalPayable: 55000, amountPaid: 13000, outstanding: 42000, status: 'Active', startDate: '20 Apr 2026', dueDate: '20 Oct 2026' },
  { id: 'l6', memberNumber: 'COOP-005', principal: 40000, interestAmount: 4000, interestRate: 10, totalPayable: 44000, amountPaid: 44000, outstanding: 0, status: 'Completed', startDate: '12 Jun 2025', dueDate: '12 Dec 2025' },
]

export const loanPayments: LoanPayment[] = [
  { id: 'p1', loanId: 'l1', date: '30 Apr 2026', payment: 18500, interest: 1850, principal: 16650, remaining: 92500 },
  { id: 'p2', loanId: 'l1', date: '31 Mar 2026', payment: 18500, interest: 1850, principal: 16650, remaining: 111000 },
  { id: 'p3', loanId: 'l1', date: '28 Feb 2026', payment: 18500, interest: 1850, principal: 16650, remaining: 129500 },
]

export const currentMember = members[0]

export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
export const formatCompact = (amount: number) => amount >= 1000000 ? `₦${(amount / 1000000).toFixed(1)}m` : amount >= 1000 ? `₦${Math.round(amount / 1000)}k` : formatCurrency(amount)

export const totals = {
  savings: members.reduce((sum, member) => sum + member.savings, 0),
  shares: members.reduce((sum, member) => sum + member.shares, 0),
  specialSavings: members.reduce((sum, member) => sum + member.specialSavings, 0),
  loans: loans.reduce((sum, loan) => sum + loan.outstanding, 0),
  repayments: loans.reduce((sum, loan) => sum + loan.amountPaid, 0),
}

export const getMemberTransactions = (memberNumber: string) => transactions.filter((transaction) => transaction.memberNumber === memberNumber)
export const getMemberLoans = (memberNumber: string) => loans.filter((loan) => loan.memberNumber === memberNumber)
