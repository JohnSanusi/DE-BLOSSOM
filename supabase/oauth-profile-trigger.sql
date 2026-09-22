-- Run this after schema.sql in the Supabase SQL Editor.
-- It creates a member profile automatically for new email/password and OAuth users.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  generated_member_number text;
begin
  generated_member_number := 'COOP-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));

  insert into public.profiles (id, full_name, email, member_number, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'member'), '@', 1)
    ),
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'member_number', ''), generated_member_number),
    'member'
  )
  on conflict (id) do nothing;

  update public.profiles
  set username = nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
      phone = nullif(new.raw_user_meta_data ->> 'phone', '')
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();