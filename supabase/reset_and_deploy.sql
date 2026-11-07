-- ==============================================================================
-- DE-BLOSSOM COOPERATIVE FINANCIAL MANAGEMENT PLATFORM
-- PRODUCTION SUPABASE / POSTGRESQL SCHEMA MIGRATION
-- ==============================================================================

-- ==============================================================================
-- 0. CLEAN SLATE: DROP OLD CONFLICTING TABLES, VIEWS, TRIGGERS, & SEQUENCES
-- Guarantees clean recreation without legacy column mismatches (e.g. member_id vs user_id)
-- ==============================================================================
DROP VIEW IF EXISTS public.member_financial_summary CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.repayments CASCADE;
DROP TABLE IF EXISTS public.loans CASCADE;
DROP TABLE IF EXISTS public.loan_applications CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.contributions CASCADE;
DROP TABLE IF EXISTS public.cooperative_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS member_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS contribution_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS loan_app_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS loan_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS repayment_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS transaction_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS withdrawal_ref_seq CASCADE;

-- Drop custom types to allow fresh definition
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS savings_category CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS loan_application_status CASCADE;
DROP TYPE IF EXISTS loan_facility_status CASCADE;
DROP TYPE IF EXISTS transaction_category CASCADE;
DROP TYPE IF EXISTS transaction_movement CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE savings_category AS ENUM ('regular', 'special');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_facility_status AS ENUM ('approved', 'disbursed', 'repaying', 'completed', 'defaulted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_category AS ENUM ('regular_savings', 'special_savings', 'loan', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_movement AS ENUM ('contribution', 'loan_disbursement', 'loan_repayment', 'withdrawal', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. SEQUENCES FOR CLEAN HUMAN-READABLE FINANCIAL REFERENCES
CREATE SEQUENCE IF NOT EXISTS member_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS contribution_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS loan_app_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS loan_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS repayment_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS transaction_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS withdrawal_ref_seq START WITH 1;

-- Reference generator helper
CREATE OR REPLACE FUNCTION generate_prefixed_ref(prefix text, seq_name text, pad_length int)
RETURNS text AS $$
DECLARE
    next_val bigint;
BEGIN
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
    RETURN prefix || '-' || to_char(CURRENT_DATE, 'YYMM') || '-' || lpad(next_val::text, pad_length, '0');
END;
$$ LANGUAGE plpgsql;


-- 4. PROFILES (Tied to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    member_ref TEXT UNIQUE DEFAULT ('DBM-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('member_ref_seq')::text, 3, '0')),
    full_name TEXT NOT NULL DEFAULT 'Member',
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'member',
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Auto-migrate columns if profiles was previously created by Supabase starter template
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_ref TEXT DEFAULT ('DBM-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('member_ref_seq')::text, 3, '0'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Index profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);


-- 5. COOPERATIVE SETTINGS (Official receiving bank account & policies)
CREATE TABLE IF NOT EXISTS public.cooperative_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cooperative_name TEXT NOT NULL DEFAULT 'DE-BLOSSOM Cooperative Society Limited',
    bank_name TEXT NOT NULL DEFAULT 'Zenith Bank Plc',
    bank_account_number TEXT NOT NULL DEFAULT '1012345678',
    bank_account_name TEXT NOT NULL DEFAULT 'DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD',
    currency TEXT NOT NULL DEFAULT 'NGN',
    min_regular_contribution NUMERIC(15, 2) NOT NULL DEFAULT 5000.00,
    min_loan_request NUMERIC(15, 2) NOT NULL DEFAULT 20000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_by UUID REFERENCES public.profiles(id)
);


-- 6. CONTRIBUTIONS (Member payment submissions)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref TEXT UNIQUE NOT NULL DEFAULT generate_prefixed_ref('CON', 'contribution_ref_seq', 4),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    type savings_category NOT NULL DEFAULT 'regular',
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    sender_name TEXT,
    transfer_reference TEXT,
    receipt_url TEXT,
    receipt_file_name TEXT,
    status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_contributions_member ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_type ON public.contributions(type);


-- 7. WITHDRAWAL REQUESTS (Special Savings voluntary withdrawals)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref TEXT UNIQUE NOT NULL DEFAULT generate_prefixed_ref('WR', 'withdrawal_ref_seq', 4),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    reason TEXT,
    status verification_status NOT NULL DEFAULT 'pending',
    request_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_member ON public.withdrawal_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);


-- 8. LOAN APPLICATIONS
CREATE TABLE IF NOT EXISTS public.loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref TEXT UNIQUE NOT NULL DEFAULT generate_prefixed_ref('LA', 'loan_app_ref_seq', 4),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    requested_amount NUMERIC(15, 2) NOT NULL CHECK (requested_amount >= 20000.00),
    approved_amount NUMERIC(15, 2),
    repayment_duration_months INT NOT NULL CHECK (repayment_duration_months > 0),
    purpose TEXT NOT NULL,
    additional_info TEXT,
    guarantor1_name TEXT,
    guarantor1_phone TEXT,
    guarantor2_name TEXT,
    guarantor2_phone TEXT,
    status loan_application_status NOT NULL DEFAULT 'pending',
    application_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_loan_apps_member ON public.loan_applications(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_apps_status ON public.loan_applications(status);


-- 9. ACTIVE & HISTORICAL LOANS (Created only upon committee approval)
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref TEXT UNIQUE NOT NULL DEFAULT generate_prefixed_ref('LN', 'loan_ref_seq', 4),
    application_id UUID UNIQUE NOT NULL REFERENCES public.loan_applications(id),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    disbursed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    outstanding_principal NUMERIC(15, 2) NOT NULL,
    repayment_duration_months INT NOT NULL,
    purpose TEXT NOT NULL,
    status loan_facility_status NOT NULL DEFAULT 'approved',
    approved_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    disbursement_date TIMESTAMPTZ,
    disbursed_by UUID REFERENCES public.profiles(id),
    completion_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_loans_member ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);


-- 10. REPAYMENTS (Principal amortization installments)
CREATE TABLE IF NOT EXISTS public.repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref TEXT UNIQUE NOT NULL DEFAULT generate_prefixed_ref('RP', 'repayment_ref_seq', 4),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    principal_component NUMERIC(15, 2) NOT NULL CHECK (principal_component > 0),
    interest_component NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Rate pending ratification
    fee_component NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    transfer_reference TEXT,
    receipt_url TEXT,
    receipt_file_name TEXT,
    status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_repayments_loan ON public.repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_member ON public.repayments(member_id);
CREATE INDEX IF NOT EXISTS idx_repayments_status ON public.repayments(status);


-- 11. GENERAL FINANCIAL LEDGER (Strictly Immutable Journal)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref TEXT UNIQUE NOT NULL DEFAULT generate_prefixed_ref('TXN', 'transaction_ref_seq', 5),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    type transaction_movement NOT NULL,
    category transaction_category NOT NULL,
    description TEXT NOT NULL,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    related_ref TEXT,
    source_ref TEXT,
    status TEXT NOT NULL DEFAULT 'posted' CHECK (status = 'posted'),
    posting_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_txns_member ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_txns_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_txns_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_txns_posting_date ON public.transactions(posting_date);


-- 12. IMMUTABILITY TRIGGER ON FINANCIAL LEDGER
-- Blocks any UPDATE or DELETE operations on transactions
CREATE OR REPLACE FUNCTION enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'COOPERATIVE ACCOUNTING INTEGRITY VIOLATION: Financial ledger transactions are strictly immutable and cannot be updated or deleted. You must record an audited adjustment transaction instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_immutability ON public.transactions;
CREATE TRIGGER trg_ledger_immutability
BEFORE UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_immutability();


-- 13. AUDIT LOGS (Immutable tracking of privileged executive actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id),
    actor_name TEXT NOT NULL,
    actor_role user_role NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    target_ref TEXT,
    details TEXT NOT NULL,
    ip_address TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

-- Trigger to block updates or deletes on audit logs
CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY VIOLATION: Audit logs are tamper-proof and cannot be altered or removed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutability ON public.audit_logs;
CREATE TRIGGER trg_audit_immutability
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutability();


-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current authenticated user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- PROFILES POLICIES
-- Members can view their own profile; admins can view all profiles
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Members can update their phone/avatar only; role changes blocked
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());


-- COOPERATIVE SETTINGS POLICIES
-- Everyone can read official bank account details
CREATE POLICY "settings_select_all" ON public.cooperative_settings
    FOR SELECT USING (true);

-- Only admins can change official receiving accounts
CREATE POLICY "settings_update_admin" ON public.cooperative_settings
    FOR UPDATE USING (public.is_admin());


-- CONTRIBUTIONS POLICIES
-- Members can read their own contributions; Admins read all
CREATE POLICY "contributions_select" ON public.contributions
    FOR SELECT USING (auth.uid() = member_id OR public.is_admin());

-- Members can insert their own contributions with 'pending' status
CREATE POLICY "contributions_insert_member" ON public.contributions
    FOR INSERT WITH CHECK (auth.uid() = member_id AND status = 'pending');

-- Only admins can update (approve or reject) contributions
CREATE POLICY "contributions_update_admin" ON public.contributions
    FOR UPDATE USING (public.is_admin());


-- WITHDRAWAL REQUESTS POLICIES
CREATE POLICY "withdrawals_select" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "withdrawals_insert_member" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = member_id AND status = 'pending');

CREATE POLICY "withdrawals_update_admin" ON public.withdrawal_requests
    FOR UPDATE USING (public.is_admin());


-- LOAN APPLICATIONS POLICIES
CREATE POLICY "loan_apps_select" ON public.loan_applications
    FOR SELECT USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "loan_apps_insert_member" ON public.loan_applications
    FOR INSERT WITH CHECK (auth.uid() = member_id AND status = 'pending');

CREATE POLICY "loan_apps_update_admin" ON public.loan_applications
    FOR UPDATE USING (public.is_admin());


-- LOANS POLICIES
CREATE POLICY "loans_select" ON public.loans
    FOR SELECT USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "loans_admin_all" ON public.loans
    FOR ALL USING (public.is_admin());


-- REPAYMENTS POLICIES
CREATE POLICY "repayments_select" ON public.repayments
    FOR SELECT USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "repayments_insert_member" ON public.repayments
    FOR INSERT WITH CHECK (auth.uid() = member_id AND status = 'pending');

CREATE POLICY "repayments_update_admin" ON public.repayments
    FOR UPDATE USING (public.is_admin());


-- TRANSACTIONS (LEDGER) POLICIES
-- Members can only read their own ledger postings; Admins read all
CREATE POLICY "transactions_select" ON public.transactions
    FOR SELECT USING (auth.uid() = member_id OR public.is_admin());

-- Only admins/system stored procedures can insert transactions
CREATE POLICY "transactions_insert_admin" ON public.transactions
    FOR INSERT WITH CHECK (public.is_admin());


-- AUDIT LOGS POLICIES
CREATE POLICY "audit_select_admin" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "audit_insert_admin" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);


-- ==============================================================================
-- 15. ATOMIC STORED PROCEDURES (ACID FINANCIAL RPCS)
-- ==============================================================================

-- 15.1 APPROVE CONTRIBUTION & POST TO LEDGER
CREATE OR REPLACE FUNCTION public.approve_contribution(
    p_contribution_id UUID,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_contrib RECORD;
    v_admin RECORD;
    v_new_txn_id UUID;
    v_new_txn_ref TEXT;
BEGIN
    -- Verify executing user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only verified cooperative administrators can approve contributions.';
    END IF;

    -- Fetch contribution with lock
    SELECT * INTO v_contrib FROM public.contributions
    WHERE id = p_contribution_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contribution record % not found', p_contribution_id;
    END IF;

    IF v_contrib.status <> 'pending' THEN
        RAISE EXCEPTION 'Contribution % is already %', v_contrib.ref, v_contrib.status;
    END IF;

    -- Fetch admin profile
    SELECT * INTO v_admin FROM public.profiles WHERE id = auth.uid();

    -- 1. Update contribution status
    UPDATE public.contributions
    SET status = 'approved',
        verified_by = auth.uid(),
        verified_at = timezone('utc', now()),
        remarks = COALESCE(p_remarks, 'Verified and matched against official bank statement.')
    WHERE id = p_contribution_id;

    -- 2. Post immutable credit transaction to the general financial ledger
    INSERT INTO public.transactions (
        member_id,
        type,
        category,
        description,
        credit,
        debit,
        currency,
        related_ref,
        source_ref,
        status,
        posting_date
    ) VALUES (
        v_contrib.member_id,
        'contribution',
        CASE WHEN v_contrib.type = 'regular' THEN 'regular_savings'::transaction_category ELSE 'special_savings'::transaction_category END,
        format('%s savings contribution - verified payment', initcap(v_contrib.type::text)),
        v_contrib.amount,
        0.00,
        'NGN',
        v_contrib.ref,
        v_contrib.transfer_reference,
        'posted',
        timezone('utc', now())
    ) RETURNING id, ref INTO v_new_txn_id, v_new_txn_ref;

    -- 3. Record in tamper-proof audit trail
    INSERT INTO public.audit_logs (
        actor_id,
        actor_name,
        actor_role,
        action,
        target_type,
        target_id,
        target_ref,
        details
    ) VALUES (
        auth.uid(),
        v_admin.full_name,
        'admin',
        'contribution.approved',
        'contribution',
        v_contrib.id,
        v_contrib.ref,
        format('Approved %s contribution of NGN %s for %s. Posted ledger ref: %s',
               v_contrib.type, v_contrib.amount, v_contrib.member_id, v_new_txn_ref)
    );

    RETURN jsonb_build_object(
        'success', true,
        'contribution_ref', v_contrib.ref,
        'transaction_ref', v_new_txn_ref,
        'amount', v_contrib.amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 15.2 REJECT CONTRIBUTION WITH MANDATORY REASON
CREATE OR REPLACE FUNCTION public.reject_contribution(
    p_contribution_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_contrib RECORD;
    v_admin RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only administrators can reject contributions.';
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'A documented rejection reason is mandatory for financial audits.';
    END IF;

    SELECT * INTO v_contrib FROM public.contributions
    WHERE id = p_contribution_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contribution % not found', p_contribution_id;
    END IF;

    IF v_contrib.status <> 'pending' THEN
        RAISE EXCEPTION 'Contribution % is already %', v_contrib.ref, v_contrib.status;
    END IF;

    SELECT * INTO v_admin FROM public.profiles WHERE id = auth.uid();

    -- Update status (NO ledger transaction is created)
    UPDATE public.contributions
    SET status = 'rejected',
        verified_by = auth.uid(),
        verified_at = timezone('utc', now()),
        rejection_reason = trim(p_reason),
        remarks = trim(p_reason)
    WHERE id = p_contribution_id;

    -- Record audit entry
    INSERT INTO public.audit_logs (
        actor_id,
        actor_name,
        actor_role,
        action,
        target_type,
        target_id,
        target_ref,
        details
    ) VALUES (
        auth.uid(),
        v_admin.full_name,
        'admin',
        'contribution.rejected',
        'contribution',
        v_contrib.id,
        v_contrib.ref,
        format('Rejected contribution of NGN %s. Reason: %s', v_contrib.amount, trim(p_reason))
    );

    RETURN jsonb_build_object('success', true, 'ref', v_contrib.ref);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 15.3 DISBURSE LOAN FUNDS & RECORD LEDGER DEBIT OUTFLOW
CREATE OR REPLACE FUNCTION public.disburse_loan(
    p_loan_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_loan RECORD;
    v_admin RECORD;
    v_txn_ref TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only authorized administrators can disburse loan facilities.';
    END IF;

    SELECT * INTO v_loan FROM public.loans
    WHERE id = p_loan_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan facility % not found', p_loan_id;
    END IF;

    IF v_loan.status <> 'approved' THEN
        RAISE EXCEPTION 'Loan % cannot be disbursed because current status is %', v_loan.ref, v_loan.status;
    END IF;

    SELECT * INTO v_admin FROM public.profiles WHERE id = auth.uid();

    -- 1. Update loan record to disbursed
    UPDATE public.loans
    SET status = 'disbursed',
        disbursed_amount = principal_amount,
        outstanding_principal = principal_amount,
        disbursement_date = timezone('utc', now()),
        disbursed_by = auth.uid()
    WHERE id = p_loan_id;

    -- 2. Post Debit Outflow to financial ledger
    INSERT INTO public.transactions (
        member_id,
        type,
        category,
        description,
        credit,
        debit,
        currency,
        related_ref,
        source_ref,
        status,
        posting_date
    ) VALUES (
        v_loan.member_id,
        'loan_disbursement',
        'loan',
        format('Loan disbursement for %s', v_loan.purpose),
        v_loan.principal_amount,
        0.00,
        'NGN',
        v_loan.ref,
        format('DISB-%s', v_loan.ref),
        'posted',
        timezone('utc', now())
    ) RETURNING ref INTO v_txn_ref;

    -- 3. Audit log
    INSERT INTO public.audit_logs (
        actor_id,
        actor_name,
        actor_role,
        action,
        target_type,
        target_id,
        target_ref,
        details
    ) VALUES (
        auth.uid(),
        v_admin.full_name,
        'admin',
        'loan.disbursed',
        'loan',
        v_loan.id,
        v_loan.ref,
        format('Disbursed NGN %s to member %s. Ledger ref: %s',
               v_loan.principal_amount, v_loan.member_id, v_txn_ref)
    );

    RETURN jsonb_build_object(
        'success', true,
        'loan_ref', v_loan.ref,
        'disbursed_amount', v_loan.principal_amount,
        'transaction_ref', v_txn_ref
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 15.4 APPROVE REPAYMENT & AMORTIZE LOAN PRINCIPAL
CREATE OR REPLACE FUNCTION public.approve_repayment(
    p_repayment_id UUID,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_repay RECORD;
    v_loan RECORD;
    v_admin RECORD;
    v_new_outstanding NUMERIC(15, 2);
    v_new_loan_status loan_facility_status;
    v_txn_ref TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only administrators can approve loan repayments.';
    END IF;

    SELECT * INTO v_repay FROM public.repayments
    WHERE id = p_repayment_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Repayment % not found', p_repayment_id;
    END IF;

    IF v_repay.status <> 'pending' THEN
        RAISE EXCEPTION 'Repayment % is already %', v_repay.ref, v_repay.status;
    END IF;

    SELECT * INTO v_loan FROM public.loans
    WHERE id = v_repay.loan_id FOR UPDATE;

    SELECT * INTO v_admin FROM public.profiles WHERE id = auth.uid();

    -- Calculate new outstanding principal (strictly principal-only amortization)
    v_new_outstanding := GREATEST(0.00, v_loan.outstanding_principal - v_repay.principal_component);
    v_new_loan_status := CASE WHEN v_new_outstanding = 0.00 THEN 'completed'::loan_facility_status ELSE 'repaying'::loan_facility_status END;

    -- 1. Update repayment record
    UPDATE public.repayments
    SET status = 'approved',
        verified_by = auth.uid(),
        verified_at = timezone('utc', now()),
        remarks = COALESCE(p_remarks, 'Verified and deducted from outstanding principal.')
    WHERE id = p_repayment_id;

    -- 2. Decrement loan principal
    UPDATE public.loans
    SET outstanding_principal = v_new_outstanding,
        status = v_new_loan_status,
        completion_date = CASE WHEN v_new_outstanding = 0.00 THEN timezone('utc', now()) ELSE completion_date END
    WHERE id = v_loan.id;

    -- 3. Post repayment credit to general financial ledger
    INSERT INTO public.transactions (
        member_id,
        type,
        category,
        description,
        credit,
        debit,
        currency,
        related_ref,
        source_ref,
        status,
        posting_date
    ) VALUES (
        v_repay.member_id,
        'loan_repayment',
        'loan',
        format('Loan principal repayment for facility %s', v_loan.ref),
        0.00,
        v_repay.principal_component,
        'NGN',
        v_loan.ref,
        v_repay.transfer_reference,
        'posted',
        timezone('utc', now())
    ) RETURNING ref INTO v_txn_ref;

    -- 4. Audit log
    INSERT INTO public.audit_logs (
        actor_id,
        actor_name,
        actor_role,
        action,
        target_type,
        target_id,
        target_ref,
        details
    ) VALUES (
        auth.uid(),
        v_admin.full_name,
        'admin',
        'repayment.approved',
        'repayment',
        v_repay.id,
        v_repay.ref,
        format('Approved repayment of NGN %s for loan %s. Remaining principal: NGN %s',
               v_repay.amount, v_loan.ref, v_new_outstanding)
    );

    RETURN jsonb_build_object(
        'success', true,
        'repayment_ref', v_repay.ref,
        'loan_ref', v_loan.ref,
        'remaining_principal', v_new_outstanding,
        'loan_status', v_new_loan_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 16. AUTOMATIC AUTH USER ONBOARDING TRIGGER
-- Automatically creates a matching profile in public.profiles on auth.users insert
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        role,
        status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Cooperative Member'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        'member', -- STRICT SECURITY: All self-registered users default to member
        'active'
    ) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 17. INITIAL COOPERATIVE SEED DATA
-- ==============================================================================
INSERT INTO public.cooperative_settings (
    cooperative_name,
    bank_name,
    bank_account_number,
    bank_account_name,
    currency,
    min_regular_contribution,
    min_loan_request
) VALUES (
    'DE-BLOSSOM Cooperative Society Limited',
    'Zenith Bank Plc',
    '1012345678',
    'DE-BLOSSOM MULTIPURPOSE COOPERATIVE SOCIETY LTD',
    'NGN',
    5000.00,
    20000.00
) ON CONFLICT DO NOTHING;


-- ==============================================================================
-- 18. DASHBOARD SUMMARY VIEWS & AGGREGATE FUNCTIONS
-- High-performance pre-calculated endpoints for Member and Admin dashboards
-- ==============================================================================

-- 18.1 MEMBER FINANCIAL SUMMARY VIEW
CREATE OR REPLACE VIEW public.member_financial_summary AS
SELECT
    p.id AS member_id,
    p.member_ref,
    p.full_name,
    p.email,
    p.phone,
    p.role,
    p.status,
    -- Regular Savings (Approved regular contributions minus regular withdrawals if any)
    COALESCE((
        SELECT SUM(c.amount)
        FROM public.contributions c
        WHERE c.member_id = p.id AND c.type = 'regular' AND c.status = 'approved'
    ), 0.00) AS regular_savings,
    -- Special Savings (Approved special contributions minus approved special withdrawals)
    COALESCE((
        SELECT SUM(c.amount)
        FROM public.contributions c
        WHERE c.member_id = p.id AND c.type = 'special' AND c.status = 'approved'
    ), 0.00) - COALESCE((
        SELECT SUM(w.amount)
        FROM public.withdrawal_requests w
        WHERE w.member_id = p.id AND w.status = 'approved'
    ), 0.00) AS special_savings,
    -- Total Savings (Regular + Special)
    (
        COALESCE((
            SELECT SUM(c.amount)
            FROM public.contributions c
            WHERE c.member_id = p.id AND c.type = 'regular' AND c.status = 'approved'
        ), 0.00) +
        COALESCE((
            SELECT SUM(c.amount)
            FROM public.contributions c
            WHERE c.member_id = p.id AND c.type = 'special' AND c.status = 'approved'
        ), 0.00) - COALESCE((
            SELECT SUM(w.amount)
            FROM public.withdrawal_requests w
            WHERE w.member_id = p.id AND w.status = 'approved'
        ), 0.00)
    ) AS total_savings,
    -- Active Loans Count
    COALESCE((
        SELECT COUNT(*)
        FROM public.loans l
        WHERE l.member_id = p.id AND l.status IN ('disbursed', 'repaying')
    ), 0) AS active_loans_count,
    -- Outstanding Loan Principal
    COALESCE((
        SELECT SUM(l.outstanding_principal)
        FROM public.loans l
        WHERE l.member_id = p.id AND l.status IN ('disbursed', 'repaying')
    ), 0.00) AS outstanding_loan_principal,
    -- Cumulative Borrowed
    COALESCE((
        SELECT SUM(l.principal_amount)
        FROM public.loans l
        WHERE l.member_id = p.id AND l.status IN ('disbursed', 'repaying', 'completed')
    ), 0.00) AS total_borrowed,
    -- Cumulative Repaid
    COALESCE((
        SELECT SUM(r.principal_component)
        FROM public.repayments r
        WHERE r.member_id = p.id AND r.status = 'approved'
    ), 0.00) AS total_repaid,
    -- Pending Verification Submissions
    COALESCE((
        SELECT COUNT(*)
        FROM public.contributions c
        WHERE c.member_id = p.id AND c.status = 'pending'
    ), 0) AS pending_contributions_count,
    -- Pending Loan Applications
    COALESCE((
        SELECT COUNT(*)
        FROM public.loan_applications la
        WHERE la.member_id = p.id AND la.status IN ('pending', 'under_review')
    ), 0) AS pending_loan_apps_count
FROM public.profiles p;


-- 18.2 ADMIN DASHBOARD EXECUTIVE METRICS RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
    v_total_members INT;
    v_total_regular NUMERIC(15, 2);
    v_total_special NUMERIC(15, 2);
    v_total_withdrawals NUMERIC(15, 2);
    v_net_special NUMERIC(15, 2);
    v_total_society_capital NUMERIC(15, 2);
    v_active_loans_count INT;
    v_outstanding_principal NUMERIC(15, 2);
    v_total_disbursed NUMERIC(15, 2);
    v_total_repaid NUMERIC(15, 2);
    v_recovery_rate NUMERIC(5, 2);
    v_pending_contributions INT;
    v_pending_repayments INT;
    v_pending_loan_apps INT;
    v_pending_withdrawals INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Admin privileges required to inspect society dashboard metrics.';
    END IF;

    -- Members count
    SELECT COUNT(*) INTO v_total_members FROM public.profiles WHERE role = 'member';

    -- Regular savings total
    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_regular
    FROM public.contributions WHERE type = 'regular' AND status = 'approved';

    -- Special savings total
    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_special
    FROM public.contributions WHERE type = 'special' AND status = 'approved';

    -- Special withdrawals total
    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_withdrawals
    FROM public.withdrawal_requests WHERE status = 'approved';

    v_net_special := GREATEST(0.00, v_total_special - v_total_withdrawals);
    v_total_society_capital := v_total_regular + v_net_special;

    -- Loans metrics
    SELECT COUNT(*), COALESCE(SUM(outstanding_principal), 0.00)
    INTO v_active_loans_count, v_outstanding_principal
    FROM public.loans WHERE status IN ('disbursed', 'repaying');

    SELECT COALESCE(SUM(principal_amount), 0.00) INTO v_total_disbursed
    FROM public.loans WHERE status IN ('disbursed', 'repaying', 'completed');

    SELECT COALESCE(SUM(principal_component), 0.00) INTO v_total_repaid
    FROM public.repayments WHERE status = 'approved';

    IF v_total_disbursed > 0 THEN
        v_recovery_rate := ROUND(((v_total_repaid / v_total_disbursed) * 100)::numeric, 2);
    ELSE
        v_recovery_rate := 100.00;
    END IF;

    -- Queues awaiting admin action
    SELECT COUNT(*) INTO v_pending_contributions FROM public.contributions WHERE status = 'pending';
    SELECT COUNT(*) INTO v_pending_repayments FROM public.repayments WHERE status = 'pending';
    SELECT COUNT(*) INTO v_pending_loan_apps FROM public.loan_applications WHERE status IN ('pending', 'under_review');
    SELECT COUNT(*) INTO v_pending_withdrawals FROM public.withdrawal_requests WHERE status = 'pending';

    RETURN jsonb_build_object(
        'total_members', v_total_members,
        'total_regular_savings', v_total_regular,
        'total_special_savings', v_net_special,
        'total_society_capital', v_total_society_capital,
        'active_loans_count', v_active_loans_count,
        'outstanding_loan_principal', v_outstanding_principal,
        'total_disbursed_principal', v_total_disbursed,
        'total_repaid_principal', v_total_repaid,
        'loan_recovery_rate', v_recovery_rate,
        'pending_contributions_count', v_pending_contributions,
        'pending_repayments_count', v_pending_repayments,
        'pending_loan_apps_count', v_pending_loan_apps,
        'pending_withdrawals_count', v_pending_withdrawals,
        'total_pending_verifications', (v_pending_contributions + v_pending_repayments)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 18.3 MONTHLY FINANCIAL TRENDS FOR CHARTS
CREATE OR REPLACE FUNCTION public.get_monthly_financial_trends(p_months_count INT DEFAULT 6)
RETURNS TABLE (
    month_label TEXT,
    contributions NUMERIC(15, 2),
    disbursements NUMERIC(15, 2),
    repayments NUMERIC(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT to_char(d, 'Mon') AS m_label,
               date_trunc('month', d) AS m_date
        FROM generate_series(
            date_trunc('month', CURRENT_DATE) - (p_months_count - 1 || ' months')::interval,
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
        ) d
    )
    SELECT
        m.m_label::TEXT,
        COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'approved'), 0.00)::NUMERIC(15, 2) AS contributions,
        COALESCE(SUM(l.principal_amount) FILTER (WHERE l.status IN ('disbursed', 'repaying', 'completed')), 0.00)::NUMERIC(15, 2) AS disbursements,
        COALESCE(SUM(r.principal_component) FILTER (WHERE r.status = 'approved'), 0.00)::NUMERIC(15, 2) AS repayments
    FROM months m
    LEFT JOIN public.contributions c ON date_trunc('month', c.payment_date) = m.m_date
    LEFT JOIN public.loans l ON date_trunc('month', l.disbursement_date) = m.m_date
    LEFT JOIN public.repayments r ON date_trunc('month', r.payment_date) = m.m_date
    GROUP BY m.m_date, m.m_label
    ORDER BY m.m_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
