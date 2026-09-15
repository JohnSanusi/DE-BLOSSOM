export type UploadStatus = 'ready' | 'uploaded' | 'error'

export type SavingsUpload = {
  memberNumber: string
  date: string
  accountType: 'Savings' | 'Shares' | 'Special Savings'
  amount: number
  description: string
}

export type RepaymentReceipt = {
  memberNumber: string
  loanId: string
  paymentAmount: number
  paymentDate: string
  receiptPath: string
}

export const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)

export const storagePathForReceipt = (userId: string, receiptId: string, fileName: string) => `repayment-receipts/${userId}/${receiptId}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '-')}`
