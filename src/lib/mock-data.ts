import type {
  User, Contribution, LoanApplication, Loan, Repayment,
  Transaction, Notification, WithdrawalRequest, AuditEntry,
  CooperativeSettings, MemberDashboardSummary, AdminDashboardSummary,
  ChartDataPoint,
} from './types';

// ─── Cooperative Settings ────────────────────────────────────
export const cooperativeSettings: CooperativeSettings = {
  name: 'DE-BLOSSOM Cooperative Society',
  email: 'info@deblossom.coop',
  phone: '+234 801 234 5678',
  address: '15 Marina Road, Victoria Island, Lagos, Nigeria',
  logoUrl: undefined,
  bankName: 'First Bank of Nigeria',
  bankAccountName: 'DE-BLOSSOM Cooperative Society Ltd',
  bankAccountNumber: '2034567890',
  currency: 'NGN',
  savingsCategories: ['regular', 'special'],
};

// ─── Members ─────────────────────────────────────────────────
export const members: User[] = [
  {
    id: 'usr_001',
    email: 'adaeze.okafor@email.com',
    fullName: 'Adaeze Okafor',
    phone: '+234 802 111 2233',
    role: 'member',
    memberRef: 'DBM-0001',
    status: 'active',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
  },
  {
    id: 'usr_002',
    email: 'chukwudi.eze@email.com',
    fullName: 'Chukwudi Eze',
    phone: '+234 803 222 3344',
    role: 'member',
    memberRef: 'DBM-0002',
    status: 'active',
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-10-20T08:00:00Z',
  },
  {
    id: 'usr_003',
    email: 'fatima.bello@email.com',
    fullName: 'Fatima Bello',
    phone: '+234 805 333 4455',
    role: 'member',
    memberRef: 'DBM-0003',
    status: 'active',
    createdAt: '2024-03-05T14:00:00Z',
    updatedAt: '2024-11-02T09:00:00Z',
  },
  {
    id: 'usr_004',
    email: 'emeka.nwosu@email.com',
    fullName: 'Emeka Nwosu',
    phone: '+234 806 444 5566',
    role: 'member',
    memberRef: 'DBM-0004',
    status: 'active',
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2024-10-15T12:00:00Z',
  },
  {
    id: 'usr_005',
    email: 'ngozi.adekunle@email.com',
    fullName: 'Ngozi Adekunle',
    phone: '+234 807 555 6677',
    role: 'member',
    memberRef: 'DBM-0005',
    status: 'active',
    createdAt: '2024-05-20T08:00:00Z',
    updatedAt: '2024-10-30T14:00:00Z',
  },
  {
    id: 'usr_006',
    email: 'ibrahim.musa@email.com',
    fullName: 'Ibrahim Musa',
    phone: '+234 808 666 7788',
    role: 'member',
    memberRef: 'DBM-0006',
    status: 'suspended',
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-09-15T11:00:00Z',
  },
  {
    id: 'usr_007',
    email: 'blessing.obi@email.com',
    fullName: 'Blessing Obi',
    phone: '+234 809 777 8899',
    role: 'member',
    memberRef: 'DBM-0007',
    status: 'active',
    createdAt: '2024-07-10T13:00:00Z',
    updatedAt: '2024-11-01T16:00:00Z',
  },
  {
    id: 'usr_008',
    email: 'yusuf.abdullahi@email.com',
    fullName: 'Yusuf Abdullahi',
    phone: '+234 810 888 9900',
    role: 'member',
    memberRef: 'DBM-0008',
    status: 'pending',
    createdAt: '2024-10-25T10:00:00Z',
    updatedAt: '2024-10-25T10:00:00Z',
  },
];

export const admins: User[] = [
  {
    id: 'adm_001',
    email: 'admin@deblossom.coop',
    fullName: 'Oluwaseun Adesanya',
    phone: '+234 801 000 0001',
    role: 'admin',
    memberRef: 'DBA-0001',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-05T09:00:00Z',
  },
  {
    id: 'adm_002',
    email: 'treasurer@deblossom.coop',
    fullName: 'Amina Lawal',
    phone: '+234 801 000 0002',
    role: 'admin',
    memberRef: 'DBA-0002',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-03T14:00:00Z',
  },
];

// ─── Contributions ───────────────────────────────────────────
export const contributions: Contribution[] = [
  // Adaeze's contributions
  { id: 'con_001', ref: 'CON-240201-A1', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-02-01', submissionDate: '2024-02-01T10:00:00Z', transferReference: 'TRF-FBN-001', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-02-02T09:00:00Z', remarks: 'Payment confirmed' },
  { id: 'con_002', ref: 'CON-240301-A2', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-03-01', submissionDate: '2024-03-01T11:00:00Z', transferReference: 'TRF-FBN-002', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-03-02T10:00:00Z', remarks: 'Payment confirmed' },
  { id: 'con_003', ref: 'CON-240401-A3', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-04-01', submissionDate: '2024-04-01T09:30:00Z', transferReference: 'TRF-FBN-003', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-04-02T08:00:00Z', remarks: 'Verified' },
  { id: 'con_004', ref: 'CON-240501-A4', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-05-01', submissionDate: '2024-05-01T10:15:00Z', transferReference: 'TRF-FBN-004', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-05-02T11:00:00Z' },
  { id: 'con_005', ref: 'CON-240601-A5', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-06-01', submissionDate: '2024-06-01T12:00:00Z', transferReference: 'TRF-FBN-005', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-06-02T09:30:00Z' },
  { id: 'con_006', ref: 'CON-240701-A6', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-07-01', submissionDate: '2024-07-01T08:45:00Z', transferReference: 'TRF-FBN-006', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-07-02T10:00:00Z' },
  { id: 'con_007', ref: 'CON-240801-A7', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'special', amount: 200000, paymentDate: '2024-08-15', submissionDate: '2024-08-15T14:00:00Z', transferReference: 'TRF-FBN-007', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-08-16T09:00:00Z', remarks: 'Special savings deposit confirmed' },
  { id: 'con_008', ref: 'CON-241001-A8', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'regular', amount: 50000, paymentDate: '2024-10-01', submissionDate: '2024-10-01T09:00:00Z', transferReference: 'TRF-FBN-008', status: 'pending' },
  { id: 'con_009', ref: 'CON-241101-A9', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'special', amount: 100000, paymentDate: '2024-11-01', submissionDate: '2024-11-01T10:30:00Z', transferReference: 'TRF-FBN-009', status: 'pending' },

  // Chukwudi's contributions
  { id: 'con_010', ref: 'CON-240301-C1', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'regular', amount: 30000, paymentDate: '2024-03-01', submissionDate: '2024-03-01T09:00:00Z', transferReference: 'TRF-GTB-001', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-03-02T10:00:00Z' },
  { id: 'con_011', ref: 'CON-240401-C2', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'regular', amount: 30000, paymentDate: '2024-04-01', submissionDate: '2024-04-02T10:00:00Z', transferReference: 'TRF-GTB-002', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-04-03T08:00:00Z' },
  { id: 'con_012', ref: 'CON-240501-C3', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'regular', amount: 30000, paymentDate: '2024-05-01', submissionDate: '2024-05-01T11:30:00Z', transferReference: 'TRF-GTB-003', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-05-02T09:00:00Z' },
  { id: 'con_013', ref: 'CON-240601-C4', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'regular', amount: 30000, paymentDate: '2024-06-01', submissionDate: '2024-06-01T08:00:00Z', transferReference: 'TRF-GTB-004', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-06-02T10:30:00Z' },
  { id: 'con_014', ref: 'CON-240701-C5', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'special', amount: 150000, paymentDate: '2024-07-15', submissionDate: '2024-07-15T13:00:00Z', transferReference: 'TRF-GTB-005', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-07-16T09:00:00Z' },
  { id: 'con_015', ref: 'CON-241001-C6', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'regular', amount: 30000, paymentDate: '2024-10-01', submissionDate: '2024-10-01T09:30:00Z', transferReference: 'TRF-GTB-006', status: 'rejected', verifiedBy: 'Amina Lawal', verifiedAt: '2024-10-02T11:00:00Z', remarks: 'Transfer reference does not match bank records' },

  // Fatima's contributions
  { id: 'con_016', ref: 'CON-240401-F1', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'regular', amount: 40000, paymentDate: '2024-04-01', submissionDate: '2024-04-01T09:00:00Z', transferReference: 'TRF-UBA-001', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-04-02T10:00:00Z' },
  { id: 'con_017', ref: 'CON-240501-F2', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'regular', amount: 40000, paymentDate: '2024-05-01', submissionDate: '2024-05-01T10:00:00Z', transferReference: 'TRF-UBA-002', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-05-02T09:00:00Z' },
  { id: 'con_018', ref: 'CON-240601-F3', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'regular', amount: 40000, paymentDate: '2024-06-01', submissionDate: '2024-06-01T11:00:00Z', transferReference: 'TRF-UBA-003', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-06-02T10:00:00Z' },
  { id: 'con_019', ref: 'CON-240701-F4', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'special', amount: 100000, paymentDate: '2024-07-10', submissionDate: '2024-07-10T14:00:00Z', transferReference: 'TRF-UBA-004', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-07-11T09:00:00Z' },
  { id: 'con_020', ref: 'CON-241101-F5', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'regular', amount: 40000, paymentDate: '2024-11-01', submissionDate: '2024-11-01T08:00:00Z', transferReference: 'TRF-UBA-005', status: 'pending' },

  // Emeka's contributions
  { id: 'con_021', ref: 'CON-240501-E1', memberId: 'usr_004', memberName: 'Emeka Nwosu', type: 'regular', amount: 25000, paymentDate: '2024-05-01', submissionDate: '2024-05-01T09:00:00Z', transferReference: 'TRF-ZEN-001', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-05-02T10:00:00Z' },
  { id: 'con_022', ref: 'CON-240601-E2', memberId: 'usr_004', memberName: 'Emeka Nwosu', type: 'regular', amount: 25000, paymentDate: '2024-06-01', submissionDate: '2024-06-01T10:00:00Z', transferReference: 'TRF-ZEN-002', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-06-02T09:00:00Z' },
  { id: 'con_023', ref: 'CON-240701-E3', memberId: 'usr_004', memberName: 'Emeka Nwosu', type: 'regular', amount: 25000, paymentDate: '2024-07-01', submissionDate: '2024-07-01T11:00:00Z', transferReference: 'TRF-ZEN-003', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-07-02T10:00:00Z' },

  // Ngozi's contributions
  { id: 'con_024', ref: 'CON-240601-N1', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'regular', amount: 60000, paymentDate: '2024-06-01', submissionDate: '2024-06-01T09:00:00Z', transferReference: 'TRF-ACC-001', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-06-02T10:00:00Z' },
  { id: 'con_025', ref: 'CON-240701-N2', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'regular', amount: 60000, paymentDate: '2024-07-01', submissionDate: '2024-07-01T09:30:00Z', transferReference: 'TRF-ACC-002', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-07-02T09:00:00Z' },
  { id: 'con_026', ref: 'CON-240801-N3', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'special', amount: 300000, paymentDate: '2024-08-01', submissionDate: '2024-08-01T10:00:00Z', transferReference: 'TRF-ACC-003', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-08-02T09:00:00Z' },

  // Blessing's contributions
  { id: 'con_027', ref: 'CON-240801-B1', memberId: 'usr_007', memberName: 'Blessing Obi', type: 'regular', amount: 35000, paymentDate: '2024-08-01', submissionDate: '2024-08-01T09:00:00Z', transferReference: 'TRF-WEM-001', status: 'approved', verifiedBy: 'Amina Lawal', verifiedAt: '2024-08-02T10:00:00Z' },
  { id: 'con_028', ref: 'CON-240901-B2', memberId: 'usr_007', memberName: 'Blessing Obi', type: 'regular', amount: 35000, paymentDate: '2024-09-01', submissionDate: '2024-09-01T10:00:00Z', transferReference: 'TRF-WEM-002', status: 'approved', verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-09-02T09:00:00Z' },
  { id: 'con_029', ref: 'CON-241001-B3', memberId: 'usr_007', memberName: 'Blessing Obi', type: 'regular', amount: 35000, paymentDate: '2024-10-01', submissionDate: '2024-10-01T11:00:00Z', transferReference: 'TRF-WEM-003', status: 'pending' },
];

// ─── Helper: compute savings from approved contributions ─────
export function getMemberSavings(memberId: string) {
  const approved = contributions.filter(
    (c) => c.memberId === memberId && c.status === 'approved'
  );
  const regular = approved
    .filter((c) => c.type === 'regular')
    .reduce((sum, c) => sum + c.amount, 0);
  const special = approved
    .filter((c) => c.type === 'special')
    .reduce((sum, c) => sum + c.amount, 0);

  // Subtract approved withdrawals
  const withdrawals = withdrawalRequests
    .filter((w) => w.memberId === memberId && (w.status === 'approved' || w.status === 'completed'))
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    memberId,
    regularSavings: regular,
    specialSavings: special - withdrawals,
    totalSavings: regular + special - withdrawals,
  };
}

// ─── Loan Applications ──────────────────────────────────────
export const loanApplications: LoanApplication[] = [
  {
    id: 'la_001', ref: 'LA-240601-001', memberId: 'usr_001', memberName: 'Adaeze Okafor',
    requestedAmount: 200000, purpose: 'Business expansion - purchase of inventory',
    repaymentDuration: 6, status: 'approved', applicationDate: '2024-06-15T09:00:00Z',
    reviewedBy: 'Oluwaseun Adesanya', reviewedAt: '2024-06-18T14:00:00Z',
    remarks: 'Good savings record. Approved.',
  },
  {
    id: 'la_002', ref: 'LA-240901-002', memberId: 'usr_002', memberName: 'Chukwudi Eze',
    requestedAmount: 100000, purpose: 'Emergency medical expenses',
    repaymentDuration: 4, status: 'approved', applicationDate: '2024-09-01T10:00:00Z',
    reviewedBy: 'Amina Lawal', reviewedAt: '2024-09-03T11:00:00Z',
    remarks: 'Verified urgency. Approved.',
  },
  {
    id: 'la_003', ref: 'LA-241001-003', memberId: 'usr_003', memberName: 'Fatima Bello',
    requestedAmount: 150000, purpose: 'Education fees for professional certification',
    repaymentDuration: 8, status: 'pending', applicationDate: '2024-10-20T09:00:00Z',
  },
  {
    id: 'la_004', ref: 'LA-241015-004', memberId: 'usr_005', memberName: 'Ngozi Adekunle',
    requestedAmount: 500000, purpose: 'Property renovation',
    repaymentDuration: 12, status: 'under_review', applicationDate: '2024-10-15T11:00:00Z',
    additionalInfo: 'Property is located at 25 Allen Avenue, Ikeja.',
  },
  {
    id: 'la_005', ref: 'LA-240801-005', memberId: 'usr_004', memberName: 'Emeka Nwosu',
    requestedAmount: 300000, purpose: 'Vehicle purchase for business logistics',
    repaymentDuration: 10, status: 'rejected', applicationDate: '2024-08-10T09:00:00Z',
    reviewedBy: 'Oluwaseun Adesanya', reviewedAt: '2024-08-15T10:00:00Z',
    remarks: 'Insufficient savings history. Reapply after 3 more months of regular contributions.',
  },
];

// ─── Loans ───────────────────────────────────────────────────
export const loans: Loan[] = [
  {
    id: 'ln_001', ref: 'LN-240620-001', applicationId: 'la_001',
    memberId: 'usr_001', memberName: 'Adaeze Okafor',
    principalAmount: 200000, disbursedAmount: 200000, outstandingPrincipal: 80000,
    purpose: 'Business expansion - purchase of inventory',
    status: 'repaying', approvalDate: '2024-06-18T14:00:00Z',
    disbursementDate: '2024-06-20T10:00:00Z', disbursedBy: 'Amina Lawal',
  },
  {
    id: 'ln_002', ref: 'LN-240905-002', applicationId: 'la_002',
    memberId: 'usr_002', memberName: 'Chukwudi Eze',
    principalAmount: 100000, disbursedAmount: 100000, outstandingPrincipal: 100000,
    purpose: 'Emergency medical expenses',
    status: 'disbursed', approvalDate: '2024-09-03T11:00:00Z',
    disbursementDate: '2024-09-05T09:00:00Z', disbursedBy: 'Oluwaseun Adesanya',
  },
];

// ─── Repayments ──────────────────────────────────────────────
export const repayments: Repayment[] = [
  {
    id: 'rp_001', ref: 'RP-240720-001', loanId: 'ln_001', loanRef: 'LN-240620-001',
    memberId: 'usr_001', memberName: 'Adaeze Okafor',
    amount: 40000, principalComponent: 40000, interestComponent: 0, feeComponent: 0,
    paymentDate: '2024-07-20', submissionDate: '2024-07-20T10:00:00Z',
    transferReference: 'RPY-FBN-001', status: 'approved',
    verifiedBy: 'Amina Lawal', verifiedAt: '2024-07-21T09:00:00Z',
    remarks: 'Repayment verified',
  },
  {
    id: 'rp_002', ref: 'RP-240820-002', loanId: 'ln_001', loanRef: 'LN-240620-001',
    memberId: 'usr_001', memberName: 'Adaeze Okafor',
    amount: 40000, principalComponent: 40000, interestComponent: 0, feeComponent: 0,
    paymentDate: '2024-08-20', submissionDate: '2024-08-20T11:00:00Z',
    transferReference: 'RPY-FBN-002', status: 'approved',
    verifiedBy: 'Oluwaseun Adesanya', verifiedAt: '2024-08-21T10:00:00Z',
    remarks: 'Payment confirmed',
  },
  {
    id: 'rp_003', ref: 'RP-240920-003', loanId: 'ln_001', loanRef: 'LN-240620-001',
    memberId: 'usr_001', memberName: 'Adaeze Okafor',
    amount: 40000, principalComponent: 40000, interestComponent: 0, feeComponent: 0,
    paymentDate: '2024-09-20', submissionDate: '2024-09-20T09:00:00Z',
    transferReference: 'RPY-FBN-003', status: 'approved',
    verifiedBy: 'Amina Lawal', verifiedAt: '2024-09-21T10:00:00Z',
  },
  {
    id: 'rp_004', ref: 'RP-241020-004', loanId: 'ln_001', loanRef: 'LN-240620-001',
    memberId: 'usr_001', memberName: 'Adaeze Okafor',
    amount: 40000, principalComponent: 40000, interestComponent: 0, feeComponent: 0,
    paymentDate: '2024-10-20', submissionDate: '2024-10-20T10:00:00Z',
    transferReference: 'RPY-FBN-004', status: 'pending',
  },
];

// ─── Withdrawal Requests ─────────────────────────────────────
export const withdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wr_001', ref: 'WR-241001-001', memberId: 'usr_005', memberName: 'Ngozi Adekunle',
    amount: 50000, reason: 'Personal emergency',
    status: 'completed', requestDate: '2024-10-01T09:00:00Z',
    reviewedBy: 'Oluwaseun Adesanya', reviewedAt: '2024-10-02T10:00:00Z',
    remarks: 'Approved and processed',
  },
  {
    id: 'wr_002', ref: 'WR-241101-002', memberId: 'usr_001', memberName: 'Adaeze Okafor',
    amount: 50000, reason: 'School fees',
    status: 'pending', requestDate: '2024-11-01T14:00:00Z',
  },
];

// ─── Transactions (derived from approved activities) ─────────
export const transactions: Transaction[] = [
  // Adaeze's contribution transactions
  { id: 'txn_001', ref: 'TXN-240201-001', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Feb 2024', credit: 50000, debit: 0, currency: 'NGN', relatedRef: 'CON-240201-A1', date: '2024-02-02T09:00:00Z', status: 'posted' },
  { id: 'txn_002', ref: 'TXN-240301-002', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Mar 2024', credit: 50000, debit: 0, currency: 'NGN', relatedRef: 'CON-240301-A2', date: '2024-03-02T10:00:00Z', status: 'posted' },
  { id: 'txn_003', ref: 'TXN-240401-003', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Apr 2024', credit: 50000, debit: 0, currency: 'NGN', relatedRef: 'CON-240401-A3', date: '2024-04-02T08:00:00Z', status: 'posted' },
  { id: 'txn_004', ref: 'TXN-240501-004', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - May 2024', credit: 50000, debit: 0, currency: 'NGN', relatedRef: 'CON-240501-A4', date: '2024-05-02T11:00:00Z', status: 'posted' },
  { id: 'txn_005', ref: 'TXN-240601-005', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jun 2024', credit: 50000, debit: 0, currency: 'NGN', relatedRef: 'CON-240601-A5', date: '2024-06-02T09:30:00Z', status: 'posted' },
  { id: 'txn_006', ref: 'TXN-240701-006', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jul 2024', credit: 50000, debit: 0, currency: 'NGN', relatedRef: 'CON-240701-A6', date: '2024-07-02T10:00:00Z', status: 'posted' },
  { id: 'txn_007', ref: 'TXN-240815-007', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'contribution', category: 'special_savings', description: 'Special savings deposit', credit: 200000, debit: 0, currency: 'NGN', relatedRef: 'CON-240801-A7', date: '2024-08-16T09:00:00Z', status: 'posted' },
  // Adaeze's loan disbursement
  { id: 'txn_008', ref: 'TXN-240620-008', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'loan_disbursement', category: 'loan', description: 'Loan disbursement - Business expansion', credit: 200000, debit: 0, currency: 'NGN', relatedRef: 'LN-240620-001', date: '2024-06-20T10:00:00Z', status: 'posted' },
  // Adaeze's repayments
  { id: 'txn_009', ref: 'TXN-240720-009', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'loan_repayment', category: 'loan', description: 'Loan repayment - Jul 2024', credit: 0, debit: 40000, currency: 'NGN', relatedRef: 'RP-240720-001', date: '2024-07-21T09:00:00Z', status: 'posted' },
  { id: 'txn_010', ref: 'TXN-240820-010', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'loan_repayment', category: 'loan', description: 'Loan repayment - Aug 2024', credit: 0, debit: 40000, currency: 'NGN', relatedRef: 'RP-240820-002', date: '2024-08-21T10:00:00Z', status: 'posted' },
  { id: 'txn_011', ref: 'TXN-240920-011', memberId: 'usr_001', memberName: 'Adaeze Okafor', type: 'loan_repayment', category: 'loan', description: 'Loan repayment - Sep 2024', credit: 0, debit: 40000, currency: 'NGN', relatedRef: 'RP-240920-003', date: '2024-09-21T10:00:00Z', status: 'posted' },

  // Chukwudi's transactions
  { id: 'txn_012', ref: 'TXN-240301-012', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Mar 2024', credit: 30000, debit: 0, currency: 'NGN', relatedRef: 'CON-240301-C1', date: '2024-03-02T10:00:00Z', status: 'posted' },
  { id: 'txn_013', ref: 'TXN-240401-013', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Apr 2024', credit: 30000, debit: 0, currency: 'NGN', relatedRef: 'CON-240401-C2', date: '2024-04-03T08:00:00Z', status: 'posted' },
  { id: 'txn_014', ref: 'TXN-240501-014', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - May 2024', credit: 30000, debit: 0, currency: 'NGN', relatedRef: 'CON-240501-C3', date: '2024-05-02T09:00:00Z', status: 'posted' },
  { id: 'txn_015', ref: 'TXN-240601-015', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jun 2024', credit: 30000, debit: 0, currency: 'NGN', relatedRef: 'CON-240601-C4', date: '2024-06-02T10:30:00Z', status: 'posted' },
  { id: 'txn_016', ref: 'TXN-240715-016', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'contribution', category: 'special_savings', description: 'Special savings deposit', credit: 150000, debit: 0, currency: 'NGN', relatedRef: 'CON-240701-C5', date: '2024-07-16T09:00:00Z', status: 'posted' },
  { id: 'txn_017', ref: 'TXN-240905-017', memberId: 'usr_002', memberName: 'Chukwudi Eze', type: 'loan_disbursement', category: 'loan', description: 'Loan disbursement - Medical expenses', credit: 100000, debit: 0, currency: 'NGN', relatedRef: 'LN-240905-002', date: '2024-09-05T09:00:00Z', status: 'posted' },

  // Fatima's transactions
  { id: 'txn_018', ref: 'TXN-240401-018', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Apr 2024', credit: 40000, debit: 0, currency: 'NGN', relatedRef: 'CON-240401-F1', date: '2024-04-02T10:00:00Z', status: 'posted' },
  { id: 'txn_019', ref: 'TXN-240501-019', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - May 2024', credit: 40000, debit: 0, currency: 'NGN', relatedRef: 'CON-240501-F2', date: '2024-05-02T09:00:00Z', status: 'posted' },
  { id: 'txn_020', ref: 'TXN-240601-020', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jun 2024', credit: 40000, debit: 0, currency: 'NGN', relatedRef: 'CON-240601-F3', date: '2024-06-02T10:00:00Z', status: 'posted' },
  { id: 'txn_021', ref: 'TXN-240710-021', memberId: 'usr_003', memberName: 'Fatima Bello', type: 'contribution', category: 'special_savings', description: 'Special savings deposit', credit: 100000, debit: 0, currency: 'NGN', relatedRef: 'CON-240701-F4', date: '2024-07-11T09:00:00Z', status: 'posted' },

  // Emeka's transactions
  { id: 'txn_022', ref: 'TXN-240501-022', memberId: 'usr_004', memberName: 'Emeka Nwosu', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - May 2024', credit: 25000, debit: 0, currency: 'NGN', relatedRef: 'CON-240501-E1', date: '2024-05-02T10:00:00Z', status: 'posted' },
  { id: 'txn_023', ref: 'TXN-240601-023', memberId: 'usr_004', memberName: 'Emeka Nwosu', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jun 2024', credit: 25000, debit: 0, currency: 'NGN', relatedRef: 'CON-240601-E2', date: '2024-06-02T09:00:00Z', status: 'posted' },
  { id: 'txn_024', ref: 'TXN-240701-024', memberId: 'usr_004', memberName: 'Emeka Nwosu', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jul 2024', credit: 25000, debit: 0, currency: 'NGN', relatedRef: 'CON-240701-E3', date: '2024-07-02T10:00:00Z', status: 'posted' },

  // Ngozi's transactions
  { id: 'txn_025', ref: 'TXN-240601-025', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jun 2024', credit: 60000, debit: 0, currency: 'NGN', relatedRef: 'CON-240601-N1', date: '2024-06-02T10:00:00Z', status: 'posted' },
  { id: 'txn_026', ref: 'TXN-240701-026', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Jul 2024', credit: 60000, debit: 0, currency: 'NGN', relatedRef: 'CON-240701-N2', date: '2024-07-02T09:00:00Z', status: 'posted' },
  { id: 'txn_027', ref: 'TXN-240801-027', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'contribution', category: 'special_savings', description: 'Special savings deposit', credit: 300000, debit: 0, currency: 'NGN', relatedRef: 'CON-240801-N3', date: '2024-08-02T09:00:00Z', status: 'posted' },
  { id: 'txn_028', ref: 'TXN-241002-028', memberId: 'usr_005', memberName: 'Ngozi Adekunle', type: 'withdrawal', category: 'special_savings', description: 'Special savings withdrawal', credit: 0, debit: 50000, currency: 'NGN', relatedRef: 'WR-241001-001', date: '2024-10-02T10:00:00Z', status: 'posted' },

  // Blessing's transactions
  { id: 'txn_029', ref: 'TXN-240801-029', memberId: 'usr_007', memberName: 'Blessing Obi', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Aug 2024', credit: 35000, debit: 0, currency: 'NGN', relatedRef: 'CON-240801-B1', date: '2024-08-02T10:00:00Z', status: 'posted' },
  { id: 'txn_030', ref: 'TXN-240901-030', memberId: 'usr_007', memberName: 'Blessing Obi', type: 'contribution', category: 'regular_savings', description: 'Regular savings contribution - Sep 2024', credit: 35000, debit: 0, currency: 'NGN', relatedRef: 'CON-240901-B2', date: '2024-09-02T09:00:00Z', status: 'posted' },
];

// ─── Notifications ───────────────────────────────────────────
export const notifications: Notification[] = [
  { id: 'ntf_001', userId: 'usr_001', type: 'contribution_approved', title: 'Contribution Approved', message: 'Your regular savings contribution of ₦50,000 for July 2024 has been approved.', read: true, createdAt: '2024-07-02T10:00:00Z', relatedId: 'con_006' },
  { id: 'ntf_002', userId: 'usr_001', type: 'loan_approved', title: 'Loan Application Approved', message: 'Your loan application of ₦200,000 for business expansion has been approved.', read: true, createdAt: '2024-06-18T14:00:00Z', relatedId: 'la_001' },
  { id: 'ntf_003', userId: 'usr_001', type: 'loan_disbursed', title: 'Loan Disbursed', message: 'Your approved loan of ₦200,000 has been disbursed to your account.', read: true, createdAt: '2024-06-20T10:00:00Z', relatedId: 'ln_001' },
  { id: 'ntf_004', userId: 'usr_001', type: 'repayment_verified', title: 'Repayment Verified', message: 'Your loan repayment of ₦40,000 for September 2024 has been verified.', read: false, createdAt: '2024-09-21T10:00:00Z', relatedId: 'rp_003' },
  { id: 'ntf_005', userId: 'usr_001', type: 'contribution_submitted', title: 'Contribution Submitted', message: 'Your regular savings contribution of ₦50,000 has been submitted and is pending verification.', read: false, createdAt: '2024-10-01T09:00:00Z', relatedId: 'con_008' },
  { id: 'ntf_006', userId: 'usr_002', type: 'contribution_rejected', title: 'Contribution Rejected', message: 'Your regular savings contribution of ₦30,000 was rejected. Reason: Transfer reference does not match bank records.', read: false, createdAt: '2024-10-02T11:00:00Z', relatedId: 'con_015' },
  { id: 'ntf_007', userId: 'usr_002', type: 'loan_disbursed', title: 'Loan Disbursed', message: 'Your approved loan of ₦100,000 has been disbursed.', read: true, createdAt: '2024-09-05T09:00:00Z', relatedId: 'ln_002' },
  { id: 'ntf_008', userId: 'adm_001', type: 'loan_application_received', title: 'New Loan Application', message: 'Fatima Bello submitted a loan application for ₦150,000.', read: false, createdAt: '2024-10-20T09:00:00Z', relatedId: 'la_003' },
  { id: 'ntf_009', userId: 'adm_001', type: 'contribution_submitted', title: 'Contribution Pending Verification', message: 'Blessing Obi submitted a regular savings contribution of ₦35,000.', read: false, createdAt: '2024-10-01T11:00:00Z', relatedId: 'con_029' },
];

// ─── Audit Log ───────────────────────────────────────────────
export const auditLog: AuditEntry[] = [
  { id: 'aud_001', performedBy: 'adm_001', performedByName: 'Oluwaseun Adesanya', action: 'contribution.approved', targetType: 'contribution', targetId: 'con_001', targetRef: 'CON-240201-A1', details: 'Approved regular savings contribution of ₦50,000 from Adaeze Okafor', timestamp: '2024-02-02T09:00:00Z' },
  { id: 'aud_002', performedBy: 'adm_001', performedByName: 'Oluwaseun Adesanya', action: 'loan_application.approved', targetType: 'loan_application', targetId: 'la_001', targetRef: 'LA-240601-001', details: 'Approved loan application of ₦200,000 for Adaeze Okafor', timestamp: '2024-06-18T14:00:00Z' },
  { id: 'aud_003', performedBy: 'adm_002', performedByName: 'Amina Lawal', action: 'loan.disbursed', targetType: 'loan', targetId: 'ln_001', targetRef: 'LN-240620-001', details: 'Disbursed ₦200,000 loan to Adaeze Okafor', timestamp: '2024-06-20T10:00:00Z' },
  { id: 'aud_004', performedBy: 'adm_002', performedByName: 'Amina Lawal', action: 'repayment.approved', targetType: 'repayment', targetId: 'rp_001', targetRef: 'RP-240720-001', details: 'Verified repayment of ₦40,000 from Adaeze Okafor', timestamp: '2024-07-21T09:00:00Z' },
  { id: 'aud_005', performedBy: 'adm_002', performedByName: 'Amina Lawal', action: 'contribution.rejected', targetType: 'contribution', targetId: 'con_015', targetRef: 'CON-241001-C6', details: 'Rejected contribution from Chukwudi Eze: Transfer reference does not match', timestamp: '2024-10-02T11:00:00Z' },
  { id: 'aud_006', performedBy: 'adm_001', performedByName: 'Oluwaseun Adesanya', action: 'loan_application.rejected', targetType: 'loan_application', targetId: 'la_005', targetRef: 'LA-240801-005', details: 'Rejected loan application from Emeka Nwosu: Insufficient savings history', timestamp: '2024-08-15T10:00:00Z' },
  { id: 'aud_007', performedBy: 'adm_001', performedByName: 'Oluwaseun Adesanya', action: 'withdrawal.approved', targetType: 'withdrawal', targetId: 'wr_001', targetRef: 'WR-241001-001', details: 'Approved special savings withdrawal of ₦50,000 for Ngozi Adekunle', timestamp: '2024-10-02T10:00:00Z' },
  { id: 'aud_008', performedBy: 'adm_001', performedByName: 'Oluwaseun Adesanya', action: 'member.suspended', targetType: 'member', targetId: 'usr_006', targetRef: 'DBM-0006', details: 'Suspended account of Ibrahim Musa due to inactivity', timestamp: '2024-09-15T11:00:00Z' },
];

// ─── Chart Data ──────────────────────────────────────────────
export const memberSavingsChart: ChartDataPoint[] = [
  { label: 'Feb', value: 50000 },
  { label: 'Mar', value: 100000 },
  { label: 'Apr', value: 150000 },
  { label: 'May', value: 200000 },
  { label: 'Jun', value: 250000 },
  { label: 'Jul', value: 300000 },
  { label: 'Aug', value: 500000 },
  { label: 'Sep', value: 500000 },
  { label: 'Oct', value: 500000 },
];

export const contributionsOverviewChart: ChartDataPoint[] = [
  { label: 'Feb', value: 50000, value2: 0 },
  { label: 'Mar', value: 80000, value2: 0 },
  { label: 'Apr', value: 130000, value2: 0 },
  { label: 'May', value: 145000, value2: 0 },
  { label: 'Jun', value: 205000, value2: 0 },
  { label: 'Jul', value: 240000, value2: 550000 },
  { label: 'Aug', value: 305000, value2: 200000 },
  { label: 'Sep', value: 340000, value2: 0 },
  { label: 'Oct', value: 340000, value2: 0 },
];

export const memberGrowthChart: ChartDataPoint[] = [
  { label: 'Jan', value: 1 },
  { label: 'Feb', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 4 },
  { label: 'May', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Aug', value: 7 },
  { label: 'Sep', value: 7 },
  { label: 'Oct', value: 8 },
];

export const loanActivityChart: ChartDataPoint[] = [
  { label: 'Jun', value: 1, value2: 200000 },
  { label: 'Jul', value: 0, value2: 0 },
  { label: 'Aug', value: 1, value2: 300000 },
  { label: 'Sep', value: 1, value2: 100000 },
  { label: 'Oct', value: 1, value2: 500000 },
];

// ─── Summary Computations ────────────────────────────────────
export function getMemberDashboardSummary(memberId: string): MemberDashboardSummary {
  const savings = getMemberSavings(memberId);
  const approvedContribs = contributions.filter(
    (c) => c.memberId === memberId && c.status === 'approved'
  );
  const pendingContribs = contributions.filter(
    (c) => c.memberId === memberId && c.status === 'pending'
  );
  const memberLoans = loans.filter(
    (l) => l.memberId === memberId && (l.status === 'disbursed' || l.status === 'repaying')
  );

  return {
    regularSavings: savings.regularSavings,
    specialSavings: savings.specialSavings,
    totalApprovedContributions: approvedContribs.reduce((s, c) => s + c.amount, 0),
    outstandingLoanBalance: memberLoans.reduce((s, l) => s + l.outstandingPrincipal, 0),
    pendingContributions: pendingContribs.length,
    activeLoans: memberLoans.length,
  };
}

export function getAdminDashboardSummary(): AdminDashboardSummary {
  const approvedContribs = contributions.filter((c) => c.status === 'approved');
  const pendingContribs = contributions.filter((c) => c.status === 'pending');
  const activeLoans_ = loans.filter((l) => l.status === 'disbursed' || l.status === 'repaying');
  const pendingApps = loanApplications.filter((la) => la.status === 'pending' || la.status === 'under_review');

  const allSavings = members.map((m) => getMemberSavings(m.id));

  return {
    totalMembers: members.length,
    totalApprovedContributions: approvedContribs.reduce((s, c) => s + c.amount, 0),
    pendingVerifications: pendingContribs.length,
    activeLoans: activeLoans_.length,
    outstandingLoanPrincipal: activeLoans_.reduce((s, l) => s + l.outstandingPrincipal, 0),
    pendingLoanApplications: pendingApps.length,
    totalRegularSavings: allSavings.reduce((s, sv) => s + sv.regularSavings, 0),
    totalSpecialSavings: allSavings.reduce((s, sv) => s + sv.specialSavings, 0),
  };
}

// ─── Current mock user (for demo) ────────────────────────────
export const currentMember: User = members[0]; // Adaeze Okafor
export const currentAdmin: User = admins[0]; // Oluwaseun Adesanya
