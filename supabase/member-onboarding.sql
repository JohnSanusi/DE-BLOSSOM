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

  if exists (
    select 1 from public.profiles
    where id = auth.uid()
      and username is not null
      and upper(member_number) <> upper(trim(p_member_number))
  ) then
    raise exception 'Member number cannot be changed after profile setup';
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

create or replace function public.update_member_profile(
  p_full_name text,
  p_username text,
  p_phone text
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
    or nullif(trim(p_phone), '') is null then
    raise exception 'Name, username, and WhatsApp number are required';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      username = lower(trim(p_username)),
      phone = trim(p_phone)
  where id = auth.uid()
    and role = 'member'
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Member profile was not found';
  end if;

  return updated_profile;
exception
  when unique_violation then
    raise exception 'That username is already in use';
end;
$$;

grant execute on function public.update_member_profile(text, text, text) to authenticated;

create or replace function public.admin_update_member_profile(
  p_user_id uuid,
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
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      username = lower(trim(p_username)),
      phone = trim(p_phone),
      member_number = upper(trim(p_member_number))
  where id = p_user_id
    and role = 'member'
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Member profile was not found';
  end if;

  update public.transactions
  set member_number = updated_profile.member_number
  where user_id = updated_profile.id;

  update public.loan_payments
  set member_number = updated_profile.member_number
  where user_id = updated_profile.id;

  update public.loans
  set member_number = updated_profile.member_number
  where user_id = updated_profile.id;

  return updated_profile;
exception
  when unique_violation then
    raise exception 'That username or member number is already in use';
end;
$$;

grant execute on function public.admin_update_member_profile(uuid, text, text, text, text) to authenticated;

create or replace function public.admin_delete_member(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'member'
  ) then
    raise exception 'Member was not found';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function public.admin_delete_member(uuid) to authenticated;

create or replace function public.set_member_opening_balance(
  p_user_id uuid,
  p_account_type text,
  p_amount numeric,
  p_effective_date date,
  p_override boolean default false
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles;
  saved_transaction public.transactions;
  existing_opening public.transactions;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_amount is null or p_amount < 0 then
    raise exception 'Opening balance cannot be negative';
  end if;

  if p_account_type not in ('Savings', 'Shares', 'Special Savings') then
    raise exception 'Invalid account type';
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

  select * into existing_opening
  from public.transactions
  where user_id = target_profile.id
    and account_type = p_account_type
    and lower(description) = 'opening balance'
  order by transaction_date asc, created_at asc
  limit 1;

  if existing_opening.id is not null and p_override is false then
    raise exception 'Opening balance already exists for this account. Use the edit flow to update it.';
  end if;

  if existing_opening.id is not null then
    update public.transactions
    set amount = p_amount,
        transaction_date = p_effective_date,
        description = 'Opening balance',
        updated_at = now()
    where id = existing_opening.id;

    update public.savings_accounts
    set balance = p_amount
    where user_id = target_profile.id and account_type = p_account_type;

    select * into saved_transaction
    from public.transactions
    where id = existing_opening.id;

    return saved_transaction;
  end if;

  insert into public.transactions (
    user_id, member_number, account_type, transaction_type, amount,
    description, transaction_date, created_by
  )
  values (
    target_profile.id, target_profile.member_number, p_account_type,
    'Credit', p_amount, 'Opening balance', p_effective_date, auth.uid()
  )
  returning * into saved_transaction;

  update public.savings_accounts
  set balance = p_amount
  where user_id = target_profile.id and account_type = p_account_type;

  return saved_transaction;
end;
$$;

grant execute on function public.set_member_opening_balance(uuid, text, numeric, date, boolean) to authenticated;

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
