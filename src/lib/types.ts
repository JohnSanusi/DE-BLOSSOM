// ─── User & Auth ─────────────────────────────────────────────
export type UserRole = 'member' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  memberRef: string;
  avatarUrl?: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type AccountStatus = 'active' | 'suspended' | 'pending';

// ─── Savings ─────────────────────────────────────────────────
export type SavingsType = 'regular' | 'special';

export interface SavingsBalance {
  memberId: string;
  regularSavings: number;
  specialSavings: number;
  totalSavings: number;
}

// ─── Contributions ───────────────────────────────────────────
export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface Contribution {
  id: string;
  ref: string;
  memberId: string;
  memberName: string;
  type: SavingsType;
  amount: number;
  paymentDate: string;
  submissionDate: string;
  transferReference: string;
  receiptUrl?: string;
  receiptFileName?: string;
  status: ContributionStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

// ─── Loans ───────────────────────────────────────────────────
export type LoanApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type LoanStatus = 'approved' | 'disbursed' | 'repaying' | 'repaid' | 'defaulted';

export interface LoanApplication {
  id: string;
  ref: string;
  memberId: string;
  memberName: string;
  requestedAmount: number;
  approvedAmount?: number;
  purpose: string;
  repaymentDuration: number; // months
  additionalInfo?: string;
  status: LoanApplicationStatus;
  applicationDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface Loan {
  id: string;
  ref: string;
  applicationId: string;
  memberId: string;
  memberName: string;
  principalAmount: number;
  disbursedAmount: number;
  outstandingPrincipal: number;
  purpose: string;
  status: LoanStatus;
  approvalDate: string;
  disbursementDate?: string;
  completionDate?: string;
  disbursedBy?: string;
  remarks?: string;
}

// ─── Repayments ──────────────────────────────────────────────
export type RepaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Repayment {
  id: string;
  ref: string;
  loanId: string;
  loanRef: string;
  memberId: string;
  memberName: string;
  amount: number;
  principalComponent: number;
  interestComponent: number;
  feeComponent: number;
  paymentDate: string;
  submissionDate: string;
  transferReference: string;
  receiptUrl?: string;
  status: RepaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

// ─── Transactions ────────────────────────────────────────────
export type TransactionType =
  | 'contribution'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'withdrawal'
  | 'adjustment';

export type AccountCategory = 'regular_savings' | 'special_savings' | 'loan';

export interface Transaction {
  id: string;
  ref: string;
  memberId: string;
  memberName: string;
  type: TransactionType;
  category: AccountCategory;
  description: string;
  credit: number;
  debit: number;
  currency: string;
  relatedRef?: string;
  sourceRef?: string;
  date: string;
  status: 'posted' | 'reversed';
}

// ─── Notifications ───────────────────────────────────────────
export type NotificationType =
  | 'contribution_submitted'
  | 'contribution_approved'
  | 'contribution_rejected'
  | 'loan_application_received'
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_disbursed'
  | 'repayment_verified'
  | 'withdrawal_request_updated'
  | 'admin_action';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

// ─── Withdrawal Requests ─────────────────────────────────────
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface WithdrawalRequest {
  id: string;
  ref: string;
  memberId: string;
  memberName: string;
  amount: number;
  reason?: string;
  status: WithdrawalStatus;
  requestDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

// ─── Audit Log ───────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  performedBy: string;
  performedByName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetRef?: string;
  details: string;
  timestamp: string;
}

// ─── Cooperative Settings ────────────────────────────────────
export interface CooperativeSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  currency: string;
  savingsCategories: SavingsType[];
}

// ─── Dashboard Summaries ─────────────────────────────────────
export interface MemberDashboardSummary {
  regularSavings: number;
  specialSavings: number;
  totalApprovedContributions: number;
  outstandingLoanBalance: number;
  pendingContributions: number;
  activeLoans: number;
}

export interface AdminDashboardSummary {
  totalMembers: number;
  totalApprovedContributions: number;
  pendingVerifications: number;
  activeLoans: number;
  outstandingLoanPrincipal: number;
  pendingLoanApplications: number;
  totalRegularSavings: number;
  totalSpecialSavings: number;
}

// ─── Chart Data ──────────────────────────────────────────────
export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

// ─── Pagination ──────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  memberId?: string;
}
