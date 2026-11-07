export type UserRole = 'member' | 'admin' | 'superadmin';
export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type SavingsType = 'regular' | 'special';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'pos' | 'direct_debit';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type LoanAppStatus = 'pending' | 'approved' | 'rejected' | 'disbursed';
export type LoanStatus = 'active' | 'repaid' | 'overdue' | 'defaulted';
export type RepaymentStatus = 'pending' | 'approved' | 'rejected';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'savings_deposit' | 'loan_disbursement' | 'loan_repayment' | 'withdrawal' | 'fee_charge' | 'dividend';
export type LedgerDirection = 'credit' | 'debit';

export interface Profile {
  id: string;
  member_number: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string | null;
  role: UserRole;
  status: MemberStatus;
  regular_savings_balance: number;
  special_savings_balance: number;
  total_savings: number;
  active_loans_count: number;
  total_borrowed: number;
  total_repaid: number;
  outstanding_loan_balance: number;
  joined_date: string;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CooperativeSettings {
  id: string;
  society_name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  min_monthly_savings: number;
  interest_rate: number;
  max_loan_multiple: number;
  max_repayment_tenure_months: number;
  min_membership_duration_months: number;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  savings_type: SavingsType;
  payment_method: PaymentMethod;
  sender_name: string;
  bank_reference?: string | null;
  receipt_url?: string | null;
  status: ContributionStatus;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  status: WithdrawalStatus;
  reason: string;
  bank_details?: string | null;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  processed_by?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanApplication {
  id: string;
  reference: string;
  user_id: string;
  amount_requested: number;
  tenure_months: number;
  monthly_repayment_estimate: number;
  purpose: string;
  guarantor1_name: string;
  guarantor1_phone: string;
  guarantor2_name: string;
  guarantor2_phone: string;
  status: LoanAppStatus;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  reference: string;
  application_id: string;
  user_id: string;
  principal_amount: number;
  total_payable: number;
  amount_repaid: number;
  outstanding_balance: number;
  tenure_months: number;
  monthly_installment: number;
  status: LoanStatus;
  disbursed_at: string;
  due_date: string;
  disbursed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Repayment {
  id: string;
  reference: string;
  loan_id: string;
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
  bank_reference?: string | null;
  receipt_url?: string | null;
  status: RepaymentStatus;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  reference: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  direction: LedgerDirection;
  description: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}
