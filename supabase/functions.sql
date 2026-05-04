-- Helper RPC functions used by lib/tokens.ts
-- Run this in the Supabase SQL Editor after schema.sql

-- Atomically deducts tokens; returns true on success, false if balance too low.
create or replace function deduct_tokens(p_user_id uuid, p_amount integer)
returns boolean
language plpgsql
security definer
as $$
declare
  v_balance integer;
begin
  select balance into v_balance
  from user_tokens
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    return false;
  end if;

  update user_tokens
  set balance = balance - p_amount,
      used    = used    + p_amount
  where user_id = p_user_id;

  return true;
end;
$$;

-- Creates a starter user_tokens row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_tokens (user_id, plan, balance, used, is_admin)
  values (new.id, 'starter', 0, 0, false);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Adjusts balance by a positive or negative delta.
create or replace function adjust_balance(p_user_id uuid, p_delta integer)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_tokens (user_id, balance, used)
  values (p_user_id, greatest(0, p_delta), 0)
  on conflict (user_id) do update
    set balance = greatest(0, user_tokens.balance + p_delta);
end;
$$;
