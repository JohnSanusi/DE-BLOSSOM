create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  username text,
  member_number text unique not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_type text not null check (account_type in ('Savings', 'Shares', 'Special Savings')),
  balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, account_type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_number text not null,
  account_type text not null check (account_type in ('Savings', 'Shares', 'Special Savings')),
  transaction_type text not null check (transaction_type in ('Credit', 'Debit')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  transaction_date date not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_number text not null,
  principal_amount numeric(12,2) not null check (principal_amount > 0),
  interest_rate numeric(6,3),
  interest_amount numeric(12,2),
  total_payable numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  outstanding_balance numeric(12,2) not null,
  status text not null default 'Active' check (status in ('Active', 'Completed')),
  start_date date not null,
  due_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_number text not null,
  amount numeric(12,2) not null check (amount > 0),
  interest_amount numeric(12,2) not null default 0,
  principal_amount numeric(12,2) not null default 0,
  payment_date date not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.repayment_receipts (
  id uuid primary key default gen_random_uuid(),
  loan_payment_id uuid references public.loan_payments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_number text not null,
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.savings_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;
alter table public.repayment_receipts enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create policy "members read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "members read own savings" on public.savings_accounts for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "members read own transactions" on public.transactions for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "admins manage transactions" on public.transactions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members read own loans" on public.loans for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "admins manage loans" on public.loans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members read own payments" on public.loan_payments for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "admins manage payments" on public.loan_payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members read own receipts" on public.repayment_receipts for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "admins manage receipts" on public.repayment_receipts for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values ('repayment-receipts', 'repayment-receipts', false) on conflict (id) do nothing;
create policy "members upload own receipts" on storage.objects for insert to authenticated with check (bucket_id = 'repayment-receipts' and (storage.foldername(name))[1] = 'repayment-receipts' and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy "members read own receipt files" on storage.objects for select to authenticated using (bucket_id = 'repayment-receipts' and ((storage.foldername(name))[2] = (select auth.uid())::text or public.is_admin()));
