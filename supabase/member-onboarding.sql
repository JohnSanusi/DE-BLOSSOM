-- Run after schema.sql and oauth-profile-trigger.sql.
-- Adds member onboarding fields and secure mutations for profile completion and admin records.

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.complete_member_profile(
  p_full_name text,
  p_username text,
  p_phone text,
  p_member_number text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(p_full_name), '') is null
    or nullif(trim(p_username), '') is null
    or nullif(trim(p_phone), '') is null
    or nullif(trim(p_member_number), '') is null then
    raise exception 'All member profile fields are required';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      username = lower(trim(p_username)),
      phone = trim(p_phone),
      member_number = upper(trim(p_member_number))
  where id = auth.uid()
    and role = 'member'
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Member profile was not found';
  end if;

  return updated_profile;
exception
  when unique_violation then
    raise exception 'That username or member number is already in use';
end;
$$;

grant execute on function public.complete_member_profile(text, text, text, text) to authenticated;

create or replace function public.record_admin_transaction(
  p_user_id uuid,
  p_account_type text,
  p_transaction_type text,
  p_amount numeric,
  p_description text,
  p_transaction_date date
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles;
  saved_transaction public.transactions;
  signed_amount numeric;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_account_type not in ('Savings', 'Shares', 'Special Savings') then
    raise exception 'Invalid account type';
  end if;

  if p_transaction_type not in ('Credit', 'Debit') then
    raise exception 'Invalid transaction type';
  end if;

  select * into target_profile
  from public.profiles
  where id = p_user_id and role = 'member';

  if target_profile.id is null then
    raise exception 'Member was not found';
  end if;

  insert into public.savings_accounts (user_id, account_type, balance)
  values (target_profile.id, p_account_type, 0)
  on conflict (user_id, account_type) do nothing;

  signed_amount := case when p_transaction_type = 'Credit' then p_amount else -p_amount end;

  update public.savings_accounts
  set balance = balance + signed_amount
  where user_id = target_profile.id
    and account_type = p_account_type
    and balance + signed_amount >= 0;

  if not found then
    raise exception 'Debit would make the account balance negative';
  end if;

  insert into public.transactions (
    user_id, member_number, account_type, transaction_type, amount,
    description, transaction_date, created_by
  )
  values (
    target_profile.id, target_profile.member_number, p_account_type,
    p_transaction_type, p_amount, trim(p_description), p_transaction_date,
    auth.uid()
  )
  returning * into saved_transaction;

  return saved_transaction;
end;
$$;

grant execute on function public.record_admin_transaction(uuid, text, text, numeric, text, date) to authenticated;
